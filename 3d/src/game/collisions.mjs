// Hull contacts as in engine.js physics(): probe circles along the hull against quays,
// moored seagoing ships, closed gates, traffic and rival boats. Only the speed into the
// obstacle counts; sliding along a quay is allowed. Damage (impact − 0.5) × 9, × fenders.
import { MAP, land, customers } from '../maps/index.mjs';
import { profileOf, toWorld, hullSamples } from './ship-profile.mjs';
const W = MAP.halfWidth;
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
export const HIT_COOLDOWN = 1.8; // 0.6 s in the 2D game = 1.8 simulated seconds
export const staticWalls = [
  { x0: -1e5, x1: -W, z0: -1e5, z1: 1e5 },
  { x0: W, x1: 1e5, z0: -1e5, z1: 1e5 },
  { x0: -W, x1: W, z0: -1e5, z1: MAP.zMin },
  { x0: -W, x1: W, z0: MAP.zMax, z1: 1e5 },
  ...land,
  ...customers.map((b) => ({
    ship: true,
    x0: b.shipX - (b.h ? b.length / 2 : b.beam / 2),
    x1: b.shipX + (b.h ? b.length / 2 : b.beam / 2),
    z0: b.shipZ - (b.h ? b.beam / 2 : b.length / 2),
    z1: b.shipZ + (b.h ? b.beam / 2 : b.length / 2),
  })),
];
// Returns the worst impact (m/s) this step, or 0. ctx: {fender, gates, traffic, rivals, onRival}
export function hullContacts(s, dt, ctx = {}) {
  const profile = profileOf(s);
  s.hitCD = Math.max(0, (s.hitCD || 0) - dt);
  const sn = Math.sin(s.h),
    cs = Math.cos(s.h),
    rad = toWorld(profile.beam) / 2;
  let vx = sn * s.u + cs * s.v,
    vz = -cs * s.u + sn * s.v;
  const ex = Math.abs(sn) * profile.length * 0.46 + rad,
    ez = Math.abs(cs) * profile.length * 0.46 + rad;
  const walls = ctx.gates
    ? staticWalls.concat(ctx.gates.filter((g) => g.state !== 'open'))
    : staticWalls;
  let worst = 0;
  for (const wall of walls) {
    if (s.x + ex < wall.x0 || s.x - ex > wall.x1 || s.z + ez < wall.z0 || s.z - ez > wall.z1)
      continue;
    for (const f of hullSamples(profile)) {
      const x = s.x + sn * profile.length * f,
        z = s.z - cs * profile.length * f;
      const qx = clamp(x, wall.x0, wall.x1),
        qz = clamp(z, wall.z0, wall.z1);
      let nx = x - qx,
        nz = z - qz,
        d = Math.hypot(nx, nz),
        push = 0;
      if (x > wall.x0 && x < wall.x1 && z > wall.z0 && z < wall.z1) {
        const edges = [
          { d: x - wall.x0, nx: -1, nz: 0, out: s.x < wall.x0 },
          { d: wall.x1 - x, nx: 1, nz: 0, out: s.x > wall.x1 },
          { d: z - wall.z0, nx: 0, nz: -1, out: s.z < wall.z0 },
          { d: wall.z1 - z, nx: 0, nz: 1, out: s.z > wall.z1 },
        ];
        // Push back towards the side where the hull itself is, not through a thin
        // obstacle (a moored ship) onto the quay behind it.
        const side = edges.filter((e) => e.out);
        const e = (side.length ? side : edges).sort((a, b) => a.d - b.d)[0];
        nx = e.nx;
        nz = e.nz;
        push = e.d + rad + 0.25;
      } else if (d < rad) {
        if (d < 1e-9) continue;
        nx /= d;
        nz /= d;
        push = rad - d + 0.25;
      } else continue;
      s.x += nx * push;
      s.z += nz * push;
      const vn = vx * nx + vz * nz;
      if (vn < 0) {
        vx -= vn * nx * 1.3;
        vz -= vn * nz * 1.3;
        worst = Math.max(worst, -vn);
      }
      s.r *= 0.5;
    }
  }
  // Moving hulls: traffic (capsules) and rivals. Relative velocity counts.
  const movers = [
    ...(ctx.traffic || []).map((t) => ({
      o: t,
      vx: t.axis === 'z' ? 0 : t.v * t.k,
      vz: t.axis === 'z' ? t.v * t.k : 0,
    })),
    ...(ctx.rivals || [])
      .filter((r) => r.mode !== 'sunk')
      .map((r) => ({ o: r, rival: true, vx: Math.sin(r.h) * r.cur, vz: -Math.cos(r.h) * r.cur })),
  ];
  for (const m of movers) {
    const b = m.o,
      bl = b.length || 110,
      bb = b.beam || 11;
    if (
      Math.abs(b.x - s.x) > (bl + profile.length) / 2 + 20 ||
      Math.abs(b.z - s.z) > (bl + profile.length) / 2 + 20
    )
      continue;
    const bx = Math.sin(b.h),
      bz = -Math.cos(b.h);
    for (const f of hullSamples(profile)) {
      const px = s.x + sn * profile.length * f,
        pz = s.z - cs * profile.length * f;
      const t = clamp((px - b.x) * bx + (pz - b.z) * bz, -bl * 0.46, bl * 0.46);
      let nx = px - (b.x + bx * t),
        nz = pz - (b.z + bz * t),
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
      const vn = (vx - m.vx) * nx + (vz - m.vz) * nz;
      if (vn < 0) {
        // Blame: who moved into whom (engine.js: the rival's share).
        const aP = Math.max(0, -(vx * nx + vz * nz)),
          aR = Math.max(0, m.vx * nx + m.vz * nz);
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
