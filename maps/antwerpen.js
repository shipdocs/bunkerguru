// Kaart: Antwerpen Schelde – van het Deurganckdok langs Lillo en Kallo tot de Scheldekaaien en Petroleum Zuid
window.MAPS = window.MAPS || [];
MAPS.push({
  id: 'antwerpen', name: 'Antwerpen Schelde', icon: '🇧🇪',
  desc: { nl: 'Schelde: Deurganckdok, Lillo, Kallo, Scheldekaaien en Petroleum Zuid. Breed water, sterk getij, dikke zeeschepen.', en: 'River Scheldt: Deurganckdok, Lillo, Kallo, the Scheldt quays and Petroleum Zuid. Wide water, strong tide, big seagoing ships.' },
  TH: Math.atan2(1300, 2200), ORG: { x: 1050, y: 1000 }, W: 5650, H: 4700, RIVER_HALF: 180, S_MIN: -300, S_MAX: 4700,
  radio: { sectors: ['Antwerpen Radio', 'Zandvliet Radio', 'Sector Kallo'], places: ['het Deurganckdok', 'Lillo', 'de Kallosluis', 'de Royerssluis', 'de Scheldekaaien', 'het Sint-Annaveer', 'Petroleum Zuid', 'Liefkenshoek'], tugBasin: 'Deurganckdok' },
  K: 2, // ruimtefactor: alles 2× zo ruim, schepen even groot
  currentSpeed: 1.2,
  tide: { ebbMax: 3.5, floodMax: 3.0, period: 540 },
  lanes: { down: -30, up: 20, mouth: 110 },
  i18n: {
    'westwand Deurganckdok': 'west wall of the Deurganckdok', 'Scheldekaai bij Lillo, rechteroever': 'Scheldt quay at Lillo, right bank', 'Kallo-steiger, linkeroever': 'Kallo jetty, left bank',
    'westwand Kanaaldok, via de Royerssluis': 'west wall of the Kanaaldok, via the Royers lock', 'Scheldekaaien voor de stad': 'Scheldt quays in front of the city', 'Hobokense kade, voorbij Petroleum Zuid': 'Hoboken quay, past Petroleum Zuid',
    'SCHELDE · getijdenrivier': 'SCHELDT · tidal river',
  },
  build({ quad, RIVER_HALF: RH, TH, cols }) {
    const S0 = -300, S1 = 4700;
    // n > 0 = linkeroever (Waasland), n < 0 = rechteroever (stad)
    const lBasins = [
      { s0: 300, s1: 900, n0: RH, n1: 1400, name: 'Deurganckdok', labelN: 900 },
      { s0: 1950, s1: 2070, n0: RH, n1: 600, name: 'Kallosluis', labelN: 420 },
    ];
    const rBasins = [
      { s0: 2500, s1: 2650, n0: -900, n1: -RH, name: 'Kanaaldok · Royerssluis', labelN: -560 },
      { s0: 3850, s1: 3930, n0: -420, n1: -RH, name: 'Kattendijk', labelN: -340 },
    ];
    const land = [];
    const lPieces = [[S0, 300, 'north'], [900, 1950, 'north'], [2070, S1, 'park']];
    for (const [a, b, k] of lPieces) land.push({ poly: quad(a, b, RH, 1400), kind: k });
    land.push({ poly: quad(S0, S1, 1400, 2500), kind: 'north' });
    const rPieces = [[S0, 1400, 'tanks'], [1400, 2500, 'containers'], [2650, 3850, 'city'], [3930, S1, 'tanks']];
    for (const [a, b, k] of rPieces) land.push({ poly: quad(a, b, -900, -RH), kind: k });
    land.push({ poly: quad(S0, S1, -2100, -900), kind: 'city' });
    // Fort Liefkenshoek: eilandje op de linkeroever-plaat
    land.push({ poly: quad(1150, 1330, RH - 40, RH + 40), kind: 'island', col: '#8fcf6f', label: 'Fort Liefkenshoek' });
    return {
      land, basins: lBasins.concat(rBasins),
      terminals: [
        { s0: 836, s1: 900, n0: 400, n1: 1300, name: 'Terminal Deurganckdok' },
        { s0: 3950, s1: 4250, n0: -RH, n1: -RH + 64, name: 'Terminal Petroleum Zuid' },
      ],
      berths: [
        { name: 'MV DEURGANCK', col: '#e74c3c', axis: 'n', a0: 400, a1: 1000, c: 300 + 28, side: +1, where: 'westwand Deurganckdok' },
        { name: 'MV LILLO', col: '#2c7fb8', axis: 's', a0: 1500, a1: 1950, c: -RH + 28, side: +1, where: 'Scheldekaai bij Lillo, rechteroever' },
        { name: 'MT KALLO', col: '#27ae60', axis: 's', a0: 1400, a1: 1800, c: RH - 28, side: -1, where: 'Kallo-steiger, linkeroever' },
        { name: 'MV ROYERS', col: '#f39c12', axis: 'n', a0: -850, a1: -450, c: 2500 + 28, side: +1, where: 'westwand Kanaaldok, via de Royerssluis' },
        { name: 'MS SCHELDEKAAI', col: '#8e44ad', axis: 's', a0: 2900, a1: 3300, c: -RH + 28, side: +1, where: 'Scheldekaaien voor de stad' },
        { name: 'MT HOBOKEN', col: '#c0392b', axis: 's', a0: 4350, a1: 4650, c: -RH + 28, side: +1, where: 'Hobokense kade, voorbij Petroleum Zuid' },
      ],
      traffic: [
        { name: 'MV TRAAG', col: '#16a085', s: 4600, n: -80, v: -3.5, len: 320 },
        { name: 'MSC GROOT', col: '#d35400', s: -300, n: 60, v: 3.0, len: 380 },
        { name: 'MV DRUK', col: '#7f8c8d', s: 2200, n: -80, v: -3.0, len: 220 },
        { name: 'SLB UNION', col: '#2c3e50', s: 600, n: 1300, v: -4.5, len: 90, axis: 'n', nMin: RH + 100, nMax: 1350 },
      ],
      waits: [
        { name: 'Wachtplaats Deurganckdok', s0: 300, s1: 362, n0: 1050, n1: 1350 },
        { name: 'Wachtplaats Kallo', s0: 2150, s1: 2550, n0: RH - 44, n1: RH - 10 },
      ],
      rivals: [{ s: 700, n: 700, hdgOff: -Math.PI / 2 }, { s: 2350, n: 100, hdgOff: 0 }],
      start: { s: 331, n: 1200, hdgOff: -Math.PI / 2 },
      roads: [
        { pts: [[S0, -980], [S1, -980]], col: '#e74c3c', w: 6 },
        { pts: [[1240, 1400], [1240, -900]], col: '#f1c40f', w: 5 }, // Liefkenshoektunnel
        { pts: [[3400, 1400], [3400, -900]], col: '#f1c40f', w: 5 }, // Kennedytunnel
        { pts: [[S0, 1480], [S1, 1480]], col: '#f1c40f', w: 5 },
      ],
      labels: [
        { s: 3250, n: -700, text: 'ANTWERPEN', size: 26, col: 'rgba(60,40,20,.75)' },
        { s: 600, n: 1700, text: 'WAASLANDHAVEN', size: 22, col: 'rgba(30,60,30,.7)' },
        { s: 1700, n: -600, text: 'LILLO', size: 14, col: 'rgba(60,40,20,.7)' },
        { s: 1700, n: 800, text: 'KALLO', size: 14, col: 'rgba(30,60,30,.7)' },
        { s: 3200, n: 800, text: 'LINKEROEVER · SINT-ANNA', size: 14, col: 'rgba(30,60,30,.7)' },
        { s: 4100, n: -600, text: 'PETROLEUM ZUID', size: 14, col: 'rgba(60,40,20,.7)' },
        { s: 1240, n: RH + 70, text: 'Fort Liefkenshoek', size: 10, col: 'rgba(30,60,30,.9)' },
        { s: 2400, n: 0, text: 'SCHELDE · getijdenrivier', size: 16, col: 'rgba(255,255,255,.75)' },
      ],
      decor(add, rnd) {
        const inBasin = (s, n) => lBasins.concat(rBasins).some(b => s > b.s0 - 45 && s < b.s1 + 45 && n > b.n0 - 45 && n < b.n1 + 45);
        const beige = ['#f3e7d3', '#e7d7bd', '#f7f1e3', '#dcc9a8'], brick = ['#c0603c', '#b5533b', '#d07b57', '#a94d35'];
        // Deurganckdok: containers en kranen, Waaslandhaven erachter
        for (let s = S0 + 40; s < 260; s += 44) for (let n = RH + 70; n < 1360; n += 26) if (rnd() > 0.4) add('container', s, n, { col: cols[Math.floor(rnd() * 5)] });
        for (let s = 940; s < 1900; s += 44) for (let n = RH + 70; n < 1360; n += 26) { if (s > 1100 && s < 1400 && n < RH + 200) continue; if (rnd() > 0.45) add('container', s, n, { col: cols[Math.floor(rnd() * 5)] }); }
        for (let n = RH + 100; n < 1380; n += 150) { add('crane', 300 - 18, n, { ang: TH + Math.PI }); add('crane', 900 + 18, n, { ang: TH }); }
        for (let i = 0; i < 500; i++) { const s = S0 + rnd() * (S1 - S0), n = 1540 + rnd() * 900; add(rnd() > 0.5 ? 'tank' : 'block', s, n, { r: 14 + rnd() * 8, col: beige[Math.floor(rnd() * 4)], w: 20, h: 14 }); }
        // Sint-Anna / Burcht: park met bomen
        for (let i = 0; i < 350; i++) { const s = 2100 + rnd() * (S1 - 2100), n = RH + 60 + rnd() * 1280; if (inBasin(s, n)) continue; add('tree', s, n); }
        // rechteroever: tanks bij Zandvliet, containers Noordzeeterminal, stad, Petroleum Zuid
        for (let s = S0 + 40; s < 1380; s += 64) for (let n = -RH - 90; n > -880; n -= 64) if (rnd() > 0.3) add('tank', s + rnd() * 8, n + rnd() * 8, { r: 16 + rnd() * 8 });
        for (let s = 1440; s < 2480; s += 44) for (let n = -RH - 70; n > -880; n -= 26) if (rnd() > 0.4) add('container', s, n, { col: cols[Math.floor(rnd() * 5)] });
        for (let n = -RH - 60; n > -860; n -= 160) { add('crane', 2500 - 18, n, { ang: TH + Math.PI }); add('crane', 2650 + 18, n, { ang: TH }); }
        for (let s = 2700; s < 3830; s += 46) for (let n = -RH - 70; n > -880; n -= 40) { if (inBasin(s, n)) continue; const t = rnd(); if (t < 0.5) add('block', s + rnd() * 8, n + rnd() * 8, { col: beige[Math.floor(rnd() * 4)], w: 18 + rnd() * 10, h: 18 + rnd() * 10 }); else if (t < 0.8) add('house', s, n, { col: brick[Math.floor(rnd() * 4)] }); }
        add('tower', 3300, -330, { h: 120, col: '#d8d8d8' }); // kathedraal
        add('tower', 3820, -260, { h: 70, col: '#b5533b' }); // MAS
        for (let s = 3960; s < S1; s += 64) for (let n = -RH - 90; n > -880; n -= 64) if (rnd() > 0.3) add('tank', s, n, { r: 16 + rnd() * 8 });
        for (let i = 0; i < 500; i++) { const s = S0 + rnd() * (S1 - S0), n = -1050 - rnd() * 1000; add(rnd() > 0.5 ? 'house' : 'block', s, n, { col: (rnd() > 0.5 ? beige : brick)[Math.floor(rnd() * 4)], w: 20, h: 16 }); }
      },
    };
  },
});
