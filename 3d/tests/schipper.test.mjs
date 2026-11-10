import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { fresh } from '../src/game/simulation.mjs';
import { vesselStep, TELE } from '../src/game/vessel.mjs';
import { simStep } from '../src/game/sim-vessel.mjs';
// The "schipper" handling must equal the physics of the live 2D game (engine.js),
// extracted from the file itself so both games can never drift apart unnoticed.
const engine = readFileSync(new URL('../../engine.js', import.meta.url), 'utf8');
const physicsSrc =
  engine.slice(engine.indexOf('function physics(dt) {'), engine.indexOf('  // botsingen')) + '}';
// 3D world frame: x east, z south. 2D canvas: boat.x = −z, boat.y = x.
const CUR = { x: 0.8, z: 0.3 };
function oracle({
  current = { x: 0, z: 0 },
  wind = { x: 0, z: 0 },
  cargo = 500,
  target = 500,
} = {}) {
  const b = {
    x: 0,
    y: 0,
    hdg: 0,
    vx: 0,
    vy: 0,
    r: 0,
    rudder: 0,
    rudderCmd: 0,
    tele: 0,
    rpm: 0,
    engDir: 0,
    startT: 0,
    bow: 0,
    L: 110,
    B: 11,
    cargo,
    target,
    fatigue: 0,
  };
  const ctx = vm.createContext({
    boat: b,
    moored: false,
    state: { hitCD: 0 },
    WX: { wind: { x: -wind.z, y: wind.x } },
    EV: {},
    simClock: 0,
    RUD_MAX: 60,
    toPx: (m) => m,
    currentAt: () => ({ vx: -current.z, vy: current.x }),
    up: (k) => (k === 'motor' ? 6.2 : 1),
    SND: { clutch() {} },
    land: [],
    berths: [],
    traffic: [],
    rivalQuads: () => [],
  });
  vm.runInContext(physicsSrc, ctx);
  return { b, tick: ctx.physics };
}
function run({ current, wind, cargo = 500, target = 500 }) {
  const s = { ...fresh(), x: 0, z: 0, h: 0, cargo, target, moored: false, timeScale: 3 },
    o = oracle({ current, wind, cargo, target }),
    env = {
      currentAt: () => current || { x: 0, z: 0 },
      wind,
      feel: { up: 1, down: 1 },
      helm: { start: 1, ramp: 0 },
    };
  for (let i = 0; i < 4200; i++) {
    const dt = 1 / 60;
    s.teleIdx = i < 1800 ? 8 : i < 2400 ? 3 : 0;
    const keys = {
      right: i >= 300 && i < 360,
      left: i >= 1200 && i < 1320,
      bowL: i >= 2400 && i < 2700,
    };
    // engine.js input(): rudder command 1/s in real time, once per frame.
    if (keys.left) o.b.rudderCmd = Math.max(-1, o.b.rudderCmd - dt);
    if (keys.right) o.b.rudderCmd = Math.min(1, o.b.rudderCmd + dt);
    o.b.bow = keys.bowL ? -1 : 0;
    o.b.tele = TELE[s.teleIdx];
    for (let j = 0; j < 3; j++) o.tick(dt);
    simStep(s, dt, keys, undefined, undefined, TELE[s.teleIdx], env);
    for (const [a, b, n] of [
      [s.x, o.b.y, 'x'],
      [s.z, -o.b.x, 'z'],
      [s.h, o.b.hdg, 'h'],
      [s.rudder, o.b.rudder, 'rudder'],
      [s.rpm, o.b.rpm, 'rpm'],
    ])
      assert(Math.abs(a - b) < 1e-6, `${i} ${n}: ${a} != ${b}`);
  }
  return s;
}
test('schipper handling equals engine.js physics in still water', () => run({}));
test('schipper handling equals engine.js physics with current and wind', () =>
  run({ current: CUR, wind: { x: -0.4, z: 0.6 }, cargo: 900, target: 1200 }));
