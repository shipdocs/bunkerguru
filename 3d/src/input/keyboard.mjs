// Physical key codes keep propulsion and bow-thruster commands independent
// of keyboard layout, Caps Lock, Shift, and whichever HUD button has focus.
const held = { ArrowLeft: 'left', ArrowRight: 'right', KeyQ: 'bowL', KeyE: 'bowR' };
const actions = {
  ArrowUp: 'ahead',
  ArrowDown: 'astern',
  Space: 'stop',
  KeyM: 'moor',
  KeyC: 'camera',
  Escape: 'pause',
};
export function keyCode(e) {
  if (e.code) return e.code;
  const k = e.key?.toLowerCase();
  return { q: 'KeyQ', e: 'KeyE', m: 'KeyM', c: 'KeyC', ' ': 'Space' }[k] || e.key;
}
export function bindKeyboard(target, keys, actionsByName, isBlocked = () => false) {
  const down = (e) => {
    if (e.ctrlKey || e.altKey || e.metaKey || isBlocked()) return;
    const code = keyCode(e);
    if (!held[code] && !actions[code]) return;
    e.preventDefault();
    e.stopPropagation();
    if (held[code]) {
      keys[held[code]] = true;
      return;
    }
    if (!e.repeat) actionsByName[actions[code]]?.();
  };
  const up = (e) => {
    const code = keyCode(e);
    if (held[code]) {
      keys[held[code]] = false;
      e.preventDefault();
      e.stopPropagation();
    }
  };
  target.addEventListener('keydown', down, true);
  target.addEventListener('keyup', up, true);
  return () => {
    target.removeEventListener('keydown', down, true);
    target.removeEventListener('keyup', up, true);
  };
}

// Five useful settings. One press from STOP is enough to get moving.
export const PLAY_TELEGRAPH = Object.freeze([0, 3, 5, 6, 8]);
export function nextTelegraph(index, direction) {
  const choices =
    direction > 0
      ? PLAY_TELEGRAPH.filter((v) => v > index)
      : PLAY_TELEGRAPH.filter((v) => v < index).reverse();
  return choices[0] ?? index;
}
