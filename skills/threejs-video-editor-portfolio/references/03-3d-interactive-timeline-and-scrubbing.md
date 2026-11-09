# 3D Interactive Timeline and Scrubbing Deck

## 1. Timeline Anatomy in 3D Space

The 3D timeline is laid out horizontally along the X-axis in front of the viewer, angled upward toward the camera (~25°-35° tilt) for optimal ergonomics:

```
                  [ Video Program Screen ]
                             |
                             v
           -X <========= 0 (Center) =========> +X
           +-------------------------------------+
   Track V2|  [Commercial BFX]   [VFX Composite] |
           +-------------------------------------+
   Track V1| [Intro Roll] [Interview] [Outro]   |
           +-------------------------------------+
   Track A1| ~~~~~~~~~ Audio Waveform ~~~~~~~~~~ |
           +-------------------------------------+
                      || <--- 3D Scrub Playhead Slider
```

## 2. Track & Clip Procedural Construction

Each project clip is an interactive box mesh with rounded edges or chamfers:

```javascript
import * as THREE from 'three';

export function createTimelineTrack({
  width = 12.0,
  height = 0.6,
  depth = 0.05,
  color = 0x1e293b
}) {
  const geometry = new THREE.BoxGeometry(width, height, depth);
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.6,
    metalness: 0.2
  });
  return new THREE.Mesh(geometry, material);
}

export function createClipBlock({
  startProgress, // 0.0 to 1.0
  durationProgress, // 0.0 to 1.0
  trackWidth = 12.0,
  height = 0.5,
  color = 0x38bdf8,
  projectData = {}
}) {
  const clipWidth = trackWidth * durationProgress;
  const geometry = new THREE.BoxGeometry(clipWidth, height, 0.08);
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.4,
    metalness: 0.5,
    emissive: new THREE.Color(color).multiplyScalar(0.2)
  });

  const mesh = new THREE.Mesh(geometry, material);
  
  // Calculate X position: relative to track center (-trackWidth/2 to +trackWidth/2)
  const leftEdge = -trackWidth / 2;
  const clipCenter = leftEdge + (startProgress + durationProgress / 2) * trackWidth;
  mesh.position.x = clipCenter;
  
  // Attach metadata for raycaster picking
  mesh.userData = {
    isProjectClip: true,
    project: projectData
  };

  return mesh;
}
```

## 3. Scrub Playhead Mechanics and Raycast Dragging

The playhead consists of:
1. **Vertical Indicator Needle**: Thin bright emissive beam spanning across all tracks.
2. **Top Grabber / Handle**: Chamfered diamond or badge at the top of the needle.
3. **Scrub Bar Plane**: An invisible wider raycast hitbox allowing smooth mouse/touch dragging without slipping off.

```javascript
export class TimelineInteractionManager {
  constructor({ scene, camera, domElement, timelineGroup, videoElement, trackWidth = 12.0 }) {
    this.scene = scene;
    this.camera = camera;
    this.domElement = domElement;
    this.timelineGroup = timelineGroup;
    this.video = videoElement;
    this.trackWidth = trackWidth;

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.isDragging = false;
    this.hoveredClip = null;

    this.initEvents();
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
    this.updateRaycaster(e);
    const intersects = this.raycaster.intersectObjects(this.timelineGroup.children, true);
    
    if (intersects.length > 0) {
      const hit = intersects[0];
      
      // Check if user clicked a clip
      let obj = hit.object;
      while (obj && !obj.userData.isProjectClip && obj.parent) {
        obj = obj.parent;
      }
      
      if (obj && obj.userData.isProjectClip) {
        if (this.onClipSelect) this.onClipSelect(obj.userData.project);
      }

      // Check if clicked anywhere on the timeline track/scrubber
      this.isDragging = true;
      this.scrubToPoint(hit.point);
    }
  }

  onPointerMove(e) {
    this.updateRaycaster(e);

    if (this.isDragging) {
      const intersects = this.raycaster.intersectObjects(this.timelineGroup.children, true);
      if (intersects.length > 0) {
        this.scrubToPoint(intersects[0].point);
      }
      return;
    }

    // Hover detection for clips
    const intersects = this.raycaster.intersectObjects(this.timelineGroup.children, true);
    let foundClip = null;
    if (intersects.length > 0) {
      let obj = intersects[0].object;
      while (obj && !obj.userData.isProjectClip && obj.parent) obj = obj.parent;
      if (obj && obj.userData.isProjectClip) foundClip = obj;
    }

    if (foundClip !== this.hoveredClip) {
      if (this.hoveredClip) this.setClipHover(this.hoveredClip, false);
      this.hoveredClip = foundClip;
      if (this.hoveredClip) this.setClipHover(this.hoveredClip, true);
      this.domElement.style.cursor = foundClip ? 'pointer' : 'default';
    }
  }

  onPointerUp() {
    this.isDragging = false;
  }

  setClipHover(clipMesh, isHovered) {
    clipMesh.material.emissiveIntensity = isHovered ? 0.8 : 0.2;
    clipMesh.scale.set(1, isHovered ? 1.08 : 1.0, isHovered ? 1.2 : 1.0);
  }

  scrubToPoint(worldPoint) {
    const local = this.timelineGroup.worldToLocal(worldPoint.clone());
    const half = this.trackWidth / 2;
    const clampedX = Math.max(-half, Math.min(half, local.x));
    const progress = (clampedX + half) / this.trackWidth;

    if (this.onScrub) this.onScrub(progress);
    if (this.video && this.video.duration) {
      this.video.currentTime = progress * this.video.duration;
    }
  }
}
```
