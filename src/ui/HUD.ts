export class HUD {
  private element: HTMLElement;
  private timerElement: HTMLElement;
  private deathElement: HTMLElement;
  private starElement: HTMLElement;
  private seedElement: HTMLElement;
  private copySeedButton: HTMLButtonElement;
  private notificationElement: HTMLElement;
  private currentSeed: string = 'unknown';

  constructor(onCopySeed?: (seed: string) => void) {
    this.element = document.createElement('div'); this.element.id = 'hud';
    this.element.innerHTML = `<div id="hud-timer">00:00.000</div><div id="hud-deaths">💀 0</div><div id="hud-stars">⭐ 0</div><div id="hud-seed-wrap"><span id="hud-seed">Seed: unknown</span><button id="hud-copy-seed">Copy Seed</button></div><div id="hud-notification"></div>`;
    this.timerElement = this.element.querySelector('#hud-timer') as HTMLElement; this.deathElement = this.element.querySelector('#hud-deaths') as HTMLElement; this.starElement = this.element.querySelector('#hud-stars') as HTMLElement; this.seedElement = this.element.querySelector('#hud-seed') as HTMLElement;
    this.copySeedButton = this.element.querySelector('#hud-copy-seed') as HTMLButtonElement;
    this.notificationElement = this.element.querySelector('#hud-notification') as HTMLElement;
    this.copySeedButton.onclick = async () => {
      if (!navigator.clipboard?.writeText) return;
      await navigator.clipboard.writeText(this.currentSeed);
      onCopySeed?.(this.currentSeed);
      this.copySeedButton.innerText = 'Copied!';
      window.setTimeout(() => { this.copySeedButton.innerText = 'Copy Seed'; }, 700);
    };
    document.getElementById('ui-container')?.appendChild(this.element); this.applyStyles();
  }
  private applyStyles(): void {
    Object.assign(this.element.style, { position: 'absolute', top: '0', left: '0', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', color: 'white', fontSize: '24px', pointerEvents: 'none', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' });
    Object.assign(this.notificationElement.style, {
      position: 'absolute',
      top: '68px',
      left: '50%',
      transform: 'translateX(-50%)',
      opacity: '0',
      transition: 'opacity 0.2s ease',
      color: '#9effa8',
      fontSize: '18px',
      fontWeight: '700',
    });
  }
  public updateTimer(time: string): void { this.timerElement.innerText = time; }
  public updateDeaths(deaths: number): void { this.deathElement.innerText = `💀 ${deaths}`; }
  public updateStars(stars: number, total: number): void { this.starElement.innerText = `⭐ ${stars}/${total}`; }
  public updateSeed(seed: string): void { this.currentSeed = seed; this.seedElement.innerText = `Seed: ${seed}`; }
  public showNotification(message: string, ms: number = 1400): void {
    this.notificationElement.innerText = message;
    this.notificationElement.style.opacity = '1';
    window.setTimeout(() => { this.notificationElement.style.opacity = '0'; }, ms);
  }
  public setVisible(visible: boolean): void { this.element.style.display = visible ? 'flex' : 'none'; }
}
