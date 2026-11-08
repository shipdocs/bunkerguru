import { test } from 'node:test';
import assert from 'node:assert/strict';
import { basins, turningAreas, waterAt } from '../src/maps/amsterdam.mjs';
import { fresh, restore } from '../src/game/simulation.mjs';
import { terminal, berths, trafficAt } from '../src/game/harbor.mjs';
import { hullContacts } from '../src/game/collisions.mjs';
import { hullSamples, PROFILES, profileOf } from '../src/game/ship-profile.mjs';
import { cameraRange, cameraPose } from '../src/render/camera.mjs';

test('canal narrows locally while each basin has its own entrance and inner widths', () => {
  assert(!waterAt(240, 120));
  assert(!waterAt(240, -120));
  assert(waterAt(240, 85));
  assert(waterAt(-2100, 120));
  assert.equal(Math.min(...basins.map((b) => b.sections[0].width)), 60);
  assert.equal(Math.max(...basins.flatMap((b) => b.sections.map((p) => p.width))), 420);
  for (const b of basins) assert(b.sections.at(-1).width > b.sections[0].width, b.name);
});
test('the full 110 m hull clears every entrance along its centreline, not just its centre point', () => {
  for (const b of basins) {
    const x = (b.x0 + b.x1) / 2;
    for (let z = 0; z < 335; z += 5) {
      const pz = b.z0 > 0 ? z : -z;
      const s = { ...fresh(), x, z: pz, h: 0 };
      const before = { x: s.x, z: s.z };
      hullContacts(s, 0);
      assert(Math.hypot(s.x - before.x, s.z - before.z) < 1e-8, b.name + ' at ' + pz);
    }
  }
});
test('working harbours provide a collision-free turning area for every heading', () => {
  for (const t of turningAreas)
    for (let h = 0; h < Math.PI * 2; h += Math.PI / 72) {
      const s = { ...fresh(), x: t.x, z: t.z, h };
      hullContacts(s, 0);
      assert(Math.hypot(s.x - t.x, s.z - t.z) < 1e-8, basins[t.basin].name + ' heading ' + h);
    }
});
test('moving traffic fits narrowed waterways over its full length and beam', () => {
  for (let t = 0; t < 2000; t += 5)
    for (const b of trafficAt(t))
      for (let f = -0.5; f <= 0.5; f += 0.1) {
        const x = b.x + Math.sin(b.h) * b.length * f,
          z = b.z - Math.cos(b.h) * b.length * f;
        assert(waterAt(x, z, b.beam / 2 + 1), b.name + ' at ' + t);
      }
});
test('hull probe spacing does not leave holes when the boat becomes longer', () => {
  for (const p of Object.values(PROFILES)) {
    const samples = hullSamples(p);
    for (let i = 1; i < samples.length; i++)
      assert((samples[i] - samples[i - 1]) * p.length < p.beam);
  }
});
test('existing careers migrate to a safe terminal with cargo, rewards and upgrades intact', () => {
  const raw = {
    ...fresh(),
    shipId: 'compact',
    mapVersion: 3,
    x: -268,
    z: 625,
    cargo: 500,
    phase: 'deliver',
    gold: 4567,
    jobs: 3,
    level: 2,
    reputation: 71,
    elapsed: 300,
    moored: false,
  };
  const s = restore(raw);
  assert.equal(s.shipId, 'legacy');
  assert.equal(profileOf(s).tankCapacity, 1200);
  assert.equal(s.x, terminal.x);
  assert.equal(s.z, terminal.z);
  assert(s.moored);
  assert.equal(s.elapsed, 0);
  for (const k of ['cargo', 'phase', 'gold', 'jobs', 'level', 'reputation'])
    assert.equal(s[k], raw[k]);
  const before = { x: s.x, z: s.z };
  hullContacts(s, 0);
  assert.equal(s.x, before.x);
  assert.equal(s.z, before.z);
  const b = berths[2],
    saved = restore({ ...fresh(), phase: 'deliver', berthIndex: 2, x: b.x, z: b.z, h: b.h });
  assert.equal(saved.x, b.x);
  assert.equal(saved.z, b.z);
});
test('camera range and look-ahead scale with the actual ship dimensions', () => {
  const small = cameraRange(PROFILES.compact),
    long = cameraRange(PROFILES.legacy);
  assert(long.min > PROFILES.legacy.length);
  assert(long.initial > small.initial);
  assert(long.max > long.initial);
  const s = { ...fresh(), x: 0, z: 0, u: 3, h: 0 },
    p = cameraPose(s, 'follow', 0, 0.48, long.initial);
  assert(-p.focus.z > PROFILES.legacy.length / 2 - 1);
});
