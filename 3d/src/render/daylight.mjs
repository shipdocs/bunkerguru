// Day and night from the harbour clock (fase 3). Pure numbers, no Three.js, so the
// tests can check them: night 0 at noon … 1 at midnight, dusk warm at sunrise/sunset.
const smooth = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
// Sun up at 6:00, down at 21:00 (Dutch summer-ish); twilight one hour either side.
export function daylight(daySeconds) {
  const h = (((daySeconds % 86400) + 86400) % 86400) / 3600;
  const night = 1 - smooth(4.8, 6.6, h) * (1 - smooth(20.4, 22.2, h));
  const dusk = Math.max(0, 1 - Math.abs(h - 6.2) / 1.2) + Math.max(0, 1 - Math.abs(h - 21) / 1.2);
  return { hour: h, night, dusk: Math.min(1, dusk) };
}
const mix = (a, b, t) => a + (b - a) * t;
const mixHex = (a, b, t) => {
  const pa = parseInt(a.slice(1), 16),
    pb = parseInt(b.slice(1), 16);
  let out = 0;
  for (const sh of [16, 8, 0]) out |= Math.round(mix((pa >> sh) & 255, (pb >> sh) & 255, t)) << sh;
  return '#' + out.toString(16).padStart(6, '0');
};
// Colours and intensities for the scene. Night stays readable: deep blue, not black.
export function skyLook(daySeconds) {
  const { night, dusk } = daylight(daySeconds);
  const day = { sky: '#3d97e3', fog: '#c2e0f0', sun: '#ffe9bf' };
  // Sunrise and sunset: the zenith stays blue, the horizon glows.
  const eve = { sky: '#6f93d6', fog: '#f8c79a', sun: '#ffa85a' };
  const dark = { sky: '#0b1830', fog: '#182841', sun: '#9fb6ff' };
  const lit = (k) => mixHex(mixHex(day[k], eve[k], dusk * (1 - night)), dark[k], night);
  return {
    night,
    dusk,
    sky: lit('sky'),
    fog: lit('fog'),
    sunColor: lit('sun'),
    sun: mix(3.3, 0.35, night),
    hemi: mix(1.15, 0.75, night),
    exposure: mix(1.04, 1.05, night),
  };
}
