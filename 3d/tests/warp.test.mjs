// The warp that bends the river and leans the basins (src/maps/warp.mjs): exactly
// invertible, within the caps that keep the harbour sailable, and gentle at bridges.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createWarp,
  warpParams,
  HARBOUR_WARPS,
  STRESS_WARP,
  WARP_ENABLED,
  CAPS,
} from '../src/maps/warp.mjs';
import { buildClassic } from '../src/maps/classic-map.mjs';
import amsterdam from '../src/maps/classic/amsterdam.mjs';
import rotterdam from '../src/maps/classic/rotterdam.mjs';
import europoort from '../src/maps/classic/europoort.mjs';
import antwerpen from '../src/maps/classic/antwerpen.mjs';
import training from '../src/maps/classic/training.mjs';

const DEFS = { amsterdam, rotterdam, europoort, antwerpen };
const MAPS = Object.fromEntries(Object.entries(DEFS).map(([id, d]) => [id, buildClassic(d)]));
// Every harbour on its own warp, and every harbour on the stress warp.
const CASES = Object.keys(DEFS).flatMap((id) => [
  { id, name: id, map: MAPS[id], warp: createWarp(HARBOUR_WARPS[id], MAPS[id].riverHalf) },
  { id, name: id + ' (stress)', map: MAPS[id], warp: createWarp(STRESS_WARP, MAPS[id].riverHalf) },
]);
let seed = 12345;
const rnd = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;
const points = (map, n = 400) =>
  Array.from({ length: n }, () => ({
    x: (rnd() * 2 - 1) * (map.halfWidth + 150),
    z: map.zMin - 100 + rnd() * (map.zMax - map.zMin + 200),
  }));

test('every harbour has warp parameters, the practice voyage stays straight', () => {
  for (const id of Object.keys(DEFS)) assert.ok(HARBOUR_WARPS[id], id);
  assert.equal(HARBOUR_WARPS.training, undefined);
  assert.equal(warpParams('training'), null);
  assert.equal(buildClassic(training).warp.identity, true);
  for (const id of WARP_ENABLED) assert.ok(HARBOUR_WARPS[id], id);
  const flat = createWarp(null, 100);
  assert.deepEqual(flat.forward(12, -340), { x: 12, z: -340 });
  assert.deepEqual(flat.inverse(12, -340), { x: 12, z: -340 });
  assert.equal(flat.heading(5, 5, 1.2), 1.2);
});

test('forward and inverse are each other’s exact inverse (< 1e-6 m)', () => {
  for (const { name, map, warp } of CASES)
    for (const p of points(map)) {
      const w = warp.forward(p.x, p.z),
        back = warp.inverse(w.x, w.z),
        m = warp.inverse(p.x, p.z),
        again = warp.forward(m.x, m.z);
      assert.ok(Math.hypot(back.x - p.x, back.z - p.z) < 1e-6, name + ' forward→inverse');
      assert.ok(Math.hypot(again.x - p.x, again.z - p.z) < 1e-6, name + ' inverse→forward');
    }
});

test('the Jacobian matches the warp, keeps area and turns headings both ways', () => {
  for (const { name, map, warp } of CASES)
    for (const p of points(map, 150)) {
      const j = warp.jac(p.x, p.z),
        e = 1e-3,
        o = warp.forward(p.x, p.z),
        dx = warp.forward(p.x + e, p.z),
        dz = warp.forward(p.x, p.z + e);
      assert.ok(Math.abs((dx.x - o.x) / e - j.a) < 1e-3, name + ' ∂X/∂x');
      assert.ok(Math.abs((dx.z - o.z) / e - j.c) < 1e-3, name + ' ∂Z/∂x');
      assert.ok(Math.abs((dz.x - o.x) / e - j.b) < 1e-3, name + ' ∂X/∂z');
      assert.ok(Math.abs((dz.z - o.z) / e - j.d) < 1e-3, name + ' ∂Z/∂z');
      assert.ok(Math.abs(j.a * j.d - j.b * j.c - 1) < 1e-9, name + ' det J = 1');
      const h = rnd() * 6.28 - 3.14,
        wh = warp.heading(p.x, p.z, h),
        mh = warp.headingInverse(o.x, o.z, wh);
      assert.ok(Math.abs(Math.atan2(Math.sin(mh - h), Math.cos(mh - h))) < 1e-9, name + ' heading');
      // A normal stays perpendicular to the warped tangent.
      const t = warp.tangent(p.x, p.z, Math.cos(h), Math.sin(h)),
        n = warp.normal(p.x, p.z, -Math.sin(h), Math.cos(h));
      assert.ok(Math.abs(t.x * n.x + t.z * n.z) < 1e-9, name + ' normal ⟂ tangent');
      assert.ok(Math.abs(Math.hypot(n.x, n.z) - 1) < 1e-9, name + ' unit normal');
      for (const axis of ['x', 'z', 'affine']) {
        const f = warp.frame(p.x, p.z, axis);
        assert.ok(f.a * f.d - f.b * f.c > 0.9, name + ' frame ' + axis + ' keeps its hand');
      }
    }
});

