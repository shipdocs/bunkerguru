(() => {
// ---------- taal ----------
let lang = 'nl'; try { lang = localStorage.getItem('bunker_lang') || ((navigator.language || 'nl').toLowerCase().startsWith('nl') ? 'nl' : 'en'); } catch (e) {}
const EN = {
  'Opdracht {0}: {1} t voor {2} ({3}). Laden bij {4}.': 'Job {0}: {1} t for {2} ({3}). Load at {4}.',
  '📻 {0}: "Ik ga ook voor {1}!" – wie het eerst langszij ligt krijgt de klus': '📻 {0}: "I\'m going for {1} too!" – first one alongside gets the job',
  '❌ {0} lag eerder langszij {1}. Klus verloren! Nieuwe opdracht…': '❌ {0} got alongside {1} first. Job lost! New job…',
  'Trossen los': 'Lines cast off',
  'Kan niet vastmaken: {0}': 'Cannot moor: {0}',
  'te veel vaart ({0} km/h)': 'too much speed ({0} km/h)',
  'koers {0}° scheef': 'heading {0}° off',
  'niet bij een ligplaats of terminal': 'not at a berth or terminal',
  '⚓ Vast langszij. Slangen aan!': '⚓ Moored alongside. Hoses on!',
  '⚓ Vast aan de terminal': '⚓ Moored at the terminal',
  '⚓ Trossen zitten vast – eerst M = los': '⚓ Lines are fast – press M to cast off first',
  '⏩ Snelvaart 2× (T = uit)': '⏩ Fast forward 2× (T = off)', 'Normale tijd': 'Normal time', 'Snelvaart uit': 'Fast forward off',
  '💥 Raak! +{0} schade': '💥 Hit! +{0} damage',
  '🫧 Gezonken! Verzekering betaalt de helft: −{0} goud. Nieuwe boot volgt…': '🫧 Sunk! Insurance covers half: −{0} gold. New boat on its way…',
  '{0}Laden… {1} / {2} t{3} · {4} · B = winkel': '{0}Loading… {1} / {2} t{3} · {4} · B = shop',
  ' · werf repareert (2 🪙/pt)': ' · yard repairing (2 🪙/pt)', 'M = los': 'M = cast off', 'M = vast': 'M = moor',
  'Vol. Naar {0}, {1}. Let op stroming, dam en verkeer!': 'Full. Head for {0}, {1}. Mind the current, the dam and traffic!',
  'Haal {0} t bij {1} (geel) – stil liggen om te laden': 'Collect {0} t at {1} (yellow) – lie still to load',
  'Slangen aan. Bunkeren!': 'Hoses on. Bunkering!',
  'Langszij… houden {0} s': 'Alongside… hold {0} s',
  'Te snel: {0} km/h': 'Too fast: {0} km/h', 'Koers {0}° scheef': 'Heading {0}° off', 'M = trossen vast': 'M = make fast',
  'Naar de groene zone langs het zeeschip (zie minimap)': 'Go to the green zone alongside the ship (see minimap)',
  '⚠️ Losgeslagen! Slangen eraf. Opnieuw langszij (of M = vast).': '⚠️ Broke loose! Hoses off. Get alongside again (or M = moor).',
  'Bunkeren… {0} t aan boord': 'Bunkering… {0} t on board',
  '✅ Klaar!{0} 🪙 +{1} vracht +{2} tijd{3} = {4} goud. N = volgende, B = winkel': '✅ Done!{0} 🪙 +{1} cargo +{2} time{3} = {4} gold. N = next, B = shop',
  ' M = los,': ' M = cast off,', ' +150 schadevrij': ' +150 damage-free',
  'Winkel alleen aan een terminal (stil liggen) of na een klus': 'Shop only at a terminal (lying still) or after a job',
  '🪙 {0} goud · {1} klussen gedaan': '🪙 {0} gold · {1} jobs done', 'Koop 🪙 {0}': 'Buy 🪙 {0}', 'niveau {0}/{1}': 'level {0}/{1}', 'Volgende: {0}': 'Next: {0}',
  'Carrière wissen': 'Reset career', 'Zeker? Klik nogmaals': 'Sure? Click again', 'Terug aan boord (B)': 'Back on board (B)', '🛠️ Binnenvaartwinkel': '🛠️ Ship chandler',
  'Koers {0}° {1}': 'Heading {0}° {1}', '→ draai BB': '→ turn to port', '→ draai SB': '→ turn to starboard', 'Vaart {0} km/h {1}': 'Speed {0} km/h {1}', '✓  →  M = vast': '✓  →  M = moor', '→ afremmen': '→ slow down',
  'ROER': 'RUDDER', 'TELEGRAAF': 'TELEGRAPH', 'BB ': 'PT ', 'SB ': 'SB ',
  '⚓ AFGEMEERD (M = los)': '⚓ MOORED (M = cast off)', '⏩ SNELVAART 2×': '⏩ FAST FORWARD 2×',
  'Goud': 'Gold', 'klussen': 'jobs', 'Opdracht': 'Job', 'Totaal': 'Total', 'Vaart': 'Speed', 'Koers': 'Heading', 'Telegraaf': 'Telegraph', 'Roer': 'Rudder', 'Stroom': 'Current', 'Lading': 'Cargo', 'Schade': 'Damage', 'Tijd': 'Time', 'Beste score': 'Best score',
  'midscheeps': 'amidships', 'bakboord ': 'port ', 'stuurboord ': 'starboard ',
  'vol achteruit': 'full astern', 'half achteruit': 'half astern', 'langzaam achteruit': 'slow astern', 'stop': 'stop', 'zeer langzaam': 'dead slow', 'langzaam': 'slow', 'half': 'half', 'vol': 'full', 'vol vooruit': 'full ahead',
  'NIEUWE WATERWEG · getijdenrivier': 'NIEUWE WATERWEG · tidal river',
  'noordoever bij Maassluis': 'north bank near Maassluis', 'Perniskade aan de rivier': 'Pernis quay on the river', 'westwand Geulhaven': 'west wall of Geulhaven', 'Europoortkade, ver stroomafwaarts': 'Europoort quay, far downstream', 'Haven Maassluis (noordoever)': 'Maassluis harbour (north bank)', 'westwand Oude Maas': 'west wall of the Oude Maas',
  'Motor': 'Engine', 'Boegschroef': 'Bow thruster', 'Tanks': 'Tanks', 'Fenders': 'Fenders', 'Pomp': 'Pump',
  'Standaard 1200 pk (31 km/h)': 'Standard 1200 hp (31 km/h)', 'Zwaardere motor: 38 km/h': 'Heavier engine: 38 km/h', 'Racemotor: 46 km/h': 'Racing engine: 46 km/h',
  'Standaard': 'Standard', 'Dubbele boegschroef (+60 %)': 'Twin bow thruster (+60 %)', 'Kanaalschroef (+130 %)': 'Tunnel thruster (+130 %)',
  '1200 t': '1200 t', '1600 t: grotere klussen': '1600 t: bigger jobs', '2000 t: de grote jongens': '2000 t: the big boys',
  'Dikke fenders: schade −30 %': 'Thick fenders: damage −30 %', 'Stootkussens: schade −55 %': 'Yokohama fenders: damage −55 %',
  'Bunkeren 6 s': 'Bunkering 6 s', 'Snelle pomp: 4 s': 'Fast pump: 4 s', 'Turbo-pomp: 2,5 s': 'Turbo pump: 2.5 s',
  'HIER': 'HERE', 'Vermoeidheid': 'Fatigue', 'Verder varen': 'Continue', 'niet bij een ligplaats, terminal of wachtplaats': 'not at a berth, terminal or waiting berth',
  '⚓💾 Vast aan {0} · voortgang opgeslagen · rusten…': '⚓💾 Moored at {0} · progress saved · resting…', '😴 Uitgerust. M = los om verder te varen.': '😴 Rested. M = cast off to continue.',
  '🥱 Je wordt moe – zoek een wachtplaats (blauwe P) om te rusten': '🥱 You are getting tired – find a waiting berth (blue P) to rest', '😵 Oververmoeid: het roer reageert traag en onnauwkeurig!': '😵 Exhausted: the rudder is slow and imprecise!',
  '▶ Verder varen vanaf {0}. Opdracht: {1} t voor {2}.': '▶ Continuing from {0}. Job: {1} t for {2}.', '😴 Rusten aan {0}… {1}%': '😴 Resting at {0}… {1}%', '⚓ {0} · opgeslagen · M = los': '⚓ {0} · saved · M = cast off', 'Drift': 'Drift', 'Tik / K om te sluiten': 'Tap / K to close', '🫧 {0} is gezonken! (−{1} 🪙)': '🫧 {0} sank! (−{1} 🪙)', '💥 {0} sneed je af: jij +{1}, hij +{2} schade · {0} betaalt jou {3} 🪙': '💥 {0} cut you off: you +{1}, them +{2} damage · {0} pays you {3} 🪙', '💥 Jij ramde {0}: jij +{1}, hij +{2} schade · jij betaalt {3} 🪙': '💥 You rammed {0}: you +{1}, them +{2} damage · you pay {3} 🪙', '💥 Aanvaring met {0}: jij +{1}, hij +{2} schade (beide schuld)': '💥 Collision with {0}: you +{1}, them +{2} damage (both to blame)', 'Tip: kop tegen de stroom in, machine bij tot je stil ligt': 'Tip: bow into the current, add engine until you hold still',
  '→ Laden bij {0} · {1} m': '→ Load at {0} · {1} m', '→ Langszij {0}: vaart eruit, M = vast': '→ Alongside {0}: kill speed, M = moor', '→ Naar {0} · {1} m': '→ To {0} · {1} m',
  '⛽ Bunkeren… {0}%': '⛽ Bunkering… {0}%', '✅ Klus klaar! Volgende opdracht over {0} s (N = nu)': '✅ Job done! Next job in {0} s (N = now)', '🫧 Gezonken – nieuwe boot volgt': '🫧 Sunk – new boat on its way', '📖 Uitleg': '📖 How to play', 'Roer midscheeps': 'Rudder amidships', '🔇 Geluid uit': '🔇 Sound off', '🎵 Muziek aan': '🎵 Music on', '📻 Marifoon aan': '📻 VHF radio on', '📻 Marifoon uit': '📻 VHF radio off', '🎵 Muziek uit': '🎵 Music off', '🔊 Geluid aan': '🔊 Sound on', 'EB': 'EBB', 'VLOED': 'FLOOD', 'stroom {0} m/s naar zee': 'current {0} m/s seaward',
  '🌊 Kentering: het wordt eb, stroom naar zee neemt toe': '🌊 Slack water: ebb setting in, seaward current building', '🌊 Kentering: het wordt vloed, stroom landinwaarts': '🌊 Slack water: flood setting in, current runs inland',
};
function tr(s) { return lang === 'en' && EN[s] !== undefined ? EN[s] : s; }
function tf(s, ...a) { return tr(s).replace(/\{(\d+)\}/g, (m, i) => a[+i]); }
function setLang(l) { lang = l; try { localStorage.setItem('bunker_lang', l); } catch (e) {} applyLangHTML(); if (typeof running !== 'undefined' && !running) document.getElementById('msg').textContent = ''; }
function applyLangHTML() {
  document.querySelectorAll('[data-nl]').forEach(el => { el.innerHTML = lang === 'en' ? el.dataset.en : el.dataset.nl; });
  document.querySelectorAll('.langbtn').forEach(b => b.style.opacity = b.dataset.l === lang ? 1 : 0.45);
}
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const hud = document.getElementById('hud'), msgEl = document.getElementById('msg');
const overlay = document.getElementById('overlay');
let VW = innerWidth, VH = innerHeight;
let COMPACT = false; const COARSE = matchMedia('(pointer:coarse)').matches;
function fit() { const vv = window.visualViewport; VW = cv.width = Math.round(vv ? vv.width : innerWidth); VH = cv.height = Math.round(vv ? vv.height : innerHeight); const wr = document.getElementById('wrap'); if (wr) wr.style.height = VH + 'px'; COMPACT = COARSE || Math.min(VW, VH) < 560 || VW < 760; document.body.classList.toggle('compact', COMPACT); const r = document.getElementById('rules'); if (r) r.open = !COMPACT; }
addEventListener('resize', fit); if (window.visualViewport) visualViewport.addEventListener('resize', fit); addEventListener('orientationchange', () => setTimeout(fit, 300)); fit();

// ---------- wereld (kaart-onafhankelijk) ----------
// px-coördinaten; 1 px = 0,5 m. Rivierframe (s,n): s langs de rivier (zee = s klein), n dwars (n>0 = zuidoever)
const SCALE = 2, toPx = m => m * SCALE, TIME = 3, SH = 52;
let MAP = null, TH = 0, CT = 1, ST = 0, ORG = { x: 0, y: 0 }, W = 1000, H = 1000, RIVER_HALF = 160, S_MIN = -800, S_MAX = 5000;
let waits = [], land = [], shore = [], basins = [], terminals = [], terminal = null, berths = [], traffic = [], channels = [], bridges = [], labels = [], roads = [], decor = [], riverPoly = [], startPos = { s: 0, n: 0, hdgOff: 0 };
const current = { speed: 1.5, base: 1.5 }; let dirSea = { x: -1, y: 0 };
let simClock = 0, tideT = 0, tidePhase = Math.random() * Math.PI * 2, lastTideSign = 0;
function tideUpdate(dt) { const td = MAP.tide; if (!td) { current.speed = current.base; return; } tideT += dt; const f = Math.sin(tideT * Math.PI * 2 / td.period + tidePhase); current.speed = f >= 0 ? td.ebbMax * Math.pow(f, 0.8) : -td.floodMax * Math.pow(-f, 0.8); const sg = Math.sign(current.speed); if (sg !== lastTideSign) { if (lastTideSign !== 0) say(tr(sg > 0 ? '🌊 Kentering: het wordt eb, stroom naar zee neemt toe' : '🌊 Kentering: het wordt vloed, stroom landinwaarts'), 4); lastTideSign = sg; } }
function tideInfo() { const td = MAP.tide; const v = Math.abs(current.speed); if (!td) return tf('stroom {0} m/s naar zee', v.toFixed(1)); const f = Math.sin(tideT * Math.PI * 2 / td.period + tidePhase), rising = Math.cos(tideT * Math.PI * 2 / td.period + tidePhase) > 0; return (current.speed >= 0 ? tr('EB') : tr('VLOED')) + ` ${v.toFixed(1)} m/s ` + ((f >= 0) === rising ? '▲' : '▼'); }
const sn2w = (s, n) => ({ x: ORG.x + s * CT - n * ST, y: ORG.y + s * ST + n * CT });
const w2sn = (x, y) => { const dx = x - ORG.x, dy = y - ORG.y; return { s: dx * CT + dy * ST, n: -dx * ST + dy * CT }; };
function quad(s0, s1, n0, n1) { return [sn2w(s0, n0), sn2w(s1, n0), sn2w(s1, n1), sn2w(s0, n1)]; }
let mission = 0, missionCount = 0, ship = null, dock = null, totalScore = 0;
let seedD = 3; const rndD = () => (seedD = (seedD * 16807) % 2147483647) / 2147483647;
const cols = ['#e67e22', '#27ae60', '#2980b9', '#e74c3c', '#f1c40f'];

function loadMap(def) {
  // K = ruimtefactor: de wereld (rivier, bekkens, afstanden) wordt K× zo groot, schepen houden hun maat en ligplaatsen blijven tegen hun kade
  const K = def.K || 1;
  MAP = Object.assign({}, def, { lanes: def.lanes ? { down: def.lanes.down * K, up: def.lanes.up * K, mouth: (def.RIVER_HALF - (def.RIVER_HALF - def.lanes.mouth)) * K } : null });
  Object.assign(EN, def.i18n || {}); TH = def.TH; CT = Math.cos(TH); ST = Math.sin(TH); ORG = { x: def.ORG.x * K, y: def.ORG.y * K }; W = def.W * K; H = def.H * K; RIVER_HALF = def.RIVER_HALF * K; S_MIN = def.S_MIN * K; S_MAX = def.S_MAX * K;
  current.base = def.currentSpeed; current.speed = def.currentSpeed; dirSea = { x: -CT, y: -ST }; tideT = 0; tidePhase = Math.random() * Math.PI * 2; lastTideSign = 0;
  // eerst onschaalde opbouw in (s,n) om te zien welke randen tegen een kade liggen
  const h0 = { quad: (s0, s1, n0, n1) => [{ x: s0, y: n0 }, { x: s1, y: n0 }, { x: s1, y: n1 }, { x: s0, y: n1 }], sn2w: (s, n) => ({ x: s, y: n }), RIVER_HALF: def.RIVER_HALF, TH, SH, S_MIN: def.S_MIN, S_MAX: def.S_MAX, cols };
  const m0 = def.build(h0), onLand = (s, n) => m0.land.some(l => inPoly({ x: s, y: n }, l.poly));
  const h = { quad: (s0, s1, n0, n1) => quad(s0 * K, s1 * K, n0 * K, n1 * K), sn2w: (s, n) => sn2w(s * K, n * K), RIVER_HALF: def.RIVER_HALF, TH, SH, S_MIN: def.S_MIN, S_MAX: def.S_MAX, cols };
  const m = def.build(h);
  if (K !== 1) {
    // gap = afstand tot de kade (null = geen kade binnen 14 px); de kade schaalt mee, de ligplaats blijft er even dicht tegenaan
    const gap = f => { for (let d = 1; d <= 14; d++) if (f(d)) return d; return null; };
    const ax = (a0, a1, g0, g1) => { const len = a1 - a0; if (g0 !== null) { const e = K * (a0 - g0) + g0; return [e, e + len]; } if (g1 !== null) { const e = K * (a1 + g1) - g1; return [e - len, e]; } const c = (a0 + a1) / 2 * K; return [c - len / 2, c + len / 2]; };
    const rectT = o => { const sm = (o.s0 + o.s1) / 2, nm = (o.n0 + o.n1) / 2; const [s0, s1] = ax(o.s0, o.s1, gap(d => onLand(o.s0 - d, nm)), gap(d => onLand(o.s1 + d, nm))); const [n0, n1] = ax(o.n0, o.n1, gap(d => onLand(sm, o.n0 - d)), gap(d => onLand(sm, o.n1 + d))); o.s0 = s0; o.s1 = s1; o.n0 = n0; o.n1 = n1; };
    const inRect = (o, s, n) => s > o.s0 && s < o.s1 && n > o.n0 && n < o.n1;
    const st0 = m.start, waits0 = (m.waits || []).map(w => Object.assign({}, w));
    for (const t of m.terminals) rectT(t); for (const w of (m.waits || [])) rectT(w);
    for (const b of m.berths) { const mid = (b.a0 + b.a1) / 2 * K, len = b.a1 - b.a0; b.a0 = mid - len / 2; b.a1 = mid + len / 2; b.c = K * (b.c - b.side * 28) + b.side * 28; }
    for (const b of (m.basins || [])) { b.s0 *= K; b.s1 *= K; b.n0 *= K; b.n1 *= K; if (b.labelN !== undefined) b.labelN *= K; }
    for (const t of (m.traffic || [])) { t.s *= K; t.n *= K; if (t.nMin !== undefined) { t.nMin *= K; t.nMax *= K; } }
    for (const c of (m.channels || [])) { c.s0 *= K; c.s1 *= K; c.n0 *= K; c.n1 *= K; }
    for (const br of (m.bridges || [])) { br.s *= K; br.n0 *= K; br.n1 *= K; if (br.pillars) br.pillars = br.pillars.map(p => p * K); if (br.pylon !== undefined) br.pylon *= K; if (br.towers) br.towers = br.towers.map(p => p * K); }
    for (const l of (m.labels || [])) { l.s *= K; l.n *= K; } for (const r of (m.roads || [])) r.pts = r.pts.map(([s, n]) => [s * K, n * K]);
    for (const r of (m.rivals || [])) { r.s *= K; r.n *= K; }
    const wi = waits0.findIndex(w => inRect(w, st0.s, st0.n)); // start in een wachtplaats: midden in de geschaalde wachtplaats
    m.start = wi >= 0 ? { s: (m.waits[wi].s0 + m.waits[wi].s1) / 2, n: (m.waits[wi].n0 + m.waits[wi].n1) / 2, hdgOff: st0.hdgOff } : { s: st0.s * K, n: st0.n * K, hdgOff: st0.hdgOff };
  }
  land = m.land; waits = m.waits || []; basins = m.basins || []; terminals = m.terminals; berths = m.berths; traffic = m.traffic || []; channels = m.channels || []; bridges = m.bridges || []; labels = m.labels || []; roads = m.roads || []; startPos = m.start;
  for (const br of bridges) for (const p of (br.pillars || [])) land.push({ poly: quad(br.s - 9, br.s + 9, p - 9, p + 9), kind: 'pillar' });
  shore = [];
  land.forEach((l, li) => { const P = l.poly; for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length]; const len = Math.hypot(q.x - p.x, q.y - p.y); let nx = (q.y - p.y) / len, ny = -(q.x - p.x) / len; const mid = { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 }; if (inPoly({ x: mid.x + nx * 6, y: mid.y + ny * 6 }, P)) { nx = -nx; ny = -ny; } const out = { x: mid.x + nx * 8, y: mid.y + ny * 8 }; if (!land.some((o, oi) => oi !== li && inPoly(out, o.poly))) shore.push({ p, q, nx, ny, li }); } });
  for (const b of basins) b.side = (b.n0 + b.n1) / 2 > 0 ? 1 : -1;
  for (const b of berths) {
    b.quad = b.axis === 's' ? quad(b.a0, b.a1, b.c - SH / 2, b.c + SH / 2) : quad(b.c - SH / 2, b.c + SH / 2, b.a0, b.a1);
    const d0 = b.c + b.side * (SH / 2 + 2), d1 = b.c + b.side * (SH / 2 + 44);
    b.dock = b.axis === 's' ? { s0: b.a0 - 10, s1: b.a1 + 10, n0: Math.min(d0, d1), n1: Math.max(d0, d1) } : { s0: Math.min(d0, d1), s1: Math.max(d0, d1), n0: b.a0 - 10, n1: b.a1 + 10 };
    b.hdg = b.axis === 's' ? TH : TH + Math.PI / 2;
    const mid = b.axis === 's' ? sn2w((b.a0 + b.a1) / 2, b.c) : sn2w(b.c, (b.a0 + b.a1) / 2);
    b.cx = mid.x; b.cy = mid.y; b.len = b.a1 - b.a0;
  }
  for (const tr of traffic) { tr.hdg = tr.axis === 'n' ? (tr.v > 0 ? TH + Math.PI / 2 : TH - Math.PI / 2) : (tr.v > 0 ? TH : TH + Math.PI); }
  riverPoly = quad(S_MIN, S_MAX, -RIVER_HALF, RIVER_HALF);
  decor = []; seedD = 3;
  const landOnly = land.filter(l => l.kind !== 'pillar' && l.kind !== 'dam');
  const solid = (x, y) => landOnly.some(l => inPoly({ x, y }, l.poly)) && [[14, 0], [-14, 0], [0, 14], [0, -14]].every(([a, b]) => landOnly.some(l => inPoly({ x: x + a, y: y + b }, l.poly)));
  const FILL = { house: 38, block: 40, tree: 32, container: 22, tank: 70 };
  const add = (type, s, n, extra) => {
    if (K === 1) { const p = sn2w(s, n); decor.push(Object.assign({ type, x: p.x, y: p.y }, extra)); return; }
    const offs = FILL[type] ? [[0, 0], [FILL[type], 0], [0, FILL[type]], [FILL[type], FILL[type]]] : [[0, 0]];
    for (const [ds, dn] of offs) { const p = sn2w(s * K + ds, n * K + dn); if (ds || dn ? solid(p.x, p.y) : true) decor.push(Object.assign({ type, x: p.x, y: p.y }, extra)); }
  };
  if (m.decor) m.decor(add, rndD, h);
  (m.rivals || []).forEach((rp, i) => { const r = rivals[i]; if (!r) return; const p = sn2w(rp.s, rp.n); r.x = p.x; r.y = p.y; r.hdg = TH + rp.hdgOff; r.mode = 'idle'; r.path = []; r.wait = 2 + i * 4; r.racing = false; r.damage = 0; r.cur = 0; r.rev = null; });
  terminal = terminals[0]; ship = berths[0]; dock = ship.dock; mission = -1; trails.clear();
  updateTraffic(0);
}
function updateTraffic(dt) {
  for (const tr of traffic) {
    if (tr.axis === 'n') {
      let kn = 1; if (dt > 0) try { for (const q of [boat].concat(rivals.filter(o => o.mode !== 'sunk'))) { const p = w2sn(q.x, q.y), ahead = (p.n - tr.n) * Math.sign(tr.v) - tr.len / 2; if (ahead > -RL && ahead < 220 && Math.abs(p.s - tr.s) < 26 + 60) kn = 0; } } catch (e) {}
      tr.blockT = kn === 0 ? (tr.blockT || 0) + dt : 0; if (tr.blockT > 6) { tr.v = -tr.v; tr.hdg += Math.PI; tr.blockT = 0; } // te lang geblokkeerd: omkeren
      tr.n += toPx(tr.v) * kn * dt * TIME;
      if (tr.n < tr.nMin) { tr.v = Math.abs(tr.v); tr.hdg = TH + Math.PI / 2; } if (tr.n > tr.nMax) { tr.v = -Math.abs(tr.v); tr.hdg = TH - Math.PI / 2; }
      tr.quad = quad(tr.s - SH / 2, tr.s + SH / 2, tr.n - tr.len / 2, tr.n + tr.len / 2);
    } else {
      // vaargeul voor de boeg vrij? zo niet: inhouden tot 30 % (groot schip kan niet stoppen)
      let k = 1, boats = []; const dir = Math.sign(tr.v);
      if (dt > 0) try { boats = [boat].concat(rivals.filter(q => q.mode !== 'sunk')); } catch (e) {}
      for (const q of boats) { if (!q || (q === boat && state.phase === 'sunk')) continue; const p = w2sn(q.x, q.y), ahead = (p.s - tr.s) * dir - tr.len / 2; if (ahead > -20 && ahead < Math.max(tr.len * 1.2, 2 * 110 + 80) && Math.abs(p.n - tr.n) < 26 + 70) k = Math.min(k, ahead < 120 ? 0.1 : 0.3); }
      tr.slow = k < 1; tr.s += toPx(tr.v) * k * dt * TIME;
      if (tr.v < 0 && tr.s < S_MIN) tr.s = S_MAX; if (tr.v > 0 && tr.s > S_MAX) tr.s = S_MIN;
      tr.quad = quad(tr.s - tr.len / 2, tr.s + tr.len / 2, tr.n - SH / 2, tr.n + SH / 2);
    }
    const m = sn2w(tr.s, tr.n); tr.cx = m.x; tr.cy = m.y;
  }
}
function pickMission() {
  let i; do { i = Math.floor(Math.random() * berths.length); } while (i === mission && berths.length > 1);
  mission = i; ship = berths[i]; dock = ship.dock;
  terminal = terminals[Math.floor(Math.random() * terminals.length)];
  boat.target = pickTarget(); boat.cargo = 0;
  state.phase = 'load'; state.holdT = 0; state.bunkerT = 0; state.elapsed = 0; score = 0; state.inZone = false; state.doneT = 0; state.slowWas = true;
  say(tf('Opdracht {0}: {1} t voor {2} ({3}). Laden bij {4}.', missionCount + 1, boat.target, ship.name, tr(ship.where), terminal.name), 7);
  if (typeof maybeRace === 'function' && running) maybeRace();
}
function nextMission() { missionCount++; pickMission(); }


