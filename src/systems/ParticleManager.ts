import * as THREE from 'three';

export class ParticleManager {
  private particles: THREE.Points[] = [];
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public createBurst(x: number, y: number, z: number, color: number, count: number = 20): void {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities: THREE.Vector3[] = [];

    for (let i = 0; i < count; i++) {
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      velocities.push(new THREE.Vector3(
        (Math.random() - 0.5) * 0.2,
        (Math.random() - 0.5) * 0.2,
        (Math.random() - 0.5) * 0.2
      ));
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({ color, size: 0.1 });
    const points = new THREE.Points(geometry, material);
    points.userData.velocities = velocities;
    points.userData.life = 1.0;

    this.scene.add(points);
    this.particles.push(points);
  }

  public update(deltaTime: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.userData.life -= deltaTime;

      if (p.userData.life <= 0) {
        this.scene.remove(p);
        this.particles.splice(i, 1);
        continue;
      }

      const positions = p.geometry.getAttribute('position') as THREE.BufferAttribute;
      const velocities = p.userData.velocities as THREE.Vector3[];

      for (let j = 0; j < velocities.length; j++) {
        positions.setXYZ(
          j,
          positions.getX(j) + velocities[j].x,
          positions.getY(j) + velocities[j].y,
          positions.getZ(j) + velocities[j].z
        );
      }
      positions.needsUpdate = true;
      (p.material as THREE.PointsMaterial).opacity = p.userData.life;
      (p.material as THREE.PointsMaterial).transparent = true;
    }
  }
}
