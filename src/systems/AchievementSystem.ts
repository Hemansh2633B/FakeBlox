export interface Achievement {
  id: string;
  name: string;
  description: string;
  isUnlocked: boolean;
  unlockedDate?: string;
}

export class AchievementSystem {
  private achievements: Achievement[] = [
    { id: 'first_steps', name: 'First Steps', description: 'Complete your first obby', isUnlocked: false },
    { id: 'speed_demon', name: 'Speed Demon', description: 'Complete an obby in under 2 minutes', isUnlocked: false },
    { id: 'persistent', name: 'Never Give Up', description: 'Die 100 times total', isUnlocked: false },
    { id: 'collector', name: 'Star Collector', description: 'Collect all stars in a single run', isUnlocked: false },
    { id: 'flawless', name: 'Flawless Run', description: 'Complete an obby with 0 deaths', isUnlocked: false },
    { id: 'mountaineer', name: 'Mountaineer', description: 'Complete 10 different seeds', isUnlocked: false },
    { id: 'daily_player', name: 'Daily Challenger', description: 'Complete the Daily Challenge', isUnlocked: false },
    { id: 'ice_dancer', name: 'Ice Dancer', description: 'Traverse an ice section without dying', isUnlocked: false },
    { id: 'five_star', name: 'Perfectionist', description: 'Earn a 5-star rating', isUnlocked: false },
    { id: 'explorer', name: 'Secret Finder', description: 'Find a secret area', isUnlocked: false },
    { id: 'endurance', name: 'Endurance Runner', description: 'Reach platform 100 in Endless Mode', isUnlocked: false },
    { id: 'speed_freak', name: 'Speed Freak', description: 'Complete any obby in under 1 minute', isUnlocked: false },
    { id: 'dedicated', name: 'Dedicated Player', description: 'Play for a total of 1 hour', isUnlocked: false },
    { id: 'comeback_kid', name: 'Comeback Kid', description: 'Die 50 times on a single level and finish', isUnlocked: false },
    { id: 'shared_experience', name: 'Social Gamer', description: 'Copy a seed to share with others', isUnlocked: false }
  ];

  public unlock(id: string): void {
    const achievement = this.achievements.find(a => a.id === id);
    if (achievement && !achievement.isUnlocked) {
      achievement.isUnlocked = true;
      achievement.unlockedDate = new Date().toISOString();
      this.showPopup(achievement);
    }
  }

  private showPopup(achievement: Achievement): void {
    console.log(`UNLOCKED: ${achievement.name} - ${achievement.description}`);
  }

  public getAchievements(): Achievement[] {
    return this.achievements;
  }
}
