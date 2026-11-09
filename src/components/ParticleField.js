import * as THREE from 'three';

/**
 * Volumetric Stardust Particle Field:
 * 3,000 glowing particles floating in 3D void, twinkling and gently
 * swirling around the film strip helix tunnel.
 */
export class ParticleField {
  constructor(scene, count = 3000) {
    this.scene = scene;
    this.count = count;

    this.initParticles();
  }

  initParticles() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.count * 3);
    const colors = new Float32Array(this.count * 3);
    const scales = new Float32Array(this.count);

    const palette = [
      new THREE.Color(0x38bdf8), // Cyan
      new THREE.Color(0xf59e0b), // Amber
      new THREE.Color(0xf43f5e), // Rose
      new THREE.Color(0xffffff)  // Diamond white
    ];

    for (let i = 0; i < this.count; i++) {
      // Cylinder distribution along Z-axis (-60 to +10)
      const radius = 2 + Math.random() * 16;
      const theta = Math.random() * Math.PI * 2;
      const x = Math.cos(theta) * radius;
      const y = (Math.random() - 0.5) * 22;
      const z = (Math.random() - 0.5) * 70 - 20;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      const col = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;

      scales[i] = Math.random() * 2.5 + 0.5;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('scale', new THREE.BufferAttribute(scales, 1));

    // Create round glowing point particle texture
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.3, 'rgba(56, 189, 248, 0.8)');
    grad.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    const pointTexture = new THREE.CanvasTexture(canvas);

    const material = new THREE.PointsMaterial({
      size: 0.22,
      map: pointTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: true
    });

    this.points = new THREE.Points(geometry, material);
    this.scene.add(this.points);
  }

  update(delta) {
    // Gentle cosmic rotation
    this.points.rotation.z += delta * 0.02;
    this.points.rotation.y += delta * 0.01;
  }
}
