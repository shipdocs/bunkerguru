import { FEEL } from './sim-vessel.mjs';
import { profileOf } from './ship-profile.mjs';
// Player settings for the feel of the water (start screen buttons), saved with the career.
// Traagheid: how long the hull takes to gather way and to lose it, in game time (so the
// tempo button speeds it up like everything else). The forces and the top speed stay
// those of engine.js; only the pace towards them changes (FEEL / k).
//   echt: like a real tanker, full ahead from rest to full speed in about 1 minute
//         empty and 4 minutes laden; less throttle takes longer still.
//   half: half those times. licht: the quick 3D feel from before (about 17 s).
export const INERTIA = Object.freeze([
  { id: 'licht', scale: 0 },
  { id: 'half', scale: 0.5 },
  { id: 'echt', scale: 1 },
]);
export const DEFAULT_INERTIA = 'echt';
// k for a real tanker: calibrated on full ahead from rest to 95 % of top speed,
// 60 s (k 10) empty and 240 s (k 39) laden, linear in between (tests/feel.test.mjs).
export const REAL_K = { empty: 10, laden: 39 };
const loadOf = (s) =>
  Math.max(0, Math.min(1, (s.cargo || 0) / Math.max(1, s.target || profileOf(s).tankCapacity)));
export const inertiaK = (s) =>
  Math.max(1, inertiaOf(s).scale * (REAL_K.empty + (REAL_K.laden - REAL_K.empty) * loadOf(s)));
// Stroom: the river current and the eddies before the harbour mouths, together.
export const CURRENTS = Object.freeze([
  { id: 'zwak', k: 0.5 },
  { id: 'normaal', k: 1 },
  { id: 'sterk', k: 1.5 },
]);
export const DEFAULT_CURRENT = 'normaal';
const pick = (list, id, fallback) =>
  list.find((o) => o.id === id) || list.find((o) => o.id === fallback);
export const inertiaOf = (s) => pick(INERTIA, s.inertia, DEFAULT_INERTIA);
export const currentOf = (s) => pick(CURRENTS, s.currentFeel, DEFAULT_CURRENT);
export const feelOf = (s) => {
  const k = inertiaK(s);
  // Losing way is slowed less than gathering it (√k): the engine.js water drag is
  // light, and with the full factor a heavy hull would coast on for kilometres.
  return { up: FEEL.up / k, down: FEEL.down / Math.sqrt(k) };
};
const next = (list, o) => list[(list.indexOf(o) + 1) % list.length].id;
export const nextInertia = (s) => next(INERTIA, inertiaOf(s));
export const nextCurrent = (s) => next(CURRENTS, currentOf(s));
export const inertiaLabel = (s) => 'Traagheid: ' + inertiaOf(s).id;
export const currentLabel = (s) => 'Stroom: ' + currentOf(s).id;
