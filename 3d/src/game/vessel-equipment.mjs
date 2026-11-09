// Cosmetic equipment only: never changes propulsion, pumping or collision rules.
export function restoreEquipment(raw = {}) {
  return {
    radar: typeof raw?.radar === 'boolean' ? raw.radar : true,
    navigation: typeof raw?.navigation === 'boolean' ? raw.navigation : true,
    deck: raw?.deck === true,
    cabin: raw?.cabin === true,
    boomSide: [-1, 0, 1].includes(raw?.boomSide) ? raw.boomSide : 0,
    boomRaised: raw?.boomRaised === true,
  };
}

// Which side the customer ship lies on: −1 port, +1 starboard. Heading h: bow along
// (sin h, −cos h), starboard along (cos h, sin h) in world x/z.
export function sideOf(s, ship) {
  const dx = ship.shipX - s.x,
    dz = ship.shipZ - s.z;
  return dx * Math.cos(s.h) + dz * Math.sin(s.h) < 0 ? -1 : 1;
}

// While delivering the boom goes up and swings over the customer; afterwards it
// follows the switches again (stowed once underway). The saved setting is untouched.
// The manual move takes ±7.5 s; while delivering it speeds up so the hose is over the
// customer within 40 % of the pumping time (bunkerSeconds, real seconds: 6, 4 or 2.5).
export function boomSettings(s, ship, bunkerSeconds = 6) {
  if (s.phase !== 'bunker' || !ship) return s.equipment;
  const boomRate = Math.max(1, 7.5 / (0.4 * Math.max(0.5, bunkerSeconds)));
  return { ...s.equipment, boomRaised: true, boomSide: sideOf(s, ship), boomRate };
}
