// Random incidents and VTS instructions from the 2D game (engine.js eventTick, vtsTick).
// Every 5–9 minutes: blackout, jammed steering, fog, squall, drifting container or a
// seagoing ship stopped in the fairway. VTS: "wait at the harbour mouth until X has
// passed" — obeying earns points and reputation, ignoring costs reputation.
// Times in logic seconds; positions in metres.
import {
  MAP,
  basins,
  currentAt,
  landAt,
  riverFrame,
  riverAt,
  riverSpan,
  riverHalfAt,
  basinMouth,
} from '../maps/index.mjs';
import { addRep, up } from './harbor.mjs';
import { addNews } from './career.mjs';

export function createEvents() {
  return {
    next: 300 + Math.random() * 240,
    fog: 0,
    wind: null,
    flotsam: [],
    stall: null,
    vts: null,
    vtsCd: 60,
    wx: {
      kind: 'helder',
      wind: { x: 0, z: 0 },
      bft: 2,
      dir: 'ZW',
      next: 200 + Math.random() * 200,
    },
  };
}
// Weather of the 2D game (engine.js weatherTick): every 8–15 minutes a new picture.
// Clear, overcast, rain or squalls, with a standing wind you feel from 4 Bft.
export const WINDS = ['N', 'NO', 'O', 'ZO', 'Z', 'ZW', 'W', 'NW'];
export function weatherTick(ev, dt, fx, rnd = Math.random) {
  const wx = ev.wx;
  if (MAP.id === 'training' || (wx.next -= dt) > 0) return;
  wx.next = 480 + rnd() * 420;
  const r = rnd();
  wx.kind = r < 0.5 ? 'helder' : r < 0.75 ? 'bewolkt' : r < 0.9 ? 'regen' : 'buien';
  const di = Math.floor(rnd() * 8);
  wx.bft =
    wx.kind === 'buien'
      ? 6 + Math.floor(rnd() * 2)
      : wx.kind === 'regen'
        ? 4 + Math.floor(rnd() * 2)
        : 1 + Math.floor(rnd() * 4);
  // Wind FROM compass point di (north = −z, east = +x) blows the other way.
  const a = (di * Math.PI) / 4,
    f = Math.max(0, wx.bft - 3) * 0.17;
  wx.wind = { x: -Math.sin(a) * f, z: Math.cos(a) * f };
  wx.dir = WINDS[di];
  fx.radio?.([
    {
      who: sector(),
      spk: 0,
      text: `Weerbericht: wind ${wx.dir} ${wx.bft}, ${wx.kind}${wx.bft >= 6 ? ', harde vlagen op de rivier' : ''}.`,
    },
  ]);
  fx.say?.(`🌤 Weer: ${wx.kind}, wind ${wx.dir} ${wx.bft}`, 4);
}
// Standing wind plus any gust or storm from an incident, as one vector for the hull.
export function windOf(ev) {
  const w = ev.wx?.wind;
  if (!ev.wind) return w && (w.x || w.z) ? w : null;
  return { x: ev.wind.x + (w?.x || 0), z: ev.wind.z + (w?.z || 0) };
}
const sector = () => MAP.radio?.sectors?.[0] || 'Verkeerspost';

