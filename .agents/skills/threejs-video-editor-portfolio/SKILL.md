---
name: threejs-video-editor-portfolio
description: >-
  Specialized guide and production architecture for designing, building, and optimizing
  interactive 3D Video Editor & Motion Designer portfolio websites using Three.js (r160+ / r186)
  and WebGPU/TSL. Covers 3D interactive multi-track timelines, playhead raycast scrubbing,
  curved holographic video monitors, dynamic VideoTextures, audio-reactive visualizers,
  cinematic camera director choreography, color grading LUTs, and GPU video post-processing
  effects (glitch, CRT scanlines, chromatic aberration, bloom).
---

# Three.js 3D Video Editor Portfolio Skill

A production-grade architecture and development guide for creating immersive **3D Video Editor & Motion Designer Portfolio Websites** powered by modern **Three.js (r160+ / r186)** and **WebGPU / TSL (Three.js Shading Language)**.

This skill equips agents with the specialized patterns needed to build a virtual editing suite, an interactive 3D timeline, dynamic video projections, cinematic camera movements, and real-time colorist / VFX post-processing.

---

## 1. Portfolio Architectural Concept: The Virtual Editing Suite

A standard 2D grid portfolio fails to convey the kinetic energy, timing precision, and visual flair of high-end video editing and color grading. The 3D Video Editor Portfolio reimagines the website as an **Interactive Virtual Post-Production Suite**:

```
+-----------------------------------------------------------------------+
|  HUD / Header: Editor Bio, Client Roster, Reel Timecode [00:01:24:18] |
+-----------------------------------------------------------------------+
|                                                                       |
|             [ Curved Holographic 3D Video Program Monitor ]           |
|                (Plays high-res video reels / dynamic fallback)        |
|                                                                       |
|      [ Vectorscope / Scopes Monitor ]     [ Audio Peak Meters ]       |
|                                                                       |
|           === 3D Audio-Reactive Waveform Visualizer Bars ===          |
|                                                                       |
|  +-----------------------------------------------------------------+  |
|  |  Interactive 3D Timeline Surface (V2, V1, A1, A2 Tracks)       |  |
|  |  [Clip A: Commercial] [Clip B: Music Video] [Clip C: Docu-film]|  |
|  |             | <-- [Scrubbable 3D Playhead Slider]               |  |
|  +-----------------------------------------------------------------+  |
|                                                                       |
+-----------------------------------------------------------------------+
|  Bottom Deck: Camera View Presets | Video FX Toggles | Case Study HUD |
+-----------------------------------------------------------------------+
```

### Core Subsystems
1. **Curved Video Screen Display**: Cylindrical segment geometry with smooth UV wrapping, mapped to an HTML5 `<video>` element via `THREE.VideoTexture`.
2. **Interactive 3D Timeline Deck**: Multi-track procedural geometry with color-coded project clips, draggable playhead slider with raycast snapping, and keyframe markers.
3. **Camera Director & Choreography**: Smooth cinematic transitions (Suite View, Monitor Focus, Timeline Deck, Project Reel Orbit) with damped cubic bezier interpolation.
4. **Real-time Video FX Suite (TSL & GLSL)**: Instant toggleable effects (Cinematic Teal-Orange LUT, VHS Glitch & RGB split, CRT Phosphor Scanlines, Bloom).
5. **Audio-Reactive Visualizer**: Web Audio API frequency analysis driving dynamic 3D geometry scales and shader vertex displacement.
6. **Robust Fallbacks & Media Optimization**: Procedural animated canvas fallback for instant load, battery-efficient frame rate throttling, and zero-leak resource disposal.

---

## 2. Core Implementation Patterns

### Pattern A: Curved Video Monitor Setup
Avoid flat planes. A curved cylindrical monitor (radius ~6-10 units, arc 45°-60°) creates an immersive IMAX / curved workstation aesthetic:

```javascript
import * as THREE from 'three';

export function createCurvedScreen({ radius = 8, height = 4.5, arcAngle = Math.PI / 3, segments = 64 }) {
  // Cylindrical segment: radiusTop, radiusBottom, height, radialSegments, heightSegments, openEnded, thetaStart, thetaLength
  const thetaStart = Math.PI * 1.5 - arcAngle / 2;
  const geometry = new THREE.CylinderGeometry(
    radius, radius, height,
    segments, 1,
    true,
    thetaStart, arcAngle
  );

  // Invert normals and flip geometry inward so the concave side faces the camera
  geometry.scale(-1, 1, 1);

  return geometry;
}
```

### Pattern B: VideoTexture with Autoplay & Color Management
Always enforce `THREE.SRGBColorSpace` to prevent washed-out colors. Provide an audio unlock gesture for browsers with strict autoplay policies:

```javascript
export function setupVideoTexture(videoElement) {
  videoElement.crossOrigin = 'anonymous';
  videoElement.playsInline = true;
  videoElement.muted = true; // Required for reliable autoplay
  videoElement.loop = true;

  const texture = new THREE.VideoTexture(videoElement);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false; // Never generate mipmaps on video textures!

  return texture;
}
```

### Pattern C: Interactive 3D Playhead Scrubbing
Raycast against the timeline track to translate mouse/touch X coordinates into video `currentTime`:

