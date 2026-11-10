import { HARBOR } from '../src/game/harbor.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Shape } from '../vendor/three.js';
import { PROFILES, profileOf, hullOutline } from '../src/game/ship-profile.mjs';
import { fresh } from '../src/game/simulation.mjs';
import { vesselStep } from '../src/game/vessel.mjs';
import { hullContacts } from '../src/game/collisions.mjs';
test('current boat has the original 110 x 11 m dimensions; profile controls the actual rendered hull beam', () => {
  assert.equal(profileOf(fresh()).length, 110);
  assert.equal(profileOf(fresh()).beam, 11);
  assert.equal(profileOf(fresh()).tankCapacity, 1200);
  for (const p of Object.values(PROFILES)) {
    const shape = new Shape();
    for (const [m, ...a] of hullOutline(p)) shape[m](...a);
    const points = shape.getPoints(80);
    assert(
      Math.abs(Math.max(...points.map((p) => p.x)) - Math.min(...points.map((p) => p.x)) - p.beam) <
        1e-9,
    );
  }
});
test('longer ships inherit proportionally slower yaw under identical helm and flow', () => {
  const states = Object.keys(PROFILES).map((shipId) => ({
    ...fresh(),
    handling: 'arcade',
    timeScale: 2,
    shipId,
    moored: false,
    x: 0,
    z: 0,
    u: 4,
    rudder: 1,
    rudderCmd: 1,
  }));
  for (const s of states) vesselStep(s, 0.01);
  assert(states[0].r > states[1].r && states[1].r > states[2].r);
  assert(states[0].r / states[1].r > 1 && states[0].r / states[1].r < 1.3);
});
test('long hull reaches quay earlier, without changing input constants', () => {
  const a = {
      ...fresh(),
      handling: 'arcade',
      timeScale: 2,
      shipId: 'compact',
      x: HARBOR.halfWidth - 27,
      z: 0,
      h: Math.PI / 2,
    },
    b = { ...a, shipId: 'legacy' };
  hullContacts(a, 0.01);
  hullContacts(b, 0.01);
  assert.equal(a.x, HARBOR.halfWidth - 27);
  assert(b.x < HARBOR.halfWidth - 27);
});
test('sliding along a wall preserves tangential speed', () => {
  const s = {
    ...fresh(),
    handling: 'arcade',
    timeScale: 2,
    x: HARBOR.halfWidth - 2,
    z: 0,
    h: 0,
    u: 3,
    v: 1,
  };
  hullContacts(s, 0.01);
  assert(Math.abs(s.u - 3) < 1e-12);
  assert(s.v <= 0);
  assert(s.x <= HARBOR.halfWidth - 3.75);
});
test('1x and 3x remain distinct, while new careers default to playable 2x', () => {
  const a = {
      ...fresh(),
      handling: 'arcade',
      timeScale: 2,
      timeScale: 1,
      moored: false,
      x: 0,
      z: 0,
      h: 0,
      u: 4,
      rudder: 1,
      rudderCmd: 1,
    },
    b = { ...a, timeScale: 3 };
  for (let i = 0; i < 60; i++) {
    vesselStep(a, 1 / 60, { right: true });
    vesselStep(b, 1 / 60, { right: true });
  }
  assert(b.h > a.h * 2);
  assert.equal(fresh().timeScale, 3);
});
