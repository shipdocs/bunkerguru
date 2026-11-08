// Kaart: Nieuwe Waterweg · Botlek – van Maassluis langs Rozenburg, de Botlek (Geulhaven), de Oude Maas en Pernis tot de Eemhaven
// Volgorde en zijden zoals op de havenkaart; rivier recht getrokken (cartoon), bekkens als rechthoeken
window.MAPS = window.MAPS || [];
MAPS.push({
  id: 'europoort', name: 'Nieuwe Waterweg · Botlek', icon: '🛢️',
  desc: { nl: 'Maassluis, Rozenburg, Botlek, Oude Maas, Pernis en de Eemhaven; Vlaardingen en Schiedam aan de overkant. Brede rivier, stevige stroming.', en: 'Maassluis, Rozenburg, Botlek, Oude Maas, Pernis and the Eemhaven; Vlaardingen and Schiedam across. Wide river, strong current.' },
  TH: Math.atan2(1000, 2400), ORG: { x: 850, y: 500 }, W: 5700, H: 3500, RIVER_HALF: 160, S_MIN: -800, S_MAX: 5200,
  radio: { sectors: ['Sector Maassluis', 'Sector Botlek', 'Sector Oude Maas'], places: ['de Botlek', 'de Geulhaven', 'de Oude Maas', 'de 2e Petroleumhaven', 'de 1e Petroleumhaven', 'Maassluis', 'Vlaardingen', 'de Vondelingenplaat', 'Pernis', 'de Eemhaven'], tugBasin: 'Eemhaven' },
  K: 2, // ruimtefactor: alles 2× zo ruim, schepen even groot
  currentSpeed: 1.5,
  tide: { ebbMax: 4.0, floodMax: 2.5, period: 540 },
  lanes: { down: -20, up: 10, mouth: 95 }, // concurrenten tussen de verkeerslanen (−65 / +55), ruim van de afgemeerde schepen (±106)
  i18n: {
    'noordoever bij Maassluis': 'north bank at Maassluis', 'Perniskade aan de rivier': 'Pernis quay on the river', 'westwand Geulhaven': 'west wall of the Geulhaven',
    'Rozenburgse kade op de Landtong': 'Rozenburg quay on the Landtong', 'Haven Maassluis (noordoever)': 'Maassluis harbour (north bank)', 'westwand Oude Maas': 'west wall of the Oude Maas',
    'oostwand Koningin Wilhelminahaven, Vlaardingen': 'east wall of the Koningin Wilhelminahaven, Vlaardingen', 'westwand Eemhaven': 'west wall of the Eemhaven',
    'NIEUWE WATERWEG · getijdenrivier': 'NIEUWE WATERWEG · tidal river', 'HET SCHEUR': 'HET SCHEUR',
  },
  build({ quad, poly, RIVER_HALF: RH, TH }) {
    const S0 = -800, S1 = 5200, CH0 = 1500, CH1 = 1800;
    // zuidoever (n > 0), van west naar oost
    const sBasins = [
      { s0: 1000, s1: 1200, n0: RH, n1: 950, name: 'Geulhaven · Botlek', labelN: 520 },
      { s0: CH0, s1: CH1, n0: RH, n1: 2600, name: 'Oude Maas', labelN: 1600 },
      { s0: 2100, s1: 2250, n0: RH, n1: 800, name: '2e Petroleumhaven', labelN: 460 },
      { s0: 2500, s1: 2650, n0: RH, n1: 700, name: '1e Petroleumhaven', labelN: 420 },
      { s0: 3600, s1: 4000, n0: RH, n1: 1000, name: 'Eemhaven', labelN: 600 },
    ];
    // noordoever (n < 0)
    const nBasins = [
      { s0: 300, s1: 420, n0: -450, n1: -RH, name: 'Haven Maassluis', labelN: -300 },
      { s0: 2100, s1: 2300, n0: -700, n1: -RH, name: 'Koningin Wilhelminahaven', labelN: -440 },
      { s0: 2500, s1: 2650, n0: -600, n1: -RH, name: 'Vulcaanhaven', labelN: -380 },
      { s0: 3300, s1: 3500, n0: -700, n1: -RH, name: 'Wilhelminahaven · Schiedam', labelN: -440 },
      { s0: 3700, s1: 3850, n0: -500, n1: -RH, name: 'Wiltonhaven', labelN: -340 },
    ];
    const land = [
      // Landtong Rozenburg: smalle strook tussen Waterweg en Calandkanaal (Calandkanaal is decor-water, afgesloten)
      { poly: quad(S0, 650, RH, 400), kind: 'park', label: 'Landtong Rozenburg' },
      { poly: quad(S0, 650, 560, 2600), kind: 'tanks', label: 'Europoort' },
      { poly: quad(650, 1000, RH, 950), kind: 'town2', label: 'Rozenburg' },
      // Botlek: de Geulhaven mondt achterin uit in de bredere Botlekhaven (decor-water s 700..1200, n 950..1500)
      { poly: quad(650, 700, 950, 2600), kind: 'tanks' },
      { poly: quad(700, 1000, 1500, 2600), kind: 'tanks' },
      { poly: quad(1200, CH0, RH, 2600), kind: 'tanks', label: 'Botlek' },
      { poly: quad(CH1, 2100, RH, 2600), kind: 'town2', label: 'Vondelingenplaat' },
      { poly: quad(2250, 2500, RH, 2600), kind: 'tanks', label: 'Pernis' },
      { poly: quad(2650, 3600, RH, 2600), kind: 'tanks', label: 'Shell Pernis' },
      { poly: quad(4000, S1, RH, 2600), kind: 'containers', label: 'Waalhaven-zuid' },
      { poly: quad(S0, S1, 2600, 3000), kind: 'base' },
      // noordoever
      { poly: quad(S0, 300, -2200, -RH), kind: 'town', label: 'Maassluis' },
      { poly: quad(420, 900, -2200, -RH), kind: 'town' },
      { poly: quad(900, 2100, -2200, -RH), kind: 'north', label: 'Aalkeetpolder' },
      { poly: quad(2300, 2500, -2200, -RH), kind: 'town2', label: 'Vlaardingen' },
      { poly: quad(2650, 3300, -2200, -RH), kind: 'town2' },
      { poly: quad(3500, 3700, -2200, -RH), kind: 'town', label: 'Schiedam' },
      { poly: quad(3850, S1, -2200, -RH), kind: 'city' },
    ];
    // land achter elk bekken (bekkens zijn doodlopend)
    for (const b of sBasins) if (b.name !== 'Oude Maas') land.push({ poly: quad(b.s0, b.s1, b.n1, 2600), kind: 'tanks' });
    for (const b of nBasins) land.push({ poly: quad(b.s0, b.s1, -2200, b.n0), kind: 'town2' });
    land.push({ poly: quad(1000, 1200, 1500, 2600), kind: 'tanks' });
    const nb = nBasins[0];
    return {
      land, basins: sBasins.concat(nBasins),
      terminals: [
        { s0: 1136, s1: 1200, n0: 300, n1: 800, name: 'Terminal Botlek' },
        { s0: CH1 - 64, s1: CH1, n0: 420, n1: 900, name: 'Terminal Oude Maas' },
        { s0: 3936, s1: 4000, n0: 380, n1: 900, name: 'Terminal Eemhaven' },
      ],
      berths: [
        { name: 'MV CARTOON STAR', col: '#e74c3c', axis: 's', a0: 450, a1: 880, c: -RH + 28, side: +1, where: 'noordoever bij Maassluis' },
        { name: 'MT OLIEBOL', col: '#2c7fb8', axis: 's', a0: 2700, a1: 3100, c: RH - 28, side: -1, where: 'Perniskade aan de rivier' },
        { name: 'MV KAASKOP', col: '#8e44ad', axis: 'n', a0: 220, a1: 640, c: 1000 + 28, side: +1, where: 'westwand Geulhaven' },
        { name: 'MV ROZENBURG', col: '#27ae60', axis: 's', a0: 100, a1: 460, c: RH - 28, side: -1, where: 'Rozenburgse kade op de Landtong' },
        { name: 'MT MAASSLUIS', col: '#c0392b', axis: 'n', a0: -420, a1: -190, c: 300 + 28, side: +1, where: 'Haven Maassluis (noordoever)' },
        { name: 'MV OUDE MAAS', col: '#f39c12', axis: 'n', a0: 600, a1: 1040, c: CH0 + 28, side: +1, where: 'westwand Oude Maas' },
        { name: 'MS VLAARDINGEN', col: '#16a085', axis: 'n', a0: -650, a1: -250, c: 2300 - 28, side: -1, where: 'oostwand Koningin Wilhelminahaven, Vlaardingen' },
        { name: 'MV EEMHAVEN', col: '#d35400', axis: 'n', a0: 400, a1: 900, c: 3600 + 28, side: +1, where: 'westwand Eemhaven' },
      ],
      traffic: [
        { name: 'MV TRAAG', col: '#16a085', s: 4800, n: -65, v: -4.0, len: 300 },
        { name: 'MT HAAST', col: '#d35400', s: -600, n: 55, v: 3.2, len: 240 },
        { name: 'MV DRUK', col: '#7f8c8d', s: 1200, n: -65, v: -3.0, len: 200 },
        { name: 'SLB BUTS', col: '#2c3e50', s: 3800, n: 700, v: -5.0, len: 90, axis: 'n', nMin: RH + 100, nMax: 950 },
      ],
      channels: [{ s0: CH0, s1: CH1, n0: RH, n1: 2600, cs: 0, cn: -0.8 }], // Oude Maas stroomt naar de hoofdrivier
      waits: [
        { name: 'Wachtplaats Botlek', yard: true, s0: 1000, s1: 1062, n0: 690, n1: 930 },
        { name: 'Wachtplaats Maassluis', s0: 1000, s1: 1450, n0: -RH + 10, n1: -RH + 44 },
      ],
      rivals: [{ s: 1100, n: 500, hdgOff: -Math.PI / 2 }, { s: CH1 - 60, n: 900, hdgOff: Math.PI / 2 }],
      start: { s: 1031, n: 810, hdgOff: -Math.PI / 2 },
      roads: [
        { pts: [[S0, -900], [S1, -900]], col: '#e74c3c', w: 6 }, // A20
        { pts: [[S0, -820], [S1, -820]], col: '#f1c40f', w: 4 },
        { pts: [[650, 2600], [650, 400]], col: '#f1c40f', w: 5 }, // Rozenburg
        { pts: [[1380, 2600], [1380, 150]], col: '#f1c40f', w: 5 }, { pts: [[1380, -RH], [1380, -2200]], col: '#f1c40f', w: 5 }, // Beneluxtunnel-achtig
        { pts: [[S0, 2650], [S1, 2650]], col: '#e74c3c', w: 6 }, // A15
      ],
      labels: [
        { s: 100, n: -800, text: 'MAASSLUIS', size: 20, col: 'rgba(30,60,30,.8)' },
        { s: 2400, n: -900, text: 'VLAARDINGEN', size: 20, col: 'rgba(30,60,30,.8)' },
        { s: 3600, n: -900, text: 'SCHIEDAM', size: 20, col: 'rgba(30,60,30,.8)' },
        { s: 4700, n: -900, text: 'ROTTERDAM', size: 16, col: 'rgba(30,60,30,.7)' },
        { s: -100, n: 480, text: 'Calandkanaal', size: 11, col: 'rgba(255,255,255,.8)' },
        { s: 820, n: 1300, text: 'Botlekhaven', size: 12, col: 'rgba(255,255,255,.8)' },
        { s: 900, n: 0, text: 'NIEUWE WATERWEG · getijdenrivier', size: 16, col: 'rgba(255,255,255,.75)' },
        { s: 3000, n: 0, text: 'HET SCHEUR', size: 14, col: 'rgba(255,255,255,.7)' },
        { s: 2200, n: 1900, text: 'BOTLEK · PERNIS', size: 22, col: 'rgba(60,40,20,.7)' },
        { s: 4600, n: 1800, text: 'WAALHAVEN', size: 16, col: 'rgba(60,40,20,.6)' },
      ],
      decor(add, rnd, { cols }) {
        const inB = (s, n) => sBasins.concat(nBasins).some(b => s > b.s0 - 45 && s < b.s1 + 45 && n > b.n0 - 45 && n < b.n1 + 45);
        // Europoort / Botlek / Pernis: tankparken
        for (let s = S0 + 60; s < 620; s += 70) for (let n = 640; n < 2500; n += 70) if (rnd() > 0.3) add('tank', s + rnd() * 10, n + rnd() * 10, { r: 18 + rnd() * 8 });
        for (let s = 1240; s < CH0 - 40; s += 64) for (let n = RH + 90; n < 2500; n += 64) if (rnd() > 0.3) add('tank', s, n, { r: 16 + rnd() * 6 });
        for (let s = 740; s < 960; s += 64) for (let n = 1560; n < 2500; n += 64) if (rnd() > 0.3) add('tank', s, n, { r: 16 + rnd() * 6 });
        for (let s = 2290; s < 2460; s += 64) for (let n = RH + 90; n < 2500; n += 64) if (rnd() > 0.3) add('tank', s, n, { r: 16 + rnd() * 6 });
        for (let s = 2700; s < 3560; s += 72) for (let n = RH + 90; n < 2500; n += 72) if (rnd() > 0.35) add('tank', s + rnd() * 10, n + rnd() * 10, { r: 16 + rnd() * 10 });
        for (let n = 300; n < 2500; n += 150) { add('crane', CH0 - 18, n, { ang: TH + Math.PI }); add('crane', CH1 + 18, n, { ang: TH }); }
        // Eemhaven en Waalhaven-zuid: containers
        for (let s = 4040; s < S1; s += 44) for (let n = RH + 70; n < 1500; n += 26) if (rnd() > 0.4) add('container', s, n, { col: cols[Math.floor(rnd() * 5)] });
        for (let n = RH + 80; n < 980; n += 150) { add('crane', 3600 - 18, n, { ang: TH + Math.PI }); add('crane', 4000 + 18, n, { ang: TH }); }
        for (let n = RH + 80; n < 920; n += 150) { add('crane', 1000 - 18, n, { ang: TH + Math.PI }); add('crane', 1200 + 18, n, { ang: TH }); }
        // Rozenburg en Vondelingenplaat: huisjes, Landtong: bomen
        for (let s = 690; s < 960; s += 40) for (let n = RH + 80; n < 950; n += 38) if (rnd() > 0.4) add('house', s, n, { col: ['#f5deb3', '#deb887', '#fff'][Math.floor(rnd() * 3)] });
        for (let s = CH1 + 60; s < 2060; s += 40) for (let n = RH + 80; n < 900; n += 38) if (rnd() > 0.4) add('house', s, n, { col: ['#f5deb3', '#deb887', '#fff'][Math.floor(rnd() * 3)] });
        for (let i = 0; i < 120; i++) add('tree', S0 + 40 + rnd() * 560, RH + 50 + rnd() * 180);
        // noordoever: Maassluis, Vlaardingen, Schiedam huisjes; polder bomen
        const town = (a, b, depth) => { for (let s = a; s < b; s += 36) for (let n = -RH - 90; n > -depth; n -= 34) { if (inB(s, n)) continue; if (rnd() > 0.3) add('house', s + rnd() * 8, n + rnd() * 8, { col: ['#c0603c', '#b5533b', '#d07b57', '#f5deb3'][Math.floor(rnd() * 4)] }); } };
        town(S0 + 40, 880, 900); town(2140, 3290, 1000); town(3520, 4200, 900);
        for (let s = 4200; s < S1; s += 46) for (let n = -RH - 70; n > -1000; n -= 40) if (rnd() > 0.45) add('block', s, n, { col: ['#f3e7d3', '#e7d7bd', '#dcc9a8'][Math.floor(rnd() * 3)], w: 18 + rnd() * 10, h: 18 + rnd() * 10 });
        for (let i = 0; i < 260; i++) { const s = 920 + rnd() * 1160, n = -RH - 60 - rnd() * 1800; add('tree', s, n); }
        for (let i = 0; i < 400; i++) { const s = S0 + rnd() * (S1 - S0), n = -1050 - rnd() * 1100; add(rnd() > 0.5 ? 'tree' : 'house', s, n, { col: '#deb887' }); }
        add('crane', nb.s0 - 18, -300, { ang: TH + Math.PI }); add('crane', nb.s1 + 18, -300, { ang: TH });
        for (const b of nBasins.slice(1)) for (let n = b.n0 + 80; n < b.n1 - 60; n += 150) { add('crane', b.s0 - 18, n, { ang: TH + Math.PI }); add('crane', b.s1 + 18, n, { ang: TH }); }
      },
    };
  },
});
