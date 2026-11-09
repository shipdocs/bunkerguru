// Leaderboard per harbour, as in the 2D game (engine.js updateRank): the five best
// shifts on this map in this browser. A shift is one stay in a harbour within one
// career: it starts when you arrive (or start a new career) and collects the score of
// every job you finish there. Pure functions; storage.mjs keeps the lists.
export const RANK_SIZE = 5;
// Score of one job, engine.js logic(): 1000 + time − 10 per point of damage + VTS.
// The 2D game counted 3 points per second under five minutes; here every second you
// are ahead of the ETA counts 3, up to the same 900.
export function jobScore({ onTime, late = 0, damage = 0, vts = 0 }) {
  const time = onTime ? Math.min(900, Math.round(Math.max(0, -late) * 3)) : 0;
  return Math.max(0, 1000 + time - Math.round(damage) * 10) + (vts || 0);
}
export const newShift = (mapId, now = Date.now()) => ({ id: now, mapId, score: 0, jobs: 0 });
// The running shift of this state on this map; a new one after a change of harbour.
export function shiftOf(s, mapId, now = Date.now()) {
  if (!s.shift || s.shift.mapId !== mapId) s.shift = newShift(mapId, now);
  return s.shift;
}
export function addJob(s, mapId, score, now = Date.now()) {
  const sh = shiftOf(s, mapId, now);
  sh.score += score;
  sh.jobs++;
  return sh;
}
// The list with this shift in it (replacing its earlier entry), best first, top five.
export function ranked(list, shift, date) {
  const clean = (Array.isArray(list) ? list : []).filter(
    (e) => e && Number.isFinite(e.score) && e.id !== shift.id,
  );
  return [...clean, { id: shift.id, score: shift.score, jobs: shift.jobs, date }]
    .sort((a, b) => b.score - a.score)
    .slice(0, RANK_SIZE);
}
