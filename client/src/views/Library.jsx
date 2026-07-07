import { useRef, useState } from 'react';
import { levelConfig } from '../lib/levels.js';

const DIFF = { 1: 'Beginner', 2: 'Intermediate', 3: 'Advanced' };

export default function Library({ songs, level, onRefresh, onPractice }) {
  const cfg = levelConfig(level);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileRef = useRef();
  const titleRef = useRef();
  const artistRef = useRef();

  const upload = async (e) => {
    e.preventDefault();
    const file = fileRef.current.files[0];
    if (!file) return setError('Pick a .mid file first.');
    setUploading(true);
    setError(null);
    const form = new FormData();
    form.append('midi', file);
    form.append('title', titleRef.current.value);
    form.append('artist', artistRef.current.value);
    try {
      const res = await fetch('/api/songs', { method: 'POST', body: form });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Upload failed');
      fileRef.current.value = '';
      titleRef.current.value = '';
      artistRef.current.value = '';
      onRefresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete this song and its practice history?')) return;
    await fetch(`/api/songs/${id}`, { method: 'DELETE' });
    onRefresh();
  };

  const exercises = songs.filter((s) => s.source === 'builtin');
  const uploads = songs.filter((s) => s.source === 'upload');
  const recommended = songs.filter((s) => cfg.recommend.includes(s.difficulty));

  const card = (s) => (
    <div className="card" key={s.id}>
      <div className="card-main">
        <div className="card-title">{s.title}</div>
        <div className="card-sub">
          {s.artist && <span>{s.artist} · </span>}
          <span className={'diff diff-' + s.difficulty}>{DIFF[s.difficulty]}</span>
          {' · '}{Math.round(s.duration)}s
          {s.plays > 0 && <> · played {s.plays}× · best <b>{s.bestAccuracy}%</b></>}
        </div>
      </div>
      <div className="card-actions">
        <button className="btn primary" onClick={() => onPractice(s.id)}>Practice</button>
        {s.source === 'upload' && (
          <button className="btn danger" onClick={() => remove(s.id)}>Delete</button>
        )}
      </div>
    </div>
  );

  return (
    <div>
      {recommended.length > 0 && (
        <section>
          <h2>{cfg.emoji} Recommended for you ({cfg.name.toLowerCase()})</h2>
          {recommended.map(card)}
        </section>
      )}

      <section>
        <h2>Add a song</h2>
        <p className="muted">
          Upload a MIDI file (.mid). Free MIDI files for most songs, anime OSTs and film music are
          easy to find online — search "<i>song name</i> midi".
        </p>
        <form className="upload-form" onSubmit={upload}>
          <input ref={fileRef} type="file" accept=".mid,.midi" />
          <input ref={titleRef} type="text" placeholder="Title (optional)" />
          <input ref={artistRef} type="text" placeholder="Artist (optional)" />
          <button className="btn primary" disabled={uploading}>
            {uploading ? 'Uploading…' : 'Add song'}
          </button>
        </form>
        {error && <p className="error">{error}</p>}
      </section>

      <section>
        <h2>Exercises</h2>
        {exercises.map(card)}
      </section>

      <section>
        <h2>My songs</h2>
        {uploads.length === 0 && <p className="muted">No songs yet — upload a MIDI file above.</p>}
        {uploads.map(card)}
      </section>
    </div>
  );
}
