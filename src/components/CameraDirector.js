import * as THREE from 'three';

export const CAMERA_PRESETS = {
  SUITE:    { pos: new THREE.Vector3(0, 2.6, 7.8), look: new THREE.Vector3(0, 1.2, 0) },
  SCREEN:   { pos: new THREE.Vector3(0, 1.8, 4.3), look: new THREE.Vector3(0, 1.8, -0.2) },
  TIMELINE: { pos: new THREE.Vector3(0, 2.7, 3.5), look: new THREE.Vector3(0, -0.3, 2.2) },
  ORBIT:    { pos: new THREE.Vector3(5.2, 3.2, 6.2), look: new THREE.Vector3(0, 1.0, 0) }
};

export class CameraDirector {
  constructor(camera) {
    this.camera = camera;
    this.currentMode = 'SUITE';

    this.targetPos = CAMERA_PRESETS.SUITE.pos.clone();
    this.targetLook = CAMERA_PRESETS.SUITE.look.clone();
    this.currentLook = CAMERA_PRESETS.SUITE.look.clone();

    this.damping = 5.2;
    this.isOrbiting = false;
    this.orbitAngle = 0;
  }

  setMode(modeName) {
    if (!CAMERA_PRESETS[modeName]) return;
    this.currentMode = modeName;
    this.isOrbiting = (modeName === 'ORBIT');
    this.targetPos.copy(CAMERA_PRESETS[modeName].pos);
    this.targetLook.copy(CAMERA_PRESETS[modeName].look);
  }

  update(delta) {
    if (this.isOrbiting) {
      this.orbitAngle += delta * 0.25;
      const radius = 7.5;
      this.targetPos.x = Math.sin(this.orbitAngle) * radius;
      this.targetPos.z = Math.cos(this.orbitAngle) * radius;
      this.targetPos.y = 2.8 + Math.sin(this.orbitAngle * 0.5) * 0.6;
    }

    const factor = 1.0 - Math.exp(-this.damping * delta);
    this.camera.position.lerp(this.targetPos, factor);
    this.currentLook.lerp(this.targetLook, factor);
    this.camera.lookAt(this.currentLook);
  }
}
