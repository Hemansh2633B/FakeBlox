// game/player.js — Player movement, physics, collision, camera
import * as THREE from 'three';
import { CONFIG, THEMES } from './generation.js';
import { audio } from './audio.js';
import * as TWEEN from '@tweenjs/tween.js';
// import { Text } from 'troika-three-text';

// ─── Sprint Trail System ────────────────────────────────────────
const TRAIL_COUNT = 18;
const _trailPool = [];
let _trailIdx = 0;

function initTrail(scene) {
  if (_trailPool.length > 0) return;
  const geo = new THREE.PlaneGeometry(0.55, 0.9);
  for (let i = 0; i < TRAIL_COUNT; i++) {
    const mat = new THREE.MeshBasicMaterial({
      color: 0xaaddff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const m = new THREE.Mesh(geo, mat);
    m.userData.isTrail = true;
    m.visible = false;
    scene.add(m);
    _trailPool.push({ mesh: m, life: 0, maxLife: 0.28 });
  }
}

function emitTrail(pos, scene, active) {
  if (!active || _trailPool.length === 0) return;
  const t = _trailPool[_trailIdx % TRAIL_COUNT];
  _trailIdx++;
  t.mesh.position.copy(pos);
  t.mesh.position.y += 0.6;
  t.mesh.material.opacity = 0.32;
  t.mesh.visible = true;
  t.life = t.maxLife;
}

function updateTrail(dt) {
  _trailPool.forEach(t => {
    if (!t.mesh.visible) return;
    t.life -= dt;
    if (t.life <= 0) {
      t.mesh.visible = false;
      t.mesh.material.opacity = 0;
    } else {
      t.mesh.material.opacity = (t.life / t.maxLife) * 0.30;
      t.mesh.scale.setScalar(t.life / t.maxLife);
    }
  });
}

/**
 * Updates player movement, physics, and animation.
 * @param {object} game - The game state object
 * @param {number} dt - Delta time
 */
export function updatePlayer(game, dt) {
  if (game.isDead || game.state !== 'playing') return;
  const P = CONFIG.player;
  const inp = game.input;
  const time = game.clock.elapsedTime;

  // Init trail on first call
  if (!game._trailInited) {
    initTrail(game.scene);
    game._trailInited = true;
  }

  game.platformBodies.forEach((pb) => {
    const p = pb.data;
    const mesh = pb.mesh;
    const rb = pb.rb;
    let newPos = pb.origPos.clone();
    let newQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, p.rotation, 0));

    if (p.type === 'moving' && p.moveData) {
      const md = p.moveData;
      const offset = Math.sin(time * md.speed + (md.phase || 0)) * md.dist;
      if (md.axis === 'x') newPos.x += offset;
      else if (md.axis === 'y') newPos.y += offset;
      else newPos.z += offset;
    }
    if (p.type === 'rotating' && p.moveData) {
      newQuat.setFromEuler(new THREE.Euler(0, time * p.moveData.rotSpeed, 0));
    }
    if (p.type === 'appearing' && p.moveData) {
      const cycle = p.moveData.onTime + p.moveData.offTime;
      const phase = ((time + (p.moveData.phase || 0)) % cycle);
      const visible = phase < p.moveData.onTime;
      mesh.visible = visible;
      if (!visible) newPos.y -= 1000;
    }
    if (p.type === 'falling') {
      if (pb._falling) {
        pb._fallTimer += dt;
        if (pb._fallTimer < 0.8) {
          newPos.x += (Math.random() - 0.5) * 0.15;
          newPos.z += (Math.random() - 0.5) * 0.15;
        } else if (pb._fallTimer < 4) {
          mesh.visible = false;
          newPos.y -= 1000;
        } else {
          pb._falling = false;
          pb._fallTimer = 0;
          mesh.visible = true;
        }
      }
    }

    if (rb) {
      rb.setNextKinematicTranslation(newPos);
      rb.setNextKinematicRotation(newQuat);
    }
    mesh.position.copy(newPos);
    mesh.quaternion.copy(newQuat);
  });

  const forward = new THREE.Vector3(-Math.sin(game.camTheta), 0, -Math.cos(game.camTheta));
  const right = new THREE.Vector3(-forward.z, 0, forward.x);
  const moveDir = new THREE.Vector3();
  moveDir.addScaledVector(forward, inp.moveDir.y);
  moveDir.addScaledVector(right, inp.moveDir.x);
  if (moveDir.length() > 1) moveDir.normalize();

  if (!game.timerStarted && (moveDir.length() > 0.1 || inp.jump)) game.timerStarted = true;

  const targetSpeed = inp.sprint ? P.sprintSpeed : P.walkSpeed;
  const accel = game.grounded ? P.acceleration : P.acceleration * P.airControl;
  const decel = game.grounded ? P.deceleration : P.deceleration * P.airControl * 0.5;

  if (moveDir.length() > 0.1) {
    game.playerVel.x += moveDir.x * accel * dt;
    game.playerVel.z += moveDir.z * accel * dt;
    const hSpeed = Math.sqrt(game.playerVel.x ** 2 + game.playerVel.z ** 2);
    if (hSpeed > targetSpeed) {
      game.playerVel.x *= targetSpeed / hSpeed;
      game.playerVel.z *= targetSpeed / hSpeed;
    }
  } else {
    const hSpeed = Math.sqrt(game.playerVel.x ** 2 + game.playerVel.z ** 2);
    if (hSpeed > 0.1) {
      const drop = Math.min(decel * dt, hSpeed);
      game.playerVel.x *= (hSpeed - drop) / hSpeed;
      game.playerVel.z *= (hSpeed - drop) / hSpeed;
    } else {
      game.playerVel.x = 0; game.playerVel.z = 0;
    }
  }
  game.moveSpeed = Math.sqrt(game.playerVel.x ** 2 + game.playerVel.z ** 2);

  game.coyoteTimer = game.grounded ? P.coyoteTime : game.coyoteTimer - dt;
  game.jumpBufferTimer = inp.jumpPressed ? P.jumpBuffer : game.jumpBufferTimer - dt;

  const wasGroundedBefore = game.grounded;

  if (game.jumpBufferTimer > 0 && game.coyoteTimer > 0) {
    game.playerVel.y = P.jumpForce;
    game.jumpHeld = true;
    game.coyoteTimer = 0; game.jumpBufferTimer = 0; game.grounded = false;
    audio.jump();
    if (game.playerModel.triggerSquash) game.playerModel.triggerSquash('jump');
    if (game.groundedPlatform?.data?.type === 'bouncy') {
      game.playerVel.y = P.jumpForce * 2; audio.bounce(game.playerPos);
    }
  }

  if (!inp.jump && game.jumpHeld && game.playerVel.y > P.jumpForce * P.varJumpMin) {
    game.playerVel.y = P.jumpForce * P.varJumpMin;
    game.jumpHeld = false;
  }
  if (game.grounded) game.jumpHeld = false;

  const grav = game.playerVel.y <= 0 ? P.gravity * P.fallGravMul : P.gravity;
  const spaceMul = game.currentTheme === 'space' ? 0.5 : 1.0;
  game.playerVel.y -= grav * spaceMul * dt;
  game.playerVel.y = Math.max(game.playerVel.y, -40); // terminal velocity

  const desiredMovement = new THREE.Vector3(game.playerVel.x * dt, game.playerVel.y * dt, game.playerVel.z * dt);
  
  if (game.groundedPlatform) {
    const pt = game.groundedPlatform.data;
    if (pt.type === 'moving' && pt.moveData) {
      const vel = Math.cos(time * pt.moveData.speed + (pt.moveData.phase || 0)) * pt.moveData.dist * pt.moveData.speed;
      if (pt.moveData.axis === 'x') desiredMovement.x += vel * dt;
      else if (pt.moveData.axis === 'z') desiredMovement.z += vel * dt;
      else if (pt.moveData.axis === 'y' && vel > 0) desiredMovement.y += vel * dt;
    }
    if (pt.type === 'conveyor') {
      const cd = pt.moveData;
      const convMap = { 'x': [1, 0, 0], '-x': [-1, 0, 0], 'z': [0, 0, 1], '-z': [0, 0, -1] };
      const dir = convMap[cd.convDir] || [0, 0, 0];
      desiredMovement.x += dir[0] * cd.convSpeed * dt * 3;
      desiredMovement.z += dir[2] * cd.convSpeed * dt * 3;
    }
  }
  
  if (game.playerController && game.playerCollider) {
    game.playerController.computeColliderMovement(game.playerCollider, desiredMovement);
    const movement = game.playerController.computedMovement();
    
    let bodyPos = game.playerRB.translation();
    bodyPos.x += movement.x; bodyPos.y += movement.y; bodyPos.z += movement.z;
    game.playerRB.setNextKinematicTranslation(bodyPos);
    game.playerPos.copy(bodyPos);

    game.grounded = game.playerController.computedGrounded();
    if (game.grounded) {
      if (game.playerVel.y < 0) game.playerVel.y = -0.1;
      
      const rayDir = { x: 0, y: -1, z: 0 };
      const rayOrigin = { x: bodyPos.x, y: bodyPos.y - P.height/2 + 0.1, z: bodyPos.z };
      const hit = game.world.castRay({ origin: rayOrigin, dir: rayDir }, 0.5, true);
      if (hit && hit.collider) {
        const plat = game.platformBodies.find(pb => pb.rb && pb.rb.handle === hit.collider.parent());
        game.groundedPlatform = plat || null;
        if (plat && plat.data.type === 'falling' && !plat._falling) {
          plat._falling = true; plat._fallTimer = 0;
        }
      } else game.groundedPlatform = null;
    } else game.groundedPlatform = null;
  }

  // Landing detection → squash + camera shake
  const justLanded = game.grounded && !game.wasGrounded;
  if (justLanded) {
    const impact = Math.abs(desiredMovement.y);
    if (impact > 15 * dt) {
      // Hard landing
      game._camShake = 0.22;
      game._camShakeMag = 0.28;
      if (game.playerModel.triggerSquash) game.playerModel.triggerSquash('land');
      audio.landHard(game.playerPos);
    } else {
      // Soft landing
      game._camShake = 0.10;
      game._camShakeMag = 0.10;
      if (game.playerModel.triggerSquash) game.playerModel.triggerSquash('land');
      audio.land(game.playerPos);
    }
  }
  game.wasGrounded = game.grounded;

  if (moveDir.length() > 0.1 || inp.shiftLocked) {
    const targetAngle = inp.shiftLocked ? game.camTheta + Math.PI : Math.atan2(moveDir.x, moveDir.z);
    let currentAngle = game.playerModel.group.rotation.y;
    let diff = targetAngle - currentAngle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    game.playerModel.group.rotation.y += diff * Math.min(1, 12 * dt);
  }
  game.playerModel.group.position.copy(game.playerPos);
  game.playerModel.group.position.y -= P.height / 2;

  let animState = 'idle';
  if (!game.grounded) animState = desiredMovement.y > 0 ? 'jump' : 'fall';
  else if (game.moveSpeed > 1) animState = 'run';
  game.playerModel.animate(dt, animState, game.moveSpeed);

  // Sprint trail
  if (inp.sprint && game.grounded && game.moveSpeed > 12) {
    if (!game._trailTimer) game._trailTimer = 0;
    game._trailTimer -= dt;
    if (game._trailTimer <= 0) {
      emitTrail(game.playerPos, game.scene, true);
      game._trailTimer = 0.055;
    }
  }
  updateTrail(dt);

  // Finish platform light pulse
  if (game._finishLight) {
    game._finishLight.intensity = 5.0 + Math.sin(game.clock.elapsedTime * 3.5) * 2.0;
  }

  const lowestPlat = game.levelData.platforms.reduce((min, p) => Math.min(min, p.pos.y), 100);
  if (game.playerPos.y < lowestPlat - 20) game.die();

  if (game.invincible) {
    game.invincTimer -= dt;
    game.flashTimer += dt;
    game.playerModel.setFlash(Math.sin(game.flashTimer * 20) > 0);
    if (game.invincTimer <= 0) { game.invincible = false; game.playerModel.setFlash(true); }
  }
}


