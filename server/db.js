import Database from 'better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, 'piano.db'));

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS songs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    artist TEXT DEFAULT '',
    source TEXT NOT NULL DEFAULT 'upload',
    difficulty INTEGER NOT NULL DEFAULT 2,
    notes_json TEXT NOT NULL,
    duration REAL NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    song_id INTEGER NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
    correct INTEGER NOT NULL,
    wrong INTEGER NOT NULL,
    accuracy REAL NOT NULL,
    completed INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

// migration: sessions.level added after first release
const sessionCols = db.prepare('PRAGMA table_info(sessions)').all();
if (!sessionCols.some((c) => c.name === 'level')) {
  db.exec(`ALTER TABLE sessions ADD COLUMN level TEXT NOT NULL DEFAULT ''`);
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const noteName = (midi) => NOTE_NAMES[midi % 12] + (Math.floor(midi / 12) - 1);

function sequence(midis, step = 0.5, dur = 0.45) {
  return midis.map((m, i) => ({ midi: m, name: noteName(m), time: i * step, duration: dur }));
}

function chords(chordList, step = 1.0, dur = 0.9) {
  const notes = [];
  chordList.forEach((chord, i) => {
    chord.forEach((m) => notes.push({ midi: m, name: noteName(m), time: i * step, duration: dur }));
  });
  return notes;
}

function seed() {
  const count = db.prepare('SELECT COUNT(*) AS n FROM songs').get().n;
  if (count > 0) return;

  const C4 = 60;
  const cMajorUpDown = [60, 62, 64, 65, 67, 69, 71, 72, 71, 69, 67, 65, 64, 62, 60];
  const gMajorUpDown = [67, 69, 71, 72, 74, 76, 78, 79, 78, 76, 74, 72, 71, 69, 67];
  const aMinorUpDown = [57, 59, 60, 62, 64, 65, 68, 69, 68, 65, 64, 62, 60, 59, 57];

  // I–IV–V–I in C: C, F, G, C triads
  const basicChords = [
    [60, 64, 67], [65, 69, 72], [67, 71, 74], [60, 64, 67],
  ];

  // Ode to Joy, first two phrases, in C major
  const odeToJoy = [
    64, 64, 65, 67, 67, 65, 64, 62, 60, 60, 62, 64, 64, 62, 62,
    64, 64, 65, 67, 67, 65, 64, 62, 60, 60, 62, 64, 62, 60, 60,
  ];

  const insert = db.prepare(
    `INSERT INTO songs (title, artist, source, difficulty, notes_json, duration)
     VALUES (?, ?, 'builtin', ?, ?, ?)`
  );
  const add = (title, artist, difficulty, notes) => {
    const duration = Math.max(...notes.map((n) => n.time + n.duration));
    insert.run(title, artist, difficulty, JSON.stringify(notes), duration);
  };

  add('C Major Scale (up & down)', 'Exercise', 1, sequence(cMajorUpDown));
  add('G Major Scale (up & down)', 'Exercise', 1, sequence(gMajorUpDown));
  add('A Harmonic Minor Scale', 'Exercise', 2, sequence(aMinorUpDown));
  add('Basic Chords: C – F – G – C', 'Exercise', 2, chords(basicChords));
  add('Ode to Joy (melody)', 'Beethoven', 1, sequence(odeToJoy));
}

seed();

export default db;
