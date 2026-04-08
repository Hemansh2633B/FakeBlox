// game/main.js — Scene, renderer, game loop, state machine
import * as THREE from 'three';
import { EffectComposer, RenderPass, EffectPass, BloomEffect, FXAAEffect, VignetteEffect, ChromaticAberrationEffect } from 'postprocessing';
import Stats from 'stats.js';
import * as TWEEN from '@tweenjs/tween.js';
import RAPIER from '@dimforge/rapier3d-compat';
// import { Text } from 'troika-three-text';

import { CONFIG, THEMES, LevelGenerator } from './generation.js';
import { InputManager } from './input.js';
import { PlayerModel, buildLevel } from './objects.js';
import { ParticleSystem } from './particles.js';
import { audio } from './audio.js';
import { saveManager, achievements } from './systems.js';
import { updatePlayer, updateObstacles, updateCollectibles, updateCheckpoints, updateCamera, updateEnvParticles } from './player.js';
import { wireUI, updateHUD, formatTime, showNotification } from './ui.js';

export class Game {
  constructor() {
    this.state = 'menu';
    this.scene = null;
    this.renderer = null;
    this.camera = null;
    this.composer = null;
    this.postprocessingDisabled = false;
    this.input = new InputManager();
    this.clock = new THREE.Clock();
    this.playerModel = new PlayerModel();
    this.generator = new LevelGenerator();
    this.particles = null;

    // Player state
    this.playerPos = new THREE.Vector3();
    this.playerVel = new THREE.Vector3();
    this.grounded = false;
    this.groundedPlatform = null;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.jumpHeld = false;
    this.wasGrounded = false;
    this.moveSpeed = 0;

    // Camera state
    this.camTheta = 0;
    this.camPhi = Math.PI / 4;
    this.camDist = CONFIG.camera.dist;
    this.cameraMode = 'third-person';
    this.firstPersonBlend = 0;
    this.lookInputCooldown = 0;
    this.camTarget = new THREE.Vector3();
    this.camPos = new THREE.Vector3();

    // Level state
    this.levelData = null;
    this.platformMeshes = [];
    this.platformBoxes = [];
    this.obstacleMeshes = [];
    this.obstacleBoxes = [];
    this.collectibleMeshes = [];
    this.checkpointMeshes = [];
    this.vineMeshes = [];
    this.rigidBodies = [];

    // Game state
    this.deaths = 0;
    this.starsCollected = 0;
    this.totalStars = 0;
    this.timer = 0;
    this.timerStarted = false;
    this.currentCheckpoint = 0;
    this.checkpointPos = new THREE.Vector3();
    this.invincible = false;
    this.invincTimer = 0;
    this.flashTimer = 0;
    this.isDead = false;
    this.deathTimer = 0;
    this.currentSeed = '';
    this.currentDifficulty = 'normal';
    this.isEndless = false;
    this.envParticles = [];
    this.currentTheme = null;
    this.dirLight = null;

    this.stats = saveManager.load('stats', { totalDeaths: 0, totalStars: 0, levelsCompleted: 0, playTime: 0 });
  }

