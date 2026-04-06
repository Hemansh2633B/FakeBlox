import * as THREE from 'three';
import { GAME_CONFIG } from '../utils/constants';

export class Scene {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  private ambientLight: THREE.AmbientLight;
  private hemisphereLight: THREE.HemisphereLight;
  private directionalLight: THREE.DirectionalLight;
  private skyDome: THREE.Mesh;

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB);
    this.scene.fog = new THREE.Fog(0x87CEEB, GAME_CONFIG.visuals.fogNear, GAME_CONFIG.visuals.fogFar);

    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
    this.scene.add(this.ambientLight);
    this.hemisphereLight = new THREE.HemisphereLight(0xa8d8ff, 0x445566, 0.55);
    this.scene.add(this.hemisphereLight);

    this.directionalLight = new THREE.DirectionalLight(0xfff7df, 1.0);
    this.directionalLight.position.set(50, 100, 50);
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.mapSize.width = GAME_CONFIG.visuals.shadowMapSize;
    this.directionalLight.shadow.mapSize.height = GAME_CONFIG.visuals.shadowMapSize;
    this.directionalLight.shadow.camera.near = 0.5;
    this.directionalLight.shadow.camera.far = 500;
    this.directionalLight.shadow.camera.left = -100;
    this.directionalLight.shadow.camera.right = 100;
    this.directionalLight.shadow.camera.top = 100;
    this.directionalLight.shadow.camera.bottom = -100;
    this.directionalLight.shadow.bias = -0.00008;
    this.scene.add(this.directionalLight);

    this.skyDome = this.createSkyDome(0x87CEEB);
    this.scene.add(this.skyDome);

    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  private createSkyDome(baseColor: number): THREE.Mesh {
    const color = new THREE.Color(baseColor);
    const topColor = color.clone().offsetHSL(0, -0.05, 0.08);
    const bottomColor = color.clone().offsetHSL(0, -0.05, -0.14);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: topColor },
        bottomColor: { value: bottomColor },
        offset: { value: 40 },
        exponent: { value: 0.7 },
      },
      side: THREE.BackSide,
      depthWrite: false,
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition + vec3(0.0, offset, 0.0)).y;
          float blend = max(pow(max(h, 0.0), exponent), 0.0);
          gl_FragColor = vec4(mix(bottomColor, topColor, blend), 1.0);
        }
      `,
    });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(700, 24, 16), material);
    sky.frustumCulled = false;
    return sky;
  }

  private updateSkyGradient(skyColor: number): void {
    const material = this.skyDome.material as THREE.ShaderMaterial;
    const color = new THREE.Color(skyColor);
    material.uniforms.topColor.value.copy(color.clone().offsetHSL(0, -0.05, 0.08));
    material.uniforms.bottomColor.value.copy(color.clone().offsetHSL(0, -0.05, -0.14));
    material.needsUpdate = true;
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  public render(): void {
    this.skyDome.position.copy(this.camera.position);
    this.renderer.render(this.scene, this.camera);
  }

  public updateTheme(theme: any): void {
    const targetColor = new THREE.Color(theme.skyColor);
    this.scene.background = targetColor;
    this.updateSkyGradient(theme.skyColor);
    if (this.scene.fog) {
      this.scene.fog.color = targetColor;
      (this.scene.fog as THREE.Fog).near = theme.fogNear;
      (this.scene.fog as THREE.Fog).far = theme.fogFar;
    }
    this.hemisphereLight.color = targetColor.clone().lerp(new THREE.Color(0xffffff), 0.25);
    this.hemisphereLight.groundColor = targetColor.clone().multiplyScalar(0.45);
  }

  public add(object: THREE.Object3D): void {
    this.scene.add(object);
  }

  public remove(object: THREE.Object3D): void {
    this.scene.remove(object);
  }
}
