import { createGame } from './app/create-game.mjs';
import { watchDom, addPhrases } from './i18n/index.mjs';
import { MAP } from './maps/index.mjs';
// English overlay: the map's own translations (berth positions), then the page.
addPhrases(MAP.i18n);
watchDom();
try {
  // Exposed for debugging and browser tests (state, world); not a game API.
  globalThis.bunkerguru = createGame();
} catch (error) {
  document.getElementById('failure').hidden = false;
  console.error(error);
}
