import { Scene } from './Scene';
import { PhysicsWorld } from '../systems/PhysicsWorld';
import { PlayerController } from '../player/PlayerController';
import { CameraController } from '../player/CameraController';
import { InputManager } from '../player/InputManager';
import { LevelGenerator } from '../generation/LevelGenerator';
import { AudioManager } from '../systems/AudioManager';
import { TimerSystem } from '../systems/TimerSystem';
import { ScoreSystem } from '../systems/ScoreSystem';
import { SaveManager } from '../systems/SaveManager';
import { CheckpointSystem } from '../systems/CheckpointSystem';
import { CollectibleSystem } from '../systems/CollectibleSystem';
import { ParticleManager } from '../systems/ParticleManager';
import { AchievementSystem } from '../systems/AchievementSystem';
import { HUD } from '../ui/HUD';
import { MainMenu } from '../ui/MainMenu';
import { PauseMenu } from '../ui/PauseMenu';
import { EndScreen } from '../ui/EndScreen';
import { SettingsMenu } from '../ui/SettingsMenu';
import { TouchControls } from '../ui/TouchControls';
import { parseRouteConfig } from '../utils/seed';

export enum GameState {
  MENU,
  LOADING,
  PLAYING,
  PAUSED,
  END_SCREEN,
}

export class Game {
  public scene: Scene;
  public physics: PhysicsWorld;
  public player: PlayerController;
  public camera: CameraController;
  public input: InputManager;
  public levelGenerator: LevelGenerator;
  public audio: AudioManager;
  public timer: TimerSystem;
  public score: ScoreSystem;
  public save: SaveManager;
  public checkpoints: CheckpointSystem;
  public collectibles: CollectibleSystem;
  public particles: ParticleManager;
  public achievements: AchievementSystem;

  public hud: HUD;
  public mainMenu: MainMenu;
  public pauseMenu: PauseMenu;
  public endScreen: EndScreen;
  public settingsMenu: SettingsMenu;
  public touchControls: TouchControls;

  private state: GameState = GameState.MENU;
  private lastTime = 0;
  private currentSeed = 'hello';
  private currentDifficulty = 'normal';

  constructor(canvas: HTMLCanvasElement) {
    const initialConfig = this.getInitialSeedConfig();
    this.currentSeed = initialConfig.seed;
    this.currentDifficulty = initialConfig.difficulty;

    this.scene = new Scene(canvas);
    this.physics = new PhysicsWorld();
    this.input = new InputManager();
    this.audio = new AudioManager();
    this.timer = new TimerSystem();
    this.score = new ScoreSystem();
    this.save = new SaveManager();
    this.particles = new ParticleManager(this.scene.scene);
    this.achievements = new AchievementSystem();

    this.player = new PlayerController(this.scene.scene, this.physics, this.input);
    this.camera = new CameraController(this.scene.camera, this.player.model.mesh);
    this.levelGenerator = new LevelGenerator(this.scene, this.physics, this.currentSeed);
    this.checkpoints = new CheckpointSystem(this.player);
    this.collectibles = new CollectibleSystem(this.player);

    this.hud = new HUD();
    this.mainMenu = new MainMenu(this.startLevel.bind(this));
    this.mainMenu.setInitialValues(this.currentSeed, this.currentDifficulty);
    this.pauseMenu = new PauseMenu(this.resumeGame.bind(this));
    this.endScreen = new EndScreen(this.goToMenu.bind(this));
    this.settingsMenu = new SettingsMenu((s) => this.audio.setMasterVolume(s.master));
    this.touchControls = new TouchControls(() => {}, () => {}, () => {});

    this.goToMenu();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  private getInitialSeedConfig(): { seed: string; difficulty: string } {
    const params = new URLSearchParams(window.location.search);
    const urlSeed = params.get('seed')?.trim();
    const urlDifficulty = params.get('difficulty')?.trim();

    const difficulty = (urlDifficulty && ['easy', 'normal', 'hard', 'extreme'].includes(urlDifficulty))
      ? urlDifficulty
      : 'normal';

    return {
      seed: urlSeed || 'hello',
      difficulty,
    };
  }

  private startLevel(seed: string, difficulty: string): void {
    this.currentSeed = seed.trim() || 'default';
    this.currentDifficulty = difficulty;

    this.state = GameState.LOADING;
    this.mainMenu.setVisible(false);

    this.levelGenerator.clear();
    this.checkpoints.clear();
    this.collectibles.clear();

    this.levelGenerator.setSeed(this.currentSeed);
    this.levelGenerator.generate(difficulty);

    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set('seed', this.currentSeed);
    nextUrl.searchParams.set('difficulty', difficulty);
    window.history.replaceState({}, '', nextUrl.toString());

    this.player.respawn(0, 5, 0);
    this.timer.reset();
    this.timer.start();

    this.state = GameState.PLAYING;
    this.hud.setVisible(true);
    this.hud.updateSeed(this.currentSeed);
  }

  private resumeGame(): void {
    this.state = GameState.PLAYING;
    this.pauseMenu.setVisible(false);
  }

  private goToMenu(): void {
    this.state = GameState.MENU;
    this.mainMenu.setInitialValues(this.currentSeed, this.currentDifficulty);
    this.mainMenu.setVisible(true);
    this.hud.setVisible(false);
    this.pauseMenu.setVisible(false);
    this.endScreen.setVisible(false);
    this.settingsMenu.setVisible(false);
    this.touchControls.setVisible(false);
  }

  private animate(time: number): void {
    requestAnimationFrame(this.animate);
    const deltaTime = Math.min((time - this.lastTime) / 1000, 0.1);
    this.lastTime = time;
    this.update(deltaTime);
    this.render();
  }

  private update(deltaTime: number): void {
    if (this.state === GameState.PLAYING) {
      this.physics.update(deltaTime);
      this.player.update(deltaTime, this.camera.getRotationY());
      this.camera.update(deltaTime, this.input.getMouseDelta());
      this.timer.update();
      this.checkpoints.update();
      this.collectibles.update();
      this.particles.update(deltaTime);

      this.hud.updateTimer(this.timer.getFormattedTime());
      this.hud.updateStars(this.collectibles.getCount(), 43);

      if (this.input.isKeyDown('Escape')) {
        this.state = GameState.PAUSED;
        this.pauseMenu.setVisible(true);
      }

      if (this.player.body.position.y < -20) {
        this.checkpoints.respawnPlayer();
        this.audio.playSound('death');
      }
    }
  }

  private render(): void {
    this.scene.render();
  }
}
