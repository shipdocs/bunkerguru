// Harbour office: schedule (planning), shop, harbour choice and help. No render loop.
import {
  MAP,
  customers,
  terminals,
  UPG,
  buy,
  planTick,
  kindLabel,
  clockStr,
  dayClock,
  logicTime,
  CLOCK_RATE,
  repOf,
  atTerminal,
} from '../game/harbor.mjs';
import { MAP_LIST, MAP_KEY } from '../maps/index.mjs';
import { tideState } from '../maps/index.mjs';
import { recover } from '../game/simulation.mjs';

export function mapButtons(container, current, onPick) {
  container.replaceChildren();
  for (const m of MAP_LIST) {
    const b = document.createElement('button');
    b.className = 'mapPick' + (m.id === current ? ' selected' : '');
    b.innerHTML = '<b>' + m.icon + ' ' + m.name + '</b><span>' + (m.desc?.nl || '') + '</span>';
    b.onclick = () => onPick(m.id);
    container.append(b);
  }
}
export function switchMap(id, save) {
  save();
  try {
    localStorage.setItem(MAP_KEY, id);
  } catch {}
  const url = new URL(location.href);
  url.searchParams.set('map', id);
  location.href = url.toString();
}

export function bindPort({
  $,
  getState,
  getWorld,
  takeJob,
  openPort,
  closePort,
  resetCareer,
  save,
  toast,
}) {
  let tab = 'jobs';
  function renderPort(which = tab) {
    tab = which;
    const s = getState();
    planTick(s);
    $('portStats').textContent =
      Math.round(s.gold) +
      ' 🪙 · ' +
      s.jobs +
      ' klussen · ' +
      clockStr(dayClock(s)) +
      ' · ' +
      tideState(s.clock, s.tidePhase).label;
    $('portTitle').textContent = tab === 'jobs' ? 'Planning' : tab === 'shop' ? 'Winkel' : 'Haven';
    $('portEyebrow').textContent = MAP.name.toUpperCase() + ' · HAVENKANTOOR';
    $('portJobs').hidden = tab !== 'jobs';
    $('portShop').hidden = tab !== 'shop';
    $('portService').hidden = tab !== 'service';
    $('tabJobs').classList.toggle('selected', tab === 'jobs');
    $('tabShop').classList.toggle('selected', tab === 'shop');
    $('tabService').classList.toggle('selected', tab === 'service');
    // Schedule.
    const now = logicTime(s);
    $('planInfo').textContent =
      MAP.id === 'training'
        ? 'Oefenhaven: één vaste oefenklus. Kies daarna een echte haven.'
        : s.job
          ? 'Je hebt een klus lopen (' +
            customers[s.job.berth].name +
            '). Een nieuwe kiezen vervangt die.'
          : 'Kies met 1–6 of tik. Klussen vervallen op hun tijd; de concurrenten pakken er af en toe een.';
    $('offers').replaceChildren();
    let idx = 0;
    for (const o of s.offers) {
      const b = customers[o.berth],
        t = terminals[o.terminal],
        left = o.deadline - now,
        at = clockStr(dayClock(s) + left * CLOCK_RATE),
        mins = Math.round((left / 60) * CLOCK_RATE);
      const card = document.createElement('article');
      card.className = 'offer' + (o.taken ? ' taken' : '');
      const k = o.taken ? '🚫' : String(++idx);
      card.innerHTML =
        '<div class="offerK">' +
        k +
        '</div><div class="offerT">' +
        (o.kind === 'getij' ? 'HW' : 'ETA') +
        '<b>' +
        at +
        '</b><small>' +
        mins +
        ' min</small></div>' +
        '<div class="offerBody"><h3>' +
        o.target +
        ' t → ' +
        b.name +
        ' <span class="tag">' +
        kindLabel(o.kind) +
        '</span>' +
        (b.gate ? ' <span class="tag">🔒 ' + b.gate + '</span>' : '') +
        (o.vip ? ' <span class="tag vip">★ vaste klant</span>' : '') +
        (o.taken ? ' <span class="tag taken">' + o.taken + '</span>' : '') +
        '</h3><p>' +
        b.company +
        ' · laden bij ' +
        t.name +
        '<br>' +
        o.client +
        ' · reputatie ' +
        Math.round(repOf(s, o.client)) +
        ' · <b>' +
        o.pay +
        ' 🪙</b> +25% op tijd</p></div>';
      if (!o.taken)
        card.onclick = () => {
          if (takeJob(o.id)) {
            save();
            closePort();
          }
        };
      card.dataset.key = o.taken ? '' : String(idx);
      $('offers').append(card);
    }
    if (MAP.id === 'training') {
      const card = document.createElement('article');
      card.className = 'offer';
      card.innerHTML =
        '<div class="offerK">1</div><div class="offerBody"><h3>Oefenklus → ' +
        customers[0].name +
        '</h3><p>Laden aan de oefenterminal, dan langszij en vastmaken (M).</p></div>';
      card.dataset.key = '1';
      card.onclick = () => {
        takeJob(0);
        save();
        closePort();
      };
      $('offers').append(card);
    }
    const r = getWorld().rivals;
    const d = s.day || {};
    $('rank').textContent =
      'Dagdoel: 3 klussen op tijd en schadevrij · ' +
      Math.min(d.onTime || 0, d.clean || 0) +
      '/3' +
      (d.goalDone ? ' ✅ +300' : '') +
      (r.length
        ? ' · ' +
          r
            .map((x) => x.name + ': ' + Math.round(x.gold) + ' 🪙, ' + x.jobs + ' klussen')
            .join(' · ')
        : '');
    // Shop.
    $('shopInfo').textContent = atTerminal(s)
      ? 'Je ligt aan de terminal: de winkel is open.'
      : 'De winkel is alleen open aan een laadterminal. Je kunt wel kijken.';
    $('shopList').replaceChildren();
    for (const [k, u] of Object.entries(UPG)) {
      const lvl = s.lvl[k] || 0,
        card = document.createElement('article');
      card.className = 'offer';
      const next = lvl < 2 ? u.desc[lvl + 1] + ' · ' + u.cost[lvl + 1] + ' 🪙' : 'maximaal';
      card.innerHTML =
        '<div class="offerBody"><h3>' +
        u.name +
        ' <span class="tag">' +
        '★'.repeat(lvl + 1) +
        '</span></h3><p>Nu: ' +
        u.desc[lvl] +
        '<br>Volgende: ' +
        next +
        '</p></div>';
      const btn = document.createElement('button');
      btn.className = 'primary';
      btn.textContent = lvl < 2 ? 'Kopen' : '✓';
      btn.disabled = lvl >= 2 || !atTerminal(s) || s.gold < (u.cost[lvl + 1] ?? Infinity);
      btn.onclick = () => {
        $('shopMessage').textContent = buy(s, k);
        save();
        renderPort('shop');
      };
      card.append(btn);
      $('shopList').append(card);
    }
    // Harbour.
    $('serviceState').textContent =
      'Schade ' +
      Math.round(s.damage) +
      '/100 · vermoeidheid ' +
      Math.round(s.fatigue) +
      '% · reparatie op de werf (W), 3 🪙 per punt.';
    mapButtons($('mapList2'), MAP.id, (id) => switchMap(id, save));
  }
  $('office').onclick = () => openPort('jobs');
  $('maintenance').onclick = () => openPort('shop');
  $('next').onclick = () => openPort('jobs');
  $('tabJobs').onclick = () => renderPort('jobs');
  $('tabShop').onclick = () => renderPort('shop');
  $('tabService').onclick = () => renderPort('service');
  $('closePort').onclick = closePort;
  $('port').addEventListener('cancel', (e) => {
    e.preventDefault();
    closePort();
  });
  $('port').addEventListener('keydown', (e) => {
    if (tab !== 'jobs') return;
    const card = [...$('offers').children].find((c) => c.dataset.key && c.dataset.key === e.key);
    if (card) {
      e.preventDefault();
      card.click();
    } else if (e.key === 'x' || e.key === 'X' || e.key === 'n' || e.key === 'N') {
      e.preventDefault();
      closePort();
    }
  });
  $('tow').onclick = () => {
    recover(getState());
    save();
    closePort();
    toast('Pechhulp: teruggesleept naar het startpunt (−100 🪙).');
  };
  $('restart').onclick = () => ($('resetConfirm').hidden = false);
  $('cancelReset').onclick = () => ($('resetConfirm').hidden = true);
  $('confirmReset').onclick = () => {
    resetCareer();
    save();
    $('resetConfirm').hidden = true;
    closePort();
    toast('Nieuwe carrière gestart.');
  };
  return renderPort;
}
