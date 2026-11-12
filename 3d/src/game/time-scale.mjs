// Simulated seconds per real second. 3× is the pace of the 2D game (TIME = 3);
// 6× matches its fast-forward (T). Traffic, pumping, tide and deadlines all follow.
export const DEFAULT_TEMPO = 3;
export const TEMPOS = Object.freeze([1, 2, 3, 6, 12]);
// T steps through the fast-forward speeds and back to the 2D pace.
export const nextWarp = (value) => (value === 3 ? 6 : value === 6 ? 12 : 3);
export const timeScaleOf = (s) => (TEMPOS.includes(s.timeScale) ? s.timeScale : DEFAULT_TEMPO);
// Fast-forward is for the straight stretches. The ship's physics runs on game time, so at
// 6× or 12× the swing would come 2 or 4 times as fast in real seconds. So in fast-forward
// the rudder bites less (warpHelm): she turns about as many degrees per real second as at
// the normal pace, in a wider arc. Coming fast near the bank drops it back to the normal
// pace. Moored (loading, bunkering, resting) it stays on. Returns why it should stop, or null.
export const warpHelm = (s) => Math.min(1, DEFAULT_TEMPO / timeScaleOf(s));
export function warpBrake(s, nearShore) {
  if (timeScaleOf(s) <= DEFAULT_TEMPO || s.moored) return null;
  if (nearShore && Math.hypot(s.u || 0, s.v || 0) > 1.5)
    return '⏩ Snelvaart uit: dicht bij de kant (T = weer aan)';
  return null;
}
export const nextTempo = (value) => TEMPOS[(TEMPOS.indexOf(value) + 1) % TEMPOS.length];
export const tempoLabel = (value) =>
  `Vaartempo ${value}× · ${value === 1 ? 'rustig' : value === 2 ? 'kalm' : value === 3 ? 'zoals 2D' : value === 6 ? 'snelvaart' : 'dubbele snelvaart'}`;
