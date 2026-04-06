import { Game } from './game/Game';
import { BabylonGame } from './game/BabylonGame';
window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  if (canvas) {
    const params = new URLSearchParams(window.location.search);
    const seed = params.get('seed') || 'hello';
    const difficulty = params.get('difficulty') || 'normal';
    const debug = params.get('debug') === 'true';
    new Game(canvas, { seed, difficulty, debug });
  }
  if (!canvas) return;

  const params = new URLSearchParams(window.location.search);
  const selectedEngine = params.get('engine');

  if (selectedEngine === 'three') {
    new Game(canvas);
    return;
  }

  // Babylon.js is the default base engine.
  new BabylonGame(canvas);
});
