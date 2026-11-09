// Your own fleet (fase 4, advice G): from Havenbaas on you buy extra bunker boats.
// They sail with the rival AI (route planning, traffic, collisions) but work for you:
// you hand them jobs from the planning, they load, sail and bunker, and the pay
// (minus the crew's share) lands in your cash box. Idle too long, they pick a job
// themselves. It turns the game into a company, like Railroad Tycoon.
import { MAP, customers, waterAt } from '../maps/index.mjs';
import { rivalStartJob } from './rivals.mjs';
import { rankIndex, RANKS, addNews } from './career.mjs';
import { logicTime } from './harbor.mjs';

const SIM = 3;
export const FLEET_DEFS = [
  { name: 'Bunkerguru II', color: '#e67e22', spd: 5.8, rank: 4, cost: 3000 },
  { name: 'Bunkerguru III', color: '#f1c40f', spd: 5.8, rank: 5, cost: 5000 },
];
export const CREW_SHARE = 0.3; // the skipper and crew keep 30% of each job
export const AUTO_AFTER = 180; // logic seconds idle before a boat picks its own job

// How many boats your rank allows, and what the next one costs.
export const fleetSlots = (s) => FLEET_DEFS.filter((d) => rankIndex(s.xp) >= d.rank).length;
export function nextBoat(s) {
  const n = (s.fleet || []).length;
  const d = FLEET_DEFS[n];
  if (!d) return { ok: false, reason: 'Je vloot is compleet.' };
  if (rankIndex(s.xp) < d.rank)
    return { ok: false, def: d, reason: 'Vanaf rang ' + RANKS[d.rank].name + '.' };
  if (s.gold < d.cost) return { ok: false, def: d, reason: 'Te weinig goud: ' + d.cost + ' 🪙.' };
  return { ok: true, def: d };
}

function boat(def, sv = {}, at = MAP.start) {
  const ok = Number.isFinite(sv.x) && waterAt(sv.x, sv.z, 6);
  return {
    name: def.name,
    color: def.color,
    spd: def.spd,
    own: true,
    length: 110,
    beam: 11,
    x: ok ? sv.x : at.x,
    z: ok ? sv.z : at.z,
    h: ok && Number.isFinite(sv.h) ? sv.h : at.h,
    cur: 0,
    gold: 0,
    jobs: sv.jobs ?? 0,
    earned: sv.earned ?? 0,
    damage: 0,
    mode: 'idle',
    path: [],
    wait: 0,
    idleT: 0,
    target: null,
    term: null,
    job: null,
    racing: false,
    stuckT: 0,
    hitCD: 0,
  };
}
// Saved boats come back on every map; their position only on the map they were on.
export function createFleet(saved = [], mapId = MAP.id, savedMap = MAP.id) {
  if (MAP.id === 'training') return [];
  // On another map the boats come in on the fairway, one after the other.
  const RH = MAP.riverHalf,
    dir = MAP.start.x > 0 ? -1 : 1;
  return saved.slice(0, FLEET_DEFS.length).map((sv, i) => {
    const at = { x: MAP.start.x + (i + 1) * 350 * dir, z: -RH * 0.45, h: -Math.PI / 2 };
    return boat(
      FLEET_DEFS[i],
      savedMap === mapId ? sv : {},
      waterAt(at.x, at.z, 20) ? at : MAP.start,
    );
  });
}
export const saveFleet = (rivals) =>
  rivals
    .filter((r) => r.own)
    .map((r) => ({ jobs: r.jobs, earned: Math.round(r.earned || 0), x: r.x, z: r.z, h: r.h }));
export const fleetOf = (world) => world.rivals.filter((r) => r.own);
// Remove all own boats (new career), in place: the renderer holds the same array.
export function clearFleet(world) {
  for (let i = world.rivals.length - 1; i >= 0; i--)
    if (world.rivals[i].own) world.rivals.splice(i, 1);
}

