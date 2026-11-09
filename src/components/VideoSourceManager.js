import * as THREE from 'three';

/**
 * Manages video texture loading, autoplay handling, audio unlock,
 * and high-tech procedural motion graphics fallback.
 */
export class VideoSourceManager {
  constructor({ width = 1920, height = 1080 }) {
    this.width = width;
    this.height = height;

    // Create fallback canvas
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext('2d');

    this.canvasTexture = new THREE.CanvasTexture(this.canvas);
    this.canvasTexture.colorSpace = THREE.SRGBColorSpace;
    this.canvasTexture.minFilter = THREE.LinearFilter;
    this.canvasTexture.magFilter = THREE.LinearFilter;
    this.canvasTexture.generateMipmaps = false;

    // Create HTML5 Video Element
    this.video = document.createElement('video');
    this.video.crossOrigin = 'anonymous';
    this.video.playsInline = true;
    this.video.muted = true;
    this.video.loop = true;

    this.videoTexture = null;
    this.activeTexture = this.canvasTexture;
    this.isVideoActive = false;

    this.currentTime = 0;
    this.duration = 120.0;
    this.isPlaying = true;
    this.projectInfo = {
      title: 'NEON ODYSSEY // NARRATIVE SHORT',
      client: 'CyberArts Studio (2026)',
      fps: 24
    };

    // Web Audio API hooks
    this.audioContext = null;
    this.analyser = null;
    this.audioData = null;
    this.isAudioUnlocked = false;
  }

  loadProject(project) {
    this.projectInfo = project;
    this.duration = project.duration || 120.0;
    this.currentTime = 0;

    if (project.videoUrl) {
      this.video.src = project.videoUrl;
      this.video.load();
      this.video.play()
        .then(() => {
          if (!this.videoTexture) {
            this.videoTexture = new THREE.VideoTexture(this.video);
            this.videoTexture.colorSpace = THREE.SRGBColorSpace;
            this.videoTexture.minFilter = THREE.LinearFilter;
            this.videoTexture.magFilter = THREE.LinearFilter;
            this.videoTexture.generateMipmaps = false;
          }
          this.activeTexture = this.videoTexture;
          this.isVideoActive = true;
        })
        .catch(() => {
          // Autoplay or network blocked - seamlessly use procedural canvas
          this.activeTexture = this.canvasTexture;
          this.isVideoActive = false;
        });
    } else {
      this.activeTexture = this.canvasTexture;
      this.isVideoActive = false;
    }
  }

  togglePlay() {
    this.isPlaying = !this.isPlaying;
    if (this.isVideoActive) {
      if (this.isPlaying) this.video.play();
      else this.video.pause();
    }
    return this.isPlaying;
  }

  seek(progress) {
    this.currentTime = progress * this.duration;
    if (this.isVideoActive && this.video.duration) {
      this.video.currentTime = progress * this.video.duration;
    }
  }

  unlockAudio() {
    if (this.isAudioUnlocked) return true;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return false;
      this.audioContext = new AudioCtx();
      this.audioContext.resume();

      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 64;
      this.analyser.smoothingTimeConstant = 0.82;
      this.audioData = new Uint8Array(this.analyser.frequencyBinCount);

      if (this.isVideoActive) {
        const source = this.audioContext.createMediaElementSource(this.video);
        source.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);
        this.video.muted = false;
      }

      this.isAudioUnlocked = true;
      return true;
    } catch {
      return false;
    }
  }

  getFrequencyData() {
    if (this.isAudioUnlocked && this.analyser) {
      this.analyser.getByteFrequencyData(this.audioData);
      return this.audioData;
    }
    return null;
  }

  update(delta) {
    if (this.isPlaying) {
      if (this.isVideoActive && this.video.duration) {
        this.currentTime = this.video.currentTime;
        this.duration = this.video.duration;
      } else {
        this.currentTime = (this.currentTime + delta) % this.duration;
      }
    }

    // Render Procedural Motion Graphic Fallback
    if (!this.isVideoActive) {
      this.renderProceduralFrame(delta);
    }
  }

  renderProceduralFrame(delta) {
    const { ctx, canvas } = this;
    const w = canvas.width;
    const h = canvas.height;
    const t = this.currentTime;

    // Dark cyber gradient
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#0a0d14');
    grad.addColorStop(0.5, '#0f172a');
    grad.addColorStop(1, '#070a0f');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Film Grid / Safe Area Frame
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
    ctx.lineWidth = 2;
    ctx.strokeRect(w * 0.05, h * 0.05, w * 0.9, h * 0.9);

    // Center Crosshairs
    ctx.beginPath();
    ctx.moveTo(w / 2 - 30, h / 2);
    ctx.lineTo(w / 2 + 30, h / 2);
    ctx.moveTo(w / 2, h / 2 - 30);
    ctx.lineTo(w / 2, h / 2 + 30);
    ctx.stroke();

    // Animated Kinetic Rings & Waveforms (Simulating motion design showreel)
    ctx.save();
    ctx.translate(w / 2, h / 2);

    // Rotating Outer Ring
    ctx.rotate(t * 0.4);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 20;

    ctx.beginPath();
    for (let i = 0; i < 360; i += 6) {
      const angle = (i * Math.PI) / 180;
      const mod = Math.sin(angle * 8 + t * 5) * 25;
      const r = 240 + mod;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();

    // Secondary Warm Amber Inner Hexagon
    ctx.rotate(-t * 0.8);
    ctx.strokeStyle = '#f97316';
    ctx.shadowColor = '#f97316';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const r = 140 + Math.sin(t * 6 + i) * 15;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();

    ctx.restore();

    // Center Typography & Project Title
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 48px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(this.projectInfo.title, w / 2, h / 2 + 330);

    ctx.font = '24px "JetBrains Mono", monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(this.projectInfo.client, w / 2, h / 2 + 375);

    // Top Right Scopes Visualizer Simulation
    this.renderMiniScope(ctx, w - 240, 70, 180, 100, t);

    this.canvasTexture.needsUpdate = true;
  }

  renderMiniScope(ctx, x, y, width, height, t) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(x, y, width, height);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, width, height);

    ctx.strokeStyle = '#22c55e';
    ctx.beginPath();
    for (let i = 0; i < width; i += 4) {
      const vy = y + height / 2 + Math.sin(i * 0.15 + t * 6) * (height * 0.35);
      if (i === 0) ctx.moveTo(x + i, vy);
      else ctx.lineTo(x + i, vy);
    }
    ctx.stroke();
  }

  getTimecodeString() {
    const totalSecs = Math.max(0, this.currentTime);
    const mins = String(Math.floor(totalSecs / 60)).padStart(2, '0');
    const secs = String(Math.floor(totalSecs % 60)).padStart(2, '0');
    const frames = String(Math.floor((totalSecs * (this.projectInfo.fps || 24)) % 24)).padStart(2, '0');
    return `00:${mins}:${secs}:${frames}`;
  }

  getProgress() {
    if (!this.duration || this.duration === 0) return 0;
    return Math.max(0, Math.min(1, this.currentTime / this.duration));
  }
}
