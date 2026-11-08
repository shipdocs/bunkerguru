import { clamp } from '../game/math.mjs';
export function wheelDelta(from, to) {
  return Math.atan2(Math.sin(to - from), Math.cos(to - from));
}
// A half-turn each way gives ±60° rudder. Regripping never changes the command.
export function bindWheel(element, { getCommand, setCommand, enabled }) {
  let drag = null;
  function angle(event) {
    const r = element.getBoundingClientRect(),
      x = event.clientX - r.left - r.width / 2,
      y = event.clientY - r.top - r.height / 2;
    return Math.hypot(x, y) < r.width * 0.15 ? null : Math.atan2(y, x);
  }
  element.onpointerdown = (e) => {
    if (!enabled() || drag || (e.button !== undefined && e.button !== 0)) return;
    const a = angle(e);
    if (a === null) return;
    e.preventDefault();
    element.focus?.({ preventScroll: true });
    element.setPointerCapture(e.pointerId);
    drag = { id: e.pointerId, angle: a };
  };
  element.onpointermove = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    if (!enabled()) {
      drag = null;
      return;
    }
    const a = angle(e);
    if (a === null) {
      drag.angle = null;
      return;
    }
    if (drag.angle !== null)
      setCommand(clamp(getCommand() + wheelDelta(drag.angle, a) / Math.PI, -1, 1));
    drag.angle = a;
    render();
  };
  function release(e) {
    if (!e || e.pointerId === undefined || e.pointerId === drag?.id) drag = null;
  }
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture', 'blur'])
    element.addEventListener(type, release);
  element.addEventListener('keydown', (e) => {
    if (!enabled() || !['Home', 'End', 'PageUp', 'PageDown'].includes(e.key)) return;
    e.preventDefault();
    setCommand(
      e.key === 'Home'
        ? 0
        : e.key === 'End'
          ? 1
          : clamp(getCommand() + (e.key === 'PageUp' ? 0.1 : -0.1), -1, 1),
    );
    render();
  });
  function render() {
    const value = getCommand(),
      degrees = Math.round(value * 60);
    element.style.transform = `rotate(${value * 180}deg)`;
    element.setAttribute('aria-valuenow', String(degrees));
    element.setAttribute(
      'aria-valuetext',
      degrees === 0
        ? 'Midscheeps'
        : `${Math.abs(degrees)} graden ${degrees < 0 ? 'bakboord' : 'stuurboord'}`,
    );
  }
  render();
  return { render, release };
}
