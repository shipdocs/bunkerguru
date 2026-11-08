import { bindWheel } from './wheel.mjs';
import { tempoLabel, nextTempo } from '../game/time-scale.mjs';
import { act, pump, clamp } from '../game/simulation.mjs';
import { stopShip } from '../game/vessel.mjs';
import { bindKeyboard, nextTelegraph } from './keyboard.mjs';
// Input changes the command. Releasing a key must never centre the persistent helm.
export function bindHelm({ $, keys, getState, isPlaying, hasStarted, toast, save }) {
  function moor() {
    if (!isPlaying()) return;
    toast(act(getState()));
    save();
  }
  function throttle(v) {
    if (!isPlaying()) return;
    if (getState().moored) {
      toast('Gooi eerst de trossen los.');
      return;
    }
    if (getState().damage >= 100) {
      toast('Schip beschadigd. Gebruik hulp → terug naar terminal.');
      return;
    }
    getState().braking = false;
    getState().teleIdx = nextTelegraph(getState().teleIdx, v);
  }
  function setHelm(degrees) {
    if (!isPlaying() || document.querySelector('dialog[open]')) return;
    getState().rudderCmd = clamp(Number(degrees) || 0, -60, 60) / 60;
    keys.left = keys.right = false;
  }
  const wheel = bindWheel($('helm'), {
    getCommand: () => getState().rudderCmd,
    setCommand: (value) => setHelm(value * 60),
    enabled: () => isPlaying() && !document.querySelector('dialog[open]'),
  });
  const centreHelm = () => {
    delete keys.helm;
    keys.left = keys.right = false;
    getState().rudderCmd = 0;
  };
  function brake() {
    if (!isPlaying() || document.querySelector('dialog[open]')) return;
    stopShip(getState());
    toast('Afstoppen');
  }
  $('stop').onclick = brake;
  $('helmMid').onclick = () => {
    centreHelm();
    toast('Roer midscheeps');
  };
  function helmFeedback() {
    const actual = Math.round(getState().rudder * 60),
      command = Math.round(getState().rudderCmd * 60);
    wheel.render();
    $('helmReadout').textContent = 'ROER ' + actual + '° · INGESTELD ' + command + '°';
  }
  $('tempo').onclick = () => {
    getState().timeScale = nextTempo(getState().timeScale);
    save();
    $('tempo').textContent = tempoLabel(getState().timeScale);
    toast(tempoLabel(getState().timeScale));
  };
  $('tempo').textContent = tempoLabel(getState().timeScale);
  $('up').onclick = () => throttle(1);
  $('down').onclick = () => throttle(-1);
  $('moor').onclick = moor;
  $('pump').onclick = () => {
    toast(pump(getState()));
    save();
  };
  bindKeyboard(
    window,
    keys,
    {
      ahead: () => throttle(1),
      astern: () => throttle(-1),
      stop: brake,
      moor,
      camera: () => $('cam').click(),
      pause: () => $('pause').click(),
    },
    () => !!document.querySelector('dialog[open]') || !hasStarted(),
  );
  for (const b of document.querySelectorAll('[data-hold]')) {
    b.onpointerdown = (e) => {
      e.preventDefault();
      b.setPointerCapture(e.pointerId);
      if (b.dataset.hold === 'left' || b.dataset.hold === 'right') delete keys.helm;
      keys[b.dataset.hold] = true;
      b.classList.add('held');
    };
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture'])
      b.addEventListener(type, () => {
        keys[b.dataset.hold] = false;
        b.classList.remove('held');
      });
  }

  function release() {
    wheel.release();
    for (const k in keys) keys[k] = false;
    delete keys.helm;
    document.querySelectorAll('.held').forEach((e) => e.classList.remove('held'));
  }
  return { update: helmFeedback, release };
}
