import { land } from '../maps/amsterdam.mjs';
import { berths, HARBOR } from './harbor.mjs';
import { profileOf, toWorld, hullSamples } from './ship-profile.mjs';
const W = HARBOR.halfWidth,
  L = HARBOR.halfLength;
const walls = [
  { x0: -10000, x1: -W, z0: -10000, z1: 10000 },
  { x0: W, x1: 10000, z0: -10000, z1: 10000 },
  { x0: -W, x1: W, z0: -10000, z1: -L },
  { x0: -W, x1: W, z0: L, z1: 10000 },
  ...land,
  ...berths.map((b) => ({
    x0: b.shipX - (b.h ? b.length * 0.54 : b.beam / 2 + 1),
    x1: b.shipX + (b.h ? b.length * 0.54 : b.beam / 2 + 1),
    z0: b.shipZ - (b.h ? b.beam / 2 + 1 : b.length * 0.54),
    z1: b.shipZ + (b.h ? b.beam / 2 + 1 : b.length * 0.54),
  })),
];
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
export function hullContacts(s, dt) {
  const profile = profileOf(s);
  s.hitCD = Math.max(0, (s.hitCD || 0) - dt);
  const sn = Math.sin(s.h),
    cs = Math.cos(s.h),
    rad = toWorld(profile.beam) / 2;
  let vx = sn * s.u + cs * s.v,
    vz = -cs * s.u + sn * s.v;
  for (const wall of walls) {
    const ex = Math.abs(sn) * profile.length * 0.46 + rad,
      ez = Math.abs(cs) * profile.length * 0.46 + rad;
    if (s.x + ex < wall.x0 || s.x - ex > wall.x1 || s.z + ez < wall.z0 || s.z - ez > wall.z1)
      continue;
    for (const f of hullSamples(profile)) {
      const x = s.x + sn * toWorld(profile.length) * f,
        z = s.z - cs * toWorld(profile.length) * f;
      const qx = clamp(x, wall.x0, wall.x1),
        qz = clamp(z, wall.z0, wall.z1);
      let nx = x - qx,
        nz = z - qz,
        d = Math.hypot(nx, nz),
        push = 0;
      if (x > wall.x0 && x < wall.x1 && z > wall.z0 && z < wall.z1) {
        const edges = [
          { d: x - wall.x0, nx: -1, nz: 0 },
          { d: wall.x1 - x, nx: 1, nz: 0 },
          { d: z - wall.z0, nx: 0, nz: -1 },
          { d: wall.z1 - z, nx: 0, nz: 1 },
        ];
        const e = edges.sort((a, b) => a.d - b.d)[0];
        nx = e.nx;
        nz = e.nz;
        push = e.d + rad + 0.1;
      } else if (d < rad) {
        if (d < 1e-9) continue;
        nx /= d;
        nz /= d;
        push = rad - d + 0.1;
      } else continue;
      s.x += nx * push;
      s.z += nz * push;
      const vn = vx * nx + vz * nz,
        impact = Math.max(0, -vn);
      if (vn < 0) {
        vx -= vn * nx * 1.3;
        vz -= vn * nz * 1.3;
      }
      s.r *= 0.5;
      if (impact > 0.8 && s.hitCD <= 0) {
        s.damage = clamp(s.damage + Math.max(1, Math.round((impact - 0.5) * 9)), 0, 100);
        s.hitCD = 0.6;
      }
    }
  }
  s.u = vx * sn - vz * cs;
  s.v = vx * cs + vz * sn;
}

// Capsule samples share actual rendered dimensions; relative speed determines impact.
export function trafficContacts(s, traffic) {
  const p = profileOf(s),
    sn = Math.sin(s.h),
    cs = Math.cos(s.h);
  let vx = sn * s.u + cs * s.v,
    vz = -cs * s.u + sn * s.v;
  for (const b of traffic)
    for (const f of hullSamples(p)) {
      const px = s.x + sn * p.length * f,
        pz = s.z - cs * p.length * f,
        bx = Math.sin(b.h),
        bz = -Math.cos(b.h);
      const t = clamp((px - b.x) * bx + (pz - b.z) * bz, -b.length * 0.4, b.length * 0.4);
      let nx = px - (b.x + bx * t),
        nz = pz - (b.z + bz * t),
        d = Math.hypot(nx, nz),
        rad = (p.beam + b.beam) / 2;
      if (d >= rad) continue;
      if (d < 0.001) {
        nx = 1;
        nz = 0;
        d = 1;
      } else {
        nx /= d;
        nz /= d;
      }
      s.x += nx * (rad - d + 0.1);
      s.z += nz * (rad - d + 0.1);
      const vn = (vx - bx * b.speed) * nx + (vz - bz * b.speed) * nz;
      if (vn < 0) {
        vx -= vn * nx * 1.2;
        vz -= vn * nz * 1.2;
        if (-vn > 0.8 && s.hitCD <= 0) {
          s.damage = clamp(s.damage + Math.round(-vn * 8), 0, 100);
          s.hitCD = 0.6;
        }
      }
      s.r *= 0.5;
    }
  s.u = vx * sn - vz * cs;
  s.v = vx * cs + vz * sn;
}