// A free spot on the fairway for a new boat: on water, clear of every other vessel.
export function launchSpot(s, world) {
  const RH = MAP.riverHalf,
    others = [s, ...world.rivals, ...world.traffic];
  for (const dx of [0, 300, -300, 600, -600, 900, -900, 1200, -1200])
    for (const z of [RH * 0.45, -RH * 0.45]) {
      const x = Math.max(-MAP.halfWidth + 200, Math.min(MAP.halfWidth - 200, s.x + dx));
      if (!waterAt(x, z, 20)) continue;
      if (others.some((o) => Math.hypot(o.x - x, o.z - z) < 170)) continue;
      return { x, z, h: z > 0 ? Math.PI / 2 : -Math.PI / 2 };
    }
  return MAP.start;
}
export function buyBoat(s, world) {
  if (MAP.id === 'training') return 'In de Oefenhaven koop je geen schepen.';
  const n = nextBoat(s);
  if (!n.ok) return n.reason;
  s.gold -= n.def.cost;
  s.fleet = [...(s.fleet || []), { jobs: 0, earned: 0 }];
  world.rivals.push(boat(n.def, {}, launchSpot(s, world)));
  addNews(s, 'fleet', 'Bunkerguru breidt uit: de ' + n.def.name + ' vaart voor het eerst uit');
  return '🚢 ' + n.def.name + ' gekocht! Geef haar een klus in de planning.';
}

// Hand an offer from the planning to an idle boat of your own.
export function dispatch(s, world, boatName, offerId) {
  const b = fleetOf(world).find((r) => r.name === boatName && r.mode === 'idle');
  const o = s.offers.find((x) => x.id === offerId && !x.taken);
  if (!b || !o || customers[o.berth]?.gate) return false;
  s.offers = s.offers.filter((x) => x !== o);
  b.job = { ...o };
  b.idleT = 0;
  rivalStartJob(b, o.berth, world.rivals);
  return true;
}
export const idleBoats = (world) => fleetOf(world).filter((r) => r.mode === 'idle');
// The job an idle skipper picks himself: the best pay that is not behind a gate and
// not the ship you are heading for.
function ownPick(s, world) {
  const busy = new Set(world.rivals.map((r) => r.target).concat(s.job?.berth));
  return s.offers
    .filter((o) => !o.taken && !customers[o.berth]?.gate && !busy.has(o.berth))
    .sort((a, b) => b.pay - a.pay)[0];
}

// Once per logic step: pay finished jobs, note losses, let idle boats pick work.
export function fleetTick(s, world, dt, fx = {}) {
  for (const b of fleetOf(world)) {
    if (b.finished) {
      b.finished = false;
      const j = b.job;
      b.job = null;
      if (!j) continue;
      const late = j.deadline && logicTime(s) > j.deadline;
      const net = Math.round(j.pay * (late ? 0.5 : 1) * (1 - CREW_SHARE));
      s.gold += net;
      s.earned = (s.earned || 0) + net;
      b.earned = (b.earned || 0) + net;
      const name = customers[j.berth]?.name || 'een zeeschip';
      fx.say?.('🚢 ' + b.name + ' heeft ' + name + ' gebunkerd: +' + net + ' 🪙', 4);
      fx.sound?.('coin');
      addNews(
        s,
        'fleet',
        b.name + (late ? ' te laat bij ' : ' bunkert ') + name + (late ? ' – klant morrend' : ''),
      );
      continue;
    }
    if (b.mode === 'sunk' && b.job) {
      addNews(
        s,
        'sunk',
        b.name + ' gezonken – lading voor ' + (customers[b.job.berth]?.name || '?') + ' verloren',
      );
      fx.say?.('🫧 Je ' + b.name + ' is gezonken! De klus is verloren.', 5);
      b.job = null;
    }
    if (b.mode !== 'idle') continue;
    b.idleT = (b.idleT || 0) + dt;
    if (b.idleT >= AUTO_AFTER) {
      b.idleT = 0;
      const o = ownPick(s, world);
      if (o) {
        dispatch(s, world, b.name, o.id);
        fx.say?.('🚢 ' + b.name + ' pakt zelf de klus naar ' + customers[o.berth].name, 4);
      }
    }
  }
}
export { SIM };
