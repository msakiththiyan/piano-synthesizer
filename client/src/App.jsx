import { useCallback, useEffect, useState } from 'react';
import Library from './views/Library.jsx';
import Practice from './views/Practice.jsx';
import Progress from './views/Progress.jsx';
import FreePlay from './views/FreePlay.jsx';
import LevelPicker from './views/LevelPicker.jsx';
import { LEVELS } from './lib/levels.js';

export default function App() {
  const [view, setView] = useState('library'); // library | practice | progress | freeplay | level
  const [songId, setSongId] = useState(null);
  const [songs, setSongs] = useState([]);
  const [level, setLevel] = useState(undefined); // undefined = loading, null = not chosen yet

  const refresh = useCallback(() => {
    fetch('/api/songs').then((r) => r.json()).then(setSongs);
  }, []);

  useEffect(() => {
    refresh();
    fetch('/api/profile').then((r) => r.json()).then((p) => setLevel(p.skillLevel));
  }, [refresh]);

  const practice = (id) => {
    setSongId(id);
    setView('practice');
  };

  if (level === undefined) return null;

  // first launch: must pick a level before anything else
  const needsPick = level === null;
  const showingPicker = needsPick || view === 'level';

  return (
    <div className="app">
      <header>
        <div className="fallboard">
          <h1>Piano Tutor</h1>
          {!needsPick && (
            <nav>
              <button className={view === 'library' ? 'on' : ''} onClick={() => { refresh(); setView('library'); }}>Library</button>
              <button className={view === 'freeplay' ? 'on' : ''} onClick={() => setView('freeplay')}>Free play</button>
              <button className={view === 'progress' ? 'on' : ''} onClick={() => setView('progress')}>Progress</button>
              <button className={'level-chip' + (view === 'level' ? ' on' : '')} onClick={() => setView('level')}>
                {LEVELS[level].name}
              </button>
            </nav>
          )}
        </div>
        <div className="felt-rail" aria-hidden="true" />
      </header>
      <main>
        {showingPicker && (
          <LevelPicker
            current={level}
            onSelect={(id) => { setLevel(id); setView('library'); }}
          />
        )}
        {!showingPicker && view === 'library' && (
          <Library songs={songs} level={level} onRefresh={refresh} onPractice={practice} />
        )}
        {!showingPicker && view === 'practice' && (
          <Practice songId={songId} level={level} onBack={() => { refresh(); setView('library'); }} />
        )}
        {!showingPicker && view === 'progress' && <Progress />}
        {!showingPicker && view === 'freeplay' && <FreePlay level={level} />}
      </main>
    </div>
  );
}
