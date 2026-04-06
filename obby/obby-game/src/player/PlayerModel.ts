import {
  BoxGeometry,
  Color,
  Group,
  Mesh,
  MeshStandardMaterial,
  type Object3D,
} from 'three';

export interface PlayerColorPalette {
  head?: string;
  torso?: string;
  arms?: string;
  legs?: string;
}

const createPart = (
  width: number,
  height: number,
  depth: number,
  color: string,
  x: number,
  y: number,
  z: number,
): Mesh => {
  const mesh = new Mesh(
    new BoxGeometry(width, height, depth),
    new MeshStandardMaterial({
      color: new Color(color),
      roughness: 0.82,
      metalness: 0.05,
    }),
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.position.set(x, y, z);
  return mesh;
};

export class PlayerModel {
  public readonly group = new Group();

  private readonly visualRoot = new Group();
  private readonly torso: Mesh;
  private readonly leftArm: Mesh;
  private readonly rightArm: Mesh;
  private readonly leftLeg: Mesh;
  private readonly rightLeg: Mesh;
  private walkTime = 0;

  public constructor(colors: PlayerColorPalette = {}) {
    const palette = {
      head: colors.head ?? '#ffe2b7',
      torso: colors.torso ?? '#2d8cff',
      arms: colors.arms ?? '#ffe2b7',
      legs: colors.legs ?? '#243b6b',
    };

    const head = createPart(0.7, 0.7, 0.7, palette.head, 0, 2.15, 0);
    this.torso = createPart(0.95, 1, 0.55, palette.torso, 0, 1.35, 0);
    this.leftArm = createPart(0.28, 0.88, 0.28, palette.arms, -0.64, 1.35, 0);
    this.rightArm = createPart(0.28, 0.88, 0.28, palette.arms, 0.64, 1.35, 0);
    this.leftLeg = createPart(0.34, 0.95, 0.34, palette.legs, -0.22, 0.35, 0);
    this.rightLeg = createPart(0.34, 0.95, 0.34, palette.legs, 0.22, 0.35, 0);

    this.visualRoot.add(
      head,
      this.torso,
      this.leftArm,
      this.rightArm,
      this.leftLeg,
      this.rightLeg,
    );

    this.group.add(this.visualRoot);
    this.group.position.y = -0.95;
  }

  public attachTo(parent: Object3D): void {
    parent.add(this.group);
  }

  public setPosition(x: number, y: number, z: number): void {
    this.group.position.set(x, y - 0.95, z);
  }

  public setYaw(yaw: number): void {
    this.visualRoot.rotation.y = yaw;
  }

  public update(dt: number, speed: number, grounded: boolean): void {
    const locomotion = Math.min(speed / 8, 1);

    if (grounded) {
      this.walkTime += dt * (4 + locomotion * 7);
    }

    const swing = grounded ? Math.sin(this.walkTime) * locomotion * 0.7 : 0;
    const bounce = grounded ? Math.abs(Math.sin(this.walkTime * 2)) * locomotion * 0.06 : 0;

    this.leftArm.rotation.x = swing;
    this.rightArm.rotation.x = -swing;
    this.leftLeg.rotation.x = -swing;
    this.rightLeg.rotation.x = swing;
    this.torso.rotation.x = grounded ? locomotion * 0.06 : -0.08;
    this.visualRoot.position.y = bounce;
  }
}