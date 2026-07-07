import { useEffect, useState } from 'react';
import { LEVELS } from '../lib/levels.js';

export default function Progress() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/progress').then((r) => r.json()).then(setData);
  }, []);

  if (!data) return <p className="muted">Loading…</p>;

  const { totals, sessions } = data;

  return (
    <div>
      <h2>Progress</h2>
      <div className="stats-row">
        <div className="stat"><b>{totals.sessions}</b><span>sessions</span></div>
        <div className="stat"><b>{totals.completed}</b><span>completed</span></div>
        <div className="stat"><b>{totals.avgAccuracy}%</b><span>avg accuracy</span></div>
      </div>

      <h3>Recent sessions</h3>
      {sessions.length === 0 && <p className="muted">Nothing yet — practice a song and it shows up here.</p>}
      {sessions.map((s) => (
        <div className="card" key={s.id}>
          <div className="card-main">
            <div className="card-title">{s.title}</div>
            <div className="card-sub">
              {s.created_at} · ✓ {s.correct} · ✗ {s.wrong}
              {s.level && LEVELS[s.level] && <> · {LEVELS[s.level].emoji} {LEVELS[s.level].name}</>}
            </div>
          </div>
          <div className={'accuracy acc-' + (s.accuracy >= 90 ? 'good' : s.accuracy >= 70 ? 'ok' : 'low')}>
            {s.accuracy}%
          </div>
        </div>
      ))}
    </div>
  );
}
