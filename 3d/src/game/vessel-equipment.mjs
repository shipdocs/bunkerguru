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
// Three times the manual speed: in place within ±2.5 s, bunkering lasts 6 s.
export function boomSettings(s, ship) {
  if (s.phase !== 'bunker' || !ship) return s.equipment;
  return { ...s.equipment, boomRaised: true, boomSide: sideOf(s, ship), boomRate: 3 };
}
