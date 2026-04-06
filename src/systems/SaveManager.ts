export class SaveManager {
  private static readonly SETTINGS_KEY = 'obbyGame_settings';
  private static readonly STATS_KEY = 'obbyGame_stats';
  private static readonly RUNS_KEY = 'obbyGame_bestRuns';

  public saveSettings(settings: any): void {
    localStorage.setItem(SaveManager.SETTINGS_KEY, JSON.stringify(settings));
  }

  public loadSettings(): any | null {
    const data = localStorage.getItem(SaveManager.SETTINGS_KEY);
    return data ? JSON.parse(data) : null;
  }

  public saveStats(stats: any): void {
    localStorage.setItem(SaveManager.STATS_KEY, JSON.stringify(stats));
  }

  public loadStats(): any | null {
    const data = localStorage.getItem(SaveManager.STATS_KEY);
    return data ? JSON.parse(data) : null;
  }

  public saveBestRun(seed: string, difficulty: string, runData: any): void {
    const allRuns = this.loadAllBestRuns() || {};
    const key = `${seed}_${difficulty}`;
    if (!allRuns[key] || runData.time < allRuns[key].time) {
      allRuns[key] = runData;
      localStorage.setItem(SaveManager.RUNS_KEY, JSON.stringify(allRuns));
    }
  }

  public loadAllBestRuns(): any | null {
    const data = localStorage.getItem(SaveManager.RUNS_KEY);
    return data ? JSON.parse(data) : null;
  }

  public resetAll(): void {
    localStorage.removeItem(SaveManager.SETTINGS_KEY);
    localStorage.removeItem(SaveManager.STATS_KEY);
    localStorage.removeItem(SaveManager.RUNS_KEY);
  }
}
