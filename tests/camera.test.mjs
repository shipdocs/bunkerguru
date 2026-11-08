import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextCamera, followYaw, cameraPose } from '../src/render/camera.mjs';
test('follow camera stays astern and aims forward at all headings', () => {
  for (const h of [0, Math.PI / 2, Math.PI, -Math.PI / 2, 5.9]) {
    const s = { x: 35, z: 80, h, u: 4 },
      p = cameraPose(s, 'follow', -h, 0.65, 160),
      f = { x: Math.sin(h), z: -Math.cos(h) };
    assert((p.position.x - s.x) * f.x + (p.position.z - s.z) * f.z < 0);
    assert((p.focus.x - s.x) * f.x + (p.focus.z - s.z) * f.z > 0);
    assert(p.position.y > 40);
  }
});
test('heading wrap takes shortest turn, not a full orbit', () => {
  const y = followYaw(Math.PI - 0.01, Math.PI - 0.01, 1 / 60);
  assert(Math.abs(y - (Math.PI - 0.01)) < 0.01);
});
test('smoothing is independent of frame rate', () => {
  let a = 0,
    b = 0;
  for (let i = 0; i < 60; i++) a = followYaw(a, 1, 1 / 60);
  for (let i = 0; i < 30; i++) b = followYaw(b, 1, 1 / 30);
  assert(Math.abs(a - b) < 1e-12);
});
test('camera modes cycle and top/free do not look ahead', () => {
  assert.equal(nextCamera('follow'), 'free');
  assert.equal(nextCamera('free'), 'top');
  assert.equal(nextCamera('top'), 'follow');
  for (const mode of ['free', 'top']) {
    const p = cameraPose({ x: 20, z: 40, h: 1, u: 4 }, mode, 0.6, 0.65, 100);
    assert.equal(p.focus.x, 20);
    assert.equal(p.focus.z, 40);
    if (mode === 'top') assert(p.position.y > 99);
  }
});