// ---------- concurrenten (AI-bunkerboten) ----------
function mouthN(side) { const L = MAP.lanes || { down: -40, up: 40, mouth: RIVER_HALF - 65 }; return side > 0 ? L.mouth : -L.mouth; }
function mouthOf(s, n) { // punt net in de rivier recht voor de ingang van een bekken / ligplaats
  if (Math.abs(n) < RIVER_HALF) return { s, n: mouthN(n > 0 ? 1 : -1) };
  for (const b of basins) if (s > b.s0 - 1 && s < b.s1 + 1 && Math.sign(n) === b.side) return { s: (b.s0 + b.s1) / 2, n: mouthN(b.side) };
  return { s, n: mouthN(n > 0 ? 1 : -1) };
}
function basinAt(s, n) { for (const b of basins) if (s > b.s0 - 1 && s < b.s1 + 1 && n > Math.min(b.n0, b.n1) - 1 && n < Math.max(b.n0, b.n1) + 1) return b; return null; }
function exitPts(p) { // van een punt in een bekken naar de rivier (bekken-hartlijn, dan de mond); leeg als je al op de rivier ligt
  if (Math.abs(p.n) < RIVER_HALF) return [];
  const b = basinAt(p.s, p.n), sc = b ? Math.max(b.s0 + 30, Math.min(b.s1 - 30, p.s)) : p.s, sg = Math.sign(p.n), inB = RIVER_HALF + 90; // recht in/uit op de eigen lijn, niet over de hartlijn
  return [{ s: sc, n: sg * Math.min(Math.abs(p.n), inB) }, { s: sc, n: mouthN(sg) }];
}
function planRoute(from, to, approach, aheadPt) { // (s,n); via de rivierlaan, stuurboordwal houden; approach = insteekpunt vlak voor het doel
  const L = MAP.lanes || { down: -40, up: 40 }, dir = Math.sign(to.s - from.s) || 1, lane = dir > 0 ? L.up : L.down;
  const pts = []; if (aheadPt) pts.push(aheadPt);
  const ex = exitPts(aheadPt || from); pts.push(...ex);
  const fs = ex.length ? ex[ex.length - 1].s : (aheadPt || from).s;
  pts.push({ s: fs, n: lane });
  const ent = exitPts(to).reverse();
  if (ent.length) pts.push({ s: ent[0].s, n: lane }, ...ent);
  else if (approach) { // schuin insteken, maar niet over land: kies de eerste vrije afstand
    const ad = Math.sign(to.s - approach.s) || dir, base = Math.max(320, Math.abs(approach.n - lane) * 1.8);
    const clear = (a, b) => { for (let k = 0; k <= 1; k += 0.04) { const s = a.s + (b.s - a.s) * k, n = a.n + (b.n - a.n) * k; for (const off of [-16, 0, 16]) { const w = sn2w(s, n + off); if (land.some(l => inPoly(w, l.poly))) return false; } } return true; };
    let best = { s: approach.s - ad * base, n: lane };
    for (const f of [1, 0.8, 0.65, 1.3, 0.5, 1.7, 0.4, 2.2]) { const c = { s: approach.s - ad * base * f, n: lane }; if (clear(c, approach)) { best = c; break; } }
    pts.push(best); }
  else pts.push({ s: to.s, n: lane });
  if (approach) pts.push(approach);
  pts.push(to);
  return pts.map(p => sn2w(p.s, p.n));
}
function berthApproach(b, fromS) { // doel en insteekpunt langs de ligplaats, zodat je parallel binnenkomt
  const c = dockCenter(b);
  // insteekpunt vóór het begin van het schip, iets van het schip af, zodat je er recht langs schuift
  if (b.axis === 's') { const dir = Math.sign(c.s - fromS) || 1; return { to: c, approach: { s: dir > 0 ? b.a0 - RL - 40 : b.a1 + RL + 40, n: c.n + b.side * 8 } }; }
  const sg = Math.sign(c.n), mouthEnd = sg > 0 ? Math.min(b.a0, b.a1) : Math.max(b.a0, b.a1), an = mouthEnd - sg * (RL + 30);
  return { to: { s: c.s + b.side * 6, n: c.n }, approach: Math.abs(an) > RIVER_HALF + RL ? { s: c.s + b.side * 6, n: an } : null };
}
function terminalTarget(tm, slot) {
  const c = termCenter(tm), sg = Math.sign(c.n) || 1, along = (tm.n1 - tm.n0) > (tm.s1 - tm.s0);
  if (along) { // terminal langs een kademuur: twee laadplekken achter elkaar langs de muur
    const len = tm.n1 - tm.n0, dn = slot === undefined || len < 4 * RL + 40 ? 0 : (slot - 0.5) * (2 * RL + 20); // past er maar één, dan midden
    const to = { s: c.s, n: c.n + dn }; const an = to.n - sg * (RL + 60);
    return { to, approach: Math.abs(an) > RIVER_HALF + RL ? { s: c.s, n: an } : null };
  }
  const w = tm.s1 - tm.s0, ds = slot === undefined ? 0 : (slot - 0.5) * Math.min(48, w / 2); const bs = basinAt(c.s, c.n); let ts = c.s + ds; if (bs) ts = Math.max(bs.s0 + 55, Math.min(bs.s1 - 55, ts)); const to = { s: ts, n: c.n - sg * 30 }; return { to, approach: { s: to.s, n: to.n - sg * 100 } };
}
const RL = 110, RB = 11; // halve lengte en halve breedte in px: concurrenten zijn ook 110 × 11 m
const rivals = [
  { name: 'Bunker Bert', col: '#c0392b', x: 0, y: 0, hdg: 0, spd: 6.0, gold: 300, jobs: 0, mode: 'idle', path: [], wait: 2, target: null, racing: false },
  { name: 'Truus Tank', col: '#8e44ad', x: 0, y: 0, hdg: 0, spd: 5.6, gold: 300, jobs: 0, mode: 'idle', path: [], wait: 6, target: null, racing: false },
];
try { const rs = JSON.parse(localStorage.getItem('bunker_rivals') || 'null'); if (rs) rivals.forEach((r, i) => { if (rs[i]) { r.gold = rs[i].gold; r.jobs = rs[i].jobs; } }); } catch (e) {}
function saveRivals() { try { localStorage.setItem('bunker_rivals', JSON.stringify(rivals.map(r => ({ gold: r.gold, jobs: r.jobs })))); } catch (e) {} }
function dockCenter(b) { return { s: (b.dock.s0 + b.dock.s1) / 2, n: (b.dock.n0 + b.dock.n1) / 2 }; }
function termCenter(tm) { return { s: (tm.s0 + tm.s1) / 2, n: (tm.n0 + tm.n1) / 2 }; }
function rivalStartJob(r, berth, racing) {
  const here = w2sn(r.x, r.y);
  const busy = tm => rivals.some(o => o !== r && o.term === tm && (o.mode === 'toTerminal' || o.mode === 'loading') && (tm.n1 - tm.n0 < 4 * RL + 40));
  const byDist = terminals.slice().sort((a, b) => Math.hypot(termCenter(a).s - here.s, termCenter(a).n - here.n) - Math.hypot(termCenter(b).s - here.s, termCenter(b).n - here.n));
  const tm = byDist.find(t => !busy(t)) || byDist[0]; r.term = tm;
  const tt = terminalTarget(tm, rivals.indexOf(r));
  // vertrek vanaf een ligplaats op de rivier: eerst recht vooruit vrijvaren, niet om je as draaien naast het schip
  let ahead = null; const lb = r.lastBerth; r.lastBerth = null;
  if (lb && lb.axis === 's' && Math.hypot(r.x - lb.cx, r.y - lb.cy) < 260) { const p = w2sn(r.x + Math.cos(r.hdg) * (RL + 130), r.y + Math.sin(r.hdg) * (RL + 130)); ahead = { s: p.s, n: p.n + lb.side * 30 }; } // langs de rivier: eerst rechtuit vrijvaren
  r.target = berth; r.racing = racing; r.mode = 'toTerminal'; r.path = planRoute(here, tt.to, tt.approach, ahead);
  if (racing) { SND.radio(); radioRival(r, berth); }
  if (racing) say(tf('📻 {0}: "Ik ga ook voor {1}!" – wie het eerst langszij ligt krijgt de klus', r.name, berth.name), 5);
}
function rivalQuad(r) { const c = Math.cos(r.hdg), s = Math.sin(r.hdg), L = RL, B = RB; return [[-L, -B], [L, -B], [L, B], [-L, B]].map(([a, b]) => ({ x: r.x + a * c - b * s, y: r.y + a * s + b * c })); }
function rivalQuads() { return rivals.filter(r => r.mode !== 'sunk').map(rivalQuad); }
function boatQuad() { const b = boat, c = Math.cos(b.hdg), s = Math.sin(b.hdg), L = toPx(b.L) / 2, B = toPx(b.B) / 2; return [[-L, -B], [L, -B], [L, B], [-L, B]].map(([a, q]) => ({ x: b.x + a * c - q * s, y: b.y + a * s + q * c })); }
// obstakels met hun snelheid (m/s) voor de concurrenten
function rivalObstacles(r) {
  const o = [];
  for (const t of traffic) { const sp = toPx(t.v) ? t.v : 0; const hv = t.axis === 'n' ? { x: -ST * t.v, y: CT * t.v } : { x: CT * t.v, y: ST * t.v }; o.push({ p: t.quad, k: 'ship', vx: hv.x, vy: hv.y, name: t.name }); }
  for (const b of berths) o.push({ p: b.quad, k: 'berth', vx: 0, vy: 0 });
  for (const q of rivals) if (q !== r && q.mode !== 'sunk') o.push({ p: rivalQuad(q), k: 'rival', vx: Math.cos(q.hdg) * (q.cur || 0), vy: Math.sin(q.hdg) * (q.cur || 0), who: q });
  if (state.phase !== 'sunk') o.push({ p: boatQuad(), k: 'player', vx: boat.vx, vy: boat.vy });
  for (const l of land) o.push({ p: l.poly, k: 'land', vx: 0, vy: 0 });
  return o;
}
function rivalProbe(r, obs, finalLeg) { // wat ligt er voor de boeg?
  const c = Math.cos(r.hdg), s = Math.sin(r.hdg);
  for (const d of [RL + 12, RL + 40, RL + 80, RL + 130, RL + 190]) for (const off of [-RB - 8, 0, RB + 8]) {
    const x = r.x + c * d - s * off, y = r.y + s * d + c * off;
    for (const o of obs) { if (finalLeg && (o.k === 'berth' || o.k === 'land')) continue; if (inPoly({ x, y }, o.p)) return { k: o.k, d, off }; }
  }
  return null;
}
// rol van een concurrent t.o.v. de speler volgens de basisregels: 'give' (voorrang geven), 'stand' (voorrang hebben), 'headon'
function colregRole(r) {
  const ang = a => Math.atan2(Math.sin(a), Math.cos(a));
  const rs = w2sn(r.x, r.y), ps = w2sn(boat.x, boat.y);
  const rIn = Math.abs(rs.n) >= RIVER_HALF - 20, pIn = Math.abs(ps.n) >= RIVER_HALF - 20; // in of bij de mond van een bekken
  if (rIn && !pIn) return 'give'; if (pIn && !rIn) return 'stand';           // uitvaren uit haven: doorgaande vaart gaat voor
  const pSpd = Math.hypot(boat.vx, boat.vy), pHdg = pSpd > 0.3 ? Math.atan2(boat.vy, boat.vx) : boat.hdg;
  const bearR = ang(Math.atan2(boat.y - r.y, boat.x - r.x) - r.hdg);   // waar zie ik de speler (rad, + = stuurboord)
  const bearP = ang(Math.atan2(r.y - boat.y, r.x - boat.x) - pHdg);     // waar ziet de speler mij
  const rel = Math.abs(ang(pHdg - r.hdg));
  if (Math.abs(bearP) > 112.5 * Math.PI / 180 && (r.cur || 0) > pSpd) return 'give';   // ik loop de speler op
  if (Math.abs(bearR) > 112.5 * Math.PI / 180 && pSpd > (r.cur || 0)) return 'stand';  // speler loopt mij op
  if (rel > 160 * Math.PI / 180 && Math.abs(bearR) < 20 * Math.PI / 180) return 'headon';
  return bearR > 0 ? 'give' : 'stand'; // kruisend: speler aan mijn stuurboord → ik geef voorrang
}
// voorspelling: raakt de romp van de concurrent de komende ~10 s een varend zeeschip als hij doorgaat (of draait)?
function trafficConflict(r, turning, speed, astern) {
  const c = Math.cos(r.hdg), s = Math.sin(r.hdg), dir = astern ? -1 : 1;
  for (let t = 0; t <= 14; t += 1) {
    const rx = r.x + c * toPx(speed) * t * dir, ry = r.y + s * toPx(speed) * t * dir;
    for (const tr of traffic) { if (tr.axis === 'n') continue;
      const ts = tr.s + toPx(tr.v) * t, tc = sn2w(ts, tr.n), tcos = Math.cos(tr.hdg), tsin = Math.sin(tr.hdg);
      if (Math.hypot(tc.x - rx, tc.y - ry) > tr.len / 2 + RL + 60) continue;
      for (let a = -tr.len / 2; a <= tr.len / 2; a += 26) { const px = tc.x + tcos * a, py = tc.y + tsin * a;
        if (turning) { if (Math.hypot(px - rx, py - ry) < RL + RB + 26 + 8) return t; }
        else for (let f = -RL; f <= RL; f += RL / 4) if (Math.hypot(px - (rx + c * f), py - (ry + s * f)) < 26 + RB + 8) return t; }
    }
  }
  return -1;
}
function rivalSink(r) {
  r.mode = 'sunk'; r.sinkT = 0; r.racing = false; r.path = []; r.cur = 0; r.rev = null; const loss = Math.round(r.gold / 2); r.gold -= loss; saveRivals();
  say(tf('🫧 {0} is gezonken! (−{1} 🪙)', r.name, loss), 4);
  RADIO.say([{ who: r.name, spk: 3, text: lang === 'en' ? `Mayday, mayday, ${r.name} is going down! Uh... never mind, insurance.` : `Mayday, mayday, hier ${r.name}, ik zink! Eh... laat maar, de verzekering betaalt.` }], lang, true);
}
function updateRivals(dt) {
  for (const r of rivals) {
    if (r.hitCD > 0) r.hitCD -= dt;
    r.damage = r.damage || 0; r.cur = r.cur || 0;
    if (r.mode === 'sunk') { r.sinkT += dt; if (r.sinkT > 9) { const tm = terminals[Math.floor(Math.random() * terminals.length)], p = sn2w((tm.s0 + tm.s1) / 2, (tm.n0 + tm.n1) / 2); r.x = p.x; r.y = p.y; r.damage = 0; r.mode = 'idle'; r.wait = 6; } continue; }
    if (r.damage >= 100) { rivalSink(r); continue; }
    if (r.mode === 'idle') { r.cur = 0; r.wait -= dt; if (r.wait <= 0) { const b = berths[Math.floor(Math.random() * berths.length)]; if (b !== ship) rivalStartJob(r, b, false); else r.wait = 3; } rivalContacts(r, dt); continue; }
    if (r.mode === 'loading' || r.mode === 'bunkering') {
      r.cur = 0; r.wait -= dt;
      if (r.mode === 'loading' && r.damage > 0) { const fix = Math.min(r.damage, dt * 10); r.damage -= fix; r.gold = Math.max(0, r.gold - fix * 2); }
      if (r.wait <= 0) { if (r.mode === 'loading') { r.mode = 'toShip'; const here = w2sn(r.x, r.y), ba = berthApproach(r.target, here.s); r.path = planRoute(here, ba.to, ba.approach); } else { r.gold += 400 + Math.round(Math.random() * 500); r.jobs++; saveRivals(); r.lastBerth = r.target; r.mode = 'idle'; r.wait = 8 + Math.random() * 15; r.racing = false; } }
      rivalContacts(r, dt); continue;
    }
    // vastgelopen? na 15 s opnieuw plannen, na 45 s door een sleepboot naar de vaargeul geholpen
    if (r.stuckX === undefined || Math.hypot(r.x - r.stuckX, r.y - r.stuckY) > 8) { r.stuckX = r.x; r.stuckY = r.y; r.stuckT = 0; } else r.stuckT += dt;
    if (r.stuckT > 15 && !r.replanned) { r.replanned = true; const here = w2sn(r.x, r.y); if (r.mode === 'toTerminal') { const tt = terminalTarget(r.term || terminals[0], rivals.indexOf(r)); r.path = planRoute(here, tt.to, tt.approach); } else { const ba = berthApproach(r.target, here.s); r.path = planRoute(here, ba.to, ba.approach); } }
    if (r.stuckT > 45) { const here = w2sn(r.x, r.y), L = MAP.lanes || { down: -40, up: 40 }; const p = sn2w(here.s, Math.abs(here.n) < RIVER_HALF ? L.down : Math.sign(here.n) * (RIVER_HALF - 65)); r.x = p.x; r.y = p.y; r.hdg = TH + Math.PI; r.cur = 0; r.stuckT = 0; r.replanned = false;
      const h2 = w2sn(r.x, r.y); if (r.mode === 'toTerminal') { const tt = terminalTarget(r.term || terminals[0], rivals.indexOf(r)); r.path = planRoute(h2, tt.to, tt.approach); } else { const ba = berthApproach(r.target, h2.s); r.path = planRoute(h2, ba.to, ba.approach); } }
    if (r.stuckT === 0) r.replanned = false;
    // varen langs waypoints, met uitkijk voor de boeg
    const wp = r.path[0]; if (!wp) { r.mode = 'idle'; continue; }
    const dx = wp.x - r.x, dy = wp.y - r.y, d = Math.hypot(dx, dy);
    const ang = a => Math.atan2(Math.sin(a), Math.cos(a));
    const segA = Math.atan2(dy, dx); let da = ang(segA - r.hdg);
    const near = r.path.length === 1, finalLeg = near && d < 70;
    // langs de eigen lijn achteruit (bekken uit): punt ligt recht achter je en dichtbij
    const meSN = w2sn(r.x, r.y), inBasin = Math.abs(meSN.n) >= RIVER_HALF - 20, lat = Math.abs(Math.sin(da)) * d, astern = Math.abs(da) > Math.PI - 0.45 && lat < 26 && (d < 3 * RL || inBasin);
    r.astern = astern;
    let target = near ? Math.min(r.spd, 0.3 + d / 45) : r.path.length === 2 ? Math.min(r.spd, 3.5) : r.spd;
    if (r.path.length >= 2) { const n2 = r.path[1], turn = Math.abs(ang(Math.atan2(n2.y - wp.y, n2.x - wp.x) - segA)); if (turn > 0.5) target = Math.min(target, 0.5 + d / 60); } // bocht verderop: afremmen
    if (astern) { da = ang(segA + Math.PI - r.hdg); target = Math.min(target, 3); }
    else if (Math.abs(da) > 0.12) target = Math.min(target, Math.abs(da) > 0.45 ? 0.15 : 0.6); // eerst recht leggen, dan pas varen
    { // bekken bezet door de ander (op dezelfde lijn)? dan buiten wachten
      const wps = w2sn(wp.x, wp.y), bTo = Math.abs(wps.n) >= RIVER_HALF - 20 ? basinAt(wps.s, wps.n) : null;
      if (bTo && !inBasin) for (const o of rivals) { if (o === r || o.mode === 'sunk') continue; const os = w2sn(o.x, o.y); if (Math.abs(os.n) >= RIVER_HALF - RL && basinAt(os.s, os.n) === bTo && Math.abs(os.s - wps.s) < 2 * RB + 40) { target = 0; r.basinWait = true; } }
    }
    const obs = rivalObstacles(r), hit = astern ? rivalProbe({ x: r.x, y: r.y, hdg: r.hdg + Math.PI }, obs, finalLeg || r.path.length <= 2) : rivalProbe(r, obs, finalLeg || r.path.length <= 2);
    // de speler: basisregels (BPR) — kruisend: stuurboordschip heeft voorrang; oploper blijft vrij; recht op elkaar af: beide naar stuurboord; wie uit een haven komt geeft voorrang
    r.giveWay = false; r.standOn = false;
    if (state.phase !== 'sunk' && !(r.path.length <= 2 && Math.hypot(boat.vx, boat.vy) < 0.5)) {
      const rx = boat.x - r.x, ry = boat.y - r.y, dist = Math.hypot(rx, ry);
      if (dist < 600) {
        const dvx = toPx(boat.vx - Math.cos(r.hdg) * r.cur), dvy = toPx(boat.vy - Math.sin(r.hdg) * r.cur), dv2 = dvx * dvx + dvy * dvy;
        const tc = dv2 > 1e-3 ? Math.max(0, -(rx * dvx + ry * dvy) / dv2) : 0, cpa = Math.hypot(rx + dvx * tc, ry + dvy * tc);
        if (cpa < 2 * RB + 2 * 11 + 60 && tc < 22) {
          const role = colregRole(r);
          if (role === 'give') { r.giveWay = true; target = Math.min(target, dist < 2 * RL + 80 ? 0 : 1); }
          else if (role === 'headon') { r.giveWay = true; da += 0.5; target = Math.min(target, 2.5); } // stuurboord uit
          else { r.standOn = true; // koers en vaart houden; attentiesein als de speler niets doet; laatste moment zelf ingrijpen
            if (dist < 2 * RL + 160 && !r.warned) { r.warned = true; SND.horn5 && SND.horn5(); RADIO.say([{ who: r.name, spk: 3, text: lang === 'en' ? `Bunkerguru, ${r.name}, you have me on your starboard side, give way!` : `Bunkerguru, ${r.name}, u heeft mij aan stuurboord, u geeft voorrang!` }], lang); }
            if (dist < 2 * RL + 40 && cpa < 50) target = Math.min(target, 0.5); }
        } else if (dist > 2 * RL + 260) r.warned = false;
      }
    }
    // dwarsverkeer: zie je een varend zeeschip op je af komen en moet je zijn laan nog in, wacht; zit je er al in, doorvaren
    if (!hit && Math.abs(meSN.n) < RIVER_HALF + RL) { // alleen op/bij de rivier
      const turning = Math.abs(da) > 0.45 && !astern, now = trafficConflict(r, turning, 0, astern);
      if (turning && rivals.some(o => o !== r && o.mode !== 'sunk' && Math.hypot(o.x - r.x, o.y - r.y) < 2 * RL + 2 * RB + 10) && (r.turnWait = (r.turnWait || 0) + dt) < 8) { target = 0; da = 0; } else if (!turning) r.turnWait = 0;
      if (now === 0) { if (!turning) target = r.spd; } // ligt al in de weg: doorvaren om vrij te komen
      else { const fut = trafficConflict(r, turning, Math.max(r.cur, target, 1), astern); if (fut >= 0) { target = 0; if (turning) da = 0; r.waitTraffic = true; } else r.waitTraffic = false; }
    }
    if (hit) {
      if (hit.k === 'land' || hit.k === 'berth') { if (!astern) da += (hit.off >= 0 ? -1 : 1) * 0.4; target = Math.min(target, 1); } // voorzichtig
      else { target = hit.d < RL + 50 ? 0 : Math.min(target, 1.5); r.blockT = (r.blockT || 0) + dt;
        if (hit.k === 'player' && r.blockT > 2 && !r.honked) { r.honked = true; SND.horn(); if (Math.random() < 0.5) RADIO.say([{ who: r.name, spk: 3, text: lang === 'en' ? 'Bunkerguru, move over, you are in my way!' : 'Bunkerguru, aan de kant, je ligt in de weg!' }], lang); }
        if (r.blockT > 4 && Math.abs(meSN.n) < RIVER_HALF - RL) { // uitwijken, alleen op de rivier en naar open water
          const c = Math.cos(r.hdg), s = Math.sin(r.hdg), first = Math.random() < 0.5 ? 1 : -1; // (afstanden schalen met de lengte)
          const free = (x, y) => [[0, 0], [20, 0], [-20, 0], [0, 20], [0, -20]].every(([a, b2]) => !obs.some(o => o.k !== 'player' && inPoly({ x: x + a, y: y + b2 }, o.p)));
          for (const side of [first, -first]) { const x = r.x + c * (RL + 90) - s * 60 * side, y = r.y + s * (RL + 90) + c * 60 * side; if (free(x, y)) { r.path.unshift({ x, y }); break; } }
          r.blockT = 0; }
      }
    } else { r.blockT = 0; r.honked = false; }
    r.cur += Math.max(-0.9 * dt * TIME, Math.min(0.5 * dt * TIME, target - r.cur)); // remmen gaat sneller dan optrekken
    const rate = 0.55 * Math.pow(40 / (2 * RL / SCALE), 0.4); // lang schip draait rustiger
    r.hdg += Math.max(-rate * dt, Math.min(rate * dt, da));
    const step = toPx(r.cur) * dt * TIME * (astern ? -1 : 1); r.x += Math.cos(r.hdg) * step; r.y += Math.sin(r.hdg) * step;
    rivalContacts(r, dt);
    if (r.mode === 'sunk') continue;
    if (d < Math.max(14, Math.abs(step) * 1.5)) { r.path.shift(); if (!r.path.length) {
      if (r.mode === 'toTerminal') { r.mode = 'loading'; r.wait = 8; }
      else if (r.mode === 'toShip') {
        if (r.racing && r.target === ship && state.phase !== 'done' && state.phase !== 'bunker') { say(tf('❌ {0} lag eerder langszij {1}. Klus verloren! Nieuwe opdracht…', r.name, ship.name), 5); r.mode = 'bunkering'; r.wait = 6; setTimeout(() => { if (state.phase !== 'done') pickMission(); }, 2500); }
        else { r.mode = 'bunkering'; r.wait = 6; }
      } } }
  }
}
// botsingen van een concurrent: uitduwen + schade op inslagsnelheid (relatief)
function rivalContacts(r, dt) {
  const c = Math.cos(r.hdg), s = Math.sin(r.hdg), rad = RB, sgn = r.astern ? -1 : 1, vx = c * r.cur * sgn, vy = s * r.cur * sgn;
  const pts = [-0.46, -0.31, -0.15, 0, 0.15, 0.31, 0.46].map(f => ({ x: r.x + c * 2 * RL * f, y: r.y + s * 2 * RL * f }));
  for (const o of rivalObstacles(r)) for (const p of pts) {
    if (o.k === 'player') continue; // boot-tegen-speler wordt in physics() afgehandeld (duwen + schuld + schade)
    const e = nearestEdge(p, o.p), inside = inPoly(p, o.p);
    if (!inside && e.d >= rad) continue;
    let ux = p.x - e.qx, uy = p.y - e.qy, dd = Math.hypot(ux, uy); if (dd < 0.001) { ux = 0; uy = -1; dd = 1; }
    ux /= dd; uy /= dd; if (inside) { ux = -ux; uy = -uy; }
    const push = inside ? e.d + rad + 0.5 : rad - e.d + 0.5; r.x += ux * push; r.y += uy * push;
    const rel = o.k === 'player' || o.k === 'rival', rvn = (vx - (rel ? o.vx : 0)) * ux + (vy - (rel ? o.vy : 0)) * uy, impact = Math.max(0, -rvn); // boot-boot: relatieve snelheid; tegen kades en zeeschepen alleen je eigen inslag
    if (o.k === 'ship') r.cur = Math.min(r.cur, 0.2); // door een zeeschip geraakt: stil liggen
    if (o.k !== 'player' && impact > 0.7 && !(r.hitCD > 0)) { r.hitCD = 0.6; const dmg = Math.max(2, Math.round((impact - 0.4) * 9)); r.damage += dmg; r.cur *= 0.3;
      if (o.k === 'player' && !(state.hitCD > 0)) { state.hitCD = 0.6; const pd = Math.max(1, Math.round((impact - 0.4) * 9 * up('fender'))); boat.damage += pd; SND.hit(pd); hitFlash = 0.35; shake = Math.min(14, 4 + pd); say(tf('💥 Aanvaring met {0}: jij +{1}, hij +{2} schade', r.name, pd, dmg), 1.8); } }
  }
}
// ---------- marifoonpraat ----------
function radioChatter() {
  const en = lang === 'en', pick = a => a[Math.floor(Math.random() * a.length)];
  const R = MAP.radio || {}; const sector = pick(R.sectors || ['Verkeerspost']);
  const havens = basins.map(b => b.name).filter(Boolean); const placeNL = pick(R.places || havens.map(h => 'de ' + h)), place = en ? placeNL.replace(/^(de|het) /, '') : placeNL, haven = pick(havens);
  const movers = traffic.filter(t => !t.axis); const sh = movers.length ? pick(movers) : null;
  const tug = traffic.find(t => t.axis === 'n'); const riv = pick(rivals);
  const nm = s => s.split(' ').map((w, i) => i === 0 && w.length <= 3 ? w : w[0] + w.slice(1).toLowerCase()).join(' ');
  const up = sh && sh.v > 0, v = Math.abs(current.speed).toFixed(1).replace('.', en ? '.' : ' komma ');
  const eb = current.speed >= 0;
  const T = [];
  if (sh) T.push(() => [
    { who: nm(sh.name), spk: 0, text: en ? `${sector}, ${nm(sh.name)}, ${up ? 'upbound' : 'downbound'} passing ${place}, over.` : `${sector}, ${nm(sh.name)}, ${up ? 'opvarend' : 'afvarend'} ter hoogte van ${place}, over.` },
    { who: sector, spk: 1, text: en ? `${nm(sh.name)}, ${sector}, roger, traffic is light, keep to starboard, out.` : `${nm(sh.name)}, ${sector}, begrepen, weinig verkeer, houdt u stuurboordwal aan, uit.` }]);
  T.push(() => [{ who: sector, spk: 1, text: en ? `All stations, all stations, this is ${sector}. ${eb ? 'Ebb' : 'Flood'} current ${v} metres per second. Out.` : `Alle schepen, alle schepen, hier ${sector}. ${eb ? 'Ebstroom' : 'Vloedstroom'} ${v} meter per seconde. Uit.` }]);
  if (Math.abs(current.speed) > 2.8) T.push(() => [{ who: sector, spk: 1, text: en ? `Attention small craft, strong ${eb ? 'ebb' : 'flood'} current on the fairway, navigate with caution.` : `Let op kleine vaartuigen, sterke ${eb ? 'eb' : 'vloed'}stroom op de vaarweg, vaar voorzichtig.` }]);
  if (tug) T.push(() => [
    { who: nm(tug.name), spk: 2, text: en ? `${sector}, ${nm(tug.name)}, entering the ${R.tugBasin || haven} with a push tow, over.` : `${sector}, ${nm(tug.name)}, ik draai de ${R.tugBasin || haven} in met een duwbak, over.` },
    { who: sector, spk: 1, text: en ? `${nm(tug.name)}, roger.` : `${nm(tug.name)}, prima, dank u.` }]);
  if (riv) T.push(() => [{ who: riv.name, spk: 3, text: pick(en ? [`Bunkerguru, ${riv.name}. Saw you at the terminal, nice parking. Not.`, `${riv.name} here. Coffee is on at the terminal, if you ever get there.`, `Bunkerguru, mind your wash, you nearly put me on the quay!`] : [`Bunkerguru, ${riv.name}. Mooi aangelegd daarnet. Niet dus.`, `Hier ${riv.name}. Koffie staat klaar aan de terminal, als je er ooit komt.`, `Bunkerguru, let een beetje op je hekgolf, ik lag bijna op de kant!`]) }]);
  T.push(() => [{ who: sector, spk: 1, text: pick(en ? [`All stations, wind south-west four, visibility good. Out.`, `All stations, a rowing club is training near ${place}, keep your speed down.`, `All stations, the ${haven} is temporarily closed for a survey vessel.`] : [`Alle schepen, wind zuidwest vier, zicht goed. Uit.`, `Alle schepen, ter hoogte van ${place} is een roeivereniging aan het trainen, matig uw vaart.`, `Alle schepen, de ${haven} is tijdelijk gestremd voor een peilvaartuig.`]) }]);
  return pick(T)();
}
function radioRival(r, berth) {
  const en = lang === 'en';
  RADIO.say([{ who: r.name, spk: 3, text: en ? `All bunker boats, ${r.name}, I'm taking ${berth.name} too. First alongside gets it!` : `Alle bunkerboten, hier ${r.name}, ik ga ook voor de ${berth.name}. Wie het eerst langszij ligt!` }], lang, true);
}
function maybeRace() { if (Math.random() < 0.55) { const idle = rivals.filter(r => r.mode === 'idle'); if (idle.length) { const r = idle[Math.floor(Math.random() * idle.length)]; setTimeout(() => { if (r.mode === 'idle') rivalStartJob(r, ship, true); }, 3000 + Math.random() * 6000); } } }
function drawRival(r, t) {
  const L = 2 * RL, Bw = 2 * RB, moving = (r.mode === 'toTerminal' || r.mode === 'toShip') && (r.cur || 0) > 0.3;
  if (r.mode === 'sunk') { const k = Math.min(1, r.sinkT / 4); ctx.save(); ctx.globalAlpha = 1 - k * 0.9; ctx.translate(r.x, r.y); ctx.rotate(r.hdg + k * 0.5); ctx.scale(1 - k * 0.6, 1 - k * 0.6); ctx.fillStyle = r.col; ctx.fillRect(-L / 2, -Bw / 2, L, Bw); ctx.restore(); ctx.globalAlpha = 1; ctx.fillStyle = 'rgba(255,255,255,.8)'; for (let i = 0; i < 8; i++) { const ph = (t * 0.8 + i * 0.12) % 1; ctx.beginPath(); ctx.arc(r.x + (i - 4) * 8, r.y - ph * 40, 2 + ph * 4, 0, 7); ctx.fill(); } return; }
  { const sx = r.x - Math.cos(r.hdg) * L / 2, sy = r.y - Math.sin(r.hdg) * L / 2; const kk = moving ? Math.min(1, (r.cur || 0) / 6) : 0; const trl = pushTrail(r, sx, sy, t, moving); drawTrailWake(trl, t, Bw, kk); drawKelvin(sx, sy, r.hdg, L, kk); }
  ctx.save(); ctx.translate(r.x, r.y); ctx.rotate(r.hdg);
  const hull = () => { ctx.beginPath(); ctx.moveTo(-L / 2 + 4, -Bw / 2); ctx.lineTo(L / 2 - 16, -Bw / 2); ctx.quadraticCurveTo(L / 2 + 6, 0, L / 2 - 16, Bw / 2); ctx.lineTo(-L / 2 + 4, Bw / 2); ctx.quadraticCurveTo(-L / 2 - 3, 0, -L / 2 + 4, -Bw / 2); ctx.closePath(); };
  if (moving) drawBowWave(L, Bw, Math.min(1, (r.cur || 0) / 6), t);
  ctx.save(); ctx.translate(3, 5); ctx.fillStyle = 'rgba(0,30,60,.3)'; hull(); ctx.fill(); ctx.restore();
  ctx.fillStyle = r.col; hull(); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 3.5; ctx.stroke();
  drawTankerBody(L, Bw, r.col, r.mode === 'loading' ? 0.5 : r.mode === 'toShip' ? 1 : 0.1, false);
  ctx.restore();
  ctx.fillStyle = r.racing ? '#ffd54a' : '#fff'; ctx.font = 'bold 12px system-ui'; ctx.textAlign = 'center'; ctx.fillText(r.name + (r.racing ? ' ⚔️' : '') + (r.standOn ? ' ⚠️' : r.giveWay ? ' ✋' : ''), r.x, r.y - 26); ctx.textAlign = 'left';
  if (r.damage > 0) { const dc = r.damage < 40 ? '#5ee88a' : r.damage < 75 ? '#ffd54a' : '#ff5a5a'; ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(r.x - 22, r.y - 22, 44, 5); ctx.fillStyle = dc; ctx.fillRect(r.x - 22, r.y - 22, 44 * Math.min(1, r.damage / 100), 5); }
}
let hitFlash = 0, shake = 0, warp = 1, paused = false;
// ---------- afmeren ----------
let moored = null; // { to: 'ship'|'terminal', lines: [{a:{x,y}, b:{x,y}}] }
const MOOR_KMH = 4; // vastmaken mag tot 4 km/h t.o.v. de kade/het schip (je ligt tegen de stroom in met de machine bij)
function mooringCandidates() {
  const b = boat, sp = Math.hypot(b.vx, b.vy) * 3.6;
  if (sp > MOOR_KMH) return { ok: false, why: tf('te veel vaart ({0} km/h)', sp.toFixed(1)) };
  if (state.phase === 'sail' && state.inZone) { if (state.hdgErr > 20 * Math.PI / 180) return { ok: false, why: tf('koers {0}° scheef', Math.round(state.hdgErr * 180 / Math.PI)) }; return { ok: true, to: 'ship', polys: [ship.quad] }; }
  for (const tm of terminals) if (inSN(b, tm)) return { ok: true, to: 'terminal', polys: land.map(l => l.poly) };
  for (const w of waits) if (inSN(b, w)) return { ok: true, to: 'wait', wait: w, polys: land.map(l => l.poly) };
  return { ok: false, why: tr('niet bij een ligplaats, terminal of wachtplaats') };
}
function toggleMooring() {
  const b = boat;
  if (moored) { moored = null; SND.rope(); say(tr('Trossen los'), 1.5); return; }
  const c = mooringCandidates(); if (!c.ok) { say(tf('Kan niet vastmaken: {0}', c.why), 2); return; }
  const L = toPx(b.L), cos = Math.cos(b.hdg), sin = Math.sin(b.hdg);
  const pts = [0.42, -0.42].map(f => ({ x: b.x + cos * L * f, y: b.y + sin * L * f }));
  const lines = pts.map(p => { let best = null; for (const poly of c.polys) { const e = nearestEdge(p, poly); if (!best || e.d < best.d) best = e; } return { a: p, b: { x: best.qx, y: best.qy } }; });
  moored = { to: c.to, lines, wait: c.wait }; SND.rope(); if (c.to === 'wait') { saveGame(c.wait); say(tf('⚓💾 Vast aan {0} · voortgang opgeslagen · rusten…', c.wait.name), 4); return; } b.vx = b.vy = b.r = 0; b.tele = 0; b.teleIdx = 3; b.bow = 0;
  say(tr(c.to === 'ship' ? '⚓ Vast langszij. Slangen aan!' : '⚓ Vast aan de terminal'), 2);
}
// carrière: goud + upgrades (bewaard in de browser)
const UPG = {
  motor:  { name: 'Motor',        desc: ['Standaard 1200 pk (31 km/h)', 'Zwaardere motor: 38 km/h', 'Racemotor: 46 km/h'], cost: [0, 900, 2200], val: [6.2, 9.5, 13.5] },
  boeg:   { name: 'Boegschroef',  desc: ['Standaard', 'Dubbele boegschroef (+60 %)', 'Kanaalschroef (+130 %)'], cost: [0, 500, 1300], val: [1, 1.6, 2.3] },
  tanks:  { name: 'Tanks',        desc: ['1200 t', '1600 t: grotere klussen', '2000 t: de grote jongens'], cost: [0, 700, 1600], val: [1200, 1600, 2000] },
  fender: { name: 'Fenders',      desc: ['Standaard', 'Dikke fenders: schade −30 %', 'Stootkussens: schade −55 %'], cost: [0, 600, 1500], val: [1, 0.7, 0.45] },
  pomp:   { name: 'Pomp',         desc: ['Bunkeren 6 s', 'Snelle pomp: 4 s', 'Turbo-pomp: 2,5 s'], cost: [0, 400, 1000], val: [6, 4, 2.5] },
};
let career = { gold: 300, lvl: { motor: 0, boeg: 0, tanks: 0, fender: 0, pomp: 0 }, jobs: 0 };
try { const c = JSON.parse(localStorage.getItem('bunker_career') || 'null'); if (c && c.lvl) career = Object.assign(career, c); } catch (e) {}
function saveCareer() { try { localStorage.setItem('bunker_career', JSON.stringify(career)); } catch (e) {} }
const up = k => UPG[k].val[career.lvl[k]];
function pickTarget() { const cap = up('tanks'); const opts = [600, 800, 1000, 1200, 1600, 2000].filter(t => t <= cap); return opts[Math.floor(Math.random() * opts.length)]; }
updateTraffic(0);

