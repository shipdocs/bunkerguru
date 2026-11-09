// Physical key codes keep propulsion and bow-thruster commands independent
// of keyboard layout, Caps Lock, Shift, and whichever HUD button has focus.
// Keys follow the 2D game: ↑/↓ telegraph one notch, ←/→ rudder, Q/E bow thruster,
// Space rudder amidships, M moor, N schedule, B shop, C call bridge/lock, K chart,
// T fast forward, H horn, V VHF, G sound, P music. S = AFSTOPPEN, F = camera,
// J = "varen naar…" (skip the open-water stretch to just short of the destination).
const held = { ArrowLeft: 'left', ArrowRight: 'right', KeyQ: 'bowL', KeyE: 'bowR' };
const actions = {
  ArrowUp: 'ahead',
  ArrowDown: 'astern',
  Space: 'midships',
  Digit0: 'midships',
  KeyS: 'stop',
  KeyM: 'moor',
  KeyN: 'board',
  KeyB: 'shop',
  KeyC: 'gate',
  KeyK: 'chart',
  KeyT: 'warp',
  KeyH: 'horn',
  KeyV: 'radio',
  KeyG: 'sound',
  KeyP: 'music',
  KeyF: 'camera',
  KeyJ: 'fast',
  Escape: 'pause',
};
export function keyCode(e) {
  if (e.code) return e.code;
  const k = e.key?.toLowerCase();
  if (k === ' ') return 'Space';
  if (k === '0') return 'Digit0';
  if (k && /^[a-z]$/.test(k)) return 'Key' + k.toUpperCase();
  return e.key;
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

// Arcade: five useful settings, one press from STOP is enough to get moving.
export const PLAY_TELEGRAPH = Object.freeze([0, 3, 5, 6, 8]);
// Schipper: every notch of the 2D telegraph, one per press.
export function nextTelegraph(index, direction, all = false) {
  if (all) return Math.max(0, Math.min(8, index + Math.sign(direction)));
  const choices =
    direction > 0
      ? PLAY_TELEGRAPH.filter((v) => v > index)
      : PLAY_TELEGRAPH.filter((v) => v < index).reverse();
  return choices[0] ?? index;
}
