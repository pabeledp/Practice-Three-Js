import * as THREE from 'three';

/**
 * 3D Interactive Timeline Deck:
 * Multi-track surface angled toward camera with draggable playhead,
 * project clips, and keyframe markers.
 */
export class InteractiveTimeline {
  constructor(scene, camera, domElement, videoSourceManager, projects, onProjectSelect) {
    this.scene = scene;
    this.camera = camera;
    this.domElement = domElement;
    this.videoManager = videoSourceManager;
    this.projects = projects;
    this.onProjectSelect = onProjectSelect;

    this.trackWidth = 11.5;
    this.group = new THREE.Group();
    this.scene.add(this.group);

    // Angle timeline deck 30 degrees toward camera on desk
    this.group.position.set(0, -0.42, 2.8);
    this.group.rotation.x = -Math.PI * 0.18;

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.isDragging = false;
    this.hoveredClip = null;

    this.clipMeshes = [];

    this.initDeckSurface();
    this.initTracks();
    this.initClips();
    this.initPlayhead();
    this.initEvents();
  }

  initDeckSurface() {
    // Timeline base deck plate
    const deckGeo = new THREE.BoxGeometry(this.trackWidth + 0.6, 1.8, 0.08);
    const deckMat = new THREE.MeshStandardMaterial({
      color: 0x0b0f19,
      roughness: 0.5,
      metalness: 0.6
    });
    this.deckMesh = new THREE.Mesh(deckGeo, deckMat);
    this.group.add(this.deckMesh);
  }

  initTracks() {
    // V2, V1, A1 track rails
    const trackColors = [0x161e2e, 0x161e2e, 0x111827];
    const trackY = [0.45, 0.0, -0.45];

    trackY.forEach((y, i) => {
      const railGeo = new THREE.BoxGeometry(this.trackWidth, 0.38, 0.04);
      const railMat = new THREE.MeshStandardMaterial({
        color: trackColors[i],
        roughness: 0.7,
        metalness: 0.3
      });
      const rail = new THREE.Mesh(railGeo, railMat);
      rail.position.set(0, y, 0.04);
      this.group.add(rail);
    });
  }

  initClips() {
    // Project clips arranged on tracks V1 & V2
    const clipPalette = [0x38bdf8, 0xf97316, 0xa855f7, 0x22c55e];

    this.projects.forEach((proj, idx) => {
      const range = proj.timelineRange || { start: idx * 0.32, end: (idx + 1) * 0.31 };
      const durationProgress = range.end - range.start;
      const clipWidth = this.trackWidth * durationProgress;

      const geo = new THREE.BoxGeometry(clipWidth - 0.06, 0.34, 0.07);
      const color = clipPalette[idx % clipPalette.length];
      const mat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.3,
        metalness: 0.4,
        emissive: new THREE.Color(color).multiplyScalar(0.25)
      });

      const mesh = new THREE.Mesh(geo, mat);
      const leftEdge = -this.trackWidth / 2;
      const x = leftEdge + (range.start + durationProgress / 2) * this.trackWidth;
      const y = idx % 2 === 0 ? 0.0 : 0.45; // alternate V1 and V2

      mesh.position.set(x, y, 0.08);
      mesh.userData = {
        isProjectClip: true,
        project: proj,
        baseColor: color
      };

      this.group.add(mesh);
      this.clipMeshes.push(mesh);
    });
  }

  initPlayhead() {
    this.playheadGroup = new THREE.Group();

    // Vertical line indicator
    const lineGeo = new THREE.BoxGeometry(0.04, 1.6, 0.12);
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });
    const line = new THREE.Mesh(lineGeo, lineMat);
    this.playheadGroup.add(line);

    // Top Grabber Badge
    const badgeGeo = new THREE.ConeGeometry(0.12, 0.22, 4);
    badgeGeo.rotateZ(Math.PI);
    const badgeMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });
    const badge = new THREE.Mesh(badgeGeo, badgeMat);
    badge.position.set(0, 0.85, 0.06);
    this.playheadGroup.add(badge);

    this.playheadGroup.position.set(-this.trackWidth / 2, 0, 0.08);
    this.group.add(this.playheadGroup);
  }

  initEvents() {
    this.domElement.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    window.addEventListener('pointermove', (e) => this.onPointerMove(e));
    window.addEventListener('pointerup', () => this.onPointerUp());
  }

  updateRaycaster(e) {
    const rect = this.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);
  }

  onPointerDown(e) {
    // Only respond to left clicks
    if (e.button !== 0) return;
    this.updateRaycaster(e);

    const intersects = this.raycaster.intersectObjects(this.group.children, true);
    if (intersects.length > 0) {
      const hit = intersects[0];

      // Check if user clicked a clip
      let obj = hit.object;
      while (obj && !obj.userData.isProjectClip && obj.parent) {
        obj = obj.parent;
      }

      if (obj && obj.userData.isProjectClip) {
        if (this.onProjectSelect) {
          this.onProjectSelect(obj.userData.project);
        }
      }

      this.isDragging = true;
      this.scrubToPoint(hit.point);
    }
  }

  onPointerMove(e) {
    this.updateRaycaster(e);

    if (this.isDragging) {
      const intersects = this.raycaster.intersectObjects([this.deckMesh], true);
      if (intersects.length > 0) {
        this.scrubToPoint(intersects[0].point);
      }
      return;
    }

    // Hover detection on clips
    const intersects = this.raycaster.intersectObjects(this.clipMeshes, true);
    let foundClip = null;
    if (intersects.length > 0) {
      foundClip = intersects[0].object;
    }

    if (foundClip !== this.hoveredClip) {
      if (this.hoveredClip) {
        this.hoveredClip.material.emissiveIntensity = 0.25;
        this.hoveredClip.scale.set(1.0, 1.0, 1.0);
      }
      this.hoveredClip = foundClip;
      if (this.hoveredClip) {
        this.hoveredClip.material.emissiveIntensity = 0.85;
        this.hoveredClip.scale.set(1.0, 1.06, 1.3);
      }
      this.domElement.style.cursor = foundClip ? 'pointer' : 'default';
    }
  }

  onPointerUp() {
    this.isDragging = false;
  }

  scrubToPoint(worldPoint) {
    const local = this.group.worldToLocal(worldPoint.clone());
    const half = this.trackWidth / 2;
    const clampedX = Math.max(-half, Math.min(half, local.x));
    const progress = (clampedX + half) / this.trackWidth;

    this.playheadGroup.position.x = clampedX;
    this.videoManager.seek(progress);
  }

  update() {
    if (!this.isDragging) {
      const progress = this.videoManager.getProgress();
      const half = this.trackWidth / 2;
      this.playheadGroup.position.x = -half + progress * this.trackWidth;
    }
  }
}
