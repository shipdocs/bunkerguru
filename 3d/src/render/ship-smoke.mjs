import * as T from '../../vendor/three.js';
// Smoke from the funnels of the other vessels: a soft grey puff now and then, more and
// darker as she works harder, rising and leaning with the wind, swelling and thinning
// out. One instanced mesh with a fixed pool; small boats (water taxis) make none.
export const SMOKE_MAX = 160;
const LIFE = 5; // seconds a puff lasts

// How many puffs a second a vessel makes at this speed (m/s): idling a wisp, working hard
// a steady plume.
export const smokeRate = (speed, length) => (length < 30 ? 0 : 0.35 + Math.min(1, speed / 5) * 1.6);

export function createShipSmoke(scene, light = false) {
  const n = light ? SMOKE_MAX / 2 : SMOKE_MAX;
  const mesh = new T.InstancedMesh(
    new T.IcosahedronGeometry(1, 0),
    new T.MeshLambertMaterial({
      color: '#6b6f73',
      transparent: true,
      opacity: 0.32,
      depthWrite: false,
    }),
    n,
  );
  mesh.name = 'ship-smoke';
  mesh.frustumCulled = false;
  mesh.castShadow = mesh.receiveShadow = false;
  mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
  scene.add(mesh);
  const px = new Float32Array(n),
    py = new Float32Array(n),
    pz = new Float32Array(n),
    age = new Float32Array(n).fill(LIFE),
    size = new Float32Array(n);
  const acc = new Map(),
    m = new T.Matrix4(),
    q = new T.Quaternion(),
    v = new T.Vector3(),
    sc = new T.Vector3();
  let next = 0;
  return {
    mesh,
    // vessels: [{ x, z, fx, fz, speed, length, beam, key }]; wind {x, z} in m/s.
    update(vessels, dt, level, wind = { x: 0.3, z: 0.1 }) {
      for (const s of vessels) {
        const rate = smokeRate(s.speed, s.length);
        if (!rate) continue;
        let a = (acc.get(s.key) || Math.random()) + rate * dt;
        for (; a >= 1; a--) {
          const i = next++ % n,
            back = s.length * 0.36, // the funnel stands aft, above the engine room
            h = s.length > 150 ? 30 : s.length > 90 ? 16 : 9;
          px[i] = s.x - s.fx * back + (Math.random() - 0.5);
          pz[i] = s.z - s.fz * back + (Math.random() - 0.5);
          py[i] = level + h;
          age[i] = 0;
          size[i] = (s.length > 150 ? 2.6 : 1.6) * (0.8 + Math.min(1, s.speed / 5) * 0.6);
        }
        acc.set(s.key, a);
      }
      for (let i = 0; i < n; i++) {
        if (age[i] >= LIFE) {
          m.makeScale(0, 0, 0);
          mesh.setMatrixAt(i, m);
          continue;
        }
        age[i] += dt;
        const t = age[i] / LIFE;
        px[i] += (wind.x * 2.5 + 0.2) * dt;
        pz[i] += (wind.z * 2.5 + 0.1) * dt;
        py[i] += 2.2 * dt * (1 - t * 0.6);
        // swells as it rises, shrinks away at the end
        const r = size[i] * (1 + t * 3) * Math.min(1, (1 - t) * 3);
        m.compose(v.set(px[i], py[i], pz[i]), q, sc.set(r, r * 0.8, r));
        mesh.setMatrixAt(i, m);
      }
      mesh.instanceMatrix.needsUpdate = true;
    },
  };
}
