// The 3D world is a smooth, exactly invertible warp of the straight 2D map: the river
// bends and the harbour basins lean at an angle to it. The 2D maps stay the single
// source; rules and route planning keep working on the map rectangles, physics and
// rendering happen in the warped world.
//
// Map (x, z) → world (X, Z), lean first, then bend:
//   x1 = x + g(z)        g = 0 on the river, a slope `lean` inside the basins
//   Z  = z + f(x1)       f = the river course
//   X  = x1
// Inverse, exact: z = Z − f(X), x = X − g(z).
// Jacobian J = [[1, g'], [f', 1 + f'g']], det J = 1. Directions (quay, heading,
// current, velocity) go through J·t; normals through J⁻ᵀ·n, then normalised.
export const CAPS = { bend: 0.25, lean: 0.35, sum: 0.5, radius: 3000, entrance: 55 };
const RAMP = 60; // metres over which a basin swings from the bank to its full lean

// River course per harbour, loosely after the real river. Terms add up:
//   { a, l, x }  sine, amplitude a (m), wavelength l (m), rising through zero at x
//   { a, w, x }  one bend: the river shifts a metres sideways round x, over about 4·w
// leanN / leanS: metres along the river per metre into a basin, north and south bank.
export const HARBOUR_WARPS = {
  // Noordzeekanaal: two lazy bends, the big southern basins raked towards the sea.
  amsterdam: {
    course: [
      { a: 110, w: 520, x: -950 },
      { a: -100, w: 500, x: 1250 },
    ],
    leanN: 0.15,
    leanS: -0.25,
  },
  // Nieuwe Maas: a wide bend past the Waalhaven, straight under the city bridges,
  // a last turn before the Van Brienenoordbrug.
  rotterdam: {
    course: [
      { a: 125, w: 640, x: -1250 },
      { a: -52, w: 350, x: 1380 },
    ],
    leanN: 0.25,
    leanS: -0.3,
  },
  // Nieuwe Waterweg: one long sweep, the petroleum harbours fanning out from it.
  europoort: {
    course: [{ a: 170, l: 7000, x: 500 }],
    leanN: -0.2,
    leanS: 0.3,
  },
  // Schelde: the river winds, the docks all lean upstream.
  antwerpen: {
    course: [{ a: 185, l: 5200, x: -1490 }],
    leanN: 0.2,
    leanS: 0.2,
  },
};
// Exaggerated on purpose: every cap reached at once, to shake out code that mixes up
// map and world coordinates (BUNKERGURU_WARP=stress runs the whole suite on it).
export const STRESS_WARP = { course: [{ a: 198, l: 5000, x: 300 }], leanN: 0.25, leanS: -0.25 };
// Harbours that sail on their warp; the others keep the straight map.
export const WARP_ENABLED = new Set(['amsterdam', 'rotterdam', 'europoort', 'antwerpen']);

// '' = as enabled per harbour, 'off' = the straight map, 'stress' = the test warp.
// Tests and tools set BUNKERGURU_WARP; in the browser ?warp=off|stress does the same.
export function warpMode() {
  let mode = globalThis.BUNKERGURU_WARP || globalThis.process?.env?.BUNKERGURU_WARP || '';
  if (!mode)
    try {
      mode = new URLSearchParams(globalThis.location?.search || '').get('warp') || '';
    } catch {}
  return mode;
}
export function warpParams(id) {
  if (id === 'training') return null; // the practice voyage stays straight
  const mode = warpMode();
  if (mode === 'off') return null;
  if (mode === 'stress') return STRESS_WARP;
  return WARP_ENABLED.has(id) ? HARBOUR_WARPS[id] : null;
}