test('caps: bend ≤ 0.25, lean ≤ 0.35, together ≤ 0.5, bend radius ≥ 3000 m', () => {
  for (const { name, map, warp } of CASES) {
    let bend = 0,
      lean = 0,
      sum = 0,
      curve = 0;
    for (let x = -map.halfWidth - 200; x <= map.halfWidth + 200; x += 5) {
      const fp = warp.fp(x);
      bend = Math.max(bend, Math.abs(fp));
      curve = Math.max(curve, Math.abs(warp.fpp(x)) / (1 + fp * fp) ** 1.5);
      // f″ against a finite difference, so the radius test tests the real course.
      const num = warp.f(x + 1) - 2 * warp.f(x) + warp.f(x - 1);
      assert.ok(Math.abs(num - warp.fpp(x)) < 1e-6, name + ' f″ at ' + x);
    }
    for (let z = map.zMin; z <= map.zMax; z += 5) lean = Math.max(lean, Math.abs(warp.gp(z)));
    for (const p of points(map, 300)) {
      const j = warp.jac(p.x, p.z);
      sum = Math.max(sum, Math.abs(j.b) + Math.abs(j.c));
    }
    assert.ok(bend <= CAPS.bend + 1e-9, name + ' bend ' + bend.toFixed(3));
    assert.ok(lean <= CAPS.lean + 1e-9, name + ' lean ' + lean.toFixed(3));
    assert.ok(sum <= CAPS.sum + 1e-9, name + ' bend + lean ' + sum.toFixed(3));
    assert.ok(1 / curve >= CAPS.radius, name + ' bend radius ' + Math.round(1 / curve) + ' m');
    // The river itself only bends: no lean between the banks.
    for (let z = -map.riverHalf; z <= map.riverHalf; z += 10) assert.equal(Math.abs(warp.gp(z)), 0);
  }
});

test('every basin keeps an entrance of at least 55 m for a 110 m tanker', () => {
  for (const { name, map, warp } of CASES)
    for (const b of map.basins) {
      let width = Infinity;
      for (let z = b.z0; z <= b.z1; z += 10)
        for (const x of [b.x0, (b.x0 + b.x1) / 2, b.x1])
          width = Math.min(width, (b.x1 - b.x0) / warp.normal(x, z, 1, 0).scale);
      assert.ok(
        width >= CAPS.entrance,
        name + ' ' + b.name + ': ' + width.toFixed(1) + ' m (map ' + (b.x1 - b.x0) + ' m)',
      );
    }
});

test('the river runs straight across under every bridge and lock', () => {
  for (const id of Object.keys(DEFS)) {
    const map = MAPS[id],
      warp = createWarp(HARBOUR_WARPS[id], map.riverHalf);
    for (const br of map.bridges)
      assert.ok(
        Math.abs(warp.fp(br.x)) < 0.03,
        id + ' ' + br.name + ' ' + warp.fp(br.x).toFixed(3),
      );
  }
});

test('saves: an older career keeps money, jobs and upgrades; a version 5 position is carried into the warped harbour', async () => {
  const { restore, fresh, STATE_VERSION } = await import('../src/game/state.mjs');
  const { MAP, worldPose, waterAt } = await import('../src/maps/index.mjs');
  assert.equal(STATE_VERSION, 6);
  const career = { gold: 4321, jobs: 17, earned: 9000, xp: 2600, lvl: { motor: 2, boeg: 1 } };
  // Version 5: sailed on the straight map. Same spot on the river, now in the world.
  const at = { x: MAP.mstart.x, z: MAP.mstart.z, h: MAP.mstart.h },
    v5 = restore({ ...career, version: 5, mapId: MAP.id, ...at, cargo: 300, phase: 'free' }),
    w = worldPose(at);
  assert.equal(v5.version, 6);
  assert.deepEqual([v5.gold, v5.jobs, v5.lvl.motor, v5.lvl.boeg], [4321, 17, 2, 1]);
  assert.ok(Math.hypot(v5.x - w.x, v5.z - w.z) < 1e-9 && Math.abs(v5.h - w.h) < 1e-9);
  assert.equal(v5.cargo, 300);
  assert.ok(waterAt(v5.x, v5.z, 4));
  // Older still (or another map): the career survives, the boat starts at its berth.
  const v4 = restore({ ...career, version: 4, mapId: MAP.id, x: 1, z: 2, cargo: 300 });
  assert.deepEqual([v4.gold, v4.jobs, v4.lvl.motor], [4321, 17, 2]);
  assert.deepEqual([v4.x, v4.z, v4.cargo], [fresh().x, fresh().z, 0]);
  // Version 6 positions are world positions and come back as saved.
  const v6 = restore({ ...career, version: 6, mapId: MAP.id, x: w.x, z: w.z, h: 1 });
  assert.deepEqual([v6.x, v6.z, v6.h], [w.x, w.z, 1]);
});