```javascript
export class TimelineScrubber {
  constructor(trackMesh, playheadMesh, videoElement, trackLength = 10) {
    this.track = trackMesh;
    this.playhead = playheadMesh;
    this.video = videoElement;
    this.length = trackLength;
    this.isDragging = false;
  }

  onPointerDown(intersection) {
    this.isDragging = true;
    this.updatePositionFromPoint(intersection.point);
  }

  onPointerMove(intersection) {
    if (!this.isDragging || !intersection) return;
    this.updatePositionFromPoint(intersection.point);
  }

  onPointerUp() {
    this.isDragging = false;
  }

  updatePositionFromPoint(worldPoint) {
    const localPoint = this.track.worldToLocal(worldPoint.clone());
    const half = this.length / 2;
    const clampedX = Math.max(-half, Math.min(half, localPoint.x));
    
    // Update playhead visual
    this.playhead.position.x = clampedX;

    // Sync video playback
    if (this.video && this.video.duration) {
      const progress = (clampedX + half) / this.length;
      this.video.currentTime = progress * this.video.duration;
    }
  }

  updateFromVideo() {
    if (this.isDragging || !this.video || !this.video.duration) return;
    const progress = this.video.currentTime / this.video.duration;
    const half = this.length / 2;
    this.playhead.position.x = -half + progress * this.length;
  }
}
```

### Pattern D: Cinematic Camera Mode Director
Smoothly interpolate camera position and lookAt target without camera jitter:

```javascript
export const CAMERA_MODES = {
  SUITE:    { pos: [0, 2.8, 7.5], target: [0, 1.2, 0] },
  SCREEN:   { pos: [0, 1.5, 4.2], target: [0, 1.5, 0] },
  TIMELINE: { pos: [0, 2.5, 3.2], target: [0, -0.4, 0] },
  ORBIT:    { pos: [4.5, 3.0, 6.0], target: [0, 1.0, 0] }
};

export class CameraDirector {
  constructor(camera, controls) {
    this.camera = camera;
    this.controls = controls;
    this.targetPos = new THREE.Vector3(...CAMERA_MODES.SUITE.pos);
    this.targetLook = new THREE.Vector3(...CAMERA_MODES.SUITE.target);
    this.currentLook = new THREE.Vector3(...CAMERA_MODES.SUITE.target);
  }

  setMode(modeName) {
    const cfg = CAMERA_MODES[modeName];
    if (!cfg) return;
    this.targetPos.set(...cfg.pos);
    this.targetLook.set(...cfg.target);
  }

  update(delta) {
    const factor = 1.0 - Math.exp(-6.0 * delta); // Smooth framerate-independent lerp
    this.camera.position.lerp(this.targetPos, factor);
    this.currentLook.lerp(this.targetLook, factor);

    if (this.controls) {
      this.controls.target.lerp(this.targetLook, factor);
      this.controls.update();
    } else {
      this.camera.lookAt(this.currentLook);
    }
  }
}
```

---

## 3. Skill Contents and Reference Index

For deep architectural patterns, refer to the files in `references/`:

- [Architecture Overview](./references/01-architecture-overview.md) - High-level system design and component graph.
- [Curved Video Screen & Textures](./references/02-curved-video-screen-and-textures.md) - Video textures, UV mapping, dynamic canvas fallbacks, video sync.
- [3D Interactive Timeline & Scrubbing](./references/03-3d-interactive-timeline-and-scrubbing.md) - Procedural timeline geometry, playhead mechanics, keyframe triggers.
- [Cinematic Camera Director](./references/04-cinematic-camera-director.md) - View presets, camera state transitions, easing and dampening.
- [Video FX Shaders & TSL](./references/05-video-fx-shaders-and-tsl.md) - WebGPU TSL & WebGL GLSL shaders for LUT, glitch, CRT scanlines, and bloom.
- [Audio Reactivity & Waveforms](./references/06-audio-reactivity-and-waveform.md) - Web Audio API integration with 3D spectrum bars.
- [Case Study & Project Showcase](./references/07-case-study-showcase-system.md) - Interactive project cards, metadata HUD, modal overlays.
- [Performance & Memory Disposal](./references/08-performance-and-cleanup.md) - Zero-leak video texture lifecycle, draw call budgeting, device loss.

---

## 4. Verification & Testing Checklist

When implementing or reviewing a 3D Video Editor Portfolio:

1. **Video Color Space**: Verify `texture.colorSpace = THREE.SRGBColorSpace`. (Never leave as Linear or colors will appear washed out).
2. **Mipmap Overhead**: Ensure `texture.generateMipmaps = false` on all video textures.
3. **Autoplay Policy**: Ensure `<video>` has `muted`, `playsinline`, and `autoplay`, with an on-screen Unmute button to unlock Web Audio API.
4. **Offline / Fallback Resilience**: Provide an animated procedural CanvasTexture fallback if an external video URL fails or blocks CORS.
5. **Memory Management**: When switching video sources or unmounting 3D scenes:
   - Call `video.pause()`, remove `src`, and call `video.load()`.
   - Call `texture.dispose()`.
   - Call `geometry.dispose()` and `material.dispose()`.
6. **Input Responsiveness**: Use cursor pointer styles (`cursor: pointer`, `cursor: grab`, `cursor: grabbing`) for raycastable 3D timeline elements.
