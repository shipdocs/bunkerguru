import { test } from 'node:test';
import assert from 'node:assert/strict';
globalThis.BUNKERGURU_MAP = 'rotterdam';
const { createTraffic, updateTraffic } = await import('../src/game/traffic.mjs');

test('the assisting tug keeps station astern of her ship', () => {
  const traffic = createTraffic();
  const tug = traffic.find((t) => t.escort),
    lead = traffic.find((t) => t.name === tug.escort);
  for (let k = 0; k < 600; k++) updateTraffic(traffic, 0.5, []);
  const fx = Math.sin(lead.h),
    fz = -Math.cos(lead.h),
    astern = (lead.x - tug.x) * fx + (lead.z - tug.z) * fz,
    aside = Math.abs((lead.x - tug.x) * -fz + (lead.z - tug.z) * fx);
  assert.ok(
    astern > lead.length / 2 && astern < lead.length / 2 + 80,
    `astern ${astern.toFixed(0)} m`,
  );
  assert.ok(aside < 1, 'right behind her');
  assert.equal(tug.speed, lead.speed);
});