const keys = {};
const TELE = [
  { v: -0.6, n: 'vol achteruit' }, { v: -0.4, n: 'half achteruit' }, { v: -0.2, n: 'langzaam achteruit' },
  { v: 0, n: 'stop' },
  { v: 0.15, n: 'zeer langzaam' }, { v: 0.3, n: 'langzaam' }, { v: 0.55, n: 'half' }, { v: 0.8, n: 'vol' }, { v: 1, n: 'vol vooruit' },
];
function teleStep(d) { if (moored) { say(tr('⚓ Trossen zitten vast – eerst M = los'), 1.5); return; } boat.teleIdx = Math.max(0, Math.min(TELE.length - 1, boat.teleIdx + d)); boat.tele = TELE[boat.teleIdx].v; }
addEventListener('keydown', e => {
  if (e.repeat) { if (e.key.startsWith('Arrow')) e.preventDefault(); return; }
  keys[e.key] = true;
  if (e.key === ' ') { boat.rudderCmd = 0; e.preventDefault(); }
  if (e.key === 'ArrowUp') teleStep(1);
  if (e.key === 'ArrowDown') teleStep(-1);
  if (e.key === 'r' || e.key === 'R') reset();
  if ((e.key === 'n' || e.key === 'N') && state.phase === 'done') nextMission();
  if ((e.key === 'b' || e.key === 'B') && running) toggleShop();
  if ((e.key === 'm' || e.key === 'M') && running) toggleMooring();
  if ((e.key === 'h' || e.key === 'H') && running) { SND.init(); SND.horn(); }
  if (e.key === 'o' || e.key === 'O') toggleSound();
  if ((e.key === 'k' || e.key === 'K') && running) toggleBigMap();
  if (e.key === 'v' || e.key === 'V') say(tr(RADIO.toggle() ? '📻 Marifoon aan' : '📻 Marifoon uit'), 1.2);
  if (e.key === 'p' || e.key === 'P') { SND.init(); say(tr(SND.toggleMusic() ? '🎵 Muziek aan' : '🎵 Muziek uit'), 1.2); }
  if (e.key === 'g' || e.key === 'G') { SND.init(); const mu = SND.toggle(); if (mu && 'speechSynthesis' in window) speechSynthesis.cancel(); say(tr(mu ? '🔇 Geluid uit' : '🔊 Geluid aan'), 1.2); }
  if (e.key === 'l' || e.key === 'L') { setLang(lang === 'nl' ? 'en' : 'nl'); renderMapMenu(); renderContinue(); }
  if (e.key === 'Escape' && running) openMenu();
  if (e.key === 't' || e.key === 'T') { warp = warp === 1 ? 2 : 1; say(tr(warp === 2 ? '⏩ Snelvaart 2× (T = uit)' : 'Normale tijd'), 1.5); }
  if (e.key.startsWith('Arrow')) e.preventDefault();
});
addEventListener('keyup', e => { keys[e.key] = false; });
document.getElementById('touch').addEventListener('contextmenu', e => e.preventDefault());
document.querySelectorAll('.tb').forEach(b => {
  const k = b.dataset.k;
  const on = e => { e.preventDefault(); keys[k] = true; if (k === 'mid') { boat.rudderCmd = 0; say(tr('Roer midscheeps'), 0.8); } if (k === 'ArrowUp') teleStep(1); if (k === 'ArrowDown') teleStep(-1); if (k === 'b') toggleShop(); if (k === 'm') toggleMooring(); if (k === 'esc' && running) openMenu(); if (k === 'h') { SND.init(); SND.horn(); } if (k === 'o') toggleSound(); if (k === 'v') say(tr(RADIO.toggle() ? '📻 Marifoon aan' : '📻 Marifoon uit'), 1.2); if (k === 'p') { SND.init(); say(tr(SND.toggleMusic() ? '🎵 Muziek aan' : '🎵 Muziek uit'), 1.2); } if (k === 'g') { SND.init(); say(tr(SND.toggle() ? '🔇 Geluid uit' : '🔊 Geluid aan'), 1.2); } if (k === 't') { warp = warp === 1 ? 2 : 1; say(tr(warp === 2 ? '⏩ Snelvaart 2× (T = uit)' : 'Normale tijd'), 1.5); } };
  const off = e => { e.preventDefault(); keys[k] = false; };
  b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('pointerleave', off);
});