/**
 * Updates obstacles (animation + player collision).
 */
export function updateObstacles(game, dt) {
  const time = game.clock.elapsedTime;
  const pR = CONFIG.player.radius;
  const pHH = CONFIG.player.height / 2;
  const pos = game.playerPos;

  game.obstacleBodies.forEach((ob) => {
    const obs = ob.data;
    const mesh = ob.mesh;
    const rb = ob.rb;

    switch (obs.type) {
      case 'killBrick': {
        const pulse = 0.4 + Math.sin(time * 3 + obs.phase) * 0.25;
        if (mesh.material) mesh.material.emissiveIntensity = pulse;
        break;
      }
      case 'spinBar':
        mesh.rotation.y = time * obs.speed * 2;
        if (rb) rb.setNextKinematicRotation(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, mesh.rotation.y, 0)));
        break;
      case 'laser': {
        const cycle = 3.0;
        const phase = ((time * obs.speed + obs.phase) % cycle);
        const active = phase < cycle * 0.5;
        const beam = mesh.userData.beam || mesh.children?.[0];
        if (beam) {
          beam.visible = active;
          beam.material.opacity = active ? 0.85 : 0;
          if (rb) rb.setNextKinematicTranslation({ x: mesh.position.x, y: active ? mesh.position.y : mesh.position.y - 1000, z: mesh.position.z });
        }
        if (!active) return;
        break;
      }
      case 'pendulum': {
        const angle = Math.sin(time * obs.speed + obs.phase) * 1.2;
        mesh.rotation.z = angle;
        if (rb) {
          const ballPos = new THREE.Vector3(
            obs.pos.x + Math.sin(angle) * 2,
            obs.pos.y + 3 - Math.cos(angle) * 2,
            obs.pos.z
          );
          rb.setNextKinematicTranslation(ballPos);
        }
        break;
      }
      case 'crusher': {
        const cycle = 3.0;
        const phase = ((time * obs.speed * 0.5 + obs.phase) % cycle);
        const yOff = phase < 0.5 ? 0 : (phase < 1.0 ? -(phase - 0.5) * 6 : (phase < 1.5 ? -3 : -3 + (phase - 1.5) * 2));
        mesh.position.y = obs.pos.y + 3 + Math.max(yOff, -3);
        if (rb) rb.setNextKinematicTranslation(mesh.position);
        break;
      }
    }

    if (game.isDead || game.invincible) return;

    const box = new THREE.Box3().setFromObject(mesh);
    const playerBox = new THREE.Box3(
      new THREE.Vector3(pos.x - pR, pos.y - pHH, pos.z - pR),
      new THREE.Vector3(pos.x + pR, pos.y + pHH, pos.z + pR)
    );

    if (box.intersectsBox(playerBox)) {
      if (obs.type === 'windZone') {
        game.playerVel.x += (Math.sin(obs.phase) * 8) * dt;
        game.playerVel.z += (Math.cos(obs.phase) * 8) * dt;
        return;
      }
      if (obs.type === 'laser') {
        const cycle = 3.0;
        const phase = ((time * obs.speed + obs.phase) % cycle);
        if (phase >= cycle * 0.5) return;
      }
      game.die();
    }
  });
}

