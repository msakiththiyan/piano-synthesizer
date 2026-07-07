import { useCallback, useEffect, useState } from 'react';
import Library from './views/Library.jsx';
import Practice from './views/Practice.jsx';
import Progress from './views/Progress.jsx';
import FreePlay from './views/FreePlay.jsx';

export default function App() {
  const [view, setView] = useState('library'); // library | practice | progress | freeplay
  const [songId, setSongId] = useState(null);
  const [songs, setSongs] = useState([]);

  const refresh = useCallback(() => {
    fetch('/api/songs').then((r) => r.json()).then(setSongs);
  }, []);

  useEffect(refresh, [refresh]);

  const practice = (id) => {
    setSongId(id);
    setView('practice');
  };

  return (
    <div className="app">
      <header>
        <h1>🎹 Piano Tutor</h1>
        <nav>
          <button className={view === 'library' ? 'on' : ''} onClick={() => { refresh(); setView('library'); }}>Library</button>
          <button className={view === 'freeplay' ? 'on' : ''} onClick={() => setView('freeplay')}>Free play</button>
          <button className={view === 'progress' ? 'on' : ''} onClick={() => setView('progress')}>Progress</button>
        </nav>
      </header>
      <main>
        {view === 'library' && <Library songs={songs} onRefresh={refresh} onPractice={practice} />}
        {view === 'practice' && <Practice songId={songId} onBack={() => { refresh(); setView('library'); }} />}
        {view === 'progress' && <Progress />}
        {view === 'freeplay' && <FreePlay />}
      </main>
    </div>
  );
}