let boat, state, msgTimer = 0, score = 0, bestScore = 0;
try { bestScore = +(localStorage.getItem('bunker_best') || 0) || 0; } catch (e) {}
const cam = { x: 0, y: 0 };
function reset() {
  const p = sn2w(startPos.s, startPos.n);
  boat = { x: p.x, y: p.y, hdg: TH + startPos.hdgOff, vx: 0, vy: 0, r: 0, tele: 0, teleIdx: 3, rudderCmd: 0, rudder: 0, bow: 0, L: 110, B: 11, damage: 0, cargo: 0, target: 800, fatigue: 0 };
  state = { phase: 'load', holdT: 0, bunkerT: 0, elapsed: 0 }; moored = null;
  score = 0; totalScore = 0; missionCount = 0; mission = -1; pickMission();
  cam.x = boat.x - VW / 2; cam.y = boat.y - VH / 2;
}
// ---------- opslaan / verder varen ----------
function saveGame(w) {
  const b = boat, data = { v: 2, at: Date.now(), map: MAP.id, wait: w ? w.name : null, x: b.x, y: b.y, hdg: b.hdg, damage: b.damage, fatigue: b.fatigue, cargo: b.cargo, target: b.target,
    mission, term: terminals.indexOf(terminal), phase: state.phase === 'bunker' ? 'sail' : state.phase === 'done' || state.phase === 'sunk' ? 'load' : state.phase, missionCount, totalScore,
    tideT, tidePhase, simClock, rivals: rivals.map(r => ({ x: r.x, y: r.y, hdg: r.hdg, gold: r.gold, jobs: r.jobs, damage: r.damage || 0, sunk: r.mode === 'sunk' })) };
  try { localStorage.setItem('bunker_save', JSON.stringify(data)); } catch (e) {}
}
function readSave() { try { const s = JSON.parse(localStorage.getItem('bunker_save') || 'null'); return s && s.v === 2 && MAPS.find(m => m.id === s.map) ? s : null; } catch (e) { return null; } }
function continueGame() {
  const s = readSave(); if (!s) return startGame();
  SND.init(); RADIO.reset(); loadMap(MAPS.find(m => m.id === s.map)); reset();
  const b = boat; b.x = s.x; b.y = s.y; b.hdg = s.hdg; b.damage = s.damage || 0; b.fatigue = s.fatigue || 0; b.cargo = s.cargo || 0; b.target = s.target || 800;
  mission = s.mission >= 0 && s.mission < berths.length ? s.mission : 0; ship = berths[mission]; dock = ship.dock; terminal = terminals[s.term] || terminals[0];
  state.phase = s.phase || 'load'; missionCount = s.missionCount || 0; totalScore = s.totalScore || 0; tideT = s.tideT || 0; tidePhase = s.tidePhase || 0; simClock = s.simClock || 0;
  (s.rivals || []).forEach((q, i) => { const r = rivals[i]; if (!r) return; r.x = q.x; r.y = q.y; r.hdg = q.hdg; r.gold = q.gold; r.jobs = q.jobs; r.damage = q.damage || 0; r.mode = 'idle'; r.wait = 4 + i * 5; r.path = []; r.cur = 0; });
  cam.x = b.x - VW / 2; cam.y = b.y - VH / 2;
  overlay.style.display = 'none'; running = true; paused = false; last = performance.now();
  const c = mooringCandidates(); if (c.ok) { const L = toPx(b.L), cos = Math.cos(b.hdg), sin = Math.sin(b.hdg); moored = { to: c.to, wait: c.wait, lines: [0.42, -0.42].map(f => { const p = { x: b.x + cos * L * f, y: b.y + sin * L * f }; let best = null; for (const poly of c.polys) { const e = nearestEdge(p, poly); if (!best || e.d < best.d) best = e; } return { a: p, b: { x: best.qx, y: best.qy } }; }) }; }
  say(tf('▶ Verder varen vanaf {0}. Opdracht: {1} t voor {2}.', s.wait || MAP.name, b.target, ship.name), 6);
}
function say(s, hold = 0) { msgEl.textContent = s; msgTimer = hold; }

// ---------- geometrie ----------
function inPoly(p, poly) { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if ((a.y > p.y) !== (b.y > p.y) && p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x) c = !c; } return c; }
function nearestEdge(p, poly) { // kortste afstand tot rand + naar-buiten-normaal
  let best = null;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length]; const ex = b.x - a.x, ey = b.y - a.y, l2 = ex * ex + ey * ey;
    let t = ((p.x - a.x) * ex + (p.y - a.y) * ey) / l2; t = Math.max(0, Math.min(1, t));
    const qx = a.x + ex * t, qy = a.y + ey * t, d = Math.hypot(p.x - qx, p.y - qy);
    if (!best || d < best.d) best = { d, qx, qy };
  }
  return best;
}
function distToPoly(p, poly) { const e = nearestEdge(p, poly); return inPoly(p, poly) ? -e.d : e.d; }
function inRiver(x, y) { const { s, n } = w2sn(x, y); return Math.abs(n) < RIVER_HALF; }
function currentAt(x, y) {
  const { s, n } = w2sn(x, y);
  if (Math.abs(n) < RIVER_HALF && s > S_MIN && s < S_MAX) { const f = 1 - Math.pow(Math.abs(n) / RIVER_HALF, 3) * 0.6; return { vx: dirSea.x * current.speed * f, vy: dirSea.y * current.speed * f }; }
  for (const c of channels) if (s > c.s0 && s < c.s1 && n > c.n0 && n < c.n1) { const k = MAP.tide ? current.speed / MAP.tide.ebbMax : 1; return { vx: (c.cs * CT - c.cn * ST) * k, vy: (c.cs * ST + c.cn * CT) * k }; }
  return { vx: 0, vy: 0 };
}

