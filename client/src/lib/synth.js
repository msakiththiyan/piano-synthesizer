// Small polyphonic piano-ish synth on Web Audio. No samples, no network.
let ctx = null;
const held = new Map(); // midi -> { gain, oscs }

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

const freq = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

function voice(midi, velocity, when) {
  const ac = getCtx();
  const t = when ?? ac.currentTime;
  const f = freq(midi);

  const gain = ac.createGain();
  const filter = ac.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(Math.min(f * 6, 9000), t);
  filter.Q.value = 0.5;

  const partials = [
    { type: 'triangle', ratio: 1, level: 1.0 },
    { type: 'sine', ratio: 2, level: 0.35 },
    { type: 'sine', ratio: 3, level: 0.12 },
  ];
  const oscs = partials.map((p) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = p.type;
    o.frequency.setValueAtTime(f * p.ratio, t);
    g.gain.value = p.level;
    o.connect(g).connect(filter);
    o.start(t);
    return o;
  });

  const v = 0.25 * velocity;
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(v, t + 0.004);
  // natural piano-like decay while held
  gain.gain.exponentialRampToValueAtTime(Math.max(v * 0.0005, 0.0001), t + 5);

  filter.connect(gain).connect(ac.destination);
  return { gain, oscs, ac };
}

function release(v, when) {
  const t = Math.max(when ?? v.ac.currentTime, v.ac.currentTime);
  v.gain.gain.cancelScheduledValues(t);
  v.gain.gain.setValueAtTime(Math.max(v.gain.gain.value, 0.0001), t);
  v.gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
  v.oscs.forEach((o) => o.stop(t + 0.3));
}

export function noteOn(midi, velocity = 0.8) {
  noteOff(midi);
  held.set(midi, voice(midi, velocity));
}

export function noteOff(midi) {
  const v = held.get(midi);
  if (v) {
    release(v);
    held.delete(midi);
  }
}

// Schedule a note for song playback; returns nothing, cleans itself up.
export function playNote(midi, duration, whenOffset = 0, velocity = 0.7) {
  const ac = getCtx();
  const start = ac.currentTime + whenOffset;
  const v = voice(midi, velocity, start);
  release(v, start + Math.max(duration, 0.1));
}

export function now() {
  return getCtx().currentTime;
}