/**
 * Updates collectibles (spinning + collection).
 */
export function updateCollectibles(game, dt) {
  const time = game.clock.elapsedTime;
  const pos = game.playerPos;

  game.collectibleMeshes.forEach((group, i) => {
    if (group.userData.collected) return;
    group.rotation.y = time * 2.2;
    group.rotation.x = Math.sin(time * 1.5 + i) * 0.15;
    group.position.y = group.userData.colData.pos.y + Math.sin(time * 3 + i) * 0.22;
    const dist = pos.distanceTo(group.position);
    if (dist < 1.2) {
      group.userData.collected = true;
      group.visible = false;
      game.starsCollected++;
      audio.collectStar(group.position);
      game.particles.emit(group.position.clone(), 15, 0xFFD700, new THREE.Vector3(0, 3, 0), 0.6, 0.1);
      game.showNotification('⭐ +1');

      /* const floatText = new Text();
      floatText.text = '+1';
      floatText.fontSize = 0.8;
      floatText.fontPath = 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK.woff2';
      floatText.position.copy(group.position);
      floatText.position.y += 1;
      floatText.color = 0xFFD700;
      floatText.anchorX = 'center';
      floatText.anchorY = 'middle';
      game.scene.add(floatText);
      floatText.sync();

      new TWEEN.Tween(floatText.position)
        .to({ y: floatText.position.y + 3 }, 1000)
        .easing(TWEEN.Easing.Quadratic.Out)
        .start();
        
      new TWEEN.Tween(floatText)
        .to({ fillOpacity: 0 }, 1000)
        .easing(TWEEN.Easing.Quadratic.In)
        .onComplete(() => {
          game.scene.remove(floatText);
          floatText.dispose();
        })
        .start(); */
    }
  });
}

