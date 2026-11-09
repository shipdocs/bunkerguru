import { fresh, restore } from '../game/simulation.mjs';
import { GRAPHICS_MODES } from '../render/graphics.mjs';
// These keys are a compatibility contract: changing them loses existing careers/preferences.
export const STORAGE_KEYS = Object.freeze({
  career: 'bunkerguru3d-v1',
  graphics: 'bunkerguru-graphics',
});
export function loadCareer() {
  try {
    return restore(JSON.parse(localStorage.getItem(STORAGE_KEYS.career)));
  } catch {
    return fresh();
  }
}
export function saveCareer(state) {
  try {
    localStorage.setItem(STORAGE_KEYS.career, JSON.stringify(state));
  } catch {
    /* Private mode/quota must not prevent playing. */
  }
}
export function loadGraphicsMode() {
  try {
    const value = localStorage.getItem(STORAGE_KEYS.graphics);
    if (GRAPHICS_MODES.includes(value)) return value;
  } catch {}
  return 'auto';
}
export function saveGraphicsMode(mode) {
  try {
    localStorage.setItem(STORAGE_KEYS.graphics, mode);
  } catch {}
}
// Hall of fame: the five best retirements in this browser (fase 2).
const HALL_KEY = 'bunkerguru3d-hall';
export function loadHall() {
  try {
    const h = JSON.parse(localStorage.getItem(HALL_KEY));
    return Array.isArray(h) ? h.slice(0, 5) : [];
  } catch {
    return [];
  }
}
export function addToHall(entry) {
  const h = [...loadHall(), entry].sort((a, b) => b.score - a.score).slice(0, 5);
  try {
    localStorage.setItem(HALL_KEY, JSON.stringify(h));
  } catch {}
  return h;
}
