// What each skill level changes across the app.
export const LEVELS = {
  beginner: {
    name: 'Beginner',
    emoji: '🌱',
    desc: 'New to piano. Note names shown on every key, slower playback, full step-by-step guidance.',
    recommend: [1],
    playbackRate: 0.75,
    keyLabels: 'all',     // note name on every white key
    hints: 'full',        // highlight next keys + show note names
  },
  relearner: {
    name: 'Re-learner',
    emoji: '🔄',
    desc: 'Played before, coming back after a break. Full hints to rebuild muscle memory, normal speed.',
    recommend: [1, 2],
    playbackRate: 1,
    keyLabels: 'c',       // label only C keys
    hints: 'full',
  },
  intermediate: {
    name: 'Intermediate',
    emoji: '🎯',
    desc: 'Comfortable player. Note names only — key highlights off by default, tougher material first.',
    recommend: [2, 3],
    playbackRate: 1,
    keyLabels: 'c',
    hints: 'minimal',     // no key highlight unless toggled on
  },
};

export const levelConfig = (id) => LEVELS[id] ?? LEVELS.relearner;
