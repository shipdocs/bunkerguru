// Playable, schematic widths in metres, not a surveyed nautical chart.
// Each band is [absolute distance from canal centre, width]. The final band
// ends at the original basin head. Shared by land, quays, chart and navigation.
export const BASIN_BANDS = [
  [
    [140, 180],
    [270, 230],
    [350, 260],
    [780, 220],
  ], // Afrikahaven
  [
    [140, 220],
    [300, 290],
    [440, 360],
    [870, 420],
  ], // Amerikahaven
  [
    [140, 170],
    [280, 220],
    [370, 250],
    [740, 280],
  ], // Westhaven
  [
    [140, 105],
    [270, 140],
    [540, 190],
  ], // Petroleumhaven
  [
    [140, 95],
    [260, 140],
    [420, 180],
  ], // Jan van Riebeeckhaven
  [
    [140, 90],
    [240, 130],
    [340, 180],
  ], // Coenhaven
  [
    [140, 100],
    [240, 140],
    [330, 180],
  ], // Mercuriushaven
  [
    [140, 90],
    [330, 110],
    [660, 150],
  ], // Zijkanaal G
  [
    [140, 120],
    [220, 200],
  ], // Hemhaven: room alongside receiver
  [
    [140, 60],
    [330, 70],
    [580, 86],
  ], // Zijkanaal C: narrow, reverse out
];
export const CANAL_INSETS = [
  { x0: -2480, x1: -2180, north: 55, south: 0 },
  { x0: -1560, x1: -1320, north: 0, south: 40 },
  { x0: -650, x1: -400, north: 45, south: 0 },
  { x0: 150, x1: 320, north: 45, south: 45 },
  { x0: 1600, x1: 1810, north: 40, south: 0 },
  { x0: 2160, x1: 2460, north: 0, south: 35 },
];
export function basinSections(b, index) {
  const centre = (b.s0 + b.s1) / 2 - 2200,
    positive = b.n0 > 0,
    end = positive ? b.n1 : -b.n0;
  return BASIN_BANDS[index].map(([start, width], i, bands) => {
    const finish = bands[i + 1]?.[0] ?? end;
    return {
      x0: centre - width / 2,
      x1: centre + width / 2,
      z0: positive ? start : -finish,
      z1: positive ? finish : -start,
      width,
    };
  });
}
export function boundsAt(b, z) {
  return b.sections.find((p) => z >= p.z0 && z <= p.z1) || b.sections[0];
}
