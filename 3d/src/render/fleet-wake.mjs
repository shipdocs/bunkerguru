import * as T from '../../vendor/three.js';
import { wakeStrength, bowStrength, kelvinHalfWidth, kelvinLength } from '../game/wake.mjs';
// Bow wave and wake for every other vessel: traffic, rivals and your own fleet. A light
// cousin of the player's effects (navigation-effects.mjs): no particles, straight
// Kelvin arms behind the stern along the way she is really moving, a churned band from
// the propeller and a foam collar at the bow. One ribbon mesh, one draw call, fixed
// buffers; the numbers come from game/wake.mjs, so a fast boat throws a big wake.
export const FLEET_MAX = 24;
export const REACH_MAX = 220; // m: the player's wake follows its track, these are straight
const ARM = 8, // points along a Kelvin arm
  BAND = 8, // points along the propeller band
  COLLAR = 5, // points along each bow shoulder
  PTS = ARM * 2 + BAND + COLLAR * 2; // cross-sections per vessel

// A vessel as the wake needs it, from the simulation's own speed (traffic: speed,
// rivals and fleet: cur, negative going astern) and heading (x east, z south): the
// same size of wake whatever the frame rate.
export function vesselWake(x, z, h, speed, length, beam) {
  const dir = speed < 0 ? -1 : 1;
  return {
    x,
    z,
    fx: Math.sin(h) * dir,
    fz: -Math.cos(h) * dir,
    speed: Math.abs(speed),
    length,
    beam,
  };
}

export function createFleetWake(scene) {
  const pos = new Float32Array(FLEET_MAX * PTS * 9),
    col = new Float32Array(FLEET_MAX * PTS * 12).fill(1),
    idx = [];
  for (let v = 0; v < FLEET_MAX; v++) {
    const base = v * PTS;
    for (const [from, n] of [
      [0, ARM],
      [ARM, ARM],
      [ARM * 2, BAND],
      [ARM * 2 + BAND, COLLAR],
      [ARM * 2 + BAND + COLLAR, COLLAR],
    ])
      for (let i = base + from; i < base + from + n - 1; i++) {
        const a = i * 3,
          b = a + 3;
        idx.push(a, b, a + 1, a + 1, b, b + 1, a + 1, b + 1, a + 2, a + 2, b + 1, b + 2);
      }
  }
  const perVessel = idx.length / FLEET_MAX;
  const geo = new T.BufferGeometry();
  const attr = (arr, n) => new T.BufferAttribute(arr, n).setUsage(T.DynamicDrawUsage);
  geo.setAttribute('position', attr(pos, 3));
  geo.setAttribute('color', attr(col, 4));
  geo.setIndex(idx);
  geo.setDrawRange(0, 0);
  const mesh = new T.Mesh(
    geo,
    new T.MeshBasicMaterial({
      color: '#f4fbf8',
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      side: T.DoubleSide,
    }),
  );
  mesh.name = 'fleet-wake';
  mesh.frustumCulled = false;
  mesh.renderOrder = 1;
  scene.add(mesh);
  // One cross-section: edge, centre, edge across (nx, nz); alpha fades to the edges.
  function rib(p, x, z, nx, nz, hw, aC, aE) {
    let o = p * 9;
    pos[o] = x - nx * hw;
    pos[o + 2] = z - nz * hw;
    pos[o + 3] = x;
    pos[o + 5] = z;
    pos[o + 6] = x + nx * hw;
    pos[o + 8] = z + nz * hw;
    pos[o + 1] = pos[o + 4] = pos[o + 7] = 0;
    o = p * 12 + 3;
    col[o] = col[o + 8] = aE;
    col[o + 4] = aC;
  }
  return {
    mesh,
    // vessels: [{ x, z, fx, fz, speed, length, beam }]; y = the water level.
    update(vessels, y, time = 0) {
      let n = 0;
      for (const s of vessels) {
        if (n >= FLEET_MAX) break;
        const k = wakeStrength(s.speed),
          bk = bowStrength(s.speed);
        if (k <= 0.02) continue;
        const L = s.length,
          B = s.beam,
          fx = s.fx,
          fz = s.fz,
          sx = -fz, // to starboard
          sz = fx,
          ex = s.x - (fx * L) / 2, // stern
          ez = s.z - (fz * L) / 2,
          // straight arms: kept short enough not to cut across the quay in a bend
          reach = Math.min(kelvinLength(L, k), REACH_MAX);
        let p = n * PTS;
        // Kelvin arms: the V spreading at 19.5° on either side behind the stern; widths
        // and brightness as the player's own wake (navigation-effects.mjs).
        for (const side of [-1, 1])
          for (let i = 0; i < ARM; i++) {
            const t = i / (ARM - 1),
              d = reach * t,
              off = kelvinHalfWidth(d, B) * side,
              // across the arm: perpendicular to its line (back along the track, out)
              ax = -fx + sx * side * 0.354,
              az = -fz + sz * side * 0.354,
              al = Math.hypot(ax, az),
              a = 0.62 * k * (1 - t) * (0.72 + 0.28 * Math.sin(d * 0.4 + time * 2.2));
            rib(
              p++,
              ex - fx * d + sx * off,
              ez - fz * d + sz * off,
              -az / al,
              ax / al,
              0.7 + t * 2.2,
              a,
              a * 0.25,
            );
          }
        // Churned band from the propeller, straight back, widening and fading.
        for (let i = 0; i < BAND; i++) {
          const t = i / (BAND - 1),
            d = reach * t;
          rib(
            p++,
            ex - fx * d,
            ez - fz * d,
            sx,
            sz,
            B * (0.4 + t * 1.1),
            (0.1 + 0.26 * k) * (1 - t),
            0,
          );
        }
        // Bow collar: a foam ribbon from the stem back along each shoulder (the same
        // curve as the player's: out from the stem, along the hull, then away).
        const shown = Math.min(1, bk * 5);
        for (const side of [-1, 1])
          for (let i = 0; i < COLLAR; i++) {
            const t = i / (COLLAR - 1),
              m = 1 - t,
              f0 = L * 0.5 + 1.2,
              f1 = L * 0.5 - 5,
              f2 = L * 0.5 - 13 - 15 * bk,
              d0 = side * 0.2,
              d1 = side * (B * 0.5 + 1.2),
              d2 = side * (B * 0.5 + 2.6 + 6 * bk),
              f = m * m * f0 + 2 * m * t * f1 + t * t * f2,
              d = m * m * d0 + 2 * m * t * d1 + t * t * d2,
              df = m * (f1 - f0) + t * (f2 - f1),
              dd = m * (d1 - d0) + t * (d2 - d1),
              wx = fx * df + sx * dd,
              wz = fz * df + sz * dd,
              wl = Math.hypot(wx, wz) || 1,
              a = (0.5 + 0.4 * bk) * shown * (1 - t) ** 0.7;
            rib(
              p++,
              s.x + fx * f + sx * d,
              s.z + fz * f + sz * d,
              -wz / wl,
              wx / wl,
              (0.5 + 1.5 * bk) * (0.45 + 0.55 * Math.sin(Math.PI * Math.min(1, t * 1.4))),
              a,
              a * 0.45,
            );
          }
        n++;
      }
      mesh.position.y = y + 0.12;
      geo.setDrawRange(0, n * perVessel);
      geo.attributes.position.needsUpdate = true;
      geo.attributes.color.needsUpdate = true;
      return n;
    },
  };
}
