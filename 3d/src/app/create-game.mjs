import { nextWarp, tempoLabel } from '../game/time-scale.mjs';
import { createTiltShift } from '../render/tilt-shift.mjs';
import { createSimulationClock, MAX_FRAME_SECONDS } from './simulation-clock.mjs';
import { graphicsProfile, GRAPHICS_MODES, GRAPHICS_LABELS } from '../render/graphics.mjs';
import { MAP, quickJob, planTick, LOGIC, up } from '../game/harbor.mjs';
import { HarborAudio } from '../audio/harbor-audio.mjs';
import { createRadio } from '../audio/radio.mjs';
import { tr, getLang, setLang } from '../i18n/index.mjs';
// VHF lines are spoken, not only shown: translate them before they reach the voice.
const spoken = (lines) => lines?.map?.((l) => ({ ...l, text: tr(l.text) })) ?? lines;
import { radioChatter } from '../game/chatter.mjs';
import { renderYaw } from '../game/vessel.mjs';
import { fresh, step, createWorldState, takeJob } from '../game/simulation.mjs';
import { nearestGate, callGate } from '../game/gates.mjs';
import { saveRivals } from '../game/rivals.mjs';
import { saveFleet, clearFleet } from '../game/fleet.mjs';
import { newspaper, paperDue, retirement, rankOf } from '../game/career.mjs';
import { createCards } from '../ui/cards.mjs';
import { portraitFor } from '../ui/portraits.mjs';
import { clockStr, dayClock, berthOf, terminalOf } from '../game/harbor.mjs';
import { addToHall, saveShift } from './storage.mjs';
import { fastTravel, planFastTravel } from '../game/fast-travel.mjs';
import { createWorld } from '../render/world.mjs';
import { createNavigationEffects } from '../render/navigation-effects.mjs';
import { createCameraController } from '../render/camera-controller.mjs';
import { bindVesselEquipment } from '../ui/vessel-equipment.mjs';
import { boomSettings } from '../game/vessel-equipment.mjs';
import { skyLook } from '../render/daylight.mjs';
import { bindHelm } from '../input/helm.mjs';
import { bindPort, mapButtons, switchMap } from '../ui/port.mjs';
import { bindMobilePanels } from '../ui/mobile-panels.mjs';
import { hintFor, isTouch } from '../ui/touch-text.mjs';
import { bindPinch } from '../input/pinch.mjs';
import { haptic } from '../input/haptics.mjs';
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
  const tiltShift = createTiltShift(renderer),
    focusPoint = camera.position.clone();
  const effects = createNavigationEffects(scene, world.primitives.mesh, vesselProfile);
  // "JOUW SCHIP" over the boat for the first seconds, as in the 2D game.
  const ownLabel = world.primitives.textSprite(
    tr('JOUW SCHIP'),
    0,
    26,
    0,
    40,
    '#7df4ff',
    boat,
    0.1,
  );
  ownLabel.visible = false;
  let ownLabelT = 0;
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
  // Phones get hints that name the button on the screen instead of a key.
  const touch = isTouch(),
    hint = hintFor(touch);
  function toast(t, seconds = 4) {
    if (!t) return;
    $('toast').textContent = hint(t);
    toastTime = Math.max(2, seconds);
    $('toast').style.opacity = 1;
  }
  function save() {
    s.rivals = saveRivals(sim.rivals);
    if (MAP.id !== 'training') {
      s.fleet = saveFleet(sim.rivals);
      s.fleetMap = MAP.id;
    }
    saveCareer(s);
  }
  const fx = {
    say: toast,
    card: (c) => card(c),
    sound: (name, ...args) => {
      if (name === 'hit') {
        shake = Math.min(1, 0.3 + (args[0] || 0) / 12);
        // Red flash round the screen edge, as in the 2D game (hitFlash).
        const fl = $('hitFlash');
        fl.className = '';
        void fl.offsetWidth;
        fl.className = 'on';
      }
      sound.fx(name, ...args);
    },
    radio: (lines) => radio.say(spoken(lines), getLang()),
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
      if (r.shift) saveShift(MAP.id, r.shift);
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
          (r.score !== undefined ? ' · ' + r.score + ' punten' : '') +
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
    radar: () => $('radarSwitch').click(),
    navigation: () => $('navSwitch').click(),
    fast: doFastTravel,
    board: () => (started && !paused ? openPort('jobs') : null),
    shop: () => (started && !paused ? openPort('shop') : null),
    gate: () => started && !paused && toast(callGate(nearestGate(sim.gates, s))),
    chart: () => setChartBig(!$('chartPanel').classList.contains?.('expanded')),
    lookLeft: () => cameraControl.lookLeft(),
    // Main engine off / on. Starting takes a few seconds (air start, then running).
    engine: () => {
      if (!started || paused || s.phase === 'sunk') return;
      s.engineOff = !s.engineOff;
      if (s.engineOff) {
        s.teleIdx = 3;
        s.braking = false;
        toast('🔇 Hoofdmotor uit – O = weer starten');
      } else {
        s.startT = 3;
        s.engDir = 0;
        sound.clutch(false);
        toast('🔊 Hoofdmotor start…');
      }
    },
    lookRight: () => cameraControl.lookRight(),
    warp: () => {
      s.timeScale = nextWarp(s.timeScale);
      toast(
        s.timeScale === 6
          ? '⏩ Snelvaart 6× (T = nog sneller)'
          : s.timeScale === 12
            ? '⏩⏩ Snelvaart 12× (T = uit)'
            : 'Normale tijd 3×',
      );
      $('tempo').textContent = tempoLabel(s.timeScale); // the start-screen button shows it too
    },
    horn: () => {
      sound.horn();
    },
    radio: () => toggleRadio(),
    sound: () => $('audio').click(),
    music: () => $('musicSwitch').click(),
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
  const cameraControl = createCameraController({ $, camera, zoomLimits, state: s, toast, boat });
  bindPinch($('world'), { onStart: () => cameraControl.release() });
  const equipment = bindVesselEquipment({
    $,
    getState: () => s,
    isPlaying: () => started && !paused,
    save,
    toast,
  });
  $('pause').onclick = () => {
    release();
    // Esc/pause on the big chart folds it (and resumes, as the chart had paused).
    if ($('chartPanel').classList.contains?.('expanded')) return setChartBig(false);
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
    ownLabel.visible = true;
    ownLabelT = 8;
    paused = false;
    $('pause').textContent = 'Ⅱ';
    if ($('intro').open) $('intro').close();
    rotateTip();
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
  // Said once per browser, a while after the first start: sailing is roomier sideways.
  function rotateTip() {
    try {
      if (!touch || innerHeight <= innerWidth || localStorage.getItem('bunkerguru3d-tip-rotate'))
        return;
      localStorage.setItem('bunkerguru3d-tip-rotate', '1');
    } catch {
      return;
    }
    setTimeout(
      () => started && !paused && toast('📱 Tip: houd je telefoon dwars voor meer zicht.', 6),
      20000,
    );
  }
  // Fullscreen where the browser offers it (not on an iPhone); landscape if it will lock.
  const root = document.documentElement;
  if (touch && document.fullscreenEnabled && root?.requestFullscreen) {
    $('fsBtn').hidden = false;
    $('fsBtn').onclick = () => {
      if (document.fullscreenElement) return document.exitFullscreen?.();
      Promise.resolve(root.requestFullscreen({ navigationUI: 'hide' }))
        .then(() => globalThis.screen?.orientation?.lock?.('landscape'))
        .catch(() => {});
    };
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
  const mobilePanels = bindMobilePanels($, {
    // The tap that closes the big chart must not open it again.
    openChart: () => performance.now() - chartClosedAt > 400 && setChartBig(true),
  });
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
      clearFleet(sim);
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
    const p = newspaper(
      s,
      sim.rivals.filter((r) => !r.own),
    );
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
    clearFleet(sim);
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
    haptic(e.anchors === 3 ? [20, 40, 20, 40, 60] : [20, 40, 30]);
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
  // Sound panel: a slider per channel, saved per browser by the audio itself.
  for (const k of ['master', 'sfx', 'music', 'radio']) {
    const slider = $('v_' + k);
    slider.value = $('t_' + k).textContent = sound.vol[k];
    slider.oninput = () => {
      sound.setVol(k, +slider.value);
      $('t_' + k).textContent = sound.vol[k];
    };
  }
  $('musicSwitch').onclick = () => {
    const on = sound.toggleMusic();
    $('musicSwitch').textContent = on ? 'Muziek aan' : 'Muziek uit';
    $('musicSwitch').setAttribute('aria-pressed', String(on));
    toast(on ? '🎵 Muziek aan' : '🎵 Muziek uit');
  };
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
  // Frame the ship in the open water above the bridge console: shift the projection
  // centre up by half the height the console covers, so the hull is never behind it.
  // The harbour bar sits right under the job panel (desktop): follow its height.
  const missionEl = document.querySelector?.('.mission');
  const placeHarborBar = () => {
    const r = missionEl?.getBoundingClientRect?.();
    if (r && Number.isFinite(r.bottom))
      document.body?.style?.setProperty?.('--mission-bottom', Math.round(r.bottom + 10) + 'px');
  };
  if (typeof ResizeObserver === 'function' && missionEl)
    new ResizeObserver(placeHarborBar).observe(missionEl);
  placeHarborBar();
  function frameAboveConsole() {
    const f = document.querySelector?.('footer');
    const top = f?.getBoundingClientRect?.().top;
    const covered = Number.isFinite(top) ? Math.max(0, innerHeight - top) : 0;
    const shift = Math.round(Math.min(innerHeight * 0.25, covered * 0.5));
    if (shift > 0) camera.setViewOffset(innerWidth, innerHeight, 0, shift, innerWidth, innerHeight);
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();
  }
  if (typeof ResizeObserver === 'function' && document.querySelector?.('footer'))
    new ResizeObserver(() => frameAboveConsole()).observe(document.querySelector('footer'));
  function resize() {
    quality = graphicsProfile(graphicsMode, screenInfo());
    renderer.setPixelRatio(quality.pixelRatio);
    renderer.shadowMap.enabled = quality.shadows;
    renderer.setSize(innerWidth, innerHeight);
    camera.aspect = innerWidth / innerHeight;
    frameAboveConsole();
    scenery.update(s.clock, camera, quality, true);
    $('graphics').textContent = GRAPHICS_LABELS[graphicsMode];
  }
  // Language: the other one on the button; switching reloads so every text is rebuilt.
  $('langBtn').textContent = getLang() === 'en' ? 'Nederlands' : 'English';
  $('langBtn').onclick = () => {
    save();
    const next = setLang(getLang() === 'en' ? 'nl' : 'en');
    // A ?lang= in the address wins over the saved choice: carry the new one along.
    const url = new URL(location.href);
    if (url.searchParams.has('lang')) url.searchParams.set('lang', next);
    location.href = url.toString();
    if (!url.searchParams.has('lang')) location.reload();
  };
  $('graphics').onclick = () => {
    graphicsMode =
      GRAPHICS_MODES[(GRAPHICS_MODES.indexOf(graphicsMode) + 1) % GRAPHICS_MODES.length];
    saveGraphicsMode(graphicsMode);
    resize();
  };
  window.addEventListener('resize', resize);
  resize();
  const chart = createChart($('map'));
  // The big chart is a strategy pause: open it and the harbour waits; close it (tap
  // outside, the chart again, K or Esc) and the game runs on, unless it was paused.
  let chartPaused = false,
    chartClosedAt = -1000;
  function setChartBig(on) {
    const panel = $('chartPanel');
    if (on === !!panel.classList.contains?.('expanded')) return;
    if (on) mobilePanels.close();
    else chartClosedAt = performance.now();
    panel.classList.toggle('expanded', on);
    document.body?.classList?.toggle?.('chartOpen', on);
    const label = panel.querySelector?.('.eyebrow span');
    if (label)
      label.textContent = hint(
        on
          ? '⏸ GEPAUZEERD · TIK OP EEN KLUS · KLIK ERNAAST OM VERDER TE VAREN'
          : 'TIK OM TE VERGROTEN · N ↑',
      );
    if (on && started && !paused) {
      release();
      paused = chartPaused = true;
      $('pause').textContent = '▶';
    } else if (!on && chartPaused) {
      chartPaused = false;
      paused = false;
      $('pause').textContent = 'Ⅱ';
    }
  }
  document.addEventListener?.(
    'pointerdown',
    (e) => {
      if (
        $('chartPanel').classList.contains?.('expanded') &&
        !$('chartPanel').contains?.(e.target) &&
        !e.target?.closest?.('dialog')
      )
        setChartBig(false);
    },
    true,
  );
  // On a phone the big chart fills the screen: a tap beside the drawing folds it too.
  $('chartPanel').onclick = (e) => {
    if (e.target !== $('map') && $('chartPanel').classList.contains?.('expanded'))
      setChartBig(false);
  };
  // On the big chart a job marker opens the planning; elsewhere a tap folds the chart.
  $('map').onclick = (e) => {
    const big = !!$('chartPanel').classList.contains?.('expanded');
    const h = big && chart.hit(e.offsetX, e.offsetY);
    if (h) {
      chartPaused = false; // the planning keeps the pause and lifts it when it closes
      setChartBig(false);
      openPort('jobs');
      // By offer id: the planning may have expired or reordered jobs since the draw.
      const cards = [...$('offers').children];
      cards.find((c) => c.dataset.id === String(h.id))?.scrollIntoView?.({ block: 'center' });
      cards.forEach((c) => c.classList.toggle('focus', c.dataset.id === String(h.id)));
    } else setChartBig(!big);
  };
  const updateHud = createHud({ $, keys, vesselProfile, camera, chart, zones: effects.zones });
  function ui() {
    equipment.render();
    const plan = s.job && !s.moored && started ? planFastTravel(s, sim) : null;
    $('fastBtn').hidden = !plan?.ok;
    // Panels step back while underway (desktop CSS), full again when moored or slow.
    document.body?.classList?.toggle?.('underway', !s.moored && Math.hypot(s.u, s.v) > 0.5);
    updateHud(s, paused, sim);
  }
  let hudElapsed = 0,
    planElapsed = 0;
  const eyePos = camera.position.clone();
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
      if (sim.radioOn) radio.tick(s.clock * LOGIC, () => spoken(radioChatter(s, sim)), getLang());
    }
    sun.position.set(s.x - 220, 220, s.z + 160);
    sun.target.position.set(s.x, 0, s.z);
    sun.target.updateMatrixWorld();
    helm.update();
    time += dt;
    if (ownLabelT > 0 && !paused && (ownLabelT -= dt) <= 0) ownLabel.visible = false;
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
    if (!s.moored) {
      s.equipment.boomSide = 0;
      s.equipment.boomRaised = false;
    }
    boat.userData.tanker.update(playing ? dt : 0, {
      ...boomSettings(s, s.job && berthOf(s), up(s, 'pomp')),
      moored: !!s.moored,
    });
    sound.update(s, playing, keys);
    cameraControl.update(s, dt);
    // Navigation lights: each glow only inside its arc as seen from the camera.
    boat.userData.tanker.lights(camera.getWorldPosition(eyePos), skyLook(dayClock(s)).night);
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
    effects.updateWake(s, dt, quality, paused, (keys.bowR ? 1 : 0) - (keys.bowL ? 1 : 0));
    hudElapsed += dt;
    if (hudElapsed >= 0.2) {
      hudElapsed %= 0.2;
      effects.updateRoute(s);
      ui();
    }
    toastTime -= dt;
    if (toastTime <= 0) $('toast').style.opacity = 0;
    // Miniature look in the rich mode; plain drawing on phones and in the wheelhouse.
    if (tiltShift && !quality.light && cameraControl.mode !== 'bridge') {
      // Keep the band on the ship: where she is on screen, bottom 0 … top 1.
      focusPoint.set(s.x, 0, s.z).project(camera);
      tiltShift.render(scene, camera, Math.min(0.8, Math.max(0.2, focusPoint.y * 0.5 + 0.5)));
    } else renderer.render(scene, camera);
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
