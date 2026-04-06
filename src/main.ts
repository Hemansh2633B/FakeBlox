import { Game } from './game/Game';
window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  if (canvas) {
    const params = new URLSearchParams(window.location.search);
    const seed = params.get('seed') || 'hello';
    const difficulty = params.get('difficulty') || 'normal';
    const debug = params.get('debug') === 'true';
    new Game(canvas, { seed, difficulty, debug });
  }
});
