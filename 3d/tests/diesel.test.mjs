import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDiesel, DIESEL } from '../src/audio/diesel.mjs';

let seed = 9;
const rnd = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;
const SR = 8000;
const run = (d, sec) => {
  const buf = new Float32Array(Math.round(SR * sec));
  d.render(buf, SR);
  return buf;
};

test('air start A: chuffs on air for 2.6 s without firing, then catches', () => {
  const d = createDiesel(DIESEL, rnd);
  d.set(true, 0);
  run(d, 2.4);
  assert.equal(d.state.mode, 'crank');
  assert.equal(d.state.fires, 0, 'no fuel while cranking');
  run(d, 0.4);
  assert.equal(d.state.mode, 'run');
});

test('idles at 150 rpm and fires once per cylinder per two revolutions', () => {
  const d = createDiesel(DIESEL, rnd);
  d.set(true, 0);
  run(d, 8);
  assert(Math.abs(d.state.rpm - 150) < 2, 'idle ' + d.state.rpm);
  const f0 = d.state.fires;
  run(d, 10);
  const perSec = (d.state.fires - f0) / 10;
  assert(Math.abs(perSec - (150 / 60) * 1.5) < 0.3, 'pofs per second ' + perSec); // ≈3.75
});

test('full power takes its time: well over 10 s from idle to 420 rpm', () => {
  const d = createDiesel(DIESEL, rnd);
  d.set(true, 0);
  run(d, 8);
  d.set(true, 1);
  run(d, 6);
  assert(d.state.rpm < 330, 'still winding up after 6 s: ' + d.state.rpm);
  run(d, 10);
  assert(Math.abs(d.state.rpm - 420) < 3, 'full ' + d.state.rpm);
});

test('switched off it runs down to a stop, then starts on air again', () => {
  const d = createDiesel(DIESEL, rnd);
  d.set(true, 0);
  run(d, 6);
  d.set(false, 0);
  run(d, 6);
  assert.equal(d.state.rpm, 0);
  d.set(true, 0);
  run(d, 0.5);
  assert.equal(d.state.mode, 'crank');
});

test('the signal stays finite and within range', () => {
  const d = createDiesel(DIESEL, rnd);
  d.set(true, 1);
  const b = run(d, 12);
  for (const v of b) assert(Number.isFinite(v) && Math.abs(v) <= 1);
});

test('the diesel runs on the audio thread: the worklet renders the same engine', async () => {
  let Proc = null;
  globalThis.AudioWorkletProcessor = class {
    constructor() {
      this.port = { onmessage: null };
    }
  };
  globalThis.registerProcessor = (name, cls) => {
    assert.equal(name, 'bunkerguru-diesel');
    Proc = cls;
  };
  globalThis.sampleRate = 48000;
  await import('../src/audio/diesel-worklet.mjs');
  const p = new Proc(),
    out = new Float32Array(128);
  p.port.onmessage({ data: { on: true, power: 0.6 } });
  let energy = 0;
  for (let i = 0; i < (48000 * 5) / 128; i++) {
    assert.equal(p.process([], [[out]]), true);
    if (i > (48000 * 4) / 128) for (const v of out) energy += v * v;
  }
  assert(energy > 1, 'the engine runs after its air start');
  assert(p.diesel.state.mode === 'run');
});
