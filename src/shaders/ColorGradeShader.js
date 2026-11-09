/**
 * Real-Time Colorist Grading & Video Effects Shader
 * Provides:
 * - Rec.709 Natural
 * - Cinematic Teal & Orange LUT curve
 * - Noir High-Contrast Monochrome
 * - Cyberpunk Matrix Grade
 * - CRT Scanlines & Film Grain
 * - Vignette
 */
export const ColorGradeShader = {
  name: 'ColorGradeShader',
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0.0 },
    uGradeMode: { value: 1 }, // 0: Rec709, 1: Teal/Orange, 2: Noir, 3: Cyberpunk
    uScanlines: { value: 1.0 },
    uGrain: { value: 0.04 },
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
    uniform int uGradeMode;
    uniform float uScanlines;
    uniform float uGrain;
    uniform float uVignette;

    varying vec2 vUv;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    void main() {
      vec2 uv = vUv;
      vec4 texel = texture2D(tDiffuse, uv);
      vec3 color = texel.rgb;

      // 1. Color Grading LUT Profiles
      if (uGradeMode == 1) {
        // High-End Cinematic Teal & Orange
        float lum = dot(color, vec3(0.299, 0.587, 0.114));
        vec3 shadows = vec3(0.08, 0.38, 0.52);
        vec3 highlights = vec3(1.0, 0.72, 0.38);
        vec3 grade = mix(shadows, highlights, lum);
        color = mix(color, color * grade * 1.32, 0.52);
        color = pow(color, vec3(0.92));
      } else if (uGradeMode == 2) {
        // Film Noir: High-Contrast Silver Gelatin B&W
        float gray = dot(color, vec3(0.299, 0.587, 0.114));
        color = vec3(smoothstep(0.06, 0.94, gray));
      } else if (uGradeMode == 3) {
        // Cyberpunk / Acid Green
        float lum = dot(color, vec3(0.299, 0.587, 0.114));
        vec3 tint = mix(vec3(0.0, 0.3, 0.15), vec3(0.2, 1.0, 0.5), lum);
        color = mix(color, tint, 0.45);
      }

      // 2. CRT Scanlines
      if (uScanlines > 0.5) {
        float scanline = sin(uv.y * 750.0) * 0.045;
        color -= scanline;
      }

      // 3. 35mm Film Grain
      float grain = (hash(uv * (uTime + 1.0)) - 0.5) * uGrain;
      color += grain;

      // 4. Smooth Cinematic Vignette
      vec2 center = (uv - 0.5) * 2.0;
      float dist = length(center);
      float vignette = smoothstep(1.4, 0.7, dist * uVignette);
      color *= vignette;

      gl_FragColor = vec4(color, texel.a);
    }
  `
};
