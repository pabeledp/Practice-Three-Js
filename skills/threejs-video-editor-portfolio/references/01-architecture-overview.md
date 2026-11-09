# Architecture Overview: 3D Video Editor Portfolio

## System Hierarchy and Data Flow

The portfolio website operates on a unified reactive architecture linking the HTML5 video playback engine, 3D WebGL/WebGPU scene graph, post-processing FX pipeline, and interactive HUD overlay:

```
[ HTML5 Video Element / Canvas Stream ]
                   │
                   ▼
       [ THREE.VideoTexture ] ──── (SRGBColorSpace, No Mipmaps)
                   │
                   ▼
     [ 3D Curved Screen Mesh ] ─── (CylinderGeometry Segment)
                   │
                   ├─── [ Web Audio AnalyserNode ] ───▶ [ 3D Audio Visualizer Mesh ]
                   │
                   ├─── [ Raycaster Engine ] ◀─── [ Pointer Events (Mouse/Touch) ]
                   │            │
                   │            ▼
                   ├─── [ 3D Timeline & Playhead ] ───▶ [ Timecode HUD Display ]
                   │            │
                   │            ▼
                   └─── [ Project Clips / Reels ] ───▶ [ Case Study Drawer ]
                                │
                                ▼
                   [ Post-Processing Effect Pass ]
                    (LUT Grade, Glitch, Scanlines)
                                │
                                ▼
                       [ Final Canvas Output ]
```

## Key State Model

```javascript
export const PortfolioState = {
  activeProject: {
    id: 'cyberpunk-reel',
    title: 'Neon Odyssey - Narrative Short',
    client: 'CyberArts Studio',
    role: 'Lead Editor & Colorist',
    software: ['Premiere Pro', 'DaVinci Resolve', 'After Effects'],
    duration: 142.5, // seconds
    timecode: '00:02:22:12',
    src: './videos/neon-odyssey.mp4'
  },
  playback: {
    isPlaying: true,
    currentTime: 0.0,
    progress: 0.0, // 0.0 to 1.0
    volume: 0.8,
    isMuted: true
  },
  camera: {
    currentMode: 'SUITE', // 'SUITE' | 'SCREEN' | 'TIMELINE' | 'ORBIT'
    isTransitioning: false
  },
  fx: {
    lutPreset: 'cinematic-teal-orange', // 'neutral' | 'cinematic-teal-orange' | 'noir'
    glitchIntensity: 0.0,
    scanlines: true,
    bloom: true
  }
};
```

## Layer Separation Principles
1. **Scene Graph (3D Space)**: Only responsible for spatial rendering, lighting, materials, geometry updates, and raycasting hitboxes.
2. **Audio/Video Media Layer**: Operates independently with HTML5 media events (`timeupdate`, `loadedmetadata`, `ended`). Dispatches normalized progress events to 3D scrubber.
3. **DOM HUD Overlay**: High-legibility text (timecodes, project titles, client briefs, CTA buttons) rendered in crisp HTML/CSS layered above the canvas with `pointer-events: auto` for interactive elements and `pointer-events: none` for the background.
