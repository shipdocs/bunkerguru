// The harbours as places: landmarks per map, budgets, weather and rival manners.
globalThis.BUNKERGURU_MAP = 'rotterdam';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const { createEvents, weatherTick, windOf, WINDS } = await import('../src/game/events.mjs');
const { updateRivals } = await import('../src/game/rivals.mjs');

const tool = fileURLToPath(new URL('./tools/scenery-run.mjs', import.meta.url));
for (const id of ['amsterdam', 'rotterdam', 'europoort', 'antwerpen'])
  test(`${id}: landmarks stand on land, clear of berths, within the triangle budget`, () => {
    const r = spawnSync(process.execPath, [tool], {
      env: { ...process.env, BUNKERGURU_MAP: id },
      encoding: 'utf8',
    });
    assert.equal(r.status, 0, r.stderr);
    const out = JSON.parse(r.stdout.trim().split('\n').pop());
    assert.deepEqual(out.problems, []);
    assert(out.landmarks >= 12, 'a harbour you can recognise');
    assert(out.landmarkTriangles < 40000);
    assert(out.scenery.triangles < 560000);
  });

test('weather: a new picture every 8–15 minutes, wind felt from 4 Bft, reported on VHF', () => {
  const ev = createEvents(),
    said = [],
    radio = [];
  const fx = { say: (t) => said.push(t), radio: (l) => radio.push(l) };
  assert.equal(windOf(ev), null, 'calm at the start');
  // rnd sequence: next, kind (0.95 = squalls), direction (0.25 → east), force
  const seq = [0.5, 0.95, 0.25, 0.9];
  weatherTick(ev, ev.wx.next + 1, fx, () => seq.shift());
  assert.equal(ev.wx.kind, 'buien');
  assert.equal(ev.wx.dir, WINDS[2]);
  assert.equal(ev.wx.bft, 7);
  // Wind from the east pushes west (−x), nothing across.
  assert(ev.wx.wind.x < -0.6 && Math.abs(ev.wx.wind.z) < 1e-9);
  assert(ev.wx.next >= 480 && ev.wx.next <= 900);
  assert.match(radio[0][0].text, /Weerbericht: wind O 7, buien, harde vlagen/);
  assert.equal(said.length, 1);
  // A gust from an incident adds to the standing wind.
  ev.wind = { x: 0.2, z: 0.5, T: 10 };
  const w = windOf(ev);
  assert(Math.abs(w.x - (ev.wx.wind.x + 0.2)) < 1e-9 && Math.abs(w.z - 0.5) < 1e-9);
  // Light air moves nothing.
  const calm = createEvents();
  weatherTick(calm, calm.wx.next + 1, {}, () => 0.1);
  assert.equal(calm.wx.kind, 'helder');
  assert.equal(windOf(calm), null);
});

test('a rival under way sounds the horn once when the player is close ahead', () => {
  const sounds = [];
  const fx = { sound: (n) => sounds.push(n), radio() {}, say() {} };
  const player = { x: 0, z: -120, phase: 'sail', job: null };
  // Heading north (h = 0, forward = −z), the player 120 m ahead.
  const r = { name: 'Bunker Bert', x: 0, z: 0, h: 0, cur: 3, mode: 'idle', wait: 99, damage: 0 };
  updateRivals([r], 1 / 60, player, [], fx);
  updateRivals([r], 1 / 60, player, [], fx);
  assert.deepEqual(sounds, ['horn'], 'one blast per meeting');
  // Abeam or astern: no horn. Far away resets the meeting.
  const q = { ...r, honked: false };
  updateRivals([q], 1 / 60, { ...player, z: 120 }, [], fx);
  assert.equal(sounds.length, 1);
  updateRivals([r], 1 / 60, { ...player, z: -900 }, [], fx);
  assert.equal(r.honked, false);
});
