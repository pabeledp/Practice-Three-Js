# Curved Video Screen and VideoTextures

## 1. Geometric Construction of Curved Displays

A flat plane in 3D lacks depth and cinematic immersion. We construct a curved cylindrical segment that wraps naturally around the viewer:

```javascript
import * as THREE from 'three';

export function createCurvedMonitor({
  radius = 9.0,
  height = 5.0,
  fovAngle = Math.PI * 0.35, // ~63 degrees curvature arc
  segments = 64
}) {
  const thetaStart = Math.PI * 1.5 - fovAngle / 2;
  const geometry = new THREE.CylinderGeometry(
    radius,
    radius,
    height,
    segments,
    1,
    true,
    thetaStart,
    fovAngle
  );

  // Invert normals so concave inner face points toward (0, 0, 0)
  geometry.scale(-1, 1, 1);

  // Rotate so the center of the arc aligns directly down the -Z axis
  geometry.rotateY(Math.PI);

  return geometry;
}
```

## 2. Realistic Bevel Frame and Ambient Bias Light

To create an authentic monitor display chassis:
- **Bezel Mesh**: Extrude an outer border using `TorusGeometry` or a scaled frame duplicate with a matte dark metallic material (`roughness: 0.8`, `metalness: 0.9`).
- **Screen Glow**: Add a `PointLight` or `RectAreaLight` positioned slightly in front of the screen facing outward to cast dynamic light onto the studio desk matching the video luminance.

```javascript
export function createMonitorGlow(color = 0x38bdf8, intensity = 2.0) {
  const glow = new THREE.PointLight(color, intensity, 12, 1.5);
  glow.position.set(0, 1.5, 0.5);
  return glow;
}
```

## 3. Procedural Canvas Video Fallback Engine

When external video files fail to load (e.g. offline, CORS restriction, or before user clicks play), never leave a black or broken texture. Use an animated procedural canvas engine:

```javascript
export class ProceduralVideoFallback {
  constructor(width = 1280, height = 720) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext('2d');
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.time = 0;
  }

  update(delta, projectInfo = {}) {
    this.time += delta;
    const { ctx, canvas } = this;
    const w = canvas.width;
    const h = canvas.height;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#0a0d14');
    grad.addColorStop(1, '#111827');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
    ctx.lineWidth = 1;
    const step = 40;
    for (let x = 0; x < w; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Motion Graphic: Animated Waveform / Concentric Rings
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 15;

    ctx.beginPath();
    for (let i = 0; i < 360; i += 4) {
      const angle = (i * Math.PI) / 180;
      const wave = Math.sin(angle * 6 + this.time * 4) * 20;
      const r = 160 + wave;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();

    // Center Timecode & Project Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(projectInfo.title || 'PORTFOLIO SHOWREEL', 0, -20);

    ctx.font = '24px "JetBrains Mono", monospace';
    ctx.fillStyle = '#94a3b8';
    const mins = String(Math.floor(this.time / 60)).padStart(2, '0');
    const secs = String(Math.floor(this.time % 60)).padStart(2, '0');
    const frames = String(Math.floor((this.time * 24) % 24)).padStart(2, '0');
    ctx.fillText(`TC 00:${mins}:${secs}:${frames}`, 0, 30);

    ctx.restore();

    this.texture.needsUpdate = true;
  }
}
```

## 4. VideoTexture Lifecycle Rules

- **SRGB Color Space**: Always execute `texture.colorSpace = THREE.SRGBColorSpace;`
- **Disable Mipmaps**: Video frames change every 16-33ms. Generating mipmaps on every tick murders GPU bandwidth and drops framerates to single digits:
  ```javascript
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  ```
- **Cleanup**: On unmounting or switching projects:
  ```javascript
  texture.dispose();
  video.pause();
  video.removeAttribute('src');
  video.load();
  ```
