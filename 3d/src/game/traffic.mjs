// Seagoing traffic and harbour tugs as in engine.js updateTraffic(): ships keep their
// lane, hold back to 30 % (10 % when close) for boats ahead, and wrap round at the map
// ends; tugs shuttle inside their basin, turn smoothly at the ends and turn back when
// blocked for too long. Positions in metres, speeds m/s, times in simulated seconds.
import { MAP } from '../maps/index.mjs';
const SIM_PER_LOGIC = 3; // 2D: tr.s += v * dt * TIME (TIME = 3) per real second

export function createTraffic() {
  return MAP.traffic.map((t) => ({
    ...t,
    h: headingOf(t, Math.sign(t.v)),
    speed: Math.abs(t.v),
    k: 1,
    blockT: 0,
  }));
}
function headingOf(t, dir) {
  return t.axis === 'z' ? (dir > 0 ? Math.PI : 0) : dir > 0 ? Math.PI / 2 : -Math.PI / 2;
}
const turnTo = (h, target, max) => {
  const d = Math.atan2(Math.sin(target - h), Math.cos(target - h));
  return h + Math.max(-max, Math.min(max, d));
};
// boats: [{x, z, h, u}] — the player and the rivals.
export function updateTraffic(traffic, dt, boats = []) {
  void SIM_PER_LOGIC;
  for (const t of traffic) {
    const dir = Math.sign(t.v);
    if (t.axis === 'z') {
      let kn = 1;
      for (const b of boats) {
        const ahead = (b.z - t.z) * dir - t.length / 2;
        if (ahead > -55 && ahead < 110 && Math.abs(b.x - t.x) < 13 + 30) kn = 0;
      }
      t.blockT = kn === 0 ? t.blockT + dt : 0;
      if (t.blockT > 18) {
        t.v = -t.v;
        t.blockT = 0;
      }
      t.k += (kn - t.k) * Math.min(1, dt * 0.6);
      t.z += t.v * t.k * dt;
      if (t.z < t.zMin) t.v = Math.abs(t.v);
      if (t.z > t.zMax) t.v = -Math.abs(t.v);
    } else {
      let k = 1;
      for (const b of boats) {
        const ahead = (b.x - t.x) * dir - t.length / 2;
        if (ahead > -10 && ahead < Math.max(t.length * 1.2, 150) && Math.abs(b.z - t.z) < 13 + 35)
          k = Math.min(k, ahead < 60 ? 0.1 : 0.3);
      }
      t.slow = k < 1;
      t.k += (k - t.k) * Math.min(1, dt * 0.3); // a big ship cannot stop at once
      t.x += t.v * t.k * dt;
      const hw = MAP.halfWidth + 100;
      if (t.v < 0 && t.x < -hw) t.x = hw;
      if (t.v > 0 && t.x > hw) t.x = -hw;
    }
    // Tugs turn round visibly instead of flipping in one frame.
    t.h = turnTo(t.h, headingOf(t, Math.sign(t.v)), dt * 0.35);
    t.speed = Math.abs(t.v * t.k);
  }
  return traffic;
}
// Velocity along its heading for collision response.
export const trafficVelocity = (t) => ({
  x: t.axis === 'z' ? 0 : t.v * t.k,
  z: t.axis === 'z' ? t.v * t.k : 0,
});
