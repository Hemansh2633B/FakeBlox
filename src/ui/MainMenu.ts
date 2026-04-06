import { randomSeed, toDailySeed } from '../utils/seed';

export class MainMenu {
  private element: HTMLElement;
  private seedInput: HTMLInputElement;
  private difficultySelect: HTMLSelectElement;
  private playButton: HTMLButtonElement;
  private randomSeedButton: HTMLButtonElement;
  private copySeedButton: HTMLButtonElement;
  private pasteSeedButton: HTMLButtonElement;
  private dailyChallengeButton: HTMLButtonElement;
  private onPlay: (seed: string, difficulty: string) => void;

  constructor(onPlay: (seed: string, difficulty: string) => void) {
    this.onPlay = onPlay;
    this.element = document.createElement('div');
    this.element.id = 'main-menu';
    this.element.innerHTML = `
      <h1>FAKEBLOX</h1>
      <div class="menu-form">
        <label for="menu-seed">Seed:</label>
        <input type="text" id="menu-seed" value="hello" maxlength="64">
        <div class="menu-seed-actions">
          <button id="menu-random-seed" type="button">🎲 Random</button>
          <button id="menu-copy-seed" type="button">📋 Copy</button>
          <button id="menu-paste-seed" type="button">📥 Paste</button>
        </div>

        <label for="menu-difficulty">Difficulty:</label>
        <select id="menu-difficulty">
          <option value="easy">Easy</option>
          <option value="normal" selected>Normal</option>
          <option value="hard">Hard</option>
          <option value="extreme">Extreme</option>
        </select>

        <button id="menu-play">Play Now</button>
        <button id="menu-daily" type="button">📅 Daily Challenge</button>
      </div>`;

    this.seedInput = this.element.querySelector('#menu-seed') as HTMLInputElement;
    this.difficultySelect = this.element.querySelector('#menu-difficulty') as HTMLSelectElement;
    this.playButton = this.element.querySelector('#menu-play') as HTMLButtonElement;
    this.randomSeedButton = this.element.querySelector('#menu-random-seed') as HTMLButtonElement;
    this.copySeedButton = this.element.querySelector('#menu-copy-seed') as HTMLButtonElement;
    this.pasteSeedButton = this.element.querySelector('#menu-paste-seed') as HTMLButtonElement;
    this.dailyChallengeButton = this.element.querySelector('#menu-daily') as HTMLButtonElement;

    this.playButton.onclick = () => this.onPlay(this.seedInput.value.trim() || 'default', this.difficultySelect.value);
    this.randomSeedButton.onclick = () => {
      this.seedInput.value = MainMenu.createRandomSeed();
      this.seedInput.focus();
      this.seedInput.select();
    };
    this.copySeedButton.onclick = async () => {
      const value = this.seedInput.value.trim() || 'default';
      await navigator.clipboard.writeText(value);
      this.copySeedButton.innerText = '✅ Copied';
      window.setTimeout(() => (this.copySeedButton.innerText = '📋 Copy'), 1200);
    };
    this.pasteSeedButton.onclick = async () => {
      const fromClipboard = await navigator.clipboard.readText();
      if (fromClipboard.trim()) {
        this.seedInput.value = fromClipboard.trim();
      }
    };
    this.dailyChallengeButton.onclick = () => {
      const dailySeed = MainMenu.getDailySeedLabel();
      this.seedInput.value = dailySeed;
      this.difficultySelect.value = 'normal';
      this.onPlay(dailySeed, 'normal');
    };

    document.getElementById('ui-container')?.appendChild(this.element);
    this.applyStyles();
  }

  public setInitialValues(seed: string, difficulty: string): void {
    this.seedInput.value = seed;
    this.difficultySelect.value = difficulty;
  }

  public static getDailySeedLabel(): string {
    const todayIso = new Date().toISOString().slice(0, 10);
    return `DAILY_${todayIso}_OBBY_CHALLENGE`;
  }

  private static createRandomSeed(): string {
    return `seed_${Date.now().toString(36)}_${Math.floor(Math.random() * 10000)}`;
  }

  private applyStyles(): void {
    Object.assign(this.element.style, {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: 'rgba(0,0,0,0.8)',
      padding: '28px',
      borderRadius: '20px',
      color: 'white',
      textAlign: 'center',
      minWidth: '360px',
      border: '4px solid #fff',
      boxShadow: '0 0 20px rgba(0,0,0,0.5)',
      pointerEvents: 'auto',
    });
  }

  public setVisible(visible: boolean): void {
    this.element.style.display = visible ? 'block' : 'none';
  }
}
