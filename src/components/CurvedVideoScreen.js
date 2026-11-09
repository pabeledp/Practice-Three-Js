import * as THREE from 'three';

/**
 * Builds the curved cinematic monitor mesh, dark metallic bezel,
 * and ambient screen glow that illuminates the desk.
 */
export class CurvedVideoScreen {
  constructor(scene, videoSourceManager) {
    this.scene = scene;
    this.videoManager = videoSourceManager;
    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.radius = 9.0;
    this.height = 5.2;
    this.arcAngle = Math.PI * 0.38; // ~68 degree curve

    this.initScreen();
    this.initFrame();
    this.initAmbientGlow();
  }

  initScreen() {
    const thetaStart = Math.PI * 1.5 - this.arcAngle / 2;
    const geometry = new THREE.CylinderGeometry(
      this.radius,
      this.radius,
      this.height,
      64,
      1,
      true,
      thetaStart,
      this.arcAngle
    );

    // Invert geometry so concave face points toward viewer
    geometry.scale(-1, 1, 1);
    geometry.rotateY(Math.PI);

    this.material = new THREE.MeshBasicMaterial({
      map: this.videoManager.activeTexture,
      side: THREE.FrontSide
    });

    this.screenMesh = new THREE.Mesh(geometry, this.material);
    this.screenMesh.position.set(0, 2.0, 0);
    this.group.add(this.screenMesh);
  }

  initFrame() {
    // Outer Frame Bezel
    const frameRadius = this.radius + 0.05;
    const frameHeight = this.height + 0.16;
    const thetaStart = Math.PI * 1.5 - (this.arcAngle + 0.02) / 2;

    const frameGeo = new THREE.CylinderGeometry(
      frameRadius,
      frameRadius,
      frameHeight,
      64,
      1,
      true,
      thetaStart,
      this.arcAngle + 0.02
    );
    frameGeo.scale(-1, 1, 1);
    frameGeo.rotateY(Math.PI);

    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.6,
      metalness: 0.8
    });

    const frameMesh = new THREE.Mesh(frameGeo, frameMat);
    frameMesh.position.set(0, 2.0, -0.01);
    this.group.add(frameMesh);
  }

  initAmbientGlow() {
    // Screen bias light projecting video glow onto the desk
    this.glowLight = new THREE.PointLight(0x38bdf8, 2.0, 10, 1.8);
    this.glowLight.position.set(0, 1.8, 1.0);
    this.group.add(this.glowLight);
  }

  update() {
    // Keep active texture synchronized if switched
    if (this.material.map !== this.videoManager.activeTexture) {
      this.material.map = this.videoManager.activeTexture;
      this.material.needsUpdate = true;
    }
  }
}
