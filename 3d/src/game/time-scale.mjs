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
// the normal pace, in a wider arc.
export const warpHelm = (s) => Math.min(1, DEFAULT_TEMPO / timeScaleOf(s));
// It drops back to the normal pace only where it matters: underway right up against the
// bank (CLOSE metres of water left), or coming in to the terminal or seagoing ship of the
// job (ARRIVE metres). Only on getting there: press T again and it stays on. Moored
// (loading, bunkering, resting) it stays on. near = { bank: metres of water to the bank
// is under CLOSE, target: metres to the job's terminal or ship, goal: that terminal or ship };
// memo keeps the last frame's state: a new destination counts as not reached yet.
// Returns why it should stop, or null.
export const WARP_CLOSE = 25,
  WARP_ARRIVE = 600;
export function warpBrake(s, near, memo = {}) {
  const fast = Math.hypot(s.u || 0, s.v || 0) > 1.5,
    bank = !!near.bank && fast,
    arrive = (near.target ?? Infinity) < WARP_ARRIVE,
    same = memo.goal === near.goal,
    was = { bank: memo.bank, arrive: same && memo.arrive };
  memo.bank = bank;
  memo.arrive = arrive && !s.moored; // casting off counts as setting out afresh
  memo.goal = near.goal;
  if (timeScaleOf(s) <= DEFAULT_TEMPO || s.moored) return null;
  if (arrive && !was.arrive) return '⏩ Snelvaart uit: je nadert je bestemming (T = weer aan)';
  if (bank && !was.bank) return '⏩ Snelvaart uit: vlak bij de kant (T = weer aan)';
  return null;
}
export const nextTempo = (value) => TEMPOS[(TEMPOS.indexOf(value) + 1) % TEMPOS.length];
export const tempoLabel = (value) =>
  `Vaartempo ${value}× · ${value === 1 ? 'rustig' : value === 2 ? 'kalm' : value === 3 ? 'zoals 2D' : value === 6 ? 'snelvaart' : 'dubbele snelvaart'}`;
