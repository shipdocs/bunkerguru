import * as T from '../../vendor/three.js';
import { clamp } from '../game/simulation.mjs';
import { cameraPose, followYaw, nextCamera, CAMERA_LABELS } from './camera.mjs';
export function createCameraController({ $, camera, zoomLimits, state: s, toast }) {
  let yaw = -s.h,
    elevation = 0.65,
    distance = zoomLimits.initial,
    cameraMode = 'follow',
    dragging = null;
  const focus = new T.Vector3(s.x, 0, s.z);
  function cameraLabel() {
    const label = CAMERA_LABELS[cameraMode];
    $('cam').innerHTML = '◈ <span>' + label + '</span>';
    $('cam').setAttribute('aria-label', label + ' · wisselen (C)');
    $('cam').title = label + ' · C om te wisselen';
  }
  cameraLabel();
  $('cam').onclick = () => {
    cameraMode = nextCamera(cameraMode);
    cameraLabel();
    toast(CAMERA_LABELS[cameraMode]);
  };
  $('zoomIn').onclick = () => (distance = clamp(distance * 0.8, zoomLimits.min, zoomLimits.max));
  $('zoomOut').onclick = () => (distance = clamp(distance * 1.2, zoomLimits.min, zoomLimits.max));
  const cv = $('world');
  cv.onpointerdown = (e) => {
    dragging = { x: e.clientX, y: e.clientY };
    cv.setPointerCapture(e.pointerId);
  };
  cv.onpointermove = (e) => {
    if (!dragging) return;
    if (cameraMode !== 'free') {
      elevation = cameraMode === 'follow' ? 0.48 : 1.35;
      cameraMode = 'free';
      cameraLabel();
    }
    yaw -= (e.clientX - dragging.x) * 0.006;
    elevation = clamp(elevation + (e.clientY - dragging.y) * 0.004, 0.25, 1.35);
    dragging = { x: e.clientX, y: e.clientY };
  };
  cv.onpointerup = cv.onpointercancel = () => (dragging = null);
  cv.onwheel = (e) => {
    e.preventDefault();
    distance = clamp(distance * Math.exp(e.deltaY * 0.001), zoomLimits.min, zoomLimits.max);
  };
  const initialPose = cameraPose(s, cameraMode, yaw, elevation, distance);
  camera.position.set(initialPose.position.x, initialPose.position.y, initialPose.position.z);
  focus.set(initialPose.focus.x, 0, initialPose.focus.z);
  camera.lookAt(focus);

  return {
    release() {
      dragging = null;
    },
    update(s, dt) {
      if (cameraMode === 'follow') yaw = followYaw(yaw, s.h, dt);
      const pose = cameraPose(s, cameraMode, yaw, elevation, distance);
      focus.lerp(new T.Vector3(pose.focus.x, pose.focus.y, pose.focus.z), 1 - Math.exp(-dt * 4));
      const desired = new T.Vector3(pose.position.x, pose.position.y, pose.position.z);
      camera.position.lerp(desired, 1 - Math.exp(-dt * 5));
      camera.lookAt(focus);
    },
  };
}
