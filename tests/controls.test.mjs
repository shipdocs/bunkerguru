import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bindKeyboard, nextTelegraph } from '../src/input/keyboard.mjs';
import { fresh } from '../src/game/simulation.mjs';
import { vesselStep, stopShip } from '../src/game/vessel.mjs';
function setup() {
  const target = new EventTarget(),
    keys = {},
    s = { ...fresh(), x: 0, z: 0, moored: false };
  const actions = {
    ahead: () => (s.teleIdx = nextTelegraph(s.teleIdx, 1)),
    astern: () => (s.teleIdx = nextTelegraph(s.teleIdx, -1)),
    stop: () => stopShip(s),
  };
  bindKeyboard(target, keys, actions);
  return { target, keys, s };
}
function send(t, type, code, key, repeat = false) {
  const e = new Event(type, { cancelable: true });
  Object.assign(e, { code, key, repeat });
  t.dispatchEvent(e);
  return e;
}
test('physical E/Q control bow only, including alternate layout, uppercase and repeats', () => {
  for (const [code, key, field, sign] of [
    ['KeyE', 'e', 'bowR', 1],
    ['KeyE', 'E', 'bowR', 1],
    ['KeyE', 'w', 'bowR', 1],
    ['KeyQ', 'Q', 'bowL', -1],
  ]) {
    const { target, keys, s } = setup();
    assert(send(target, 'keydown', code, key).defaultPrevented);
    send(target, 'keydown', code, key, true);
    assert(keys[field]);
    for (let i = 0; i < 600; i++) vesselStep(s, 1 / 60, keys);
    assert.equal(s.teleIdx, 3);
    assert.equal(s.rpm, 0);
    assert(s.h * sign > 0.05);
    assert(s.x * sign > 0.1);
    send(target, 'keyup', code, key);
    assert.equal(keys[field], false);
  }
});
test('only arrows change telegraph, repeats do not step it again', () => {
  const { target, keys, s } = setup();
  send(target, 'keydown', 'ArrowUp', 'ArrowUp');
  send(target, 'keydown', 'ArrowUp', 'ArrowUp', true);
  assert.equal(s.teleIdx, 5);
  assert.deepEqual(keys, {});
  send(target, 'keydown', 'KeyW', 'w');
  send(target, 'keydown', 'KeyS', 's');
  assert.equal(s.teleIdx, 5);
  send(target, 'keydown', 'ArrowDown', 'ArrowDown');
  assert.equal(s.teleIdx, 3);
});
test('opposing bow commands cancel and release restores remaining direction', () => {
  const { target, keys, s } = setup();
  send(target, 'keydown', 'KeyE', 'e');
  send(target, 'keydown', 'KeyQ', 'q');
  for (let i = 0; i < 60; i++) vesselStep(s, 1 / 60, keys);
  assert.equal(s.h, 0);
  send(target, 'keyup', 'KeyQ', 'q');
  for (let i = 0; i < 120; i++) vesselStep(s, 1 / 60, keys);
  assert(s.h > 0);
  assert.equal(s.teleIdx, 3);
});

test('space brakes and useful telegraph settings are bounded and reversible', () => {
  const { target, s } = setup();
  s.teleIdx = 8;
  s.u = 4;
  send(target, 'keydown', 'Space', ' ');
  assert(s.braking);
  assert.equal(s.teleIdx, 3);
  let i = 3;
  const selected = [];
  for (let n = 0; n < 4; n++) {
    i = nextTelegraph(i, 1);
    selected.push(i);
  }
  assert.deepEqual(selected, [5, 6, 8, 8]);
  for (let n = 0; n < 5; n++) i = nextTelegraph(i, -1);
  assert.equal(i, 0);
});
