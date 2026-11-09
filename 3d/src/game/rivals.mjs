// Rival bunker boats Bunker Bert and Truus Tank (engine.js updateRivals), simplified for
// 3D: they plan a route over water, load at a terminal, sail to a seagoing ship and
// bunker it. They look out ahead and stop for the player, each other and traffic,
// replan when stuck and are towed to the fairway if they stay stuck. All 110 × 11 m.
// Times in simulated seconds (2D values × 3).
import { MAP, terminals, customers, basins, waterRoute, waterAt } from '../maps/index.mjs';
import { hullContacts } from './collisions.mjs';
const SIM = 3;
const RL = 55; // half length (m)
export const RIVAL_DEFS = [
  { name: 'Bunker Bert', color: '#c0392b', spd: 6.0 },
  { name: 'Truus Tank', color: '#8e44ad', spd: 5.6 },
];
const ang = (a) => Math.atan2(Math.sin(a), Math.cos(a));
function clearTo(a, b) {
  const d = Math.hypot(b.x - a.x, b.z - a.z),
    n = Math.max(1, Math.ceil(d / 8));
  for (let i = 1; i <= n; i++)
    if (!waterAt(a.x + ((b.x - a.x) * i) / n, a.z + ((b.z - a.z) * i) / n, 6)) return false;
  return true;
}
export function createRivals(saved = []) {
  if (MAP.id === 'training') return [];
  return RIVAL_DEFS.map((d, i) => {
    const p = MAP.rivals[i] || MAP.start,
      sv = saved[i] || {};
    return {
      ...d,
      length: 110,
      beam: 11,
      x: Number.isFinite(sv.x) && waterAt(sv.x, sv.z, 6) ? sv.x : p.x,
      z: Number.isFinite(sv.z) && waterAt(sv.x, sv.z, 6) ? sv.z : p.z,
      h: Number.isFinite(sv.h) ? sv.h : p.h,
      cur: 0,
      gold: sv.gold ?? 300,
      jobs: sv.jobs ?? 0,
      damage: 0,
      mode: 'idle',
      path: [],
      wait: (2 + i * 4) * SIM,
      target: null,
      term: null,
      racing: false,
      stuckT: 0,
      hitCD: 0,
    };
  });
}
export const saveRivals = (rivals) =>
  rivals.map((r) => ({ gold: Math.round(r.gold), jobs: r.jobs, x: r.x, z: r.z, h: r.h }));

