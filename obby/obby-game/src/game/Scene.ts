import {
  AmbientLight,
  Color,
  DirectionalLight,
  Fog,
  PCFSoftShadowMap,
  PerspectiveCamera,
  Scene,
  Vector2,
  WebGLRenderer,
} from 'three';

export class SceneManager {
  public readonly scene: Scene;
  public readonly camera: PerspectiveCamera;
  public readonly renderer: WebGLRenderer;

  private readonly viewport = new Vector2();

  public constructor(private readonly container: HTMLElement) {
    this.scene = new Scene();
    this.scene.background = new Color('#87b8ff');
    this.scene.fog = new Fog('#87b8ff', 40, 180);

    this.camera = new PerspectiveCamera(70, 1, 0.1, 500);

    this.renderer = new WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFSoftShadowMap;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.container.appendChild(this.renderer.domElement);

    this.addDefaultLights();
    this.resize();
  }

  public resize(): void {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.viewport.set(width, height);
    this.camera.aspect = width / Math.max(height, 1);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  public render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  public dispose(): void {
    this.renderer.dispose();
  }

  private addDefaultLights(): void {
    const ambient = new AmbientLight('#ffffff', 0.6);
    this.scene.add(ambient);

    const sun = new DirectionalLight('#fff3d6', 2.3);
    sun.position.set(14, 20, 8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 80;
    sun.shadow.camera.left = -30;
    sun.shadow.camera.right = 30;
    sun.shadow.camera.top = 30;
    sun.shadow.camera.bottom = -30;
    this.scene.add(sun);
  }
}