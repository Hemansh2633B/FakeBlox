import { SaveManager } from './SaveManager';

export interface Achievement {
  id: string;
  name: string;
  icon: string;
  description: string;
  isUnlocked: boolean;
  unlockedDate?: string;
}

export interface RunAchievementContext {
  seed: string;
  completionTimeMs: number;
  deaths: number;
  stars: number;
  totalStars: number;
  score: number;
  rating: number;
}

export class AchievementSystem {
  private achievements: Achievement[] = [
    { id: 'first_steps', name: 'First Steps', icon: '🎉', description: 'Complete your first obby', isUnlocked: false },
    { id: 'speed_demon', name: 'Speed Demon', icon: '⚡', description: 'Complete any obby in under 2 minutes', isUnlocked: false },
    { id: 'persistent', name: 'Never Give Up', icon: '💀', description: 'Die 100 times total', isUnlocked: false },
    { id: 'collector', name: 'Star Collector', icon: '🌟', description: 'Collect all stars in a single run', isUnlocked: false },
    { id: 'flawless', name: 'Flawless Run', icon: '😎', description: 'Complete an obby with 0 deaths', isUnlocked: false },
    { id: 'mountaineer', name: 'Mountaineer', icon: '🏔️', description: 'Complete 10 different seeds', isUnlocked: false },
    { id: 'daily_player', name: 'Daily Challenger', icon: '📅', description: 'Complete the Daily Challenge', isUnlocked: false },
    { id: 'ice_dancer', name: 'Ice Dancer', icon: '🧊', description: 'Complete an ice section without dying', isUnlocked: false },
    { id: 'five_star', name: 'Perfectionist', icon: '⭐', description: 'Earn a 5-star rating', isUnlocked: false },
    { id: 'explorer', name: 'Secret Finder', icon: '🔍', description: 'Find a secret area', isUnlocked: false },
    { id: 'endurance', name: 'Endurance Runner', icon: '🏃', description: 'Reach platform 100 in Endless Mode', isUnlocked: false },
    { id: 'speed_freak', name: 'Speed Freak', icon: '🏎️', description: 'Complete any obby in under 1 minute', isUnlocked: false },
    { id: 'dedicated', name: 'Dedicated Player', icon: '🕐', description: 'Play for a total of 1 hour', isUnlocked: false },
    { id: 'comeback_kid', name: 'Comeback Kid', icon: '💪', description: 'Die 50 times on a single level and still finish', isUnlocked: false },
    { id: 'shared_experience', name: 'Social Gamer', icon: '📤', description: 'Copy a seed to share with others', isUnlocked: false },
  ];

  constructor(private readonly save: SaveManager) {
    const persisted = this.save.loadAchievements();
    persisted.forEach((record) => {
      const target = this.achievements.find((achievement) => achievement.id === record.id);
      if (target) {
        target.isUnlocked = true;
        target.unlockedDate = record.unlockedDate;
      }
    });
  }

  public onLevelCompleted(context: RunAchievementContext): Achievement[] {
    const unlocked: Achievement[] = [];
    this.tryUnlock('first_steps', unlocked);
    if (context.completionTimeMs < 120000) this.tryUnlock('speed_demon', unlocked);
    if (context.completionTimeMs < 60000) this.tryUnlock('speed_freak', unlocked);
    if (context.stars === context.totalStars) this.tryUnlock('collector', unlocked);
    if (context.deaths === 0) this.tryUnlock('flawless', unlocked);
    if (context.score >= 17000 || context.rating >= 5) this.tryUnlock('five_star', unlocked);
    if (context.deaths >= 50) this.tryUnlock('comeback_kid', unlocked);
    if (context.seed.startsWith('daily-')) this.tryUnlock('daily_player', unlocked);

    const uniqueSeeds = new Set(Object.keys(this.save.loadAllBestRuns()).map((key) => key.split('_').slice(0, -1).join('_')));
    if (uniqueSeeds.size >= 10) this.tryUnlock('mountaineer', unlocked);

    const stats = this.save.loadStats();
    if (stats.totalPlayTimeMs >= 3_600_000) this.tryUnlock('dedicated', unlocked);

    return unlocked;
  }

  public onDeath(totalDeaths: number): Achievement[] {
    const unlocked: Achievement[] = [];
    if (totalDeaths >= 100) this.tryUnlock('persistent', unlocked);
    return unlocked;
  }

  public onSeedCopied(): Achievement[] {
    const unlocked: Achievement[] = [];
    this.tryUnlock('shared_experience', unlocked);
    return unlocked;
  }

  public getAchievements(): Achievement[] {
    return this.achievements;
  }

  private tryUnlock(id: string, unlocked: Achievement[]): void {
    const achievement = this.achievements.find((item) => item.id === id);
    if (!achievement || achievement.isUnlocked) return;
    achievement.isUnlocked = true;
    achievement.unlockedDate = new Date().toISOString();
    this.persist();
    this.showPopup(achievement);
    unlocked.push(achievement);
  }

  private persist(): void {
    this.save.saveAchievements(
      this.achievements
        .filter((achievement) => achievement.isUnlocked && achievement.unlockedDate)
        .map((achievement) => ({
          id: achievement.id,
          unlockedDate: achievement.unlockedDate as string,
        })),
    );
  }

  private showPopup(achievement: Achievement): void {
    const popup = document.createElement('div');
    popup.innerHTML = `<strong>${achievement.icon} ${achievement.name}</strong><br><span>${achievement.description}</span>`;
    Object.assign(popup.style, {
      position: 'fixed',
      top: '18px',
      right: '18px',
      background: 'rgba(20,20,24,0.95)',
      color: '#fff',
      border: '1px solid #6BCB77',
      borderRadius: '10px',
      padding: '10px 12px',
      zIndex: '1400',
      maxWidth: '300px',
      boxShadow: '0 8px 20px rgba(0,0,0,0.35)',
      transform: 'translateX(120%)',
      transition: 'transform 220ms ease',
      pointerEvents: 'none',
    });
    document.body.appendChild(popup);
    requestAnimationFrame(() => {
      popup.style.transform = 'translateX(0)';
    });
    window.setTimeout(() => {
      popup.style.transform = 'translateX(120%)';
      window.setTimeout(() => popup.remove(), 260);
    }, 4000);
  }
}
