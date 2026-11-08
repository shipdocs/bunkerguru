import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import legacy from './legacy-physics.cjs';
import { fresh } from '../src/game/simulation.mjs';
import { vesselStep, TELE, renderYaw } from '../src/game/vessel.mjs';
import { Vector3 } from '../vendor/three.js';
function oracle() {
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
    cargo: 500,
    target: 500,
    fatigue: 0,
  };
  const ctx = vm.createContext({
    boat: b,
    moored: false,
    state: { hitCD: 0 },
    WX: { wind: { x: 0, y: 0 } },
    EV: {},
    simClock: 0,
    RUD_MAX: 60,
    toPx: (m) => m,
    currentAt: () => ({ vx: 0, vy: 0 }),
    up: (k) => (k === 'motor' ? 6.2 : 1),
    SND: { clutch() {} },
  });
  vm.runInContext(legacy, ctx);
  return { b, tick: ctx.physics };
}
test('explicit legacy comparison matches original source over throttle, helm, release, reverse and bow-thruster sequence', () => {
  const s = {
      ...fresh(),
      handling: 'arcade',
      timeScale: 2,
      x: 0,
      z: 0,
      cargo: 500,
      target: 500,
      moored: false,
      timeScale: 3,
      shipId: 'legacy',
    },
    o = oracle();
  for (let i = 0; i < 4200; i++) {
    const dt = 1 / 60;
    s.teleIdx = i < 1800 ? 8 : i < 2400 ? 3 : 0;
    const keys = {
      right: i >= 300 && i < 360,
      left: i >= 1200 && i < 1320,
      bowL: i >= 2400 && i < 2700,
    };
    if (keys.left) o.b.rudderCmd = Math.max(-1, o.b.rudderCmd - dt);
    if (keys.right) o.b.rudderCmd = Math.min(1, o.b.rudderCmd + dt);
    o.b.bow = keys.bowL ? -1 : 0;
    o.b.tele = TELE[s.teleIdx];
    for (let j = 0; j < 3; j++) o.tick(dt);
    vesselStep(s, dt, keys, undefined, undefined, { legacy: true });
    for (const [a, b] of [
      [s.x, o.b.y],
      [s.z, -o.b.x],
      [s.h, o.b.hdg],
      [s.r, o.b.r],
      [s.rudder, o.b.rudder],
      [s.rpm, o.b.rpm],
    ])
      assert(Math.abs(a - b) < 1e-8, `${i}: ${a} != ${b}`);
  }
});
test('released partial helm stays set, opposite input adjusts it and explicit amidships centres it', () => {
  for (const sign of [-1, 1]) {
    const s = {
      ...fresh(),
      handling: 'arcade',
      timeScale: 2,
      timeScale: 1,
      x: 0,
      z: 0,
      moored: false,
      u: 4,
      rpm: 0.8,
      engDir: 1,
      teleIdx: 7,
    };
    for (let i = 0; i < 6; i++) vesselStep(s, 1 / 60, sign > 0 ? { right: true } : { left: true });
    const command = s.rudderCmd,
      h = s.h;
    assert(Math.abs(command - sign * 0.25) < 1e-9);
    for (let i = 0; i < 120; i++) vesselStep(s, 1 / 60);
    assert.equal(s.rudderCmd, command);
    assert(Math.abs(s.rudder - command) < 0.001);
    assert((s.h - h) * sign > 0.03);
    vesselStep(s, 1 / 60, sign > 0 ? { left: true } : { right: true });
    assert(Math.abs(s.rudderCmd) < Math.abs(command));
    s.rudderCmd = 0;
    for (let i = 0; i < 120; i++) vesselStep(s, 1 / 60);
    assert.equal(s.rudderCmd, 0);
    assert(Math.abs(s.rudder) < 0.001);
    assert(Math.abs(s.r) < 0.001);
    assert.equal(s.teleIdx, 7);
  }
});
test('Three.js bow points along simulation heading for both turns', () => {
  for (const h of [-2, -0.5, 0, 0.5, 2]) {
    const bow = new Vector3(0, 0, -1).applyAxisAngle(new Vector3(0, 1, 0), renderYaw(h));
    assert(Math.abs(bow.x - Math.sin(h)) < 1e-12);
    assert(Math.abs(bow.z + Math.cos(h)) < 1e-12);
  }
});