function terminalSpot(r, rivals) {
  const byDist = terminals
    .map((t, i) => i)
    .sort(
      (a, b) =>
        Math.hypot(terminals[a].x - r.x, terminals[a].z - r.z) -
        Math.hypot(terminals[b].x - r.x, terminals[b].z - r.z),
    );
  const len = (t) => (t.alongZ ? t.z1 - t.z0 : t.x1 - t.x0);
  const busy = (i) =>
    rivals.some((o) => o !== r && o.term === i && ['toTerminal', 'loading'].includes(o.mode)) &&
    len(terminals[i]) < 4 * RL + 40;
  const ti = byDist.find((i) => !busy(i)) ?? byDist[0],
    t = terminals[ti];
  const slot = rivals.indexOf(r),
    l = len(t),
    d = l < 4 * RL + 40 ? 0 : (slot - 0.5) * (2 * RL + 20);
  // Lie against the wall: half a beam plus a fender off the quay.
  const off = t.wall ? t.wall * ((t.alongZ ? t.x1 - t.x0 : t.z1 - t.z0) / 2 - 7) : 0;
  return {
    ti,
    x: t.alongZ ? t.x + off : t.x + d,
    z: t.alongZ ? t.z + d : t.z + off,
    h: t.h,
    away: t.alongZ ? { x: -t.wall, z: 0 } : { x: 0, z: -t.wall },
  };
}
function berthSpot(bi) {
  const b = customers[bi];
  return { x: b.x, z: b.z, h: b.h, away: b.h ? { x: 0, z: b.side } : { x: b.side, z: 0 } };
}
function plan(r, spot) {
  // Approach parallel to the quay: a point one ship length before the spot, first
  // reached from further off the wall, so a 110 m hull never has to turn against it.
  const away = spot.away || { x: 0, z: 0 };
  const cands = [spot.h, spot.h + Math.PI].map((h) => {
    const pre = {
      x: spot.x - Math.sin(h) * (RL * 2 + 40),
      z: spot.z + Math.cos(h) * (RL * 2 + 40),
      h,
    };
    let off = null;
    const bx = -Math.sin(h) * 70,
      bz = Math.cos(h) * 70;
    for (const k of [70, 45, 25])
      if (waterAt(pre.x + bx + away.x * k, pre.z + bz + away.z * k, 14)) {
        off = { x: pre.x + bx + away.x * k, z: pre.z + bz + away.z * k };
        break;
      }
    // Room for the whole hull behind the approach point (not against a basin head).
    const ax = away.x * 14,
      az = away.z * 14;
    const room = waterAt(
      pre.x + ax - Math.sin(h) * (RL + 40),
      pre.z + az + Math.cos(h) * (RL + 40),
      6,
    );
    return { pre, off, ok: waterAt(pre.x + ax, pre.z + az, 6) && room };
  });
  const c =
    cands
      .filter((c) => c.ok)
      .sort(
        (a, b) =>
          Math.hypot(a.pre.x - r.x, a.pre.z - r.z) - Math.hypot(b.pre.x - r.x, b.pre.z - r.z),
      )[0] || cands[0];
  const first = c.off || c.pre;
  const route = waterRoute({ x: r.x, z: r.z }, first, 16).slice(1);
  r.path = [...route, { x: spot.x, z: spot.z, final: true, h: c.pre.h }];
  r.stuckT = 0;
}
export function rivalStartJob(r, bi, rivals, racing = false) {
  const spot = terminalSpot(r, rivals);
  r.term = spot.ti;
  r.target = bi;
  r.racing = racing;
  r.mode = 'toTerminal';
  plan(r, spot);
}
// fx: {say, sound}; player: state; traffic: list. Returns an event or null:
// {kind:'stole', rival} when a racing rival bunkered the player's ship first.
// Alongside first wins (engine.js): a racing rival arriving before the player has
// started bunkering takes the job; arriving after, it gives up and sails on.
function arrive(r, player) {
  if (r.mode === 'toTerminal') {
    r.mode = 'loading';
    r.wait = (8 + Math.random() * 6) * SIM;
    return null;
  }
  const contested = r.racing && player.job?.berth === r.target;
  if (contested && ['bunker', 'done'].includes(player.phase)) {
    Object.assign(r, { racing: false, target: null, mode: 'idle', wait: 10 * SIM });
    return null;
  }
  r.mode = 'bunkering';
  r.wait = 8 * SIM;
  return contested ? { kind: 'stole', rival: r } : null;
}
const gatesRef = { list: [] };
export function updateRivals(rivals, dt, player, traffic, fx = {}, gates = []) {
  gatesRef.list = gates;
  let event = null;
  for (const r of rivals) {
    if (r.hitCD > 0) r.hitCD -= dt;
    if (r.mode === 'sunk') {
      r.sinkT += dt;
      if (r.sinkT > 9 * SIM) {
        const t = terminals[Math.floor(Math.random() * terminals.length)];
        Object.assign(r, {
          x: t.x,
          z: t.z,
          h: t.h,
          damage: 0,
          mode: 'idle',
          wait: 6 * SIM,
          cur: 0,
        });
      }
      continue;
    }
    if (r.damage >= 100) {
      r.mode = 'sunk';
      r.sinkT = 0;
      r.cur = 0;
      fx.say?.('🫧 ' + r.name + ' is gezonken!', 4);
      fx.sound?.('sink');
      continue;
    }
    if (r.mode === 'idle') {
      r.cur = 0;
      r.wait -= dt;
      if (r.wait <= 0) {
        const pool = customers
          .map((_, i) => i)
          .filter(
            (i) =>
              !customers[i].gate &&
              i !== player.job?.berth &&
              !rivals.some((o) => o.target === i && o !== r),
          );
        if (pool.length) rivalStartJob(r, pool[Math.floor(Math.random() * pool.length)], rivals);
        else r.wait = 3 * SIM;
      }
      continue;
    }
    if (r.mode === 'loading' || r.mode === 'bunkering') {
      r.cur = 0;
      r.wait -= dt;
      if (r.mode === 'loading' && r.damage > 0) {
        const fix = Math.min(r.damage, (dt / SIM) * 10);
        r.damage -= fix;
        r.gold = Math.max(0, r.gold - fix * 2);
      }
      if (r.wait <= 0) {
        if (r.mode === 'loading') {
          r.mode = 'toShip';
          plan(r, berthSpot(r.target));
        } else {
          r.gold += 400 + Math.round(Math.random() * 500);
          r.jobs++;
          r.racing = false;
          r.target = null;
          r.mode = 'idle';
          r.wait = (10 + Math.random() * 20) * SIM;
          // Leave the berth: first straight ahead to the fairway.
        }
      }
      continue;
    }
    // Stuck? Replan after 15 s, towed to the fairway after 45 s (2D seconds).
    if (r.stuckX === undefined || Math.hypot(r.x - r.stuckX, r.z - r.stuckZ) > 8) {
      r.stuckX = r.x;
      r.stuckZ = r.z;
      r.stuckT = 0;
      r.replanned = false;
    } else r.stuckT += dt;
    const spotNow = () => (r.mode === 'toTerminal' ? terminalSpot(r, rivals) : berthSpot(r.target));
    if (r.stuckT > 15 * SIM && !r.replanned) {
      r.replanned = true;
      plan(r, spotNow());
    }
    if (r.stuckT > 45 * SIM) {
      const lane = MAP.lanes ? MAP.lanes.down : -20;
      r.z = Math.abs(r.z) < MAP.riverHalf ? lane : Math.sign(r.z) * (MAP.riverHalf - 33);
      r.h = -Math.PI / 2;
      r.cur = 0;
      r.stuckT = 0;
      plan(r, spotNow());
    }
    const wp = r.path[0];
    if (!wp) {
      r.mode = 'idle';
      r.wait = 3 * SIM;
      continue;
    }
    const dx = wp.x - r.x,
      dz = wp.z - r.z,
      d = Math.hypot(dx, dz);
    const segA = Math.atan2(dx, -dz);
    let da = ang(segA - r.h);
    const last = r.path.length === 1;
    let target = last
      ? Math.min(r.spd, 0.3 + d / 45)
      : r.path.length === 2
        ? Math.min(r.spd, 3.5)
        : r.spd;
    if (r.path.length >= 2) {
      // A bend ahead: slow down in time (engine.js: "bocht verderop: afremmen").
      const n2 = r.path[1],
        turn = Math.abs(ang(Math.atan2(n2.x - wp.x, -(n2.z - wp.z)) - segA));
      if (turn > 0.5) target = Math.min(target, 0.6 + d / 50);
    }
    const astern = Math.abs(da) > Math.PI - 0.45 && Math.abs(Math.sin(da)) * d < 13 && d < 3 * RL;
    if (astern) {
      da = ang(segA + Math.PI - r.h);
      target = Math.min(target, 3);
    } else if (Math.abs(da) > 0.12 && !(last && d < 25))
      target = Math.min(target, Math.abs(da) > 0.45 ? 0.15 : 0.6);
    // Final metres: slide in parallel to the quay.
    let wantH = segA;
    if (last && d < 40) {
      const ha = [wp.h, wp.h + Math.PI].sort(
        (a, b) => Math.abs(ang(a - r.h)) - Math.abs(ang(b - r.h)),
      )[0];
      wantH = ha;
      da = ang(ha - r.h);
    } else if (astern) wantH = segA + Math.PI;
    // Lookout ahead: player, other rivals, traffic.
    const sgn = astern ? -1 : 1,
      fx0 = Math.sin(r.h) * sgn,
      fz0 = -Math.cos(r.h) * sgn;
    const me = rivals.indexOf(r);
    const obstacles = [
      { x: player.x, z: player.z, len: 110 },
      ...rivals
        .filter((o) => o !== r && o.mode !== 'sunk')
        // Two rivals face to face: the second one gives way, the first goes on.
        .filter((o) => !(o.yieldTo === me && me < rivals.indexOf(o)))
        .map((o) => ({ x: o.x, z: o.z, len: 110, rival: rivals.indexOf(o) })),
      ...traffic.map((t) => ({ x: t.x, z: t.z, len: t.length })),
    ];
    r.yieldTo = null;
    for (const o of obstacles) {
      const ox = o.x - r.x,
        oz = o.z - r.z,
        ahead = ox * fx0 + oz * fz0,
        lat = Math.abs(ox * -fz0 + oz * fx0);
      const reach = RL + o.len / 2 + 30 + Math.abs(r.cur) * 12;
      if (ahead > 0 && ahead < reach && lat < 30 + o.len * 0.15) {
        target = Math.min(target, ahead < RL + o.len / 2 + 10 ? 0 : 0.8);
        r.yield = true;
        if (o.rival !== undefined) r.yieldTo = o.rival;
      }
    }
    // A basin with another rival manoeuvring in it: wait at the mouth (engine.js).
    const inBasin = (p) => basins.find((b) => p.x > b.x0 && p.x < b.x1 && p.z > b.z0 && p.z < b.z1);
    const mine = inBasin(r),
      next = inBasin(wp);
    if (next && next !== mine)
      for (const o of rivals)
        if (
          o !== r &&
          o.mode !== 'sunk' &&
          o.mode !== 'loading' &&
          o.mode !== 'bunkering' &&
          inBasin(o) === next &&
          Math.hypot(o.x - r.x, o.z - r.z) < 500
        ) {
          target = 0;
          r.yield = true;
        }
    // Final glide: within two ship lengths of the spot, come in parallel and slide
    // the last metres alongside (bow thruster and a skilled skipper).
    if (last && d < 2 * RL + 200 && !clearTo(r, wp)) {
      // Straight line to the spot crosses land: route round the corner first.
      const via = waterRoute({ x: r.x, z: r.z }, { x: wp.x, z: wp.z }, 10).slice(1, -1);
      if (via.length) {
        r.path = [...via, wp];
        continue;
      }
    }
    if (last && d < 2 * RL + 200) {
      const ha = [wp.h, wp.h + Math.PI].sort(
        (a, b) => Math.abs(ang(a - r.h)) - Math.abs(ang(b - r.h)),
      )[0];
      r.h += Math.max(-0.08 * dt, Math.min(0.08 * dt, ang(ha - r.h)));
      const v = Math.min(1.6, 0.2 + d / 40) * (Math.abs(ang(ha - r.h)) > 0.6 ? 0.3 : 1);
      r.cur += Math.max(-0.25 * dt, Math.min(0.15 * dt, v - r.cur));
      const step = Math.min(d, r.cur * dt);
      if (d > 1e-6) {
        r.x += (dx / d) * step;
        r.z += (dz / d) * step;
      }
      if (d < 3 && Math.abs(ang(ha - r.h)) < 0.05) {
        r.path = [];
        r.cur = 0;
        r.x = wp.x;
        r.z = wp.z;
        event = arrive(r, player) || event;
      }
      continue;
    }
    // Speed and turning: a 110 m boat, about 0.1 rad/s at speed.
    const sp = target * sgn;
    r.cur += Math.max(-0.25 * dt, Math.min(0.15 * dt, sp - r.cur));
    const turn = (0.04 + Math.min(0.08, Math.abs(r.cur) * 0.03)) * dt;
    r.h += Math.max(-turn, Math.min(turn, ang(wantH - r.h)));
    r.x += Math.sin(r.h) * r.cur * dt;
    r.z -= Math.cos(r.h) * r.cur * dt;
    // Same hull probes as the player against quays and moored ships: slide, never overlap.
    const hull = {
      x: r.x,
      z: r.z,
      h: r.h,
      u: r.cur,
      v: 0,
      r: 0,
      damage: r.damage,
      hitCD: r.hitCD,
      shipId: 'legacy',
    };
    const dmg = hullContacts(hull, dt, {
      gates: gatesRef.list,
      traffic,
      rivals: rivals.filter((o) => o !== r),
    });
    r.x = hull.x;
    r.z = hull.z;
    if (dmg) r.damage += dmg * 0.3; // scraping a quay should not sink an AI skipper
    r.hitCD = hull.hitCD;
    if (Math.abs(hull.u) < Math.abs(r.cur)) r.cur = hull.u;
    // Waypoint reached; sharp corners need to be sailed closer.
    const turnNext =
      r.path.length >= 2
        ? Math.abs(ang(Math.atan2(r.path[1].x - wp.x, -(r.path[1].z - wp.z)) - segA))
        : 0;
    if (!last && d < (turnNext > 0.8 ? 14 : 30)) r.path.shift();
    else if (last && d < 6 && Math.abs(r.cur) < 0.6) {
      r.path = [];
      r.cur = 0;
      event = arrive(r, player) || event;
    }
  }
  return event;
}
