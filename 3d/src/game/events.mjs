// Random incidents and VTS instructions from the 2D game (engine.js eventTick, vtsTick).
// Every 5–9 minutes: blackout, jammed steering, fog, squall, drifting container or a
// seagoing ship stopped in the fairway. VTS: "wait at the harbour mouth until X has
// passed" — obeying earns points and reputation, ignoring costs reputation.
// Times in logic seconds; positions in metres.
import { MAP, basins, currentAt, landAt } from '../maps/index.mjs';
import { addRep, up } from './harbor.mjs';

export function createEvents() {
  return {
    next: 300 + Math.random() * 240,
    fog: 0,
    wind: null,
    flotsam: [],
    stall: null,
    vts: null,
    vtsCd: 60,
  };
}
const sector = () => MAP.radio?.sectors?.[0] || 'Verkeerspost';

export function eventTick(ev, s, dt, world, fx) {
  if (MAP.id === 'training') return;
  if (s.phase === 'sunk' || s.moored) ev.next -= dt * 0.3;
  else ev.next -= dt;
  if (ev.fog > 0) ev.fog -= dt;
  if (ev.wind && (ev.wind.T -= dt) <= 0) {
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
  } else if (pick === 2) {
    fx.sound('alarm', 2);
    ev.fog = 70 + Math.random() * 40;
    fx.say('🌫️ Mistbank – zicht valt weg. Vaar op de kaart.', 6);
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
    const x = Math.max(-MAP.halfWidth + 50, Math.min(MAP.halfWidth - 50, s.x + dir * 450));
    const z = (Math.random() - 0.5) * MAP.riverHalf * 1.2;
    ev.flotsam.push({ x, z, rot: Math.random() * 6, T: 400 });
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

function vtsTick(ev, s, dt, world, fx) {
  if (s.phase === 'sunk' || s.moored) return;
  if (ev.vtsCd > 0) ev.vtsCd -= dt;
  const RH = MAP.riverHalf;
  if (ev.vts) {
    const a = ev.vts;
    a.T -= dt;
    const sh = a.sh,
      passed = Math.sign(sh.x - a.mx) !== a.side0 && Math.abs(sh.x - a.mx) > 30;
    const inMouth =
      s.x > a.x0 &&
      s.x < a.x1 &&
      Math.abs(s.z) > RH - 75 &&
      Math.abs(s.z) < RH &&
      Math.sign(s.z) === a.side;
    if (inMouth && !passed) {
      ev.vts = null;
      ev.vtsCd = 90;
      if (s.job) addRep(s, s.job.client, -6);
      fx.say('📻 VTS: aanwijzing genegeerd! Reputatie −6', 5);
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
    const side = b.z0 >= RH - 1 ? 1 : b.z1 <= -RH + 1 ? -1 : 0;
    if (!side) continue;
    const mx = (b.x0 + b.x1) / 2,
      mz = side * RH,
      d = Math.hypot(s.x - mx, s.z - mz);
    if (d > 350 || d < 60) continue;
    const x0 = b.x0 - 40,
      x1 = b.x1 + 40;
    if (s.x > x0 && s.x < x1 && Math.abs(s.z) > RH - 75 && Math.sign(s.z) === side) continue;
    for (const sh of world.traffic) {
      if (sh.axis !== 'x' || !sh.v) continue;
      const dx = mx - sh.x;
      if (Math.sign(dx) !== Math.sign(sh.v)) continue;
      const eta = Math.abs(dx) / Math.abs(sh.v) / 3; // logic seconds
      if (eta < 8 || eta > 40) continue;
      ev.vts = { sh, x0, x1, mx, side, side0: Math.sign(sh.x - mx), T: eta + 25 };
      fx.say('📻 VTS: wacht bij de ' + b.name + ' tot ' + sh.name + ' gepasseerd is', 6);
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
