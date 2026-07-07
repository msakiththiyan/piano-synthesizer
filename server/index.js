import express from 'express';
import multer from 'multer';
import tonejsMidi from '@tonejs/midi';
const { Midi } = tonejsMidi;
import db from './db.js';

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

app.use(express.json());

const songSummary = (row) => ({
  id: row.id,
  title: row.title,
  artist: row.artist,
  source: row.source,
  difficulty: row.difficulty,
  duration: row.duration,
  createdAt: row.created_at,
});

app.get('/api/songs', (req, res) => {
  const rows = db.prepare('SELECT * FROM songs ORDER BY source DESC, created_at DESC').all();
  const best = db.prepare(
    `SELECT song_id, MAX(accuracy) AS best, COUNT(*) AS plays FROM sessions GROUP BY song_id`
  ).all();
  const statsBySong = Object.fromEntries(best.map((b) => [b.song_id, b]));
  res.json(rows.map((r) => ({
    ...songSummary(r),
    bestAccuracy: statsBySong[r.id]?.best ?? null,
    plays: statsBySong[r.id]?.plays ?? 0,
  })));
});

app.get('/api/songs/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM songs WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Song not found' });
  res.json({ ...songSummary(row), notes: JSON.parse(row.notes_json) });
});

app.post('/api/songs', upload.single('midi'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No MIDI file uploaded' });
  let midi;
  try {
    midi = new Midi(req.file.buffer);
  } catch {
    return res.status(400).json({ error: 'Could not parse file — is it a valid .mid file?' });
  }

  const notes = midi.tracks
    .flatMap((t) => t.notes)
    .map((n) => ({ midi: n.midi, name: n.name, time: n.time, duration: n.duration }))
    .sort((a, b) => a.time - b.time || a.midi - b.midi);

  if (notes.length === 0) return res.status(400).json({ error: 'MIDI file contains no notes' });

  const title = req.body.title?.trim() || midi.name || req.file.originalname.replace(/\.midi?$/i, '');
  const artist = req.body.artist?.trim() || '';
  // rough difficulty: notes per second
  const density = notes.length / Math.max(midi.duration, 1);
  const difficulty = density < 2 ? 1 : density < 5 ? 2 : 3;

  const info = db.prepare(
    `INSERT INTO songs (title, artist, source, difficulty, notes_json, duration)
     VALUES (?, ?, 'upload', ?, ?, ?)`
  ).run(title, artist, difficulty, JSON.stringify(notes), midi.duration);

  const row = db.prepare('SELECT * FROM songs WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(songSummary(row));
});

app.delete('/api/songs/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM songs WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Song not found' });
  if (row.source === 'builtin') return res.status(400).json({ error: 'Built-in exercises cannot be deleted' });
  db.prepare('DELETE FROM sessions WHERE song_id = ?').run(row.id);
  db.prepare('DELETE FROM songs WHERE id = ?').run(row.id);
  res.json({ ok: true });
});

app.post('/api/sessions', (req, res) => {
  const { songId, correct, wrong, completed } = req.body;
  const song = db.prepare('SELECT id FROM songs WHERE id = ?').get(songId);
  if (!song) return res.status(404).json({ error: 'Song not found' });
  const total = correct + wrong;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  db.prepare(
    'INSERT INTO sessions (song_id, correct, wrong, accuracy, completed) VALUES (?, ?, ?, ?, ?)'
  ).run(songId, correct, wrong, accuracy, completed ? 1 : 0);
  res.status(201).json({ accuracy });
});

app.get('/api/progress', (req, res) => {
  const sessions = db.prepare(
    `SELECT s.*, songs.title FROM sessions s
     JOIN songs ON songs.id = s.song_id
     ORDER BY s.created_at DESC LIMIT 50`
  ).all();
  const totals = db.prepare(
    `SELECT COUNT(*) AS sessions, COALESCE(SUM(completed), 0) AS completed,
            COALESCE(ROUND(AVG(accuracy)), 0) AS avgAccuracy
     FROM sessions`
  ).get();
  res.json({ totals, sessions });
});

const PORT = 3001;
app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
