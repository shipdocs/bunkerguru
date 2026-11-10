import { profileOf } from '../game/ship-profile.mjs';
export const cameraRange = (p) => ({
  min: Math.max(70, p.length * 1.45),
  max: Math.max(1400, p.length * 12),
  initial: Math.max(160, p.length * 3.1),
});
export const CAMERA_MODES = ['follow', 'free', 'top', 'bridge'];
export const CAMERA_LABELS = {
  follow: 'Volgcamera',
  free: 'Vrije camera',
  top: 'Bovenaanzicht',
  bridge: 'Stuurhuis',
};
// Wheelhouse view, in the ship's own frame (bow towards −z, port towards −x, waterline
// y = 0; see ship-model.mjs: deck at 3 m, wheelhouse windows at 0.229 L aft).
// look: −1 port bridge wing, 0 behind the front windows, +1 starboard wing.
export const BRIDGE_LOOKS = { '-1': 'Bakboordvleugel', 0: 'Stuurhuis', 1: 'Stuurboordvleugel' };
export function bridgeEye(profile, look = 0) {
  const L = profile.length,
    B = profile.beam;
  if (!look) return { x: 0, y: 7.9, z: L * 0.215, yaw: 0 };
  // On the wing, outside the wheelhouse, looking out over the side and a bit forward.
  return { x: look * (B * 0.5 + 0.4), y: 7.9, z: L * 0.27, yaw: -look * (Math.PI / 2 - 0.35) };
}
// Local view direction for a head turn (yaw > 0 to port, pitch > 0 up).
export function bridgeDir(yaw, pitch) {
  return {
    x: -Math.sin(yaw) * Math.cos(pitch),
    y: Math.sin(pitch),
    z: -Math.cos(yaw) * Math.cos(pitch),
  };
}
// Auto-zoom of the follow camera: slow = close in (for berthing), at speed further out
// (to see what comes). A factor on the distance the player chose, by speed over ground:
// 0,6 × when lying still, 1 × at 3 m/s, up to 1,3 × from 7 m/s (25 km/h).
export function autoZoomFactor(speed) {
  const v = Math.max(0, Math.min(7, Math.abs(speed) || 0));
  return v < 3 ? 0.6 + (0.4 * v) / 3 : 1 + (0.3 * (v - 3)) / 4;
}
export function nextCamera(mode) {
  return CAMERA_MODES[(CAMERA_MODES.indexOf(mode) + 1) % CAMERA_MODES.length];
}
export function followYaw(yaw, heading, dt) {
  const delta = Math.atan2(Math.sin(-heading - yaw), Math.cos(-heading - yaw));
  return yaw + delta * (1 - Math.exp(-dt * 3));
}
export function cameraPose(ship, mode, yaw, elevation, distance) {
  const el = mode === 'top' ? 1.53 : mode === 'follow' ? 0.48 : elevation;
  const length = profileOf(ship).length;
  const look =
    mode === 'follow' ? length * 0.42 + Math.min(length * 0.25, Math.abs(ship.u) * 3) : 0;
  const focus = { x: ship.x + Math.sin(ship.h) * look, y: 0, z: ship.z - Math.cos(ship.h) * look };
  // Position behind the hull, look ahead of the bow. Free/top retain orbit yaw.
  return {
    focus,
    position: {
      x: ship.x + Math.sin(yaw) * distance * Math.cos(el),
      y: distance * Math.sin(el),
      z: ship.z + Math.cos(yaw) * distance * Math.cos(el),
    },
  };
}