test('full ahead reaches about 31 km/h and coasts on for a long way after STOP', () => {
  const s = { ...fresh(), x: 0, z: 0, h: 0, cargo: 0, moored: false, timeScale: 3, teleIdx: 8 };
  for (let i = 0; i < 60 * 60; i++) simStep(s, 1 / 60, {}, undefined, undefined, TELE[s.teleIdx]);
  const top = s.u * 3.6;
  assert(top > 28 && top < 34, 'top speed ' + top);
  s.teleIdx = 3;
  const z0 = s.z;
  for (let i = 0; i < 60 * 60 && s.u > 0.3; i++)
    simStep(s, 1 / 60, {}, undefined, undefined, TELE[s.teleIdx]);
  assert(z0 - s.z > 80, 'coasting distance ' + (z0 - s.z));
});
test('reversing goes through the clutch: no thrust while it changes over', () => {
  const s = { ...fresh(), x: 0, z: 0, h: 0, moored: false, timeScale: 3, teleIdx: 6 };
  const clutches = [];
  for (let i = 0; i < 60 * 20; i++)
    simStep(s, 1 / 60, {}, undefined, (r) => clutches.push(r), TELE[s.teleIdx]);
  s.teleIdx = 0;
  for (let i = 0; i < 60 * 30; i++)
    simStep(s, 1 / 60, {}, undefined, (r) => clutches.push(r), TELE[s.teleIdx]);
  assert.deepEqual(clutches, [false, true]);
  assert(s.rpm < 0);
});
test('a turning ship drifts outward (sideslip), unlike a car', () => {
  const s = {
    ...fresh(),
    x: 0,
    z: 0,
    h: 0,
    moored: false,
    timeScale: 3,
    teleIdx: 7,
    rudderCmd: 1,
    rudder: 1,
  };
  let maxV = 0;
  for (let i = 0; i < 60 * 30; i++) {
    simStep(s, 1 / 60, {}, undefined, undefined, TELE[s.teleIdx]);
    maxV = Math.min(maxV, s.v);
  }
  assert(maxV < -0.2, 'sideslip ' + maxV);
});
test('current carries a stopped ship; AFSTOPPEN uses the engine astern, then STOP', () => {
  const s = { ...fresh(), x: 0, z: 0, h: 0, moored: false, timeScale: 3 };
  for (let i = 0; i < 60 * 10; i++)
    simStep(s, 1 / 60, {}, undefined, undefined, 0, { currentAt: () => CUR });
  assert(s.x > 3 && s.z > 1, 'drift ' + s.x + ',' + s.z);
  const b = { ...fresh(), x: 0, z: 0, h: 0, moored: false, timeScale: 3, teleIdx: 8 };
  for (let i = 0; i < 60 * 40; i++) vesselStep(b, 1 / 60, {});
  b.braking = true;
  let astern = false;
  for (let i = 0; i < 60 * 120 && b.braking; i++) {
    vesselStep(b, 1 / 60, {});
    if (b.rpm < -0.05) astern = true;
  }
  assert(astern, 'used the engine astern');
  assert(!b.braking && b.teleIdx === 3 && Math.abs(b.u) < 0.3);
});

test('feel: picks up speed quicker and coasts longer than engine.js, same top speed', async () => {
  const { FEEL } = await import('../src/game/sim-vessel.mjs');
  const run = (feel) => {
    const s = { ...fresh(), x: 0, z: 0, h: 0, cargo: 0, moored: false, timeScale: 3, teleIdx: 8 };
    let t20 = 0;
    for (let i = 0; i < 60 * 60; i++) {
      simStep(s, 1 / 60, {}, undefined, undefined, TELE[s.teleIdx], { feel });
      if (i === 60 * 2) t20 = s.u;
    }
    const top = s.u;
    s.teleIdx = 3;
    const z0 = s.z;
    for (let i = 0; i < 60 * 60 && s.u > 0.3; i++)
      simStep(s, 1 / 60, {}, undefined, undefined, TELE[s.teleIdx], { feel });
    return { early: t20, top, coast: z0 - s.z };
  };
  const base = run({ up: 1, down: 1 }),
    game = run(FEEL);
  assert(game.early > base.early * 1.1, 'quicker off the mark');
  assert(Math.abs(game.top - base.top) < 0.05, 'same top speed');
  assert(game.coast > base.coast * 1.15, 'longer run-out after STOP');
});
test('engine off: the telegraph does nothing and the engine runs down', () => {
  const s = { ...fresh(), x: 0, z: 0, h: 0, moored: false, timeScale: 3, teleIdx: 8 };
  for (let i = 0; i < 60 * 20; i++) simStep(s, 1 / 60, {}, undefined, undefined, TELE[s.teleIdx]);
  assert(s.rpm > 0.5);
  s.engineOff = true;
  for (let i = 0; i < 60 * 10; i++) simStep(s, 1 / 60, {}, undefined, undefined, TELE[s.teleIdx]);
  assert(Math.abs(s.rpm) < 0.01, 'engine stopped');
});

test('feel keeps the point of balance with wind and rudder too', async () => {
  const { FEEL } = await import('../src/game/sim-vessel.mjs');
  const top = (feel) => {
    const s = {
      ...fresh(),
      x: 0,
      z: 0,
      h: 0,
      cargo: 0,
      moored: false,
      timeScale: 3,
      teleIdx: 7,
      rudder: 0.4,
      rudderCmd: 0.4,
    };
    for (let i = 0; i < 60 * 90; i++)
      simStep(s, 1 / 60, {}, undefined, undefined, TELE[s.teleIdx], {
        feel,
        wind: { x: 0.6, z: 0.6 },
      });
    return s.u;
  };
  assert(Math.abs(top(FEEL) - top({ up: 1, down: 1 })) < 0.05);
});
test('engine switched off while moored stays stopped after casting off', () => {
  const s = {
    ...fresh(),
    x: 0,
    z: 0,
    h: 0,
    moored: true,
    timeScale: 3,
    rpm: 0.6,
    engDir: 1,
    engineOff: true,
  };
  simStep(s, 1 / 60, {}, undefined, undefined, TELE[8]);
  assert.equal(s.rpm, 0);
});
