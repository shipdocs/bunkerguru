import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseGlb, MODEL_NAMES } from '../src/render/models.mjs';

const load = (name) => {
  const b = readFileSync(new URL(`../assets/landmarks/${name}.glb`, import.meta.url));
  return parseGlb(b.buffer.slice(b.byteOffset, b.byteOffset + b.length));
};

test('every Blender building loads, stands on the ground and has a sane size', () => {
  for (const name of MODEL_NAMES) {
    const m = load(name),
      box = m.body.boundingBox;
    assert.ok(Math.abs(box.min.y) < 0.5, `${name} stands on the ground (${box.min.y})`);
    assert.ok(m.size.y > 20 && m.size.y < 260, `${name} height ${m.size.y}`);
    assert.ok(m.size.x < 400 && m.size.z < 400, `${name} footprint`);
    const p = m.body.attributes.position.array;
    assert.ok(p.every(Number.isFinite), `${name} finite`);
    assert.equal(m.body.attributes.color.count, m.body.attributes.position.count);
    assert.ok(m.body.attributes.position.count < 40000, `${name} light enough for a phone`);
  }
});

test('the towers have windows that light up at night', () => {
  for (const name of [
    'euromast',
    'derotterdam',
    'hotelny',
    'whitehouse',
    'markthal',
    'maassilo',
    'laurenskerk',
    'zalmhaventoren',
    'dekuip',
  ])
    assert.ok(load(name).glow, name);
});

test('a broken file is refused, not half drawn', () => {
  assert.throws(() => parseGlb(new ArrayBuffer(16)));
});

test('a map only waits for the buildings it shows', async () => {
  const { modelsNeeded } = await import('../src/render/landmarks.mjs');
  const { MAP } = await import('../src/maps/index.mjs');
  const need = modelsNeeded();
  if (MAP.id === 'rotterdam') assert.ok(need.includes('euromast') && need.includes('erasmusbrug'));
  assert.deepEqual(modelsNeeded('europoort'), ['maeslantkering']);
  assert.deepEqual(modelsNeeded('training'), []);
  assert.ok(modelsNeeded('rotterdam').includes('euromast'));
  // the Amsterdam grain silo keeps its own shape: the Maassilo model is Rotterdam's
  assert.ok(!modelsNeeded('amsterdam').includes('maassilo'));
});

test('the cruise ships lie against their quay and block the water', async () => {
  const { MAP } = await import('../src/maps/index.mjs');
  const real = (await import('../src/maps/real-map.mjs')).buildReal;
  const def = (await import('../src/maps/real/rotterdam.mjs')).default;
  const map = MAP.id === 'rotterdam' ? MAP : real(def);
  assert.equal(map.liners.length, 2);
  for (const l of map.liners) {
    assert.ok(map.shape.inside(l.shipX, l.shipZ), `${l.name} afloat`);
    // the quay is half a beam away, the far side of the hull is open water
    assert.ok(map.shape.sdist(l.shipX, l.shipZ) < l.beam, `${l.name} alongside`);
    for (const t of [-0.45, 0, 0.45]) {
      const x = l.shipX + Math.sin(l.h) * l.length * t,
        z = l.shipZ - Math.cos(l.h) * l.length * t;
      assert.ok(map.shape.inside(x, z), `${l.name} lies in the water over her whole length`);
    }
  }
  // the customer moored across the Merwehaven leaves a way through past the cruise ship
  const hull = (c, L, B, h) =>
    [-0.5, -0.25, 0, 0.25, 0.5].flatMap((t) =>
      [-0.5, 0.5].map((w) => [
        c.shipX + Math.sin(h) * L * t + Math.cos(h) * B * w,
        c.shipZ - Math.cos(h) * L * t + Math.sin(h) * B * w,
      ]),
    );
  const opvang = map.liners[0],
    merwe = map.customers.find((b) => b.name === 'MV MERWEHAVEN'),
    a1 = hull(opvang, opvang.length, opvang.beam, opvang.h),
    a2 = hull(merwe, merwe.length, merwe.beam + 30, merwe.h); // with the bunker boat alongside
  const gap = Math.min(...a1.flatMap(([x, z]) => a2.map(([u, v]) => Math.hypot(x - u, z - v))));
  assert.ok(gap > 25, `way through ${gap.toFixed(0)} m`);
});
