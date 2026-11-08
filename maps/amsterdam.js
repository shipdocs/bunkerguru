// Kaart: Amsterdam Westpoort – Noordzeekanaal van de Afrikahaven tot de Coenhaven, Zaandam aan de overkant
window.MAPS = window.MAPS || [];
MAPS.push({
  id: 'amsterdam', name: 'Amsterdam Westpoort', icon: '⚓',
  desc: { nl: 'Noordzeekanaal: Afrika-, Amerika-, West- en Petroleumhaven, Zaandam en de Hempont. Geen getij, wel veel zeevaart.', en: 'North Sea Canal: Afrika-, Amerika-, West- and Petroleumhaven, Zaandam and the Hem ferry. No tide, lots of seagoing traffic.' },
  TH: Math.atan2(120, 2400), ORG: { x: 420, y: 980 }, W: 5250, H: 2400, RIVER_HALF: 140, S_MIN: -300, S_MAX: 4700,
  radio: { sectors: ['Sector Westpoort', 'Sector IJmond', 'Post Zaandam'], places: ['de Afrikahaven', 'de Amerikahaven', 'de Westhaven', 'de Petroleumhaven', 'de Hempont', 'Zijkanaal G', 'de Coenhaven'], tugBasin: 'Amerikahaven' },
  K: 2, // ruimtefactor: alles 2× zo ruim, schepen even groot
  currentSpeed: 0.4, // kanaal: alleen spuistroom naar IJmuiden, geen getij
  tide: null,
  lanes: { down: -20, up: 15, mouth: 85 },
  i18n: {
    'westwand Afrikahaven': 'west wall of the Afrikahaven', 'oostwand Amerikahaven': 'east wall of the Amerikahaven', 'oostwand Westhaven': 'east wall of the Westhaven',
    'westwand Petroleumhaven': 'west wall of the Petroleumhaven', 'Zaandamse kade, noordoever': 'Zaandam quay, north bank', 'kade Hemhaven bij de Hembrug': 'Hemhaven quay near the Hembrug',
    'NOORDZEEKANAAL · spuistroom naar IJmuiden': 'NORTH SEA CANAL · drain current towards IJmuiden',
  },
  build({ quad, RIVER_HALF: RH, TH, cols }) {
    const S0 = -300, S1 = 4700;
    const sBasins = [
      { s0: 200, s1: 600, n0: RH, n1: 900, name: 'Afrikahaven', labelN: 560 },
      { s0: 900, s1: 1500, n0: RH, n1: 1100, name: 'Amerikahaven', labelN: 700 },
      { s0: 1900, s1: 2300, n0: RH, n1: 1000, name: 'Westhaven', labelN: 640 },
      { s0: 2600, s1: 2800, n0: RH, n1: 700, name: 'Petroleumhaven', labelN: 480 },
      { s0: 3000, s1: 3200, n0: RH, n1: 600, name: 'Jan van Riebeeckhaven', labelN: 420 },
      { s0: 3600, s1: 3800, n0: RH, n1: 520, name: 'Coenhaven', labelN: 380 },
      { s0: 4100, s1: 4300, n0: RH, n1: 500, name: 'Mercuriushaven', labelN: 370 },
    ];
    const nBasins = [
      { s0: 2000, s1: 2160, n0: -900, n1: -RH, name: 'Zijkanaal G · Zaandam', labelN: -560 },
      { s0: 3300, s1: 3500, n0: -450, n1: -RH, name: 'Hemhaven', labelN: -330 },
      { s0: 700, s1: 790, n0: -700, n1: -RH, name: 'Zijkanaal C · Nauerna', labelN: -480 },
    ];
    const land = [];
    const sPieces = [[S0, 200, 'tanks'], [600, 900, 'containers'], [1500, 1900, 'containers'], [2300, 2600, 'tanks'], [2800, 3000, 'tanks'], [3200, 3600, 'containers'], [3800, 4100, 'city'], [4300, S1, 'city']];
    for (const [a, b, k] of sPieces) land.push({ poly: quad(a, b, RH, 1100), kind: k });
    land.push({ poly: quad(S0, S1, 1100, 2200), kind: 'tanks' });
    const nPieces = [[S0, 700, 'north'], [790, 2000, 'north'], [2160, 3300, 'north'], [3500, S1, 'north']];
    for (const [a, b, k] of nPieces) land.push({ poly: quad(a, b, -900, -RH), kind: k });
    land.push({ poly: quad(S0, S1, -2100, -900), kind: 'north' });
    for (const b of sBasins) land.push({ poly: quad(b.s0, b.s1, b.n1, 2200), kind: 'tanks' });
    for (const b of nBasins) land.push({ poly: quad(b.s0, b.s1, -2100, b.n0), kind: 'north' });
    return {
      land, basins: sBasins.concat(nBasins),
      terminals: [
        { s0: 1900, s1: 1964, n0: 350, n1: 900, name: 'Terminal Westhaven' },
        { s0: 536, s1: 600, n0: 350, n1: 850, name: 'Terminal Afrikahaven' },
      ],
      berths: [
        { name: 'MT AFRIKA', col: '#e74c3c', axis: 'n', a0: 350, a1: 750, c: 200 + 28, side: +1, where: 'westwand Afrikahaven' },
        { name: 'MV AMERIKA', col: '#2c7fb8', axis: 'n', a0: 400, a1: 950, c: 1500 - 28, side: -1, where: 'oostwand Amerikahaven' },
        { name: 'MV WESTPOORT', col: '#27ae60', axis: 'n', a0: 300, a1: 800, c: 2300 - 28, side: -1, where: 'oostwand Westhaven' },
        { name: 'MT PETROLEUM', col: '#f39c12', axis: 'n', a0: 250, a1: 600, c: 2600 + 28, side: +1, where: 'westwand Petroleumhaven' },
        { name: 'MV ZAANDAM', col: '#8e44ad', axis: 's', a0: 2500, a1: 2900, c: -RH + 28, side: +1, where: 'Zaandamse kade, noordoever' },
        { name: 'MS HEMBRUG', col: '#c0392b', axis: 'n', a0: -420, a1: -190, c: 3300 + 28, side: +1, where: 'kade Hemhaven bij de Hembrug' },
      ],
      traffic: [
        { name: 'MV TRAAG', col: '#16a085', s: 4500, n: -60, v: -3.5, len: 280 },
        { name: 'MS IJMOND', col: '#d35400', s: -200, n: 50, v: 3.0, len: 320 },
        { name: 'MV DRUK', col: '#7f8c8d', s: 1500, n: -60, v: -3.0, len: 200 },
        { name: 'SLB TITAN', col: '#2c3e50', s: 1200, n: 900, v: -4.5, len: 90, axis: 'n', nMin: RH + 100, nMax: 1050 },
      ],
      waits: [
        { name: 'Wachtplaats Amerikahaven', yard: true, s0: 900, s1: 962, n0: 400, n1: 1000 },
        { name: 'Wachtplaats Hempont', s0: 3700, s1: 4000, n0: -RH + 10, n1: -RH + 44 },
      ],
      rivals: [{ s: 1250, n: 600, hdgOff: -Math.PI / 2 }, { s: 2100, n: 500, hdgOff: -Math.PI / 2 }],
      start: { s: 931, n: 700, hdgOff: -Math.PI / 2 },
      roads: [
        { pts: [[S0, 1180], [S1, 1180]], col: '#e74c3c', w: 6 },
        { pts: [[1700, 1100], [1700, 2200]], col: '#f1c40f', w: 5 },
        { pts: [[S0, -980], [S1, -980]], col: '#f1c40f', w: 5 },
        { pts: [[3400, -1000], [3400, -RH]], col: '#888', w: 5 },
      ],
      labels: [
        { s: 2300, n: -1300, text: 'ZAANDAM', size: 24, col: 'rgba(30,60,30,.75)' },
        { s: 1200, n: 1600, text: 'WESTPOORT', size: 24, col: 'rgba(60,40,20,.7)' },
        { s: 4000, n: 800, text: 'SLOTERDIJK', size: 16, col: 'rgba(60,40,20,.7)' },
        { s: 3400, n: -520, text: 'Hembrug', size: 11, col: 'rgba(30,60,30,.8)' },
        { s: 1000, n: 0, text: 'NOORDZEEKANAAL · spuistroom naar IJmuiden', size: 16, col: 'rgba(255,255,255,.75)' },
        { s: 2900, n: 880, text: 'Hemweg-centrale', size: 11, col: 'rgba(60,40,20,.8)' },
      ],
      decor(add, rnd) {
        const inBasin = (s, n) => sBasins.concat(nBasins).some(b => s > b.s0 - 45 && s < b.s1 + 45 && n > b.n0 - 45 && n < b.n1 + 45);
        const beige = ['#f3e7d3', '#e7d7bd', '#f7f1e3', '#dcc9a8'], green = ['#3f7d3a', '#4e8a3a', '#5a9a46'];
        // tankparken Afrikahaven / Petroleumhaven
        for (let s = S0 + 40; s < 190; s += 64) for (let n = RH + 90; n < 1050; n += 64) if (rnd() > 0.3) add('tank', s + rnd() * 8, n + rnd() * 8, { r: 16 + rnd() * 8 });
        for (let s = 2340; s < 2570; s += 64) for (let n = RH + 90; n < 1050; n += 64) if (rnd() > 0.3) add('tank', s, n, { r: 16 + rnd() * 8 });
        for (let s = 2830; s < 2980; s += 60) for (let n = RH + 90; n < 1050; n += 60) if (rnd() > 0.3 && !(n > 680 && n < 860)) add('tank', s, n, { r: 14 + rnd() * 8 });
        // containerterminals
        for (let s = 640; s < 870; s += 44) for (let n = RH + 70; n < 1060; n += 26) if (rnd() > 0.4) add('container', s, n, { col: cols[Math.floor(rnd() * 5)] });
        for (let s = 1540; s < 1870; s += 44) for (let n = RH + 70; n < 1060; n += 26) if (rnd() > 0.4) add('container', s, n, { col: cols[Math.floor(rnd() * 5)] });
        for (let s = 3240; s < 3570; s += 44) for (let n = RH + 70; n < 1060; n += 26) if (rnd() > 0.4) add('container', s, n, { col: cols[Math.floor(rnd() * 5)] });
        for (const b of [sBasins[1], sBasins[2]]) for (let n = b.n0 + 80; n < b.n1 - 40; n += 150) { add('crane', b.s0 - 18, n, { ang: TH + Math.PI }); add('crane', b.s1 + 18, n, { ang: TH }); }
        for (let n = RH + 80; n < 850; n += 150) add('crane', 600 + 18, n, { ang: TH });
        // Sloterdijk: blokken
        for (let s = 3840; s < S1; s += 46) for (let n = RH + 70; n < 1060; n += 40) { if (inBasin(s, n)) continue; if (rnd() > 0.45) add('block', s + rnd() * 8, n + rnd() * 8, { col: beige[Math.floor(rnd() * 4)], w: 18 + rnd() * 10, h: 18 + rnd() * 10 }); }
        // achterland zuid: tanks en loodsen
        for (let i = 0; i < 350; i++) { const s = S0 + rnd() * (S1 - S0), n = 1240 + rnd() * 900; add(rnd() > 0.5 ? 'tank' : 'block', s, n, { r: 14 + rnd() * 8, col: beige[Math.floor(rnd() * 4)], w: 20, h: 14 }); }
        // Zaandam: huisjes en bomen, Hemweg-centrale
        for (let s = S0 + 40; s < S1; s += 40) for (let n = -RH - 70; n > -900; n -= 36) { if (inBasin(s, n)) continue; const t = rnd(); if (t < 0.45) add('house', s + rnd() * 8, n + rnd() * 8, { col: green[Math.floor(rnd() * 3)] }); else if (t < 0.7) add('tree', s, n); }
        add('tower', 2880, 760, { h: 120, col: '#c9c9c9' }); add('tower', 2940, 760, { h: 100, col: '#bbb' }); // Hemweg-centrale, zuidoever tussen Petroleum- en Coenhaven
        for (let i = 0; i < 400; i++) { const s = S0 + rnd() * (S1 - S0), n = -1050 - rnd() * 1000; add(rnd() > 0.6 ? 'house' : 'tree', s, n, { col: green[Math.floor(rnd() * 3)] }); }
      },
    };
  },
});
