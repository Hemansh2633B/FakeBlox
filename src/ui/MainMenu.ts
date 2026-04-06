function createDailySeedString(): string {
  const now = new Date();
  const date = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
  return `DAILY_${date}_OBBY_CHALLENGE`;
}

export class MainMenu {
  private element: HTMLElement;
  private seedInput: HTMLInputElement;
  private difficultySelect: HTMLSelectElement;
  private playButton: HTMLButtonElement;
  private randomSeedButton: HTMLButtonElement;
  private copySeedButton: HTMLButtonElement;
  private pasteSeedButton: HTMLButtonElement;
  private dailySeedButton: HTMLButtonElement;
  private onPlay: (seed: string, difficulty: string) => void;

  constructor(onPlay: (seed: string, difficulty: string) => void) {
    this.onPlay = onPlay;
    this.element = document.createElement('div');
    this.element.id = 'main-menu';
    this.element.innerHTML = `
      <h1>FAKEBLOX</h1>
      <div class="menu-form">
        <label for="menu-seed">Seed:</label>
        <input type="text" id="menu-seed" value="hello" autocomplete="off" />
        <div class="seed-actions">
          <button id="menu-random-seed" type="button">🎲 Random Seed</button>
          <button id="menu-copy-seed" type="button">📋 Copy Seed</button>
          <button id="menu-paste-seed" type="button">📥 Paste Seed</button>
          <button id="menu-daily-seed" type="button">📅 Daily Challenge</button>
        </div>
        <label for="menu-difficulty">Difficulty:</label>
        <select id="menu-difficulty">
          <option value="easy">Easy</option>
          <option value="normal" selected>Normal</option>
          <option value="hard">Hard</option>
          <option value="extreme">Extreme</option>
        </select>
        <button id="menu-play">Play Now</button>
      </div>
    `;

    this.seedInput = this.element.querySelector('#menu-seed') as HTMLInputElement;
    this.difficultySelect = this.element.querySelector('#menu-difficulty') as HTMLSelectElement;
    this.playButton = this.element.querySelector('#menu-play') as HTMLButtonElement;
    this.randomSeedButton = this.element.querySelector('#menu-random-seed') as HTMLButtonElement;
    this.copySeedButton = this.element.querySelector('#menu-copy-seed') as HTMLButtonElement;
    this.pasteSeedButton = this.element.querySelector('#menu-paste-seed') as HTMLButtonElement;
    this.dailySeedButton = this.element.querySelector('#menu-daily-seed') as HTMLButtonElement;

    this.playButton.onclick = () => {
      const seed = this.getSeed();
      this.onPlay(seed, this.difficultySelect.value);
    };

    this.randomSeedButton.onclick = () => {
      this.seedInput.value = this.generateRandomSeed();
      this.seedInput.focus();
      this.seedInput.select();
    };

    this.copySeedButton.onclick = () => {
      void this.copySeedToClipboard(this.getSeed());
    };

    this.pasteSeedButton.onclick = () => {
      void this.pasteSeedFromClipboard();
    };

    this.dailySeedButton.onclick = () => {
      this.seedInput.value = createDailySeedString();
      this.difficultySelect.value = 'normal';
    };

    document.getElementById('ui-container')?.appendChild(this.element);
    this.applyStyles();
  }

  private generateRandomSeed(): string {
    const randomValue = crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
    return `seed_${randomValue}`;
  }

  private async copySeedToClipboard(seed: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(seed);
      this.copySeedButton.textContent = '✅ Copied';
      window.setTimeout(() => {
        this.copySeedButton.textContent = '📋 Copy Seed';
      }, 1000);
    } catch {
      this.copySeedButton.textContent = '⚠️ Clipboard Blocked';
      window.setTimeout(() => {
        this.copySeedButton.textContent = '📋 Copy Seed';
      }, 1000);
    }
  }

  private async pasteSeedFromClipboard(): Promise<void> {
    try {
      const value = await navigator.clipboard.readText();
      if (value.trim()) {
        this.seedInput.value = value.trim();
      }
    } catch {
      this.pasteSeedButton.textContent = '⚠️ Clipboard Blocked';
      window.setTimeout(() => {
        this.pasteSeedButton.textContent = '📥 Paste Seed';
      }, 1000);
    }
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

    const form = this.element.querySelector('.menu-form') as HTMLElement;
    Object.assign(form.style, {
      display: 'grid',
      gap: '8px',
      alignItems: 'center',
    });

    const seedActions = this.element.querySelector('.seed-actions') as HTMLElement;
    Object.assign(seedActions.style, {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '8px',
      marginBottom: '8px',
    });
  }

  public setSeed(seed: string): void {
    this.seedInput.value = seed;
  }

  public getSeed(): string {
    const seed = this.seedInput.value.trim();
    return seed.length > 0 ? seed : 'hello';
  }

  public setDifficulty(difficulty: string): void {
    const allowed = ['easy', 'normal', 'hard', 'extreme'];
    if (allowed.includes(difficulty)) {
      this.difficultySelect.value = difficulty;
    }
  }

  public setVisible(visible: boolean): void {
    this.element.style.display = visible ? 'block' : 'none';
  }
}
