import { useEffect, useRef, useState } from 'react';
import { isBlack, noteName, KEYMAP } from '../lib/notes.js';

const WHITE_W = 38;
const BLACK_W = 24;

// On-screen piano, playable with mouse and computer keyboard
// (A S D F … row = white keys, W E T Y U row = black keys, Z/X shifts octave).
export default function Piano({
  low = 48,           // C3
  high = 84,          // C6
  activeNotes = new Set(),
  highlightNotes = new Set(),
  onNoteOn,
  onNoteOff,
}) {
  const [baseOctaveC, setBaseOctaveC] = useState(60); // C4 for computer keys
  const downKeys = useRef(new Set());
  const handlers = useRef({ onNoteOn, onNoteOff });
  handlers.current = { onNoteOn, onNoteOff };
  const baseRef = useRef(baseOctaveC);
  baseRef.current = baseOctaveC;

  useEffect(() => {
    const keydown = (e) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const k = e.key.toLowerCase();
      if (k === 'z') return setBaseOctaveC((b) => Math.max(b - 12, 24));
      if (k === 'x') return setBaseOctaveC((b) => Math.min(b + 12, 84));
      if (k in KEYMAP && !downKeys.current.has(k)) {
        downKeys.current.add(k);
        handlers.current.onNoteOn(baseRef.current + KEYMAP[k]);
      }
    };
    const keyup = (e) => {
      const k = e.key.toLowerCase();
      if (downKeys.current.delete(k)) handlers.current.onNoteOff(baseRef.current + KEYMAP[k]);
    };
    window.addEventListener('keydown', keydown);
    window.addEventListener('keyup', keyup);
    return () => {
      window.removeEventListener('keydown', keydown);
      window.removeEventListener('keyup', keyup);
    };
  }, []);

  const keys = [];
  for (let m = low; m <= high; m++) keys.push(m);
  const whites = keys.filter((m) => !isBlack(m));

  const whiteIndex = (m) => whites.filter((w) => w < m).length;

  const press = (m) => (e) => {
    e.preventDefault();
    onNoteOn(m);
  };
  const lift = (m) => () => onNoteOff(m);

  return (
    <div className="piano-wrap">
      <div className="piano" style={{ width: whites.length * WHITE_W }}>
        {whites.map((m) => (
          <div
            key={m}
            className={
              'key white' +
              (activeNotes.has(m) ? ' active' : '') +
              (highlightNotes.has(m) ? ' hint' : '')
            }
            style={{ left: whiteIndex(m) * WHITE_W, width: WHITE_W }}
            onMouseDown={press(m)}
            onMouseUp={lift(m)}
            onMouseLeave={lift(m)}
            onTouchStart={press(m)}
            onTouchEnd={lift(m)}
          >
            {m % 12 === 0 && <span className="key-label">{noteName(m)}</span>}
            {m === baseOctaveC && <span className="kb-anchor">⌨</span>}
          </div>
        ))}
        {keys.filter(isBlack).map((m) => (
          <div
            key={m}
            className={
              'key black' +
              (activeNotes.has(m) ? ' active' : '') +
              (highlightNotes.has(m) ? ' hint' : '')
            }
            style={{ left: whiteIndex(m) * WHITE_W - BLACK_W / 2, width: BLACK_W }}
            onMouseDown={press(m)}
            onMouseUp={lift(m)}
            onMouseLeave={lift(m)}
            onTouchStart={press(m)}
            onTouchEnd={lift(m)}
          />
        ))}
      </div>
      <div className="piano-help">
        Keys: <b>A S D F G H J K L</b> = white · <b>W E T Y U O P</b> = black · <b>Z / X</b> = octave down/up
        · ⌨ marks where the computer keyboard starts
      </div>
    </div>
  );
}
