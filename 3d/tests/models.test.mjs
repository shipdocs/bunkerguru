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
    assert.ok(m.size.y > 20 && m.size.y < 200, `${name} height ${m.size.y}`);
    assert.ok(m.size.x < 400 && m.size.z < 400, `${name} footprint`);
    const p = m.body.attributes.position.array;
    assert.ok(p.every(Number.isFinite), `${name} finite`);
    assert.equal(m.body.attributes.color.count, m.body.attributes.position.count);
    assert.ok(m.body.attributes.position.count < 40000, `${name} light enough for a phone`);
  }
});

test('the towers have windows that light up at night', () => {
  for (const name of ['euromast', 'derotterdam', 'hotelny', 'whitehouse', 'markthal'])
    assert.ok(load(name).glow, name);
});

test('a broken file is refused, not half drawn', () => {
  assert.throws(() => parseGlb(new ArrayBuffer(16)));
});
