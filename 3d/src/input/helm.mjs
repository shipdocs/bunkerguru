import { bindWheel } from './wheel.mjs';
import { tempoLabel, nextTempo } from '../game/time-scale.mjs';
import { act, clamp } from '../game/simulation.mjs';
import { stopShip } from '../game/vessel.mjs';
import { bindKeyboard, nextTelegraph } from './keyboard.mjs';
import { haptic } from './haptics.mjs';
// Input changes the command. Releasing a key must never centre the persistent helm.
export function bindHelm({
  $,
  keys,
  getState,
  isPlaying,
  hasStarted,
  toast,
  save,
  actions = {},
  sound,
}) {
  function moor() {
    if (!isPlaying()) return;
    const was = getState().moored,
      msg = act(getState());
    if (getState().moored !== was) {
      sound?.('rope');
      haptic(getState().moored ? [18, 50, 30] : 18);
    }
    toast(msg);
    save();
  }
  function throttle(v) {
    if (!isPlaying()) return;
    if (getState().moored) {
      toast('⚓ Trossen zitten vast – eerst M = los');
      return;
    }
    if (getState().phase === 'sunk') return;
    getState().braking = false;
    if (getState().engineOff) toast('Motor staat uit – O = starten');
    const before = getState().teleIdx;
    getState().teleIdx = nextTelegraph(before, v, getState().handling !== 'arcade');
    // One tick per notch; a longer one on STOP so the thumb finds neutral without looking.
    if (getState().teleIdx !== before) haptic(getState().teleIdx === 3 ? 30 : 12);
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
    haptic(30);
    toast(
      getState().handling === 'arcade' ? 'Afstoppen' : 'Afstoppen: volle kracht achteruit tot stil',
    );
  }
  $('stop').onclick = brake;
  $('helmMid').onclick = () => {
    centreHelm();
    haptic(12);
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
  bindKeyboard(
    window,
    keys,
    {
      ahead: () => throttle(1),
      astern: () => throttle(-1),
      stop: brake,
      midships: () => {
        if (!isPlaying()) return;
        centreHelm();
        toast('Roer midscheeps');
      },
      moor,
      camera: () => $('cam').click(),
      pause: () => $('pause').click(),
      ...actions,
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
