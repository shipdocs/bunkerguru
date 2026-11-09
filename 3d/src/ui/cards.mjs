// Illustrated moment cards (fase 2): portrait + title + one line, like the event
// panels of the old Sid Meier games. Queue, one at a time, each a few seconds.
import { portraitFor } from './portraits.mjs';
export function createCards(el) {
  const queue = [];
  let busy = false;
  function next() {
    const c = queue.shift();
    if (!c) {
      busy = false;
      return;
    }
    busy = true;
    el.innerHTML =
      '<div class="cardFace">' +
      portraitFor(c.who) +
      '</div><div class="cardText"><small>' +
      (c.who || '') +
      '</small><b>' +
      c.title +
      '</b><span>' +
      (c.text || '') +
      '</span></div>';
    el.className = 'momentCard show' + (c.kind ? ' ' + c.kind : '');
    setTimeout(
      () => {
        el.className = 'momentCard';
        setTimeout(next, 350);
      },
      c.seconds ? c.seconds * 1000 : 5200,
    );
  }
  return function card(c) {
    if (!c?.title) return;
    if (queue.length > 3) queue.shift();
    queue.push(c);
    if (!busy) next();
  };
}
