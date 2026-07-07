import { useEffect, useRef, useState } from 'react';

// Connects to any MIDI keyboard if one is plugged in. Optional — the app
// works fully without it.
export function useMidiInput(onNoteOn, onNoteOff) {
  const [deviceName, setDeviceName] = useState(null);
  const handlers = useRef({ onNoteOn, onNoteOff });
  handlers.current = { onNoteOn, onNoteOff };

  useEffect(() => {
    if (!navigator.requestMIDIAccess) return;
    let access;
    let cancelled = false;

    const onMessage = (e) => {
      const [status, note, velocity] = e.data;
      const cmd = status & 0xf0;
      if (cmd === 0x90 && velocity > 0) handlers.current.onNoteOn(note, velocity / 127);
      else if (cmd === 0x80 || (cmd === 0x90 && velocity === 0)) handlers.current.onNoteOff(note);
    };

    const bind = () => {
      let name = null;
      for (const input of access.inputs.values()) {
        input.onmidimessage = onMessage;
        name = input.name;
      }
      setDeviceName(name);
    };

    navigator.requestMIDIAccess().then((a) => {
      if (cancelled) return;
      access = a;
      bind();
      access.onstatechange = bind;
    }).catch(() => {});

    return () => {
      cancelled = true;
      if (access) {
        access.onstatechange = null;
        for (const input of access.inputs.values()) input.onmidimessage = null;
      }
    };
  }, []);

  return deviceName;
}
