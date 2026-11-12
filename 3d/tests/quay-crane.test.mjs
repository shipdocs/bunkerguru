import { test } from 'node:test';
import assert from 'node:assert/strict';
globalThis.BUNKERGURU_MAP = 'rotterdam';
const T = await import('../vendor/three.js');
const { craneState, createWorkingCranes, CYCLE } = await import('../src/render/quay-crane.mjs');
const { customers, SHAPE } = await import('../src/maps/index.mjs');

test('one container per cycle: out over the hold, up, ashore, onto the lorry, away', () => {
  assert.equal(craneState(0).out, 0);
  assert.ok(craneState(9).out > 0.99 && craneState(9).down > 0.5, 'hook down in the hold');
  assert.ok(craneState(16).hooked, 'box on the hook');
  assert.ok(craneState(22).out < 0.01 && craneState(22).lorry === 0, 'over the waiting lorry');
  assert.ok(craneState(30).loaded && craneState(30).lorry > 0, 'the lorry drives off loaded');
  assert.ok(craneState(CYCLE - 0.1).lorry > 200, 'gone before the next one');
});

test('every customer ship gets a crane standing on her quay, drawn only near the player', () => {
  const w = createWorkingCranes(new T.Scene(), customers);
  assert.equal(w.cranes.length, customers.length);
  // its legs stand 2 to 16 m back from the wall, on the quay
  w.cranes.forEach((c, i) => {
    const a = customers[i].away;
    for (const back of [2, 9, 16])
      assert.ok(
        !SHAPE.inside(c.x - a.x * back, c.z - a.z * back),
        `${customers[i].name}: leg on the quay`,
      );
  });
  const first = w.cranes[0];
  w.update(10, { x: first.x, z: first.z });
  assert.ok(first.g.visible);
  w.update(10, { x: first.x + 5000, z: first.z });
  assert.ok(!first.g.visible);
});
