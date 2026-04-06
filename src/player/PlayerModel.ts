import * as THREE from 'three';

export class PlayerModel {
  public mesh: THREE.Group;
  private rig: THREE.Group;
  private head: THREE.Mesh;
  private torso: THREE.Mesh;
  private leftArm: THREE.Mesh;
  private rightArm: THREE.Mesh;
  private leftLeg: THREE.Mesh;
  private rightLeg: THREE.Mesh;
  private face: THREE.Group;
  private time: number = 0;

  constructor() {
    this.mesh = new THREE.Group();
    this.rig = new THREE.Group();
    this.mesh.add(this.rig);

    // Roblox-style chunky materials with soft shading.
    const skinMaterial = new THREE.MeshStandardMaterial({ color: 0xffd383, roughness: 0.55, metalness: 0.05 });
    const shirtMaterial = new THREE.MeshStandardMaterial({ color: 0x6bcb77, roughness: 0.6, metalness: 0.02 });
    const pantsMaterial = new THREE.MeshStandardMaterial({ color: 0x4d96ff, roughness: 0.62, metalness: 0.02 });
    const trimMaterial = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.8, metalness: 0 });

    // Head (slightly oversized, Roblox-inspired proportions)
    const headGeom = new THREE.BoxGeometry(0.85, 0.85, 0.85);
    this.head = new THREE.Mesh(headGeom, skinMaterial);
    this.head.position.y = 1.45;
    this.head.castShadow = true;
    this.rig.add(this.head);

    // Face components
    this.face = new THREE.Group();
    const eyeGeom = new THREE.BoxGeometry(0.1, 0.1, 0.06);
    const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.7, metalness: 0 });
    const leftEye = new THREE.Mesh(eyeGeom, eyeMaterial);
    leftEye.position.set(-0.2, 0.1, 0.45);
    const rightEye = new THREE.Mesh(eyeGeom, eyeMaterial);
    rightEye.position.set(0.2, 0.1, 0.45);
    this.face.add(leftEye, rightEye);

    const mouthGeom = new THREE.BoxGeometry(0.3, 0.08, 0.06);
    const mouth = new THREE.Mesh(mouthGeom, eyeMaterial);
    mouth.position.set(0, -0.15, 0.45);
    this.face.add(mouth);

    this.head.add(this.face);

    // Torso
    const torsoGeom = new THREE.BoxGeometry(0.95, 1.05, 0.52);
    this.torso = new THREE.Mesh(torsoGeom, shirtMaterial);
    this.torso.position.y = 0.56;
    this.torso.castShadow = true;
    this.rig.add(this.torso);

    const torsoStripe = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.15, 0.54), trimMaterial);
    torsoStripe.position.set(0, 0.38, 0);
    torsoStripe.castShadow = true;
    this.rig.add(torsoStripe);

    // Arms
    const armGeom = new THREE.BoxGeometry(0.35, 1.02, 0.35);
    this.leftArm = new THREE.Mesh(armGeom, skinMaterial);
    this.leftArm.position.set(-0.68, 0.52, 0);
    this.leftArm.castShadow = true;
    this.rig.add(this.leftArm);

    this.rightArm = new THREE.Mesh(armGeom, skinMaterial);
    this.rightArm.position.set(0.68, 0.52, 0);
    this.rightArm.castShadow = true;
    this.rig.add(this.rightArm);

    // Legs
    const legGeom = new THREE.BoxGeometry(0.38, 0.95, 0.38);
    this.leftLeg = new THREE.Mesh(legGeom, pantsMaterial);
    this.leftLeg.position.set(-0.24, -0.48, 0);
    this.leftLeg.castShadow = true;
    this.rig.add(this.leftLeg);

    this.rightLeg = new THREE.Mesh(legGeom, pantsMaterial);
    this.rightLeg.position.set(0.24, -0.48, 0);
    this.rightLeg.castShadow = true;
    this.rig.add(this.rightLeg);

    // "Shoe" trims for readability at speed.
    const shoeGeom = new THREE.BoxGeometry(0.4, 0.14, 0.42);
    const leftShoe = new THREE.Mesh(shoeGeom, trimMaterial);
    leftShoe.position.set(-0.24, -0.98, 0.03);
    const rightShoe = new THREE.Mesh(shoeGeom, trimMaterial);
    rightShoe.position.set(0.24, -0.98, 0.03);
    this.rig.add(leftShoe, rightShoe);

    this.addSilhouette();

    // Adjust the whole group
    this.mesh.position.y = 0.2;
  }

  private addSilhouette(): void {
    const outlineMat = new THREE.MeshBasicMaterial({ color: 0x161616, side: THREE.BackSide });
    this.rig.traverse((obj: THREE.Object3D) => {
      if (!(obj instanceof THREE.Mesh)) return;
      if ((obj.userData as { isOutline?: boolean }).isOutline) return;
      const outline = new THREE.Mesh((obj.geometry as THREE.BufferGeometry).clone(), outlineMat);
      outline.userData = { ...outline.userData, isOutline: true };
      outline.scale.multiplyScalar(1.02);
      outline.renderOrder = -1;
      obj.add(outline);
    });
  }

  public update(deltaTime: number, speed: number, isMoving: boolean, isGrounded: boolean): void {
    this.time += deltaTime;
    if (isGrounded && isMoving) {
      const angle = Math.sin(this.time * 12 * (speed / 16)) * 0.55;
      this.leftArm.rotation.x = angle;
      this.rightArm.rotation.x = -angle;
      this.leftLeg.rotation.x = -angle;
      this.rightLeg.rotation.x = angle;

      // Gentle bobbing
      this.rig.position.y = Math.abs(Math.cos(this.time * 12 * (speed / 16))) * 0.09;
    } else if (!isGrounded) {
      // In air pose
      this.leftArm.rotation.x = THREE.MathUtils.lerp(this.leftArm.rotation.x, -Math.PI / 4, 0.1);
      this.rightArm.rotation.x = THREE.MathUtils.lerp(this.rightArm.rotation.x, -Math.PI / 4, 0.1);
      this.leftLeg.rotation.x = THREE.MathUtils.lerp(this.leftLeg.rotation.x, Math.PI / 6, 0.1);
      this.rightLeg.rotation.x = THREE.MathUtils.lerp(this.rightLeg.rotation.x, -Math.PI / 6, 0.1);
      this.rig.position.y = THREE.MathUtils.lerp(this.rig.position.y, 0, 0.1);
    } else {
      // Idle
      this.leftArm.rotation.x = THREE.MathUtils.lerp(this.leftArm.rotation.x, 0, 0.1);
      this.rightArm.rotation.x = THREE.MathUtils.lerp(this.rightArm.rotation.x, 0, 0.1);
      this.leftLeg.rotation.x = THREE.MathUtils.lerp(this.leftLeg.rotation.x, 0, 0.1);
      this.rightLeg.rotation.x = THREE.MathUtils.lerp(this.rightLeg.rotation.x, 0, 0.1);
      this.rig.position.y = Math.sin(this.time * 2) * 0.04;
    }
  }
}
