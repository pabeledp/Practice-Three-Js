# Performance Optimization and Resource Disposal

Streaming video textures inside a real-time WebGL/WebGPU 3D canvas demands strict memory hygiene. Without careful management, browsers will crash or drop frames due to GPU VRAM exhaustion.

---

## 1. Golden Rules of VideoTextures

1. **Never Generate Mipmaps**:
   Generating mipmaps for video requires recalculating every mip level on every single video frame (30 to 60 times a second).
   ```javascript
   videoTexture.generateMipmaps = false;
   videoTexture.minFilter = THREE.LinearFilter;
   videoTexture.magFilter = THREE.LinearFilter;
   ```
2. **Reuse a Single `<video>` Element and Texture**:
   Do NOT instantiate a new `HTMLVideoElement` or `THREE.VideoTexture` for every project switch. Instead:
   - Reuse the existing `<video>` element.
   - Update `video.src = newUrl; video.load(); video.play();`
   - Keep the existing `THREE.VideoTexture` attached to the material.
3. **Throttling Idle Renders**:
   If the user navigates away or tabs out:
   - Listen to `document.addEventListener('visibilitychange', ...)`
   - Pause the video and pause `requestAnimationFrame` to save laptop battery.

---

## 2. Complete Scene and Texture Disposal Routine

When unmounting or tearing down a portfolio scene:

```javascript
export function disposeScene(scene, renderer) {
  scene.traverse((object) => {
    if (!object) return;

    // Dispose Geometries
    if (object.geometry) {
      object.geometry.dispose();
    }

    // Dispose Materials and attached Textures
    if (object.material) {
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((mat) => {
        // Dispose all texture slots
        for (const key of Object.keys(mat)) {
          const prop = mat[key];
          if (prop && typeof prop === 'object' && 'isTexture' in prop) {
            prop.dispose();
          }
        }
        mat.dispose();
      });
    }
  });

  // Dispose renderer
  if (renderer) {
    renderer.dispose();
    renderer.forceContextLoss();
    if (renderer.domElement && renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
  }
}
```

---

## 3. Draw Call Optimization Checklist

- **Geometry Batching**: Merge static studio desk meshes into a single `BufferGeometry` using `BufferGeometryUtils.mergeGeometries`.
- **InstancedMesh for Audio Bars**: Use 1 `InstancedMesh` with 32-64 instances instead of 64 separate `Mesh` objects.
- **Shadow Map Resolution**: Cap `shadowMap` size at 1024x1024 or 2048x2048. Set `directionalLight.shadow.bias = -0.0001` to eliminate shadow acne.
- **Pixel Ratio Clamping**: Never allow `window.devicePixelRatio` to set canvas resolution to 3x on Retina screens (wastes 9x fragment shader fillrate). Clamp to `Math.min(window.devicePixelRatio, 2.0)`.
