import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
// Every map of the 2D game, each in its own process (the active map is chosen at load).
const tool = fileURLToPath(new URL('./tools/harbour-run.mjs', import.meta.url));
for (const id of ['amsterdam', 'rotterdam', 'europoort', 'antwerpen', 'training'])
  test(`${id}: berths, terminals and waiting places reachable; 30 min of traffic and rivals stay on water`, () => {
    const r = spawnSync(process.execPath, [tool], {
      env: { ...process.env, BUNKERGURU_MAP: id },
      encoding: 'utf8',
    });
    assert.equal(r.status, 0, r.stderr);
    const out = JSON.parse(r.stdout.trim().split('\n').pop());
    assert.equal(out.id, id);
    assert.deepEqual(out.problems, []);
    if (id !== 'training') assert(out.rivalJobs >= 1, 'rivals complete jobs');
  });
