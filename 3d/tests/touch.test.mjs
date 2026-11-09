// Phone play: touch hints name buttons instead of keys, a pinch zooms like the wheel,
// haptics never throw, and the page carries the touch controls the code relies on.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const { touchText, hintFor, TOUCH_SWAPS } = await import('../src/ui/touch-text.mjs');
const { pinchDelta } = await import('../src/input/pinch.mjs');
const { haptic } = await import('../src/input/haptics.mjs');
const { tr, setLang } = await import('../src/i18n/index.mjs');

test('touch hints carry no key names; keyboard screens keep theirs', () => {
  const key =
    'Open de planning (N) en kies een klus. Rusten: wachtplaats (P), reparatie: werf (W).';
  assert.equal(hintFor(false)(key), key);
  const out = hintFor(true)(key);
  assert(!out.includes('(N)'), out);
  assert(out.includes('wachtplaats (P)'), 'chart letters stay');
  assert.equal(touchText('⚓ Trossen zitten vast – eerst M = los').includes('M ='), false);
  assert.equal(touchText('Langszij… houden 1,5 s (of M = vast)').includes('M ='), false);
  assert.equal(touchText(undefined), undefined);
});

test('every touch hint still appears in the sources it rewrites, and has English', async () => {
  let src = '';
  for (const f of [
    'ui/hud.mjs',
    'app/create-game.mjs',
    'input/helm.mjs',
    'ui/port.mjs',
    'render/camera-controller.mjs',
  ])
    src += await readFile(new URL('../src/' + f, import.meta.url), 'utf8');
  // Sources glue lines together: compare without quotes, plus signs and line breaks.
  const flat = (t) => t.replace(/['+\s]/g, '');
  setLang('en');
  for (const [from, to] of TOUCH_SWAPS) {
    assert(flat(src).includes(flat(from)), 'no longer in the game: ' + from);
    assert.notEqual(tr(to), to, 'no English for: ' + to);
  }
  setLang('nl');
});

test('pinch: spreading zooms in, squeezing zooms out, by the same factor as the wheel', () => {
  assert(pinchDelta(100, 200) < 0);
  assert(pinchDelta(200, 100) > 0);
  assert.equal(pinchDelta(0, 100), 0);
  assert(Math.abs(Math.exp(pinchDelta(100, 125) * 0.001) - 0.8) < 1e-9);
});

test('haptics are guarded: no motor, a throwing motor and a real one', () => {
  assert.equal(haptic(10, {}), false);
  assert.equal(
    haptic(10, {
      vibrate() {
        throw new Error('blocked');
      },
    }),
    false,
  );
  const seen = [];
  assert.equal(haptic([1, 2], { vibrate: (p) => (seen.push(p), true) }), true);
  assert.deepEqual(seen, [[1, 2]]);
});

test('the page has the touch controls and the phone layer is the last style layer', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  for (const hold of ['left', 'right', 'bowL', 'bowR'])
    assert(html.includes('data-hold="' + hold + '"'), hold);
  for (const id of ['fsBtn', 'mapToggle', 'menuToggle', 'missionToggle', 'stop', 'moor', 'helmMid'])
    assert(html.includes('id="' + id + '"'), id);
  assert(html.includes('viewport-fit=cover'));
  const main = await readFile(new URL('../styles/main.css', import.meta.url), 'utf8');
  assert(main.trim().endsWith("@import url('./touch.css');"));
  const css = await readFile(new URL('../styles/touch.css', import.meta.url), 'utf8');
  for (const need of [
    'safe-area-inset-bottom',
    'overscroll-behavior',
    'touch-action',
    'position: sticky',
  ])
    assert(css.includes(need), need);
});
