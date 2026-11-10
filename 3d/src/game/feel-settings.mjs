import { FEEL } from './sim-vessel.mjs';
// Player settings for the feel of the water (start screen buttons), saved with the career.
// Traagheid: how long the hull takes to gather way and to lose it. The forces and the
// top speed stay those of engine.js; only the pace towards them changes (FEEL / k).
// licht = the 3D feel so far (quick, like a light boat).
export const INERTIA = Object.freeze([
  { id: 'licht', k: 1 },
  { id: 'normaal', k: 6 },
  { id: 'zwaar', k: 15 },
  { id: 'echt', k: 30 },
]);
// Measured at tempo 3× (real seconds), full ahead from rest / STOP from full speed:
// licht 25 km/u in 5 s, runs out 125 m; normaal 10 s, 270 m; zwaar 20 s, 400 m;
// echt (a laden tanker) 35 s, 560 m. AFSTOPPEN (astern) stops in 60–200 m.
export const DEFAULT_INERTIA = 'normaal';
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
  const k = inertiaOf(s).k;
  // Losing way is slowed less than gathering it (√k): the engine.js water drag is
  // light, and with the full factor a heavy hull would coast on for kilometres.
  return { up: FEEL.up / k, down: FEEL.down / Math.sqrt(k) };
};
const next = (list, o) => list[(list.indexOf(o) + 1) % list.length].id;
export const nextInertia = (s) => next(INERTIA, inertiaOf(s));
export const nextCurrent = (s) => next(CURRENTS, currentOf(s));
export const inertiaLabel = (s) => 'Traagheid: ' + inertiaOf(s).id;
export const currentLabel = (s) => 'Stroom: ' + currentOf(s).id;
