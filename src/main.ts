import { Game } from './game/Game';
window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  if (canvas) new Game(canvas);
});
