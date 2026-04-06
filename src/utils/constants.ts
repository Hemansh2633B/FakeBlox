// src/utils/constants.ts

export const GAME_CONFIG = {
  // ============================================
  // PLAYER PHYSICS
  // ============================================
  player: {
    walkSpeed: 16,                    // units per second
    sprintSpeed: 24,                  // units per second
    acceleration: 80,                 // units per second squared (ground)
    deceleration: 60,                 // units per second squared (ground)
    airControlMultiplier: 0.65,       // percentage of ground acceleration in air

    jumpForce: 15,                    // initial upward velocity
    gravity: -30,                     // units per second squared
    fallingGravityMultiplier: 1.5,    // extra gravity when falling (optional)
    maxFallSpeed: -50,                // terminal velocity (negative = downward)

    coyoteTime: 0.12,                // seconds after leaving edge where jump still works
    jumpBufferTime: 0.1,             // seconds before landing where jump press is remembered
    variableJumpMinMultiplier: 0.6,  // minimum jump height as fraction of full

    capsuleRadius: 0.4,              // collision capsule radius
    capsuleHeight: 1.8,              // collision capsule total height
    groundCheckDistance: 0.1,         // raycast distance below capsule for ground detect
    wallCheckDistance: 0.05,          // raycast distance for wall detection

    maxSlopeAngle: 45,               // degrees — can walk on slopes up to this
    iceFrictionMultiplier: 0.2,      // friction on ice platforms

    respawnInvincibilityDuration: 1.0, // seconds of invincibility after respawn
    deathSequenceDuration: 1.2,      // total seconds from death to control restored
  },

  // ============================================
  // CAMERA
  // ============================================
  camera: {
    defaultDistance: 10,
    minDistance: 5,
    maxDistance: 20,
    heightOffset: 4,
    lookAheadDistance: 2,
    smoothingFactor: 0.1,             // lerp factor per frame (0 = no smoothing, 1 = instant)
    collisionPadding: 0.5,           // units of space between camera and obstacle
    verticalAngleMin: -10,           // degrees (looking up)
    verticalAngleMax: 80,            // degrees (looking down from above)
    mouseSensitivity: 0.003,         // radians per pixel of mouse movement
    zoomSpeed: 1.0,                  // units per scroll tick
  },

  // ============================================
  // LEVEL GENERATION
  // ============================================
  generation: {
    // Platform sizing
    minPlatformWidthEasy: 3.0,
    minPlatformWidthNormal: 1.5,
    minPlatformWidthHard: 1.0,
    minPlatformWidthExtreme: 0.8,
    maxPlatformWidth: 8,
    minPlatformDepth: 1.5,
    maxPlatformDepth: 6,
    platformHeight: 1.0,             // thickness of platforms

    // Gap constraints
    minGapDistance: 2,
    maxGapDistanceEasy: 4,
    maxGapDistanceNormal: 6,
    maxGapDistanceHard: 8,
    maxGapDistanceExtreme: 9,
    maxUpwardGap: 3.25,              // must be < maxJumpHeight - safetyMargin
    maxDownwardGap: 15,
    safetyMarginHorizontal: 1.5,
    safetyMarginVertical: 0.5,

    // Platform counts
    platformCountEasy: 40,
    platformCountNormal: 65,
    platformCountHard: 90,
    platformCountExtreme: 120,

    // Section sizing
    platformsPerSection: 12,         // average platforms per themed section
    checkpointsPerEasyMin: 6,
    checkpointsPerEasyMax: 8,
    checkpointsPerNormalMin: 8,
    checkpointsPerNormalMax: 10,
    checkpointsPerHardMin: 10,
    checkpointsPerHardMax: 14,
    checkpointsPerExtremeMin: 15,
    checkpointsPerExtremeMax: 20,

    // Obstacle density (per 10 platforms)
    obstacleDensityEasy: 1,
    obstacleDensityNormal: 3,
    obstacleDensityHard: 6,
    obstacleDensityExtreme: 8,

    // Rest area frequency
    restAreaInterval: 6,             // rest platform every N difficult platforms

    // Collectibles
    starsPerPlatformRatio: 0.67,     // approximately 1 star per 1.5 platforms

    // Endless mode
    endlessChunkSize: 20,            // platforms per chunk
    endlessGenerateAheadDistance: 100,// units ahead of player to pre-generate
  },

  // ============================================
  // PLATFORM & OBSTACLE SPEC SHEETS
  // ============================================
  platformSpecs: {
    normal: {
      frequencyByDifficulty: {
        easy: [0.6, 0.8],
        normal: [0.5, 0.7],
        hard: [0.45, 0.65],
        extreme: [0.4, 0.55],
      },
    },
    thin: {
      widthRange: [0.5, 1.0],
      frequencyRange: [0.05, 0.15],
    },
    movingLinear: {
      speedRange: [2, 6],
      travelDistanceRange: [3, 10],
      frequencyRange: [0.1, 0.25],
    },
    movingCircular: {
      radiusRange: [3, 8],
      revolutionsPerSecondRange: [0.5, 2.0],
      frequencyRange: [0.05, 0.1],
    },
    rotating: {
      speedDegreesPerSecondRange: [10, 60],
      frequencyRange: [0.05, 0.15],
    },
    falling: {
      triggerDelayRange: [0.5, 0.5],
      warningDurationRange: [0.3, 1.0],
      respawnDelayRange: [3.0, 5.0],
      frequencyRange: [0.05, 0.15],
    },
    bounce: {
      bounceMultiplierRange: [1.5, 3.0],
      frequencyRange: [0.03, 0.1],
    },
    conveyor: {
      speedRange: [3, 8],
      frequencyRange: [0.05, 0.1],
    },
    appearing: {
      visibleDurationRange: [1.0, 3.0],
      hiddenDurationRange: [1.0, 3.0],
      frequencyRange: [0.03, 0.08],
    },
    ice: {
      frictionMultiplier: 0.2,
      frequencyInIceThemeRange: [0.1, 0.2],
    },
  },

  obstacleSpecs: {
    killBrick: {
      sizeRange: [0.5, 3.0],
    },
    spinningBar: {
      lengthRange: [6, 12],
      thickness: 0.5,
      speedDegreesPerSecondRange: [30, 120],
    },
    pendulum: {
      diameterRange: [2, 4],
      arcDegreesRange: [90, 180],
      periodSecondsRange: [2, 5],
    },
    crusher: {
      widthRange: [3, 6],
      openDurationRange: [1.0, 2.0],
      crushDuration: 0.5,
      retractDuration: 0.5,
    },
    laser: {
      onDurationRange: [1.0, 3.0],
      offDurationRange: [1.0, 3.0],
      warningDuration: 0.5,
    },
    windZone: {
      forceRange: [5, 15],
      sizeRange: [3, 8],
    },
  },

  // ============================================
  // OBSTACLES
  // ============================================
  obstacles: {
    spinningBar: {
      minSpeed: 30,                  // degrees per second
      maxSpeed: 120,
      minLength: 6,
      maxLength: 12,
    },
    movingPlatform: {
      minSpeed: 2,                   // units per second
      maxSpeed: 6,
      minTravelDistance: 3,
      maxTravelDistance: 10,
    },
    fallingPlatform: {
      triggerDelay: 0.5,             // seconds before starting to shake
      shakeDuration: 0.8,           // seconds of shaking before fall
      respawnDelay: 4,              // seconds before platform reappears
    },
    bouncePlatform: {
      minBounceMultiplier: 1.5,     // x normal jump height
      maxBounceMultiplier: 3.0,
    },
    conveyor: {
      minSpeed: 3,
      maxSpeed: 8,
    },
    laser: {
      minOnDuration: 1.0,
      maxOnDuration: 3.0,
      minOffDuration: 1.2,
      maxOffDuration: 3.0,
      warningDuration: 0.5,
    },
    crusher: {
      openDuration: 1.5,
      crushDuration: 0.5,
      retractDuration: 0.5,
    },
    pendulum: {
      minPeriod: 2.0,               // seconds per full swing
      maxPeriod: 5.0,
      minArcDegrees: 90,
      maxArcDegrees: 180,
    },
    windZone: {
      minForce: 5,
      maxForce: 15,
    },
    appearingPlatform: {
      minVisibleDuration: 1.0,
      maxVisibleDuration: 3.0,
      minHiddenDuration: 1.0,
      maxHiddenDuration: 3.0,
    },
  },

  // ============================================
  // CHECKPOINTS
  // ============================================
  checkpoints: {
    activationRadius: 2,
    respawnHeightOffset: 2,
  },

  // ============================================
  // SCORING
  // ============================================
  scoring: {
    baseScore: 10000,
    maxTimeBonus: 5000,
    targetTimePerPlatform: 3000,     // ms — used to calculate target time
    deathPenalty: 100,
    maxCollectibleBonus: 3000,
    starThresholds: [0, 8000, 12000, 15000, 17000],  // score thresholds for 1-5 stars
  },

  // ============================================
  // AUDIO
  // ============================================
  audio: {
    defaultMasterVolume: 0.8,
    defaultMusicVolume: 0.5,
    defaultSfxVolume: 1.0,
    musicCrossfadeDuration: 3.0,     // seconds for music transition between themes
    spatialAudioMaxDistance: 30,      // units — sounds beyond this are silent
    footstepInterval: 0.3,           // seconds between footstep sounds while running
  },

  // ============================================
  // VISUALS
  // ============================================
  visuals: {
    shadowMapSize: 2048,
    fogNear: 50,
    fogFar: 150,
    bloomThreshold: 0.8,
    bloomIntensity: 0.3,
    ssaoRadius: 0.5,
    ssaoIntensity: 0.3,
    particlePoolSize: 500,
    skyboxTransitionDuration: 3.0,   // seconds for skybox crossfade
  },

  // ============================================
  // UI
  // ============================================
  ui: {
    achievementPopupDuration: 4.0,   // seconds
    hudUpdateInterval: 0.016,        // 60fps for timer display
    touchJoystickSize: 120,          // pixels
    touchButtonSize: 80,             // pixels
  },
} as const;
