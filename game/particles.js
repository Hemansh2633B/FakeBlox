// game/particles.js — Simple particle pool using Three.js Meshes
import * as THREE from 'three';

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
  }

  emit(pos, count, color, velocity, lifetime, size = 0.12) {
    for (let i = 0; i < count; i++) {
      const geo = new THREE.BoxGeometry(size, size, size);
      const mat = new THREE.MeshStandardMaterial({
        color, emissive: color, emissiveIntensity: 0.4,
        transparent: true, opacity: 1,
      });
      const m = new THREE.Mesh(geo, mat);
      m.position.copy(pos);
      const v = velocity ? velocity.clone() : new THREE.Vector3();
      v.x += (Math.random() - 0.5) * 4;
      v.y += Math.random() * 4 + 1;
      v.z += (Math.random() - 0.5) * 4;
      m.userData = {
        vel: v,
        life: 0,
        maxLife: lifetime + Math.random() * 0.3,
        rotSpd: new THREE.Vector3(Math.random() * 8, Math.random() * 8, Math.random() * 8),
      };
      this.scene.add(m);
      this.particles.push(m);
    }
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      const d = p.userData;
      d.life += dt;
      d.vel.y -= 15 * dt;
      p.position.add(d.vel.clone().multiplyScalar(dt));
      p.rotation.x += d.rotSpd.x * dt;
      p.rotation.y += d.rotSpd.y * dt;
      const t = d.life / d.maxLife;
      p.scale.setScalar(1 - t);
      p.material.opacity = 1 - t;
      if (t >= 1) {
        this.scene.remove(p);
        p.geometry.dispose();
        p.material.dispose();
        this.particles.splice(i, 1);
      }
    }
  }

  clear() {
    this.particles.forEach(p => {
      this.scene.remove(p);
      p.geometry.dispose();
      p.material.dispose();
    });
    this.particles = [];
  }
}