export function eventTick(ev, s, dt, world, fx) {
  if (MAP.id === 'training') return;
  weatherTick(ev, dt, fx);
  if (s.phase === 'sunk' || s.moored) ev.next -= dt * 0.3;
  else ev.next -= dt;
  if (ev.fog > 0) ev.fog -= dt;
  // A storm job keeps a hard beam wind going until it is done (also after a reload).
  const storm = s.job?.twist === 'storm' && s.phase !== 'done';
  if (storm && !ev.wind) {
    // Across the river (the fairway runs along x): a true beam wind while underway.
    const side = Math.random() < 0.5 ? -1 : 1,
      skew = (Math.random() - 0.5) * 0.4;
    ev.wind = { x: Math.sin(skew) * 0.9, z: side * Math.cos(skew) * 0.9, T: Infinity, job: true };
  }
  if (ev.wind && ((ev.wind.T -= dt) <= 0 || (ev.wind.job && !storm))) {
    ev.wind = null;
    fx.say('Wind is gaan liggen', 3);
  }
  if (ev.stall && (ev.stall.T -= dt) <= 0) {
    ev.stall.sh.v = ev.stall.v;
    ev.stall = null;
  }
  for (const f of ev.flotsam) {
    const c = currentAt(f.x, f.z, s.tideSpeed || 0);
    f.x += c.x * dt * 3 * 0.9;
    f.z += c.z * dt * 3 * 0.9;
    f.rot += dt * 0.05;
    f.T -= dt;
    if (f.cd > 0) f.cd -= dt;
    // Hit: distance to the hull's centre line.
    const L = 55,
      sn = Math.sin(s.h),
      cs = Math.cos(s.h),
      dx = f.x - s.x,
      dz = f.z - s.z;
    const along = Math.max(-L, Math.min(L, dx * sn - dz * cs)),
      px = s.x + sn * along,
      pz = s.z - cs * along,
      d = Math.hypot(f.x - px, f.z - pz);
    if (d < 5.5 + 6 && !(f.cd > 0) && s.phase !== 'sunk') {
      // Speed through the water: a container drifting with you does no harm.
      const c2 = currentAt(f.x, f.z, s.tideSpeed || 0),
        gx = Math.sin(s.h) * s.u + Math.cos(s.h) * s.v,
        gz = -Math.cos(s.h) * s.u + Math.sin(s.h) * s.v;
      const sp = Math.hypot(gx - c2.x, gz - c2.z);
      const dmg = Math.max(2, Math.round(sp * 2.5 * up(s, 'fender')));
      s.damage += dmg;
      f.cd = 3;
      fx.sound('hit', dmg);
      fx.say('💥 Drijvende container geraakt −' + dmg, 3);
      f.x += ((f.x - px) / (d || 1)) * 15;
      f.z += ((f.z - pz) / (d || 1)) * 15;
    }
  }
  ev.flotsam = ev.flotsam.filter((f) => f.T > 0 && !landAt(f.x, f.z));
  vtsTick(ev, s, dt, world, fx);
  if (ev.next > 0) return;
  ev.next = 300 + Math.random() * 240;
  const pick = Math.floor(Math.random() * 6);
  if (pick === 0) {
    fx.sound('alarm', 4);
    s.blackout = 18 + Math.random() * 14;
    s.teleIdx = 3;
    fx.say('⚠️ BLACKOUT – hoofdmotor uitgevallen! We drijven…', 6);
    fx.card?.({
      who: 'Machinist',
      title: 'Blackout!',
      text: 'Hoofdmotor uitgevallen – we drijven. Boegschroef ook dood.',
      kind: 'alarm',
    });
    fx.radio([
      {
        who: 'Bunkerguru',
        spk: 1,
        text: 'Verkeerscentrale, Bunkerguru, motorstoring, onmanoeuvreerbaar, drijvend in de vaargeul.',
      },
    ]);
  } else if (pick === 1) {
    fx.sound('alarm', 3);
    s.jamT = 9 + Math.random() * 6;
    fx.say('⚠️ Stuurmachine klemt – roer blijft staan!', 5);
    fx.card?.({
      who: 'Machinist',
      title: 'Roer klemt!',
      text: 'De stuurmachine zit vast. Stuur met machine en boegschroef.',
      kind: 'alarm',
    });
  } else if (pick === 2) {
    fx.sound('alarm', 2);
    ev.fog = 70 + Math.random() * 40;
    fx.say('🌫️ Mistbank – zicht valt weg. Vaar op de radar (📡).', 6);
    fx.radio([
      {
        who: sector(),
        spk: 0,
        text: 'Alle schepen, mist in de sector, zicht onder de 200 meter, vaart minderen en geluidsseinen geven.',
      },
    ]);
  } else if (pick === 3) {
    const a = Math.random() * Math.PI * 2,
      f = 0.5 + Math.random() * 0.5;
    ev.wind = { x: Math.cos(a) * f, z: Math.sin(a) * f, T: 40 + Math.random() * 30 };
    fx.sound('alarm', 2);
    fx.say('💨 Windvlaag! Harde wind dwars in – let op je verlijering.', 6);
  } else if (pick === 4) {
    const dir = (s.tideSpeed || 0) >= 0 ? 1 : -1;
    // Placed 450 m up or down the river, somewhere in the fairway; from then on the
    // container drifts in the world.
    const st = Math.max(
      -riverSpan + 50,
      Math.min(riverSpan - 50, riverFrame(s.x, s.z).s + dir * 450),
    );
    const n = (Math.random() - 0.5) * riverHalfAt(st) * 1.2,
      at = riverAt(st, n);
    ev.flotsam.push({ x: at.x, z: at.z, rot: Math.random() * 6, T: 400 });
    fx.sound('alarm', 2);
    fx.say('📦 Drijvende container in de vaargeul, komt met de stroom mee!', 6);
    fx.radio([
      {
        who: sector(),
        spk: 0,
        text: 'Scheepvaartbericht: drijvende container in de vaargeul, goed uitkijken.',
      },
    ]);
  } else {
    const cands = world.traffic.filter((t) => t.axis === 'x' && t.v !== 0);
    if (!cands.length) {
      ev.next = 30;
      return;
    }
    const sh = cands[Math.floor(Math.random() * cands.length)];
    ev.stall = { sh, v: sh.v, T: 100 + Math.random() * 60 };
    sh.v = 0;
    fx.sound('alarm', 2);
    fx.say('⚠️ ' + sh.name + ' heeft motorstoring en ligt stil in de vaargeul', 6);
    fx.radio([
      {
        who: sh.name,
        spk: 2,
        text:
          'Alle schepen, hier ' +
          sh.name +
          ', motorstoring, ik lig stil in de vaargeul, voorzichtig passeren.',
      },
    ]);
  }
}

