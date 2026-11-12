import * as T from '../../vendor/three.js';
import { landAt } from '../maps/index.mjs';
// A crane at work beside every moored customer ship: a portal crane on the quay, its
// trolley running out over the hold, the hook coming up with a container, swinging it
// ashore onto a lorry that then drives off along the quay and comes back empty. Only
// the cranes near the player are drawn; the rest wait hidden.
export const CYCLE = 48; // seconds for one container
const GROUND = 4; // top of the quay

const smooth = (a, b, t) => {
  const k = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return k * k * (3 - 2 * k);
};
// Where things are at time t of the cycle (0…CYCLE): trolley out (0 = over the lorry,
// 1 = over the ship), hook height (0 = up, 1 = down), load on the hook, lorry along
// the quay (metres from the crane, 0 = under it) and whether it carries a box.
export function craneState(t) {
  const out = smooth(0, 6, t) * (1 - smooth(14, 20, t)),
    down = smooth(6, 10, t) * (1 - smooth(10, 14, t)) + smooth(20, 24, t) * (1 - smooth(24, 27, t)),
    hooked = t >= 10 && t < 24,
    lorry =
      t < 8 ? -170 : t < 18 ? -170 * (1 - smooth(8, 18, t)) : t < 26 ? 0 : 230 * smooth(26, 38, t),
    loaded = t >= 24;
  return { out, down, hooked, lorry, loaded };
}

const mat = (c) => new T.MeshLambertMaterial({ color: c });
const box = (w, h, d, m, parent, x = 0, y = 0, z = 0) => {
  const b = new T.Mesh(new T.BoxGeometry(w, h, d), m);
  b.position.set(x, y, z);
  b.castShadow = true;
  parent.add(b);
  return b;
};

// One crane beside ship `c` (shipX, shipZ, h, beam, away = unit normal from the quay to
// the water): local +x points to the water, +z along the quay.
function buildCrane(c, i) {
  const g = new T.Group(),
    B = c.beam,
    fromWall = B / 2 + 1,
    wallX = c.shipX - c.away.x * fromWall,
    wallZ = c.shipZ - c.away.z * fromWall,
    // a little aft of the middle, or wherever along her all its legs stand on the quay
    along =
      c.length *
      ([0.18, 0, 0.3, -0.18, -0.3].find((f) =>
        [2, 9, 16].every((back) =>
          landAt(
            wallX + Math.sin(c.h) * c.length * f - c.away.x * back,
            wallZ - Math.cos(c.h) * c.length * f - c.away.z * back,
          ),
        ),
      ) ?? 0.18);
  g.position.set(wallX + Math.sin(c.h) * along, GROUND, wallZ - Math.cos(c.h) * along);
  // local +x along away, local +z along the ship's heading
  g.rotation.y = Math.atan2(-c.away.z, c.away.x);
  g.name = 'working crane';
  const steel = mat(i % 2 ? '#2f6fb0' : '#c8452f'),
    dark = mat('#2b3136'),
    boxCol = mat(['#e67e22', '#27ae60', '#2980b9', '#c0392b', '#8e44ad'][i % 5]);
  const reachIn = -22,
    reachOut = fromWall + B / 2 + 10,
    top = 34;
  for (const x of [-16, -2]) for (const z of [-9, 9]) box(1.4, top, 1.4, steel, g, x, top / 2, z);
  for (const z of [-9, 9])
    box(reachOut - reachIn, 2.2, 1.6, steel, g, (reachIn + reachOut) / 2, top, z);
  box(16, 1.6, 20, steel, g, -9, top - 6, 0);
  box(6, 4, 6, dark, g, -9, top + 3, 0); // machinery house
  const trolley = box(4, 2, 19, dark, g, 0, top - 1.6, 0),
    cable = box(0.25, 1, 0.25, dark, g, 0, top, 0),
    spreader = box(12.5, 0.6, 2.8, dark, g, 0, top, 0),
    load = box(12.2, 2.6, 2.5, boxCol, g, 0, 0, 0);
  load.rotation.y = Math.PI / 2;
  spreader.rotation.y = Math.PI / 2;
  // The lorry: cab and flatbed, on the lane under the crane's legs, with its own box.
  const lorry = new T.Group(),
    lane = -9;
  box(2.6, 3, 3.2, mat('#f1c40f'), lorry, 0, 1.9, 7.5);
  box(2.6, 1, 13, dark, lorry, 0, 0.9, -1);
  const onLorry = box(2.5, 2.6, 12.2, boxCol, lorry, 0, 2.7, -1);
  lorry.position.set(lane, 0, 0);
  g.add(lorry);
  return {
    g,
    x: g.position.x,
    z: g.position.z,
    phase: (i * 17) % CYCLE,
    update(t) {
      const s = craneState((t + this.phase) % CYCLE),
        tx = lane + (fromWall - lane) * s.out,
        deckY = -GROUND + 7, // the ship's deck, above the water
        bedY = 3.2,
        lowY = s.out > 0.5 ? deckY : bedY,
        hookY = top - 3 - (top - 3 - lowY - 2.6) * s.down;
      trolley.position.x = tx;
      spreader.position.set(tx, hookY + 2.9, 0);
      const len = top - 1.6 - (hookY + 3.2);
      cable.scale.y = Math.max(0.1, len);
      cable.position.set(tx, hookY + 3.2 + len / 2, 0);
      load.visible = s.hooked;
      load.position.set(tx, hookY + 1.3, 0);
      lorry.position.z = s.lorry;
      lorry.visible = Math.abs(s.lorry) < 200;
      onLorry.visible = s.loaded;
    },
  };
}

export function createWorkingCranes(scene, customers) {
  const cranes = customers.filter((c) => c.away && c.beam).map(buildCrane);
  for (const c of cranes) scene.add(c.g);
  return {
    cranes,
    update(time, player, range = 1500) {
      for (const c of cranes) {
        c.g.visible = Math.hypot(c.x - player.x, c.z - player.z) < range;
        if (c.g.visible) c.update(time);
      }
    },
  };
}
