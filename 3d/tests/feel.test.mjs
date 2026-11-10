import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fresh, restore } from '../src/game/state.mjs';
import { simStep } from '../src/game/sim-vessel.mjs';
import { TELE } from '../src/game/telegraph.mjs';
import { feelOf, nextInertia, nextCurrent, currentOf } from '../src/game/feel-settings.mjs';

// Game seconds from rest to 95 % of the top speed at this telegraph setting.
function gatherWay(inertia, load, tele = 8) {
  const make = () => ({
    ...fresh(),
    x: 0,
    z: 0,
    h: 0,
    moored: false,
    timeScale: 1,
    teleIdx: tele,
    cargo: load * 1000,
    target: 1000,
    inertia,
  });
  const top = make();
  for (let i = 0; i < 20 * 1200; i++)
    simStep(top, 1 / 20, {}, undefined, undefined, TELE[tele], { feel: { up: 1, down: 1 } });
  const s = make(),
    feel = feelOf(s);
  let t = 0;
  while (s.u < 0.95 * top.u && t < 2000) {
    simStep(s, 1 / 20, {}, undefined, undefined, TELE[tele], { feel });
    t += 1 / 20;
  }
  return { t, top: top.u, u: s.u };
}
test('real inertia: full ahead takes about 1 minute empty and 4 minutes laden, in game time', () => {
  const empty = gatherWay('echt', 0),
    laden = gatherWay('echt', 1);
  assert(empty.t > 50 && empty.t < 70, 'empty ' + empty.t);
  assert(laden.t > 210 && laden.t < 270, 'laden ' + laden.t);
  const half = gatherWay('half', 0),
    light = gatherWay('licht', 0);
  assert(half.t > 25 && half.t < 40, 'half ' + half.t);
  assert(light.t < 20, 'licht keeps the quick 3D feel ' + light.t);
  assert.equal(fresh().inertia, 'echt');
});
test('less throttle takes longer to gather way', () => {
  const slow = gatherWay('echt', 0, 5),
    full = gatherWay('echt', 0, 8);
  assert(slow.top < full.top);
  assert(slow.t > full.t, slow.t + ' vs ' + full.t);
});
test('feel settings cycle, are saved, and the current setting scales the stream', async () => {
  const s = fresh();
  assert.equal(nextInertia(s), 'licht');
  assert.equal(nextCurrent(s), 'sterk');
  const back = restore({ ...s, inertia: 'half', currentFeel: 'zwak' });
  assert.equal(back.inertia, 'half');
  assert.equal(currentOf(back).k, 0.5);
  assert.equal(restore({ ...s, inertia: 'raar' }).inertia, 'echt');
  const { step, createWorldState } = await import('../src/game/simulation.mjs');
  const fx = { say() {}, sound() {}, radio() {}, board() {}, done() {} };
  const speeds = ['zwak', 'normaal', 'sterk'].map((currentFeel) => {
    const p = { ...fresh(), currentFeel, clock: 3000 };
    step(p, createWorldState(p), 1 / 60, {}, fx);
    return p.tideSpeed;
  });
  assert(Math.abs(speeds[0] * 2 - speeds[1]) < 1e-6);
  assert(Math.abs(speeds[2] - speeds[1] * 1.5) < 1e-6);
});

// Full helm at half ahead until the swing is steady, then amidships (or counter-helm).
function swingOn(inertia, load, counter = false) {
  const s = {
    ...fresh(),
    x: 0,
    z: 0,
    h: 0,
    moored: false,
    timeScale: 1,
    teleIdx: 6,
    cargo: load * 1000,
    target: 1000,
    inertia,
  };
  const feel = feelOf(s),
    run = (sec) => {
      for (let i = 0; i < sec * 20; i++)
        simStep(s, 1 / 20, {}, undefined, undefined, TELE[6], { feel });
    };
  run(400);
  s.rudderCmd = 0.6;
  run(200);
  const r0 = s.r,
    h0 = s.h;
  s.rudderCmd = counter ? -0.6 : 0;
  for (let i = 0; i < 300 * 20; i++) {
    simStep(s, 1 / 20, {}, undefined, undefined, TELE[6], { feel });
    if (counter && s.r < 0.02 * r0) s.rudderCmd = 0;
  }
  return ((s.h - h0) * 180) / Math.PI;
}
test('the swing carries on after amidships: more when laden, counter-helm checks it', () => {
  const light = swingOn('licht', 0),
    empty = swingOn('echt', 0),
    laden = swingOn('echt', 1);
  assert(light < 10, 'licht ' + light);
  assert(empty > 12 && empty < 25, 'empty ' + empty);
  assert(laden > 25 && laden < 45, 'laden ' + laden);
  assert(swingOn('echt', 1, true) < laden / 2, 'counter-helm');
});

test('the current builds up on the hull: slower when laden, the same drift in the end', () => {
  const drift = (inertia, load) => {
    const s = {
      ...fresh(),
      x: 1,
      z: 0,
      h: Math.PI / 2,
      moored: false,
      timeScale: 1,
      teleIdx: 3,
      cargo: load * 1000,
      target: 1000,
      inertia,
      cx: 0,
      cz: 0,
    };
    const env = { feel: feelOf(s), currentAt: () => ({ x: 0, z: 0.75 }) };
    let half = null,
      last = s.z,
      v = 0;
    for (let t = 0; t < 240; t += 1 / 20) {
      simStep(s, 1 / 20, {}, undefined, undefined, 0, env);
      v = (s.z - last) * 20;
      last = s.z;
      if (half === null && v > 0.375) half = t;
    }
    return { half, end: v };
  };
  const light = drift('licht', 0),
    empty = drift('echt', 0),
    laden = drift('echt', 1);
  assert(light.half < 1, 'licht as before ' + light.half);
  assert(empty.half > 4 && empty.half < 10, 'empty ' + empty.half);
  assert(laden.half > 12 && laden.half < 25, 'laden ' + laden.half);
  for (const r of [light, empty, laden]) assert(Math.abs(r.end - 0.75) < 0.02, 'drift ' + r.end);
});

test('moved elsewhere at once (fast travel, rescue): no current carried along', () => {
  const s = { ...fresh(), x: 0, z: 0, h: 0, moored: false, timeScale: 1, inertia: 'echt' };
  const env = { feel: feelOf(s), currentAt: (x) => (x < 500 ? { x: 1, z: 0 } : { x: 0, z: 0 }) };
  for (let i = 0; i < 20 * 120; i++) simStep(s, 1 / 20, {}, undefined, undefined, 0, env);
  assert(s.cx > 0.9, 'took on the current');
  Object.assign(s, { x: 2000, z: 0, u: 0, v: 0 });
  simStep(s, 1 / 20, {}, undefined, undefined, 0, env);
  assert.equal(s.cx, 0);
  assert(Math.hypot(s.u, s.v) < 0.01, 'lies still in still water');
});

test('the swing from different current at bow and stern is half that of engine.js', () => {
  const swing = (shearK) => {
    const s = { ...fresh(), x: 0, z: 0, h: 0, moored: false, timeScale: 1, inertia: 'licht' };
    // Bow (north, z < 0) in a stream to the east, stern in still water.
    const env = { feel: feelOf(s), shearK, currentAt: (x, z) => ({ x: z < 0 ? 0.8 : 0, z: 0 }) };
    simStep(s, 1 / 20, {}, undefined, undefined, 0, env);
    return s.r;
  };
  const full = swing(1),
    half = swing(0.5);
  assert(Math.abs(full) > 1e-4, 'the stream swings the ship ' + full);
  assert(Math.abs(half / full - 0.5) < 0.02, half / full);
});