// Harbour mouths and the lanes of the seagoing ships, measured along the river: the
// player and the ships are looked up at their station (x = along, z = across; see
// riverFrame), the state itself (s) stays untouched.
const frameOf = (o) => {
  const f = riverFrame(o.x, o.z);
  return { x: f.s, z: f.n };
};
function vtsTick(ev, s, dt, world, fx) {
  if (s.phase === 'sunk' || s.moored) return;
  const p = frameOf(s);
  if (ev.vtsCd > 0) ev.vtsCd -= dt;
  const RH = riverHalfAt(p.x);
  if (ev.vts) {
    const a = ev.vts;
    a.T -= dt;
    const sh = a.sh,
      sx = frameOf(sh).x,
      passed = Math.sign(sx - a.mx) !== a.side0 && Math.abs(sx - a.mx) > 30;
    const inMouth =
      p.x > a.x0 &&
      p.x < a.x1 &&
      Math.abs(p.z) > RH - 75 &&
      Math.abs(p.z) < RH &&
      Math.sign(p.z) === a.side;
    if (inMouth && !passed) {
      ev.vts = null;
      ev.vtsCd = 90;
      if (s.job) addRep(s, s.job.client, -6);
      fx.say('📻 VTS: aanwijzing genegeerd! Reputatie −6', 5);
      addNews(s, 'vts', 'VTS berispt Bunkerguru: aanwijzing genegeerd bij ' + MAP.name);
      fx.radio([
        {
          who: sector(),
          spk: 0,
          text: 'Bunkerguru, u heeft niet gewacht zoals aangegeven. Dit wordt gemeld.',
        },
      ]);
      return;
    }
    if (passed) {
      ev.vts = null;
      ev.vtsCd = 60;
      s.vtsBonus = (s.vtsBonus || 0) + 60;
      if (s.job) addRep(s, s.job.client, 1);
      fx.say('📻 VTS: dank u, ' + sh.name + ' is gepasseerd, u kunt doorvaren. +60 🪙', 4);
      fx.radio([
        {
          who: sector(),
          spk: 0,
          text: 'Bunkerguru, bedankt voor het wachten, vaarwater is vrij, u kunt doorvaren.',
        },
      ]);
      return;
    }
    if (a.T <= 0) {
      ev.vts = null;
      ev.vtsCd = 60;
    }
    return;
  }
  if (ev.vtsCd > 0) return;
  for (const b of basins) {
    const m = basinMouth(b);
    if (!m || !m.side) continue;
    const side = m.side,
      mx = m.s,
      mz = side * RH,
      d = Math.hypot(p.x - mx, p.z - mz);
    if (d > 350 || d < 60) continue;
    const x0 = mx - m.half - 40,
      x1 = mx + m.half + 40;
    if (p.x > x0 && p.x < x1 && Math.abs(p.z) > RH - 75 && Math.sign(p.z) === side) continue;
    for (const sh of world.traffic) {
      if (sh.axis !== 'x' || !sh.v) continue;
      const shx = frameOf(sh).x,
        dx = mx - shx;
      if (Math.sign(dx) !== Math.sign(sh.v)) continue;
      const eta = Math.abs(dx) / Math.abs(sh.v) / 3; // logic seconds
      if (eta < 8 || eta > 40) continue;
      ev.vts = { sh, x0, x1, mx, side, side0: Math.sign(shx - mx), T: eta + 25 };
      fx.say('📻 VTS: wacht bij de ' + b.name + ' tot ' + sh.name + ' gepasseerd is', 6);
      fx.card?.({
        who: sector(),
        title: 'VTS: wachten bij de ' + b.name,
        text: sh.name + ' komt eraan. Blijf buiten de monding tot hij gepasseerd is.',
      });
      fx.sound('alarm', 1);
      fx.radio([
        {
          who: sector(),
          spk: 0,
          text:
            'Bunkerguru, ' +
            sector() +
            ', ' +
            sh.name +
            ' nadert de ' +
            b.name +
            '. Wacht buiten de monding tot hij gepasseerd is.',
        },
      ]);
      return;
    }
  }
}
