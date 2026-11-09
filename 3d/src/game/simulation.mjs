// One simulation step: vessel, contacts, traffic, gates, rivals, incidents and the
// harbour rules of the 2D game (engine.js logic()). No DOM or WebGL.
import { timeScaleOf } from './time-scale.mjs';
import { hullContacts } from './collisions.mjs';
import { vesselStep } from './vessel.mjs';
import { currentAt, tideSpeed } from '../maps/index.mjs';
import { createTraffic, updateTraffic } from './traffic.mjs';
import { createGates, updateGates } from './gates.mjs';
import { createRivals, updateRivals, rivalStartJob, saveRivals } from './rivals.mjs';
import { createEvents, eventTick } from './events.mjs';
import { dockRating } from './docking.mjs';
import { addNews } from './career.mjs';
import {
  MAP,
  LOGIC,
  terminals,
  waits,
  customers,
  terminalOf,
  berthOf,
  inZone,
  up,
  settle,
  planTick,
  acceptOffer,
  addRep,
} from './harbor.mjs';
import { clamp } from './math.mjs';
export { clamp } from './math.mjs';
export { fresh, restore } from './state.mjs';
export const MOOR_KMH = 4; // relative to the quay/ship; you may hold against the current
const noFx = { say() {}, sound() {}, radio() {}, board() {} };

export function createWorldState(s) {
  return {
    traffic: createTraffic(),
    gates: createGates(),
    rivals: createRivals(s.rivals),
    events: createEvents(),
  };
}
export const speedKmh = (s) => Math.hypot(s.u, s.v) * 3.6;
const hdgErr = (a, b) => {
  const d = (((a - b) % Math.PI) + Math.PI) % Math.PI;
  return Math.min(d, Math.PI - d);
};
// Where the boat should go now.
export function target(s) {
  if (s.phase === 'load') return terminalOf(s);
  if (s.phase === 'sail' || s.phase === 'bunker') return berthOf(s);
  return null;
}
export function readiness(s) {
  const t = target(s);
  if (!t) return { distance: Infinity, speed: speedKmh(s), angle: 0, inZone: false };
  const zone = t.kind === 'ship' ? t.zone : t;
  return {
    distance: Math.hypot(s.x - t.x, s.z - t.z),
    speed: speedKmh(s),
    angle: (hdgErr(s.h, t.h) * 180) / Math.PI,
    inZone: inZone(s, zone),
  };
}
export function mooringCandidate(s) {
  const sp = speedKmh(s);
  if (sp > MOOR_KMH)
    return { ok: false, why: 'te veel vaart (' + sp.toFixed(1).replace('.', ',') + ' km/u)' };
  if ((s.phase === 'sail' || s.phase === 'bunker') && s.job) {
    const b = berthOf(s);
    if (inZone(s, b.zone)) {
      const e = (hdgErr(s.h, b.h) * 180) / Math.PI;
      if (e > 20) return { ok: false, why: 'koers ' + Math.round(e) + '° scheef' };
      return { ok: true, to: { kind: 'ship', id: b.id } };
    }
  }
  for (const t of terminals)
    if (inZone(s, t, 2)) return { ok: true, to: { kind: 'terminal', id: t.id } };
  for (const w of waits) if (inZone(s, w, 2)) return { ok: true, to: { kind: 'wait', id: w.id } };
  return { ok: false, why: 'niet bij een ligplaats, terminal of wachtplaats' };
}
// M: make fast / cast off.
export function act(s) {
  if (s.phase === 'sunk') return '';
  if (s.moored) {
    s.moored = false;
    s.mooredTo = null;
    return 'Trossen los';
  }
  const c = mooringCandidate(s);
  if (!c.ok) return 'Kan niet vastmaken: ' + c.why;
  // Rate the manoeuvre before the lines take the speed off.
  if (c.to.kind !== 'wait') {
    s.dockEvent = dockRating(s, c.to);
    if (c.to.kind === 'ship') {
      s.dockTip = s.dockEvent.tip;
      s.jobAnchors = s.dockEvent.anchors;
    }
  }
  s.moored = true;
  s.mooredTo = c.to;
  s.braking = false;
  s.u = s.v = s.r = 0;
  s.teleIdx = 3;
  return c.to.kind === 'ship'
    ? '⚓ Trossen vast langszij. Slangen aan!'
    : c.to.kind === 'terminal'
      ? '⚓ Vast aan ' + terminals.find((t) => t.id === c.to.id).name + ' · laden en winkel'
      : '⚓ Vast aan ' +
        waits.find((w) => w.id === c.to.id).name +
        ' · rusten' +
        (waits.find((w) => w.id === c.to.id).yard ? ' en werf' : '');
}
export const mooredWait = (s) =>
  s.moored && s.mooredTo?.kind === 'wait' ? waits.find((w) => w.id === s.mooredTo.id) : null;

