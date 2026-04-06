import type { AudioSettings } from '../systems/AudioManager';

export class SettingsMenu {
  private readonly element: HTMLElement;
  private readonly masterVolSlider: HTMLInputElement;
  private readonly musicVolSlider: HTMLInputElement;
  private readonly sfxVolSlider: HTMLInputElement;
  private readonly muteToggle: HTMLInputElement;
  private readonly closeButton: HTMLButtonElement;
  private readonly resetDataButton: HTMLButtonElement;
  private readonly onSettingsChange: (settings: AudioSettings) => void;
  private readonly onResetData?: () => void;

  constructor(onSettingsChange: (settings: AudioSettings) => void, onResetData?: () => void) {
    this.onSettingsChange = onSettingsChange;
    this.onResetData = onResetData;
    this.element = document.createElement('div');
    this.element.id = 'settings-menu';
    this.element.innerHTML = `
      <h2>SETTINGS</h2>
      <div class="settings-group">
        <label>Master Volume</label>
        <input type="range" id="settings-master" min="0" max="100" step="1" value="80">
        <label>Music Volume</label>
        <input type="range" id="settings-music" min="0" max="100" step="1" value="50">
        <label>SFX Volume</label>
        <input type="range" id="settings-sfx" min="0" max="100" step="1" value="100">
        <label class="settings-toggle">
          <input type="checkbox" id="settings-mute-all">
          Mute All
        </label>
      </div>
      <button id="settings-reset-data" type="button">Reset All Data</button>
      <button id="settings-close">Close Settings</button>
    `;
    this.masterVolSlider = this.element.querySelector('#settings-master') as HTMLInputElement;
    this.musicVolSlider = this.element.querySelector('#settings-music') as HTMLInputElement;
    this.sfxVolSlider = this.element.querySelector('#settings-sfx') as HTMLInputElement;
    this.muteToggle = this.element.querySelector('#settings-mute-all') as HTMLInputElement;
    this.resetDataButton = this.element.querySelector('#settings-reset-data') as HTMLButtonElement;
    this.closeButton = this.element.querySelector('#settings-close') as HTMLButtonElement;

    this.masterVolSlider.oninput = () => this.updateSettings();
    this.musicVolSlider.oninput = () => this.updateSettings();
    this.sfxVolSlider.oninput = () => this.updateSettings();
    this.muteToggle.onchange = () => this.updateSettings();
    this.resetDataButton.onclick = () => {
      if (!this.onResetData) return;
      const shouldReset = window.confirm('Reset all saved settings, stats, runs, seeds, and achievements?');
      if (shouldReset) this.onResetData();
    };
    this.closeButton.onclick = () => this.setVisible(false);

    document.getElementById('ui-container')?.appendChild(this.element);
    this.applyStyles();
  }

  private applyStyles(): void {
    Object.assign(this.element.style, {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: 'rgba(0,0,0,0.9)',
      padding: '30px',
      borderRadius: '15px',
      color: 'white',
      textAlign: 'center',
      minWidth: '280px',
      border: '2px solid #555',
      pointerEvents: 'auto',
    });
  }

  private updateSettings(): void {
    this.onSettingsChange({
      master: parseInt(this.masterVolSlider.value, 10) / 100,
      music: parseInt(this.musicVolSlider.value, 10) / 100,
      sfx: parseInt(this.sfxVolSlider.value, 10) / 100,
      muteAll: this.muteToggle.checked,
    });
  }

  public setValues(settings: AudioSettings): void {
    this.masterVolSlider.value = Math.round(settings.master * 100).toString();
    this.musicVolSlider.value = Math.round(settings.music * 100).toString();
    this.sfxVolSlider.value = Math.round(settings.sfx * 100).toString();
    this.muteToggle.checked = settings.muteAll;
  }

  public setVisible(visible: boolean): void {
    this.element.style.display = visible ? 'block' : 'none';
  }
}
