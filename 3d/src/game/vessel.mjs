import { playStep } from './play-vessel.mjs';
import { legacyVesselStep } from './legacy-vessel.mjs';
import { TELE } from './telegraph.mjs';
export { TELE, TELE_NAMES } from './telegraph.mjs';
export { stopShip } from './play-vessel.mjs';
export const renderYaw = (heading) => -heading;
// Normal gameplay always uses assisted handling; legacy is a test-only comparison.
export function vesselStep(
  s,
  dt,
  keys = {},
  contact,
  onClutch = () => {},
  { legacy = false } = {},
) {
  if (legacy) return legacyVesselStep(s, dt, keys, contact, onClutch);
  return playStep(s, dt, keys, contact, onClutch, TELE[s.teleIdx ?? 3]);
}
