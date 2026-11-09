import * as T from '../../vendor/three.js';
import { readiness, target, speedKmh, mooredWait, MOOR_KMH } from '../game/simulation.mjs';
import {
  MAP,
  customers,
  terminalOf,
  berthOf,
  deadlineText,
  timeLeft,
  clockStr,
  dayClock,
  up,
  atTerminal,
} from '../game/harbor.mjs';
import { tideState } from '../maps/index.mjs';
import { rankOf } from '../game/career.mjs';
import { TELE_NAMES } from '../game/vessel.mjs';
import { SHIP } from '../game/ship-profile.mjs';
const nl = (v, d = 1) => v.toFixed(d).replace('.', ',');
export function createHud({ $, keys, vesselProfile, camera, chart, zones }) {
  return function update(s, paused, world) {
    const q = readiness(s),
      t = target(s),
      sp = speedKmh(s),
      job = s.job;
    $('gold').textContent = Math.round(s.gold).toLocaleString('nl-NL') + ' 🪙';
    $('mapName').textContent = MAP.name.toUpperCase();
    $('vesselInfo').textContent =
      vesselProfile.length +
      ' × ' +
      vesselProfile.beam +
      ' m · ' +
      s.timeScale +
      '× · ' +
      (s.handling === 'arcade' ? 'arcade' : 'schipper');
    const tide = tideState(s.clock, s.tidePhase);
    $('clockInfo').textContent = '🕐 ' + clockStr(dayClock(s)) + ' · ' + tide.label;
    $('job').textContent = String(s.jobs + 1).padStart(2, '0');
    $('speed').textContent = nl(sp);
    for (const name of ['bowL', 'bowR']) {
      const active = !!keys[name] && !s.moored && !paused;
      const b = document.querySelector('[data-hold=' + name + ']');
      b.classList.toggle('held', active);
      b.setAttribute('aria-pressed', String(active));
    }
    const bowWeak = Math.abs(s.u) > 2;
    $('bowStatus').textContent = s.moored
      ? 'BOEG · VASTGEMAAKT'
      : s.blackout > 0
        ? 'BLACKOUT · GEEN BOEG'
        : keys.bowL && keys.bowR
          ? 'BOEG · NEUTRAAL'
          : keys.bowL
            ? 'BOEG ← BAKBOORD' + (bowWeak ? ' (te veel vaart)' : '')
            : keys.bowR
              ? 'BOEG STUURBOORD →' + (bowWeak ? ' (te veel vaart)' : '')
              : 'BOEG · UIT';
    const clutch = s.startT > 0 ? ' · KOPPELING' : '';
    $('tele').textContent = s.braking ? 'AFSTOPPEN' : TELE_NAMES[s.teleIdx] + clutch;
    $('stop').classList.toggle('held', !!s.braking);
    $('stop').setAttribute('aria-pressed', String(!!s.braking));
    $('notches').hidden = false;
    $('notches').innerHTML = Array.from(
      { length: 9 },
      (_, i) => '<i class="' + (i === s.teleIdx ? 'on' : '') + '"></i>',
    ).join('');
    $('cargo').textContent = Math.round(s.cargo) + ' / ' + s.target + ' t';
    $('progress').style.width = Math.min(100, (s.cargo / Math.max(1, s.target)) * 100) + '%';
    const heading = Math.round(((((s.h * 180) / Math.PI) % 360) + 360) % 360);
    $('status').textContent =
      (s.moored
        ? 'Vastgemaakt'
        : 'Koers ' + heading + '° · roer ' + Math.round(s.rudder * SHIP.maxRudder) + '°') +
      ' · schade ' +
      Math.round(s.damage) +
      ' · moe ' +
      Math.round(s.fatigue) +
      '%';
    $('moor').querySelector('span').textContent = s.moored ? 'Trossen los' : 'Vastmaken';
    // Mission panel.
    const b = job ? berthOf(s) : null,
      tm = job ? terminalOf(s) : null,
      w = mooredWait(s);
    let title, text;
    if (s.phase === 'sunk')
      [title, text] = [
        'Gezonken',
        'Eigen risico: een kwart van je goud. De sleepboot brengt je naar de werf…',
      ];
    else if (s.phase === 'done' && s.lastJob)
      [title, text] = [
        'Klus klaar!',
        '🪙 +' +
          s.lastJob.pay +
          ' vracht' +
          (s.lastJob.onTime ? ' +' + s.lastJob.bonus + ' op tijd' : ' (te laat: korting)') +
          (s.lastJob.clean ? ' +150 schadevrij' : '') +
          (s.lastJob.vts ? ' +' + s.lastJob.vts + ' VTS' : '') +
          (s.lastJob.tip ? ' +' + s.lastJob.tip + ' fooi' : '') +
          ' = ' +
          s.lastJob.total +
          ' 🪙' +
          (s.lastJob.dayGoal ? ' · 🏆 Dagdoel: +300!' : '') +
          (MAP.id === 'training'
            ? ' 🎓 Oefenklus geslaagd! Kies een echte haven in het havenkantoor.'
            : ''),
      ];
    else if (!job)
      [title, text] = [
        'Vrij varen',
        w
          ? w.yard && s.damage > 0
            ? '🔧 Werf repareert… schade ' + Math.round(s.damage) + ' (3 🪙/pt)'
            : s.fatigue > 0
              ? '😴 Rusten aan ' + w.name + '… ' + Math.round(s.fatigue) + '%'
              : '⚓ ' + w.name + ' · M = los'
          : 'Open de planning (N) en kies een klus. Rusten: wachtplaats (P), reparatie: werf (W).',
      ];
    else if (s.phase === 'load')
      [title, text] = [
        'Laden · ' + tm.name.replace('Terminal ', ''),
        atTerminal(s) && s.pumping
          ? 'Laden… ' + Math.round(s.cargo) + ' / ' + s.target + ' t · B = winkel'
          : 'Haal ' +
            s.target +
            ' t bij ' +
            tm.name +
            ' (geel) – stil liggen om te laden' +
            (MAP.id === 'training' ? ' en vastmaken (M)' : '') +
            '.',
      ];
    else if (s.phase === 'sail')
      [title, text] = [
        'Langszij ' + b.name,
        s.inZone
          ? sp >= 1.5
            ? 'Te snel: ' + nl(sp) + ' km/u'
            : s.hdgErr >= (10 * Math.PI) / 180
              ? 'Koers ' + Math.round((s.hdgErr * 180) / Math.PI) + '° scheef'
              : MAP.id === 'training'
                ? 'M = trossen vast'
                : 'Langszij… houden ' + nl(Math.max(0, 2 - s.holdT)) + ' s (of M = vast)'
          : 'Naar de groene zone langs ' +
            b.name +
            ', ' +
            b.company +
            '.' +
            (s.damage >= 40 ? ' ⚠ Lekkage – werf (W)!' : ''),
      ];
    else if (s.phase === 'bunker')
      [title, text] = ['Bunkeren', 'Bunkeren… ' + Math.round(s.cargo) + ' t aan boord'];
    $('missionTitle').textContent = title;
    $('missionText').textContent = text;
    const left = timeLeft(s);
    $('deadline').innerHTML = job
      ? (deadlineText(s)
          ? deadlineText(s) +
            ' · ' +
            (left >= 0
              ? 'nog ' + Math.ceil(left) + ' min'
              : '<span class="late">' + Math.ceil(-left) + ' min te laat</span>')
          : 'Geen tijdsdruk') +
        ' · ' +
        job.client
      : '';
    $('reward').textContent = job ? job.pay + ' 🪙' : '–';
    $('next').hidden = !!job && s.phase !== 'done';
    $('next').textContent =
      MAP.id === 'training' ? 'Oefenklus / havenkantoor (N) →' : 'Planning openen (N) →';
    for (let i = 1; i <= 3; i++)
      $('stage' + i).classList.toggle(
        'active',
        i === (s.phase === 'load' ? 1 : s.phase === 'sail' ? 2 : s.phase === 'bunker' ? 3 : 0),
      );
    // Zones on the water.
    zones.update(s);
    const r = world.rivals;
    const d = s.day || {};
    $('career').textContent =
      rankOf(s).name +
      ' · ' +
      s.jobs +
      ' klussen · dagdoel ' +
      Math.min(d.onTime || 0, d.clean || 0) +
      '/3' +
      (r.length
        ? ' · ' + r.map((x) => x.name.split(' ')[1] + ' ' + Math.round(x.gold)).join(' · ')
        : '');
    $('radioBtn').textContent = 'Marifoon ' + (world.radioOn ? 'aan' : 'uit');
    // VTS line: nearest relevant information.
    const ev = world.events;
    const near = world.traffic.some((b) => Math.hypot(b.x - s.x, b.z - s.z) < 250);
    const gate = world.gates.find(
      (g) => Math.hypot((g.x0 + g.x1) / 2 - s.x, (g.z0 + g.z1) / 2 - s.z) < 700,
    );
    $('vts').textContent = ev.vts
      ? '📻 VTS: wacht buiten de monding tot ' + ev.vts.sh.name + ' gepasseerd is'
      : gate
        ? (gate.state === 'open' ? '🟢 ' : gate.state === 'prep' ? '🟡 ' : '🔴 ') +
          gate.name +
          (gate.state === 'closed'
            ? ' dicht · C = oproepen'
            : gate.state === 'prep'
              ? ' gaat open…'
              : ' open')
        : s.damage >= 40
          ? '⚠ Schade ' + Math.round(s.damage) + ': lekkage. Werf (W) repareert.'
          : s.fatigue >= 80
            ? '🥱 Moe: rust uit aan een wachtplaats (P).'
            : near
              ? 'VTS · Verkeer dichtbij. Houd stuurboordwal en geef ruimte.'
              : 'VTS · ' + (MAP.radio?.sectors?.[0] || MAP.name) + ' · ' + tide.label;
    $('dockGuide').textContent =
      t && q.distance < 400 && (s.phase === 'sail' || s.phase === 'load')
        ? 'AFMEREN  ' +
          (q.inZone ? '✓' : '○') +
          ' in de zone  ' +
          (q.speed < MOOR_KMH ? '✓' : '○') +
          ' < ' +
          MOOR_KMH +
          ' km/u' +
          (t.kind === 'ship' ? '  ' + (q.angle < 20 ? '✓' : '○') + ' parallel' : '')
        : '';
    if (t) {
      const p = new T.Vector3(t.x, 9, t.z).project(camera);
      $('label').style.left = (p.x * 0.5 + 0.5) * innerWidth + 'px';
      $('label').style.top = (-p.y * 0.5 + 0.5) * innerHeight + 'px';
      $('label').hidden = p.z > 1 || Math.abs(p.x) > 1 || Math.abs(p.y) > 1 || s.moored;
      $('label').textContent =
        t.name +
        ' · ' +
        (q.distance >= 1000 ? nl(q.distance / 1000) + ' km' : Math.round(q.distance) + ' m');
    } else $('label').hidden = true;
    void customers;
    void up;
    chart(s, world);
  };
}
