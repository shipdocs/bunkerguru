import { createSimulationClock, MAX_FRAME_SECONDS } from './simulation-clock.mjs';
import { graphicsProfile, GRAPHICS_MODES, GRAPHICS_LABELS } from '../render/graphics.mjs';
import { MAP, quickJob, planTick, LOGIC } from '../game/harbor.mjs';
import { HarborAudio } from '../audio/harbor-audio.mjs';
import { createRadio } from '../audio/radio.mjs';
import { radioChatter } from '../game/chatter.mjs';
import { renderYaw } from '../game/vessel.mjs';
import { fresh, step, createWorldState, takeJob } from '../game/simulation.mjs';
import { nearestGate, callGate } from '../game/gates.mjs';
import { saveRivals } from '../game/rivals.mjs';
import { newspaper, paperDue, retirement, rankOf } from '../game/career.mjs';
import { createCards } from '../ui/cards.mjs';
import { portraitFor } from '../ui/portraits.mjs';
import { clockStr, dayClock, berthOf, terminalOf } from '../game/harbor.mjs';
import { addToHall } from './storage.mjs';
import { fastTravel, planFastTravel } from '../game/fast-travel.mjs';
import { createWorld } from '../render/world.mjs';
import { createNavigationEffects } from '../render/navigation-effects.mjs';
import { createCameraController } from '../render/camera-controller.mjs';
import { bindHelm } from '../input/helm.mjs';
import { bindPort, mapButtons, switchMap } from '../ui/port.mjs';
import { bindMobilePanels } from '../ui/mobile-panels.mjs';
import { createChart } from '../ui/chart.mjs';
import { createHud } from '../ui/hud.mjs';
import { loadCareer, saveCareer, loadGraphicsMode, saveGraphicsMode } from './storage.mjs';
// The only lifecycle owner: compose rendering, UI, input and simulation here.
// Renderer injection lets integration tests run real scene construction without WebGL.
export function createGame({ createRenderer } = {}) {
  const $ = (id) => document.getElementById(id);
  let s = loadCareer();
  const sim = createWorldState(s);
  const sound = new HarborAudio();
  const radio = createRadio(
    {
      get muted() {
        return sound.muted;
      },
      radioOpen: () => sound.fx('radioOpen'),
      radioClose: () => sound.fx('radioClose'),
      babble: (text, spk, done) =>
        sound.sound && !sound.muted
          ? sound.sound.babble(text, spk, done)
          : setTimeout(done, 900 + text.length * 50),
      speechVol: () => (sound.muted ? 0 : (sound.sound?.speechVol?.() ?? 0.8)),
    },
    undefined,
    portraitFor,
  );
  const card = createCards($('momentCard'));
  sim.radioOn = radio.on;
  let graphicsMode = loadGraphicsMode();
  const screenInfo = () => ({
    width: innerWidth,
    height: innerHeight,
    dpr: devicePixelRatio,
    coarse: globalThis.matchMedia?.('(pointer:coarse)').matches || false,
    cores: globalThis.navigator?.hardwareConcurrency ?? 8,
  });
  let quality = graphicsProfile(graphicsMode, screenInfo());
  const world = createWorld({ canvas: $('world'), state: s, world: sim, quality, createRenderer });
  const { renderer, scene, camera, sun, waterMat, scenery, boat, vesselProfile, zoomLimits } =
    world;
  const effects = createNavigationEffects(scene, world.primitives.mesh, vesselProfile);
  let paused = false,
    started = false,
    time = 0,
    last = performance.now(),
    saveTimer = 0,
    toastTime = 0,
    shake = 0,
    fade = 0;
  const keys = {};
  const clock = createSimulationClock();
  function toast(t, seconds = 4) {
    if (!t) return;
    $('toast').textContent = t;
    toastTime = Math.max(2, seconds);
    $('toast').style.opacity = 1;
  }
  function save() {
    s.rivals = saveRivals(sim.rivals);
    saveCareer(s);
  }
  const fx = {
    say: toast,
    card: (c) => card(c),
    sound: (name, ...args) => {
      if (name === 'hit') shake = Math.min(1, 0.3 + (args[0] || 0) / 12);
      sound.fx(name, ...args);
    },
    radio: (lines) => radio.say(lines, 'nl'),
    board: () => {
      // Every third job the Havenkrant comes first, then the schedule.
      if (paperDue(s) && MAP.id !== 'training') return setTimeout(showPaper, 900);
      if (MAP.id !== 'training')
        setTimeout(
          () => started && !document.querySelector('dialog[open]') && openPort('jobs'),
          600,
        );
    },
    done: (r) => {
      coinFly(r.total);
      if (r.promotion)
        card({
          who: 'Havenmeester',
          title: 'Promotie: ' + r.promotion.name + '!',
          text: promotionText(r.promotion.name),
          kind: 'gold',
          seconds: 8,
        });
      toast(
        '✅ Klaar! 🪙 +' +
          r.pay +
          ' vracht' +
          (r.onTime ? ' +' + r.bonus + ' op tijd' : ' (te laat: korting)') +
          (r.clean ? ' +150 schadevrij' : '') +
          (r.tip ? ' +' + r.tip + ' fooi' : '') +
          ' = ' +
          r.total +
          ' 🪙' +
          (r.dayGoal ? ' · 🏆 Dagdoel: +300!' : '') +
          (r.hazmat ? ' · ☣️ schade aan gevaarlijke lading: reputatie −10' : ''),
        6,
      );
      save();
    },
  };
  function openPort(tab = 'jobs') {
    release();
    paused = true;
    $('pause').textContent = '▶';
    renderPort(tab);
    if (!$('port').open) $('port').showModal();
  }
  function closePort() {
    sound.start();
    $('port').close();
    started = true;
    paused = false;
    $('pause').textContent = 'Ⅱ';
    save();
  }
  function doTakeJob(id) {
    if (MAP.id === 'training') {
      quickJob(s);
      toast('Oefenklus: laad aan de oefenterminal (geel) en maak vast met M.', 6);
      return true;
    }
    const ok = takeJob(s, sim, id, fx);
    if (ok) {
      const j = s.job;
      card({
        who: 'Havenmeester',
        title: j.target + ' t voor ' + berthOf(s).name,
        text:
          'Laden bij ' +
          terminalOf(s).name +
          ' (geel), dan langszij in de groene zone. ' +
          (j.client || ''),
      });
    }
    return ok;
  }
  function doFastTravel() {
    if (!started || paused) return;
    const msg = fastTravel(s, sim, fx);
    if (msg.startsWith('⏩')) {
      clock.reset();
      fade = 1;
      save();
    }
    toast(msg, 6);
  }
  const actions = {
    fast: doFastTravel,
    board: () => (started && !paused ? openPort('jobs') : null),
    shop: () => (started && !paused ? openPort('shop') : null),
    gate: () => started && !paused && toast(callGate(nearestGate(sim.gates, s))),
    chart: () => $('chartPanel').classList.toggle('expanded'),
    warp: () => {
      s.timeScale = s.timeScale === 6 ? 3 : 6;
      toast(s.timeScale === 6 ? '⏩ Snelvaart 6× (T = uit)' : 'Normale tijd 3×');
    },
    horn: () => {
      sound.horn();
    },
    radio: () => toggleRadio(),
    sound: () => $('audio').click(),
    music: () => {
      sound.start();
      toast(sound.sound?.toggleMusic() ? '🎵 Muziek aan' : '🎵 Muziek uit');
    },
  };
  function toggleRadio() {
    sim.radioOn = radio.toggle();
    toast(sim.radioOn ? '📻 Marifoon aan' : '📻 Marifoon uit');
  }
  const helm = bindHelm({
    $,
    keys,
    getState: () => s,
    isPlaying: () => started && !paused,
    hasStarted: () => started,
    toast,
    save,
    actions,
    sound: (n) => sound.fx(n),
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
  function begin() {
    sound.start();
    started = true;
    paused = false;
    $('pause').textContent = 'Ⅱ';
    if ($('intro').open) $('intro').close();
    if (!s.job && s.phase !== 'done') {
      if (MAP.id === 'training') {
        quickJob(s);
        toast(
          '🎓 Oefenvaart: laad aan de oefenterminal (geel), vaar naar MT LEERMEESTER en maak vast.',
          7,
        );
      } else setTimeout(() => openPort('jobs'), 400);
    }
  }
  $('start').onclick = begin;
  $('intro').addEventListener('cancel', () => begin());
  $('rescue').onclick = () => {
    $('tow').click();
    $('intro').close();
    begin();
  };
  $('handling').onclick = () => {
    s.handling = s.handling === 'arcade' ? 'schipper' : 'arcade';
    s.braking = false;
    $('handling').textContent = 'Vaargedrag: ' + s.handling;
    save();
  };
  $('handling').textContent = 'Vaargedrag: ' + s.handling;
  mapButtons($('mapList'), MAP.id, (id) => (id === MAP.id ? begin() : switchMap(id, save)), s);
  bindMobilePanels($);
  const renderPort = bindPort({
    $,
    getState: () => s,
    getWorld: () => sim,
    takeJob: doTakeJob,
    openPort,
    closePort,
    resetCareer: () => {
      const keep = { handling: s.handling, timeScale: s.timeScale };
      s = Object.assign(fresh(), keep);
      for (const r of sim.rivals)
        Object.assign(r, {
          gold: 300,
          jobs: 0,
          damage: 0,
          mode: 'idle',
          target: null,
          racing: false,
          path: [],
          cur: 0,
          wait: 6,
        });
    },
    save,
    toast,
    retire: doRetire,
  });
  function promotionText(rank) {
    const unlock = {
      Stuurman: ' Rotterdam is vrijgespeeld.',
      Schipper: ' Europoort is vrijgespeeld.',
      Kapitein: ' Antwerpen is vrijgespeeld – en je kunt met pensioen.',
    };
    return (
      'Gefeliciteerd, ' + rank.toLowerCase() + '.' + (unlock[rank] || ' De haven kijkt naar je op.')
    );
  }
  // De Havenkrant: three headlines and the standing of the bunker companies.
  function showPaper() {
    const p = newspaper(s, sim.rivals);
    $('paperDate').textContent = MAP.name.toUpperCase() + ' · ' + clockStr(dayClock(s));
    $('paperIssue').textContent = 'editie ' + p.issue;
    $('paperLead').textContent = p.headlines[0];
    $('paperNews').innerHTML = p.headlines
      .slice(1)
      .map((h) => '<li>' + h + '</li>')
      .join('');
    $('paperStanding').innerHTML =
      '<tr><th colspan="3">Stand van de bunkerbedrijven</th></tr>' +
      p.standing
        .map(
          (x, i) =>
            '<tr><td>' +
            (i + 1) +
            '.</td><td>' +
            x.name +
            '</td><td>' +
            x.gold +
            ' 🪙 · ' +
            x.jobs +
            ' klussen</td></tr>',
        )
        .join('');
    release();
    paused = true;
    $('paper').showModal();
    save();
  }
  $('paperClose').onclick = () => {
    $('paper').close();
    paused = false;
    started = true;
    if (!s.job) setTimeout(() => openPort('jobs'), 300);
  };
  $('paper').addEventListener('cancel', (e) => {
    e.preventDefault();
    $('paperClose').click();
  });
  // Retirement: a title in the paper, an entry in the hall of fame, a fresh start.
  function doRetire() {
    const r = retirement(s);
    addToHall({ ...r, date: new Date().toISOString().slice(0, 10) });
    $('port').close();
    $('retireTitle').textContent = r.title;
    $('retireText').textContent =
      'Na ' +
      r.jobs +
      ' klussen gaat ' +
      r.rank.toLowerCase() +
      ' Bunkerguru aan wal. Kas: ' +
      r.gold +
      ' 🪙, gemiddelde reputatie ' +
      r.rep +
      '.';
    $('retireScore').textContent = 'Score ' + r.score;
    paused = true;
    $('retireDlg').showModal();
  }
  $('retireNew').onclick = () => {
    const keep = { handling: s.handling, timeScale: s.timeScale, trainingDone: true };
    s = Object.assign(fresh(), keep);
    for (const r of sim.rivals)
      Object.assign(r, {
        gold: 300,
        jobs: 0,
        grudge: 0,
        damage: 0,
        mode: 'idle',
        target: null,
        racing: false,
        path: [],
        cur: 0,
        wait: 6,
      });
    save();
    $('retireDlg').close();
    paused = false;
    toast('Een nieuwe carrière begint. Matroos, aan dek!', 5);
    setTimeout(() => openPort('jobs'), 600);
  };
  $('horn').onclick = () => sound.horn();
  $('fastBtn').onclick = doFastTravel;
  function showDockStamp(e) {
    const el = $('dockStamp');
    el.innerHTML =
      '<b>' +
      '⚓'.repeat(e.anchors) +
      '<i>' +
      '⚓'.repeat(3 - e.anchors) +
      '</i></b><span>' +
      e.label +
      '</span><small>' +
      e.speed.toFixed(1).replace('.', ',') +
      ' km/u' +
      ' · ' +
      Math.round(e.angle) +
      '°' +
      ' · ' +
      Math.round(e.gap) +
      ' m vrij' +
      (e.tip ? ' · fooi +' + e.tip + ' 🪙' : '') +
      '</small>';
    el.className = '';
    void el.offsetWidth;
    el.className = 'show a' + e.anchors;
    if (e.anchors === 3) {
      sound.fx('coin');
      sound.horn();
    } else sound.fx('rope');
  }
  function coinFly(n) {
    const el = $('coinFly');
    el.textContent = '+' + n + ' 🪙';
    el.className = '';
    void el.offsetWidth;
    el.className = 'fly';
  }
  $('gateBtn').onclick = actions.gate;
  $('radioBtn').onclick = toggleRadio;
  $('audio').onclick = () => {
    sound.start();
    sound.toggle();
    $('audio').textContent = sound.muted ? 'Geluid uit' : 'Geluid aan';
  };
  $('audio').textContent = sound.muted ? 'Geluid uit' : 'Geluid aan';
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
  // On the big chart a job marker opens the planning; elsewhere a tap folds the chart.
  $('map').onclick = (e) => {
    const big = $('chartPanel').classList.contains('expanded');
    const h = big && chart.hit(e.offsetX, e.offsetY);
    if (h) {
      openPort('jobs');
      [...$('offers').children]
        .find((c) => c.dataset.key === String(h.n))
        ?.scrollIntoView?.({ block: 'center' });
      [...$('offers').children].forEach((c) =>
        c.classList.toggle('focus', c.dataset.key === String(h.n)),
      );
    } else $('chartPanel').classList.toggle('expanded');
  };
  const updateHud = createHud({ $, keys, vesselProfile, camera, chart, zones: effects.zones });
  function ui() {
    const plan = s.job && !s.moored && started ? planFastTravel(s, sim) : null;
    $('fastBtn').hidden = !plan?.ok;
    // Panels step back while underway (desktop CSS), full again when moored or slow.
    document.body?.classList?.toggle?.('underway', !s.moored && Math.hypot(s.u, s.v) > 0.5);
    updateHud(s, paused, sim);
  }
  let hudElapsed = 0,
    planElapsed = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    const elapsed = (now - last) / 1000;
    const dt = Math.max(0, Math.min(elapsed, MAX_FRAME_SECONDS));
    last = now;
    const playing = started && !paused && !document.querySelector('dialog[open]');
    clock.advance(elapsed, playing, (delta) =>
      step(s, sim, delta, keys, fx, (reversing) => sound.clutch(reversing)),
    );
    if (playing) {
      saveTimer += dt;
      if (saveTimer > 3) {
        saveTimer = 0;
        save();
      }
      planElapsed += dt;
      if (planElapsed > 6) {
        planElapsed = 0;
        planTick(s);
      }
      if (sim.radioOn) radio.tick(s.clock * LOGIC, () => radioChatter(s, sim), 'nl');
    }
    sun.position.set(s.x - 220, 220, s.z + 160);
    sun.target.position.set(s.x, 0, s.z);
    sun.target.updateMatrixWorld();
    helm.update();
    time += dt;
    waterMat.uniforms.time.value = time;
    const level = world.updateAmbient(s);
    const sinking = s.phase === 'sunk' ? Math.min(1, (s.sinkT || 0) / 4) : 0;
    boat.position.set(s.x, level + Math.sin(time * 1.2) * 0.07 - sinking * 8, s.z);
    // Damage shows: the ship lists and trims as she takes on water.
    const list = Math.min(1, s.damage / 100) * 0.07;
    boat.rotation.set(
      Math.sin(time * 0.7) * 0.003 + sinking * 0.3 + list * 0.3,
      renderYaw(s.h),
      Math.sin(time) * 0.004 + list,
    );
    world.updateDynamic(sim, time);
    sound.update(s, playing, keys);
    cameraControl.update(s, dt);
    if (shake > 0) {
      camera.position.x += (Math.random() - 0.5) * shake * 3;
      camera.position.y += (Math.random() - 0.5) * shake * 2;
      shake = Math.max(0, shake - dt * 2.5);
    }
    if (s.dockEvent) {
      showDockStamp(s.dockEvent);
      s.dockEvent = null;
    }
    if (fade > 0) {
      fade = Math.max(0, fade - dt * 1.5);
      document.body?.style?.setProperty?.('--fade', String(fade));
    }
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
  planTick(s);
  ui();
  $('start').textContent = s.jobs > 0 || s.job ? 'Vaart hervatten →' : 'Aan boord →';
  $('intro').showModal();
  requestAnimationFrame(frame);

  return {
    get state() {
      return s;
    },
    world: sim,
    scene,
    ui,
    renderPort,
    showPaper, // debug/browser tests
  };
}
