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
