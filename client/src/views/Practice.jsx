import { useEffect, useMemo, useRef, useState } from 'react';
import Piano from '../components/Piano.jsx';
import * as synth from '../lib/synth.js';
import { groupIntoSteps, noteName } from '../lib/notes.js';
import { useMidiInput } from '../lib/useMidiInput.js';
import { levelConfig } from '../lib/levels.js';

export default function Practice({ songId, level, onBack }) {
  const cfg = levelConfig(level);
  const [song, setSong] = useState(null);
  const [mode, setMode] = useState('idle'); // idle | listen | practice | done
  const [stepIdx, setStepIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [result, setResult] = useState(null);
  const [flash, setFlash] = useState(false);
  const [activeNotes, setActiveNotes] = useState(new Set());
  const [showKeyHints, setShowKeyHints] = useState(cfg.hints === 'full');

  const satisfied = useRef(new Set());
  const playTimers = useRef([]);
  const stateRef = useRef({});

  useEffect(() => {
    fetch(`/api/songs/${songId}`)
      .then((r) => r.json())
      .then(setSong);
    return stopPlayback;
  }, [songId]);

  const steps = useMemo(() => (song ? groupIntoSteps(song.notes) : []), [song]);
  stateRef.current = { mode, stepIdx, steps, correct, wrong };

  function stopPlayback() {
    playTimers.current.forEach(clearTimeout);
    playTimers.current = [];
    setActiveNotes(new Set());
  }

  const listen = () => {
    stopPlayback();
    setMode('listen');
    const rate = cfg.playbackRate; // beginners hear songs slowed down
    const notes = song.notes;
    for (const n of notes) {
      const time = n.time / rate;
      const duration = n.duration / rate;
      synth.playNote(n.midi, duration, time);
      playTimers.current.push(
        setTimeout(() => {
          setActiveNotes((prev) => new Set(prev).add(n.midi));
        }, time * 1000),
        setTimeout(() => {
          setActiveNotes((prev) => {
            const next = new Set(prev);
            next.delete(n.midi);
            return next;
          });
        }, (time + Math.max(duration, 0.15)) * 1000)
      );
    }
    const end = Math.max(...notes.map((n) => (n.time + n.duration) / rate));
    playTimers.current.push(setTimeout(() => setMode('idle'), end * 1000 + 300));
  };

  const startPractice = () => {
    stopPlayback();
    satisfied.current = new Set();
    setStepIdx(0);
    setCorrect(0);
    setWrong(0);
    setResult(null);
    setMode('practice');
  };

  const finish = async (finalCorrect, finalWrong) => {
    setMode('done');
    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ songId, correct: finalCorrect, wrong: finalWrong, completed: true }),
    });
    const body = await res.json();
    setResult(body.accuracy);
  };

  const handleNoteOn = (midi, velocity = 0.8) => {
    synth.noteOn(midi, velocity);
    setActiveNotes((prev) => new Set(prev).add(midi));

    const { mode, stepIdx, steps, correct, wrong } = stateRef.current;
    if (mode !== 'practice') return;
    const expected = steps[stepIdx].midis;

    if (expected.includes(midi) && !satisfied.current.has(midi)) {
      satisfied.current.add(midi);
      const newCorrect = correct + 1;
      setCorrect(newCorrect);
      if (satisfied.current.size === expected.length) {
        satisfied.current = new Set();
        if (stepIdx + 1 >= steps.length) {
          finish(newCorrect, wrong);
        } else {
          setStepIdx(stepIdx + 1);
        }
      }
    } else if (!expected.includes(midi)) {
      setWrong(wrong + 1);
      setFlash(true);
      setTimeout(() => setFlash(false), 250);
    }
  };

  const handleNoteOff = (midi) => {
    synth.noteOff(midi);
    setActiveNotes((prev) => {
      const next = new Set(prev);
      next.delete(midi);
      return next;
    });
  };

  const midiDevice = useMidiInput(handleNoteOn, handleNoteOff);

  if (!song) return <p className="muted">Loading…</p>;

  const currentStep = steps[stepIdx];
  const nextStep = steps[stepIdx + 1];
  const highlight = mode === 'practice' && showKeyHints ? new Set(currentStep.midis) : new Set();
  const pct = steps.length ? Math.round((stepIdx / steps.length) * 100) : 0;

  return (
    <div>
      <button className="btn" onClick={() => { stopPlayback(); onBack(); }}>← Library</button>
      <h2>{song.title}</h2>
      {midiDevice && <p className="midi-badge">🎹 MIDI keyboard connected: {midiDevice}</p>}

      <div className="controls">
        <button className="btn" onClick={listen} disabled={mode === 'listen'}>
          {mode === 'listen' ? 'Playing…' : '▶ Listen'}
        </button>
        {mode === 'listen' && <button className="btn" onClick={() => { stopPlayback(); setMode('idle'); }}>■ Stop</button>}
        <button className="btn primary" onClick={startPractice}>
          {mode === 'practice' ? 'Restart' : 'Start practice'}
        </button>
        <button className="btn" onClick={() => setShowKeyHints((v) => !v)}>
          {showKeyHints ? 'Hide key hints' : 'Show key hints'}
        </button>
        {cfg.playbackRate !== 1 && <span className="muted listen-rate">Listen plays at {Math.round(cfg.playbackRate * 100)}% speed</span>}
      </div>

      {mode === 'practice' && (
        <div className={'practice-hud' + (flash ? ' flash-wrong' : '')}>
          <div className="progress-bar"><div style={{ width: pct + '%' }} /></div>
          <div className="hud-row">
            <div>
              Play: <b className="next-notes">{currentStep.midis.map(noteName).join(' + ')}</b>
              {nextStep && <span className="muted"> then {nextStep.midis.map(noteName).join(' + ')}</span>}
            </div>
            <div>
              ✓ {correct} · ✗ {wrong} · step {stepIdx + 1}/{steps.length}
            </div>
          </div>
        </div>
      )}

      {mode === 'done' && (
        <div className="practice-hud done">
          <b>Finished!</b> Accuracy: <b>{result ?? '…'}%</b> ({correct} correct, {wrong} wrong)
          <button className="btn primary" onClick={startPractice}>Play again</button>
        </div>
      )}

      <Piano
        activeNotes={activeNotes}
        highlightNotes={highlight}
        onNoteOn={handleNoteOn}
        onNoteOff={handleNoteOff}
        showLabels={cfg.keyLabels}
      />
    </div>
  );
}
