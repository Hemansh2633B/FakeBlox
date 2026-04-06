import { Game } from './game/Game';
import { BabylonGame } from './game/BabylonGame';
window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  if (!canvas) return;

  const params = new URLSearchParams(window.location.search);
  const selectedEngine = params.get('engine');

  if (selectedEngine === 'babylon') {
    new BabylonGame(canvas);
    return;
  }

  // Three.js is the default base engine.
  new Game(canvas);
});
