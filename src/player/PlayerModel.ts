import * as THREE from 'three';

export class PlayerModel {
  public mesh: THREE.Group;
  private head: THREE.Mesh;
  private torso: THREE.Mesh;
  private leftArm: THREE.Mesh;
  private rightArm: THREE.Mesh;
  private leftLeg: THREE.Mesh;
  private rightLeg: THREE.Mesh;
  private face: THREE.Group;

  constructor() {
    this.mesh = new THREE.Group();

    // Materials
    const skinMaterial = new THREE.MeshPhongMaterial({ color: 0xFFD93D });
    const shirtMaterial = new THREE.MeshPhongMaterial({ color: 0x6BCB77 });
    const pantsMaterial = new THREE.MeshPhongMaterial({ color: 0x4D96FF });

    // Head
    const headGeom = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    this.head = new THREE.Mesh(headGeom, skinMaterial);
    this.head.position.y = 1.4;
    this.head.castShadow = true;
    this.mesh.add(this.head);

    // Face components
    this.face = new THREE.Group();
    const eyeGeom = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const eyeMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    const leftEye = new THREE.Mesh(eyeGeom, eyeMaterial);
    leftEye.position.set(-0.2, 0.1, 0.41);
    const rightEye = new THREE.Mesh(eyeGeom, eyeMaterial);
    rightEye.position.set(0.2, 0.1, 0.41);
    this.face.add(leftEye, rightEye);

    const mouthGeom = new THREE.BoxGeometry(0.3, 0.1, 0.1);
    const mouth = new THREE.Mesh(mouthGeom, eyeMaterial);
    mouth.position.set(0, -0.15, 0.41);
    this.face.add(mouth);

    this.head.add(this.face);

    // Torso
    const torsoGeom = new THREE.BoxGeometry(0.8, 1.0, 0.4);
    this.torso = new THREE.Mesh(torsoGeom, shirtMaterial);
    this.torso.position.y = 0.5;
    this.torso.castShadow = true;
    this.mesh.add(this.torso);

    // Arms
    const armGeom = new THREE.BoxGeometry(0.4, 1.0, 0.4);
    this.leftArm = new THREE.Mesh(armGeom, skinMaterial);
    this.leftArm.position.set(-0.6, 0.5, 0);
    this.leftArm.castShadow = true;
    this.mesh.add(this.leftArm);

    this.rightArm = new THREE.Mesh(armGeom, skinMaterial);
    this.rightArm.position.set(0.6, 0.5, 0);
    this.rightArm.castShadow = true;
    this.mesh.add(this.rightArm);

    // Legs
    const legGeom = new THREE.BoxGeometry(0.4, 1.0, 0.4);
    this.leftLeg = new THREE.Mesh(legGeom, pantsMaterial);
    this.leftLeg.position.set(-0.2, -0.5, 0);
    this.leftLeg.castShadow = true;
    this.mesh.add(this.leftLeg);

    this.rightLeg = new THREE.Mesh(legGeom, pantsMaterial);
    this.rightLeg.position.set(0.2, -0.5, 0);
    this.rightLeg.castShadow = true;
    this.mesh.add(this.rightLeg);

    // Adjust the whole group
    this.mesh.position.y = 0.2;
  }

  public update(_deltaTime: number, speed: number, isMoving: boolean, isGrounded: boolean): void {
    if (isGrounded && isMoving) {
      const angle = Math.sin(Date.now() * 0.01 * (speed / 16)) * 0.5;
      this.leftArm.rotation.x = angle;
      this.rightArm.rotation.x = -angle;
      this.leftLeg.rotation.x = -angle;
      this.rightLeg.rotation.x = angle;

      // Gentle bobbing
      this.mesh.position.y = 0.2 + Math.abs(Math.cos(Date.now() * 0.01 * (speed / 16))) * 0.1;
    } else if (!isGrounded) {
      // In air pose
      this.leftArm.rotation.x = THREE.MathUtils.lerp(this.leftArm.rotation.x, -Math.PI / 4, 0.1);
      this.rightArm.rotation.x = THREE.MathUtils.lerp(this.rightArm.rotation.x, -Math.PI / 4, 0.1);
      this.leftLeg.rotation.x = THREE.MathUtils.lerp(this.leftLeg.rotation.x, Math.PI / 6, 0.1);
      this.rightLeg.rotation.x = THREE.MathUtils.lerp(this.rightLeg.rotation.x, -Math.PI / 6, 0.1);
      this.mesh.position.y = THREE.MathUtils.lerp(this.mesh.position.y, 0.2, 0.1);
    } else {
      // Idle
      this.leftArm.rotation.x = THREE.MathUtils.lerp(this.leftArm.rotation.x, 0, 0.1);
      this.rightArm.rotation.x = THREE.MathUtils.lerp(this.rightArm.rotation.x, 0, 0.1);
      this.leftLeg.rotation.x = THREE.MathUtils.lerp(this.leftLeg.rotation.x, 0, 0.1);
      this.rightLeg.rotation.x = THREE.MathUtils.lerp(this.rightLeg.rotation.x, 0, 0.1);
      this.mesh.position.y = 0.2 + Math.sin(Date.now() * 0.002) * 0.05;
    }
  }
}
