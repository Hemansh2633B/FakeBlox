export class SettingsMenu {
  private element: HTMLElement; private masterVolSlider: HTMLInputElement; private musicVolSlider: HTMLInputElement; private sfxVolSlider: HTMLInputElement; private closeButton: HTMLButtonElement; private onSettingsChange: (settings: any) => void;
  constructor(onSettingsChange: (settings: any) => void) {
    this.onSettingsChange = onSettingsChange; this.element = document.createElement('div'); this.element.id = 'settings-menu';
    this.element.innerHTML = `<h2>SETTINGS</h2><div class="settings-group"><label>Master Volume:</label><input type="range" id="settings-master" min="0" max="1" step="0.1" value="0.8"><label>Music Volume:</label><input type="range" id="settings-music" min="0" max="1" step="0.1" value="0.5"><label>SFX Volume:</label><input type="range" id="settings-sfx" min="0" max="1" step="0.1" value="1.0"></div><button id="settings-close">Close Settings</button>`;
    this.masterVolSlider = this.element.querySelector('#settings-master') as HTMLInputElement; this.musicVolSlider = this.element.querySelector('#settings-music') as HTMLInputElement; this.sfxVolSlider = this.element.querySelector('#settings-sfx') as HTMLInputElement; this.closeButton = this.element.querySelector('#settings-close') as HTMLButtonElement;
    this.masterVolSlider.onchange = () => this.updateSettings(); this.musicVolSlider.onchange = () => this.updateSettings(); this.sfxVolSlider.onchange = () => this.updateSettings();
    this.closeButton.onclick = () => this.setVisible(false); document.getElementById('ui-container')?.appendChild(this.element); this.applyStyles();
  }
  private applyStyles(): void { Object.assign(this.element.style, { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'rgba(0,0,0,0.9)', padding: '30px', borderRadius: '15px', color: 'white', textAlign: 'center', minWidth: '280px', border: '2px solid #555', pointerEvents: 'auto' }); }
  private updateSettings(): void { this.onSettingsChange({ master: parseFloat(this.masterVolSlider.value), music: parseFloat(this.musicVolSlider.value), sfx: parseFloat(this.sfxVolSlider.value) }); }
  public setVisible(visible: boolean): void { this.element.style.display = visible ? 'block' : 'none'; }
}
