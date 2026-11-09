import * as THREE from 'three';

export class ProjectMediaManager {
  constructor(projects) {
    this.projects = projects;
    this.initProjectTextures();
  }

  initProjectTextures() {
    this.projects.forEach((proj, idx) => {
      const canvas = document.createElement('canvas');
      canvas.width = 1280;
      canvas.height = 720;
      const ctx = canvas.getContext('2d');

      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;

      proj.canvas = canvas;
      proj.ctx = ctx;
      proj.texture = texture;
      proj.animTime = idx * 10;
    });
  }

  update(delta) {
    this.projects.forEach((proj, idx) => {
      proj.animTime += delta;
      const { ctx, canvas } = proj;
      const w = canvas.width;
      const h = canvas.height;
      const t = proj.animTime;

      // Project-Specific High-End Motion Visuals
      if (idx === 0) {
        // NEON VELOCITY: Automotive Headlight Beams & Speed HUD
        this.renderAutomotiveReel(ctx, w, h, t, proj);
      } else if (idx === 1) {
        // AETHER VOID: Gravitational Accretion Disk & Cosmic Void
        this.renderCosmicVoidReel(ctx, w, h, t, proj);
      } else if (idx === 2) {
        // CYBER ECHOES: Audio Waveforms & Neon City Grid
        this.renderCyberMusicReel(ctx, w, h, t, proj);
      } else {
        // KINETIC FLUX: 3D Geometrics & Procedural Motion Renders
        this.renderKineticFluxReel(ctx, w, h, t, proj);
      }

      proj.texture.needsUpdate = true;
    });
  }

  renderAutomotiveReel(ctx, w, h, t, proj) {
    // Dark background
    ctx.fillStyle = '#06080e';
    ctx.fillRect(0, 0, w, h);

    // Dynamic light speed streaks
    ctx.save();
    ctx.translate(w / 2, h / 2);

    for (let i = 0; i < 40; i++) {
      const angle = (i / 40) * Math.PI * 2 + t * 0.5;
      const speed = ((t * 4 + i * 3) % 15) / 15;
      const r1 = 80 + speed * 450;
      const r2 = r1 + 60;
      const x1 = Math.cos(angle) * r1;
      const y1 = Math.sin(angle) * (r1 * 0.4);
      const x2 = Math.cos(angle) * r2;
      const y2 = Math.sin(angle) * (r2 * 0.4);

      ctx.strokeStyle = i % 2 === 0 ? '#38bdf8' : '#f59e0b';
      ctx.lineWidth = 3;
      ctx.shadowColor = ctx.strokeStyle;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Car silhouette / Headlight flares
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 40;
    ctx.beginPath();
    ctx.arc(-180, 20, 22, 0, Math.PI * 2);
    ctx.arc(180, 20, 22, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    this.renderFilmOverlay(ctx, w, h, t, proj.title, 'REC // 24.00 FPS');
  }

  renderCosmicVoidReel(ctx, w, h, t, proj) {
    ctx.fillStyle = '#05020a';
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(w / 2, h / 2);

    // Glowing Event Horizon Accretion Rings
    for (let r = 280; r > 90; r -= 18) {
      const wave = Math.sin(r * 0.05 + t * 4) * 12;
      ctx.strokeStyle = `hsla(${270 + wave * 4}, 85%, 60%, 0.7)`;
      ctx.lineWidth = 5;
      ctx.shadowColor = '#a855f7';
      ctx.shadowBlur = 25;
      ctx.beginPath();
      ctx.ellipse(0, 0, r + wave, (r + wave) * 0.38, t * 0.3, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Pure black void center
    ctx.fillStyle = '#000000';
    ctx.shadowColor = '#000000';
    ctx.beginPath();
    ctx.arc(0, 0, 85, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    this.renderFilmOverlay(ctx, w, h, t, proj.title, 'SCOPE 2.39:1 // ARRI RAW');
  }

  renderCyberMusicReel(ctx, w, h, t, proj) {
    ctx.fillStyle = '#060a12';
    ctx.fillRect(0, 0, w, h);

    // Audio Waveform Spectrum
    const bars = 48;
    const barW = (w - 120) / bars;
    ctx.save();
    ctx.translate(60, h / 2);

    for (let i = 0; i < bars; i++) {
      const freq = Math.sin(i * 0.3 + t * 6) * Math.cos(i * 0.15 - t * 3);
      const barH = 30 + Math.abs(freq) * 220;

      ctx.fillStyle = i % 3 === 0 ? '#f43f5e' : (i % 2 === 0 ? '#38bdf8' : '#22c55e');
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 15;
      ctx.fillRect(i * barW, -barH / 2, barW - 4, barH);
    }
    ctx.restore();

    this.renderFilmOverlay(ctx, w, h, t, proj.title, 'MASTER AUDIO // 96kHz');
  }

  renderKineticFluxReel(ctx, w, h, t, proj) {
    ctx.fillStyle = '#0a0d14';
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(w / 2, h / 2);

    // Morphing geometric wireframe polyhedron
    ctx.rotate(t * 0.8);
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const radius = 170 + Math.sin(t * 5 + i * 2) * 35;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(x, y, 40, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    ctx.restore();

    this.renderFilmOverlay(ctx, w, h, t, proj.title, 'OCTANE // 3D VFX COMPOSITE');
  }

  renderFilmOverlay(ctx, w, h, t, title, spec) {
    // Outer Letterbox Cinema Matte
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, 40);
    ctx.fillRect(0, h - 40, w, 40);

    // Crosshairs
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w / 2 - 20, h / 2);
    ctx.lineTo(w / 2 + 20, h / 2);
    ctx.moveTo(w / 2, h / 2 - 20);
    ctx.lineTo(w / 2, h / 2 + 20);
    ctx.stroke();

    // Timecode & Title Readout
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 24px "Space Grotesk", sans-serif';
    ctx.fillText(title, 50, h - 14);

    ctx.font = '600 16px "JetBrains Mono", monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'right';
    const secs = String(Math.floor(t % 60)).padStart(2, '0');
    const frames = String(Math.floor((t * 24) % 24)).padStart(2, '0');
    ctx.fillText(`TC 00:01:${secs}:${frames} // ${spec}`, w - 50, h - 14);
    ctx.textAlign = 'left';
  }
}