/**
 * Updates checkpoint activation + finish line detection.
 */
export function updateCheckpoints(game) {
  const pos = game.playerPos;
  const data = game.levelData;
  const cpIndices = data.checkpoints;

  game.checkpointMeshes.forEach((group, i) => {
    if (group.userData.activated) return;
    const cpPlatIdx = cpIndices[i + 1];
    if (cpPlatIdx === undefined) return;
    const platData = data.platforms[cpPlatIdx];
    if (!platData) return;

    const dist = new THREE.Vector2(pos.x - platData.pos.x, pos.z - platData.pos.z).length();
    if (dist < CONFIG.camera.dist * 0.3 && Math.abs(pos.y - platData.pos.y) < 4) {
      group.userData.activated = true;
      game.currentCheckpoint = i + 1;
      game.checkpointPos.set(platData.pos.x, platData.pos.y + 2, platData.pos.z);
      audio.checkpoint();
      game.particles.emit(
        new THREE.Vector3(platData.pos.x, platData.pos.y + 1.5, platData.pos.z),
        40, 0x69F0AE, new THREE.Vector3(0, 5, 0), 1.0, 0.15
      );
      game.showNotification(`✓ Checkpoint ${game.currentCheckpoint}/${cpIndices.length - 1}`);

      const sectionSize = Math.ceil(data.platforms.length / data.themes.length);
      const sectionIdx = Math.min(Math.floor(cpPlatIdx / sectionSize), data.themes.length - 1);
      const newTheme = data.themes[sectionIdx];
      if (newTheme !== game.currentTheme) {
        game.applyTheme(newTheme);
        audio.startMusic(newTheme);
      }
    }
  });

  // Check finish line
  const finishPlat = data.platforms[data.platforms.length - 1];
  if (finishPlat && finishPlat.isFinish) {
    const dist = pos.distanceTo(finishPlat.pos);
    if (dist < 5 && Math.abs(pos.y - finishPlat.pos.y) < 5) {
      game.completeLevel();
    }
  }
}

