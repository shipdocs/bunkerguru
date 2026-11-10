// Simulated seconds per real second. 3× is the pace of the 2D game (TIME = 3);
// 6× matches its fast-forward (T). Traffic, pumping, tide and deadlines all follow.
export const DEFAULT_TEMPO = 3;
export const TEMPOS = Object.freeze([1, 2, 3, 6, 12]);
// T steps through the fast-forward speeds and back to the 2D pace.
export const nextWarp = (value) => (value === 3 ? 6 : value === 6 ? 12 : 3);
export const timeScaleOf = (s) => (TEMPOS.includes(s.timeScale) ? s.timeScale : DEFAULT_TEMPO);
export const nextTempo = (value) => TEMPOS[(TEMPOS.indexOf(value) + 1) % TEMPOS.length];
export const tempoLabel = (value) =>
  `Vaartempo ${value}× · ${value === 1 ? 'rustig' : value === 2 ? 'kalm' : value === 3 ? 'zoals 2D' : value === 6 ? 'snelvaart' : 'dubbele snelvaart'}`;
