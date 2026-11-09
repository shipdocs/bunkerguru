import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextCamera, followYaw, cameraPose, bridgeEye, bridgeDir } from '../src/render/camera.mjs';
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
  assert.equal(nextCamera('top'), 'bridge');
  assert.equal(nextCamera('bridge'), 'follow');
  for (const mode of ['free', 'top']) {
    const p = cameraPose({ x: 20, z: 40, h: 1, u: 4 }, mode, 0.6, 0.65, 100);
    assert.equal(p.focus.x, 20);
    assert.equal(p.focus.z, 40);
    if (mode === 'top') assert(p.position.y > 99);
  }
});

test('wheelhouse eye: behind the bow, in front of the window, above the deck', () => {
  const p = { length: 110, beam: 11 };
  const e = bridgeEye(p, 0);
  assert(e.z > 0 && e.z < 0.229 * 110, 'aft of midships, just forward of the window');
  assert(e.y > 3 + 3.4 && e.y < 3 + 5.8, 'standing height inside the wheelhouse');
  const port = bridgeEye(p, -1),
    stbd = bridgeEye(p, 1);
  assert(port.x < -5.5 && stbd.x > 5.5, 'wings outside the hull side');
  // Port wing looks to port (−x), starboard to +x; straight ahead is −z.
  assert(bridgeDir(port.yaw, 0).x < -0.8);
  assert(bridgeDir(stbd.yaw, 0).x > 0.8);
  assert(bridgeDir(0, 0).z < -0.99);
});
