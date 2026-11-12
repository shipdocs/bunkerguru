// The sounds of the harbour round the ship: gulls over the quays, now and then a ship's
// horn in the distance, cranes clanking when you pass close, the bell of a bridge that is
// about to open. Pure: it only decides what to play and how loud (0…1); the sound engine
// (legacy-audio.mjs) makes the noise. Volume falls with distance.
const near = (d, range) => Math.max(0, 1 - d / range);

// rnd: () => 0…1 (Math.random by default, a fixed sequence in tests).
export function createAmbience(rnd = Math.random) {
  let gullT = 3 + rnd() * 6,
    hornT = 40 + rnd() * 60,
    clankT = 2,
    bellT = 0;
  return {
    // s: the player (x, z); world: traffic, gates; places: { shoreDist(x, z), cranes: [{x, z}] }
    tick(dt, s, world, places) {
      const out = [];
      // Gulls: always some about, loudest along the quays.
      if ((gullT -= dt) <= 0) {
        const shore = places.shoreDist ? places.shoreDist(s.x, s.z) : 200;
        out.push({ kind: 'gull', vol: 0.03 + 0.07 * near(shore, 300) });
        gullT = 5 + rnd() * 12;
      }
      // A horn from the nearest sea-going ship under way, muffled by the distance.
      if ((hornT -= dt) <= 0) {
        let best = Infinity;
        for (const b of world.traffic || [])
          if ((b.length || 0) >= 80)
            best = Math.min(best, Math.hypot((b.wx ?? b.x) - s.x, (b.wz ?? b.z) - s.z));
        const v = 0.28 * near(best, 3000);
        if (v > 0.02) out.push({ kind: 'distantHorn', vol: v });
        hornT = 70 + rnd() * 110;
      }
      // Cranes at work: a clank now and then when you are close to one.
      if ((clankT -= dt) <= 0) {
        let best = Infinity;
        for (const c of places.cranes || [])
          best = Math.min(best, Math.hypot(c.x - s.x, c.z - s.z));
        const v = 0.12 * near(best, 450);
        if (v > 0.01) out.push({ kind: 'clank', vol: v });
        clankT = 3 + rnd() * 7;
      }
      // A movable bridge about to open rings its bell.
      if ((bellT -= dt) <= 0) {
        bellT = 1.1;
        for (const g of world.gates || []) {
          if (g.state !== 'prep') continue;
          const gx = g.wx ?? (g.x0 + g.x1) / 2,
            gz = g.wz ?? (g.z0 + g.z1) / 2,
            v = 0.15 * near(Math.hypot(gx - s.x, gz - s.z), 900);
          if (v > 0.01) out.push({ kind: 'bell', vol: v });
        }
      }
      return out;
    },
  };
}