// ---------- fysica ----------
function input(dt) {
  const b = boat;
  if (keys.ArrowLeft) b.rudderCmd = Math.max(-1, b.rudderCmd - dt * 1.4);
  if (keys.ArrowRight) b.rudderCmd = Math.min(1, b.rudderCmd + dt * 1.4);
  b.bow = moored ? 0 : (keys.q ? -1 : 0) + (keys.e ? 1 : 0);
}
function physics(dt) {
  const b = boat; if (state.hitCD > 0) state.hitCD -= dt;
  if (moored) { b.vx = b.vy = b.r = 0; b.rudder += (b.rudderCmd - b.rudder) * Math.min(1, dt * 1.5); return; }
  const tired = b.fatigue >= 100; b.rudder += (b.rudderCmd + (tired ? Math.sin(simClock * 0.7) * 0.15 : 0) - b.rudder) * Math.min(1, dt * (tired ? 0.6 : 1.5)); // oververmoeid: traag en slingerend roer
  const cos = Math.cos(b.hdg), sin = Math.sin(b.hdg);
  const c = currentAt(b.x, b.y);
  const rvx = b.vx - c.vx, rvy = b.vy - c.vy;
  let u = rvx * cos + rvy * sin, v = -rvx * sin + rvy * cos;
  const massK = 1 / (1 + 0.45 * (b.cargo / Math.max(1, b.target))); // geladen = trager optrekken en afstoppen
  const maxThrust = up('motor') * massK, thrust = Math.sign(b.tele) * Math.pow(Math.abs(b.tele), 1.6) * maxThrust * (b.tele < 0 ? 0.7 : 1); // niet-lineair: lage standen blijven traag, vol gas ~31 km/h
  const du = thrust - 0.08 * u * Math.abs(u) - 0.05 * u;
  const dv = -1.2 * v * Math.abs(v) - 0.9 * v;
  const flow = Math.max(-4, Math.min(6, u + (b.tele > 0 ? b.tele * 2.0 : 0))); // plafond: geen tolboot op volle vaart
  const rudForce = b.rudder * flow * Math.abs(flow) * 0.09;
  const bowF = 0.04 * up('boeg') * Math.max(0, 1 - Math.abs(u) / 3.5); // boegschroef verliest kracht boven ~2 m/s vaart door het water
  const yawK = Math.pow(40 / b.L, 0.7); // langer schip: meer traagheid om de as, draait trager
  const dr = (rudForce * 0.06 + b.bow * bowF) * yawK - b.r * 0.9 - b.r * Math.abs(b.r) * 2.0;
  u += du * dt; v += (dv - rudForce * 0.3 + b.bow * bowF * 4.5) * dt; b.r += dr * dt;
  // stroomschering: kop en hek in verschillende stroom (bekkenmond, oever) geeft een draaimoment
  const Lp = toPx(b.L) * 0.45, cb = currentAt(b.x + cos * Lp, b.y + sin * Lp), cst = currentAt(b.x - cos * Lp, b.y - sin * Lp);
  const shear = (-(cb.vx - cst.vx) * sin + (cb.vy - cst.vy) * cos); // dwarscomponent verschil, m/s
  b.r += shear * 0.06 * dt;
  b.vx = u * cos - v * sin + c.vx; b.vy = u * sin + v * cos + c.vy;
  b.hdg += b.r * dt; b.x += toPx(b.vx) * dt; b.y += toPx(b.vy) * dt;
  // botsingen
  const pts = [-0.46, -0.31, -0.15, 0, 0.15, 0.31, 0.46].map(f => ({ x: b.x + Math.cos(b.hdg) * toPx(b.L) * f, y: b.y + Math.sin(b.hdg) * toPx(b.L) * f })); // 7 meetpunten over de lengte
  const rad = toPx(b.B) / 2;
  const walls = land.map(l => l.poly).concat(berths.map(b => b.quad), traffic.map(t => t.quad), rivalQuads()), nNoRival = walls.length - rivalQuads().length;
  for (const [wi, poly] of walls.entries()) for (const p of pts) {
    const e = nearestEdge(p, poly); const inside = inPoly(p, poly);
    if (inside || e.d < rad) {
      let ux = p.x - e.qx, uy = p.y - e.qy, d = Math.hypot(ux, uy);
      if (d < 0.001) { ux = 0; uy = -1; d = 1; }
      ux /= d; uy /= d; if (inside) { ux = -ux; uy = -uy; }
      const push = inside ? e.d + rad + 0.5 : rad - e.d + 0.5;
      b.x += ux * push; b.y += uy * push;
      const vn = b.vx * ux + b.vy * uy, impact = Math.max(0, -vn); // alleen snelheid ín de kade/het schip telt, langs schuiven niet
      const rv = wi >= nNoRival ? rivals.filter(q => q.mode !== 'sunk')[wi - nNoRival] : null;
      let rimp = 0, shareR = 0.5; // relatieve inslag en wiens schuld (aandeel van de concurrent), vóór terugkaatsen
      if (rv) { const sgn = rv.astern ? -1 : 1, rvx = Math.cos(rv.hdg) * (rv.cur || 0) * sgn, rvy = Math.sin(rv.hdg) * (rv.cur || 0) * sgn;
        const aP = Math.max(0, -(b.vx * ux + b.vy * uy)), aR = Math.max(0, rvx * ux + rvy * uy); rimp = aP + aR; shareR = aR / Math.max(1e-6, aP + aR);
        const role = (rv.cur || 0) > 0.3 ? colregRole(rv) : 'none'; if (role === 'give') shareR = Math.max(shareR, 0.8); else if (role === 'stand' && aR < 0.3 + aP) shareR = Math.min(shareR, 0.2); } // wie voorrang had moeten geven is schuldig
      if (vn < 0) { b.vx -= vn * ux * 1.3; b.vy -= vn * uy * 1.3; }
      b.r *= 0.5;
      if (wi >= nNoRival) { // botsing met een concurrent: relatieve snelheid, beide krijgen schade
        if (rimp > 0.7 && !(state.hitCD > 0) && !(rv.hitCD > 0)) { state.hitCD = 0.6; rv.hitCD = 0.6;
          // wie ramt krijgt 60 %, wie geraakt wordt 40 %; de veroorzaker betaalt de schade van de ander
          const k = (rimp - 0.4) * 9, pd = Math.max(1, Math.round(k * (0.8 + 0.4 * (1 - shareR)) * up('fender'))), od = Math.max(1, Math.round(k * (0.8 + 0.4 * shareR)));
          b.damage += pd; rv.damage += od; rv.cur *= 0.3; SND.hit(pd); hitFlash = 0.35; shake = Math.min(14, 4 + pd);
          const now = performance.now() / 1000, feeOk = !(rv.feeAt > now - 5); if (feeOk && (shareR > 0.6 || shareR < 0.4)) rv.feeAt = now; // één botsing = één afrekening
          if (shareR > 0.6 && feeOk) { const fee = pd * 5; rv.gold = Math.max(0, rv.gold - fee); career.gold += fee; saveCareer(); saveRivals(); say(tf('💥 {0} sneed je af: jij +{1}, hij +{2} schade · {0} betaalt jou {3} 🪙', rv.name, pd, od, fee), 3); }
          else if (shareR < 0.4 && feeOk) { const fee = Math.min(Math.round(career.gold), od * 5); career.gold -= fee; rv.gold += fee; saveCareer(); saveRivals(); say(tf('💥 Jij ramde {0}: jij +{1}, hij +{2} schade · jij betaalt {3} 🪙', rv.name, pd, od, fee), 3); }
          else if (shareR >= 0.4 && shareR <= 0.6) say(tf('💥 Aanvaring met {0}: jij +{1}, hij +{2} schade (beide schuld)', rv.name, pd, od), 2.5);
          else say(tf('💥 Raak! +{0} schade', pd), 1.2); }
      } else if (impact > 0.8 && !(state.hitCD > 0)) { state.hitCD = 0.6; const dmg = Math.max(1, Math.round((impact - 0.5) * 9 * up('fender'))); b.damage += dmg; SND.hit(dmg); hitFlash = 0.35; shake = Math.min(14, 4 + dmg); say(tf('💥 Raak! +{0} schade', dmg), 1.2); }
    }
  }
  b.x = Math.max(0, Math.min(W, b.x)); b.y = Math.max(0, Math.min(H, b.y));
}

// ---------- spel-logica ----------
function inSN(b, z) { const { s, n } = w2sn(b.x, b.y); return s > z.s0 && s < z.s1 && n > z.n0 && n < z.n1; }
function logic(dt) {
  const b = boat; state.elapsed += dt;
  if (b.damage >= 100 && state.phase !== 'sunk') { moored = null; state.phase = 'sunk'; state.sinkT = 0; b.tele = 0; b.teleIdx = 3; const loss = Math.round(career.gold / 2); career.gold -= loss; SND.sink(); saveCareer(); say(tf('🫧 Gezonken! Verzekering betaalt de helft: −{0} goud. Nieuwe boot volgt…', loss)); }
  if (state.phase === 'sunk') { state.sinkT += dt; b.vx *= 0.9; b.vy *= 0.9; b.r *= 0.9; if (state.sinkT > 5) { const p = sn2w(startPos.s, startPos.n); b.x = p.x; b.y = p.y; b.hdg = TH + startPos.hdgOff; b.vx = b.vy = b.r = 0; b.damage = 0; b.rudderCmd = b.rudder = 0; pickMission(); } return; }
  const speedKmh = Math.hypot(b.vx, b.vy) * 3.6;
  if (state.phase === 'done') { state.doneT = (state.doneT || 0) + dt; if (state.doneT > 7) { state.doneT = 0; nextMission(); } if (msgTimer > 0) msgTimer -= dt; return; }
  if (state.phase === 'load') {
    if (inSN(b, terminal) && speedKmh < 1.5) {
      b.cargo = Math.min(b.target, b.cargo + dt * 160);
      if (b.damage > 0) { const fix = Math.min(b.damage, dt * 10); b.damage -= fix; career.gold = Math.max(0, career.gold - fix * 2); state.repairT = (state.repairT || 0) + dt; if (state.repairT > 1) { state.repairT = 0; saveCareer(); } }
      say(tf('{0}Laden… {1} / {2} t{3} · {4} · B = winkel', moored ? '⚓ ' : '', Math.round(b.cargo), b.target, b.damage > 0 ? tr(' · werf repareert (2 🪙/pt)') : '', tr(moored ? 'M = los' : 'M = vast')));
      if (b.cargo >= b.target) { state.phase = 'sail'; say(tf('Vol. Naar {0}, {1}. Let op stroming, dam en verkeer!', ship.name, tr(ship.where)), 5); }
    } else if (msgTimer <= 0) say(tf('Haal {0} t bij {1} (geel) – stil liggen om te laden', b.target, terminal.name));
  } else if (state.phase === 'sail') {
    const inZone = inSN(b, dock);
    const d = (((b.hdg - ship.hdg) % Math.PI) + Math.PI) % Math.PI; const hdgErr = Math.min(d, Math.PI - d); state.hdgErr = hdgErr; state.inZone = inZone;
    const ok = inZone && speedKmh < 1.5 && hdgErr < 10 * Math.PI / 180;
    if (moored && moored.to === 'ship' && inZone) { state.phase = 'bunker'; say(tr('Slangen aan. Bunkeren!')); return; }
    if (ok) { state.holdT += dt; say(tf('Langszij… houden {0} s', (2 - state.holdT).toFixed(1))); if (state.holdT >= 2) { state.phase = 'bunker'; say(tr('Slangen aan. Bunkeren!')); } }
    else { state.holdT = 0; if (inZone && msgTimer <= 0) say(speedKmh >= 1.5 ? tf('Te snel: {0} km/h', speedKmh.toFixed(1)) : hdgErr >= 10 * Math.PI / 180 ? tf('Koers {0}° scheef', Math.round(hdgErr * 180 / Math.PI)) : tr('M = trossen vast')); else if (msgTimer <= 0) say(tr('Naar de groene zone langs het zeeschip (zie minimap)')); }
  } else if (state.phase === 'bunker') {
    if (!moored && speedKmh > 2.5) { state.phase = 'sail'; state.holdT = 0; say(tr('⚠️ Losgeslagen! Slangen eraf. Opnieuw langszij (of M = vast).'), 2); return; }
    const BT = up('pomp'); state.bunkerT += dt; b.cargo = Math.max(0, b.target * (1 - state.bunkerT / BT)); say(tf('Bunkeren… {0} t aan boord', Math.round(b.cargo)));
    if (state.bunkerT >= BT) {
      state.phase = 'done';
      const timeScore = Math.max(0, 900 - Math.round(state.elapsed) * 3);
      score = Math.max(0, 1000 + timeScore - Math.round(b.damage) * 10); totalScore += score;
      if (totalScore > bestScore) { bestScore = totalScore; try { localStorage.setItem('bunker_best', bestScore); } catch (e) {} }
      const pay = Math.round(b.target * 0.6), bonus = Math.round(Math.max(0, 400 - state.elapsed * 0.9)), clean = b.damage < 0.5 ? 150 : 0;
      career.gold += pay + bonus + clean; career.jobs++; saveCareer(); SND.coin();
      for (const r of rivals) if (r.racing && r.target === ship) { r.racing = false; r.mode = 'idle'; r.wait = 10; r.path = []; }
      say(tf('✅ Klaar!{0} 🪙 +{1} vracht +{2} tijd{3} = {4} goud. N = volgende, B = winkel', moored ? tr(' M = los,') : '', pay, bonus, clean ? tr(' +150 schadevrij') : '', pay + bonus + clean));
    }
  }
  if (msgTimer > 0) msgTimer -= dt;
}

// ---------- tekenhulpjes ----------
function rrect(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function path(poly) { ctx.beginPath(); sub(poly); }
function sub(poly) { poly.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.closePath(); }
function makeWaveTile(size, n, alpha, lw) {
  const c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d');
  g.strokeStyle = `rgba(255,255,255,${alpha})`; g.lineWidth = lw; g.lineCap = 'round';
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < n; i++) { const x = rnd() * size, y = rnd() * size, w = 14 + rnd() * 22, h = 3 + rnd() * 3;
    for (const [dx, dy] of [[0, 0], [size, 0], [-size, 0], [0, size], [0, -size]]) { g.beginPath(); g.moveTo(x + dx, y + dy); g.quadraticCurveTo(x + dx + w / 2, y + dy - h, x + dx + w, y + dy); g.stroke(); } }
  return c;
}
const tileA = makeWaveTile(256, 34, 0.45, 3), tileB = makeWaveTile(192, 26, 0.22, 2);
const patA = ctx.createPattern(tileA, 'repeat'), patB = ctx.createPattern(tileB, 'repeat');
function waveLayer(pat, ox, oy, clipPoly, invert) {
  ctx.save(); ctx.beginPath(); ctx.rect(cam.x, cam.y, VW, VH);
  if (clipPoly) { if (invert) { sub(clipPoly); ctx.clip('evenodd'); } else { ctx.clip(); path(clipPoly); ctx.clip(); } } else ctx.clip();
  ctx.translate(ox, oy); ctx.fillStyle = pat; ctx.fillRect(cam.x - ox - 400, cam.y - oy - 400, VW + 800, VH + 800); ctx.restore();
}
// voorgerenderde ondiepgloed (wereldgrootte)
const clouds = [{ x: 100, y: 150, s: 1.2 }, { x: 900, y: 620, s: 1.6 }, { x: 1800, y: 300, s: 1 }, { x: 1400, y: 1200, s: 1.4 }, { x: 2300, y: 900, s: 1.1 }, { x: 3200, y: 1700, s: 1.5 }, { x: 3900, y: 500, s: 1.2 }, { x: 2800, y: 2300, s: 1.3 }];

