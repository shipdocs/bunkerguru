import * as T from '../../vendor/three.js';
import { clamp } from '../game/simulation.mjs';
import { profileOf } from '../game/ship-profile.mjs';
import {
  cameraPose,
  followYaw,
  nextCamera,
  CAMERA_LABELS,
  BRIDGE_LOOKS,
  bridgeEye,
  bridgeDir,
} from './camera.mjs';
const FOV = 44;
export function createCameraController({ $, camera, zoomLimits, state: s, toast, boat }) {
  let yaw = -s.h,
    elevation = 0.65,
    distance = zoomLimits.initial,
    cameraMode = 'follow',
    dragging = null;
  // Wheelhouse: which window (−1 port wing, 0 front, +1 starboard wing), a head turn
  // on top of it (drag), and binoculars (wheel = field of view).
  const bridge = { look: 0, yaw: 0, pitch: -0.04, fov: 55, eye: null };
  const focus = new T.Vector3(s.x, 0, s.z);
  function cameraLabel() {
    const label = cameraMode === 'bridge' ? BRIDGE_LOOKS[bridge.look] : CAMERA_LABELS[cameraMode];
    $('cam').innerHTML = '◈ <span>' + label + '</span>';
    $('cam').setAttribute('aria-label', label + ' · wisselen (F)');
    $('cam').title = label + ' · F om te wisselen';
    document.body?.classList?.toggle?.('bridgeView', cameraMode === 'bridge');
    const lk = $('bridgeLooks');
    if (lk)
      for (const b of lk.querySelectorAll?.('button') || [])
        b.classList.toggle('selected', Number(b.dataset.look) === bridge.look);
  }
  function setMode(mode) {
    const was = cameraMode;
    cameraMode = mode;
    if (mode === 'bridge') {
      Object.assign(bridge, { look: 0, yaw: 0, pitch: -0.04, eye: null });
    } else if (was === 'bridge') {
      camera.up.set(0, 1, 0);
      camera.fov = FOV;
      camera.updateProjectionMatrix();
    }
    cameraLabel();
  }
  cameraLabel();
  $('cam').onclick = () => {
    setMode(nextCamera(cameraMode));
    toast(
      cameraMode === 'bridge'
        ? 'Stuurhuis · Z/X brugvleugels · slepen = rondkijken · scrollen = verrekijker'
        : CAMERA_LABELS[cameraMode],
    );
  };
  // Port/starboard wing: Z and X step the view one window to the left or right.
  function look(step) {
    if (cameraMode !== 'bridge') setMode('bridge');
    bridge.look = clamp(bridge.look + step, -1, 1);
    bridge.yaw = 0;
    bridge.pitch = bridge.look ? -0.3 : -0.04; // on a wing: look down along the side
    cameraLabel();
  }
  const lk = $('bridgeLooks');
  if (lk)
    for (const b of lk.querySelectorAll?.('button') || [])
      b.onclick = () => look(Number(b.dataset.look) - bridge.look);
  const zoom = (k) => {
    if (cameraMode === 'bridge') bridge.fov = clamp(bridge.fov * k, 14, 70);
    else distance = clamp(distance * k, zoomLimits.min, zoomLimits.max);
  };
  $('zoomIn').onclick = () => zoom(0.8);
  $('zoomOut').onclick = () => zoom(1.25);
  const cv = $('world');
  cv.onpointerdown = (e) => {
    dragging = { x: e.clientX, y: e.clientY };
    cv.setPointerCapture(e.pointerId);
  };
  cv.onpointermove = (e) => {
    if (!dragging) return;
    const dx = e.clientX - dragging.x,
      dy = e.clientY - dragging.y;
    dragging = { x: e.clientX, y: e.clientY };
    if (cameraMode === 'bridge') {
      // Turn your head, not the ship: limited to what you can see from the window.
      bridge.yaw = clamp(bridge.yaw + dx * 0.004, -1.9, 1.9);
      bridge.pitch = clamp(bridge.pitch - dy * 0.003, -0.6, 0.35);
      return;
    }
    if (cameraMode !== 'free') {
      elevation = cameraMode === 'follow' ? 0.48 : 1.35;
      cameraMode = 'free';
      cameraLabel();
    }
    yaw -= dx * 0.006;
    elevation = clamp(elevation + dy * 0.004, 0.25, 1.35);
  };
  cv.onpointerup = cv.onpointercancel = () => (dragging = null);
  cv.onwheel = (e) => {
    e.preventDefault();
    zoom(Math.exp(e.deltaY * 0.001));
  };
  const initialPose = cameraPose(s, cameraMode, yaw, elevation, distance);
  camera.position.set(initialPose.position.x, initialPose.position.y, initialPose.position.z);
  focus.set(initialPose.focus.x, 0, initialPose.focus.z);
  camera.lookAt(focus);

  const eyeW = new T.Vector3(),
    aimW = new T.Vector3(),
    upW = new T.Vector3();
  function updateBridge(s, dt) {
    // The eye rides the hull: bobbing, list and trim come from the boat mesh itself.
    const p = profileOf(s),
      target = bridgeEye(p, bridge.look);
    const k = 1 - Math.exp(-dt * 6);
    const e = (bridge.eye = bridge.eye || { ...target });
    for (const key of ['x', 'y', 'z', 'yaw']) e[key] += (target[key] - e[key]) * k;
    boat.updateMatrixWorld(true);
    const d = bridgeDir(e.yaw + bridge.yaw, bridge.pitch);
    eyeW.set(e.x, e.y, e.z);
    aimW.set(e.x + d.x * 100, e.y + d.y * 100, e.z + d.z * 100);
    boat.localToWorld(eyeW);
    boat.localToWorld(aimW);
    upW.set(0, 1, 0).transformDirection(boat.matrixWorld);
    camera.position.copy(eyeW);
    camera.up.copy(upW);
    camera.lookAt(aimW);
    if (Math.abs(camera.fov - bridge.fov) > 0.01) {
      camera.fov += (bridge.fov - camera.fov) * k;
      camera.updateProjectionMatrix();
    }
  }
  return {
    release() {
      dragging = null;
    },
    get mode() {
      return cameraMode;
    },
    lookLeft: () => look(-1),
    lookRight: () => look(1),
    update(s, dt) {
      if (cameraMode === 'bridge' && boat) return updateBridge(s, dt);
      if (cameraMode === 'follow') yaw = followYaw(yaw, s.h, dt);
      const pose = cameraPose(s, cameraMode, yaw, elevation, distance);
      focus.lerp(new T.Vector3(pose.focus.x, pose.focus.y, pose.focus.z), 1 - Math.exp(-dt * 4));
      const desired = new T.Vector3(pose.position.x, pose.position.y, pose.position.z);
      camera.position.lerp(desired, 1 - Math.exp(-dt * 5));
      camera.lookAt(focus);
    },
  };
}
