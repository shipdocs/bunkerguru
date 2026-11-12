import { test } from 'node:test';
import assert from 'node:assert/strict';
import { radarProject, bearing, RANGES } from '../src/ui/radar.mjs';

test('heading up: what lies ahead is drawn straight above the ship', () => {
  for (const h of [0, 1, 2.5, -2]) {
    const s = { x: 100, z: -50, h },
      ahead = radarProject(s, 1, 0, 0, s.x + Math.sin(h) * 200, s.z - Math.cos(h) * 200),
      starboard = radarProject(s, 1, 0, 0, s.x + Math.cos(h) * 50, s.z + Math.sin(h) * 50);
    assert.ok(Math.abs(ahead[0]) < 1e-9 && Math.abs(ahead[1] + 200) < 1e-9, 'ahead is up');
    assert.ok(
      Math.abs(starboard[0] - 50) < 1e-9 && Math.abs(starboard[1]) < 1e-9,
      'starboard right',
    );
  }
});

test('compass readings and ranges', () => {
  assert.equal(bearing(0), '000');
  assert.equal(bearing(Math.PI / 2), '090');
  assert.equal(bearing(-Math.PI / 2), '270');
  assert.deepEqual(
    RANGES,
    [...RANGES].sort((a, b) => a - b),
  );
});
