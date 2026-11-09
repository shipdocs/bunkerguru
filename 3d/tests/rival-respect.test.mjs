import { test } from 'node:test';
import assert from 'node:assert/strict';
globalThis.BUNKERGURU_MAP = 'europoort';
let seed = 77;
Math.random = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;
const { fresh, createWorldState, step } = await import('../src/game/simulation.mjs');
const { terminals, customers, MAP } = await import('../src/maps/index.mjs');
const { rivalStartJob } = await import('../src/game/rivals.mjs');
const noFx = { say() {}, sound() {}, radio() {}, board() {}, done() {}, card() {} };

// Two 110 × 11 m hulls as oriented boxes (heading h: bow along (sin h, −cos h)).
function overlap(a, b, L = 110, B = 11) {
  const axes = (h) => [
    [Math.sin(h), -Math.cos(h)],
    [Math.cos(h), Math.sin(h)],
  ];
  const half = [L / 2, B / 2];
  for (const [ax, az] of [...axes(a.h), ...axes(b.h)]) {
    const proj = (o) => {
      const [f, s] = axes(o.h);
      const c = o.x * ax + o.z * az,
        r = half[0] * Math.abs(f[0] * ax + f[1] * az) + half[1] * Math.abs(s[0] * ax + s[1] * az);
      return [c - r, c + r];
    };
    const [a0, a1] = proj(a),
      [b0, b1] = proj(b);
    if (a1 < b0 || b1 < a0) return false;
  }
  return true;
}

test('a rival never sails into the player lying at a terminal to load', () => {
  for (const [ti, t] of terminals.entries()) {
    const s = fresh();
    const off = t.wall ? t.wall * ((t.alongZ ? t.x1 - t.x0 : t.z1 - t.z0) / 2 - 7) : 0;
    Object.assign(s, {
      x: t.alongZ ? t.x + off : t.x,
      z: t.alongZ ? t.z : t.z + off,
      h: t.h,
      moored: true,
      mooredTo: { kind: 'terminal', id: t.id },
      phase: 'free',
    });
    const world = createWorldState(s);
    const [bert, truus] = world.rivals;
    truus.mode = 'idle';
    truus.wait = 1e9;
    // Bert starts on the river abreast of this terminal and goes to load.
    Object.assign(bert, { x: t.x, z: MAP.lanes?.down ?? -20, h: -Math.PI / 2, mode: 'idle' });
    rivalStartJob(
      bert,
      customers.findIndex((c) => !c.gate),
      world.rivals,
    );
    let hits = 0;
    for (let i = 0; i < 60 * 240; i++) {
      step(s, world, 1 / 60, {}, noFx);
      s.u = s.v = 0;
      if (i % 10 === 0 && overlap(s, bert)) hits++;
    }
    assert.equal(hits, 0, 'overlap with the player at ' + t.name + ' (' + ti + ')');
  }
});

test('two rivals heading for the terminal the player lies at never share a berth', () => {
  for (const [ti, t] of terminals.entries()) {
    const s = fresh();
    const off = t.wall ? t.wall * ((t.alongZ ? t.x1 - t.x0 : t.z1 - t.z0) / 2 - 7) : 0;
    Object.assign(s, {
      x: t.alongZ ? t.x + off : t.x,
      z: t.alongZ ? t.z : t.z + off,
      h: t.h,
      moored: true,
      mooredTo: { kind: 'terminal', id: t.id },
      phase: 'free',
    });
    const world = createWorldState(s);
    const lane = MAP.lanes?.down ?? -20;
    world.rivals.forEach((r, k) =>
      Object.assign(r, { x: t.x + (k ? 300 : -300), z: lane, h: -Math.PI / 2, mode: 'idle' }),
    );
    const berth = customers.findIndex((c) => !c.gate);
    for (const r of world.rivals) rivalStartJob(r, berth, world.rivals);
    let hits = 0;
    for (let i = 0; i < 60 * 240; i++) {
      step(s, world, 1 / 60, {}, noFx);
      s.u = s.v = 0;
      if (i % 10) continue;
      const [a, b] = world.rivals;
      if (overlap(s, a) || overlap(s, b)) hits++;
      if (a.mode === 'loading' && b.mode === 'loading' && a.term === b.term && overlap(a, b))
        hits++;
    }
    assert.equal(hits, 0, 'overlap at ' + t.name + ' (' + ti + ')');
  }
});
