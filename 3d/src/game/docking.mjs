// Docking as the skill moment: every make-fast alongside a seagoing ship or a terminal
// is rated with 1–3 anchors on speed, angle and the gap left to the quay or hull.
import { customers, land } from '../maps/index.mjs';
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
    const lateral = b.h ? Math.abs(s.z - b.shipZ) : Math.abs(s.x - b.shipX);
    return Math.max(0, lateral - SHIP_HALF_BEAM - OWN_HALF_BEAM);
  }
  let best = Infinity;
  for (const l of land) {
    const qx = Math.max(l.x0, Math.min(l.x1, s.x)),
      qz = Math.max(l.z0, Math.min(l.z1, s.z));
    best = Math.min(best, Math.hypot(qx - s.x, qz - s.z));
  }
  return Math.max(0, best - OWN_HALF_BEAM);
}
export function dockRating(s, to) {
  const speed = Math.hypot(s.u, s.v) * 3.6;
  const ref = to.kind === 'ship' ? customers.find((c) => c.id === to.id).h : s.h;
  const angle = to.kind === 'ship' ? hdgErr(s.h, ref) : 0;
  const gap = dockGap(s, to);
  const anchors =
    speed < 1.5 && angle < 5 && gap < 4 ? 3 : speed < 3 && angle < 12 && gap < 9 ? 2 : 1;
  const label = anchors === 3 ? 'STRAK!' : anchors === 2 ? 'Netjes' : 'Vast… met wat geluk';
  // The ship's captain tips a skipper who comes alongside like a pro.
  const tip = to.kind === 'ship' ? [0, 0, 20, 60][anchors] : 0;
  return { anchors, speed, angle, gap, label, tip, kind: to.kind };
}
