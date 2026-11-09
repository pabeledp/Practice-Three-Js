/**
 * Smooth Virtual Scroll & Drag Physics Engine:
 * Handles wheel scrolling, trackpad momentum, mouse dragging, and touch gestures.
 * Provides normalized progress [0.0 to 1.0] with silky inertial damping.
 */
export class ScrollController {
  constructor({ totalSections = 4, onIndexChange = null }) {
    this.totalSections = totalSections;
    this.onIndexChange = onIndexChange;

    this.progress = 0.0;
    this.targetProgress = 0.0;
    this.velocity = 0.0;

    this.friction = 0.88;
    this.sensitivity = 0.00065;
    this.dragSensitivity = 0.0018;

    this.isDragging = false;
    this.startY = 0;
    this.currentIndex = 0;

    this.initEvents();
  }

  initEvents() {
    // Wheel & Trackpad scroll
    window.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.velocity += e.deltaY * this.sensitivity;
    }, { passive: false });

    // Pointer / Touch Dragging
    window.addEventListener('pointerdown', (e) => {
      // Don't drag if clicking buttons or modal
      if (e.target.closest('button, .cinema-modal, .track-marker')) return;
      this.isDragging = true;
      this.startY = e.clientY;
    });

    window.addEventListener('pointermove', (e) => {
      if (!this.isDragging) return;
      const deltaY = this.startY - e.clientY;
      this.startY = e.clientY;
      this.velocity += deltaY * this.dragSensitivity;
    });

    window.addEventListener('pointerup', () => {
      this.isDragging = false;
    });

    // Keyboard Arrow navigation (Down/Right = forward, Up/Left = backward)
    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === 'PageDown') {
        this.jumpToIndex(this.currentIndex + 1);
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'PageUp') {
        this.jumpToIndex(this.currentIndex - 1);
      }
    });
  }

  jumpToIndex(idx) {
    const clamped = Math.max(0, Math.min(this.totalSections - 1, idx));
    this.targetProgress = clamped / (this.totalSections - 1);
    this.velocity = 0;
  }

  update(delta) {
    // Integrate velocity into target progress
    this.targetProgress += this.velocity;
    this.velocity *= this.friction;

    // Hard bounds clamping with soft bounce
    this.targetProgress = Math.max(0.0, Math.min(1.0, this.targetProgress));

    // Smooth exponential lerp to target
    const lerpFactor = 1.0 - Math.exp(-9.0 * delta);
    this.progress += (this.targetProgress - this.progress) * lerpFactor;

    // Calculate active section index
    const newIndex = Math.round(this.progress * (this.totalSections - 1));
    if (newIndex !== this.currentIndex) {
      this.currentIndex = newIndex;
      if (this.onIndexChange) {
        this.onIndexChange(this.currentIndex);
      }
    }

    return this.progress;
  }
}
