import { createSimulationClock, MAX_FRAME_SECONDS } from './simulation-clock.mjs';
import { graphicsProfile, GRAPHICS_MODES, GRAPHICS_LABELS } from '../render/graphics.mjs';
import { contractOf, service, trafficAt } from '../game/harbor.mjs';
import { HarborAudio } from '../audio/harbor-audio.mjs';
import { renderYaw } from '../game/vessel.mjs';
import { fresh, step, recover } from '../game/simulation.mjs';
import { createWorld } from '../render/world.mjs';
import { createNavigationEffects } from '../render/navigation-effects.mjs';
import { createCameraController } from '../render/camera-controller.mjs';
import { bindHelm } from '../input/helm.mjs';
import { bindPort } from '../ui/port.mjs';
import { bindMobilePanels } from '../ui/mobile-panels.mjs';
import { createChart } from '../ui/chart.mjs';
import { createHud } from '../ui/hud.mjs';
import { loadCareer, saveCareer, loadGraphicsMode, saveGraphicsMode } from './storage.mjs';
// The only lifecycle owner: compose rendering, UI, input and simulation here.
// Renderer injection lets integration tests run real scene construction without WebGL.
export function createGame({ createRenderer } = {}) {
  const $ = (id) => document.getElementById(id);
  let s = loadCareer();
  const sound = new HarborAudio();
  let graphicsMode = loadGraphicsMode();
  const screenInfo = () => ({
    width: innerWidth,
    height: innerHeight,
    dpr: devicePixelRatio,
    coarse: globalThis.matchMedia?.('(pointer:coarse)').matches || false,
    cores: globalThis.navigator?.hardwareConcurrency ?? 8,
  });
  let quality = graphicsProfile(graphicsMode, screenInfo());
  const world = createWorld({ canvas: $('world'), state: s, quality, createRenderer });
  const {
    renderer,
    scene,
    camera,
    sun,
    waterMat,
    scenery,
    boat,
    trafficMeshes,
    vesselProfile,
    zoomLimits,
  } = world;
  const effects = createNavigationEffects(scene, world.primitives.mesh, vesselProfile);
  const { loadZone, deliverZone } = effects;
  let paused = false,
    started = false,
    time = 0,
    last = performance.now(),
    saveTimer = 0,
    toastTime = 0;
  const keys = {};
  const clock = createSimulationClock();
  function toast(t) {
    $('toast').textContent = t;
    toastTime = 4;
    $('toast').style.opacity = 1;
  }
  function save() {
    saveCareer(s);
  }
  const helm = bindHelm({
    $,
    keys,
    getState: () => s,
    isPlaying: () => started && !paused,
    hasStarted: () => started,
    toast,
    save,
  });
  const cameraControl = createCameraController({ $, camera, zoomLimits, state: s, toast });
  $('pause').onclick = () => {
    release();
    paused = !paused;
    $('pause').textContent = paused ? '▶' : 'Ⅱ';
    toast(paused ? 'Gepauzeerd' : 'Goede vaart');
  };
  $('help').onclick = () => {
    release();
    $('intro').showModal();
    paused = true;
  };
  $('start').onclick = () => {
    sound.start();
    started = true;
    paused = false;
    $('pause').textContent = 'Ⅱ';
    $('intro').close();
  };
  $('intro').addEventListener('cancel', () => {
    started = true;
    paused = false;
  });
  $('rescue').onclick = () => {
    recover(s);
    save();
    toast('Terug aan de terminal. Schip hersteld.');
    $('intro').close();
    started = true;
    paused = false;
  };
  $('upgrade').onclick = () => {
    toast(service(s, 'pump'));
    save();
  };
  bindMobilePanels($);
  function openPort(tab = 'jobs') {
    release();
    paused = true;
    $('pause').textContent = '▶';
    renderPort(tab);
    $('port').showModal();
  }
  function closePort() {
    sound.start();
    $('port').close();
    started = true;
    paused = false;
    $('pause').textContent = 'Ⅱ';
    save();
  }
  const renderPort = bindPort({
    $,
    getState: () => s,
    openPort,
    closePort,
    resetCareer: () => {
      s = fresh();
    },
    save,
    toast,
  });
  $('horn').onclick = () => {
    sound.horn();
    toast('Scheepshoorn');
  };
  $('audio').onclick = () => {
    sound.start();
    sound.toggle();
    $('audio').textContent = sound.muted ? 'Geluid uit' : 'Geluid aan';
  };
  $('audio').textContent = sound.muted ? 'Geluid uit' : 'Geluid aan';
  window.addEventListener('keydown', (e) => {
    if (
      e.code === 'KeyH' &&
      !e.repeat &&
      !document.querySelector('dialog[open]') &&
      started &&
      !paused
    ) {
      e.preventDefault();
      sound.horn();
    }
  });
  function release() {
    clock.reset();
    helm.release();
    cameraControl.release();
  }
  window.addEventListener('blur', () => {
    release();
    if (started) {
      paused = true;
      $('pause').textContent = '▶';
    }
    save();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      release();
      paused = true;
      $('pause').textContent = '▶';
      save();
    }
  });
  window.addEventListener('pagehide', save);
  function resize() {
    quality = graphicsProfile(graphicsMode, screenInfo());
    renderer.setPixelRatio(quality.pixelRatio);
    renderer.shadowMap.enabled = quality.shadows;
    renderer.setSize(innerWidth, innerHeight);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    scenery.update(s.clock, camera, quality, true);
    $('graphics').textContent = GRAPHICS_LABELS[graphicsMode];
  }
  $('graphics').onclick = () => {
    graphicsMode =
      GRAPHICS_MODES[(GRAPHICS_MODES.indexOf(graphicsMode) + 1) % GRAPHICS_MODES.length];
    saveGraphicsMode(graphicsMode);
    resize();
  };
  window.addEventListener('resize', resize);
  resize();
  const chart = createChart($('map'));
  $('map').onclick = () => $('chartPanel').classList.toggle('expanded');
  const updateHud = createHud({ $, keys, vesselProfile, camera, chart, loadZone, deliverZone });
  function ui() {
    updateHud(s, paused);
  }
  let hudElapsed = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    const elapsed = (now - last) / 1000;
    const dt = Math.max(0, Math.min(elapsed, MAX_FRAME_SECONDS));
    last = now;
    const playing = started && !paused && !document.querySelector('dialog[open]');
    const before = s.phase,
      oldJobs = s.jobs;
    const simulated = clock.advance(elapsed, playing, (delta) =>
      step(s, delta, keys, (reversing) => sound.clutch(reversing)),
    );
    if (playing) {
      if (before === 'load' && s.phase === 'deliver')
        toast('Laden gereed. Trossen los en op weg naar ' + contractOf(s).berth.name + '.');
      if (s.jobs > oldJobs) {
        toast(
          s.jobs === 5
            ? 'Havendoel bereikt! € 1.000 bonus.'
            : 'Levering voltooid · € ' + s.lastPayout,
        );
        save();
      }
      saveTimer += simulated;
      if (saveTimer > 3) {
        saveTimer = 0;
        save();
      }
    }
    sun.position.set(s.x - 220, 220, s.z + 160);
    sun.target.position.set(s.x, 0, s.z);
    sun.target.updateMatrixWorld();
    helm.update();
    time += dt;
    waterMat.uniforms.time.value = time;
    boat.position.set(s.x, Math.sin(time * 1.2) * 0.07, s.z);
    boat.rotation.set(Math.sin(time * 0.7) * 0.003, renderYaw(s.h), Math.sin(time) * 0.004);
    for (const [i, b] of trafficAt(s.clock).entries()) {
      trafficMeshes[i].position.set(b.x, 0, b.z);
      trafficMeshes[i].rotation.y = renderYaw(b.h);
    }
    sound.update(s, started && !paused && !document.querySelector('dialog[open]'), keys);
    cameraControl.update(s, dt);
    scenery.update(s.clock, camera, quality, paused || !started);
    effects.updateWake(s, dt, quality, paused);
    hudElapsed += dt;
    if (hudElapsed >= 0.2) {
      hudElapsed %= 0.2;
      effects.updateRoute(s);
      ui();
    }
    toastTime -= dt;
    if (toastTime <= 0) $('toast').style.opacity = 0;
    renderer.render(scene, camera);
  }
  scenery.update(s.clock, camera, quality, true);
  ui();
  $('start').textContent =
    s.jobs > 0 || s.cargo > 0 || !s.moored ? 'Vaart hervatten →' : 'Start je eerste levering →';
  $('intro').showModal();
  requestAnimationFrame(frame);

  return {
    get state() {
      return s;
    },
    scene,
    ui,
    renderPort,
  };
}
