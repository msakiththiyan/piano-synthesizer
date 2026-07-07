# Piano Tutor

Personal piano tutor app — learn, practice and track progress. Built for
relearning piano after a long gap, works for complete beginners too.

## Features

- **Free play** — on-screen piano played with mouse or computer keyboard
  (`A S D F …` = white keys, `W E T Y U …` = black keys, `Z`/`X` shift octave).
  Sound is a built-in Web Audio synth — no samples, no downloads.
- **Song library** — upload any `.mid` file (free MIDI files for Tamil,
  English and anime songs are easy to find online). Notes are parsed and
  stored. Built-in exercises included: scales, chords, Ode to Joy.
- **Practice mode** — step-through: the app highlights the next note/chord on
  the keyboard, waits until you play it, counts mistakes. "Listen" plays the
  song first so you know how it goes.
- **Progress** — every practice run is saved with accuracy; see best scores
  per song and recent sessions.
- **MIDI keyboard support** — plug in any USB-MIDI keyboard and the app picks
  it up automatically (Web MIDI API). Fully usable without one.

## Stack

- Frontend: React + Vite (`client/`)
- Backend: Node + Express (`server/`)
- DB: SQLite via better-sqlite3 (`server/piano.db`, created automatically)
- No environment config needed.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:5173. API runs on port 3001.
