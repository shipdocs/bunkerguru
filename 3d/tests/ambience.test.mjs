import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAmbience } from '../src/audio/ambience.mjs';

const seq = () => {
  let i = 0;
  return () => (i = (i * 9301 + 49297) % 233280) / 233280;
};
const run = (secs, s, world, places) => {
  const a = createAmbience(seq()),
    heard = [];
  for (let t = 0; t < secs; t += 0.25) heard.push(...a.tick(0.25, s, world, places));
  return heard;
};

test('gulls cry, louder along the quays', () => {
  const quay = run(120, { x: 0, z: 0 }, {}, { shoreDist: () => 20 }).filter(
      (e) => e.kind === 'gull',
    ),
    open = run(120, { x: 0, z: 0 }, {}, { shoreDist: () => 900 }).filter((e) => e.kind === 'gull');
  assert.ok(quay.length >= 5);
  assert.ok(quay[0].vol > open[0].vol * 2);
});

test('a distant horn now and then, cranes only when close, bells only for a bridge about to open', () => {
  const world = {
    traffic: [{ x: 1500, z: 0, length: 220 }],
    gates: [{ state: 'prep', x0: 100, x1: 140, z0: 0, z1: 10 }],
  };
  const heard = run(400, { x: 0, z: 0 }, world, { cranes: [{ x: 200, z: 0 }] });
  const kinds = new Set(heard.map((e) => e.kind));
  for (const k of ['distantHorn', 'clank', 'bell']) assert.ok(kinds.has(k), k);
  assert.ok(heard.every((e) => e.vol > 0 && e.vol <= 0.3));
  const far = run(
    400,
    { x: 0, z: 0 },
    { ...world, gates: [{ ...world.gates[0], state: 'open' }] },
    { cranes: [{ x: 5000, z: 0 }] },
  );
  assert.ok(!far.some((e) => e.kind === 'clank' || e.kind === 'bell'));
});