  async init() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    document.body.prepend(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.threeCamera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 500);

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.threeCamera));
    const bloomEffect = new BloomEffect({ luminanceThreshold: 0.18, luminanceSmoothing: 0.5, intensity: 1.45 });
    const fxaaEffect = new FXAAEffect();
    const vignetteEffect = new VignetteEffect({ eskil: false, offset: 0.35, darkness: 0.55 });
    this.chromaticEffect = new ChromaticAberrationEffect();
    this.chromaticEffect.offset.set(0.0, 0.0); // start at zero
    this.composer.addPass(new EffectPass(this.threeCamera, fxaaEffect, bloomEffect, vignetteEffect, this.chromaticEffect));

    this.perfStats = new Stats();
    document.body.appendChild(this.perfStats.dom);

    await RAPIER.init();
    this.world = new RAPIER.World({ x: 0, y: CONFIG.player.gravity, z: 0 });

    this.particles = new ParticleSystem(this.scene);

    // Wire input to game
    this.input.setGame(this);
    this.input.bind();

    window.addEventListener('resize', () => {
      const w = window.innerWidth, h = window.innerHeight;
      this.threeCamera.aspect = w / h;
      this.threeCamera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
      this.composer.setSize(w, h);
    });

    // Wire UI
    wireUI(this);

    document.getElementById('loading-bar').style.width = '100%';
    setTimeout(() => document.getElementById('loading-screen').classList.add('hidden'), 500);
    this.loop();
  }

  startLevel(seed, difficulty, endless = false) {
    audio.init();
    this.clearLevel();
    this.currentSeed = seed;
    this.currentDifficulty = difficulty;
    this.isEndless = endless;
    this.deaths = 0;
    this.starsCollected = 0;
    this.timer = 0;
    this.timerStarted = false;
    this.currentCheckpoint = 0;
    this.invincible = false;
    this.isDead = false;

    this.levelData = this.generator.generate(seed, difficulty, endless);
    this.totalStars = this.levelData.collectibles.length;

    const spawn = this.levelData.platforms[0].pos;
    this.playerPos.set(spawn.x, spawn.y + 2, spawn.z);
    this.playerVel.set(0, 0, 0);
    this.checkpointPos.copy(this.playerPos);
    this.grounded = false;
    this.cameraMode = 'third-person';
    this.firstPersonBlend = 0;

    if (this.playerController) this.world.removeCharacterController(this.playerController);
    this.playerController = this.world.createCharacterController(0.01);
    this.playerController.enableAutostep(0.3, 0.2, true);
    this.playerController.enableSnapToGround(0.3);

    const rbDesc = RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(this.playerPos.x, this.playerPos.y, this.playerPos.z);
    this.playerRB = this.world.createRigidBody(rbDesc);
    this.rigidBodies.push(this.playerRB);
    const colDesc = RAPIER.ColliderDesc.capsule(CONFIG.player.height/2 - CONFIG.player.radius, CONFIG.player.radius);
    this.playerCollider = this.world.createCollider(colDesc, this.playerRB);

    const built = buildLevel(this, this.levelData, this.playerModel.group);
    this.platformMeshes = built.platformMeshes;
    this.platformBodies = built.platformBodies;
    this.obstacleMeshes = built.obstacleMeshes;
    this.obstacleBodies = built.obstacleBodies;
    this.collectibleMeshes = built.collectibleMeshes;
    this.checkpointMeshes = built.checkpointMeshes;
    this.vineMeshes = built.vineMeshes || [];

    document.getElementById('hud').classList.add('visible');
    document.getElementById('hud-seed').textContent = `🌱 Seed: ${seed}`;
    updateHUD(this);

    const firstTheme = this.levelData.themes[0];
    this.applyTheme(firstTheme);
    audio.startMusic(firstTheme);
    this.state = 'playing';
    document.getElementById('main-menu').classList.add('hidden');
  }

  clearLevel() {
    if (!this.scene) return;
    const toRemove = [];
    this.scene.traverse(c => { if (c.userData.levelObject) toRemove.push(c); });
    toRemove.forEach(c => {
      this.scene.remove(c);
      if (c.geometry) c.geometry.dispose();
      if (c.material) {
        if (Array.isArray(c.material)) c.material.forEach(m => m.dispose());
        else c.material.dispose();
      }
    });
    this.platformMeshes = [];
    this.platformBodies = [];
    this.obstacleMeshes = [];
    this.obstacleBodies = [];
    this.collectibleMeshes = [];
    this.checkpointMeshes = [];
    this.vineMeshes = [];
    
    if (this.rigidBodies && this.world) {
      this.rigidBodies.forEach(rb => {
        if (rb && this.world.bodies && this.world.bodies.contains(rb.handle)) this.world.removeRigidBody(rb);
      });
    }
    this.rigidBodies = [];
    
    if (this.seedText) { 
      try { this.scene.remove(this.seedText); } catch(e) {}
      try { this.seedText.dispose(); } catch(e) {}
      this.seedText = null; 
    }
    this._finishLight = null;
    this.envParticles = [];
    if (this.particles) this.particles.clear();
    const lights = [];
    this.scene.traverse(c => { if (c.isLight) lights.push(c); });
    lights.forEach(l => this.scene.remove(l));
    this.scene.remove(this.playerModel.group);
  }

  applyTheme(themeKey) {
    const t = THEMES[themeKey];
    if (!t) return;
    this.currentTheme = themeKey;
    this.scene.fog = new THREE.Fog(t.fog, t.fogNear, t.fogFar);
    this.scene.background = new THREE.Color(t.sky[0]);

    const existing = [];
    this.scene.traverse(c => { if (c.isLight) existing.push(c); });
    existing.forEach(l => this.scene.remove(l));

    const ambient = new THREE.AmbientLight(t.ambient, 0.6);
    this.scene.add(ambient);

    const dir = new THREE.DirectionalLight(t.dirLight, t.dirIntensity);
    dir.position.set(30, 50, 30);
    dir.castShadow = true;
    dir.shadow.mapSize.setScalar(4096);
    dir.shadow.camera.near = 0.5;
    dir.shadow.camera.far = 200;
    const s = 80;
    dir.shadow.camera.left = -s;
    dir.shadow.camera.right = s;
    dir.shadow.camera.top = s;
    dir.shadow.camera.bottom = -s;
    dir.shadow.bias = -0.0005;
    this.dirLight = dir;
    this.scene.add(dir);
    this.scene.add(dir.target);

    const hemi = new THREE.HemisphereLight(t.sky[2], t.ground || 0x444444, 0.3);
    this.scene.add(hemi);
  }

  die() {
    if (this.isDead || this.invincible) return;
    this.isDead = true;
    this.deathTimer = CONFIG.player.deathTime;
    this.deaths++;
    this.stats.totalDeaths++;
    audio.death();
    this.particles.emit(this.playerPos.clone(), 30, 0xFF4444, new THREE.Vector3(0, 2, 0), 0.8);
    document.getElementById('death-overlay').classList.add('flash');
    if (this.stats.totalDeaths >= 100) achievements.unlock('persistent');
    // Chromatic aberration death flash
    if (this.chromaticEffect) {
      this.chromaticEffect.offset.set(0.006, 0.006);
      setTimeout(() => { if (this.chromaticEffect) this.chromaticEffect.offset.set(0.0, 0.0); }, 400);
    }
    setTimeout(() => {
      document.getElementById('death-overlay').classList.remove('flash');
    }, 200);
    setTimeout(() => this.respawn(), CONFIG.player.deathTime * 1000);
  }

  respawn() {
    this.isDead = false;
    this.playerPos.copy(this.checkpointPos);
    this.playerVel.set(0, 0, 0);
    if (this.playerRB) this.playerRB.setNextKinematicTranslation(this.playerPos);
    this.grounded = false;
    this.invincible = true;
    this.invincTimer = CONFIG.player.invincTime;
    this.flashTimer = 0;
    this.playerModel.setFlash(true);
  }

  completeLevel() {
    if (this.state !== 'playing') return;
    this.state = 'complete';
    audio.levelComplete();
    audio.stopMusic();

    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        const colors = [0xFFD700, 0xFF4081, 0x69F0AE, 0x448AFF, 0xFFAB00];
        this.particles.emit(
          this.playerPos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 5, 2, (Math.random() - 0.5) * 5)),
          30, colors[i], new THREE.Vector3(0, 8, 0), 1.5, 0.2
        );
      }, i * 200);
    }

    const sc = CONFIG.scoring;
    const platformCount = this.levelData.platforms.length;
    const targetTime = platformCount * sc.timePer;
    const timeBonus = Math.max(0, sc.maxTimeBonus - (this.timer / targetTime) * sc.maxTimeBonus);
    const deathPen = this.deaths * sc.deathPen;
    const collectBonus = this.totalStars > 0 ? (this.starsCollected / this.totalStars) * sc.maxCollect : 0;
    const finalScore = Math.round(sc.base + timeBonus - deathPen + collectBonus);

    let starRating = 1;
    for (let i = sc.stars.length - 1; i >= 0; i--) {
      if (finalScore >= sc.stars[i]) { starRating = i + 1; break; }
    }

    document.getElementById('end-stars').textContent = '⭐'.repeat(starRating) + '☆'.repeat(5 - starRating);
    document.getElementById('end-score').textContent = `Score: ${finalScore.toLocaleString()}`;
    document.getElementById('end-time').textContent = `⏱️ Time: ${formatTime(this.timer)}`;
    document.getElementById('end-deaths').textContent = `💀 Deaths: ${this.deaths}`;
    document.getElementById('end-collected').textContent = `⭐ Stars: ${this.starsCollected}/${this.totalStars}`;
    document.getElementById('end-screen').classList.add('visible');
    document.getElementById('hud').classList.remove('visible');

    saveManager.saveBestRun(this.currentSeed, this.currentDifficulty, {
      time: this.timer, deaths: this.deaths,
      stars: this.starsCollected, totalStars: this.totalStars,
      score: finalScore, rating: starRating, date: new Date().toISOString(),
    });

    this.stats.levelsCompleted++;
    saveManager.save('stats', this.stats);
    achievements.unlock('first_steps');
    if (this.timer < 120000) achievements.unlock('speed_demon');
    if (this.deaths === 0) achievements.unlock('flawless');
    if (this.starsCollected === this.totalStars && this.totalStars > 0) achievements.unlock('collector');
    if (starRating >= 5) achievements.unlock('five_star');
    if (document.pointerLockElement) document.exitPointerLock();
  }

  showNotification(text) {
    showNotification(text);
  }

  handlePause() {
    if (this.state === 'playing') {
      this.state = 'paused';
      document.getElementById('pause-menu').classList.add('visible');
      if (document.pointerLockElement) document.exitPointerLock();
    }
  }

  handleResume() {
    if (this.state === 'paused') {
      this.state = 'playing';
      document.getElementById('pause-menu').classList.remove('visible');
    }
  }

  returnToMenu() {
    this.state = 'menu';
    this.clearLevel();
    audio.stopMusic();
    document.getElementById('hud').classList.remove('visible');
    document.getElementById('pause-menu').classList.remove('visible');
    document.getElementById('end-screen').classList.remove('visible');
    document.getElementById('main-menu').classList.remove('hidden');
    if (document.pointerLockElement) document.exitPointerLock();
  }

  handleZoom(delta) {
    this.camDist = THREE.MathUtils.clamp(this.camDist + delta, CONFIG.camera.minDist, CONFIG.camera.maxDist);
    if (this.cameraMode === 'first-person') this.camDist = CONFIG.camera.minDist;
  }

  setCameraMode(mode) {
    const nextMode = mode === 'first-person' ? 'first-person' : 'third-person';
    if (this.cameraMode === nextMode) return;
    this.cameraMode = nextMode;
    if (nextMode === 'first-person') {
      this.camDist = CONFIG.camera.minDist;
      if (!this.input.locked && !this.input.isMobile) {
        document.body.requestPointerLock().catch(() => {});
      }
      this.showNotification('📷 First Person');
    } else {
      this.camDist = Math.max(this.camDist, CONFIG.camera.dist);
      this.showNotification('📷 Third Person');
    }
  }

  toggleCameraMode() {
    this.setCameraMode(this.cameraMode === 'first-person' ? 'third-person' : 'first-person');
  }

  loop() {
    if (this.perfStats) this.perfStats.begin();
    requestAnimationFrame(() => this.loop());
    const dt = Math.min(this.clock.getDelta(), 0.05);

    TWEEN.update();
    if (this.state === 'playing' && !this.input.pause && this.world) {
      this.world.step();
    }

    this.input.update();

    if (this.state === 'playing') {
      if (this.input.pause) { this.handlePause(); return; }
      if (this.input.reset) { this.die(); }
      if (this.input.toggleCameraModePressed) this.toggleCameraMode();
      if (this.timerStarted) this.timer += dt * 1000;
      this.stats.playTime += dt * 1000;
      updatePlayer(this, dt);
      updateObstacles(this, dt);
      updateCollectibles(this, dt);
      updateCheckpoints(this);
      updateCamera(this, dt);
      this.particles.update(dt);
      updateHUD(this);
      updateEnvParticles(this);
    } else if (this.state === 'complete') {
      this.particles.update(dt);
      this.camTheta += dt * 0.3;
      updateCamera(this, dt);
    }

    if (this.scene && this.threeCamera) {
      if (this.composer && !this.postprocessingDisabled) {
        try {
          this.composer.render(dt);
        } catch (error) {
          this.postprocessingDisabled = true;
          console.error('[Renderer] Postprocessing disabled after render failure:', error);
          this.renderer.render(this.scene, this.threeCamera);
        }
      } else {
        this.renderer.render(this.scene, this.threeCamera);
      }
    }
    if (this.perfStats) this.perfStats.end();
  }
}

// ─── Bootstrap ──────────────────────────────────────────
const game = new Game();
window.game = game;
game.init();
