// game/systems.js — SaveManager, Achievements
import { audio } from './audio.js';

export class SaveManager {
  prefix = 'obbyRunner_';

  save(key, data) {
    try { localStorage.setItem(this.prefix + key, JSON.stringify(data)); } catch (e) {}
  }

  load(key, def) {
    try {
      const r = localStorage.getItem(this.prefix + key);
      return r ? { ...def, ...JSON.parse(r) } : def;
    } catch (e) { return def; }
  }

  saveBestRun(seed, diff, run) {
    const runs = this.load('bestRuns', {});
    const k = `${seed}_${diff}`;
    if (!runs[k] || run.score > runs[k].score) {
      runs[k] = run;
      this.save('bestRuns', runs);
    }
  }
}

export const saveManager = new SaveManager();

export const ACHIEVEMENTS = [
  { id: 'first_steps', name: 'First Steps', icon: '🎉', desc: 'Complete your first obby' },
  { id: 'speed_demon', name: 'Speed Demon', icon: '⚡', desc: 'Complete in under 2 minutes' },
  { id: 'persistent', name: 'Never Give Up', icon: '💀', desc: 'Die 100 times total' },
  { id: 'flawless', name: 'Flawless Run', icon: '😎', desc: 'Complete with 0 deaths' },
  { id: 'collector', name: 'Star Collector', icon: '🌟', desc: 'Collect all stars in a run' },
  { id: 'five_star', name: 'Perfectionist', icon: '⭐', desc: 'Earn a 5-star rating' },
  { id: 'social', name: 'Social Gamer', icon: '📤', desc: 'Copy a seed to share' },
];

export class AchievementSystem {
  constructor() {
    this.unlocked = saveManager.load('achievements', []);
  }

  check(id) { return this.unlocked.includes(id); }

  unlock(id) {
    if (this.check(id)) return;
    this.unlocked.push(id);
    saveManager.save('achievements', this.unlocked);
    const a = ACHIEVEMENTS.find(x => x.id === id);
    if (a) this.showToast(a);
  }

  showToast(a) {
    const el = document.getElementById('achievement-toast');
    document.getElementById('ach-text').textContent = `${a.icon} ${a.name}`;
    document.getElementById('ach-desc').textContent = a.desc;
    el.classList.add('show');
    audio.achievement();
    setTimeout(() => el.classList.remove('show'), 4000);
  }
}

export const achievements = new AchievementSystem();