// dt: real seconds since the last step (≤ 1/60 s from the clock).
export function step(s, world, dt, keys = {}, fx = noFx, onClutch) {
  dt = clamp(dt, 0, 0.05);
  const scale = timeScaleOf(s),
    sim = dt * scale,
    logic = sim * LOGIC;
  s.clock = (s.clock || 0) + sim;
  // Tide and current.
  const prevTide = Math.sign(s.tideSpeed || 0);
  s.tideSpeed = tideSpeed(s.clock, s.tidePhase);
  if (MAP.current.tide && prevTide && Math.sign(s.tideSpeed) !== prevTide)
    fx.say(
      s.tideSpeed > 0
        ? '🌊 Kentering: het wordt eb, stroom naar zee neemt toe'
        : '🌊 Kentering: het wordt vloed, stroom landinwaarts',
      4,
    );
  if (s.blackout > 0 && (s.blackout -= logic) <= 0) {
    s.blackout = 0;
    fx.say('✅ Motor draait weer', 3);
  }
  if (s.jamT > 0 && (s.jamT -= logic) <= 0) {
    s.jamT = 0;
    fx.say('✅ Stuurmachine weer vrij', 3);
  }
  const ev = world.events;
  const env = {
    currentAt: (x, z) => currentAt(x, z, s.tideSpeed),
    wind: ev.wind,
    upgrades: { motor: up(s, 'motor'), bow: up(s, 'boeg') },
  };
  const sunk = s.phase === 'sunk';
  const ctx = {
    fender: up(s, 'fender'),
    gates: world.gates,
    traffic: world.traffic,
    rivals: world.rivals,
    onHit: (dmg) => {
      fx.sound('hit', dmg);
      fx.say('💥 Raak! +' + dmg + ' schade', 1.5);
    },
    onRival: (r, impact, share) => rivalHit(s, r, impact, share, fx),
  };
  if (s.blackout > 0) s.teleIdx = 3;
  if (!sunk)
    vesselStep(
      s,
      dt,
      s.blackout > 0 ? { ...keys, bowL: false, bowR: false } : keys,
      (b, h) => hullContacts(b, h, ctx),
      onClutch,
      { env },
    );
  const boats = [s, ...world.rivals.filter((r) => r.mode !== 'sunk')];
  updateTraffic(world.traffic, sim, boats);
  updateGates(world.gates, sim, boats, fx.say);
  const stolen = updateRivals(world.rivals, sim, s, world.traffic, fx, world.gates);
  if (stolen && s.job && s.phase !== 'done') {
    fx.say('📻 ' + stolen.rival.name + ' was eerder bij ' + berthOf(s).name + ' – klus kwijt!', 6);
    addNews(
      s,
      'stole',
      stolen.rival.name + ' kaapt klus bij ' + berthOf(s).name + ' voor de neus van Bunkerguru weg',
    );
    fx.sound('alarm', 2);
    s.job = null;
    s.phase = 'free';
    fx.board();
  }
  eventTick(ev, s, logic, world, fx);
  logicStep(s, world, logic, fx);
  s.rivals = saveRivals(world.rivals);
}

