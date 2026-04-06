import { randomSeed, toDailySeed } from '../utils/seed';

export class MainMenu {
  private element: HTMLElement;
  private seedInput: HTMLInputElement;
  private difficultySelect: HTMLSelectElement;
  private playButton: HTMLButtonElement;
  private randomSeedButton: HTMLButtonElement;
  private dailySeedButton: HTMLButtonElement;
  private copySeedButton: HTMLButtonElement;
  private pasteSeedButton: HTMLButtonElement;
  private onPlay: (seed: string, difficulty: string) => void;

  constructor(onPlay: (seed: string, difficulty: string) => void, initialSeed = 'hello', initialDifficulty = 'normal') {
    this.onPlay = onPlay;
    this.element = document.createElement('div');
    this.element.id = 'main-menu';
    this.element.innerHTML = `
      <h1>FAKEBLOX</h1>
      <div class="menu-form">
        <label for="menu-seed">Seed:</label>
        <input type="text" id="menu-seed" value="${initialSeed}">
        <div class="seed-actions">
          <button id="menu-random-seed" type="button">🎲 Random Seed</button>
          <button id="menu-daily-seed" type="button">📅 Daily Seed</button>
          <button id="menu-copy-seed" type="button">📤 Copy</button>
          <button id="menu-paste-seed" type="button">📋 Paste</button>
        </div>
        <label for="menu-difficulty">Difficulty:</label>
        <select id="menu-difficulty">
          <option value="easy">Easy</option>
          <option value="normal">Normal</option>
          <option value="hard">Hard</option>
          <option value="extreme">Extreme</option>
        </select>
        <button id="menu-play">Play Now</button>
      </div>`;

    this.seedInput = this.element.querySelector('#menu-seed') as HTMLInputElement;
    this.difficultySelect = this.element.querySelector('#menu-difficulty') as HTMLSelectElement;
    this.playButton = this.element.querySelector('#menu-play') as HTMLButtonElement;
    this.randomSeedButton = this.element.querySelector('#menu-random-seed') as HTMLButtonElement;
    this.dailySeedButton = this.element.querySelector('#menu-daily-seed') as HTMLButtonElement;
    this.copySeedButton = this.element.querySelector('#menu-copy-seed') as HTMLButtonElement;
    this.pasteSeedButton = this.element.querySelector('#menu-paste-seed') as HTMLButtonElement;

    this.difficultySelect.value = initialDifficulty;
    this.playButton.onclick = () => this.onPlay(this.seedInput.value.trim() || 'hello', this.difficultySelect.value);
    this.randomSeedButton.onclick = () => {
      this.seedInput.value = randomSeed();
    };
    this.dailySeedButton.onclick = () => {
      this.seedInput.value = toDailySeed();
      this.difficultySelect.value = 'normal';
    };
    this.copySeedButton.onclick = () => {
      void navigator.clipboard?.writeText(this.seedInput.value.trim() || 'hello');
    };
    this.pasteSeedButton.onclick = () => {
      void navigator.clipboard?.readText().then((value) => {
        if (value.trim().length > 0) this.seedInput.value = value.trim();
      });
    };

    document.getElementById('ui-container')?.appendChild(this.element);
    this.applyStyles();
  }

  private applyStyles(): void {
    Object.assign(this.element.style, {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: 'rgba(0,0,0,0.8)',
      padding: '40px',
      borderRadius: '20px',
      color: 'white',
      textAlign: 'center',
      minWidth: '320px',
      border: '4px solid #fff',
      boxShadow: '0 0 20px rgba(0,0,0,0.5)',
      pointerEvents: 'auto',
    });
  }

  public getSeed(): string {
    return this.seedInput.value.trim() || 'hello';
  }

  public getDifficulty(): string {
    return this.difficultySelect.value;
  }

  public setVisible(visible: boolean): void {
    this.element.style.display = visible ? 'block' : 'none';
  }
}
