import * as THREE from 'three';

/**
 * Custom Post-Processing Shader for Video Editing Suite:
 * - Real-time Teal & Orange Cinematic LUT curve
 * - Chromatic Aberration & RGB Split
 * - Interactive Digital Glitch
 * - CRT Scanlines & Film Grain
 * - Vignette
 */
export const VideoFXShader = {
  name: 'VideoFXShader',
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0.0 },
    uGlitch: { value: 0.0 },
    uScanlines: { value: 1.0 },
    uGradeMode: { value: 1 }, // 0: Neutral, 1: Teal/Orange, 2: Noir
    uVignette: { value: 0.75 }
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

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    void main() {
      vec2 uv = vUv;

      // 1. Digital Glitch Displacements
      if (uGlitch > 0.01) {
        float slice = floor(uv.y * 30.0);
        float noise = hash(vec2(slice, floor(uTime * 20.0)));
        if (noise > (1.0 - uGlitch * 0.35)) {
          uv.x += (noise - 0.5) * 0.06 * uGlitch;
        }
      }

      // 2. Chromatic Aberration Split
      float shift = 0.003 * (1.0 + uGlitch * 5.0);
      float r = texture2D(tDiffuse, vec2(uv.x + shift, uv.y)).r;
      float g = texture2D(tDiffuse, uv).g;
      float b = texture2D(tDiffuse, vec2(uv.x - shift, uv.y)).b;
      vec3 color = vec3(r, g, b);

      // 3. Color Grading Curves
      if (uGradeMode == 1) {
        // High-end Teal & Orange Grading
        float lum = dot(color, vec3(0.299, 0.587, 0.114));
        vec3 shadows = vec3(0.12, 0.42, 0.60);
        vec3 highlights = vec3(1.0, 0.70, 0.38);
        vec3 grade = mix(shadows, highlights, lum);
        color = mix(color, color * grade * 1.35, 0.50);
        color = pow(color, vec3(0.92));
      } else if (uGradeMode == 2) {
        // High-contrast Noir
        float gray = dot(color, vec3(0.299, 0.587, 0.114));
        color = vec3(smoothstep(0.08, 0.92, gray));
      }

      // 4. CRT Scanlines
      if (uScanlines > 0.5) {
        float scanline = sin(uv.y * 700.0) * 0.05;
        color -= scanline;
      }

      // 5. Film Grain
      float grain = (hash(uv * (uTime + 1.0)) - 0.5) * 0.035;
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
