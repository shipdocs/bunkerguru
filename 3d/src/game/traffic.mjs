// Seagoing traffic and harbour tugs as in engine.js updateTraffic(): ships keep their
// lane, hold back to 30 % (10 % when close) for boats ahead, and wrap round at the map
// ends; tugs shuttle inside their basin, turn smoothly at the ends and turn back when
// blocked for too long. Positions in metres, speeds m/s, times in simulated seconds.
import { MAP } from '../maps/index.mjs';
const SIM_PER_LOGIC = 3; // 2D: tr.s += v * dt * TIME (TIME = 3) per real second

// The 2D map lists four or five moving ships per harbour. From the deck of the 3D
// game the river then looks empty, so every lane ship gets a companion half a map
// further on: an inland barge on the same lane at the same speed (so the spacing
// holds and the lane stays as safe as the map made it), narrower than its lane mate.
const BARGES = [
  ['MS VOLHARDING', '#7a8f6a'],
  ['MT NOORDSTER', '#8a6f5a'],
  ['MS EENDRACHT', '#5f7f9a'],
  ['MT GESTAAG', '#9a7a4a'],
  ['MS AVONTUUR', '#6f6f8f'],
  ['MT VLIJT', '#a05f4f'],
];
// Antwerpen: only an upbound companion. With a second downbound ship on the Schelde
// the rivals never get across (measured: 0 jobs and 6 tows in 30 minutes).
const BARGE_ONLY = { antwerpen: 1 };
export function withBarges(list, halfWidth, only = 0) {
  // One companion per direction: more than that and the rivals, who give way to lane
  // traffic, no longer get across the river to finish their jobs.
  const lanes = [];
  for (const t of list)
    if (
      t.axis !== 'z' &&
      (!only || Math.sign(t.v) === only) &&
      !lanes.some((o) => Math.sign(o.v) === Math.sign(t.v))
    )
      lanes.push(t);
  const span = 2 * (halfWidth + 100);
  return [
    ...list,
    ...lanes.map((t, i) => {
      const [name, color] = BARGES[i % BARGES.length];
      // Traffic does not give way to traffic: the barge takes the speed of the slowest
      // ship on its lane (so it never runs into one ahead) and the middle of the
      // widest gap on that lane (so it never starts beside one).
      const mates = list.filter(
        (o) => o.axis !== 'z' && o.z === t.z && Math.sign(o.v) === Math.sign(t.v),
      );
      const v = Math.sign(t.v) * Math.min(...mates.map((o) => Math.abs(o.v)));
      const xs = mates.map((o) => o.x).sort((a, b) => a - b);
      let x = t.x + span / 2,
        widest = -1;
      for (let k = 0; k < xs.length; k++) {
        const a = xs[k],
          b = k + 1 < xs.length ? xs[k + 1] : xs[0] + span,
          gap = b - a;
        if (gap > widest) {
          widest = gap;
          x = a + gap / 2;
        }
      }
      if (x > halfWidth + 100) x -= span;
      return {
        ...t,
        v,
        id: list.length + i,
        name,
        color,
        x,
        length: 110 + (i % 2) * 25,
        beam: 11.4,
        barge: true,
      };
    }),
  ];
}
export function createTraffic() {
  const list =
    MAP.id === 'training'
      ? MAP.traffic
      : withBarges(MAP.traffic, MAP.halfWidth, BARGE_ONLY[MAP.id] || 0);
  return list.map((t) => ({
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