function rivalHit(s, r, impact, share, fx) {
  if (impact <= 0.7 || s.hitCD > 0 || r.hitCD > 0) return;
  s.hitCD = r.hitCD = 1.8;
  const k = (impact - 0.4) * 9;
  const pd = Math.max(1, Math.round(k * (0.8 + 0.4 * (1 - share)) * up(s, 'fender'))),
    od = Math.max(1, Math.round(k * (0.8 + 0.4 * share)));
  s.damage = Math.min(100, s.damage + pd);
  r.damage += od;
  r.cur *= 0.3;
  fx.sound('hit', pd);
  if (share > 0.6) addNews(s, 'rammed', r.name + ' snijdt Bunkerguru af – en betaalt de schade');
  else if (share < 0.4) {
    addNews(s, 'ram', 'Bunkerguru ramt ' + r.name + '! Wraak broeit op de kade');
    r.grudge = (r.grudge || 0) + 1; // remembered: this rival will race you more often
  }
  if (share > 0.6) {
    const fee = pd * 5;
    r.gold = Math.max(0, r.gold - fee);
    s.gold += fee;
    fx.say(
      '💥 ' +
        r.name +
        ' sneed je af: jij +' +
        pd +
        ', hij +' +
        od +
        ' schade · ' +
        r.name +
        ' betaalt jou ' +
        fee +
        ' 🪙',
      3,
    );
  } else if (share < 0.4) {
    const fee = Math.min(Math.round(s.gold), od * 5);
    s.gold -= fee;
    r.gold += fee;
    fx.say(
      '💥 Jij ramde ' +
        r.name +
        ': jij +' +
        pd +
        ', hij +' +
        od +
        ' schade · jij betaalt ' +
        fee +
        ' 🪙',
      3,
    );
  } else
    fx.say(
      '💥 Aanvaring met ' + r.name + ': jij +' + pd + ', hij +' + od + ' schade (beide schuld)',
      2.5,
    );
}

