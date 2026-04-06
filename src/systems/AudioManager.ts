import { Howl, Howler } from 'howler';

export interface AudioSettings {
  master: number;
  music: number;
  sfx: number;
  muteAll: boolean;
}

type SoundConfig = {
  path: string;
  defaultVolume: number;
  loop?: boolean;
  spatial?: boolean;
};

export class AudioManager {
  private sounds: Map<string, Howl> = new Map();
  private music: Howl | null = null;
  private settings: AudioSettings = {
    master: 0.8,
    music: 0.5,
    sfx: 1.0,
    muteAll: false,
  };

  constructor() {
    const soundLibrary: Record<string, SoundConfig> = {
      jump: { path: '/audio/sfx/jump.mp3', defaultVolume: 0.7 },
      land_soft: { path: '/audio/sfx/land_soft.mp3', defaultVolume: 0.6 },
      land_hard: { path: '/audio/sfx/land_hard.mp3', defaultVolume: 0.75 },
      footstep_default: { path: '/audio/sfx/footstep_default.mp3', defaultVolume: 0.55 },
      footstep_metal: { path: '/audio/sfx/footstep_metal.mp3', defaultVolume: 0.55 },
      footstep_ice: { path: '/audio/sfx/footstep_ice.mp3', defaultVolume: 0.55 },
      death: { path: '/audio/sfx/death.mp3', defaultVolume: 0.9 },
      respawn: { path: '/audio/sfx/respawn.mp3', defaultVolume: 0.8 },
      checkpoint: { path: '/audio/sfx/checkpoint.mp3', defaultVolume: 0.8 },
      collectible: { path: '/audio/sfx/collectible.mp3', defaultVolume: 0.75 },
      level_complete: { path: '/audio/sfx/level_complete.mp3', defaultVolume: 0.9 },
      moving_platform: { path: '/audio/sfx/moving_platform.mp3', defaultVolume: 0.45, loop: true, spatial: true },
      kill_brick_hum: { path: '/audio/sfx/kill_brick_hum.mp3', defaultVolume: 0.5, loop: true, spatial: true },
      spinning_bar: { path: '/audio/sfx/spinning_bar.mp3', defaultVolume: 0.45, loop: true, spatial: true },
      laser_charge: { path: '/audio/sfx/laser_charge.mp3', defaultVolume: 0.7 },
      laser_fire: { path: '/audio/sfx/laser_fire.mp3', defaultVolume: 0.75 },
      bounce: { path: '/audio/sfx/bounce.mp3', defaultVolume: 0.8 },
      conveyor: { path: '/audio/sfx/conveyor.mp3', defaultVolume: 0.45, loop: true, spatial: true },
      button_hover: { path: '/audio/sfx/button_hover.mp3', defaultVolume: 0.4 },
      button_click: { path: '/audio/sfx/button_click.mp3', defaultVolume: 0.45 },
      countdown_tick: { path: '/audio/sfx/countdown_tick.mp3', defaultVolume: 0.6 },
      countdown_go: { path: '/audio/sfx/countdown_go.mp3', defaultVolume: 0.7 },
    };

    Object.entries(soundLibrary).forEach(([name, config]) => this.loadSound(name, config));
    this.refreshVolumes();
  }

  private loadSound(name: string, config: SoundConfig): void {
    this.sounds.set(name, new Howl({
      src: [config.path],
      preload: false,
      loop: !!config.loop,
      volume: config.defaultVolume,
      html5: false,
      onloaderror: () => {
        // Keep game playable when optional audio assets are missing in local/dev env.
      },
    }));
  }

  public playSound(name: string): void {
    const sound = this.sounds.get(name);
    if (!sound || this.settings.muteAll) return;
    sound.play();
  }

  public playMusic(path: string): void {
    if (this.music) this.music.stop();
    this.music = new Howl({ src: [path], loop: true, volume: this.settings.music, preload: false });
    if (!this.settings.muteAll) this.music.play();
  }

  public applySettings(settings: AudioSettings): void {
    this.settings = { ...settings };
    this.refreshVolumes();
  }

  public getSettings(): AudioSettings {
    return { ...this.settings };
  }

  public setMasterVolume(volume: number): void {
    this.settings.master = volume;
    this.refreshVolumes();
  }

  public setMusicVolume(volume: number): void {
    this.settings.music = volume;
    this.refreshVolumes();
  }

  public setSfxVolume(volume: number): void {
    this.settings.sfx = volume;
    this.refreshVolumes();
  }

  public setMuteAll(mute: boolean): void {
    this.settings.muteAll = mute;
    this.refreshVolumes();
  }

  public setListenerPosition(x: number, y: number, z: number): void {
    Howler.pos(x, y, z);
  }

  private refreshVolumes(): void {
    const master = this.settings.muteAll ? 0 : this.settings.master;
    Howler.volume(master);
    this.sounds.forEach((sound) => sound.volume(this.settings.sfx));
    if (this.music) {
      this.music.volume(this.settings.music);
      if (this.settings.muteAll && this.music.playing()) this.music.pause();
      if (!this.settings.muteAll && !this.music.playing()) this.music.play();
    }
  }
}
