// Simulated seconds per real second. 3× is the pace of the 2D game (TIME = 3);
// 6× matches its fast-forward (T). Traffic, pumping, tide and deadlines all follow.
export const DEFAULT_TEMPO = 3;
export const TEMPOS = Object.freeze([1, 2, 3, 6, 12]);
// T steps through the fast-forward speeds and back to the 2D pace.
export const nextWarp = (value) => (value === 3 ? 6 : value === 6 ? 12 : 3);
export const timeScaleOf = (s) => (TEMPOS.includes(s.timeScale) ? s.timeScale : DEFAULT_TEMPO);
// Fast-forward is for the straight stretches: the ship's physics runs on game time, so at
// 6× or 12× the rudder and the swing come 2 to 4 times as fast in real seconds. The moment
// you steer, or come fast near the bank, it falls back to the normal pace. Moored (loading,
// bunkering, resting) it stays on. Returns why it should stop, or null.
export function warpBrake(s, steering, nearShore) {
  if (timeScaleOf(s) <= DEFAULT_TEMPO || s.moored) return null;
  if (steering) return '⏩ Snelvaart uit: je stuurt (T = weer aan)';
  if (nearShore && Math.hypot(s.u || 0, s.v || 0) > 1.5)
    return '⏩ Snelvaart uit: dicht bij de kant (T = weer aan)';
  return null;
}
export const nextTempo = (value) => TEMPOS[(TEMPOS.indexOf(value) + 1) % TEMPOS.length];
export const tempoLabel = (value) =>
  `Vaartempo ${value}× · ${value === 1 ? 'rustig' : value === 2 ? 'kalm' : value === 3 ? 'zoals 2D' : value === 6 ? 'snelvaart' : 'dubbele snelvaart'}`;
