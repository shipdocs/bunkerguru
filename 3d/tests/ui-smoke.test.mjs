// Runs real scene assembly and UI event handlers with a tiny DOM/renderer double.
// This is not a WebGL rendering or screenshot test.
import { terminals, customers, terminalOf, berthOf } from '../src/game/harbor.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
test('scene builds finite geometry and UI supports start, delivery, office, upgrade and resume', async () => {
  class El extends EventTarget {
    constructor(tag = 'div') {
      super();
      this.tagName = tag;
      this.style = {};
      this.dataset = {};
      this.children = [];
      this.hidden = false;
      this.disabled = false;
      this.open = false;
      this.textContent = '';
      this.classList = { toggle() {}, add() {}, remove() {} };
    }
    append(...c) {
      this.children.push(...c);
    }
    replaceChildren(...c) {
      this.children = c;
    }
    setAttribute() {}
    setPointerCapture() {}
    getBoundingClientRect() {
      return { left: 0, top: 0, width: 120, height: 120 };
    }
    querySelector() {
      return (this.span ??= new El('span'));
    }
    showModal() {
      this.open = true;
    }
    close() {
      this.open = false;
    }
    click() {
      if (!this.disabled) this.onclick?.();
    }
    getContext() {
      return new Proxy(
        {},
        { get: (o, k) => o[k] ?? (() => {}), set: (o, k, v) => ((o[k] = v), true) },
      );
    }
  }
  const html = await readFile(
      new URL(process.env.GAME_HTML_URL || '../index.html', import.meta.url),
      'utf8',
    ),
    elements = new Map([...html.matchAll(/id="([^"]+)"/g)].map((m) => [m[1], new El()])),
    hold = ['left', 'right', 'bowL', 'bowR'].map((k) => {
      const el = new El('button');
      el.dataset.hold = k;
      return el;
    });
  const doc = new EventTarget();
  Object.assign(doc, {
    hidden: false,
    getElementById: (id) => {
      assert(elements.has(id), 'Missing HTML id ' + id);
      return elements.get(id);
    },
    createElement: (t) => new El(t),
    querySelector: (q) =>
      q === 'dialog[open]'
        ? [...elements.values()].find((e) => e.open)
        : hold.find((e) => q.includes(e.dataset.hold)),
    querySelectorAll: (q) => (q === '[data-hold]' ? hold : []),
  });
  Object.assign(globalThis, {
    document: doc,
    window: new EventTarget(),
    innerWidth: 1366,
    innerHeight: 768,
    devicePixelRatio: 1,
    localStorage: {
      getItem() {
        return null;
      },
      setItem() {},
    },
    requestAnimationFrame: (fn) => {
      globalThis.nextFrame = fn;
    },
  });
  globalThis.TestRenderer = class {
    constructor() {
      this.shadowMap = {};
    }
    setPixelRatio() {}
    setSize() {}
    render(scene, camera) {
      assert(Number.isFinite(camera.position.x));
    }
  };
  const { createGame } = await import(process.env.GAME_MODULE_URL || '../src/app/create-game.mjs');
  const game = createGame({ createRenderer: () => new globalThis.TestRenderer() });
  const $ = (id) => elements.get(id);
  function turnWheel(degrees) {
    $('helmMid').click();
    const point = (angle) => ({
      pointerId: 1,
      button: 0,
      clientX: 60 + 50 * Math.cos(angle),
      clientY: 60 + 50 * Math.sin(angle),
      preventDefault() {},
    });
    $('helm').onpointerdown(point(-Math.PI / 2));
    $('helm').onpointermove(point(-Math.PI / 2 + (degrees / 60) * Math.PI));
    const up = new Event('pointerup');
    Object.assign(up, { pointerId: 1 });
    $('helm').dispatchEvent(up);
  }
  assert($('intro').open);
  $('start').click();
  assert(!$('intro').open);
  turnWheel(18);
  assert(Math.abs(game.state.rudderCmd - 0.3) < 1e-9);
  assert.equal(game.state.rudder, 0);
  const throttle = game.state.teleIdx;
  $('helmMid').click();
  assert.equal(game.state.rudderCmd, 0);
  assert.equal(game.state.teleIdx, throttle);
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture', 'blur', 'keyup']) {
    turnWheel(30);
    $('helm').dispatchEvent(new Event(type));
    assert(Math.abs(game.state.rudderCmd - 0.5) < 1e-9);
  }
  $('pause').click();
  assert(Math.abs(game.state.rudderCmd - 0.5) < 1e-9);
  $('pause').click();
  window.dispatchEvent(new Event('blur'));
  assert(Math.abs(game.state.rudderCmd - 0.5) < 1e-9);
  $('pause').click();
  $('moor').click();
  assert(!game.state.moored);
  $('up').click();
  assert.equal(game.state.teleIdx, 4); // schipper: one notch per press
  $('stop').click();
  assert(game.state.braking);
  assert(Math.abs(game.state.rudderCmd - 0.5) < 1e-9);
  assert.equal(game.state.teleIdx, 3);
  $('up').click();
  assert(!game.state.braking);
  assert.equal(game.state.teleIdx, 4); // schipper: one notch per press
  $('stop').click();
  $('moor').click();
  assert(game.state.moored);
  $('helmMid').click();
  assert.equal(game.state.rudderCmd, 0);
  // Schedule: six jobs, choose the first.
  $('next').click();
  assert($('port').open);
  assert.equal($('offers').children.length, 6);
  $('offers').children[0].onclick();
  assert(!$('port').open);
  const s = game.state;
  assert.equal(s.phase, 'load');
  // Lie still at the job's terminal: loading as in the 2D game.
  const tm = terminalOf(s);
  Object.assign(s, {
    x: tm.x,
    z: tm.z,
    h: tm.h,
    u: 0,
    v: 0,
    r: 0,
    moored: true,
    mooredTo: { kind: 'terminal', id: tm.id },
  });
  let now = performance.now();
  for (let i = 0; i < 400 && s.phase === 'load'; i++) globalThis.nextFrame((now += 50));
  assert.equal(s.phase, 'sail');
  assert.equal(s.cargo, s.target);
  // Shop is open at the terminal.
  const gold0 = s.gold;
  s.gold = 5000;
  $('maintenance').click();
  assert(!$('portShop').hidden);
  $('shopList').children[4].children[0].click();
  assert.equal(s.lvl.pomp, 1);
  $('closePort').click();
  s.gold = gold0;
  // Alongside the seagoing ship, parallel and still: bunkering starts after 2 s.
  const b = berthOf(s);
  Object.assign(s, {
    x: b.x,
    z: b.z,
    h: b.h,
    u: 0,
    v: 0,
    r: 0,
    moored: false,
    mooredTo: null,
    teleIdx: 3,
    rpm: 0,
  });
  for (let i = 0; i < 600 && s.phase !== 'done'; i++) {
    Object.assign(s, { u: 0, v: 0, r: 0 });
    globalThis.nextFrame((now += 50));
  }
  assert.equal(s.phase, 'done');
  assert(s.gold > gold0, 'paid');
  assert.equal(s.jobs, 1);
  let count = 0,
    vertices = 0;
  game.scene.traverse((o) => {
    const a = o.geometry?.getAttribute('position');
    if (a) {
      count++;
      vertices += a.count;
      for (const v of a.array) assert(Number.isFinite(v));
    }
  });
  assert(count < 900, 'scene should batch decorative meshes: ' + count);
  assert(vertices > 10000);
  $('graphics').click();
  assert.equal($('graphics').textContent, 'Beeld: zuinig');
  $('graphics').click();
  assert.equal($('graphics').textContent, 'Beeld: uitgebreid');
  game.ui();
  assert.match($('cargo').textContent, / t$/);
  // Reset replaces state; extracted input/port modules must not retain the old object.
  const previousState = game.state;
  $('maintenance').click();
  $('restart').click();
  $('confirmReset').click();
  assert.notEqual(game.state, previousState);
  assert.equal(game.state.jobs, 0);
  turnWheel(15);
  assert(Math.abs(game.state.rudderCmd - 0.25) < 1e-9);
  assert.equal(previousState.rudderCmd, 0);
  $('helmMid').click();
  if (game.state.moored) $('moor').click();
  assert(!game.state.moored);
  Object.assign(game.state, {
    handling: 'arcade',
    timeScale: 2,
    x: -2300,
    z: 0,
    h: Math.PI / 2,
    u: 7.2,
    rpm: 1,
    teleIdx: 8,
    engDir: 1,
  });
  globalThis.nextFrame((now += 100)); // Resume frame must not catch up paused time.
  const startX = game.state.x,
    startClock = game.state.clock;
  for (let i = 0; i < 100; i++) globalThis.nextFrame((now += 100));
  assert(
    Math.abs(game.state.x - startX - 144) < 1e-6,
    'real animation loop must travel 144 m at 2x at 10 FPS',
  );
  assert(Math.abs(game.state.clock - startClock - 20) < 1e-8);
  assert.equal($('speed').textContent, '25,9');
});
