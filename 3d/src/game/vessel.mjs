import { playStep } from './play-vessel.mjs';
import { simStep } from './sim-vessel.mjs';
import { legacyVesselStep } from './legacy-vessel.mjs';
import { TELE } from './telegraph.mjs';
export { TELE, TELE_NAMES } from './telegraph.mjs';
export { stopShip } from './play-vessel.mjs';
export const renderYaw = (heading) => -heading;
// 'schipper' (default) = original engine.js equations with current; 'arcade' = assisted
// handling. legacy is a test-only comparison.
export function vesselStep(
  s,
  dt,
  keys = {},
  contact,
  onClutch = () => {},
  { legacy = false, env } = {},
) {
  if (legacy) return legacyVesselStep(s, dt, keys, contact, onClutch);
  if (s.handling === 'arcade')
    return playStep(s, dt, keys, contact, onClutch, TELE[s.teleIdx ?? 3]);
  return simStep(s, dt, keys, contact, onClutch, TELE[s.teleIdx ?? 3], env);
}
