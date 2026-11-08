// Physics uses metres, m/s, radians and seconds. Scene uses one unit/metre.
// motor/bow are the original normalized force coefficients, not horsepower.
export const PROFILES = Object.freeze({
  compact: Object.freeze({
    id: 'compact',
    name: 'Bunkerguru Compact',
    length: 44,
    beam: 7.5,
    tankCapacity: 500,
    motor: 6.2,
    bow: 1,
  }),
  legacy: Object.freeze({
    id: 'legacy',
    name: 'Bunkerguru 110',
    length: 110,
    beam: 11,
    tankCapacity: 1200,
    motor: 6.2,
    bow: 1,
  }),
  large: Object.freeze({
    id: 'large',
    name: 'Bunkerguru 135',
    length: 135,
    beam: 11.45,
    tankCapacity: 2000,
    motor: 6.2,
    bow: 1,
  }),
});
export const SHIP = Object.freeze({
  ...PROFILES.legacy,
  maxRudder: 60,
  worldScale: 1,
  legacyTimeScale: 3,
});
export const profileOf = (s) => PROFILES[s?.shipId] || PROFILES.legacy;
export const toWorld = (m) => m; // Identity: renderer must not silently rescale physics.
export const yawFactor = (p) => Math.pow(40 / p.length, 0.7); // Original length-dependent law.
export const HULL_SAMPLES = Object.freeze([-0.46, -0.31, -0.15, 0, 0.15, 0.31, 0.46]);
// Keep the original seven samples for the compact hull. Longer hulls need
// overlapping probe circles too: fixed seven probes leave collision gaps.
const sampleCache = new Map();
export function hullSamples(p) {
  if (!sampleCache.has(p.id)) {
    const intervals = Math.max(6, Math.ceil((0.92 * p.length) / (p.beam * 0.9)));
    sampleCache.set(
      p.id,
      intervals === 6
        ? HULL_SAMPLES
        : Object.freeze(
            Array.from({ length: intervals + 1 }, (_, i) => -0.46 + (0.92 * i) / intervals),
          ),
    );
  }
  return sampleCache.get(p.id);
}

// Shape proportions transferred from the original 110 m tanker outline.
export function hullOutline(p = SHIP) {
  const L = p.length,
    B = p.beam;
  return [
    ['moveTo', -B / 2, L * (0.5 - 4 / 220)],
    ['lineTo', -B / 2, -L * (0.5 - 16 / 220)],
    ['quadraticCurveTo', 0, -L * (0.5 + 6 / 220), B / 2, -L * (0.5 - 16 / 220)],
    ['lineTo', B / 2, L * (0.5 - 4 / 220)],
    ['quadraticCurveTo', 0, L * (0.5 + 3 / 220), -B / 2, L * (0.5 - 4 / 220)],
  ];
}
