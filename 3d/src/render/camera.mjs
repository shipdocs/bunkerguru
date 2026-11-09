import { profileOf } from '../game/ship-profile.mjs';
export const cameraRange = (p) => ({
  min: Math.max(70, p.length * 1.45),
  max: Math.max(1400, p.length * 12),
  initial: Math.max(160, p.length * 3.1),
});
export const CAMERA_MODES = ['follow', 'free', 'top'];
export const CAMERA_LABELS = { follow: 'Volgcamera', free: 'Vrije camera', top: 'Bovenaanzicht' };
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
