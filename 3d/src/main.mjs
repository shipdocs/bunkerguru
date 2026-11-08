import { createGame } from './app/create-game.mjs';
try {
  createGame();
} catch (error) {
  document.getElementById('failure').hidden = false;
  console.error(error);
}
