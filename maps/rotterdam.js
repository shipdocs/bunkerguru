// Kaart: Rotterdam Stad – Nieuwe Maas van de Van Brienenoordbrug tot de Merwehaven
window.MAPS = window.MAPS || [];
MAPS.push({
  id: 'rotterdam', name: 'Rotterdam Stad', icon: '🌉',
  desc: { nl: 'Nieuwe Maas door de stad: Erasmusbrug, Noordereiland, Rijn-, Maas- en Waalhaven, Euromast, De Kuip. Krap en druk.', en: 'Nieuwe Maas through the city: Erasmus bridge, Noordereiland, Rijn-, Maas- and Waalhaven, Euromast, De Kuip. Tight and busy.' },
  TH: Math.atan2(-150, 2400), ORG: { x: 150, y: 1250 }, W: 4800, H: 2450, RIVER_HALF: 260, S_MIN: -300, S_MAX: 4700,
  currentSpeed: 1.0,
  tide: { ebbMax: 3.0, floodMax: 2.0, period: 540 },
  lanes: { down: -120, up: -50, mouth: 200 },
  i18n: {
    'oostwand Rijnhaven': 'east wall of the Rijnhaven', 'westwand Waalhaven': 'west wall of the Waalhaven', 'Parkkade onder de Euromast': 'Parkkade below the Euromast',
    'oostwand Merwehaven': 'east wall of the Merwehaven', 'Maasboulevard, voorbij de Willemsbrug': 'Maasboulevard, past the Willems bridge', 'Feijenoordkade bij De Kuip': 'Feijenoord quay near De Kuip',
    'NIEUWE MAAS · getijdenrivier': '← NIEUWE MAAS · current 1.0 m/s seaward',
  },
  build({ quad, RIVER_HALF: RH, TH, cols }) {
    const S0 = -300, S1 = 4700;
    const nBasins = [
      { s0: 0, s1: 260, n0: -1000, n1: -RH, name: 'Merwehaven', labelN: -600 },
      { s0: 380, s1: 520, n0: -800, n1: -RH, name: 'IJsselhaven', labelN: -520 },
      { s0: 620, s1: 740, n0: -700, n1: -RH, name: 'Lekhaven', labelN: -480 },
      { s0: 820, s1: 900, n0: -450, n1: -RH, name: 'Keilehaven', labelN: -360 },
      { s0: 1050, s1: 1180, n0: -600, n1: -RH, name: 'Schiehaven', labelN: -430 },
      { s0: 1300, s1: 1400, n0: -480, n1: -RH, name: 'St-Jobshaven', labelN: -370 },
      { s0: 1650, s1: 1760, n0: -650, n1: -RH, name: 'Parkhaven', labelN: -450 },
      { s0: 1900, s1: 1980, n0: -380, n1: -RH, name: 'Veerhaven', labelN: -320 },
      { s0: 2200, s1: 2300, n0: -520, n1: -RH, name: 'Leuvehaven', labelN: -390 },
    ];
    const sBasins = [
      { s0: 150, s1: 900, n0: RH, n1: 1300, name: 'Waalhaven', labelN: 800 },
      { s0: 1250, s1: 1600, n0: RH, n1: 900, name: 'Maashaven', labelN: 600 },
      { s0: 2000, s1: 2350, n0: RH, n1: 750, name: 'Rijnhaven', labelN: 520 },
      { s0: 2650, s1: 2730, n0: RH, n1: 600, name: 'Spoorweghaven', labelN: 430 },
      { s0: 3330, s1: 3440, n0: RH, n1: 650, name: 'Binnenhaven', labelN: 460 },
      { s0: 3750, s1: 3820, n0: RH, n1: 450, name: 'Nassauhaven', labelN: 360 },
    ];
    const land = [];
    // noordoever: stukken tussen de bekkens
    const nPieces = [[S0, 0, 'port'], [260, 380, 'port'], [520, 620, 'port'], [740, 820, 'port'], [900, 1050, 'city'], [1180, 1300, 'city'], [1400, 1650, 'park'], [1760, 1900, 'park'], [1980, 2200, 'city'], [2300, S1, 'city']];
    for (const [a, b, k] of nPieces) land.push({ poly: quad(a, b, -1000, -RH), kind: k });
    land.push({ poly: quad(S0, S1, -2100, -1000), kind: 'city' });
    // zuidoever
    const sPieces = [[S0, 150, 'port'], [900, 1250, 'port'], [1600, 2000, 'city'], [2350, 2650, 'city'], [2730, 3330, 'city'], [3440, 3750, 'city'], [3820, S1, 'park']];
    for (const [a, b, k] of sPieces) land.push({ poly: quad(a, b, RH, 1300), kind: k });
    land.push({ poly: quad(S0, S1, 1300, 2300), kind: 'city' });
    // eilanden
    land.push({ poly: quad(2550, 3250, 40, 150), kind: 'island', col: '#e9dcc3', label: 'Noordereiland' });
    land.push({ poly: quad(4300, 4650, 60, 200), kind: 'park', label: 'Eiland van Brienenoord' });
    return {
      land, basins: nBasins.concat(sBasins),
      terminals: [
        { s0: 1270, s1: 1370, n0: 650, n1: 880, name: 'Terminal Maashaven' },
        { s0: 780, s1: 880, n0: 900, n1: 1150, name: 'Terminal Waalhaven' },
      ],
      berths: [
        { name: 'MV RIJNHAVEN', col: '#e74c3c', axis: 'n', a0: 380, a1: 660, c: 2350 - 28, side: -1, where: 'oostwand Rijnhaven' },
        { name: 'MT WAALHAVEN', col: '#2c7fb8', axis: 'n', a0: 500, a1: 780, c: 150 + 28, side: +1, where: 'westwand Waalhaven' },
        { name: 'MS EUROMAST', col: '#27ae60', axis: 's', a0: 1420, a1: 1640, c: -RH + 28, side: +1, where: 'Parkkade onder de Euromast' },
        { name: 'MV MERWEHAVEN', col: '#f39c12', axis: 'n', a0: -700, a1: -420, c: 260 - 28, side: -1, where: 'oostwand Merwehaven' },
        { name: 'MV KRALINGEN', col: '#8e44ad', axis: 's', a0: 3450, a1: 3700, c: -RH + 28, side: +1, where: 'Maasboulevard, voorbij de Willemsbrug' },
        { name: 'MT FEIJENOORD', col: '#c0392b', axis: 's', a0: 3500, a1: 3750, c: RH - 28, side: -1, where: 'Feijenoordkade bij De Kuip' },
      ],
      traffic: [
        { name: 'MV TRAAG', col: '#16a085', s: 4500, n: -120, v: -3.5, len: 260 },
        { name: 'RONDVAART 1', col: '#f5f5f5', s: 2000, n: -120, v: -2.5, len: 120 },
        { name: 'MT HAAST', col: '#d35400', s: -200, n: -40, v: 3.0, len: 220 },
        { name: 'WATERTAXI', col: '#f1c40f', s: 500, n: -40, v: 7.0, len: 50 },
        { name: 'SLB DUW', col: '#2c3e50', s: 525, n: 1000, v: -4.0, len: 90, axis: 'n', nMin: RH + 100, nMax: 1250 },
      ],
      bridges: [
        { s: 2420, n0: -RH, n1: RH, name: 'Erasmusbrug', pillars: [-60], pylon: -60, col: '#dfe6ee' },
        { s: 2750, n0: -RH, n1: 40, name: 'Willemsbrug', pillars: [-150], col: '#e74c3c' },
        { s: 2980, n0: 150, n1: RH, name: 'De Hef', towers: [150, RH], col: '#555' },
        { s: 3220, n0: 150, n1: RH, name: 'Koninginnebrug', col: '#888' },
        { s: 4150, n0: -RH, n1: RH, name: 'Van Brienenoordbrug', pillars: [-110, 110], col: '#2c7fb8' },
      ],
      rivals: [{ s: 1420, n: 500, hdgOff: -Math.PI / 2 }, { s: 600, n: 700, hdgOff: -Math.PI / 2 }],
      start: { s: 2170, n: 450, hdgOff: -Math.PI / 2 },
      roads: [
        { pts: [[2300, -330], [S1, -330]], col: '#e74c3c', w: 6 },
        { pts: [[900, -1100], [S1, -1100]], col: '#f1c40f', w: 5 },
        { pts: [[4150, -2100], [4150, 2300]], col: '#2c7fb8', w: 9 },
        { pts: [[2420, -1000], [2420, -RH]], col: '#dfe6ee', w: 6 }, { pts: [[2420, RH], [2420, 1300]], col: '#dfe6ee', w: 6 },
      ],
      labels: [
        { s: 2300, n: -820, text: 'ROTTERDAM CENTRUM', size: 24, col: 'rgba(60,40,20,.75)' },
        { s: 2500, n: 1000, text: 'KOP VAN ZUID', size: 16, col: 'rgba(60,40,20,.7)' },
        { s: 1800, n: 1000, text: 'KATENDRECHT', size: 16, col: 'rgba(60,40,20,.7)' },
        { s: 3050, n: 1000, text: 'FEIJENOORD', size: 16, col: 'rgba(60,40,20,.7)' },
        { s: 2900, n: 212, text: 'Koningshaven', size: 11, col: 'rgba(255,255,255,.8)' },
        { s: 1000, n: 0, text: 'NIEUWE MAAS · getijdenrivier', size: 16, col: 'rgba(255,255,255,.75)' },
        { s: 1530, n: -300, text: 'EUROMAST', size: 11, col: 'rgba(60,40,20,.8)' },
        { s: 3900, n: 1000, text: 'DE KUIP', size: 12, col: 'rgba(60,40,20,.8)' },
      ],
      decor(add, rnd) {
        const inBasin = (s, n) => nBasins.concat(sBasins).some(b => s > b.s0 - 45 && s < b.s1 + 45 && n > b.n0 - 45 && n < b.n1 + 45);
        const beige = ['#f3e7d3', '#e7d7bd', '#f7f1e3', '#dcc9a8', '#efe2cc'], brick = ['#c0603c', '#b5533b', '#d07b57', '#a94d35'];
        // centrum: blokken en wat torens
        for (let s = 900; s < S1; s += 46) for (let n = -RH - 70; n > -1000; n -= 40) { if (inBasin(s, n)) continue; if (s > 1400 && s < 1900 && n > -700) continue; const t = rnd(); if (t < 0.55) add('block', s + rnd() * 8, n + rnd() * 8, { col: beige[Math.floor(rnd() * 5)], w: 24 + rnd() * 14, h: 16 + rnd() * 10 }); else if (t < 0.62 && s > 2000 && s < 3000) add('block', s, n, { col: '#9fb4c7', w: 20, h: 20 }); }
        for (let s = 1420; s < 1900; s += 30) for (let n = -RH - 60; n > -700; n -= 30) { if (inBasin(s, n)) continue; if (rnd() > 0.45) add('tree', s + rnd() * 10, n + rnd() * 10); }
        add('tower', 1560, -340, { h: 110, col: '#d8d8d8' });
        for (let s = S0 + 40; s < 900; s += 44) for (let n = -RH - 70; n > -1000; n -= 26) { if (inBasin(s, n)) continue; if (rnd() > 0.4) add('container', s, n, { col: cols[Math.floor(rnd() * 5)] }); }
        for (const b of nBasins.slice(0, 5)) for (let n = b.n0 + 60; n < b.n1 - 40; n += 140) { add('crane', b.s0 - 18, n, { ang: TH + Math.PI }); add('crane', b.s1 + 18, n, { ang: TH }); }
        // zuid
        for (let s = 1620; s < 2000; s += 40) for (let n = RH + 70; n < 1280; n += 36) if (rnd() > 0.35) add('house', s + rnd() * 8, n + rnd() * 8, { col: brick[Math.floor(rnd() * 4)] });
        for (let s = 2370; s < 2640; s += 40) for (let n = RH + 70; n < 1280; n += 40) if (rnd() > 0.3) add('block', s, n, { col: ['#9fb4c7', '#b0c4d8', '#8aa0b5'][Math.floor(rnd() * 3)], w: 22, h: 22 });
        for (let s = 2750; s < 3330; s += 40) for (let n = RH + 70; n < 1280; n += 36) if (rnd() > 0.35) add('house', s + rnd() * 8, n + rnd() * 8, { col: brick[Math.floor(rnd() * 4)] });
        for (let s = 3460; s < 3740; s += 40) for (let n = RH + 70; n < 1280; n += 36) if (rnd() > 0.4) add('house', s, n, { col: beige[Math.floor(rnd() * 5)] });
        add('stadium', 3900, 850);
        for (let i = 0; i < 160; i++) { const s = 3830 + rnd() * 860, n = RH + 60 + rnd() * 1200; if (Math.hypot(s - 3900, n - 850) < 110) continue; add('tree', s, n); }
        for (let i = 0; i < 40; i++) add('tree', 4320 + rnd() * 310, 80 + rnd() * 100);
        for (let s = S0 + 40; s < 140; s += 44) for (let n = RH + 70; n < 1280; n += 26) if (rnd() > 0.4) add('container', s, n, { col: cols[Math.floor(rnd() * 5)] });
        for (let s = 920; s < 1240; s += 44) for (let n = RH + 70; n < 1280; n += 26) if (rnd() > 0.4) add('container', s, n, { col: cols[Math.floor(rnd() * 5)] });
        for (let n = RH + 120; n < 1250; n += 160) { add('crane', 150 - 18, n, { ang: TH + Math.PI }); add('crane', 900 + 18, n, { ang: TH }); }
        for (let n = RH + 100; n < 880; n += 160) { add('crane', 1250 - 18, n, { ang: TH + Math.PI }); add('crane', 1600 + 18, n, { ang: TH }); }
        // Noordereiland: huisjes
        for (let s = 2590; s < 3220; s += 34) for (let n = 70; n < 130; n += 28) if (rnd() > 0.3) add('house', s, n, { col: brick[Math.floor(rnd() * 4)] });
        // achterland
        for (let i = 0; i < 400; i++) { const s = S0 + rnd() * (S1 - S0), n = -1050 - rnd() * 1000; add(rnd() > 0.5 ? 'tree' : 'house', s, n, { col: beige[Math.floor(rnd() * 5)] }); }
        for (let i = 0; i < 300; i++) { const s = S0 + rnd() * (S1 - S0), n = 1340 + rnd() * 900; add(rnd() > 0.5 ? 'tree' : 'house', s, n, { col: brick[Math.floor(rnd() * 4)] }); }
      },
    };
  },
});
