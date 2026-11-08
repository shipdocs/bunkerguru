export const DEFAULT_TEMPO = 2;
export const TEMPOS = Object.freeze([1, 2, 3]);
export const timeScaleOf = (s) => (TEMPOS.includes(s.timeScale) ? s.timeScale : DEFAULT_TEMPO);
export const nextTempo = (value) => TEMPOS[(TEMPOS.indexOf(value) + 1) % TEMPOS.length];
export const tempoLabel = (value) =>
  `Vaartempo ${value}× · ${value === 1 ? 'rustig' : value === 2 ? 'spelen' : 'snel'}`;
