// Two fingers on the water zoom the camera. The camera controller already zooms on a
// wheel event, so a pinch is passed on as one: spreading the fingers zooms in.
export function pinchDelta(from, to) {
  if (!(from > 0) || !(to > 0)) return 0;
  return Math.log(from / to) * 1000; // onwheel: zoom *= exp(deltaY × 0.001)
}
export function bindPinch(canvas, { onStart } = {}) {
  const touches = new Map();
  let span = 0,
    pinching = false;
  const distance = () => {
    const [a, b] = [...touches.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  };
  // Capture phase on the window: while two fingers are down the canvas itself gets no
  // pointer moves, so the camera does not swing round during the pinch.
  const down = (e) => {
    if (e.target !== canvas || e.pointerType === 'mouse') return;
    touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (touches.size === 2) {
      pinching = true;
      span = distance();
      onStart?.();
      e.stopPropagation();
    }
  };
  const move = (e) => {
    if (!touches.has(e.pointerId)) return;
    touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (!pinching) return;
    e.stopPropagation();
    if (touches.size < 2) return; // one finger left: wait until it lifts too
    const now = distance(),
      deltaY = pinchDelta(span, now);
    if (Math.abs(deltaY) < 4) return;
    span = now;
    canvas.onwheel?.({ deltaY, preventDefault() {} });
  };
  const up = (e) => {
    if (!touches.delete(e.pointerId)) return;
    if (pinching) e.stopPropagation();
    if (!touches.size) pinching = false;
  };
  const target = globalThis.window;
  if (!target?.addEventListener) return () => {};
  target.addEventListener('pointerdown', down, true);
  target.addEventListener('pointermove', move, true);
  target.addEventListener('pointerup', up, true);
  target.addEventListener('pointercancel', up, true);
  return () => {
    target.removeEventListener('pointerdown', down, true);
    target.removeEventListener('pointermove', move, true);
    target.removeEventListener('pointerup', up, true);
    target.removeEventListener('pointercancel', up, true);
  };
}