/**
 * Updates camera orbit + view bob + camera shake.
 */
export function updateCamera(game, dt) {
  const C = CONFIG.camera;
  game.camTheta -= game.input.camDelta.x * C.sensitivity;
  game.camPhi -= game.input.camDelta.y * C.sensitivity;
  game.camPhi = THREE.MathUtils.clamp(game.camPhi, THREE.MathUtils.degToRad(C.vMin), THREE.MathUtils.degToRad(C.vMax));

  const hVel = new THREE.Vector3(game.playerVel.x, 0, game.playerVel.z);
  const lookAhead = hVel.clone().normalize().multiplyScalar(C.lookAhead * Math.min(1, hVel.length() / 10));

  let shiftOffset = new THREE.Vector3();
  if (game.input.shiftLocked) {
    const camRight = new THREE.Vector3(Math.cos(game.camTheta), 0, -Math.sin(game.camTheta));
    shiftOffset.addScaledVector(camRight, 2.0);
  }

  // View bob when running on ground
  let bobOffset = 0;
  if (game.grounded && game.moveSpeed > 2) {
    const bobFreq = game.moveSpeed * 0.55;
    bobOffset = Math.sin(game.clock.elapsedTime * bobFreq) * 0.10 * Math.min(1, game.moveSpeed / 14);
  }

  // Camera shake decay
  if (!game._camShake) game._camShake = 0;
  if (!game._camShakeMag) game._camShakeMag = 0;
  let shakeY = 0, shakeX = 0;
  if (game._camShake > 0) {
    game._camShake -= dt;
    const mag = game._camShakeMag * Math.max(0, game._camShake / 0.22);
    shakeY = (Math.random() - 0.5) * mag;
    shakeX = (Math.random() - 0.5) * mag * 0.5;
  }

  const targetPos = game.playerPos.clone().add(
    new THREE.Vector3(lookAhead.x, C.height + bobOffset + shakeY, lookAhead.z)
  ).add(shiftOffset);
  game.camTarget.lerp(targetPos, C.smooth * 2);

  // Apply shake to camera target
  game.camTarget.x += shakeX;

  const sinPhi = Math.sin(game.camPhi);
  const cosPhi = Math.cos(game.camPhi);
  const desiredPos = new THREE.Vector3(
    game.camTarget.x + game.camDist * sinPhi * Math.sin(game.camTheta),
    game.camTarget.y + game.camDist * cosPhi,
    game.camTarget.z + game.camDist * sinPhi * Math.cos(game.camTheta)
  );

  const dir = desiredPos.clone().sub(game.camTarget).normalize();
  const maxDist = desiredPos.distanceTo(game.camTarget);
  const ray = new THREE.Raycaster(game.camTarget, dir, 0, maxDist);
  const hits = ray.intersectObjects(game.platformMeshes, false);

  if (hits.length > 0) {
    const hitDist = Math.max(hits[0].distance - C.collPad, 2);
    const clampedPos = game.camTarget.clone().add(dir.multiplyScalar(hitDist));
    game.camPos.lerp(clampedPos, C.smooth * 3);
  } else {
    game.camPos.lerp(desiredPos, C.smooth);
  }

  game.threeCamera.position.copy(game.camPos);
  game.threeCamera.lookAt(game.camTarget);
  audio.updateListener(game.camPos, game.camTarget.clone().sub(game.camPos).normalize());

  if (game.dirLight) {
    game.dirLight.position.set(game.playerPos.x + 30, game.playerPos.y + 50, game.playerPos.z + 30);
    game.dirLight.target.position.copy(game.playerPos);
  }
}

