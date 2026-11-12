import { createGame } from './app/create-game.mjs';
import { watchDom, addPhrases } from './i18n/index.mjs';
import { MAP } from './maps/index.mjs';
import { preloadModels } from './render/models.mjs';
import { modelsNeeded } from './render/landmarks.mjs';
// English overlay: the map's own translations (berth positions), then the page.
addPhrases(MAP.i18n);
watchDom();
// The Blender buildings first (a few seconds at most; without them the game uses its own).
// Only what this map shows: a map without them starts at once.
const needed = modelsNeeded();
if (needed.length) await preloadModels(needed);
try {
  // Exposed for debugging and browser tests (state, world); not a game API.
  globalThis.bunkerguru = createGame();
} catch (error) {
  document.getElementById('failure').hidden = false;
  console.error(error);
}
