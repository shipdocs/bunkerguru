// Hull contacts as in engine.js physics(): probe circles along the hull against quays,
// moored seagoing ships, closed gates, traffic and rival boats. Only the speed into the
// obstacle counts; sliding along a quay is allowed. Damage (impact − 0.5) × 9, × fenders.
//
// Two frames (maps/warp.mjs). The player sails in the warped WORLD: quays and gates are
// map rectangles seen through the warp, a moored seagoing ship is a rigid box lying
// along its curved quay, other vessels are taken at their world pose. The boats that
// sail on the MAP itself (rivals, own fleet) call with ctx.space = 'map' and get the
// plain rectangles of the 2D game.
import { MAP, WARP, SHAPE, land, customers, liners } from '../maps/index.mjs';
import { profileOf, toWorld, hullSamples } from './ship-profile.mjs';
const W = MAP.halfWidth;
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
export const HIT_COOLDOWN = 1.8; // 0.6 s in the 2D game = 1.8 simulated seconds
// Chart edges and land: map rectangles.
export const landWalls = [
  { x0: -1e5, x1: -W, z0: -1e5, z1: 1e5 },
  { x0: W, x1: 1e5, z0: -1e5, z1: 1e5 },
  { x0: -W, x1: W, z0: -1e5, z1: MAP.zMin },
  { x0: -W, x1: W, z0: MAP.zMax, z1: 1e5 },
  ...land,
];
// Moored seagoing ships on the map (for the boats that sail there)…
const shipWallsM = customers.map((b) => ({
  ship: true,
  x0: b.shipMX - (b.alongX ? b.length / 2 : b.beam / 2),
  x1: b.shipMX + (b.alongX ? b.length / 2 : b.beam / 2),
  z0: b.shipMZ - (b.alongX ? b.beam / 2 : b.length / 2),
  z1: b.shipMZ + (b.alongX ? b.beam / 2 : b.length / 2),
}));
// On a real outline (SHAPE) the ships lie at an angle: they are boxes, as in the world.
export const staticWalls = SHAPE ? landWalls : [...landWalls, ...shipWallsM];
// …and in the world: a rigid box in its own frame (x along the hull, z to starboard).
export const shipBoxes = [...customers, ...liners].map((b) => ({
  ship: true,
  cx: b.shipX,
  cz: b.shipZ,
  tx: Math.sin(b.h),
  tz: -Math.cos(b.h),
  reach: Math.hypot(b.length, b.beam) / 2,
  x0: -b.length / 2,
  x1: b.length / 2,
  z0: -b.beam / 2,
  z1: b.beam / 2,
}));
// Probe (x, z) against a rectangle, both in the rectangle's own frame; (cx, cz) is the
// middle of the hull. Inside: the nearest edge, preferring the side the hull itself is
// on, so a thin obstacle (a moored ship) never pushes it onto the quay behind.
function probe(r, x, z, cx, cz) {
  if (x > r.x0 && x < r.x1 && z > r.z0 && z < r.z1) {
    const edges = [
      { d: x - r.x0, nx: -1, nz: 0, out: cx < r.x0 },
      { d: r.x1 - x, nx: 1, nz: 0, out: cx > r.x1 },
      { d: z - r.z0, nx: 0, nz: -1, out: cz < r.z0 },
      { d: r.z1 - z, nx: 0, nz: 1, out: cz > r.z1 },
    ];
    const side = edges.filter((e) => e.out);
    const e = (side.length ? side : edges).sort((a, b) => a.d - b.d)[0];
    return { inside: true, nx: e.nx, nz: e.nz, d: e.d };
  }
  const qx = clamp(x, r.x0, r.x1),
    qz = clamp(z, r.z0, r.z1);
  return { inside: false, nx: x - qx, nz: z - qz, qx, qz };
}
// Returns the worst impact (m/s) this step, or 0.
// ctx: {fender, gates, traffic, rivals, onRival, space}
export function hullContacts(s, dt, ctx = {}) {
  const profile = profileOf(s),
    onMap = ctx.space === 'map' || WARP.identity;
  s.hitCD = Math.max(0, (s.hitCD || 0) - dt);
  const sn = Math.sin(s.h),
    cs = Math.cos(s.h),
    rad = toWorld(profile.beam) / 2,
    reach = profile.length * 0.46 + rad;
  let vx = sn * s.u + cs * s.v,
    vz = -cs * s.u + sn * s.v;
  let worst = 0;
  const bounce = (nx, nz, push) => {
    s.x += nx * push;
    s.z += nz * push;
    const vn = vx * nx + vz * nz;
    if (vn < 0) {
      vx -= vn * nx * 1.3;
      vz -= vn * nz * 1.3;
      worst = Math.max(worst, -vn);
    }
    s.r *= 0.5;
  };
  const samples = hullSamples(profile);
  const closed = ctx.gates ? ctx.gates.filter((g) => g.state !== 'open') : [];
  const walls = (onMap ? staticWalls : landWalls).concat(closed);
  // Hull extent on the map for the broad phase (a little generous under the warp).
  let ex, ez;
  if (onMap) {
    ex = Math.abs(sn) * profile.length * 0.46 + rad;
    ez = Math.abs(cs) * profile.length * 0.46 + rad;
  } else {
    const mh = WARP.headingInverse(s.x, s.z, s.h);
    ex = (Math.abs(Math.sin(mh)) * profile.length * 0.46 + rad) * 1.15 + 2;
    ez = (Math.abs(Math.cos(mh)) * profile.length * 0.46 + rad) * 1.15 + 2;
  }
  for (const wall of walls) {
    let c = onMap ? s : WARP.inverse(s.x, s.z);
    if (c.x + ex < wall.x0 || c.x - ex > wall.x1 || c.z + ez < wall.z0 || c.z - ez > wall.z1)
      continue;
    for (const f of samples) {
      const x = s.x + sn * profile.length * f,
        z = s.z - cs * profile.length * f;
      if (onMap) {
        const p = probe(wall, x, z, s.x, s.z);
        if (p.inside) bounce(p.nx, p.nz, p.d + rad + 0.25);
        else {
          const d = Math.hypot(p.nx, p.nz);
          if (d >= rad || d < 1e-9) continue;
          bounce(p.nx / d, p.nz / d, rad - d + 0.25);
        }
        continue;
      }
      // Warped quay: find the wall on the map, then measure and push in the world.
      const m = WARP.inverse(x, z);
      c = WARP.inverse(s.x, s.z);
      const p = probe(wall, m.x, m.z, c.x, c.z);
      if (p.inside) {
        const n = WARP.normal(m.x, m.z, p.nx, p.nz);
        bounce(n.x, n.z, p.d / n.scale + rad + 0.25);
      } else if (!p.nx !== !p.nz) {
        // Opposite a straight stretch of wall: the map distance, measured square to
        // the warped wall.
        const n = WARP.normal(p.qx, p.qz, Math.sign(p.nx), Math.sign(p.nz)),
          d = Math.hypot(p.nx, p.nz) / n.scale;
        if (d >= rad || d < 1e-9) continue;
        bounce(n.x, n.z, rad - d + 0.25);
      } else {
        // Round a corner: straight to the warped corner point.
        const q = WARP.forward(p.qx, p.qz),
          nx = x - q.x,
          nz = z - q.z,
          d = Math.hypot(nx, nz);
        if (d >= rad || d < 1e-9) continue;
        bounce(nx / d, nz / d, rad - d + 0.25);
      }
    }
  }
  // A real outline: every hull probe against the nearest stretch of quay wall.
  if (SHAPE)
    for (const f of samples) {
      const x = s.x + sn * profile.length * f,
        z = s.z - cs * profile.length * f,
        w = SHAPE.wall(x, z, rad + 4);
      if (!w) continue;
      if (w.wet) {
        if (w.d >= rad || w.d < 1e-9) continue;
        bounce((x - w.qx) / w.d, (z - w.qz) / w.d, rad - w.d + 0.25);
      } else if (w.d < 1e-9) bounce(w.nx, w.nz, rad + 0.25);
      else bounce((w.qx - x) / w.d, (w.qz - z) / w.d, w.d + rad + 0.25);
    }
  // Moored seagoing ships in the world: rigid boxes along their quay.
  if (!onMap || SHAPE)
    for (const b of shipBoxes) {
      if (Math.hypot(s.x - b.cx, s.z - b.cz) > b.reach + reach) continue;
      // Into the ship's frame: x along its hull (tx, tz), z to its starboard (−tz, tx).
      const local = (x, z) => ({
        x: (x - b.cx) * b.tx + (z - b.cz) * b.tz,
        z: -(x - b.cx) * b.tz + (z - b.cz) * b.tx,
      });
      const out = (nx, nz, push) => bounce(nx * b.tx - nz * b.tz, nx * b.tz + nz * b.tx, push);
      for (const f of samples) {
        const m = local(s.x + sn * profile.length * f, s.z - cs * profile.length * f),
          c = local(s.x, s.z),
          p = probe(b, m.x, m.z, c.x, c.z);
        if (p.inside) out(p.nx, p.nz, p.d + rad + 0.25);
        else {
          const d = Math.hypot(p.nx, p.nz);
          if (d >= rad || d < 1e-9) continue;
          out(p.nx / d, p.nz / d, rad - d + 0.25);
        }
      }
    }
  // Moving hulls: traffic (capsules) and rivals. Relative velocity counts. They sail
  // on the map; the player meets them at their published world pose (wx, wz, wh).
  const world = ctx.space !== 'map';
  const velocity = (o, mvx, mvz) =>
    world && !WARP.identity ? WARP.tangent(o.x, o.z, mvx, mvz) : { x: mvx, z: mvz };
  const movers = [
    ...(ctx.traffic || []).map((t) => ({
      o: t,
      v: t.path
        ? { x: t.vx, z: t.vz }
        : velocity(t, t.axis === 'z' ? 0 : t.v * t.k, t.axis === 'z' ? t.v * t.k : 0),
    })),
    ...(ctx.rivals || [])
      .filter((r) => r.mode !== 'sunk')
      .map((r) => ({
        o: r,
        rival: true,
        v: velocity(r, Math.sin(r.h) * r.cur, -Math.cos(r.h) * r.cur),
      })),
  ];
  for (const m of movers) {
    const b = m.o,
      bl = b.length || 110,
      bb = b.beam || 11,
      ox = world ? (b.wx ?? b.x) : b.x,
      oz = world ? (b.wz ?? b.z) : b.z,
      oh = world ? (b.wh ?? b.h) : b.h;
    if (
      Math.abs(ox - s.x) > (bl + profile.length) / 2 + 20 ||
      Math.abs(oz - s.z) > (bl + profile.length) / 2 + 20
    )
      continue;
    const bx = Math.sin(oh),
      bz = -Math.cos(oh);
    for (const f of samples) {
      const px = s.x + sn * profile.length * f,
        pz = s.z - cs * profile.length * f;
      const t = clamp((px - ox) * bx + (pz - oz) * bz, -bl * 0.46, bl * 0.46);
      let nx = px - (ox + bx * t),
        nz = pz - (oz + bz * t),
        d = Math.hypot(nx, nz);
      const r2 = (profile.beam + bb) / 2;
      if (d >= r2) continue;
      if (d < 0.001) [nx, nz, d] = [1, 0, 1];
      else [nx, nz] = [nx / d, nz / d];
      // Separate gently: deep overlaps (crossing hulls) resolve over a few steps
      // instead of throwing a hull across the harbour.
      const sep = Math.min(r2 - d + 0.1, 1.5);
      s.x += nx * sep;
      s.z += nz * sep;
      const vn = (vx - m.v.x) * nx + (vz - m.v.z) * nz;
      if (vn < 0) {
        // Blame: who moved into whom (engine.js: the rival's share).
        const aP = Math.max(0, -(vx * nx + vz * nz)),
          aR = Math.max(0, m.v.x * nx + m.v.z * nz);
        vx -= vn * nx * 1.2;
        vz -= vn * nz * 1.2;
        if (m.rival) ctx.onRival?.(b, -vn, aR / Math.max(1e-6, aP + aR));
        else worst = Math.max(worst, -vn);
      }
      s.r *= 0.5;
    }
  }
  s.u = vx * sn - vz * cs;
  s.v = vx * cs + vz * sn;
  if (worst > 0.8 && s.hitCD <= 0) {
    const dmg = Math.max(1, Math.round((worst - 0.5) * 9 * (ctx.fender || 1)));
    s.damage = clamp(s.damage + dmg, 0, 100);
    s.hitCD = HIT_COOLDOWN;
    ctx.onHit?.(dmg);
    return dmg;
  }
  return 0;
}
