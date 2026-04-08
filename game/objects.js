// game/objects.js — PlayerModel + level building (platforms, obstacles, collectibles)
import * as THREE from 'three';
import { THEMES } from './generation.js';
import { saveManager } from './systems.js';
import RAPIER from '@dimforge/rapier3d-compat';

// ─── PLAYER MODEL ───────────────────────────────────────
export class PlayerModel {
  constructor() {
    this.group = new THREE.Group();
    this.limbs = {};
    this.colors = saveManager.load('charColors', {
      head: '#FFD93D', torso: '#4FC3F7', arms: '#4FC3F7', legs: '#5C6BC0',
    });
    this.build();
    this.animTime = 0;
    // Squash/stretch state
    this._squashTimer = 0;
    this._squashDir = 0; // 1 = squash (land), -1 = stretch (jump)
    this._scaleY = 1;
    this._scaleXZ = 1;
  }

  build() {
    while (this.group.children.length) this.group.remove(this.group.children[0]);

    const mat = (c, opts = {}) => new THREE.MeshStandardMaterial({
      color: c,
      roughness: opts.roughness ?? 0.65,
      metalness: opts.metalness ?? 0.1,
      ...opts,
    });

    // ── Torso ──
    const torso = new THREE.Mesh(
      new THREE.BoxGeometry(0.75, 0.9, 0.48),
      mat(this.colors.torso, { roughness: 0.55 })
    );
    torso.position.y = 0.92;
    torso.castShadow = true;
    this.group.add(torso);
    this.limbs.torso = torso;

    // ── Neck ──
    const neck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.15, 0.18, 8),
      mat(this.colors.head)
    );
    neck.position.y = 1.42;
    neck.castShadow = false;
    this.group.add(neck);
    this.limbs.neck = neck;

    // ── Head ──
    const head = new THREE.Mesh(
      new THREE.BoxGeometry(0.72, 0.72, 0.72),
      mat(this.colors.head, { roughness: 0.5 })
    );
    head.position.y = 1.62;
    head.castShadow = true;
    this.group.add(head);
    this.limbs.head = head;

    // Eyes
    const eyeWM = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
    const eyeM  = new THREE.MeshStandardMaterial({ color: 0x111111 });
    [-0.15, 0.15].forEach(x => {
      const w = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), eyeWM);
      w.position.set(x, 1.64, 0.36);
      w.scale.z = 0.55;
      this.group.add(w);
      const e = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 6), eyeM);
      e.position.set(x, 1.63, 0.40);
      this.group.add(e);
    });

    // ── Hat / Helmet ──
    const hatBrim = new THREE.Mesh(
      new THREE.CylinderGeometry(0.52, 0.52, 0.08, 12),
      mat(0x222222, { roughness: 0.8 })
    );
    hatBrim.position.y = 2.02;
    hatBrim.castShadow = true;
    this.group.add(hatBrim);
    this.limbs.hatBrim = hatBrim;

    const hatTop = new THREE.Mesh(
      new THREE.CylinderGeometry(0.34, 0.42, 0.44, 12),
      mat(0x111111, { roughness: 0.9 })
    );
    hatTop.position.y = 2.27;
    hatTop.castShadow = true;
    this.group.add(hatTop);
    this.limbs.hatTop = hatTop;

    // Hat band
    const hatBand = new THREE.Mesh(
      new THREE.CylinderGeometry(0.422, 0.422, 0.08, 12),
      mat(0xE53935, { roughness: 0.6, metalness: 0.15 })
    );
    hatBand.position.y = 2.07;
    this.group.add(hatBand);
    this.limbs.hatBand = hatBand;

    // ── Arms (pivot from shoulder) ──
    [-1, 1].forEach((side, i) => {
      const pivot = new THREE.Group();
      pivot.position.set(side * 0.49, 1.33, 0);
      this.group.add(pivot);

      const upper = new THREE.Mesh(
        new THREE.BoxGeometry(0.24, 0.45, 0.24),
        mat(this.colors.arms, { roughness: 0.6 })
      );
      upper.position.y = -0.22;
      upper.castShadow = true;
      pivot.add(upper);

      const lower = new THREE.Mesh(
        new THREE.BoxGeometry(0.22, 0.40, 0.22),
        mat(this.colors.arms, { roughness: 0.7 })
      );
      lower.position.y = -0.65;
      lower.castShadow = true;
      pivot.add(lower);

      // Small hand
      const hand = new THREE.Mesh(
        new THREE.BoxGeometry(0.24, 0.22, 0.24),
        mat(this.colors.head, { roughness: 0.5 })
      );
      hand.position.y = -0.88;
      hand.castShadow = true;
      pivot.add(hand);

      if (i === 0) this.limbs.leftArmPivot = pivot;
      else         this.limbs.rightArmPivot = pivot;
    });

    // ── Legs (pivot from hip) ──
    [-1, 1].forEach((side, i) => {
      const pivot = new THREE.Group();
      pivot.position.set(side * 0.175, 0.50, 0);
      this.group.add(pivot);

      const upper = new THREE.Mesh(
        new THREE.BoxGeometry(0.28, 0.44, 0.28),
        mat(this.colors.legs, { roughness: 0.7 })
      );
      upper.position.y = -0.22;
      upper.castShadow = true;
      pivot.add(upper);

      const lower = new THREE.Mesh(
        new THREE.BoxGeometry(0.26, 0.40, 0.26),
        mat(this.colors.legs, { roughness: 0.75 })
      );
      lower.position.y = -0.65;
      lower.castShadow = true;
      pivot.add(lower);

      // Boot
      const boot = new THREE.Mesh(
        new THREE.BoxGeometry(0.28, 0.18, 0.34),
        mat(0x333333, { roughness: 0.9 })
      );
      boot.position.set(0, -0.87, 0.04);
      boot.castShadow = true;
      pivot.add(boot);

      if (i === 0) this.limbs.leftLegPivot = pivot;
      else         this.limbs.rightLegPivot = pivot;
    });
  }

  triggerSquash(type) {
    // type: 'land' (squash) | 'jump' (stretch)
    this._squashDir = type === 'land' ? 1 : -1;
    this._squashTimer = type === 'land' ? 0.22 : 0.18;
  }

  animate(dt, state, speed) {
    this.animTime += dt * Math.max(1, speed * 0.12);
    const l = this.limbs;

    // Squash & Stretch
    if (this._squashTimer > 0) {
      this._squashTimer -= dt;
      const t = Math.max(0, this._squashTimer);
      if (this._squashDir === 1) {
        // Landing squash: flatter Y, wider XZ
        this._scaleY  = 1.0 - 0.28 * (t / 0.22);
        this._scaleXZ = 1.0 + 0.20 * (t / 0.22);
      } else {
        // Jump stretch: taller Y, narrower XZ
        this._scaleY  = 1.0 + 0.20 * (t / 0.18);
        this._scaleXZ = 1.0 - 0.12 * (t / 0.18);
      }
    } else {
      this._scaleY  += (1.0 - this._scaleY)  * Math.min(1, dt * 14);
      this._scaleXZ += (1.0 - this._scaleXZ) * Math.min(1, dt * 14);
    }
    this.group.scale.set(this._scaleXZ, this._scaleY, this._scaleXZ);

    const rc = this.animTime;

    switch (state) {
      case 'idle': {
        const breath = Math.sin(rc * 1.8) * 0.012;
        l.torso.position.y = 0.92 + breath;
        l.head.position.y  = 1.62 + breath * 0.5;
        l.neck.position.y  = 1.42 + breath * 0.5;
        l.hatBrim.position.y = 2.02 + breath * 0.5;
        l.hatTop.position.y  = 2.27 + breath * 0.5;
        l.hatBand.position.y = 2.07 + breath * 0.5;
        l.leftArmPivot.rotation.x  = Math.sin(rc * 1.8) * 0.04;
        l.rightArmPivot.rotation.x = -Math.sin(rc * 1.8) * 0.04;
        l.leftLegPivot.rotation.x  = 0;
        l.rightLegPivot.rotation.x = 0;
        l.leftArmPivot.rotation.z  = 0.08;
        l.rightArmPivot.rotation.z = -0.08;
        break;
      }
      case 'run': {
        const swing = Math.sin(rc * 8);
        l.leftArmPivot.rotation.x  = swing * 0.85;
        l.rightArmPivot.rotation.x = -swing * 0.85;
        l.leftLegPivot.rotation.x  = -swing * 0.75;
        l.rightLegPivot.rotation.x = swing * 0.75;
        l.leftArmPivot.rotation.z  = 0.05;
        l.rightArmPivot.rotation.z = -0.05;
        // Torso bob
        const bob = Math.abs(Math.sin(rc * 8)) * 0.04;
        l.torso.position.y = 0.92 + bob;
        l.head.position.y  = 1.62 + bob * 0.6;
        l.neck.position.y  = 1.42 + bob * 0.6;
        l.hatBrim.position.y = 2.02 + bob * 0.6;
        l.hatTop.position.y  = 2.27 + bob * 0.6;
        l.hatBand.position.y = 2.07 + bob * 0.6;
        // Lean slightly forward
        l.torso.rotation.x = -0.12;
        break;
      }
      case 'jump': {
        l.leftArmPivot.rotation.x  = -0.85;
        l.rightArmPivot.rotation.x = -0.85;
        l.leftArmPivot.rotation.z  = -0.40;
        l.rightArmPivot.rotation.z =  0.40;
        l.leftLegPivot.rotation.x  = -0.30;
        l.rightLegPivot.rotation.x = -0.30;
        l.torso.rotation.x = -0.05;
        break;
      }
      case 'fall': {
        l.leftArmPivot.rotation.x  = -0.30;
        l.rightArmPivot.rotation.x = -0.30;
        l.leftArmPivot.rotation.z  = -0.60;
        l.rightArmPivot.rotation.z =  0.60;
        l.leftLegPivot.rotation.x  =  0.20;
        l.rightLegPivot.rotation.x = -0.20;
        l.torso.rotation.x = 0.08;
        break;
      }
      default:
        l.torso.rotation.x = 0;
        break;
    }
  }

  setFlash(on) {
    this.group.traverse(c => { if (c.isMesh) c.visible = on; });
  }
}

