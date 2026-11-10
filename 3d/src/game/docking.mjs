// Docking as the skill moment: every make-fast alongside a seagoing ship or a terminal
// is rated with 1–3 anchors on speed, angle and the gap left to the quay or hull.
import { customers, terminals, nearestQuay } from '../maps/index.mjs';
const SHIP_HALF_BEAM = 13,
  OWN_HALF_BEAM = 5.5;
const hdgErr = (a, b) => {
  const d = (((a - b) % Math.PI) + Math.PI) % Math.PI;
  return (Math.min(d, Math.PI - d) * 180) / Math.PI;
};
// Clear water between our hull and the ship or quay we lie against (metres).
export function dockGap(s, to) {
  if (to.kind === 'ship') {
    const b = customers.find((c) => c.id === to.id);
    // Sideways off the ship's centre line (starboard of heading h = (cos h, sin h)).
    const lateral = Math.abs((s.x - b.shipX) * Math.cos(b.h) + (s.z - b.shipZ) * Math.sin(b.h));
    return Math.max(0, lateral - SHIP_HALF_BEAM - OWN_HALF_BEAM);
  }
  return Math.max(0, (nearestQuay(s.x, s.z)?.d ?? Infinity) - OWN_HALF_BEAM);
}
export function dockRating(s, to) {
  const speed = Math.hypot(s.u, s.v) * 3.6;
  // Parallel to the ship, or to the quay of the terminal strip.
  const ref =
    to.kind === 'ship'
      ? customers.find((c) => c.id === to.id).h
      : (terminals.find((t) => t.id === to.id)?.h ?? s.h);
  const angle = hdgErr(s.h, ref);
  const gap = dockGap(s, to);
  const anchors =
    speed < 1.5 && angle < 5 && gap < 4 ? 3 : speed < 3 && angle < 12 && gap < 9 ? 2 : 1;
  const label = anchors === 3 ? 'STRAK!' : anchors === 2 ? 'Netjes' : 'Vast… met wat geluk';
  // The ship's captain tips a skipper who comes alongside like a pro.
  const tip = to.kind === 'ship' ? [0, 0, 20, 60][anchors] : 0;
  return { anchors, speed, angle, gap, label, tip, kind: to.kind };
}