function logicStep(s, world, dt, fx) {
  s.elapsed = (s.elapsed || 0) + dt;
  const sp = speedKmh(s),
    w = mooredWait(s);
  // Fatigue: builds while sailing (~25 min), resting at a waiting place.
  if (w) {
    const f0 = s.fatigue;
    s.fatigue = Math.max(0, s.fatigue - dt * 5);
    if (f0 > 0 && s.fatigue === 0) fx.say('😴 Uitgerust. M = los om verder te varen.', 3);
    if (w.yard && s.damage > 0 && MAP.id !== 'training') {
      const fix = Math.min(s.damage, dt / 1.5, s.gold / 3);
      if (fix > 0) {
        s.damage -= fix;
        s.gold -= fix * 3;
        if (s.damage <= 0.01) {
          s.damage = 0;
          fx.say('🔧 Gerepareerd. M = los', 4);
          fx.sound('coin');
        }
      }
    }
  } else if (!s.moored && s.phase !== 'sunk' && MAP.id !== 'training') {
    const f0 = s.fatigue;
    s.fatigue = Math.min(100, s.fatigue + (dt * 100) / 1500);
    if (f0 < 80 && s.fatigue >= 80)
      fx.say('🥱 Je wordt moe – zoek een wachtplaats (P) om te rusten', 5);
    if (f0 < 100 && s.fatigue >= 100)
      fx.say('😵 Oververmoeid: het roer reageert traag en onnauwkeurig!', 5);
  }
  // Sinking.
  if (s.damage >= 100 && s.phase !== 'sunk') {
    s.moored = false;
    s.mooredTo = null;
    s.prevPhase = s.phase;
    s.phase = 'sunk';
    s.sinkT = 0;
    s.teleIdx = 3;
    // A story, not a wipe-out: the insurer pays most, the client remembers it.
    const loss = MAP.id === 'training' ? 0 : Math.round(s.gold * 0.25);
    s.gold -= loss;
    if (s.job) addRep(s, s.job.client, -5);
    s.sinkLoss = loss;
    addNews(s, 'sunk', 'Bunkerboot gezonken in de ' + MAP.name + ' – sleepboot schiet te hulp');
    fx.card?.({
      who: 'Sleepboot',
      title: 'Gezonken!',
      text: 'Houd je vast, we slepen je naar de werf.',
      kind: 'alarm',
      seconds: 6,
    });
    fx.sound('sink');
    fx.say(
      '🫧 Gezonken! De sleepboot brengt je naar de werf. Eigen risico −' +
        loss +
        ' 🪙' +
        (s.job ? ', reputatie −5.' : '.'),
      7,
    );
  }
  if (s.phase === 'sunk') {
    s.sinkT += dt;
    s.u *= 0.9;
    s.v *= 0.9;
    s.r *= 0.9;
    if (s.sinkT > 5) {
      // Raised and towed to the yard (W): lying there, still damaged, repairs start.
      const yard = waits.find((w) => w.yard);
      const off = yard
        ? yard.wall * ((yard.alongZ ? yard.x1 - yard.x0 : yard.z1 - yard.z0) / 2 - 7)
        : 0;
      const spot = yard
        ? {
            x: yard.alongZ ? yard.x + off : yard.x,
            z: yard.alongZ ? yard.z : yard.z + off,
            h: yard.h,
          }
        : MAP.start;
      Object.assign(s, {
        x: spot.x,
        z: spot.z,
        h: spot.h,
        u: 0,
        v: 0,
        r: 0,
        damage: yard ? 45 : 0,
        rudder: 0,
        rudderCmd: 0,
        cargo: 0,
        rpm: 0,
        engDir: 0,
        startT: 0,
      });
      if (yard) {
        s.moored = true;
        s.mooredTo = { kind: 'wait', id: yard.id };
      }
      s.phase = s.job ? 'load' : 'free';
      fx.say('🔧 Op de werf. Reparatie loopt (3 🪙/pt); M = los als je verder wilt.', 6);
    }
    return;
  }
  if (s.phase === 'done') {
    s.doneT = (s.doneT || 0) + dt;
    if (s.doneT > 4 && !s.boardShown && MAP.id !== 'training') {
      s.boardShown = true;
      s.phase = 'free';
      fx.board();
    }
    return;
  }
  if (!s.job) {
    s.phase = 'free';
    return;
  }
  if (s.phase === 'load') {
    const t = terminalOf(s);
    if (inZone(s, t, 2) && sp < 1.5 && (MAP.id !== 'training' || s.moored)) {
      s.pumping = true;
      s.cargo = Math.min(s.target, s.cargo + dt * 160);
      if (s.cargo >= s.target) {
        s.pumping = false;
        s.phase = 'sail';
        fx.say(
          'Vol. Naar ' +
            berthOf(s).name +
            ', ' +
            berthOf(s).company +
            '. Let op stroming en verkeer!',
          5,
        );
      }
    } else s.pumping = false;
  } else if (s.phase === 'sail') {
    s.pumping = false;
    if (s.damage >= 40 && s.cargo > 0 && MAP.id !== 'training') {
      const leak = ((dt * (s.damage - 30)) / 70) * 1.2;
      s.cargo = Math.max(0, s.cargo - leak);
      if (!s.leakWarned) {
        s.leakWarned = true;
        fx.say(
          '⚠️ Lekkage! Lading loopt weg – minder schade = minder verlies. Werf: W op de kaart',
          6,
        );
        fx.sound('alarm', 2);
      }
    }
    const b = berthOf(s),
      zone = inZone(s, b.zone),
      err = hdgErr(s.h, b.h);
    s.inZone = zone;
    s.hdgErr = err;
    if (s.moored && s.mooredTo?.kind === 'ship' && zone) return beginBunker(s, fx);
    if (zone && sp < 1.5 && err < (10 * Math.PI) / 180 && MAP.id !== 'training') {
      s.holdT += dt;
      if (s.holdT >= 2) return beginBunker(s, fx);
    } else s.holdT = 0;
  } else if (s.phase === 'bunker') {
    if (!s.moored && sp > 2.5) {
      s.phase = 'sail';
      s.holdT = 0;
      s.pumping = false;
      fx.say('⚠️ Losgeslagen! Slangen eraf. Opnieuw langszij (of M = vast).', 2);
      return;
    }
    s.pumping = true;
    const BT = up(s, 'pomp');
    s.bunkerT += dt;
    s.cargo = Math.max(0, (s.deliver || s.target) * (1 - s.bunkerT / BT));
    if (s.bunkerT >= BT) {
      s.pumping = false;
      const bi = s.job?.berth;
      const r = settle(s);
      s.boardShown = false;
      for (const rv of world.rivals)
        if (rv.racing && rv.target === bi)
          Object.assign(rv, { racing: false, mode: 'idle', wait: 30, path: [] });
      fx.sound('coin');
      if (r.frac < 0.98)
        fx.say('⚠️ Maar ' + Math.round(s.deliver) + ' t afgeleverd door lekkage', 4);
      fx.done(r);
    }
  }
}
function beginBunker(s, fx) {
  // Held alongside without lines: rate that too (once per job).
  if (!s.moored && s.job) {
    const b = berthOf(s);
    s.dockEvent = dockRating(s, { kind: 'ship', id: b.id });
    s.dockTip = s.dockEvent.tip;
    s.jobAnchors = s.dockEvent.anchors;
  }
  s.phase = 'bunker';
  s.deliver = s.cargo;
  s.bunkerT = 0;
  fx.say('Slangen aan. Bunkeren!', 3);
}

