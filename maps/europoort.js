// Kaart: Europoort Calland – Nieuwe Waterweg bij Maassluis, Botlek-bekkens en de Oude Maas-tak
window.MAPS = window.MAPS || [];
MAPS.push({
  id: 'europoort', name: 'Europoort Calland', icon: '🛢️',
  desc: { nl: 'Nieuwe Waterweg, Botlek, Pernis en de Oude Maas. Tankparken, brede rivier, stevige stroming.', en: 'Nieuwe Waterweg, Botlek, Pernis and the Oude Maas. Tank farms, wide river, strong current.' },
  TH: Math.atan2(1000, 2400), ORG: { x: 0, y: 330 }, W: 4300, H: 2750, RIVER_HALF: 160, S_MIN: -800, S_MAX: 5200,
  radio: { sectors: ['Sector Maassluis', 'Sector Botlek', 'Sector Oude Maas'], places: ['de Botlek', 'de Geulhaven', 'de Oude Maas', 'de 2e Petroleumhaven', 'Maassluis', 'de Vondelingenplaat', 'Pernis'], tugBasin: 'Oude Maas' },
  currentSpeed: 1.5,
  tide: { ebbMax: 4.0, floodMax: 2.5, period: 540 },
  lanes: { down: -20, up: 10, mouth: 95 }, // concurrenten tussen de verkeerslanen (−65 / +55), ruim van de afgemeerde schepen (±106)
  build({ quad, RIVER_HALF, TH }) {
    const S_MAX = 5200, CH0 = 2900, CH1 = 3150;
    const land = [
      { poly: quad(-800, 2500, -RIVER_HALF, -500), kind: 'north' },
      { poly: quad(2620, S_MAX, -RIVER_HALF, -500), kind: 'north' },
      { poly: quad(-800, S_MAX, -500, -2200), kind: 'north' },
      { poly: quad(-800, 520, RIVER_HALF, 720), kind: 'tanks', label: 'Europoort' },
      { poly: quad(720, 1120, RIVER_HALF, 720), kind: 'containers', label: 'Botlek' },
      { poly: quad(1280, 1720, RIVER_HALF, 720), kind: 'tanks', label: 'Pernis' },
      { poly: quad(1900, CH0, RIVER_HALF, 720), kind: 'town2', label: 'Vondelingenplaat' },
      { poly: quad(CH1, S_MAX, RIVER_HALF, 720), kind: 'tanks', label: 'Hoogvliet' },
      { poly: quad(-800, CH0, 720, 2600), kind: 'base' },
      { poly: quad(CH1, S_MAX, 720, 2600), kind: 'base' },
      { poly: quad(1450, 1950, -140, -120), kind: 'dam', label: 'Dam' },
    ];
    const basins = [
      { s0: 520, s1: 720, n0: RIVER_HALF, n1: 720, name: '1e Petroleumhaven', labelN: 420 },
      { s0: 1120, s1: 1280, n0: RIVER_HALF, n1: 720, name: '2e Petroleumhaven', labelN: 420 },
      { s0: 1720, s1: 1900, n0: RIVER_HALF, n1: 720, name: 'Geulhaven', labelN: 420 },
      { s0: CH0, s1: CH1, n0: RIVER_HALF, n1: 2600, name: 'Oude Maas', labelN: 1600 },
      { s0: 2500, s1: 2620, n0: -500, n1: -RIVER_HALF, name: 'Haven Maassluis', labelN: -330 },
    ];
    const nb = basins[4];
    return {
      land, basins,
      terminals: [
        { s0: 540, s1: 700, n0: 620, n1: 720, name: 'Terminal Botlek' },
        { s0: CH1 - 110, s1: CH1 - 10, n0: 1150, n1: 1400, name: 'Terminal Oude Maas' },
      ],
      berths: [
        { name: 'MV CARTOON STAR', col: '#e74c3c', axis: 's', a0: 2050, a1: 2330, c: -RIVER_HALF + 28, side: +1, where: 'noordoever bij Maassluis' },
        { name: 'MT OLIEBOL', col: '#2c7fb8', axis: 's', a0: 1320, a1: 1600, c: RIVER_HALF - 28, side: -1, where: 'Perniskade aan de rivier' },
        { name: 'MV KAASKOP', col: '#8e44ad', axis: 'n', a0: 300, a1: 560, c: 1720 + 28, side: +1, where: 'westwand Geulhaven' },
        { name: 'MV EUROPOORT', col: '#27ae60', axis: 's', a0: -300, a1: -20, c: RIVER_HALF - 28, side: -1, where: 'Europoortkade, ver stroomafwaarts' },
        { name: 'MT MAASSLUIS', col: '#c0392b', axis: 'n', a0: -460, a1: -220, c: 2500 + 28, side: +1, where: 'Haven Maassluis (noordoever)' },
        { name: 'MV OUDE MAAS', col: '#f39c12', axis: 'n', a0: 700, a1: 980, c: CH0 + 28, side: +1, where: 'westwand Oude Maas' },
      ],
      traffic: [
        { name: 'MV TRAAG', col: '#16a085', s: 3200, n: -65, v: -4.0, len: 300 },
        { name: 'MT HAAST', col: '#d35400', s: -400, n: 55, v: 3.2, len: 240 },
        { name: 'MV DRUK', col: '#7f8c8d', s: 1200, n: -65, v: -3.0, len: 200 },
        { name: 'SLB BUTS', col: '#2c3e50', s: CH0 + 200, n: 900, v: -5.0, len: 90, axis: 'n', nMin: RIVER_HALF + 100, nMax: 1060 },
      ],
      channels: [{ s0: CH0, s1: CH1, n0: RIVER_HALF, n1: 2600, cs: 0, cn: -0.8 }], // Oude Maas stroomt naar de hoofdrivier
      rivals: [{ s: 610, n: 500, hdgOff: -Math.PI / 2 }, { s: CH1 - 60, n: 900, hdgOff: Math.PI / 2 }],
      start: { s: 1200, n: 450, hdgOff: -Math.PI / 2 },
      roads: [
        { pts: [[-800, -620], [S_MAX, -620]], col: '#e74c3c', w: 6 },
        { pts: [[-800, -560], [S_MAX, -560]], col: '#f1c40f', w: 4 },
      ],
      labels: [
        { s: 3300, n: -200, text: 'MAASSLUIS', size: 20, col: 'rgba(30,60,30,.8)' },
        { s: 600, n: 0, text: 'NIEUWE WATERWEG · getijdenrivier', size: 16, col: 'rgba(255,255,255,.75)' },
      ],
      decor(add, rnd, { cols }) {
        for (let s = -500; s < 440; s += 70) for (let n = RIVER_HALF + 90; n < 1100; n += 70) if (rnd() > 0.25) add('tank', s + rnd() * 10, n + rnd() * 10, { r: 18 + rnd() * 8 });
        for (let s = 1340; s < 1680; s += 64) for (let n = RIVER_HALF + 90; n < 1100; n += 64) if (rnd() > 0.3) add('tank', s, n, { r: 16 + rnd() * 6 });
        for (let s = CH1 + 70; s < 4900; s += 72) for (let n = RIVER_HALF + 90; n < 1800; n += 72) if (rnd() > 0.35) add('tank', s + rnd() * 10, n + rnd() * 10, { r: 16 + rnd() * 10 });
        for (let n = 300; n < 2500; n += 150) { add('crane', CH0 - 18, n, { ang: TH + Math.PI }); add('crane', CH1 + 18, n, { ang: TH }); }
        add('crane', nb.s0 - 18, -300, { ang: TH + Math.PI }); add('crane', nb.s1 + 18, -300, { ang: TH }); add('crane', nb.s1 + 18, -440, { ang: TH });
        for (let s = 760; s < 1090; s += 40) for (let n = RIVER_HALF + 60; n < 700; n += 22) if (rnd() > 0.35) add('container', s, n, { col: cols[Math.floor(rnd() * 5)] });
        for (const b of basins.slice(0, 3)) for (let n = b.n0 + 80; n < b.n1 - 60; n += 150) { add('crane', b.s0 - 18, n, { ang: TH + Math.PI }); add('crane', b.s1 + 18, n, { ang: TH }); }
        for (let s = 2000; s < 2400; s += 120) add('crane', s, -RIVER_HALF - 20, { ang: TH + Math.PI / 2 });
        for (let s = 2000; s < 3800; s += 36) for (let n = -RIVER_HALF - 90; n > -900; n -= 34) { if (s > nb.s0 - 50 && s < nb.s1 + 50 && n > nb.n0 - 50) continue; if (rnd() > 0.3) add('house', s + rnd() * 8, n + rnd() * 8, { col: ['#f5deb3', '#deb887', '#d2b48c', '#fff', '#f4a460'][Math.floor(rnd() * 5)] }); }
        for (let i = 0; i < 500; i++) { const s = -700 + rnd() * 5800, n = -RIVER_HALF - 60 - rnd() * 1600; if (s > 1950 && s < 3850 && n > -950) continue; if (s > nb.s0 - 40 && s < nb.s1 + 40 && n > nb.n0 - 40) continue; add('tree', s, n); }
        for (let i = 0; i < 90; i++) add('tree', 1900 + rnd() * 950, RIVER_HALF + 60 + rnd() * 600);
        for (let i = 0; i < 160; i++) { const s = -700 + rnd() * 5800, n = 760 + rnd() * 1700; if (s > CH0 - 40 && s < CH1 + 40) continue; add('tree', s, n); }
        for (let s = 1960; s < 2840; s += 40) for (let n = RIVER_HALF + 80; n < 650; n += 38) if (rnd() > 0.4) add('house', s, n, { col: ['#f5deb3', '#deb887', '#fff'][Math.floor(rnd() * 3)] });
      },
    };
  },
});
