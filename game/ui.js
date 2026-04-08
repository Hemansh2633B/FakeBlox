// game/ui.js — DOM manipulation, screen management, event wiring
import { audio } from './audio.js';
import { achievements, saveManager } from './systems.js';

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
  const byId = (id) => document.getElementById(id);
  const on = (id, event, handler, options) => {
    const el = byId(id);
    if (!el) return null;
    el.addEventListener(event, handler, options);
    return el;
  };
  const seedInput = byId('seed-input');

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
  on('btn-random-seed', 'click', () => {
    if (seedInput) seedInput.value = generateSeed();
    audio.init();
    audio.uiClick();
  });

  // Paste seed
  on('btn-paste-seed', 'click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (seedInput) seedInput.value = text;
    } catch (e) {}
    audio.init();
    audio.uiClick();
  });

  // Play
  on('btn-play', 'click', () => {
    const seed = seedInput?.value || generateSeed();
    const diff = document.querySelector('.diff-btn.active')?.dataset.diff || 'normal';
    game.startLevel(seed, diff);
  });

  // Daily challenge
  on('btn-daily', 'click', () => {
    const today = new Date();
    const seed = `daily_${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    if (seedInput) seedInput.value = seed;
    game.startLevel(seed, 'normal');
  });

  // Endless mode
  on('btn-endless', 'click', () => {
    const seed = seedInput?.value || `endless-${generateSeed()}`;
    const diff = document.querySelector('.diff-btn.active')?.dataset.diff || 'normal';
    game.startLevel(seed, diff, true);
  });

  // Pause menu
  on('btn-resume', 'click', () => game.handleResume());
  on('btn-restart', 'click', () => {
    game.handleResume();
    game.startLevel(game.currentSeed, game.currentDifficulty, game.isEndless);
  });
  on('btn-quit', 'click', () => game.returnToMenu());

  // End screen
  on('btn-play-again', 'click', () => {
    byId('end-screen')?.classList.remove('visible');
    game.startLevel(game.currentSeed, game.currentDifficulty);
  });
  on('btn-new-seed', 'click', () => {
    byId('end-screen')?.classList.remove('visible');
    game.returnToMenu();
    byId('btn-random-seed')?.click();
  });
  on('btn-end-menu', 'click', () => {
    byId('end-screen')?.classList.remove('visible');
    game.returnToMenu();
  });

  // Copy seed
  on('btn-copy-seed', 'click', () => {
    navigator.clipboard.writeText(game.currentSeed).then(() => {
      game.showNotification('📋 Seed copied!');
      achievements.unlock('social');
    });
  });
  on('hud-seed', 'click', () => {
    navigator.clipboard.writeText(game.currentSeed).then(() => {
      game.showNotification('📋 Seed copied!');
      achievements.unlock('social');
    });
  });

  // Graphics settings
  const qualityEl = byId('graphics-quality');
  const fpsEl = byId('fps-limit');
  const backendEl = byId('renderer-backend');
  if (qualityEl && fpsEl && backendEl) {
    const savedGraphics = saveManager.load('graphics', { quality: 'ultra', fpsCap: 0, backend: 'auto' });
    qualityEl.value = savedGraphics.quality || 'ultra';
    fpsEl.value = String(savedGraphics.fpsCap ?? 0);
    backendEl.value = savedGraphics.backend || 'auto';
    const applyGraphics = () => {
      game.applyGraphicsSettings({
        quality: qualityEl.value,
        fpsCap: Number(fpsEl.value),
        backend: backendEl.value,
      });
    };
    qualityEl.addEventListener('change', applyGraphics);
    fpsEl.addEventListener('change', applyGraphics);
    backendEl.addEventListener('change', applyGraphics);
    applyGraphics();
  }

  // Volume sliders
  on('music-vol', 'input', (e) => {
    audio.setMusicVol(e.target.value / 100);
  });
  on('sfx-vol', 'input', (e) => {
    audio.setSfxVol(e.target.value / 100);
  });

  // URL params seed
  const urlParams = new URLSearchParams(window.location.search);
  if (seedInput && urlParams.has('seed')) {
    seedInput.value = urlParams.get('seed');
    if (urlParams.has('difficulty')) {
      const d = urlParams.get('difficulty');
      document.querySelectorAll('.diff-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.diff === d);
      });
    }
  } else if (seedInput && !seedInput.value) {
    seedInput.value = generateSeed();
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