const wrap = (v, m) => ((v % m) + m) % m;
function drawWater(tReal) {
  const t = simClock; // golven lopen op de spelklok, zodat ze bij snelvaart gelijk blijven met de stroom
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#2f8fd0'); g.addColorStop(0.5, '#1f6fae'); g.addColorStop(1, '#2a86c4');
  ctx.fillStyle = g; ctx.fillRect(cam.x, cam.y, VW, VH);
  // rivier donkerder
  ctx.fillStyle = 'rgba(10,50,110,.26)'; path(riverPoly); ctx.fill();
  ctx.lineCap = 'round'; for (const [w, a] of [[46, .10], [30, .14], [16, .2]]) { ctx.strokeStyle = `rgba(120,230,220,${a})`; ctx.lineWidth = w; ctx.beginPath(); for (const e of shore) { if (Math.max(e.p.x, e.q.x) < cam.x - 60 || Math.min(e.p.x, e.q.x) > cam.x + VW + 60 || Math.max(e.p.y, e.q.y) < cam.y - 60 || Math.min(e.p.y, e.q.y) > cam.y + VH + 60) continue; ctx.moveTo(e.p.x, e.p.y); ctx.lineTo(e.q.x, e.q.y); } ctx.stroke(); }
  const flow = toPx(current.speed) * TIME;
  const arrowAlpha = Math.min(0.7, 0.15 + Math.abs(current.speed) * 0.15);
  // haven: langzaam; rivier: mee met stroom (richting zee)
  waveLayer(patA, (t * 10) % 256, Math.sin(t * 0.5) * 4, riverPoly, true);
  waveLayer(patB, (-t * 6) % 192, Math.cos(t * 0.4) * 3, riverPoly, true);
  waveLayer(patA, wrap(t * flow * dirSea.x, 256), wrap(t * flow * dirSea.y, 256) + Math.sin(t * 0.7) * 3, riverPoly, false);
  waveLayer(patB, wrap(t * flow * 0.6 * dirSea.x, 192), wrap(t * flow * 0.6 * dirSea.y, 192), riverPoly, false);
  // glinsters
  ctx.fillStyle = '#fff';
  for (let i = 0; i < 400; i++) { const x = (i * 97.3) % W, y = (i * 61.7 + 30) % H; if (x < cam.x || x > cam.x + VW || y < cam.y || y > cam.y + VH) continue; const tw = Math.sin(t * 3 + i * 1.3) * 0.5 + 0.5; if (tw < 0.75) continue; ctx.globalAlpha = (tw - 0.75) * 3.2; ctx.fillRect(x, y, 6 + tw * 6, 2); }
  ctx.globalAlpha = 1;
  // stroompijlen
  ctx.strokeStyle = `rgba(255,255,255,${arrowAlpha})`; ctx.lineWidth = 2 + Math.abs(current.speed) * 0.6; ctx.lineCap = 'round';
  for (let n = -RIVER_HALF + 40; n <= RIVER_HALF - 40; n += 60) for (let s = S_MIN + ((-t * flow + n * 2) % 240 + 240) % 240; s < S_MAX; s += 240) {
    const dsg = current.speed >= 0 ? 1 : -1; const a = sn2w(s, n), b = sn2w(s - 26 * dsg, n), c1 = sn2w(s - 19 * dsg, n - 6), c2 = sn2w(s - 19 * dsg, n + 6);
    if (a.x < cam.x - 50 || a.x > cam.x + VW + 50 || a.y < cam.y - 50 || a.y > cam.y + VH + 50) continue;
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.moveTo(c1.x, c1.y); ctx.lineTo(b.x, b.y); ctx.lineTo(c2.x, c2.y); ctx.stroke();
  }
  for (const c of clouds) { const cx = (c.x + t * 9) % (W + 300) - 150; ctx.fillStyle = 'rgba(0,30,70,.12)'; ctx.beginPath(); ctx.ellipse(cx, c.y, 90 * c.s, 38 * c.s, 0, 0, 7); ctx.ellipse(cx + 50 * c.s, c.y - 12, 60 * c.s, 34 * c.s, 0, 0, 7); ctx.fill(); }
}
function container(x, y, col, ang) { ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.fillStyle = col; rrect(-17, -7, 34, 14, 2); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 2; ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1; for (let i = -11; i < 17; i += 7) { ctx.beginPath(); ctx.moveTo(i, -5); ctx.lineTo(i, 5); ctx.stroke(); } ctx.restore(); }
function tank(x, y, r) { const g = ctx.createRadialGradient(x - r / 3, y - r / 3, 2, x, y, r); g.addColorStop(0, '#fff'); g.addColorStop(1, '#cfd6dd'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.strokeStyle = '#6b7a88'; ctx.lineWidth = 3; ctx.stroke(); ctx.beginPath(); ctx.arc(x, y, r * 0.55, 0, 7); ctx.stroke(); }
function crane(x, y, ang) { ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -46); ctx.lineTo(60, -46); ctx.stroke(); ctx.lineWidth = 2; ctx.strokeStyle = '#333'; ctx.beginPath(); ctx.moveTo(50, -46); ctx.lineTo(50, -20); ctx.stroke(); ctx.fillStyle = '#333'; ctx.fillRect(44, -22, 12, 6); ctx.fillStyle = '#e74c3c'; rrect(-10, -6, 20, 12, 3); ctx.fill(); ctx.restore(); }
function house(x, y, col, ang) { ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.fillStyle = col; rrect(-11, -9, 22, 18, 3); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = '#8b4513'; ctx.beginPath(); ctx.moveTo(-13, -7); ctx.lineTo(0, -18); ctx.lineTo(13, -7); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#9fd6ff'; ctx.fillRect(-7, -3, 5, 5); ctx.fillRect(2, -3, 5, 5); ctx.restore(); }
function tree(x, y) { ctx.fillStyle = '#8b4513'; ctx.fillRect(x - 2, y, 4, 10); ctx.fillStyle = '#2e8b57'; ctx.beginPath(); ctx.arc(x, y - 4, 9, 0, 7); ctx.fill(); }
function block(x, y, col, w, h, ang) { ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.fillStyle = col; rrect(-w / 2, -h / 2, w, h, 3); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.35)'; for (let i = -w / 2 + 5; i < w / 2 - 4; i += 7) for (let j = -h / 2 + 5; j < h / 2 - 4; j += 7) ctx.fillRect(i, j, 3, 3); ctx.restore(); }
function tower(x, y, h, col) { ctx.fillStyle = 'rgba(0,30,60,.25)'; ctx.beginPath(); ctx.ellipse(x + 10, y + 8, 16, 8, 0, 0, 7); ctx.fill(); ctx.strokeStyle = col || '#e74c3c'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - h); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y - h * 0.7, 9, 0, 7); ctx.fill(); ctx.strokeStyle = '#555'; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = '#e74c3c'; ctx.beginPath(); ctx.arc(x, y - h, 4, 0, 7); ctx.fill(); }
function stadium(x, y) { ctx.save(); ctx.translate(x, y); ctx.rotate(TH); ctx.fillStyle = '#ddd'; ctx.beginPath(); ctx.ellipse(0, 0, 70, 48, 0, 0, 7); ctx.fill(); ctx.strokeStyle = '#555'; ctx.lineWidth = 3; ctx.stroke(); ctx.fillStyle = '#5fbf5f'; ctx.beginPath(); ctx.ellipse(0, 0, 46, 28, 0, 0, 7); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(-36, -20, 72, 40); ctx.beginPath(); ctx.moveTo(0, -20); ctx.lineTo(0, 20); ctx.stroke(); ctx.restore(); }
function drawBridges() { // brugdekken over het water, getekend boven de schepen
  for (const br of bridges) {
    const q = quad(br.s - 14, br.s + 14, br.n0, br.n1);
    ctx.globalAlpha = 0.92; path(q); ctx.fillStyle = '#9a9a9a'; ctx.fill(); ctx.strokeStyle = '#444'; ctx.lineWidth = 3; ctx.stroke();
    const a = sn2w(br.s, br.n0), b = sn2w(br.s, br.n1); ctx.strokeStyle = br.col || '#e74c3c'; ctx.lineWidth = 5; ctx.setLineDash([]); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.setLineDash([8, 8]); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.setLineDash([]);
    if (br.pylon !== undefined) { const p = sn2w(br.s, br.pylon); ctx.strokeStyle = '#eee'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(p.x, p.y + 10); ctx.lineTo(p.x - 20, p.y - 120); ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1; for (let i = 1; i <= 6; i++) { const e = sn2w(br.s, br.pylon + (br.n1 - br.pylon) * i / 7); ctx.beginPath(); ctx.moveTo(p.x - 20, p.y - 120); ctx.lineTo(e.x, e.y); ctx.stroke(); } }
    if (br.towers) for (const tn of br.towers) { const p = sn2w(br.s, tn); ctx.fillStyle = '#556'; ctx.fillRect(p.x - 8, p.y - 70, 16, 70); ctx.strokeStyle = '#223'; ctx.lineWidth = 2; ctx.strokeRect(p.x - 8, p.y - 70, 16, 70); }
    ctx.globalAlpha = 1;
    const c = sn2w(br.s, (br.n0 + br.n1) / 2); ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(TH + Math.PI / 2); ctx.fillStyle = '#fff'; ctx.font = 'bold 11px system-ui'; ctx.textAlign = 'center'; ctx.fillText(br.name, 0, -18); ctx.restore();
  }
}
function drawLand(t) {
  const vis = e => !(Math.max(e.p.x, e.q.x) < cam.x - 60 || Math.min(e.p.x, e.q.x) > cam.x + VW + 60 || Math.max(e.p.y, e.q.y) < cam.y - 60 || Math.min(e.p.y, e.q.y) > cam.y + VH + 60);
  // schuim langs oevers
  ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.setLineDash([10, 8]); ctx.lineDashOffset = -t * 16;
  ctx.beginPath(); for (const e of shore) if (vis(e)) { ctx.moveTo(e.p.x, e.p.y); ctx.lineTo(e.q.x, e.q.y); } ctx.stroke(); ctx.setLineDash([]);
  // omlijning (half onder de vulling)
  const green = k => k === 'north' || k === 'park';
  ctx.lineWidth = 8; ctx.beginPath(); for (const e of shore) if (vis(e) && !green(land[e.li].kind)) { ctx.moveTo(e.p.x, e.p.y); ctx.lineTo(e.q.x, e.q.y); } ctx.strokeStyle = '#6b5a4a'; ctx.stroke();
  ctx.beginPath(); for (const e of shore) if (vis(e) && green(land[e.li].kind)) { ctx.moveTo(e.p.x, e.p.y); ctx.lineTo(e.q.x, e.q.y); } ctx.strokeStyle = '#4e8a3a'; ctx.stroke();
  // vulling
  for (const l of land) { path(l.poly); ctx.fillStyle = l.col || (l.kind === 'north' ? '#9fd27a' : l.kind === 'dam' || l.kind === 'pillar' ? '#c9c9c9' : l.kind === 'city' ? '#e9dcc3' : l.kind === 'park' ? '#8fcf6f' : '#f0a24a'); ctx.fill(); }
  // kadestrook binnen de oever
  for (const l of land) { if (l.kind === 'pillar') continue; ctx.save(); path(l.poly); ctx.clip(); ctx.lineWidth = l.kind === 'island' ? 18 : 34; ctx.strokeStyle = green(l.kind) ? 'rgba(200,200,200,.75)' : 'rgba(190,190,195,.85)'; ctx.beginPath(); for (const e of shore) if (e.li === land.indexOf(l) && vis(e)) { ctx.moveTo(e.p.x, e.p.y); ctx.lineTo(e.q.x, e.q.y); } ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 2; ctx.setLineDash([14, 10]); ctx.beginPath(); for (const e of shore) if (e.li === land.indexOf(l) && vis(e)) { ctx.moveTo(e.p.x - e.nx * 12, e.p.y - e.ny * 12); ctx.lineTo(e.q.x - e.nx * 12, e.q.y - e.ny * 12); } ctx.stroke(); ctx.setLineDash([]); ctx.restore(); }
  // wegen
  ctx.lineCap = 'round'; for (const r of roads) { ctx.strokeStyle = r.col; ctx.lineWidth = r.w; ctx.beginPath(); r.pts.forEach((p, i) => { const q = sn2w(p[0], p[1]); i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y); }); ctx.stroke(); }
  // decor (alleen in beeld)
  for (const d of decor) {
    if (d.x < cam.x - 80 || d.x > cam.x + VW + 80 || d.y < cam.y - 80 || d.y > cam.y + VH + 80) continue;
    if (d.type === 'tank') tank(d.x, d.y, d.r); else if (d.type === 'container') container(d.x, d.y, d.col, TH); else if (d.type === 'crane') crane(d.x, d.y, d.ang); else if (d.type === 'house') house(d.x, d.y, d.col, TH); else if (d.type === 'block') block(d.x, d.y, d.col, d.w, d.h, TH); else if (d.type === 'tower') tower(d.x, d.y, d.h, d.col); else if (d.type === 'stadium') stadium(d.x, d.y); else tree(d.x, d.y);
  }
  // bolders
  ctx.fillStyle = '#2b2f3a';
  for (const e of shore) { if (!vis(e) || land[e.li].kind === 'pillar') continue; const len = Math.hypot(e.q.x - e.p.x, e.q.y - e.p.y); for (let k = 30; k < len - 20; k += 70) { const x = e.p.x + (e.q.x - e.p.x) * k / len - e.nx * 9, y = e.p.y + (e.q.y - e.p.y) * k / len - e.ny * 9; ctx.beginPath(); ctx.arc(x, y, 4.5, 0, 7); ctx.fill(); } }
  // labels
  ctx.font = 'bold 18px system-ui'; ctx.fillStyle = 'rgba(40,30,10,.8)';
  for (const l of land) if (l.label) { const c = l.poly.reduce((a, p) => ({ x: a.x + p.x / 4, y: a.y + p.y / 4 }), { x: 0, y: 0 }); ctx.save(); ctx.translate(c.x, c.y - (l.kind === 'dam' ? 14 : 0)); ctx.rotate(TH); ctx.textAlign = 'center'; ctx.fillText(l.label, 0, 0); ctx.restore(); }
  ctx.font = 'bold 14px system-ui'; ctx.fillStyle = 'rgba(255,255,255,.9)';
  for (const b of basins) { if (!b.name) continue; const ln = b.labelN !== undefined ? b.labelN : (b.n0 + b.n1) / 2; const c = sn2w((b.s0 + b.s1) / 2, ln); ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(TH + Math.PI / 2); ctx.textAlign = 'center'; ctx.fillText(b.name, 0, 0); ctx.restore(); }
  for (const lb of labels) { const c = sn2w(lb.s, lb.n); ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(TH + (lb.rot || 0)); ctx.font = `bold ${lb.size || 16}px system-ui`; ctx.fillStyle = lb.col || 'rgba(255,255,255,.8)'; ctx.textAlign = 'center'; ctx.fillText(tr(lb.text), 0, 0); ctx.restore(); }
  // terminal
  for (const w of waits) { // wachtplaats: blauw vak + E.5-bord (witte P op blauw)
    ctx.fillStyle = 'rgba(52,120,220,.22)'; path(quad(w.s0, w.s1, w.n0, w.n1)); ctx.fill(); ctx.strokeStyle = '#4aa3ff'; ctx.lineWidth = 3; ctx.setLineDash([10, 7]); ctx.stroke(); ctx.setLineDash([]);
    const along = (w.n1 - w.n0) > (w.s1 - w.s0), sc = sn2w(along ? (Math.abs(w.s0) < Math.abs(w.s1) ? w.s0 : w.s1) : (w.s0 + w.s1) / 2, along ? (w.n0 + w.n1) / 2 : (Math.abs(w.n0) > Math.abs(w.n1) ? w.n0 : w.n1));
    const lc = sn2w((w.s0 + w.s1) / 2, (w.n0 + w.n1) / 2);
    for (const off of [-0.3, 0.3]) { const p = along ? sn2w((Math.abs(w.s1) > Math.abs(w.s0) ? w.s1 : w.s0) + Math.sign(w.s1 - w.s0) * 8, w.n0 + (w.n1 - w.n0) * (0.5 + off)) : sn2w(w.s0 + (w.s1 - w.s0) * (0.5 + off), (Math.abs(w.n0) > Math.abs(w.n1) ? w.n0 : w.n1) + Math.sign(w.n0 || 1) * 10);
      ctx.fillStyle = '#1d5fc4'; rrect(p.x - 11, p.y - 11, 22, 22, 3); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = '#fff'; ctx.font = 'bold 15px system-ui'; ctx.textAlign = 'center'; ctx.fillText('P', p.x, p.y + 5); ctx.textAlign = 'left'; }
    ctx.save(); ctx.translate(lc.x, lc.y); ctx.rotate(along ? TH + Math.PI / 2 : TH); ctx.fillStyle = 'rgba(200,225,255,.95)'; ctx.font = 'bold 13px system-ui'; ctx.textAlign = 'center'; ctx.fillText('💾 ' + w.name, 0, 4); ctx.restore();
  }
  for (const tm of terminals) { const act = tm === terminal && state.phase === 'load';
    ctx.fillStyle = act ? 'rgba(255,220,60,.5)' : 'rgba(255,220,60,.15)'; path(quad(tm.s0, tm.s1, tm.n0, tm.n1)); ctx.fill();
    ctx.strokeStyle = '#ffd54a'; ctx.lineWidth = 3; ctx.setLineDash([10, 7]); ctx.stroke(); ctx.setLineDash([]);
    const tc = sn2w((tm.s0 + tm.s1) / 2, (tm.n0 + tm.n1) / 2); ctx.save(); ctx.translate(tc.x, tc.y); ctx.rotate(tm.s1 - tm.s0 > tm.n1 - tm.n0 ? TH : TH + Math.PI / 2); ctx.fillStyle = act ? '#2b2f3a' : 'rgba(43,47,58,.6)'; ctx.font = 'bold 14px system-ui'; ctx.textAlign = 'center'; ctx.fillText('⛽ ' + tm.name.toUpperCase() + (act ? ' ◀ ' + tr('HIER') : ''), 0, 0); ctx.restore(); }
  // langszijzone
  if (state.phase !== 'done') { ctx.fillStyle = state.phase === 'sail' ? 'rgba(80,220,120,.42)' : 'rgba(80,220,120,.14)'; path(quad(dock.s0, dock.s1, dock.n0, dock.n1)); ctx.fill();
  ctx.strokeStyle = '#5ee88a'; ctx.lineWidth = 3; ctx.setLineDash([10, 7]); ctx.stroke(); ctx.setLineDash([]); }
}
// ---------- golven ----------
const trails = new Map(); // object -> [{x,y,t}]
function pushTrail(key, x, y, t, moving) {
  let tr = trails.get(key); if (!tr) { tr = []; trails.set(key, tr); }
  const last = tr[tr.length - 1];
  if (moving && (!last || Math.hypot(last.x - x, last.y - y) > 6)) tr.push({ x, y, t });
  while (tr.length && t - tr[0].t > 7) tr.shift();
  if (tr.length > 90) tr.shift();
  return tr;
}
function drawTrailWake(tr, t, beam, speedK) { // schuimbaan die de gevaren koers volgt
  if (tr.length < 2) return;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (let i = 1; i < tr.length; i++) {
    const age = t - tr[i].t, k = Math.max(0, 1 - age / 7);
    ctx.strokeStyle = `rgba(255,255,255,${0.06 + 0.3 * k * speedK})`; ctx.lineWidth = beam * (0.6 + (1 - k) * 2.2);
    ctx.beginPath(); ctx.moveTo(tr[i - 1].x, tr[i - 1].y); ctx.lineTo(tr[i].x, tr[i].y); ctx.stroke();
  }
  // lichte kern
  ctx.strokeStyle = `rgba(255,255,255,${0.25 * speedK})`; ctx.lineWidth = beam * 0.35; ctx.beginPath();
  for (let i = Math.max(0, tr.length - 25); i < tr.length; i++) { const p = tr[i]; i === 0 || i === Math.max(0, tr.length - 25) ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y); } ctx.stroke();
}
function drawKelvin(x, y, hdg, len, speedK) { // twee uitwaaierende golflijnen vanaf het hek
  if (speedK <= 0.05) return;
  const a = 19.5 * Math.PI / 180, L = len * (0.8 + speedK * 1.6);
  for (const s of [-1, 1]) {
    const dir = hdg + Math.PI + s * a; const ex = x + Math.cos(dir) * L, ey = y + Math.sin(dir) * L;
    const g = ctx.createLinearGradient(x, y, ex, ey); g.addColorStop(0, `rgba(255,255,255,${0.55 * speedK})`); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.strokeStyle = g; ctx.lineWidth = 2.5; ctx.setLineDash([6, 9]); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ex, ey); ctx.stroke(); ctx.setLineDash([]);
  }
}
function drawBowWave(L, Bw, speedK, t) { // in lichaamsframe: schuimkraag aan de boeg
  if (speedK <= 0.05) return;
  const k = speedK;
  ctx.lineCap = 'round';
  for (const s of [-1, 1]) {
    // buitenste golf (dun, lang) en binnenste schuim (dik, kort)
    ctx.strokeStyle = `rgba(255,255,255,${0.35 + 0.35 * k})`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(L / 2 + 4, 0); ctx.quadraticCurveTo(L / 2 - 6, s * (Bw / 2 + 4), L / 2 - 36 - 50 * k, s * (Bw / 2 + 14 + 26 * k)); ctx.stroke();
    ctx.strokeStyle = `rgba(255,255,255,${0.5 + 0.4 * k})`; ctx.lineWidth = 3 + 5 * k;
    ctx.beginPath(); ctx.moveTo(L / 2 + 1, s * 1); ctx.quadraticCurveTo(L / 2 - 8, s * (Bw / 2 + 2), L / 2 - 22 - 14 * k, s * (Bw / 2 + 5 + 6 * k)); ctx.stroke();
    // spatjes
    ctx.fillStyle = `rgba(255,255,255,${0.5 + 0.4 * k})`;
    for (let i = 0; i < 4; i++) { const ph = (t * 2.5 + i * 0.25) % 1; ctx.beginPath(); ctx.arc(L / 2 - 2 - ph * (24 + 30 * k), s * (Bw / 2 + 3 + ph * (6 + 14 * k)), 1 + (1 - ph) * 2.5 * k + 0.5, 0, 7); ctx.fill(); }
  }
  // witte neus
  ctx.fillStyle = `rgba(255,255,255,${0.5 * k})`; ctx.beginPath(); ctx.ellipse(L / 2 + 4, 0, 5 + 4 * k, 3 + 3 * k, 0, 0, 7); ctx.fill();
}
function drawShip(sh, t, active) {
  const w = sh.len, h = SH;
  ctx.save(); ctx.translate(sh.cx, sh.cy); ctx.rotate(sh.hdg);
  const hull = () => { ctx.beginPath(); ctx.moveTo(-w / 2 + 6, -h / 2); ctx.lineTo(w / 2 - 50, -h / 2); ctx.quadraticCurveTo(w / 2 + 14, 0, w / 2 - 50, h / 2); ctx.lineTo(-w / 2 + 6, h / 2); ctx.quadraticCurveTo(-w / 2 - 4, 0, -w / 2 + 6, -h / 2); ctx.closePath(); };
  if (sh.v) { // boeggolf + kielzog voor varende schepen (rechte baan)
    const k = Math.min(1, Math.abs(sh.v) / 6);
    const g = ctx.createLinearGradient(-w / 2, 0, -w / 2 - 160 - 200 * k, 0); g.addColorStop(0, `rgba(255,255,255,${0.35 + 0.3 * k})`); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-w / 2 + 10, -h * 0.3); ctx.lineTo(-w / 2 - 160 - 200 * k, -h * 1.1); ctx.lineTo(-w / 2 - 160 - 200 * k, h * 1.1); ctx.lineTo(-w / 2 + 10, h * 0.3); ctx.closePath(); ctx.fill();
    drawBowWave(w, h, k, t);
  }
  ctx.save(); ctx.translate(5, 7); ctx.fillStyle = 'rgba(0,30,60,.3)'; hull(); ctx.fill(); ctx.restore();
  ctx.fillStyle = sh.col; hull(); ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.stroke();
  ctx.fillStyle = '#f7f1dc'; rrect(-w / 2 + 60, -h / 2 + 7, w - 120, h - 14, 4); ctx.fill();
  const nh = Math.floor((w - 130) / 40);
  for (let i = 0; i < nh; i++) { ctx.fillStyle = '#4a7bd0'; rrect(-w / 2 + 68 + i * 40, -h / 2 + 12, 32, h - 24, 3); ctx.fill(); ctx.strokeStyle = '#2b4f8f'; ctx.lineWidth = 2; ctx.stroke(); }
  ctx.fillStyle = '#fff'; rrect(-w / 2 + 14, -h / 2 + 5, 42, h - 10, 4); ctx.fill(); ctx.strokeStyle = '#8a95a3'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = '#9fd6ff'; for (let i = 0; i < 3; i++) ctx.fillRect(-w / 2 + 20 + i * 11, -h / 2 + 10, 7, 7);
  ctx.fillStyle = '#ffcc33'; ctx.beginPath(); ctx.arc(-w / 2 + 35, h / 2 - 12, 6, 0, 7); ctx.fill();
  // voordek: ankerlier en luik
  ctx.fillStyle = '#f7f1dc'; rrect(w / 2 - 44, -h / 2 + 8, 30, h - 16, 6); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = '#555'; ctx.beginPath(); ctx.arc(w / 2 - 30, -7, 3, 0, 7); ctx.arc(w / 2 - 30, 7, 3, 0, 7); ctx.fill();
  ctx.fillStyle = active ? '#ffd54a' : '#fff'; ctx.font = (active ? 'bold 14px' : 'bold 12px') + ' system-ui'; ctx.textAlign = 'left'; ctx.fillText(sh.name + (active ? '  ◀ ' + tr('HIER') : ''), -w / 2 + 66, h / 2 + 16);
  ctx.restore();
  if (sh.v) { const k = Math.min(1, Math.abs(sh.v) / 6); drawKelvin(sh.cx - Math.cos(sh.hdg) * w / 2, sh.cy - Math.sin(sh.hdg) * w / 2, sh.hdg, w * 0.8, k); }
}
function drawDockHelper() {
  if (state.phase !== 'sail' || !state.inZone) return;
  const b = boat, cx = VW / 2, cy = VH / 2 - 120;
  ctx.fillStyle = 'rgba(0,0,0,.55)'; rrect(cx - 150, cy - 34, 300, 82, 12); ctx.fill();
  const err = state.hdgErr * 180 / Math.PI;
  // welke kant draaien: teken van hoekverschil t.o.v. dichtstbijzijnde parallelle richting
  let dd = b.hdg - ship.hdg; dd = Math.atan2(Math.sin(dd), Math.cos(dd)); if (Math.abs(dd) > Math.PI / 2) dd -= Math.sign(dd) * Math.PI;
  const sp = Math.hypot(b.vx, b.vy) * 3.6;
  ctx.font = 'bold 14px system-ui'; ctx.textAlign = 'center';
  ctx.fillStyle = err < 10 ? '#5ee88a' : '#ffd54a'; ctx.fillText(tf('Koers {0}° {1}', err.toFixed(0), err < 2 ? '✓' : tr(dd > 0 ? '→ draai BB' : '→ draai SB')), cx, cy - 8);
  const okM = sp < MOOR_KMH && err < 20; const cs = Math.hypot(currentAt(b.x, b.y).vx, currentAt(b.x, b.y).vy);
  ctx.fillStyle = sp < MOOR_KMH ? '#5ee88a' : '#ff8a5a'; ctx.fillText(tf('Vaart {0} km/h {1}', sp.toFixed(1), tr(okM ? '✓  →  M = vast' : sp < MOOR_KMH ? '✓' : '→ afremmen')), cx, cy + 16);
  if (!okM && cs > 0.8) { ctx.fillStyle = '#9fd6ff'; ctx.font = '12px system-ui'; ctx.fillText(tr('Tip: kop tegen de stroom in, machine bij tot je stil ligt'), cx, cy + 38); }
}
function drawMooring() {
  if (!moored) return;
  ctx.strokeStyle = '#f5e6c8'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  for (const ln of moored.lines) { const mx = (ln.a.x + ln.b.x) / 2, my = (ln.a.y + ln.b.y) / 2 + 6; ctx.beginPath(); ctx.moveTo(ln.a.x, ln.a.y); ctx.quadraticCurveTo(mx, my, ln.b.x, ln.b.y); ctx.stroke(); ctx.fillStyle = '#2b2f3a'; ctx.beginPath(); ctx.arc(ln.b.x, ln.b.y, 4, 0, 7); ctx.fill(); }
}
// tankbunkerschip van bovenaf: fenders, ladingtanks met domes, manifold midscheeps, stuurhuis en accommodatie achter
function drawTankerBody(L, Bw, hullCol, fill, bowActive) {
  ctx.fillStyle = '#ff8a2a'; for (let x = -L / 2 + 14; x < L / 2 - 22; x += 15) { ctx.beginPath(); ctx.arc(x, -Bw / 2, 3, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(x, Bw / 2, 3, 0, 7); ctx.fill(); }
  ctx.strokeStyle = bowActive ? '#fff' : 'rgba(255,255,255,.35)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(L / 2 - 18, -Bw / 2 + 1); ctx.lineTo(L / 2 - 18, Bw / 2 - 1); ctx.stroke();
  const d0 = -L / 2 + 34, d1 = L / 2 - 26; // ladingdek tussen accommodatie en voorpiek
  ctx.fillStyle = '#c0392b'; rrect(d0, -Bw / 2 + 3, d1 - d0, Bw - 6, 3); ctx.fill(); // rood dek
  ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(d0 + 4, 0); ctx.lineTo(d1 - 4, 0); ctx.stroke(); // loopbrug / leidingen
  const nT = Math.max(2, Math.floor((d1 - d0 - 8) / 26)), tw = (d1 - d0 - 8) / nT;
  for (let i = 0; i < nT; i++) { const x = d0 + 4 + i * tw + tw / 2, r = Math.min(Bw / 2 - 4, tw / 2 - 3); // tankdomes, gevuld naar lading
    ctx.fillStyle = '#ecf0f1'; ctx.beginPath(); ctx.arc(x, 0, r, 0, 7); ctx.fill(); ctx.strokeStyle = '#7f8c8d'; ctx.lineWidth = 1.2; ctx.stroke();
    if (fill > 0.01) { ctx.save(); ctx.beginPath(); ctx.arc(x, 0, r - 1.5, 0, 7); ctx.clip(); ctx.fillStyle = '#e67e22'; ctx.fillRect(x - r, r - 2 * r * fill, 2 * r, 2 * r * fill); ctx.restore(); } }
  const mx = (d0 + d1) / 2; ctx.fillStyle = '#f1c40f'; ctx.fillRect(mx - 3, -Bw / 2 + 2, 6, Bw - 4); // manifold (bunkeraansluiting)
  ctx.fillStyle = '#fff'; rrect(-L / 2 + 6, -Bw / 2 + 2, 26, Bw - 4, 3); ctx.fill(); ctx.strokeStyle = '#8a95a3'; ctx.lineWidth = 1.5; ctx.stroke(); // accommodatie
  ctx.fillStyle = '#fff'; rrect(-L / 2 + 18, -Bw / 2 - 1, 11, Bw + 2, 2); ctx.fill(); ctx.strokeStyle = '#556'; ctx.lineWidth = 1.2; ctx.stroke(); // stuurhuis (breed)
  ctx.fillStyle = '#7dd3fc'; ctx.fillRect(-L / 2 + 26, -Bw / 2, 2.5, Bw);
  ctx.fillStyle = '#ffcc33'; ctx.beginPath(); ctx.arc(-L / 2 + 11, 0, 2.5, 0, 7); ctx.fill();
}
function driftInfo() { // drift = verschil tussen kop (heading) en koers over de grond (COG)
  const b = boat, sp = Math.hypot(b.vx, b.vy); if (sp < 0.4) return null;
  const cog = Math.atan2(b.vy, b.vx), d = Math.atan2(Math.sin(cog - b.hdg), Math.cos(cog - b.hdg));
  if (Math.abs(d) > 2.6) return null; // achteruit varen: geen driftlijnen
  return { cog, deg: d * 180 / Math.PI, sp };
}
function drawDriftLines() { // ECDIS-achtig: doorgetrokken = kop, gestippeld = koers over de grond; alleen bij drift > 3°
  const di = driftInfo(); if (!di || Math.abs(di.deg) < 3) return;
  const b = boat, Lh = toPx(b.L) / 2, len = 80 + di.sp * 25, a = Math.min(0.75, 0.25 + Math.abs(di.deg) / 30);
  const bx = b.x + Math.cos(b.hdg) * Lh, by = b.y + Math.sin(b.hdg) * Lh;
  ctx.lineCap = 'round'; ctx.strokeStyle = `rgba(255,255,255,${a})`; ctx.lineWidth = 2; ctx.setLineDash([]);
  ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + Math.cos(b.hdg) * len, by + Math.sin(b.hdg) * len); ctx.stroke();
  ctx.strokeStyle = `rgba(255,213,74,${a})`; ctx.setLineDash([7, 6]);
  ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x + Math.cos(di.cog) * (len + Lh), b.y + Math.sin(di.cog) * (len + Lh)); ctx.stroke(); ctx.setLineDash([]);
}
function drawBoat(t) {
  const b = boat, L = toPx(b.L), Bw = toPx(b.B);
  drawDriftLines();
  const sp = Math.hypot(b.vx, b.vy);
  { const c0 = currentAt(b.x, b.y); const uw = Math.hypot(b.vx - c0.vx, b.vy - c0.vy); const kk = Math.min(1, uw / 6);
    const sx = b.x - Math.cos(b.hdg) * L / 2, sy = b.y - Math.sin(b.hdg) * L / 2;
    const trl = pushTrail('boat', sx, sy, t, uw > 0.3 && state.phase !== 'sunk'); drawTrailWake(trl, t, Bw, kk); drawKelvin(sx, sy, b.hdg, L, kk); }
  ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.hdg);
  if (state.phase === 'sunk') { const k = Math.min(1, state.sinkT / 4); ctx.rotate(k * 0.5); ctx.scale(1 - k * 0.6, 1 - k * 0.6); ctx.globalAlpha = 1 - k * 0.85;
    ctx.fillStyle = 'rgba(255,255,255,.8)'; for (let i = 0; i < 10; i++) { const ph = (t * 0.8 + i * 0.1) % 1; ctx.beginPath(); ctx.arc((i - 5) * 9, -ph * 50, 2 + ph * 5, 0, 7); ctx.fill(); } }
  const hull = () => { ctx.beginPath(); ctx.moveTo(-L / 2 + 4, -Bw / 2); ctx.lineTo(L / 2 - 16, -Bw / 2); ctx.quadraticCurveTo(L / 2 + 6, 0, L / 2 - 16, Bw / 2); ctx.lineTo(-L / 2 + 4, Bw / 2); ctx.quadraticCurveTo(-L / 2 - 3, 0, -L / 2 + 4, -Bw / 2); ctx.closePath(); };
  if (Math.abs(b.tele) > 0.05) { ctx.fillStyle = 'rgba(255,255,255,.5)'; const dir = b.tele > 0 ? -1 : 1; for (let i = 0; i < 4; i++) { const ph = (t * 6 + i) % 1; ctx.beginPath(); ctx.arc(-L / 2 + dir * (6 + ph * 40 * Math.abs(b.tele)), Math.sin(i * 2.1) * 4, 2 + ph * 3, 0, 7); ctx.fill(); } }
  const cos = Math.cos(b.hdg), sin = Math.sin(b.hdg); const c = currentAt(b.x, b.y);
  const u = (b.vx - c.vx) * cos + (b.vy - c.vy) * sin;
  if (u > 0.4) drawBowWave(L, Bw, Math.min(1, u / 6), t);
  { // schuim aan de drukzijde: romp wordt dwars door het water geduwd (stroming, bocht, boegschroef)
    const v = -(b.vx - c.vx) * sin + (b.vy - c.vy) * cos; // dwarssnelheid door het water, + = naar stuurboord
    const k = Math.min(1, Math.abs(v) / 1.2);
    if (k > 0.08) { const sd = Math.sign(v); ctx.strokeStyle = `rgba(255,255,255,${0.25 + 0.5 * k})`; ctx.lineWidth = 2 + 3 * k; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-L / 2 + 10, sd * (Bw / 2 + 2 + 2 * k)); ctx.lineTo(L / 2 - 22, sd * (Bw / 2 + 2 + 2 * k)); ctx.stroke();
      ctx.fillStyle = `rgba(255,255,255,${0.35 + 0.4 * k})`; for (let i = 0; i < 6; i++) { const ph = (t * 1.5 + i / 6) % 1; ctx.beginPath(); ctx.arc(-L / 2 + 14 + ph * (L - 40), sd * (Bw / 2 + 4 + 3 * k + Math.sin(i * 3.1 + t * 4) * 1.5), 1.5 + 1.5 * k, 0, 7); ctx.fill(); } }
  }
  if (b.bow !== 0) { const s = -b.bow; ctx.fillStyle = 'rgba(255,255,255,.75)'; for (let i = 0; i < 7; i++) { const ph = (t * 5 + i * 0.14) % 1; ctx.beginPath(); ctx.arc(L / 2 - 18 + Math.sin(i * 1.7) * 3, s * (Bw / 2 + 3 + ph * 26), 2 + ph * 4, 0, 7); ctx.fill(); } ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(L / 2 - 18, s * Bw / 2); ctx.lineTo(L / 2 - 18, s * (Bw / 2 + 28)); ctx.stroke(); }
  ctx.save(); ctx.translate(3, 5); ctx.fillStyle = 'rgba(0,30,60,.3)'; hull(); ctx.fill(); ctx.restore();
  ctx.save(); ctx.translate(-L / 2 + 2, 0); ctx.rotate(-b.rudder * 0.6); ctx.fillStyle = '#ff8a2a'; rrect(-16, -3.5, 16, 7, 3); ctx.fill(); ctx.strokeStyle = '#8a3d00'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
  ctx.fillStyle = '#34495e'; hull(); ctx.fill(); ctx.strokeStyle = '#1b2631'; ctx.lineWidth = 3.5; ctx.stroke();
  drawTankerBody(L, Bw, '#34495e', b.cargo / Math.max(1, b.target), b.bow !== 0);
  ctx.restore();
}
function drawInstruments() {
  const b = boat;
  const cx = VW / 2, cy = VH - (COMPACT ? 20 : 28), R = COMPACT ? 34 : 44;
  ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.beginPath(); ctx.arc(cx, cy, R + 8, Math.PI, 0); ctx.lineTo(cx + R + 8, cy + 14); ctx.lineTo(cx - R - 8, cy + 14); ctx.closePath(); ctx.fill();
  ctx.lineWidth = 8; ctx.strokeStyle = '#d33f3f'; ctx.beginPath(); ctx.arc(cx, cy, R, Math.PI, Math.PI * 1.5); ctx.stroke();
  ctx.strokeStyle = '#3cb043'; ctx.beginPath(); ctx.arc(cx, cy, R, Math.PI * 1.5, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
  for (let a = -35; a <= 35; a += 5) { const ang = -Math.PI / 2 + a / 35 * Math.PI / 2; const l = a % 35 === 0 ? 12 : a % 10 === 0 ? 8 : 4; ctx.beginPath(); ctx.moveTo(cx + Math.cos(ang) * (R - 6), cy + Math.sin(ang) * (R - 6)); ctx.lineTo(cx + Math.cos(ang) * (R - 6 - l), cy + Math.sin(ang) * (R - 6 - l)); ctx.stroke(); }
  const na = -Math.PI / 2 + b.rudderCmd * Math.PI / 2, ra = -Math.PI / 2 + b.rudder * Math.PI / 2;
  ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(na) * (R - 4), cy + Math.sin(na) * (R - 4)); ctx.stroke();
  ctx.strokeStyle = '#ffd54a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(ra) * (R - 10), cy + Math.sin(ra) * (R - 10)); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 12px system-ui'; ctx.textAlign = 'center';
  ctx.fillText(`${tr('ROER')} ${Math.abs(b.rudder) < 0.03 ? '0' : tr(b.rudder < 0 ? 'BB ' : 'SB ') + Math.round(Math.abs(b.rudder) * 35)}°`, cx, cy + 10);
  if (COMPACT) { // smalle telegraafbalk boven de ▲-knop
    const land = VH < 500, tw = 22;
    const th = land ? Math.max(55, Math.min(130, VH - 315)) : Math.max(50, Math.min(130, VH - 580));
    const tx = land ? 44 - tw / 2 : VW - 44 - tw / 2, ty = land ? VH - 160 - th : VH - 170 - th;
    ctx.fillStyle = 'rgba(0,0,0,.5)'; rrect(tx - 6, ty - 22, tw + 12, th + 30, 6); ctx.fill();
    const zero = ty + th / 1.6; ctx.fillStyle = '#3cb043'; ctx.fillRect(tx, ty, tw, zero - ty); ctx.fillStyle = '#d33f3f'; ctx.fillRect(tx, zero, tw, ty + th - zero);
    TELE.forEach(s => { const y = zero - s.v * (zero - ty); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(tx, y - 0.5, tw, 1); });
    const hy = zero - b.tele * (zero - ty); ctx.fillStyle = '#ffd54a'; ctx.fillRect(tx - 4, hy - 4, tw + 8, 8);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 10px system-ui'; ctx.textAlign = 'center'; ctx.fillText('⚙', tx + tw / 2, ty - 8); ctx.textAlign = 'left';
    return;
  }
  const tx = VW - 185, ty = VH - 170, th = 150, tw = 38;
  ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(tx - 10, ty - 10, tw + 135, th + 30);
  ctx.fillStyle = '#333'; ctx.fillRect(tx, ty, tw, th);
  const zero = ty + th * (1 / 1.6);
  ctx.fillStyle = '#3cb043'; ctx.fillRect(tx, ty, tw, zero - ty); ctx.fillStyle = '#d33f3f'; ctx.fillRect(tx, zero, tw, ty + th - zero);
  ctx.font = '10px system-ui'; ctx.textAlign = 'left';
  TELE.forEach(s => { const y = zero - s.v * (zero - ty); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(tx, y - 1, tw, 2); ctx.fillStyle = '#ddd'; ctx.fillText(tr(s.n), tx + tw + 6, y + 4); });
  const hy = zero - b.tele * (zero - ty);
  ctx.fillStyle = '#ffd54a'; ctx.fillRect(tx - 6, hy - 5, tw + 12, 10); ctx.fillStyle = '#222'; ctx.fillRect(tx - 6, hy - 1, tw + 12, 2);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 12px system-ui'; ctx.fillText(tr('TELEGRAAF'), tx - 4, ty - 2);
  ctx.textAlign = 'left';
}
let mapBig = false, miniRect = { x: 0, y: 0, w: 0, h: 0 };
function toggleBigMap() { mapBig = !mapBig; document.body.classList.toggle('bigmap', mapBig); }
cv.addEventListener('pointerdown', e => { const r = miniRect, x = e.clientX, y = e.clientY; if (mapBig || (x >= r.x - 8 && x <= r.x + r.w + 8 && y >= r.y - 8 && y <= r.y + r.h + 8)) { toggleBigMap(); e.preventDefault(); } });
function drawMinimap() {
  let mw = COMPACT ? 140 : 220, mh = Math.round(mw * H / W), mx = VW - mw - (COMPACT ? 8 : 12), my = COMPACT ? 56 : 12;
  if (mapBig) { mw = Math.min(VW * 0.94, (VH * 0.82) * W / H); mh = Math.round(mw * H / W); mx = (VW - mw) / 2; my = Math.max(COMPACT ? 54 : 20, (VH - mh) / 2 - 10); ctx.fillStyle = 'rgba(0,10,25,.55)'; ctx.fillRect(0, 0, VW, VH); }
  const k = mw / W; miniRect = { x: mx, y: my, w: mw, h: mh };
  ctx.fillStyle = 'rgba(0,0,0,.5)'; rrect(mx - 6, my - 6, mw + 12, mh + 12, 8); ctx.fill();
  ctx.fillStyle = '#2a7fb8'; ctx.fillRect(mx, my, mw, mh);
  ctx.save(); ctx.beginPath(); ctx.rect(mx, my, mw, mh); ctx.clip(); ctx.translate(mx, my); ctx.scale(k, k);
  for (const l of land) { path(l.poly); ctx.fillStyle = l.col || (l.kind === 'north' || l.kind === 'park' ? '#9fd27a' : l.kind === 'city' || l.kind === 'island' ? '#e9dcc3' : l.kind === 'dam' || l.kind === 'pillar' ? '#ccc' : '#f0a24a'); ctx.fill(); }
  for (const w of waits) { ctx.fillStyle = '#4aa3ff'; path(quad(w.s0 - 30, w.s1 + 30, w.n0 - 30, w.n1 + 30)); ctx.fill(); }
  for (const tm of terminals) { ctx.fillStyle = tm === terminal ? '#ffd54a' : 'rgba(255,213,74,.4)'; path(quad(tm.s0 - 40, tm.s1 + 40, tm.n0 - 40, tm.n1 + 40)); ctx.fill(); }
  ctx.fillStyle = state.phase === 'load' ? '#5ee88a' : '#1bd35a'; path(quad(dock.s0 - 60, dock.s1 + 60, dock.n0 - 80, dock.n1 + 60)); ctx.fill();
  for (const b of berths) { ctx.fillStyle = b.col; path(b.quad); ctx.fill(); }
  for (const tr of traffic) { ctx.fillStyle = tr.col; path(tr.quad); ctx.fill(); }
  for (const r of rivals) if (r.mode !== 'sunk') { ctx.fillStyle = r.col; ctx.beginPath(); ctx.arc(r.x, r.y, mapBig ? 6 / k : 22, 0, 7); ctx.fill(); }
  // boot
  for (const br of bridges) { const a = sn2w(br.s, br.n0), c = sn2w(br.s, br.n1); ctx.strokeStyle = 'rgba(80,80,80,.9)'; ctx.lineWidth = 3 / k; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(c.x, c.y); ctx.stroke(); }
  ctx.fillStyle = '#fff'; ctx.save(); ctx.translate(boat.x, boat.y); ctx.rotate(boat.hdg); if (mapBig) ctx.scale(0.16 / k, 0.16 / k); ctx.beginPath(); ctx.moveTo(60, 0); ctx.lineTo(-40, -30); ctx.lineTo(-40, 30); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#000'; ctx.lineWidth = 8; ctx.stroke(); ctx.restore();
  // beeldkader
  ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 2 / k; ctx.strokeRect(cam.x, cam.y, VW / zoom, VH / zoom);
  ctx.restore();
  if (mapBig) { // namen op de grote kaart
    const P = (x, y) => ({ x: mx + x * k, y: my + y * k });
    const lab = (t, x, y, col, size, bold) => { const p = P(x, y); ctx.font = `${bold ? 'bold ' : ''}${size}px system-ui`; const hw = ctx.measureText(t).width / 2 + 3; p.x = Math.max(mx + hw, Math.min(mx + mw - hw, p.x)); p.y = Math.max(my + size + 2, Math.min(my + mh - 4, p.y)); ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(0,0,0,.65)'; ctx.strokeText(t, p.x, p.y); ctx.fillStyle = col; ctx.fillText(t, p.x, p.y); };
    const fs = Math.max(10, Math.min(14, mw / 70));
    const small = mw < 600; // op een smal (staand) scherm alleen de belangrijkste namen
    if (!small) for (const b of basins) if (b.name) { const c = sn2w((b.s0 + b.s1) / 2, (b.n0 + b.n1) / 2); lab(b.name, c.x, c.y, 'rgba(255,255,255,.75)', fs - 1); }
    if (!small) for (const l of land) if (l.label && l.kind !== 'dam') { const c = l.poly.reduce((a, p) => ({ x: a.x + p.x / 4, y: a.y + p.y / 4 }), { x: 0, y: 0 }); lab(l.label, c.x, c.y, 'rgba(60,40,20,.9)', fs, true); }
    for (const w of waits) { const c = sn2w((w.s0 + w.s1) / 2, (w.n0 + w.n1) / 2); lab('🅿️ ' + w.name, c.x, c.y, '#9fd0ff', fs - 1, true); }
    for (const tm of terminals) { if (small && !(tm === terminal && state.phase === 'load')) continue; const c = sn2w((tm.s0 + tm.s1) / 2, (tm.n0 + tm.n1) / 2); lab('⛽ ' + tm.name + (tm === terminal && state.phase === 'load' ? ' ◀' : ''), c.x, c.y, '#ffd54a', fs, true); }
    for (const b of berths) if (!small || (b === ship && state.phase !== 'done')) lab(b.name + (b === ship && state.phase !== 'done' ? ' ◀' : ''), b.cx, b.cy - 30, b === ship && state.phase !== 'done' ? '#5ee88a' : '#fff', fs - 1, b === ship);
    for (const r of rivals) if (r.mode !== 'sunk') lab(r.name, r.x, r.y - 40, r.col === '#8e44ad' ? '#d7a8f0' : '#ff9a8a', fs - 1, true);
    lab(lang === 'en' ? 'YOU' : 'JIJ', boat.x, boat.y - 45, '#fff', fs + 1, true);
    ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.font = `${fs}px system-ui`; ctx.textAlign = 'center'; ctx.fillText(tr('Tik / K om te sluiten'), mx + mw / 2, my + mh + 22); ctx.textAlign = 'left';
    return;
  }
  ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.font = 'bold 12px system-ui'; ctx.textAlign = 'right'; ctx.fillText('⤢', mx + mw - 3, my + 13); ctx.textAlign = 'left';
  // doelpijl
  const tgt = state.phase === 'load' ? sn2w((terminal.s0 + terminal.s1) / 2, (terminal.n0 + terminal.n1) / 2) : sn2w((dock.s0 + dock.s1) / 2, (dock.n0 + dock.n1) / 2);
  const ang = Math.atan2(tgt.y - boat.y, tgt.x - boat.x);
  ctx.save(); ctx.translate(mx + mw / 2 + (COMPACT ? 8 : 0), my + mh + (COMPACT ? 18 : 26)); ctx.fillStyle = '#fff'; ctx.font = (COMPACT ? 'bold 10px' : 'bold 12px') + ' system-ui'; ctx.textAlign = 'center';
  const dTxt = `${state.phase === 'load' ? terminal.name : ship.name} ${Math.round(Math.hypot(tgt.x - boat.x, tgt.y - boat.y) / SCALE)} m`; ctx.fillText(dTxt, 0, 4);
  ctx.translate(-ctx.measureText(dTxt).width / 2 - 12, 0); ctx.rotate(ang); ctx.fillStyle = '#ffd54a'; ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(-8, -7); ctx.lineTo(-8, 7); ctx.closePath(); ctx.fill(); ctx.restore();
}
function objective() {
  const b = boat, d = p => Math.round(Math.hypot(p.x - b.x, p.y - b.y) / SCALE);
  if (moored && moored.to === 'wait') return b.fatigue > 0 ? tf('😴 Rusten aan {0}… {1}%', moored.wait.name, Math.round(b.fatigue)) : tf('⚓ {0} · opgeslagen · M = los', moored.wait.name);
  switch (state.phase) {
    case 'load': return tf('→ Laden bij {0} · {1} m', terminal.name, d(sn2w((terminal.s0 + terminal.s1) / 2, (terminal.n0 + terminal.n1) / 2)));
    case 'sail': return state.inZone ? tf('→ Langszij {0}: vaart eruit, M = vast', ship.name) : tf('→ Naar {0} · {1} m', ship.name, d(sn2w((dock.s0 + dock.s1) / 2, (dock.n0 + dock.n1) / 2)));
    case 'bunker': return tf('⛽ Bunkeren… {0}%', Math.round(100 * (1 - b.cargo / Math.max(1, b.target))));
    case 'done': return tf('✅ Klus klaar! Volgende opdracht over {0} s (N = nu)', Math.max(0, Math.ceil(7 - (state.doneT || 0))));
    case 'sunk': return tr('🫧 Gezonken – nieuwe boot volgt');
  }
  return '';
}
function drawHUD() {
  const b = boat, sp = Math.hypot(b.vx, b.vy) * 3.6;
  const hdgDeg = Math.round(((((b.hdg * 180 / Math.PI) + 90) % 360) + 360) % 360);
  const rud = Math.abs(b.rudder) < 0.05 ? tr('midscheeps') : tr(b.rudder < 0 ? 'bakboord ' : 'stuurboord ') + Math.round(Math.abs(b.rudder) * 35) + '°';
  const c = currentAt(b.x, b.y); const cs = Math.hypot(c.vx, c.vy);
  const dmgCol = b.damage < 40 ? '#5ee88a' : b.damage < 75 ? '#ffd54a' : '#ff5a5a';
  const obj = `<div style="color:#ffd54a;font-weight:700;margin-bottom:2px">${objective()}</div>`;
  if (COMPACT) { hud.innerHTML = obj + `${moored ? '⚓ ' : ''}${warp === 2 ? '⏩ ' : ''}🪙 ${Math.round(career.gold)} · ${b.target} t → ${ship.name}<br>${sp.toFixed(1)} km/h · ${tr(TELE[b.teleIdx].n)} · ${tr('Roer')} ${Math.abs(b.rudder) < 0.05 ? '0' : (b.rudder < 0 ? tr('BB ') : tr('SB ')) + Math.round(Math.abs(b.rudder) * 35)}°<br>${tideInfo()} · ${tr('Lading')} ${Math.round(b.cargo)} t<br>${tr('Schade')} <span style="display:inline-block;width:60px;height:7px;background:#333;border-radius:4px;vertical-align:middle"><span style="display:block;width:${Math.min(100, b.damage)}%;height:100%;background:${dmgCol};border-radius:4px"></span></span> ${Math.round(b.damage)} · 😴 ${Math.round(b.fatigue)}%`; return; }
  hud.innerHTML = obj + `${moored ? `<span style="color:#ffd54a;font-weight:700">${tr('⚓ AFGEMEERD (M = los)')}</span><br>` : ''}${warp === 2 ? `<span style="color:#5ee88a;font-weight:700">${tr('⏩ SNELVAART 2×')}</span><br>` : ''}<b>🗺️</b> ${MAP.name} · <b>🪙 ${tr('Goud')}</b> ${Math.round(career.gold)} · <b>${tr('klussen')}</b> ${career.jobs}<br>${rivals.map(r => `<span style="color:${r.col}">●</span> ${r.name} ${Math.round(r.gold)} 🪙`).join(' · ')}<br><b>${tr('Opdracht')}</b> ${missionCount + 1}: ${b.target} t → ${ship.name}<br><b>${tr('Totaal')}</b> ${totalScore} pt<br><b>${tr('Vaart')}</b> ${sp.toFixed(1)} km/h<br><b>${tr('Koers')}</b> ${hdgDeg}°${(() => { const di = driftInfo(); return di && Math.abs(di.deg) >= 3 ? ` · <span style="color:#ffd54a">${tr('Drift')} ${Math.abs(Math.round(di.deg))}° ${di.deg > 0 ? tr('SB ').trim() : tr('BB ').trim()}</span>` : ''; })()}<br><b>${tr('Telegraaf')}</b> ${tr(TELE[b.teleIdx].n)}<br><b>${tr('Roer')}</b> ${rud}<br><b>${tr('Stroom')}</b> ${cs.toFixed(1)} m/s · <span style="color:${Math.abs(current.speed) > 2.5 ? '#ff8a5a' : '#fff'}">${tideInfo()}</span><br><b>${tr('Lading')}</b> ${Math.round(b.cargo)} t<br><b>${tr('Schade')}</b> <span style="display:inline-block;width:90px;height:9px;background:#333;border-radius:5px;vertical-align:middle"><span style="display:block;width:${Math.min(100, b.damage)}%;height:100%;background:${dmgCol};border-radius:5px"></span></span> ${Math.round(b.damage)}/100<br><b>${tr('Vermoeidheid')}</b> <span style="display:inline-block;width:90px;height:9px;background:#333;border-radius:5px;vertical-align:middle"><span style="display:block;width:${Math.round(b.fatigue)}%;height:100%;background:${b.fatigue < 60 ? '#7fb8ff' : b.fatigue < 90 ? '#ffd54a' : '#ff5a5a'};border-radius:5px"></span></span> ${Math.round(b.fatigue)}%<br><b>${tr('Tijd')}</b> ${Math.round(state.elapsed)} s<br><b>${tr('Beste score')}</b> ${bestScore}`;
}

let last = performance.now(), running = false;
// ---------- zoom ----------
let zoom = 1, zoomTarget = 1;
try { zoomTarget = zoom = Math.max(0.3, Math.min(2, +(localStorage.getItem('bunker_zoom2') || 0.75) || 0.75)); } catch (e) {}
function zoomMin() { return Math.max(0.3, VW / W, VH / H); }
function setZoom(z) { zoomTarget = Math.max(zoomMin(), Math.min(2, z)); try { localStorage.setItem('bunker_zoom2', zoomTarget.toFixed(2)); } catch (e) {} }
addEventListener('keydown', e => { if (e.key === '+' || e.key === '=') setZoom(zoomTarget * 1.15); if (e.key === '-' || e.key === '_') setZoom(zoomTarget / 1.15); if (e.key === '0') setZoom(0.75); });
cv.addEventListener('wheel', e => { e.preventDefault(); setZoom(zoomTarget * Math.exp(-e.deltaY * 0.0015)); }, { passive: false });
let pinch = null;
cv.addEventListener('touchstart', e => { if (e.touches.length === 2) { const [a, b] = e.touches; pinch = { d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), z: zoomTarget }; } }, { passive: true });
cv.addEventListener('touchmove', e => { if (pinch && e.touches.length === 2) { const [a, b] = e.touches; setZoom(pinch.z * Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) / pinch.d); } }, { passive: true });
cv.addEventListener('touchend', e => { if (e.touches.length < 2) pinch = null; }, { passive: true });
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now; const t = now / 1000;
  if (running && !paused) {
    // snelvaart automatisch uit bij aanleggen/laden of een klap
    // snelvaart automatisch uit, maar alleen op het moment dat je de zone/terminal binnenvaart of een klap krijgt (flank), niet continu
    const slowHere = (state.phase === 'sail' && state.inZone) || (state.phase === 'load' && inSN(boat, terminal)) || hitFlash > 0;
    if (slowHere && !state.slowWas && warp === 2) { warp = 1; say(tr('Snelvaart uit'), 1); }
    state.slowWas = slowHere;
    const sdt = dt * warp; tideUpdate(sdt); simClock += sdt;
    { const b = boat; // vermoeidheid: ±15 min varen tot vol; rusten aan een wachtplaats: ±20 s tot uitgerust
      if (moored && moored.to === 'wait') { const f0 = b.fatigue; b.fatigue = Math.max(0, b.fatigue - sdt * 5); if (f0 > 0 && b.fatigue === 0) { say(tr('😴 Uitgerust. M = los om verder te varen.'), 3); saveGame(moored.wait); } }
      else if (!moored && state.phase !== 'sunk') { const f0 = b.fatigue; b.fatigue = Math.min(100, b.fatigue + sdt * 100 / 1500); if (f0 < 80 && b.fatigue >= 80) say(tr('🥱 Je wordt moe – zoek een wachtplaats (blauwe P) om te rusten'), 5); if (f0 < 100 && b.fatigue >= 100) say(tr('😵 Oververmoeid: het roer reageert traag en onnauwkeurig!'), 5); } }
    if (state.phase !== 'sunk') input(dt); updateTraffic(sdt); updateRivals(sdt); for (let i = 0; i < TIME * warp; i++) physics(dt); logic(sdt);
  }
  shake = Math.max(0, shake - dt * 30); const sx = (Math.random() - 0.5) * shake, sy = (Math.random() - 0.5) * shake;
  // camera: boot + beetje vooruitkijken in vaarrichting; zoom = wereld-viewport VW/zoom × VH/zoom
  zoomTarget = Math.max(zoomMin(), zoomTarget); zoom += (zoomTarget - zoom) * Math.min(1, dt * 8);
  const SVW = VW, SVH = VH; VW = SVW / zoom; VH = SVH / zoom;
  const la = Math.min(60 + Math.hypot(boat.vx, boat.vy) * 14, Math.min(VW, VH) * 0.22); const lookX = boat.x + Math.cos(boat.hdg) * la, lookY = boat.y + Math.sin(boat.hdg) * la;
  const tx = Math.max(0, Math.min(W - VW, lookX - VW / 2)), ty = Math.max(0, Math.min(H - VH, lookY - VH / 2));
  cam.x += (tx - cam.x) * Math.min(1, dt * 6); cam.y += (ty - cam.y) * Math.min(1, dt * 6);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, SVW, SVH);
  ctx.save(); ctx.setTransform(zoom, 0, 0, zoom, -Math.round((cam.x + sx) * zoom), -Math.round((cam.y + sy) * zoom));
  drawWater(t); drawLand(t); for (const b of berths) drawShip(b, t, b === ship && state.phase !== 'done'); for (const tr of traffic) drawShip(tr, t, false); for (const r of rivals) drawRival(r, t); drawMooring(); drawBoat(t); drawBridges();
  ctx.restore();
  VW = SVW; VH = SVH;
  if (running && !paused) RADIO.tick(now / 1000, radioChatter, lang);
  { const c0 = currentAt(boat.x, boat.y); SND.update({ tele: boat.tele, speed: Math.hypot(boat.vx - c0.vx, boat.vy - c0.vy), bow: boat.bow, running: running && !paused && state.phase !== 'sunk' }); }
  if (hitFlash > 0) { ctx.fillStyle = `rgba(255,40,40,${hitFlash * 0.9})`; ctx.fillRect(0, 0, VW, VH); hitFlash -= dt; }
  drawInstruments(); if (!mapBig) drawMinimap(); drawDockHelper(); if (mapBig) drawMinimap(); drawHUD();
  requestAnimationFrame(frame);
}
// ---------- kaartkeuze ----------
function renderMapMenu() {
  const box = document.getElementById('mapList'); if (!box) return;
  let cur = null; try { cur = localStorage.getItem('bunker_map'); } catch (e) {}
  box.innerHTML = MAPS.map(m => `<div class="mapcard" data-id="${m.id}" style="border:3px solid ${(cur || MAPS[0].id) === m.id ? '#ff8a2a' : '#ddd'}"><div style="font-size:30px">${m.icon}</div><b>${m.name}</b><div style="font-size:12px;color:#555">${lang === 'en' ? m.desc.en : m.desc.nl}</div></div>`).join('');
  box.querySelectorAll('.mapcard').forEach(c => c.onclick = () => { try { localStorage.setItem('bunker_map', c.dataset.id); } catch (e) {} renderMapMenu(); });
}
function chosenMap() { let id = null; try { id = localStorage.getItem('bunker_map'); } catch (e) {} return MAPS.find(m => m.id === id) || MAPS[0]; }
function startGame() { SND.init(); RADIO.reset(); loadMap(chosenMap()); reset(); overlay.style.display = 'none'; running = true; paused = false; last = performance.now(); maybeRace(); }
function renderContinue() { const s = readSave(), btn = document.getElementById('cont'); if (!btn) return; if (!s) { btn.style.display = 'none'; return; } const m = MAPS.find(x => x.id === s.map), d = new Date(s.at);
  btn.style.display = ''; btn.innerHTML = `▶ ${tr('Verder varen')}<br><span style="font-size:11px;font-weight:400">${m.name} · ${s.wait || ''} · ${d.toLocaleDateString(lang === 'en' ? 'en-GB' : 'nl-NL')} ${d.toLocaleTimeString(lang === 'en' ? 'en-GB' : 'nl-NL', { hour: '2-digit', minute: '2-digit' })}</span>`; }