export function createWarp(params, riverHalf = 0) {
  const course = params?.course || [],
    leanN = params?.leanN || 0,
    leanS = params?.leanS || 0,
    identity = !course.length && !leanN && !leanS;
  const f = (x) => {
    let v = 0;
    for (const t of course)
      v += t.l ? t.a * Math.sin((2 * Math.PI * (x - t.x)) / t.l) : t.a * Math.tanh((x - t.x) / t.w);
    return v;
  };
  const fp = (x) => {
    let v = 0;
    for (const t of course)
      if (t.l) v += ((t.a * 2 * Math.PI) / t.l) * Math.cos((2 * Math.PI * (x - t.x)) / t.l);
      else v += t.a / t.w / Math.cosh((x - t.x) / t.w) ** 2;
    return v;
  };
  const fpp = (x) => {
    let v = 0;
    for (const t of course)
      if (t.l) v -= t.a * ((2 * Math.PI) / t.l) ** 2 * Math.sin((2 * Math.PI * (x - t.x)) / t.l);
      else
        v -=
          (((2 * t.a) / t.w ** 2) * Math.tanh((x - t.x) / t.w)) / Math.cosh((x - t.x) / t.w) ** 2;
    return v;
  };
  // Distance into the basin → shift: 0 at the bank, a parabola over RAMP, then straight.
  const ramp = (d) => (d <= 0 ? 0 : d < RAMP ? (d * d) / (2 * RAMP) : d - RAMP / 2),
    rampP = (d) => (d <= 0 ? 0 : d < RAMP ? d / RAMP : 1);
  const g = (z) => (z < 0 ? leanN * ramp(-z - riverHalf) : leanS * ramp(z - riverHalf)),
    gp = (z) => (z < 0 ? -leanN * rampP(-z - riverHalf) : leanS * rampP(z - riverHalf));
  const forward = identity
    ? (x, z) => ({ x, z })
    : (x, z) => {
        const x1 = x + g(z);
        return { x: x1, z: z + f(x1) };
      };
  const inverse = identity
    ? (x, z) => ({ x, z })
    : (x, z) => {
        const mz = z - f(x);
        return { x: x - g(mz), z: mz };
      };
  // J at a map point: [[a, b], [c, d]] = [[1, g'], [f', 1 + f'g']].
  const jac = identity
    ? () => ({ a: 1, b: 0, c: 0, d: 1 })
    : (x, z) => {
        const b = gp(z),
          c = fp(x + g(z));
        return { a: 1, b, c, d: 1 + c * b };
      };
  // Direction on the map → direction in the world (not normalised: |J·t| is the stretch).
  const tangent = (x, z, tx, tz) => {
    const j = jac(x, z);
    return { x: j.a * tx + j.b * tz, z: j.c * tx + j.d * tz };
  };
  // Map normal → unit world normal; `scale` = |J⁻ᵀ·n|: a map distance d along n is
  // d / scale metres in the world.
  const normal = (x, z, nx, nz) => {
    const j = jac(x, z),
      wx = j.d * nx - j.c * nz,
      wz = -j.b * nx + j.a * nz,
      scale = Math.hypot(wx, wz) || 1;
    return { x: wx / scale, z: wz / scale, scale };
  };
  // Headings: h = 0 is north (−z), forward = (sin h, −cos h).
  const heading = identity
    ? (x, z, h) => h
    : (x, z, h) => {
        const t = tangent(x, z, Math.sin(h), -Math.cos(h));
        return Math.atan2(t.x, -t.z);
      };
  // World heading at a world point → heading on the map (J⁻¹ = [[d, −b], [−c, a]]).
  const headingInverse = identity
    ? (x, z, h) => h
    : (x, z, h) => {
        const m = inverse(x, z),
          j = jac(m.x, m.z),
          tx = Math.sin(h),
          tz = -Math.cos(h);
        return Math.atan2(j.d * tx - j.b * tz, -(-j.c * tx + j.a * tz));
      };
  // A whole pose at once: {x, z, h} on the map ↔ in the world.
  const poseForward = (p) => ({ ...forward(p.x, p.z), h: heading(p.x, p.z, p.h || 0) }),
    poseInverse = (p) => ({ ...inverse(p.x, p.z), h: headingInverse(p.x, p.z, p.h || 0) });
  // Rigid frame for something that stands on the land at a map point: it keeps its
  // shape, moves with the warp and turns with the chosen map axis ('x': along the
  // river, 'z': along a basin quay). Along that axis it stretches with the warp, so a
  // row of houses stays closed. Returns the 2×2 matrix [[a, b], [c, d]] (map → world).
  const frame = identity
    ? () => ({ a: 1, b: 0, c: 0, d: 1 })
    : (x, z, axis = 'x') => {
        const j = jac(x, z);
        if (axis === 'affine') return j;
        if (axis === 'z') {
          const n = Math.hypot(j.b, j.d);
          return { a: j.d / n, b: j.b, c: -j.b / n, d: j.d };
        }
        const n = Math.hypot(j.a, j.c);
        return { a: j.a, b: -j.c / n, c: j.c, d: j.a / n };
      };
  return {
    identity,
    params: params || null,
    riverHalf,
    f,
    fp,
    fpp,
    g,
    gp,
    forward,
    inverse,
    jac,
    tangent,
    normal,
    heading,
    headingInverse,
    poseForward,
    poseInverse,
    frame,
  };
}
