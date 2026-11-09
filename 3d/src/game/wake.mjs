// Numbers behind the water effects around the ship (engine.js particlesTick,
// drawKelvin, drawBowWave, drawTrailWake). Pure: no Three.js, no DOM.
// navigation-effects.mjs draws them.
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const KELVIN_HALF_ANGLE = (19.5 * Math.PI) / 180;
export const KELVIN_SLOPE = Math.tan(KELVIN_HALF_ANGLE);
export const FULL_SPEED = 6; // m/s through the water at which every effect is at full strength
export const SPRAY_MIN_SPEED = 1.5; // no bow wave or spray below this
export const WASH_MIN_RPM = 0.12;
// Fixed pool sizes; phones (quality.light) get fewer particles and no spray.
export function wakePools(light) {
  return light
    ? { spray: 0, wash: 40, trail: 28, spacing: 9 }
    : { spray: 48, wash: 96, trail: 56, spacing: 5 };
}
// 0…1 strength of the wake (V arms and trailing band): only when making headway.
export const wakeStrength = (speed) => clamp((speed - 0.3) / (FULL_SPEED - 0.3), 0, 1);
// 0…1 strength of the bow collar; exactly 0 up to SPRAY_MIN_SPEED.
export const bowStrength = (speed) =>
  clamp((speed - SPRAY_MIN_SPEED) / (FULL_SPEED - SPRAY_MIN_SPEED), 0, 1);
// Spray puffs per second from each bow shoulder.
export const sprayRate = (speed, light = false) => (light ? 0 : bowStrength(speed) * 26);
// Prop wash from engine power alone: strength 0…1, dir −1 = thrown astern (engine
// ahead), +1 = thrown forward along the hull (engine astern). per second = rate.
export function propWash(rpm, light = false) {
  const power = Math.min(1, Math.abs(rpm || 0));
  if (power <= WASH_MIN_RPM) return { strength: 0, dir: 0, rate: 0, speed: 0 };
  return {
    strength: power,
    dir: rpm > 0 ? -1 : 1,
    rate: power * (light ? 16 : 38),
    speed: 2.5 + power * 5.5,
  };
}
// Bow thruster: bow > 0 pushes the bow to starboard, so the jet leaves to port.
// side: −1 port, +1 starboard, 0 off.
export function thrusterWash(bow, light = false) {
  const side = bow > 0 ? -1 : bow < 0 ? 1 : 0;
  return { side, rate: side ? (light ? 12 : 28) : 0, speed: side ? 9 : 0 };
}
// Half the width between the V arms at a distance along the track behind the stern.
export const kelvinHalfWidth = (dist, beam) => beam * 0.3 + Math.max(0, dist) * KELVIN_SLOPE;
// How far the arms reach behind the stern (as drawKelvin: 0.8…2.4 ship lengths).
export const kelvinLength = (length, k) => (k <= 0.05 ? 0 : length * (0.8 + 1.6 * k));
// Recent stern positions in a fixed ring: the wake follows where she has really
// been, not where she points. at(i): i = 0 is the newest point.
export function createTrail(size, spacing) {
  const xs = new Float32Array(size),
    zs = new Float32Array(size);
  let head = 0;
  const trail = {
    size,
    spacing,
    count: 0,
    // Stores the point once she has moved a full spacing; a jump clears the trail.
    push(x, z) {
      if (trail.count) {
        const d = Math.hypot(x - xs[head], z - zs[head]);
        if (d > trail.spacing * 8) trail.count = 0;
        else if (d < trail.spacing) return false;
      }
      head = (head + 1) % size;
      xs[head] = x;
      zs[head] = z;
      if (trail.count < size) trail.count++;
      return true;
    },
    x: (i) => xs[(head - i + size * 2) % size],
    z: (i) => zs[(head - i + size * 2) % size],
    clear() {
      trail.count = 0;
    },
  };
  return trail;
}
