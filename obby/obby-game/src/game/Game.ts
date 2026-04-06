import { SceneManager } from './Scene.ts';
import { InputManager } from '../player/InputManager.ts';
import { PlayerController } from '../player/PlayerController.ts';
import { CameraController } from '../player/CameraController.ts';
import { LevelGenerator } from '../generation/LevelGenerator.ts';
import { SaveManager } from '../systems/SaveManager.ts';
import { AudioManager } from '../systems/AudioManager.ts';
import { ParticleManager } from '../systems/ParticleManager.ts';
import { GameState } from './GameState.ts';

export class Game {
  private sceneManager: SceneManager;
  private inputManager: InputManager;
  private playerController: PlayerController;
  private cameraController: CameraController;
  private levelGenerator: LevelGenerator;
  private saveManager: SaveManager;
  private audioManager: AudioManager;
  private particleManager: ParticleManager;
  private gameState: GameState;
  
  private animationFrameId: number = 0;
  private lastTime: number = 0;
  
  constructor(private container: HTMLElement) {
    this.sceneManager = new SceneManager(container);
    this.inputManager = new InputManager();
    this.playerController = new PlayerController();
    this.cameraController = new CameraController();
    this.levelGenerator = new LevelGenerator();
    this.saveManager = new SaveManager();
    this.audioManager = new AudioManager();
    this.particleManager = new ParticleManager();
    this.gameState = new GameState();
    
    this.init();
  }
  
  private async init() {
    await this.audioManager.loadAll();
    await this.levelGenerator.init();
    
    // Load initial level
    const seed = this.saveManager.load('lastSeed', 'hello');
    const difficulty = this.saveManager.load('lastDifficulty', 'normal') as any;
    await this.loadLevel(seed, difficulty);
    
    this.startGameLoop();
  }
  
  private async loadLevel(seed: string, difficulty: any) {
    // Clear current level
    this.clearLevel();
    
    // Generate new level
    const level = await this.levelGenerator.generateLevel(seed, difficulty);
    
    // Add level to scene
    // TODO: Implement level loading
    
    // Reset player
    this.playerController.reset(level.spawnPosition);
    
    // Update game state
    this.gameState.seed = seed;
    this.gameState.difficulty = difficulty;
    this.gameState.level = level;
    
    // Save for next time
    this.saveManager.save('lastSeed', seed);
    this.saveManager.save('lastDifficulty', difficulty);
  }
  
  private clearLevel() {
    // TODO: Clear level objects from scene
  }
  
  private startGameLoop() {
    const loop = (timestamp: number) => {
      const deltaTime = (timestamp - this.lastTime) / 1000; // Convert to seconds
      this.lastTime = timestamp;
      
      this.update(deltaTime);
      this.render();
      
      this.animationFrameId = requestAnimationFrame(loop);
    };
    
    this.lastTime = performance.now();
    this.animationFrameId = requestAnimationFrame(loop);
  }
  
  private update(deltaTime: number) {
    this.inputManager.update();
    this.playerController.update(deltaTime, this.inputManager);
    this.cameraController.update(deltaTime, this.playerController.getPosition(), this.playerController.getVelocity());
    this.gameState.update(deltaTime);
    // TODO: Update other systems
  }
  
  private render() {
    this.sceneManager.render();
  }
  
  public dispose() {
    cancelAnimationFrame(this.animationFrameId);
    this.sceneManager.dispose();
    this.audioManager.dispose();
    this.particleManager.dispose();
  }
}