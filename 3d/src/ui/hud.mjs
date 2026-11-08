import * as T from '../../vendor/three.js';
import { readiness, target } from '../game/simulation.mjs';
import { contractOf, loadingTerminal, trafficAt } from '../game/harbor.mjs';
import { TELE_NAMES } from '../game/vessel.mjs';
export function createHud({ $, keys, vesselProfile, camera, chart, loadZone, deliverZone }) {
  return function update(s, paused) {
    const q = readiness(s),
      t = target(s),
      contract = contractOf(s);
    $('gold').textContent = '€ ' + Math.round(s.gold).toLocaleString('nl-NL');
    $('vesselInfo').textContent =
      vesselProfile.length +
      ' × ' +
      vesselProfile.beam.toLocaleString('nl-NL') +
      ' m · ' +
      s.timeScale +
      '×';
    $('job').textContent = String(s.jobs + 1).padStart(2, '0');
    $('speed').textContent = q.speed.toFixed(1).replace('.', ',');
    for (const name of ['bowL', 'bowR']) {
      const active = !!keys[name] && !s.moored && !paused;
      const b = document.querySelector('[data-hold=' + name + ']');
      b.classList.toggle('held', active);
      b.setAttribute('aria-pressed', String(active));
    }
    $('bowStatus').textContent = s.moored
      ? 'BOEG · VASTGEMAAKT'
      : keys.bowL && keys.bowR
        ? 'BOEG · NEUTRAAL'
        : keys.bowL
          ? 'BOEG ← BAKBOORD'
          : keys.bowR
            ? 'BOEG STUURBOORD →'
            : 'BOEG · UIT';
    $('tele').textContent = s.braking ? 'AFSTOPPEN' : TELE_NAMES[s.teleIdx];
    $('stop').classList.toggle('held', !!s.braking);
    $('stop').setAttribute('aria-pressed', String(!!s.braking));
    $('notches').innerHTML = Array.from(
      { length: 9 },
      (_, i) => '<i class="' + (i === s.teleIdx ? 'on' : '') + '"></i>',
    ).join('');
    $('cargo').textContent = Math.round(s.cargo) + ' / ' + s.target + ' t';
    $('progress').style.width = (s.cargo / s.target) * 100 + '%';
    $('status').textContent = s.moored
      ? 'Vastgemaakt · schade ' + Math.round(s.damage) + '%'
      : 'Koers ' +
        (((s.h * 180) / Math.PI + 360) % 360).toFixed(0) +
        '° · schade ' +
        Math.round(s.damage) +
        '%';
    $('moor').querySelector('span').textContent = s.moored ? 'Trossen los' : 'Vastmaken';
    $('missionTitle').textContent =
      s.phase === 'done'
        ? 'Levering voltooid'
        : s.phase === 'load'
          ? 'Laden · ' + loadingTerminal(s).name.replace('Terminal ', '')
          : s.moored && q.distance <= 25
            ? 'Brandstof overzetten.'
            : 'Langszij ' + contract.berth.name.replace('MV ', '') + '.';
    $('missionText').textContent =
      s.phase === 'done'
        ? '€ ' +
          s.lastPayout +
          ' verdiend. ' +
          (s.lastLate
            ? 'Te laat: 25% tijdkorting. '
            : s.lastClean
              ? 'Zonder nieuwe schade afgeleverd. '
              : 'Levering afgerond. ') +
          (s.jobs === 5
            ? 'Havendoel bereikt: € 1.000 bonus!'
            : 'Kies je volgende opdracht in het havenkantoor.')
        : s.pumping
          ? 'De pomp draait. De overslag stopt automatisch.'
          : s.phase === 'load'
            ? s.moored && q.distance <= 25
              ? 'Je ligt aan de laadterminal. Laad ' +
                s.target +
                ' ton voor ' +
                contract.berth.name +
                '.'
              : 'Gooi zo nodig los en keer terug naar de gele ligplaats bij de terminal.'
            : s.moored
              ? q.distance <= 25
                ? 'Je ligt vast. Start bunkeren om je opdracht af te ronden.'
                : 'Je bent geladen. Gooi los en vaar naar ' + contract.berth.name + '.'
              : q.distance < 35
                ? 'Neem gas terug. Parallel liggen en onder 2 km/u: maak vast.'
                : 'Volg de stippellijn naar de groene bunkerplaats. Stop tijdig af.';
    $('pump').hidden = s.phase === 'done' || !s.moored || q.distance > 25;
    $('pump').disabled = s.pumping;
    $('pump').textContent = s.pumping
      ? 'Overslag bezig…'
      : s.phase === 'load'
        ? 'Start laden →'
        : 'Start bunkeren →';
    $('next').hidden = s.phase !== 'done';
    for (let i = 1; i <= 3; i++)
      $('stage' + i).classList.toggle('active', i === (s.phase === 'load' ? 1 : s.moored ? 3 : 2));
    loadZone.m.position.set(loadingTerminal(s).x, 0.6, loadingTerminal(s).z);
    loadZone.edge.position.set(loadingTerminal(s).x, 0.7, loadingTerminal(s).z);
    deliverZone.m.rotation.z = deliverZone.edge.rotation.z = t.h || 0;
    deliverZone.m.position.set(t.x, 0.6, t.z);
    deliverZone.edge.position.set(t.x, 0.7, t.z);
    $('reward').textContent = '€ ' + contract.reward;
    const remaining = Math.max(0, contract.limit - s.elapsed);
    $('deadline').textContent = contract.limit
      ? remaining > 0
        ? 'Spoed · ' +
          Math.floor(remaining / 60) +
          ':' +
          String(Math.floor(remaining % 60)).padStart(2, '0') +
          ' over'
        : 'Te laat · 25% lagere opbrengst'
      : 'Geen tijdsdruk · ' + contract.berth.company;
    $('career').textContent =
      (s.goalClaimed
        ? 'Havenmeester · vrij doorspelen'
        : Math.min(s.jobs, 5) + '/5 leveringen · bonus € 1.000') +
      ' · reputatie ' +
      s.reputation;
    const nearby = trafficAt(s.clock).some((b) => Math.hypot(b.x - s.x, b.z - s.z) < 60);
    $('vts').textContent =
      s.damage >= 100
        ? 'VTS · Schip onbruikbaar. Open Onderhoud → pechhulp.'
        : nearby
          ? 'VTS · Verkeer dichtbij. Houd uitkijk en geef ruimte.'
          : s.damage > 50
            ? 'VTS · Schade hoog. Reparatie aan de laadterminal aanbevolen.'
            : 'VTS · Westpoort · havenadvies: maximaal 10 km/u';
    $('dockGuide').textContent =
      q.distance < 65 && s.phase !== 'done'
        ? 'AFMEREN  ' +
          (q.distance <= 25 ? '✓' : '○') +
          ' binnen 25 m  ' +
          (q.speed < 2 ? '✓' : '○') +
          ' < 2 km/u  ' +
          (q.angle < 20 ? '✓' : '○') +
          ' parallel'
        : '';
    loadZone.m.visible = loadZone.edge.visible = s.phase === 'load';
    deliverZone.m.visible = deliverZone.edge.visible = s.phase !== 'load' && s.phase !== 'done';
    const p = new T.Vector3(t.x, 9, t.z).project(camera);
    $('label').style.left = (p.x * 0.5 + 0.5) * innerWidth + 'px';
    $('label').style.top = (-p.y * 0.5 + 0.5) * innerHeight + 'px';
    $('label').hidden =
      p.z > 1 || Math.abs(p.x) > 1 || Math.abs(p.y) > 1 || s.phase === 'done' || s.moored;
    $('label').textContent =
      t.name +
      ' · ' +
      (q.distance >= 1000 ? (q.distance / 1000).toFixed(1) + ' km' : Math.round(q.distance) + ' m');
    chart(s);
  };
}