// ─── LEVEL BUILDER ──────────────────────────────────────

/**
 * Builds all 3D meshes and Physics for a level.
 */
export function buildLevel(game, levelData, playerModelGroup) {
  const scene = game.scene;
  const world = game.world;
  
  const platformMeshes = [];
  const platformBodies = [];
  const obstacleMeshes = [];
  const obstacleBodies = [];
  const collectibleMeshes = [];
  const checkpointMeshes = [];
  const vineMeshes = [];

  scene.add(playerModelGroup);

  // Platforms
  levelData.platforms.forEach((p, idx) => {
    const theme = THEMES[p.theme] || THEMES.grasslands;
    const color = p.color || theme.colors[0];
    const isFinish = p.isFinish;
    const isCheckpoint = p.isCheckpoint && !p.isSpawn && !p.isFinish;

    // Theme-specific material properties
    const themeMatProps = {
      lava:      { roughness: 0.92, metalness: 0.25 },
      ice:       { roughness: 0.04, metalness: 0.65, envMapIntensity: 1.5 },
      space:     { roughness: 0.50, metalness: 0.45 },
      neon:      { roughness: 0.30, metalness: 0.20 },
      factory:   { roughness: 0.78, metalness: 0.35 },
      grasslands:{ roughness: 0.80, metalness: 0.05 },
      desert:    { roughness: 0.92, metalness: 0.03 },
      forest:    { roughness: 0.84, metalness: 0.06 },
      swamp:     { roughness: 0.90, metalness: 0.08 },
      taiga:     { roughness: 0.74, metalness: 0.12 },
      jungle:    { roughness: 0.86, metalness: 0.06 },
      badlands:  { roughness: 0.88, metalness: 0.10 },
      mushroom:  { roughness: 0.38, metalness: 0.18 },
      oceanic:   { roughness: 0.34, metalness: 0.32 },
      dark_forest:{ roughness: 0.82, metalness: 0.12 },
    };
    const tProps = themeMatProps[p.theme] || { roughness: 0.7, metalness: 0.1 };

    const geo = new THREE.BoxGeometry(p.size.x, p.size.y, p.size.z);
    const mat = new THREE.MeshStandardMaterial({
      color: isFinish ? 0xFFD700 : color,
      roughness: p.type === 'ice' ? 0.04 : tProps.roughness,
      metalness: p.type === 'ice' ? 0.65 : tProps.metalness,
      emissive: isFinish ? 0xFFD700 : (p.type === 'bouncy' ? 0x00E676 : (p.theme === 'neon' ? color : 0x000000)),
      emissiveIntensity: isFinish ? 0.45 : (p.type === 'bouncy' ? 0.35 : (p.theme === 'neon' ? 0.35 : 0)),
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(p.pos);
    mesh.rotation.y = p.rotation;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { levelObject: true, platData: p, idx };
    scene.add(mesh);
    platformMeshes.push(mesh);

    // Physics
    const isDynamic = p.type === 'falling' || p.type === 'moving' || p.type === 'rotating' || p.type === 'appearing';
    const rbDesc = isDynamic ? RAPIER.RigidBodyDesc.kinematicPositionBased() : RAPIER.RigidBodyDesc.fixed();
    rbDesc.setTranslation(p.pos.x, p.pos.y, p.pos.z);
    const quat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, p.rotation, 0));
    rbDesc.setRotation(quat);
    
    const rb = world.createRigidBody(rbDesc);
    const colliderDesc = RAPIER.ColliderDesc.cuboid(p.size.x/2, p.size.y/2, p.size.z/2);
    if (p.type === 'ice') colliderDesc.setFriction(0.04);
    else colliderDesc.setFriction(0.85);
    
    if (p.type === 'bouncy') colliderDesc.setRestitution(1.5);
    
    const collider = world.createCollider(colliderDesc, rb);
    game.rigidBodies.push(rb);

    platformBodies.push({
      mesh, rb, data: p, idx, origPos: p.pos.clone()
    });

    // Edge outlines
    const edges = new THREE.EdgesGeometry(geo);
    const edgeOpacity = p.theme === 'neon' ? 0.55 : 0.18;
    const edgeColor = p.theme === 'neon' ? color : 0xffffff;
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: edgeColor, transparent: true, opacity: edgeOpacity }));
    line.position.copy(p.pos);
    line.rotation.y = p.rotation;
    line.userData.levelObject = true;
    scene.add(line);

    // Finish platform point light (pulsing golden glow)
    if (isFinish) {
      const fl = new THREE.PointLight(0xFFD700, 5.0, 18);
      fl.position.set(p.pos.x, p.pos.y + 3, p.pos.z);
      fl.userData = { levelObject: true, isFinishLight: true };
      scene.add(fl);
      // Store for pulsing in game loop
      game._finishLight = fl;
      game._finishLightBase = p.pos.y + 3;
    }

    // Checkpoint flags
    if (isCheckpoint) {
      const flagGroup = new THREE.Group();
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.07, 3.2, 10),
        new THREE.MeshStandardMaterial({ color: 0xDDDDDD, metalness: 0.7, roughness: 0.3 })
      );
      pole.position.y = 1.6; flagGroup.add(pole);

      const flag = new THREE.Mesh(
        new THREE.PlaneGeometry(1.1, 0.65),
        new THREE.MeshStandardMaterial({ color: 0x69F0AE, emissive: 0x69F0AE, emissiveIntensity: 0.5, side: THREE.DoubleSide })
      );
      flag.position.set(0.55, 2.65, 0); flagGroup.add(flag);

      const glow = new THREE.Mesh(
        new THREE.SphereGeometry(0.28, 14, 14),
        new THREE.MeshStandardMaterial({ color: 0x69F0AE, emissive: 0x69F0AE, emissiveIntensity: 1.2, transparent: true, opacity: 0.7 })
      );
      glow.position.y = 3.4; flagGroup.add(glow);

      // Small point light at checkpoint
      const cpLight = new THREE.PointLight(0x69F0AE, 2.5, 8);
      cpLight.position.y = 3.4; flagGroup.add(cpLight);

      flagGroup.position.set(p.pos.x, p.pos.y + p.size.y / 2, p.pos.z);
      flagGroup.userData = { levelObject: true, cpIndex: checkpointMeshes.length, activated: idx === 0 };
      scene.add(flagGroup);
      checkpointMeshes.push(flagGroup);
    }

    // Conveyor arrows
    if (p.type === 'conveyor') {
      const arrow = new THREE.Mesh(
        new THREE.ConeGeometry(0.32, 0.65, 4),
        new THREE.MeshStandardMaterial({ color: 0xFFC107, emissive: 0xFFC107, emissiveIntensity: 0.45 })
      );
      arrow.rotation.x = -Math.PI / 2;
      const dMap = { 'x': Math.PI / 2, '-x': -Math.PI / 2, 'z': 0, '-z': Math.PI };
      arrow.rotation.z = dMap[p.moveData.convDir] || 0;
      arrow.position.set(p.pos.x, p.pos.y + p.size.y / 2 + 0.12, p.pos.z);
      arrow.userData.levelObject = true;
      scene.add(arrow);
    }
  });

  // Obstacles
  levelData.obstacles.forEach((obs, idx) => {
    let mesh;
    let colDesc = null;
    let s = obs.size;

    switch (obs.type) {
      case 'killBrick': {
        mesh = new THREE.Mesh(
          new THREE.BoxGeometry(s, s, s),
          new THREE.MeshStandardMaterial({ color: 0xF44336, emissive: 0xF44336, emissiveIntensity: 0.7, roughness: 0.4 })
        );
        mesh.position.copy(obs.pos);
        colDesc = RAPIER.ColliderDesc.cuboid(s/2, s/2, s/2);
        break;
      }
      case 'spinBar': {
        const group = new THREE.Group();
        const bar = new THREE.Mesh(
          new THREE.BoxGeometry(s, 0.35, 0.35),
          new THREE.MeshStandardMaterial({ color: 0xFF5722, emissive: 0xFF3D00, emissiveIntensity: 0.55, roughness: 0.3 })
        );
        group.add(bar);
        const pole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.1, 0.1, 1.2, 8),
          new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.6, roughness: 0.3 })
        );
        pole.position.y = -0.6; group.add(pole);
        group.position.copy(obs.pos);
        mesh = group;
        colDesc = RAPIER.ColliderDesc.cuboid(s/2, 0.35/2, 0.35/2); 
        break;
      }
      case 'laser': {
        const group = new THREE.Group();
        const beam = new THREE.Mesh(
          new THREE.BoxGeometry(s, 0.15, 0.15),
          new THREE.MeshStandardMaterial({ color: 0xFF1744, emissive: 0xFF1744, emissiveIntensity: 2.0, transparent: true, opacity: 0.85 })
        );
        group.add(beam);
        [-s/2, s/2].forEach(x => {
          const em = new THREE.Mesh(
            new THREE.SphereGeometry(0.22, 10, 10),
            new THREE.MeshStandardMaterial({ color: 0xFF1744, emissive: 0xFF1744, emissiveIntensity: 1.2, roughness: 0.2 })
          );
          em.position.x = x; group.add(em);
        });
        group.position.copy(obs.pos);
        group.userData.beam = beam;
        mesh = group;
        colDesc = RAPIER.ColliderDesc.cuboid(s/2, 0.075, 0.075);
        break;
      }
      case 'pendulum': {
        const group = new THREE.Group();
        const ball = new THREE.Mesh(
          new THREE.SphereGeometry(0.65, 14, 14),
          new THREE.MeshStandardMaterial({ color: 0x37474F, metalness: 0.7, roughness: 0.3 })
        );
        ball.position.y = -2; group.add(ball);
        const chain = new THREE.Mesh(
          new THREE.CylinderGeometry(0.05, 0.05, 2, 8),
          new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.5, roughness: 0.4 })
        );
        chain.position.y = -1; group.add(chain);
        group.position.set(obs.pos.x, obs.pos.y + 3, obs.pos.z);
        mesh = group;
        colDesc = RAPIER.ColliderDesc.ball(0.65);
        break;
      }
      case 'crusher': {
        mesh = new THREE.Mesh(
          new THREE.BoxGeometry(s/2, s*0.3, s/2),
          new THREE.MeshStandardMaterial({ color: 0x546E7A, metalness: 0.6, roughness: 0.4 })
        );
        mesh.position.copy(obs.pos);
        mesh.position.y += 3;
        colDesc = RAPIER.ColliderDesc.cuboid(s/4, s*0.15, s/4);
        break;
      }
      case 'windZone': {
        mesh = new THREE.Mesh(
          new THREE.BoxGeometry(3, 4, 3),
          new THREE.MeshStandardMaterial({ color: 0x81D4FA, transparent: true, opacity: 0.09, roughness: 0.1 })
        );
        mesh.position.set(obs.pos.x, obs.pos.y + 2, obs.pos.z);
        colDesc = RAPIER.ColliderDesc.cuboid(1.5, 2, 1.5).setSensor(true);
        break;
      }
      default: {
        mesh = new THREE.Mesh(
          new THREE.BoxGeometry(0.8, 0.8, 0.8),
          new THREE.MeshStandardMaterial({ color: 0xFF0000, emissive: 0xFF0000, emissiveIntensity: 0.4 })
        );
        mesh.position.copy(obs.pos);
        colDesc = RAPIER.ColliderDesc.cuboid(0.4, 0.4, 0.4);
      }
    }

    if (mesh) {
      mesh.userData = { levelObject: true, obsData: obs, idx, obsType: obs.type };
      mesh.traverse(c => { c.userData.levelObject = true; });
      mesh.castShadow = true;
      scene.add(mesh);
      obstacleMeshes.push(mesh);
      
      const rbDesc = RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(mesh.position.x, mesh.position.y, mesh.position.z);
      const rb = world.createRigidBody(rbDesc);
      const collider = world.createCollider(colDesc, rb);
      game.rigidBodies.push(rb);

      obstacleBodies.push({ mesh, rb, data: obs, type: obs.type });
    }
  });

  // Collectibles (stars)
  levelData.collectibles.forEach((col, idx) => {
    const group = new THREE.Group();
    const star = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.38, 0),
      new THREE.MeshStandardMaterial({ color: 0xFFD700, emissive: 0xFFD700, emissiveIntensity: 0.9, roughness: 0.2, metalness: 0.3 })
    );
    star.castShadow = true; group.add(star);

    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(0.55, 10, 10),
      new THREE.MeshStandardMaterial({ color: 0xFFD700, emissive: 0xFFD700, emissiveIntensity: 0.6, transparent: true, opacity: 0.18 })
    );
    group.add(glow);

    // Small point light for each star
    const starLight = new THREE.PointLight(0xFFD700, 1.8, 4.0);
    group.add(starLight);

    group.position.copy(col.pos);
    group.userData = { levelObject: true, colData: col, idx, collected: false };
    scene.add(group);
    collectibleMeshes.push(group);
  });

  // Climb vines for hill traversal support
  (levelData.vines || []).forEach((vine, idx) => {
    const theme = THEMES[vine.theme] || THEMES.grasslands;
    const vineRadius = 0.14;
    const vineGeo = new THREE.CylinderGeometry(vineRadius, vineRadius * 0.9, vine.height, 8, 1, false);
    const vineMat = new THREE.MeshStandardMaterial({
      color: theme.accent,
      roughness: 0.9,
      metalness: 0.02,
      emissive: vine.theme === 'neon' ? theme.accent : 0x000000,
      emissiveIntensity: vine.theme === 'neon' ? 0.2 : 0,
    });
    const mesh = new THREE.Mesh(vineGeo, vineMat);
    mesh.position.copy(vine.pos);
    mesh.castShadow = true;
    mesh.userData = { levelObject: true, vineData: vine, idx };
    scene.add(mesh);

    const leafColor = theme.colors[1] || theme.colors[0];
    const leafGeo = new THREE.SphereGeometry(0.16, 7, 7);
    for (let i = 0; i < 3; i++) {
      const leaf = new THREE.Mesh(
        leafGeo,
        new THREE.MeshStandardMaterial({ color: leafColor, roughness: 0.85, metalness: 0.02 })
      );
      leaf.position.set(
        vine.pos.x + (i - 1) * 0.16,
        vine.pos.y - vine.height * 0.25 + i * (vine.height * 0.25),
        vine.pos.z + (i % 2 === 0 ? 0.12 : -0.12)
      );
      leaf.userData.levelObject = true;
      scene.add(leaf);
    }
    vineMeshes.push(mesh);
  });

  return { platformMeshes, platformBodies, obstacleMeshes, obstacleBodies, collectibleMeshes, checkpointMeshes, vineMeshes };
}
