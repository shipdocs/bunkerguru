// Numbers behind bow spray, prop wash, thruster wash and the Kelvin wake.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  KELVIN_HALF_ANGLE,
  SPRAY_MIN_SPEED,
  FULL_SPEED,
  wakePools,
  wakeStrength,
  bowStrength,
  sprayRate,
  propWash,
  thrusterWash,
  kelvinHalfWidth,
  kelvinLength,
  createTrail,
} from '../src/game/wake.mjs';

test('bow wave and spray start above the threshold and grow with speed', () => {
  assert.equal(SPRAY_MIN_SPEED, 1.5);
  for (const v of [-3, 0, 1, 1.5]) {
    assert.equal(bowStrength(v), 0);
    assert.equal(sprayRate(v), 0);
  }
  assert.ok(sprayRate(1.8) > 0);
  assert.ok(sprayRate(3) > sprayRate(2));
  assert.ok(sprayRate(5) > sprayRate(3));
  assert.equal(bowStrength(FULL_SPEED), 1);
  assert.equal(bowStrength(40), 1);
  assert.equal(sprayRate(40), sprayRate(FULL_SPEED));
  assert.equal(sprayRate(FULL_SPEED, true), 0, 'phones skip the spray');
});

test('prop wash follows engine power, also at a standstill, and reverses astern', () => {
  assert.equal(propWash(0).rate, 0);
  assert.equal(propWash(0.1).strength, 0);
  assert.equal(propWash(undefined).rate, 0);
  const half = propWash(0.5),
    full = propWash(1),
    astern = propWash(-1);
  assert.ok(half.rate > 0 && full.rate > half.rate && full.speed > half.speed);
  assert.equal(full.dir, -1, 'ahead: thrown astern');
  assert.equal(astern.dir, 1, 'astern: thrown forward along the hull');
  assert.equal(astern.strength, full.strength);
  assert.equal(propWash(3).strength, 1);
  assert.ok(propWash(1, true).rate < full.rate && propWash(1, true).rate > 0);
});

test('thruster wash leaves on the side opposite to the push', () => {
  assert.equal(thrusterWash(1).side, -1);
  assert.equal(thrusterWash(-1).side, 1);
  assert.deepEqual(thrusterWash(0), { side: 0, rate: 0, speed: 0 });
  assert.ok(thrusterWash(1).rate > thrusterWash(1, true).rate);
});

test('Kelvin arms open at 19.5 degrees and reach further with speed', () => {
  assert.ok(Math.abs((KELVIN_HALF_ANGLE * 180) / Math.PI - 19.5) < 1e-9);
  const beam = 11,
    near = kelvinHalfWidth(20, beam),
    far = kelvinHalfWidth(120, beam);
  assert.ok(Math.abs((Math.atan2(far - near, 100) * 180) / Math.PI - 19.5) < 1e-6);
  assert.ok(kelvinHalfWidth(0, beam) <= beam / 2, 'arms start inside the stern');
  assert.equal(wakeStrength(0), 0);
  assert.equal(wakeStrength(-4), 0, 'no wake arms when going astern');
  assert.ok(wakeStrength(3) > wakeStrength(1) && wakeStrength(1) > 0);
  assert.equal(wakeStrength(FULL_SPEED + 2), 1);
  assert.equal(kelvinLength(110, 0), 0);
  assert.ok(kelvinLength(110, 1) > kelvinLength(110, 0.4));
  assert.ok(kelvinLength(110, 1) <= 110 * 2.4 + 1e-9);
});

test('pools are fixed and smaller on phones', () => {
  const rich = wakePools(false),
    light = wakePools(true);
  for (const p of [rich, light])
    for (const n of [p.spray, p.wash, p.trail])
      assert.ok(Number.isInteger(n) && n >= 0 && n <= 128);
  assert.equal(light.spray, 0);
  assert.ok(light.wash < rich.wash && light.trail < rich.trail);
  // Enough track for the longest arms of the 110 m ship.
  assert.ok(rich.trail * rich.spacing >= kelvinLength(110, 1));
});

test('the trail keeps the sailed track in a bounded ring, newest first', () => {
  const t = createTrail(8, 5);
  assert.equal(t.push(0, 0), true);
  assert.equal(t.push(1, 1), false, 'closer than the spacing: not stored');
  // A quarter turn to starboard: the stored points follow the curve.
  for (let i = 1; i <= 20; i++) t.push(Math.sin(i * 0.08) * 100, -(1 - Math.cos(i * 0.08)) * 100);
  assert.equal(t.count, 8, 'never grows past its size');
  assert.ok(Math.abs(t.x(0) - Math.sin(1.6) * 100) < 1e-3);
  for (let i = 1; i < t.count; i++) {
    const d = Math.hypot(t.x(i) - t.x(i - 1), t.z(i) - t.z(i - 1));
    assert.ok(d >= 5 && d < 12);
    assert.ok(t.x(i) < t.x(i - 1), 'older points lie further back along the track');
  }
  t.push(5000, 5000);
  assert.equal(t.count, 1, 'a jump (new game, fast travel) starts a new trail');
  t.clear();
  assert.equal(t.count, 0);
});
