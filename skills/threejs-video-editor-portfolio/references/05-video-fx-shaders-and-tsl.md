# Video FX Shaders: TSL (WebGPU) and GLSL (WebGL)

Professional video editors and colorists live in their color grading suites and VFX tools. The 3D Video Editor Portfolio brings this toolset to life with interactive shader effects:

1. **Cinematic LUT / Color Grade (Teal & Orange)**
2. **VHS / Cyber Glitch & Chromatic Aberration**
3. **CRT Scanlines & Phosphor Bloom**
4. **Noir High-Contrast Monochrome**

---

## 1. WebGPU / TSL (Three.js Shading Language) Implementation

With `three/webgpu` and `three/tsl`, video effects are written as declarative JavaScript nodes:

```javascript
import * as THREE from 'three/webgpu';
import {
  uv, time, vec2, vec3, vec4, float, uniform,
  sin, cos, fract, step, mix, texture
} from 'three/tsl';

export function createTSLVideoEffectsMaterial(videoTexture) {
  const material = new THREE.MeshBasicNodeMaterial();

  // Uniform controls
  const uGlitchIntensity = uniform(0.0);
  const uScanlinesEnabled = uniform(1.0);
  const uColorGrade = uniform(1); // 0 = Neutral, 1 = Teal-Orange, 2 = Noir

  const baseUv = uv();

  // 1. Chromatic Aberration & Glitch Offset
  const glitchOffset = sin(baseUv.y.mul(40.0).add(time.mul(15.0)))
    .mul(uGlitchIntensity.mul(0.03));
  
  const uvR = vec2(baseUv.x.add(glitchOffset), baseUv.y);
  const uvG = baseUv;
  const uvB = vec2(baseUv.x.sub(glitchOffset), baseUv.y);

  const sampleR = texture(videoTexture, uvR).r;
  const sampleG = texture(videoTexture, uvG).g;
  const sampleB = texture(videoTexture, uvB).b;

  let col = vec3(sampleR, sampleG, sampleB);

  // 2. Teal & Orange Cinematic Grade Curve
  const luminance = col.dot(vec3(0.2126, 0.7152, 0.0722));
  const teal = vec3(0.1, 0.45, 0.6);
  const orange = vec3(1.0, 0.65, 0.3);
  const gradedCol = mix(teal, orange, luminance);
  col = mix(col, gradedCol.mul(col.mul(1.2)), float(0.45));

  // 3. CRT Scanline Stripe Multiplier
  const scanline = sin(baseUv.y.mul(600.0)).mul(0.5).add(0.5);
  const scanFactor = mix(float(1.0), scanline.mul(0.3).add(0.7), uScanlinesEnabled);
  col = col.mul(scanFactor);

  material.colorNode = vec4(col, 1.0);
  return { material, uniforms: { uGlitchIntensity, uScanlinesEnabled, uColorGrade } };
}
```

---

## 2. Universal WebGL GLSL Shader Pass (EffectComposer)

For maximum cross-browser backwards compatibility on standard `WebGLRenderer`:

```javascript
import * as THREE from 'three';

export const VideoEditorFXShader = {
  name: 'VideoEditorFXShader',
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0.0 },
    uGlitch: { value: 0.0 },
    uScanlines: { value: 1.0 },
    uGradeMode: { value: 1 }, // 0: Neutral, 1: Teal/Orange, 2: Noir
    uVignette: { value: 0.8 }
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uGlitch;
    uniform float uScanlines;
    uniform int uGradeMode;
    uniform float uVignette;

    varying vec2 vUv;

    // Pseudo-random noise
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    void main() {
      vec2 uv = vUv;

      // 1. Digital Glitch Displacements
      if (uGlitch > 0.001) {
        float slice = floor(uv.y * 25.0);
        float noise = hash(vec2(slice, floor(uTime * 18.0)));
        if (noise > (1.0 - uGlitch * 0.4)) {
          uv.x += (noise - 0.5) * 0.08 * uGlitch;
        }
      }

      // 2. Chromatic Aberration Split
      float shift = 0.004 * (1.0 + uGlitch * 4.0);
      float r = texture2D(tDiffuse, vec2(uv.x + shift, uv.y)).r;
      float g = texture2D(tDiffuse, uv).g;
      float b = texture2D(tDiffuse, vec2(uv.x - shift, uv.y)).b;
      vec3 color = vec3(r, g, b);

      // 3. Color Grading Curves
      if (uGradeMode == 1) {
        // Teal-Orange Look: Boost blues/teals in shadows, warmth in highlights
        float lum = dot(color, vec3(0.299, 0.587, 0.114));
        vec3 shadows = vec3(0.12, 0.42, 0.58);
        vec3 highlights = vec3(1.0, 0.68, 0.35);
        vec3 grade = mix(shadows, highlights, lum);
        color = mix(color, color * grade * 1.35, 0.55);
        color = pow(color, vec3(0.95)); // Contrast boost
      } else if (uGradeMode == 2) {
        // Noir: High-contrast black and white
        float gray = dot(color, vec3(0.299, 0.587, 0.114));
        color = vec3(smoothstep(0.08, 0.92, gray));
      }

      // 4. CRT Scanlines
      if (uScanlines > 0.5) {
        float scanline = sin(uv.y * 800.0) * 0.08;
        color -= scanline;
      }

      // 5. Film Grain
      float grain = (hash(uv * uTime) - 0.5) * 0.04;
      color += grain;

      // 6. Smooth Vignette
      vec2 centerCoord = (uv - 0.5) * 2.0;
      float dist = length(centerCoord);
      float vignette = smoothstep(1.4, 0.7, dist * uVignette);
      color *= vignette;

      gl_FragColor = vec4(color, 1.0);
    }
  `
};
```
