import * as THREE from 'three';

/**
 * 3D Instanced Audio Frequency Visualizer:
 * Renders 32 glowing frequency spectrum bars beneath the curved video monitor.
 * Operates in a single draw call with Web Audio API or synthetic audio pulse fallback.
 */
export class AudioVisualizer {
  constructor(scene, videoSourceManager, count = 36) {
    this.scene = scene;
    this.videoManager = videoSourceManager;
    this.count = count;
    this.width = 9.2;
    this.maxHeight = 1.1;

    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.initInstancedBars();
  }

  initInstancedBars() {
    const barWidth = (this.width / this.count) * 0.72;
    const geometry = new THREE.BoxGeometry(barWidth, 1.0, 0.08);
    // Align base of bar to Y=0
    geometry.translate(0, 0.5, 0);

    const material = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.5,
      roughness: 0.2,
      metalness: 0.8
    });

    this.instancedMesh = new THREE.InstancedMesh(geometry, material, this.count);
    this.dummy = new THREE.Object3D();

    this.group.position.set(0, -0.48, 1.8);
    this.group.add(this.instancedMesh);

    this.baseX = -this.width / 2 + (this.width / this.count) / 2;
    this.stepX = this.width / this.count;
    this.syntheticTime = 0;
  }

  update(delta) {
    this.syntheticTime += delta * 4.0;
    const freqData = this.videoManager.getFrequencyData();

    for (let i = 0; i < this.count; i++) {
      let norm = 0.1;

      if (freqData) {
        const binIndex = Math.floor((i / this.count) * freqData.length);
        norm = Math.max(0.06, freqData[binIndex] / 255.0);
      } else {
        // High-tech procedural wave rhythm
        const wave1 = Math.sin(this.syntheticTime + i * 0.35);
        const wave2 = Math.cos(this.syntheticTime * 1.4 + i * 0.18);
        norm = 0.12 + 0.38 * Math.abs(wave1 * wave2);
      }

      const barHeight = norm * this.maxHeight;
      this.dummy.position.set(this.baseX + i * this.stepX, 0, 0);
      this.dummy.scale.set(1.0, barHeight, 1.0);
      this.dummy.updateMatrix();

      this.instancedMesh.setMatrixAt(i, this.dummy.matrix);
    }

    this.instancedMesh.instanceMatrix.needsUpdate = true;
  }
}
