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
