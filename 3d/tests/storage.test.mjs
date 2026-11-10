import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCareer, saveCareer, loadGraphicsMode, saveGraphicsMode } from '../src/app/storage.mjs';
import { fresh } from '../src/game/state.mjs';
test('refactored storage reads existing browser keys and preserves career and helm', () => {
  const values = new Map([
    [
      'bunkerguru3d-v1',
      JSON.stringify({
        ...fresh(),
        gold: 4321,
        cargo: 500,
        phase: 'deliver',
        rudderCmd: 0.4,
        rudder: 0.3,
      }),
    ],
    ['bunkerguru-graphics', 'light'],
  ]);
  globalThis.localStorage = {
    getItem: (key) => values.get(key),
    setItem: (key, value) => values.set(key, value),
  };
  const state = loadCareer();
  assert.equal(state.gold, 4321);
  assert.equal(state.cargo, 500);
  assert.equal(state.rudderCmd, 0.4);
  assert.equal(state.rudder, 0.3);
  assert.equal(loadGraphicsMode(), 'light');
  state.gold++;
  saveCareer(state);
  saveGraphicsMode('rich');
  assert.equal(JSON.parse(values.get('bunkerguru3d-v1')).gold, 4322);
  assert.equal(values.get('bunkerguru-graphics'), 'rich');
  values.set('bunkerguru3d-v1', 'invalid JSON');
  // A new career starts at a random morning hour: compare everything but that.
  assert.deepEqual({ ...loadCareer(), startHour: 0 }, { ...fresh(), startHour: 0 });
});
test('unavailable browser storage cannot prevent a new game or saving attempts', () => {
  globalThis.localStorage = {
    getItem() {
      throw new Error('blocked');
    },
    setItem() {
      throw new Error('full');
    },
  };
  // A new career starts at a random morning hour: compare everything but that.
  assert.deepEqual({ ...loadCareer(), startHour: 0 }, { ...fresh(), startHour: 0 });
  assert.equal(loadGraphicsMode(), 'auto');
  assert.doesNotThrow(() => saveCareer(fresh()));
  assert.doesNotThrow(() => saveGraphicsMode('light'));
});
