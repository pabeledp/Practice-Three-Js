# 🎬 3D Video Editor & Motion Designer Portfolio // Three.js Keyframe Suite

A high-performance, interactive **3D Video Editor & Motion Director Portfolio** built with modern **Three.js (r170+)**, WebGL/WebGPU shaders, and keyframe animation scrubbing.

Inspired by [three.js `webgl_animation_keyframes`](https://github.com/mrdoob/three.js/blob/master/examples/webgl_animation_keyframes.html) and professional Non-Linear Editing (NLE) software like **DaVinci Resolve Studio** and **Adobe Premiere Pro**, this project fuses 3D keyframe animation with real-time editorial controls, camera director choreography, and live color grading LUTs.

---

## ⚡ Live Features

### 1. 🎞️ Interactive 3D NLE Keyframe Timeline
- **Bi-directional `AnimationMixer` Synchronization**: The timeline playhead tracks the 3D animation time in real time.
- **Draggable Laser Playhead**: Click or drag anywhere on the timeline to scrub through 3D keyframes instantly with audio feedback.
- **Keyframe Diamond Markers**: Click keyframe nodes to jump directly to specific camera transitions and scene cuts.
- **J-K-L Transport Shortcuts**:
  - `Space` / `K`: Play / Pause toggle
  - `L`: Fast Forward (1x, 2x, 4x)
  - `J`: Reverse Playback (-1x, -2x, -4x)
  - `1`, `2`, `3`, `4`: Quick-switch director camera angles
- **Live Broadcast Timecode HUD**: Renders real-time `HH:MM:SS:FF` at 24.000 FPS.

### 2. 🎥 Director Camera Choreography
Smooth cinematic transitions between professional director camera cuts:
- **SHOT 01: MASTER**: Wide establishing shot capturing the entire animated city and lighting.
- **SHOT 02: TRACKING**: Dynamic street-level dolly angle tracking animated vehicles and pedestrians.
- **SHOT 03: ROOFTOP**: Moody elevated perspective focusing on architectural silhouettes.
- **FREE ORBIT**: Unlocks dampened `OrbitControls` for free 3D inspection.

### 3. 🎨 Real-Time Colorist Grading Suite (Custom Shaders)
Toggle live color grades via custom post-processing GLSL passes:
- **Teal & Orange LUT**: Hollywood blockbuster contrast curve (teal shadow bias + warm amber highlight tones).
- **Rec.709 Natural**: Clean, uncompressed broadcast standard.
- **Film Noir B&W**: High-contrast silver-gelatin monochrome with deep shadow rolloff.
- **Cyber Matrix**: High-chroma acid green sci-fi grade.
- **Analog Post FX**: Toggleable CRT horizontal scanlines and 35mm film grain simulation.

### 4. 🏙️ PBR Atmospheric Lighting & Environment
- Atmospheric procedural `Sky` shader with Rayleigh scattering and customizable sun elevation.
- `PMREMGenerator` environment reflection map for photorealistic physically-based rendering (PBR).
- Animated 3D city model (`LittlestTokyo.glb`) loaded via `GLTFLoader` with local `DRACOLoader` WebAssembly decoders.

### 5. 🔊 Web Audio Tactile Sound Engine
- Procedural audio synthesizer generating mechanical shutter clicks, timeline scrub clicks, and low-frequency studio drone without external audio assets.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or pnpm

### Quick Start
```bash
# 1. Clone the repository
git clone https://github.com/pabeledp/Practice-Three-Js.git
cd Practice-Three-Js

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production
```bash
npm run build
npm run preview
```

---

## 🧠 Antigravity & Agent Skills Catalog

This repository serves as a verified, up-to-date AI Skills Hub for **Antigravity**, **Claude Code**, and modern coding agents. Located in `.agents/skills/` and `skills/`:

| Skill Name | Scope & Capabilities |
|:---|:---|
| **`threejs-video-editor-portfolio`** | Dedicated Antigravity skill for 3D Video Editor suites, curved video monitors, timeline decks, and TSL video FX. |
| **`webgpu-threejs-tsl`** | Modern WebGPU renderer setup, TSL (Three.js Shading Language), Node materials, and GPU compute shaders. |
| **`threejs-fundamentals`** | Scene initialization, camera types, renderer tone mapping, `THREE.Timer`, resize handling, and object lifecycle. |
| **`threejs-animation`** | `AnimationMixer`, `AnimationAction`, keyframe tracks, morph targets, and cross-fading. |
| **`threejs-geometry`** | `BufferGeometry`, procedural meshes, `InstancedMesh`, `BatchedMesh`, and BVH acceleration. |
| **`threejs-materials`** | `MeshStandardMaterial`, `MeshPhysicalMaterial` (transmission, clearcoat, sheen), and custom node materials. |
| **`threejs-lighting`** | Directional, point, spot, ambient, light probes, and soft PCF shadow maps. |
| **`threejs-textures`** | Color management (`SRGBColorSpace`), `VideoTexture`, `CanvasTexture`, and KTX2 compressed textures. |
| **`threejs-loaders`** | `GLTFLoader`, `DRACOLoader`, `KTX2Loader`, and `LoadingManager` progress tracking. |
| **`threejs-postprocessing`** | `EffectComposer`, `RenderPass`, `UnrealBloomPass`, custom `ShaderPass`, and LUT passes. |
| **`threejs-interaction`** | Raycasting, pointer coordinates, `OrbitControls`, and spatial object picking. |
| **`threejs-performance`** | Draw call budgeting, frustum culling, memory leak prevention, and `.dispose()` cleanup routines. |
| **`threejs-react-three-fiber`**| R3F v9.8 + Drei 10.7 declarative Three.js patterns. |
| **`threejs-asset-pipeline`** | `gltf-transform` v4.5 Draco compression, mesh quantization, and texture optimization. |

### Installing into Antigravity
To make these skills active across your local machine in Antigravity:
```bash
mkdir -p ~/.gemini/config/skills/
cp -R .agents/skills/* ~/.gemini/config/skills/
```

---

## 📂 Project Architecture

```
Practice-Three-Js/
├── .agents/skills/                  # Antigravity AI Skills
│   ├── threejs-video-editor-portfolio/
│   ├── webgpu-threejs-tsl/
│   └── threejs-fundamentals/ ... (15 skills total)
├── public/
│   ├── draco/gltf/                  # Draco WASM decoders
│   └── models/gltf/LittlestTokyo.glb# Animated 3D city model
├── src/
│   ├── components/
│   │   └── AudioEngine.js           # Web Audio procedural sound synthesizer
│   ├── shaders/
│   │   └── ColorGradeShader.js      # Real-time LUT grading & post FX shader
│   ├── styles/
│   │   └── style.css                # NLE editorial glassmorphic HUD styling
│   └── main.js                      # Application entry, Three.js loop & controls
├── index.html                       # Director UI & NLE timeline DOM overlay
├── package.json
└── vite.config.js
```

---

## 📜 Keyboard Reference
- `Space` / `K`: Play / Pause animation
- `L`: Fast Forward (1x ➔ 2x ➔ 4x)
- `J`: Reverse Playback (-1x ➔ -2x ➔ -4x)
- `1`: Shot 01 (Master Establishing Shot)
- `2`: Shot 02 (Street Tracking Shot)
- `3`: Shot 03 (Rooftop Perspective)
- `4`: Free 3D Orbit (Mouse click + drag to rotate)

---

## 📄 License
MIT License. 3D Model: "Littlest Tokyo" by Glen Fox (CC Attribution).
