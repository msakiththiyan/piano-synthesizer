import { useState } from 'react';
import Piano from '../components/Piano.jsx';
import * as synth from '../lib/synth.js';
import { useMidiInput } from '../lib/useMidiInput.js';
import { levelConfig } from '../lib/levels.js';

export default function FreePlay({ level }) {
  const [activeNotes, setActiveNotes] = useState(new Set());

  const handleNoteOn = (midi, velocity = 0.8) => {
    synth.noteOn(midi, velocity);
    setActiveNotes((prev) => new Set(prev).add(midi));
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

  return (
    <div>
      <h2>Free play</h2>
      {midiDevice
        ? <p className="midi-badge">🎹 MIDI keyboard connected: {midiDevice}</p>
        : <p className="muted">No MIDI keyboard detected — play with your mouse or computer keyboard. Plug one in any time and it just works.</p>}
      <Piano
        activeNotes={activeNotes}
        onNoteOn={handleNoteOn}
        onNoteOff={handleNoteOff}
        showLabels={levelConfig(level).keyLabels}
      />
    </div>
  );
}
