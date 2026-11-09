# Cinematic Camera Director & Mode Transitions

## 1. Director Perspective Design

A video editor portfolio thrives on dynamic cinematic camera choreography. Instead of leaving the user stranded with uncontrolled OrbitControls, the application provides structured director presets:

| Mode Preset | Position (X, Y, Z) | Target LookAt (X, Y, Z) | Purpose |
|:------------|:-------------------|:------------------------|:--------|
| **SUITE (Overview)** | `(0.0, 2.6, 7.8)` | `(0.0, 1.2, 0.0)` | Cinematic master shot showing full studio, screens & deck |
| **SCREEN (Program Monitor)** | `(0.0, 1.5, 4.2)` | `(0.0, 1.5, -0.2)` | Close-up theater view dedicated to watching showreels |
| **TIMELINE (Scrub Deck)** | `(0.0, 2.8, 3.4)` | `(0.0, -0.3, 0.2)` | Angled top-down perspective optimized for scrubbing & editing |
| **ORBIT (Interactive Exploration)** | `(4.5, 3.0, 6.0)` | `(0.0, 1.0, 0.0)` | Freely rotatable 3D inspection with damped limits |

## 2. Framerate-Independent Damped Lerping

Never use fixed step increments (`pos.x += 0.05`). Use exponential dampening for buttery smooth transitions that feel identical at 60Hz, 120Hz, or 144Hz displays:

```javascript
import * as THREE from 'three';

export class CinematicDirector {
  constructor(camera, controls) {
    this.camera = camera;
    this.controls = controls;

    this.presets = {
      SUITE:    { pos: new THREE.Vector3(0, 2.6, 7.8), look: new THREE.Vector3(0, 1.2, 0) },
      SCREEN:   { pos: new THREE.Vector3(0, 1.5, 4.2), look: new THREE.Vector3(0, 1.5, -0.2) },
      TIMELINE: { pos: new THREE.Vector3(0, 2.8, 3.4), look: new THREE.Vector3(0, -0.3, 0.2) },
      ORBIT:    { pos: new THREE.Vector3(4.5, 3.0, 6.0), look: new THREE.Vector3(0, 1.0, 0) }
    };

    this.currentMode = 'SUITE';
    this.targetPos = this.presets.SUITE.pos.clone();
    this.targetLook = this.presets.SUITE.look.clone();
    this.currentLook = this.presets.SUITE.look.clone();

    this.transitionDamping = 5.5; // Smooth exponential stiffness
  }

  setMode(modeName) {
    if (!this.presets[modeName]) return;
    this.currentMode = modeName;
    this.targetPos.copy(this.presets[modeName].pos);
    this.targetLook.copy(this.presets[modeName].look);

    if (this.controls) {
      if (modeName === 'ORBIT') {
        this.controls.enabled = true;
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.maxPolarAngle = Math.PI / 2 + 0.1; // Don't clip below floor
        this.controls.minDistance = 3.0;
        this.controls.maxDistance = 14.0;
      } else {
        this.controls.enabled = false;
      }
    }
  }

  update(delta) {
    // Delta-independent exponential blend factor
    const factor = 1.0 - Math.exp(-this.transitionDamping * delta);

    if (this.currentMode !== 'ORBIT') {
      this.camera.position.lerp(this.targetPos, factor);
      this.currentLook.lerp(this.targetLook, factor);
      this.camera.lookAt(this.currentLook);
    } else if (this.controls && this.controls.enabled) {
      this.controls.target.lerp(this.targetLook, factor);
      this.controls.update();
    }
  }
}
```

## 3. Subtle Parallax Mouse Reaction

In `SUITE` mode, inject subtle mouse parallax to simulate a breathing, alive 3D environment:

```javascript
export function applySubtleParallax(camera, mouseNormalized, strength = 0.35) {
  const targetOffsetX = mouseNormalized.x * strength;
  const targetOffsetY = mouseNormalized.y * (strength * 0.5);
  
  camera.position.x += (targetOffsetX - camera.position.x) * 0.03;
}
```
