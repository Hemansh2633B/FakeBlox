// game/ui.js — DOM manipulation, screen management, event wiring
import { audio } from './audio.js';
import { achievements } from './systems.js';

function randomInt(maxExclusive) {
  if (window.crypto && window.crypto.getRandomValues) {
    const buf = new Uint32Array(1);
    window.crypto.getRandomValues(buf);
    return buf[0] % maxExclusive;
  }
  return Math.floor(Math.random() * maxExclusive);
}

function generateSeed() {
  // Generate an unsigned 64-bit integer seed represented as a decimal string.
  const hi = BigInt(randomInt(0x100000000));
  const lo = BigInt(randomInt(0x100000000));
  return ((hi << 32n) | lo).toString();
}

/**
 * Wires all DOM event listeners for menus, buttons, sliders, etc.
 * @param {import('./main.js').Game} game
 */
export function wireUI(game) {
  // Audio context resume on first user interaction
  const resumeAudio = () => {
    audio.init();
    audio.userInteracted = true;
    audio.resumeContext();
    document.removeEventListener('click', resumeAudio);
  };
  document.addEventListener('click', resumeAudio, { once: true });

  // Difficulty buttons
  document.querySelectorAll('.diff-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      audio.init();
      audio.uiClick();
    });
    btn.addEventListener('mouseenter', () => { audio.uiHover(); });
  });

  // Random seed
  document.getElementById('btn-random-seed').addEventListener('click', () => {
    document.getElementById('seed-input').value = generateSeed();
    audio.init();
    audio.uiClick();
  });

  // Paste seed
  document.getElementById('btn-paste-seed').addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      document.getElementById('seed-input').value = text;
    } catch (e) {}
    audio.init();
    audio.uiClick();
  });

  // Play
  document.getElementById('btn-play').addEventListener('click', () => {
    const seed = document.getElementById('seed-input').value || generateSeed();
    const diff = document.querySelector('.diff-btn.active')?.dataset.diff || 'normal';
    game.startLevel(seed, diff);
  });

  // Daily challenge
  document.getElementById('btn-daily').addEventListener('click', () => {
    const today = new Date();
    const seed = `daily_${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    document.getElementById('seed-input').value = seed;
    game.startLevel(seed, 'normal');
  });

  // Endless mode
  document.getElementById('btn-endless').addEventListener('click', () => {
    const seed = document.getElementById('seed-input').value || `endless-${generateSeed()}`;
    const diff = document.querySelector('.diff-btn.active')?.dataset.diff || 'normal';
    game.startLevel(seed, diff, true);
  });

  // Pause menu
  document.getElementById('btn-resume').addEventListener('click', () => game.handleResume());
  document.getElementById('btn-restart').addEventListener('click', () => {
    game.handleResume();
    game.startLevel(game.currentSeed, game.currentDifficulty, game.isEndless);
  });
  document.getElementById('btn-quit').addEventListener('click', () => game.returnToMenu());

  // End screen
  document.getElementById('btn-play-again').addEventListener('click', () => {
    document.getElementById('end-screen').classList.remove('visible');
    game.startLevel(game.currentSeed, game.currentDifficulty);
  });
  document.getElementById('btn-new-seed').addEventListener('click', () => {
    document.getElementById('end-screen').classList.remove('visible');
    game.returnToMenu();
    document.getElementById('btn-random-seed').click();
  });
  document.getElementById('btn-end-menu').addEventListener('click', () => {
    document.getElementById('end-screen').classList.remove('visible');
    game.returnToMenu();
  });

  // Copy seed
  document.getElementById('btn-copy-seed').addEventListener('click', () => {
    navigator.clipboard.writeText(game.currentSeed).then(() => {
      game.showNotification('📋 Seed copied!');
      achievements.unlock('social');
    });
  });
  document.getElementById('hud-seed').addEventListener('click', () => {
    navigator.clipboard.writeText(game.currentSeed).then(() => {
      game.showNotification('📋 Seed copied!');
      achievements.unlock('social');
    });
  });

  // Volume sliders
  document.getElementById('music-vol').addEventListener('input', (e) => {
    audio.setMusicVol(e.target.value / 100);
  });
  document.getElementById('sfx-vol').addEventListener('input', (e) => {
    audio.setSfxVol(e.target.value / 100);
  });

  // URL params seed
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('seed')) {
    document.getElementById('seed-input').value = urlParams.get('seed');
    if (urlParams.has('difficulty')) {
      const d = urlParams.get('difficulty');
      document.querySelectorAll('.diff-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.diff === d);
      });
    }
  } else if (!document.getElementById('seed-input').value) {
    document.getElementById('seed-input').value = generateSeed();
  }

  // Prevent context menu globally
  document.addEventListener('contextmenu', e => e.preventDefault());
}

/**
 * Updates the HUD display.
 */
export function updateHUD(game) {
  document.getElementById('hud-timer').textContent = formatTime(game.timer);
  document.getElementById('hud-deaths').textContent = `💀 ${game.deaths}`;
  document.getElementById('hud-stars').textContent = `⭐ ${game.starsCollected} / ${game.totalStars}`;
  const totalCp = game.levelData ? game.levelData.checkpoints.length - 1 : 0;
  document.getElementById('hud-checkpoint').textContent = `📍 Checkpoint ${game.currentCheckpoint}/${totalCp}`;
}

/**
 * Formats milliseconds into MM:SS.mmm.
 */
export function formatTime(ms) {
  const totalMs = Math.floor(ms);
  const mins = Math.floor(totalMs / 60000);
  const secs = Math.floor((totalMs % 60000) / 1000);
  const millis = totalMs % 1000;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(millis).padStart(3, '0')}`;
}

/**
 * Shows a centered notification that fades out.
 */
export function showNotification(text) {
  const el = document.getElementById('hud-notify');
  el.textContent = text;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 1500);
}
