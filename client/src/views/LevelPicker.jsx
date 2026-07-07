import { useState } from 'react';
import { LEVELS } from '../lib/levels.js';

export default function LevelPicker({ current, onSelect }) {
  const [saving, setSaving] = useState(false);

  const pick = async (id) => {
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skillLevel: id }),
      });
      if (res.ok) onSelect(id);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2>{current ? 'Change your level' : 'Welcome! How would you describe yourself?'}</h2>
      <p className="muted">This tunes hints, playback speed and recommendations. Change it any time.</p>
      <div className="level-cards">
        {Object.entries(LEVELS).map(([id, l]) => (
          <button
            key={id}
            className={'level-card' + (current === id ? ' selected' : '')}
            disabled={saving}
            onClick={() => pick(id)}
          >
            <div className="level-emoji">{l.emoji}</div>
            <div className="level-name">{l.name}</div>
            <div className="level-desc">{l.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
