import { Howl } from 'howler';

export class AudioManager {
  private sounds: Map<string, Howl> = new Map();
  private music: Howl | null = null;

  constructor() {
    this.loadSound('jump', '/audio/sfx/jump.mp3');
    this.loadSound('land', '/audio/sfx/land_soft.mp3');
    this.loadSound('death', '/audio/sfx/death.mp3');
    this.loadSound('checkpoint', '/audio/sfx/checkpoint.mp3');
    this.loadSound('collectible', '/audio/sfx/collectible.mp3');
  }

  private loadSound(name: string, path: string): void {
    this.sounds.set(name, new Howl({ src: [path], volume: 0.5 }));
  }

  public playSound(name: string): void {
    this.sounds.get(name)?.play();
  }

  public playMusic(path: string): void {
    if (this.music) this.music.stop();
    this.music = new Howl({ src: [path], loop: true, volume: 0.3 });
    this.music.play();
  }

  public setMasterVolume(volume: number): void {
    (window as any).Howler.volume(volume);
  }
}