function openMenu() { running = false; renderMapMenu(); renderContinue(); overlay.style.display = 'flex'; }
renderMapMenu(); loadMap(chosenMap()); reset(); requestAnimationFrame(frame);
document.querySelectorAll('.langbtn').forEach(b => b.onclick = () => setLang(b.dataset.l));
applyLangHTML();
document.getElementById('start').onclick = startGame;
document.getElementById('cont').onclick = continueGame;
renderContinue();
// ---------- geluidsinstellingen ----------
const soundEl = document.getElementById('sound');
function renderSound() {
  const v = SND.vol;
  for (const k of ['master', 'sfx', 'music', 'radio']) { document.getElementById('v_' + k).value = v[k]; document.getElementById('t_' + k).textContent = v[k]; }
  document.getElementById('s_rmode').value = RADIO.mode; renderRadioStatus();
  document.getElementById('s_on').checked = !SND.muted; document.getElementById('s_music').checked = SND.musicOn; document.getElementById('s_radio').checked = RADIO.on;
}
function renderRadioStatus() {
  const s = RADIO.status(lang), en = lang === 'en';
  const txt = !s.speech ? (en ? 'Browser has no speech engine → radio babble' : 'Browser heeft geen spraak → radio-gebrabbel')
    : (en ? `Speech voices: ${s.voices} (Dutch ${s.nl}, English ${s.en})` : `Spraakstemmen: ${s.voices} (Nederlands ${s.nl}, Engels ${s.en})`) + (s.lastHow ? (en ? ` · last: ${s.lastHow}` : ` · laatst: ${s.lastHow}`) : '') + (s.lastErr ? (en ? ` · error: ${s.lastErr}` : ` · fout: ${s.lastErr}`) : '');
  document.getElementById('s_rstatus').textContent = txt;
}
let soundWasPaused = false;
function toggleSound() {
  SND.init();
  if (soundEl.style.display === 'flex') { soundEl.style.display = 'none'; paused = soundWasPaused; last = performance.now(); return; }
  renderSound(); soundEl.style.display = 'flex'; soundWasPaused = paused; paused = true;
}
for (const k of ['master', 'sfx', 'music', 'radio']) document.getElementById('v_' + k).addEventListener('input', e => { SND.init(); SND.setVol(k, +e.target.value); document.getElementById('t_' + k).textContent = e.target.value; });
document.getElementById('s_on').onchange = e => { SND.init(); SND.setMuted(!e.target.checked); if (!e.target.checked && 'speechSynthesis' in window) speechSynthesis.cancel(); };
document.getElementById('s_music').onchange = e => { SND.init(); SND.setMusic(e.target.checked); };
document.getElementById('s_radio').onchange = e => RADIO.set(e.target.checked);
document.getElementById('s_rmode').onchange = e => { RADIO.setMode(e.target.value); renderRadioStatus(); };
document.getElementById('s_rtest').onclick = () => { SND.init(); RADIO.test(lang); setTimeout(renderRadioStatus, 1800); setTimeout(renderRadioStatus, 4000); };
document.getElementById('soundClose').onclick = toggleSound;
document.getElementById('sndBtn').onclick = toggleSound;
document.getElementById('soundBtn2').onclick = () => { SND.init(); renderSound(); soundEl.style.display = 'flex'; soundWasPaused = paused; };
// ---------- winkel ----------
const shop = document.getElementById('shop');
function renderShop() {
  document.getElementById('shopGold').textContent = tf('🪙 {0} goud · {1} klussen gedaan', Math.round(career.gold), career.jobs);
  let html = '';
  for (const k in UPG) { const u = UPG[k], l = career.lvl[k], next = l + 1 < u.cost.length ? u.cost[l + 1] : null;
    html += `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-top:1px solid #eee"><div style="flex:1"><b>${tr(u.name)}</b> <span style="color:#888">${tf('niveau {0}/{1}', l + 1, u.cost.length)}</span><br><span style="font-size:13px">${tr(u.desc[l])}</span>${next !== null ? `<br><span style="font-size:13px;color:#555">${tf('Volgende: {0}', tr(u.desc[l + 1]))}</span>` : ''}</div>
      ${next !== null ? `<button data-k="${k}" ${career.gold < next ? 'disabled style="opacity:.4"' : ''} style="font-size:14px;padding:6px 12px;border:0;border-radius:999px;background:#2980b9;color:#fff;font-weight:700;cursor:pointer">${tf('Koop 🪙 {0}', next)}</button>` : '<span style="color:#27ae60;font-weight:700">MAX</span>'}</div>`; }
  document.getElementById('shopRows').innerHTML = html;
  document.querySelectorAll('#shopRows button').forEach(btn => btn.onclick = () => { const k = btn.dataset.k, c = UPG[k].cost[career.lvl[k] + 1]; if (career.gold >= c) { career.gold -= c; career.lvl[k]++; saveCareer(); renderShop(); } });
}
function toggleShop() {
  if (shop.style.display === 'flex') { shop.style.display = 'none'; paused = false; last = performance.now(); return; }
  const atTerminal = terminals.some(tm => inSN(boat, tm)) && Math.hypot(boat.vx, boat.vy) * 3.6 < 1.5;
  if (!atTerminal && state.phase !== 'done') { say(tr('Winkel alleen aan een terminal (stil liggen) of na een klus'), 2); return; }
  renderShop(); shop.style.display = 'flex'; paused = true;
}
document.getElementById('shopClose').onclick = toggleShop;
document.getElementById('shopReset').onclick = () => { if (shop.dataset.confirm === '1') { career = { gold: 300, lvl: { motor: 0, boeg: 0, tanks: 0, fender: 0, pomp: 0 }, jobs: 0 }; saveCareer(); rivals.forEach(r => { r.gold = 300; r.jobs = 0; }); saveRivals(); shop.dataset.confirm = '0'; renderShop(); } else { shop.dataset.confirm = '1'; document.getElementById('shopReset').textContent = tr('Zeker? Klik nogmaals'); setTimeout(() => { shop.dataset.confirm = '0'; document.getElementById('shopReset').textContent = tr('Carrière wissen'); }, 3000); } };
})();
