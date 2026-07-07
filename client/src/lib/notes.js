export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const noteName = (midi) => NOTE_NAMES[midi % 12] + (Math.floor(midi / 12) - 1);

export const isBlack = (midi) => [1, 3, 6, 8, 10].includes(midi % 12);

// Computer keyboard → semitone offset from the current base octave's C
export const KEYMAP = {
  a: 0, w: 1, s: 2, e: 3, d: 4, f: 5, t: 6, g: 7, y: 8, h: 9, u: 10, j: 11,
  k: 12, o: 13, l: 14, p: 15, ';': 16,
};

// Group a flat note list into practice steps: notes sounding at (nearly)
// the same time form one chord step.
export function groupIntoSteps(notes, epsilon = 0.06) {
  const sorted = [...notes].sort((a, b) => a.time - b.time || a.midi - b.midi);
  const steps = [];
  for (const note of sorted) {
    const last = steps[steps.length - 1];
    if (last && note.time - last.time <= epsilon) {
      if (!last.midis.includes(note.midi)) last.midis.push(note.midi);
    } else {
      steps.push({ time: note.time, midis: [note.midi] });
    }
  }
  return steps;
}
