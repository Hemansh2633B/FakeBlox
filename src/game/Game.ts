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
import { Checkpoint } from '../objects/Checkpoint';
import { Collectible } from '../objects/Collectible';
import { parseDifficulty } from '../utils/seed';
import type { AudioSettings } from '../systems/AudioManager';

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
  private lastTime: number = 0;
  private currentSeed: string = 'hello';
  private currentDifficulty: string = 'normal';
  private deaths: number = 0;
  private totalStars: number = 0;
  private timerStarted: boolean = false;
  private isRespawning: boolean = false;
  private respawnTimer: number = 0;
  private finishPosition = { x: 0, y: 0, z: 0 };

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
    const persistedSettings = this.save.loadSettings();
    const persistedAudio: AudioSettings = {
      master: persistedSettings.masterVolume,
      music: persistedSettings.musicVolume,
      sfx: persistedSettings.sfxVolume,
      muteAll: false,
    };
    this.audio.applySettings(persistedAudio);
    this.settingsMenu = new SettingsMenu(
      (settings) => {
        this.audio.applySettings(settings);
        this.save.saveSettings({
          ...persistedSettings,
          masterVolume: settings.master,
          musicVolume: settings.music,
          sfxVolume: settings.sfx,
        });
      },
      () => {
        this.save.resetAll();
        const defaults = this.save.loadSettings();
        this.audio.applySettings({
          master: defaults.masterVolume,
          music: defaults.musicVolume,
          sfx: defaults.sfxVolume,
          muteAll: false,
        });
        this.settingsMenu.setValues(this.audio.getSettings());
      },
    );
    this.settingsMenu.setValues(this.audio.getSettings());
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
    this.currentSeed = seed;
    this.currentDifficulty = difficulty;
    this.deaths = 0;
    this.timerStarted = false;
    this.isRespawning = false;
    this.respawnTimer = 0;
    this.state = GameState.LOADING;
    this.mainMenu.setVisible(false);

    this.levelGenerator.clear();
    this.checkpoints.clear();
    this.collectibles.clear();
    const parsedDifficulty = parseDifficulty(difficulty) ?? 'normal';
    const level = this.levelGenerator.generate(seed, parsedDifficulty);
    this.totalStars = level.totalStars;
    const finishPlacement = level.placements[level.placements.length - 1];
    this.finishPosition = {
      x: finishPlacement.position.x,
      y: finishPlacement.position.y,
      z: finishPlacement.position.z,
    };
    level.checkpointIndices.forEach((platformIndex, idx) => {
      const placement = level.placements[platformIndex];
      const checkpoint = new Checkpoint(
        this.scene.scene,
        this.physics,
        placement.position.x,
        placement.position.y + 0.1,
        placement.position.z,
        idx + 1,
      );
      this.checkpoints.addCheckpoint(checkpoint);
    });
    level.collectiblePositions.forEach((position) => {
      const collectible = new Collectible(
        this.scene.scene,
        this.physics,
        position.x,
        position.y,
        position.z,
      );
      this.collectibles.addCollectible(collectible);
    });
    this.player.respawn(0, 5, 0);
    this.timer.reset();
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
      this.physics.update(deltaTime); this.player.update(deltaTime, this.camera.getRotationY()); this.camera.update(deltaTime, this.input.getMouseDelta()); this.timer.update();
      const activatedCheckpoint = this.checkpoints.update();
      this.collectibles.update(deltaTime);
      this.particles.update(deltaTime);
      this.hud.updateTimer(this.timer.getFormattedTime()); this.hud.updateStars(this.collectibles.getCount(), this.totalStars);
      if (activatedCheckpoint) {
        this.audio.playSound('checkpoint');
        this.hud.showNotification(`Checkpoint ${activatedCheckpoint.id}/${activatedCheckpoint.total} ✓`);
      }
      if (!this.timerStarted) {
        const move = this.input.getMovementVector();
        if (move.x !== 0 || move.z !== 0 || this.input.isJump()) {
          this.timer.start();
          this.timerStarted = true;
        }
      }
      if (this.input.isKeyDown('Escape')) { this.state = GameState.PAUSED; this.pauseMenu.setVisible(true); }
      if (this.player.body.position.y < -20 && !this.isRespawning) {
        this.deaths += 1;
        this.save.incrementStats({ totalDeaths: 1 });
        this.isRespawning = true;
        this.respawnTimer = 0.95;
        this.audio.playSound('death');
      }
      if (this.isRespawning) {
        this.respawnTimer -= deltaTime;
        if (this.respawnTimer <= 0) {
          this.checkpoints.respawnPlayer();
          this.isRespawning = false;
        }
      }
      const finishDist = Math.hypot(
        this.player.body.position.x - this.finishPosition.x,
        this.player.body.position.y - this.finishPosition.y,
        this.player.body.position.z - this.finishPosition.z,
      );
      if (finishDist < 2.5) {
        this.completeLevel();
      }
    }
  }
  private completeLevel(): void {
    this.timer.stop();
    const score = this.score.calculateScore(
      this.timer.getTime(),
      this.deaths,
      this.collectibles.getCount(),
      this.totalStars,
      this.levelGenerator.getPlatforms().length,
    );
    const rating = this.score.getStarRating(score);
    this.save.saveBestRun(this.currentSeed, this.currentDifficulty, {
      time: this.timer.getTime(),
      deaths: this.deaths,
      stars: this.collectibles.getCount(),
      totalStars: this.totalStars,
      score,
      rating,
      date: new Date().toISOString(),
    });
    this.save.incrementStats({
      totalLevelsCompleted: 1,
      totalStarsCollected: this.collectibles.getCount(),
      totalPlayTimeMs: this.timer.getTime(),
    });
    this.endScreen.updateStats(
      this.timer.getFormattedTime(),
      this.deaths,
      this.collectibles.getCount(),
      this.totalStars,
      score,
      rating,
    );
    this.endScreen.setVisible(true);
    this.state = GameState.END_SCREEN;
  }
  private render(): void { this.scene.render(); }
}
