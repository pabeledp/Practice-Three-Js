# Audio Reactivity and 3D Waveform Visualizer

Audio is half the craft of great editing. Displaying a real-time 3D audio frequency visualizer below the screen or along the audio timeline tracks elevates the portfolio's credibility.

## 1. Web Audio API Connection

Connect the HTML5 `<video>` or background audio stream to an `AudioContext` and `AnalyserNode`:

```javascript
export class AudioSpectrumAnalyzer {
  constructor(mediaElement, fftSize = 64) {
    this.media = mediaElement;
    this.fftSize = fftSize;
    this.isUnlocked = false;

    this.audioCtx = null;
    this.analyser = null;
    this.dataArray = null;
  }

  unlock() {
    if (this.isUnlocked) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    this.audioCtx = new AudioContextClass();
    const source = this.audioCtx.createMediaElementSource(this.media);
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = this.fftSize;
    this.analyser.smoothingTimeConstant = 0.8;

    source.connect(this.analyser);
    this.analyser.connect(this.audioCtx.destination);

    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.isUnlocked = true;
  }

  getFrequencies() {
    if (!this.isUnlocked || !this.analyser) {
      // Fallback synthetic wave if audio is muted or blocked
      return null;
    }
    this.analyser.getByteFrequencyData(this.dataArray);
    return this.dataArray;
  }
}
```

## 2. Instanced 3D Spectrum Visualizer Bars

Using an `InstancedMesh` guarantees 60+ FPS with only a single draw call for all spectrum bars:

```javascript
import * as THREE from 'three';

export class SpectrumVisualizerMesh {
  constructor({ count = 32, width = 8.0, height = 1.2 }) {
    this.count = count;
    this.width = width;
    this.maxHeight = height;

    const barWidth = (width / count) * 0.75;
    const geometry = new THREE.BoxGeometry(barWidth, 1.0, 0.08);
    // Align base of bar to Y=0
    geometry.translate(0, 0.5, 0);

    const material = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.4,
      roughness: 0.3,
      metalness: 0.8
    });

    this.instancedMesh = new THREE.InstancedMesh(geometry, material, count);
    this.dummy = new THREE.Object3D();
    this.syntheticTime = 0;

    // Initial position layout along X
    this.baseX = -width / 2 + (width / count) / 2;
    this.stepX = width / count;
  }

  update(delta, frequencyData) {
    this.syntheticTime += delta * 3.0;

    for (let i = 0; i < this.count; i++) {
      let normValue = 0.1;

      if (frequencyData) {
        // Read actual Web Audio frequency bin
        const binIndex = Math.floor((i / this.count) * frequencyData.length);
        normValue = Math.max(0.05, frequencyData[binIndex] / 255.0);
      } else {
        // Synthetic pulsing rhythm for muted/autoplay mode
        const wave1 = Math.sin(this.syntheticTime + i * 0.35);
        const wave2 = Math.cos(this.syntheticTime * 1.5 + i * 0.2);
        normValue = 0.15 + 0.35 * Math.abs(wave1 * wave2);
      }

      const barHeight = normValue * this.maxHeight;
      this.dummy.position.set(this.baseX + i * this.stepX, 0, 0);
      this.dummy.scale.set(1.0, barHeight, 1.0);
      this.dummy.updateMatrix();

      this.instancedMesh.setMatrixAt(i, this.dummy.matrix);
    }

    this.instancedMesh.instanceMatrix.needsUpdate = true;
  }
}
```
