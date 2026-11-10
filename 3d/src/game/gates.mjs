// Movable bridges and locks (engine.js gates): closed = a wall across the water.
// Call with C near the gate; it opens after prepT and closes again after openT,
// but never on top of a boat. Times in logic seconds of the 2D game (× 3 simulated).
import { MAP, toMap } from '../maps/index.mjs';
const SIM = 3;
export function createGates() {
  return MAP.gates.map((g) => ({ ...g, state: 'closed', T: 0 }));
}
// s: the player, in the world; the gates are map rectangles.
export function nearestGate(gates, s, range = 700) {
  let best = null,
    d0 = range;
  const p = toMap(s.x, s.z);
  for (const g of gates) {
    const d = Math.hypot((g.x0 + g.x1) / 2 - p.x, (g.z0 + g.z1) / 2 - p.z);
    if (d < d0) [best, d0] = [g, d];
  }
  return best;
}
export function callGate(g) {
  if (!g) return 'Geen brug of sluis in de buurt.';
  if (g.state === 'open') return '🟢 ' + g.name + ' is open.';
  if (g.state === 'prep') return '⏳ ' + g.name + ' gaat zo open.';
  g.state = 'prep';
  g.T = g.prepT * SIM;
  return (
    '📻 ' +
    g.name +
    ': "Begrepen, we gaan voor u ' +
    (g.kind === 'brug' ? 'draaien' : 'schutten') +
    '."'
  );
}
// boats: [{x, z}] on the map — keep the gate open while a hull is inside the opening.
export function updateGates(gates, dt, boats, say = () => {}) {
  for (const g of gates) {
    if (g.state === 'prep' && (g.T -= dt) <= 0) {
      g.state = 'open';
      g.T = g.openT * SIM;
      say('🟢 ' + g.name + ' open – doorvaren!');
    } else if (g.state === 'open' && (g.T -= dt) <= 0) {
      const busy = boats.some(
        (b) => b.x > g.x0 - 70 && b.x < g.x1 + 70 && b.z > g.z0 - 70 && b.z < g.z1 + 70,
      );
      if (busy) g.T = 3;
      else {
        g.state = 'closed';
        say('🔴 ' + g.name + ' dicht · C = oproepen');
      }
    }
  }
}
