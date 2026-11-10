import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fresh, restore } from '../src/game/state.mjs';
import { simStep } from '../src/game/sim-vessel.mjs';
import { TELE } from '../src/game/telegraph.mjs';
import {
  INERTIA,
  feelOf,
  nextInertia,
  nextCurrent,
  currentOf,
} from '../src/game/feel-settings.mjs';

// Full ahead from rest: seconds to 25 km/h, top speed, and the run-out after STOP.
function trial(inertia) {
  const s = { ...fresh(), x: 0, z: 0, h: 0, moored: false, timeScale: 3, teleIdx: 8, inertia },
    feel = feelOf(s);
  let t = 0,
    t25 = null;
  for (; t < 400; t += 1 / 20) {
    simStep(s, 1 / 60, {}, undefined, undefined, TELE[8], { feel });
    if (t25 === null && s.u * 3.6 > 25) t25 = t;
  }
  const top = s.u,
    z0 = s.z;
  for (let i = 0; i < 60 * 600 && s.u > 0.3; i++)
    simStep(s, 1 / 60, {}, undefined, undefined, TELE[3], { feel });
  return { t25, top, run: z0 - s.z };
}
test('inertia setting: heavier gathers way and loses it slower, same top speed', () => {
  const r = INERTIA.map((o) => trial(o.id));
  for (let i = 1; i < r.length; i++) {
    assert(r[i].t25 > r[i - 1].t25 * 1.4, 'slower to 25 km/h');
    assert(r[i].run > r[i - 1].run, 'runs out further');
    assert(Math.abs(r[i].top - r[0].top) < 0.1, 'same top speed');
  }
  assert.equal(fresh().inertia, 'normaal', 'heavier than the old feel by default');
});
test('feel settings cycle, are saved, and the current setting scales the stream', async () => {
  const s = fresh();
  assert.equal(nextInertia(s), 'zwaar');
  assert.equal(nextCurrent(s), 'sterk');
  const back = restore({ ...s, inertia: 'echt', currentFeel: 'zwak' });
  assert.equal(back.inertia, 'echt');
  assert.equal(currentOf(back).k, 0.5);
  assert.equal(restore({ ...s, inertia: 'raar' }).inertia, 'normaal');
  const { step, createWorldState } = await import('../src/game/simulation.mjs');
  const fx = { say() {}, sound() {}, radio() {}, board() {}, done() {} };
  const speeds = ['zwak', 'normaal', 'sterk'].map((currentFeel) => {
    const p = { ...fresh(), currentFeel, clock: 3000 };
    step(p, createWorldState(p), 1 / 60, {}, fx);
    return p.tideSpeed;
  });
  assert(
    Math.abs(speeds[0] * 2 - speeds[1]) < 1e-6 && Math.abs(speeds[2] - speeds[1] * 1.5) < 1e-6,
  );
});