/**
 * Updates environment particles based on current theme.
 */
export function updateEnvParticles(game) {
  if (!game.currentTheme) return;
  if (Math.random() < 0.3) {
    const t = THEMES[game.currentTheme];
    const pPos = game.playerPos.clone().add(new THREE.Vector3(
      (Math.random() - 0.5) * 30,
      Math.random() * 15,
      (Math.random() - 0.5) * 30
    ));
    switch (t.particles) {
      case 'leaves':
        game.particles.emit(pPos, 1, 0x66BB6A, new THREE.Vector3(-0.5, -1, 0.3), 3, 0.08);
        break;
      case 'embers':
        game.particles.emit(pPos, 1, 0xFF6D00, new THREE.Vector3(0, 2, 0), 2, 0.06);
        break;
      case 'snow':
        game.particles.emit(pPos, 1, 0xFFFFFF, new THREE.Vector3(0.2, -2, 0.1), 4, 0.07);
        break;
      case 'stars':
        game.particles.emit(pPos, 1, 0xB388FF, new THREE.Vector3(0, 0.2, 0), 5, 0.05);
        break;
      case 'sparks':
        if (Math.random() < 0.3) game.particles.emit(pPos, 2, 0xFFC107, new THREE.Vector3(0, 1, 0), 0.5, 0.04);
        break;
      case 'neonOrbs': {
        const neonColors = [0xFF00FF, 0x00FFFF, 0xFFFF00, 0x00FF00];
        game.particles.emit(pPos, 1, neonColors[Math.floor(Math.random() * neonColors.length)], new THREE.Vector3(0, 0.5, 0), 3, 0.1);
        break;
      }
    }
  }
}
