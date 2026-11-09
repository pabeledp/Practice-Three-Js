# Case Study & Project Showcase Integration

## 1. Data Schema for Video Portfolio Projects

```javascript
export const PROJECTS_DATABASE = [
  {
    id: 'cyberpunk-rebellion',
    title: 'Neon Drift // Kinetic Commercial',
    category: 'Commercial / Color Grading',
    client: 'HyperSpeed Motorsport',
    year: '2026',
    duration: 68.0,
    timelineRange: { start: 0.0, end: 0.32 },
    role: 'Lead Video Editor & Colorist',
    software: ['Premiere Pro', 'DaVinci Resolve Studio', 'After Effects'],
    description: 'High-speed automotive commercial featuring aggressive jump-cuts, speed ramps, and a signature teal-and-orange futuristic color grade.',
    specs: '4K ProRes 4444XQ // 24 FPS // Rec.709 & ACEScg',
    videoUrl: './media/projects/neon-drift.mp4',
    posterUrl: './media/projects/neon-drift-poster.jpg'
  },
  {
    id: 'deep-echoes',
    title: 'Echoes of the Abyss // Narrative Short',
    category: 'Narrative Film / VFX',
    client: 'Aetheria Films',
    year: '2025',
    duration: 94.0,
    timelineRange: { start: 0.35, end: 0.68 },
    role: 'Editor & Sound Designer',
    software: ['DaVinci Resolve', 'Pro Tools', 'Blender'],
    description: 'Atmospheric sci-fi short film. Rhythmic pacing timed to underwater soundscapes and orchestral crescendos with seamless invisible cut transitions.',
    specs: 'Cinema DCI 4K Scope 2.39:1 // 5.1 Surround',
    videoUrl: './media/projects/echoes.mp4',
    posterUrl: './media/projects/echoes-poster.jpg'
  },
  {
    id: 'prism-music-video',
    title: 'Prism Mirage // Tour Visuals',
    category: 'Music Video / Motion Design',
    client: 'Sony Music / Synthetica',
    year: '2026',
    duration: 72.0,
    timelineRange: { start: 0.70, end: 1.0 },
    role: 'Creative Director & Offline Editor',
    software: ['Premiere Pro', 'TouchDesigner', 'Cinema4D'],
    description: 'Psychedelic concert tour visuals and music video sync, blending live stage footage with generative 3D particle systems and audio-reactive glitch loops.',
    specs: 'Vertical & 16:9 Multi-format // High Bitrate 60 FPS',
    videoUrl: './media/projects/prism.mp4',
    posterUrl: './media/projects/prism-poster.jpg'
  }
];
```

## 2. 3D Project Reel Cards (Floating Preview Deck)

In addition to timeline clips, you can place 3D "cassette tapes", "film reels", or floating acrylic cards in the scene that smoothly tilt toward the camera when hovered:

```javascript
import * as THREE from 'three';

export function createFloatingProjectCard({
  project,
  textureLoader,
  width = 1.8,
  height = 1.05
}) {
  const group = new THREE.Group();

  // Outer Glass / Acrylic Chassis
  const chassisGeo = new THREE.BoxGeometry(width, height, 0.05);
  const chassisMat = new THREE.MeshPhysicalMaterial({
    roughness: 0.15,
    transmission: 0.85,
    thickness: 0.08,
    ior: 1.5,
    color: 0xffffff
  });
  const chassis = new THREE.Mesh(chassisGeo, chassisMat);
  group.add(chassis);

  // Poster Image Face
  const posterGeo = new THREE.PlaneGeometry(width * 0.94, height * 0.92);
  const posterTexture = textureLoader.load(project.posterUrl);
  posterTexture.colorSpace = THREE.SRGBColorSpace;
  const posterMat = new THREE.MeshBasicMaterial({
    map: posterTexture,
    side: THREE.FrontSide
  });
  const poster = new THREE.Mesh(posterGeo, posterMat);
  poster.position.z = 0.028;
  group.add(poster);

  group.userData = {
    isProjectCard: true,
    project: project,
    targetRotation: new THREE.Euler(0, 0, 0)
  };

  return group;
}
```

## 3. Seamless DOM Drawer Integration

When a user clicks on a clip in 3D:
1. Fire an event `onSelectProject(project)`.
2. Seamlessly slide in a glassmorphic Case Study Drawer from the right side of the screen.
3. Automatically adjust the camera focus or shift the 3D viewport slightly left (`camera.setViewOffset`) so the 3D screen isn't obscured by the text drawer!
