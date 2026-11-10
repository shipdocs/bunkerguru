import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bindWheel, wheelDelta } from '../src/input/wheel.mjs';
import { fresh, restore } from '../src/game/state.mjs';
import { nextTempo } from '../src/game/time-scale.mjs';
function setup() {
  let command = 0,
    active = true;
  const element = new EventTarget();
  Object.assign(element, {
    style: {},
    setAttribute() {},
    setPointerCapture() {},
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 120, height: 120 }),
  });
  const wheel = bindWheel(element, {
    getCommand: () => command,
    setCommand: (v) => (command = v),
    enabled: () => active,
  });
  const point = (degrees, id = 1) => ({
    pointerId: id,
    button: 0,
    clientX: 60 + 50 * Math.cos((degrees * Math.PI) / 180),
    clientY: 60 + 50 * Math.sin((degrees * Math.PI) / 180),
    preventDefault() {},
  });
  return { element, wheel, point, value: () => command, disable: () => (active = false) };
}
test('quarter wheel turn commands 30° rudder, release and regrip keep that angle', () => {
  const t = setup();
  t.element.onpointerdown(t.point(-90));
  t.element.onpointermove(t.point(0));
  assert.equal(t.value(), 0.5);
  const up = new Event('pointerup');
  Object.assign(up, { pointerId: 1 });
  t.element.dispatchEvent(up);
  t.element.onpointermove(t.point(90));
  assert.equal(t.value(), 0.5);
  t.element.onpointerdown(t.point(160));
  assert.equal(t.value(), 0.5);
  t.element.onpointermove(t.point(115));
  assert(Math.abs(t.value() - 0.25) < 1e-9);
});
test('wheel wraps smoothly at ±180°, respects end stops and ignores a second finger', () => {
  const t = setup();
  t.element.onpointerdown(t.point(170));
  t.element.onpointermove(t.point(-170));
  assert(Math.abs(t.value() - 20 / 180) < 1e-9);
  t.element.onpointerdown(t.point(0, 2));
  t.element.onpointermove(t.point(90, 2));
  assert(Math.abs(t.value() - 20 / 180) < 1e-9);
  t.element.onpointermove(t.point(-80));
  t.element.onpointermove(t.point(10));
  assert.equal(t.value(), 1);
  t.element.onpointermove(t.point(-35));
  assert(Math.abs(t.value() - 0.75) < 1e-9);
  assert(
    Math.abs(wheelDelta((179 * Math.PI) / 180, (-179 * Math.PI) / 180) - (2 * Math.PI) / 180) <
      1e-9,
  );
});
test('cancel, capture loss, blur and pause end the drag without centring', () => {
  for (const type of ['pointercancel', 'lostpointercapture', 'blur']) {
    const t = setup();
    t.element.onpointerdown(t.point(-90));
    t.element.onpointermove(t.point(0));
    t.element.dispatchEvent(new Event(type));
    t.element.onpointermove(t.point(90));
    assert.equal(t.value(), 0.5);
  }
  const t = setup();
  t.element.onpointerdown(t.point(-90));
  t.disable();
  t.element.onpointermove(t.point(0));
  assert.equal(t.value(), 0);
});
test('touching the hub does not jump the angle; Home explicitly centres it', () => {
  const t = setup();
  t.element.onpointerdown(t.point(-90));
  t.element.onpointermove(t.point(0));
  t.wheel.release();
  t.element.onpointerdown({ ...t.point(0), clientX: 60, clientY: 60 });
  t.element.onpointermove(t.point(90));
  assert.equal(t.value(), 0.5);
  const event = new Event('keydown', { cancelable: true });
  Object.assign(event, { key: 'Home' });
  t.element.dispatchEvent(event);
  assert.equal(t.value(), 0);
});
test('careers keep their tempo, money and helm; tempo cycles 1×, 2×, 3× (2D pace) and 6×', () => {
  const old = { ...fresh(), timeScale: 1, gold: 4567, rudderCmd: 0.4 };
  const updated = restore(old);
  assert.equal(updated.timeScale, 1);
  assert.equal(updated.gold, 4567);
  assert.equal(updated.rudderCmd, 0.4);
  for (const timeScale of [1, 2, 3, 6])
    assert.equal(restore({ ...updated, timeScale }).timeScale, timeScale);
  assert.equal(nextTempo(2), 3);
  assert.equal(nextTempo(3), 6);
  assert.equal(nextTempo(6), 12);
  assert.equal(nextTempo(12), 1);
});
