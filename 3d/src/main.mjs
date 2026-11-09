import { createGame } from './app/create-game.mjs';
try {
  // Exposed for debugging and browser tests (state, world); not a game API.
  globalThis.bunkerguru = createGame();
} catch (error) {
  document.getElementById('failure').hidden = false;
  console.error(error);
}