// Accept a job from the schedule; rivals sometimes race or take another one.
export function takeJob(s, world, id, fx = noFx, rnd = Math.random) {
  if (!acceptOffer(s, id)) return false;
  s.boardShown = true;
  const idle = world.rivals.filter((r) => r.mode === 'idle');
  // Rivals take one of the remaining jobs now and then.
  const cands = s.offers.filter((o) => !customers[o.berth].gate && !o.taken);
  // A race job keeps one idle rival free for the race.
  const spare = s.job.twist === 'race' && !berthOf(s).gate ? 1 : 0;
  if (cands.length && idle.length > spare && rnd() > 0.35) {
    const o = cands[Math.floor(rnd() * cands.length)],
      r = idle[Math.floor(rnd() * idle.length)];
    o.taken = r.name;
    o.takenAt = s.clock * LOGIC;
    rivalStartJob(r, o.berth, world.rivals);
  }
  // …or race you for your ship: the first one alongside gets the job.
  const free = world.rivals.filter((r) => r.mode === 'idle');
  // A rival you rammed holds a grudge and races you more often.
  const grudge = free.reduce((g, r) => Math.max(g, r.grudge || 0), 0);
  const forced = spare > 0;
  if (s.job.twist === 'storm') {
    // The wind itself is kept up by eventTick while the job runs.
    fx.card?.({
      who: 'Havenmeester',
      title: 'Stormwaarschuwing',
      text: 'Harde wind dwars in zolang je klus loopt. Hou ruimte in de bochten.',
      kind: 'alarm',
    });
  }
  if (!berthOf(s).gate && free.length && (forced || rnd() < Math.min(0.85, 0.55 + grudge * 0.1))) {
    const angriest = free.slice().sort((a, b) => (b.grudge || 0) - (a.grudge || 0))[0];
    const r = angriest.grudge > 0 ? angriest : free[Math.floor(rnd() * free.length)];
    fx.card?.({
      who: r.name,
      title: r.name + ' gaat ook voor ' + berthOf(s).name,
      text:
        (r.grudge ? '"Dit is voor die klap van laatst!" ' : '') +
        'Wie het eerst langszij ligt, krijgt de klus.',
    });
    rivalStartJob(r, s.job.berth, world.rivals, true);
    fx.sound('radio');
    if (!fx.card)
      fx.say(
        '📻 ' +
          r.name +
          ': "Ik ga ook voor ' +
          berthOf(s).name +
          '!" – wie het eerst langszij ligt krijgt de klus',
        5,
      );
    fx.radio([
      {
        who: r.name,
        spk: 3,
        text:
          'Hier ' +
          r.name +
          ', ik ga ook voor de ' +
          berthOf(s).name +
          '. Wie het eerst langszij ligt!',
      },
    ]);
  }
  return true;
}
export function recover(s) {
  Object.assign(s, {
    x: MAP.start.x,
    z: MAP.start.z,
    h: MAP.start.h,
    u: 0,
    v: 0,
    r: 0,
    rpm: 0,
    tele: 0,
    teleIdx: 3,
    engDir: 0,
    startT: 0,
    braking: false,
  });
  s.moored = false;
  s.mooredTo = null;
  s.gold = Math.max(0, s.gold - 100);
  if (s.job) {
    s.phase = 'load';
    s.cargo = 0;
  }
}
export { planTick, addRep };
