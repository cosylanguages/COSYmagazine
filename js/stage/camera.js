/**
 * js/stage/camera.js
 * Smooth camera zoom & pan system for COSY Stage Mode.
 *
 * Uses requestAnimationFrame for smooth 60fps camera movement.
 * Respects prefers-reduced-motion by using instantaneous jump cuts with cross-fades.
 */

export class StageCamera {
  constructor(stageElement, viewportElement) {
    this.stage = stageElement;
    this.viewport = viewportElement;
    this.content = viewportElement ? viewportElement.querySelector('#stage-content') : null;
    this.currentTransform = { x: 0, y: 0, scale: 1 };
    this.targetTransform = { x: 0, y: 0, scale: 1 };
    this.animating = false;
    this.animationFrameId = null;

    // Check reduced motion preference
    this.reducedMotion = typeof window !== 'undefined' &&
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * Calculates transform required to center target inside the viewable safe area of stage-viewport,
   * reserving space for top controls and lower-third captions, and scaling down to fit if needed.
   */
  calculateTransformForTarget(target, options = {}) {
    const vp = this.viewport;
    const content = this.content || (vp ? vp.querySelector('#stage-content') : null) || vp;
    if (!vp || !content) return { x: 0, y: 0, scale: 1 };

    let targetEl = null;
    if (typeof target === 'string') {
      targetEl = document.querySelector(target);
    } else if (target && typeof target.getBoundingClientRect === 'function') {
      targetEl = target;
    }

    // Fallback if target element is missing, disconnected, or has zero dimensions
    if (!targetEl || !targetEl.isConnected) {
      targetEl = content.querySelector('.stage-card') || content.querySelector('#stage-title-card') || content;
    } else {
      const r = targetEl.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) {
        targetEl = targetEl.closest('.stage-card') || content.querySelector('.stage-card') || content;
      }
    }

    const vpRect = vp.getBoundingClientRect();

    // Temporarily clear element spotlight classes during geometry measurement
    const activeSpotlights = document.querySelectorAll('.stage-spotlight-active, .stage-spotlight-dim');
    activeSpotlights.forEach(el => el.classList.remove('stage-spotlight-active', 'stage-spotlight-dim'));

    // Reset content transform temporarily to measure true unscaled layout offset
    const savedTransform = content.style.transform;
    content.style.transform = 'none';

    const contentRect = content.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();

    // Restore transform
    content.style.transform = savedTransform;

    // True unscaled offsets relative to content (0,0)
    const xLocal = targetRect.left - contentRect.left;
    const yLocal = targetRect.top - contentRect.top;
    const wUnscaled = targetRect.width;
    const hUnscaled = targetRect.height;

    // Center of target in local unscaled content coordinates
    const xCenterLocal = xLocal + wUnscaled / 2;
    const yCenterLocal = yLocal + hUnscaled / 2;

    // Insets / Safe area inside viewport (top=30, bottom=160 reserves caption band, side=40)
    const topInset = options.topInset !== undefined ? options.topInset : 30;
    const bottomInset = options.bottomInset !== undefined ? options.bottomInset : 160;
    const sideInset = options.sideInset !== undefined ? options.sideInset : 40;

    const availW = Math.max(100, vpRect.width - sideInset * 2);
    const availH = Math.max(100, vpRect.height - (topInset + bottomInset));

    // Requested scale vs maximum fit scale
    const requestedScale = options.scale !== undefined ? options.scale : 1.1;
    const maxScaleX = availW / (wUnscaled || 1);
    const maxScaleY = availH / (hUnscaled || 1);
    const maxFitScale = Math.min(maxScaleX, maxScaleY);

    const finalScale = Math.max(0.1, Math.min(requestedScale, maxFitScale));

    // Desired safe center in viewport-relative coordinates
    const safeCenterX = sideInset + availW / 2;
    const safeCenterY = topInset + availH / 2;

    const targetX = safeCenterX - xCenterLocal * finalScale;
    const targetY = safeCenterY - yCenterLocal * finalScale;

    return {
      x: Math.round(targetX * 100) / 100,
      y: Math.round(targetY * 100) / 100,
      scale: Math.round(finalScale * 1000) / 1000
    };
  }

  /**
   * Smoothly transitions camera transform to target bounding element or explicit coordinates.
   */
  moveTo(target, options = {}) {
    const isRenderMode = typeof document !== 'undefined' && document.body.classList.contains('stage-render-mode');
    const duration = (this.reducedMotion || isRenderMode) ? 0 : (options.duration !== undefined ? options.duration : 1000);

    if (target && typeof target === 'object' && typeof target.getBoundingClientRect !== 'function' && target.x !== undefined) {
      this.targetTransform = { x: target.x || 0, y: target.y || 0, scale: options.scale || 1 };
    } else {
      this.targetTransform = this.calculateTransformForTarget(target, options);
    }

    if (duration === 0) {
      this.currentTransform = { ...this.targetTransform };
      this.applyTransform();
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const startX = this.currentTransform.x;
      const startY = this.currentTransform.y;
      const startScale = this.currentTransform.scale;

      const { x: targetX, y: targetY, scale: targetScale } = this.targetTransform;
      const startTime = performance.now();

      const animate = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease out cubic
        const easeProgress = 1 - Math.pow(1 - progress, 3);

        this.currentTransform.x = startX + (targetX - startX) * easeProgress;
        this.currentTransform.y = startY + (targetY - startY) * easeProgress;
        this.currentTransform.scale = startScale + (targetScale - startScale) * easeProgress;

        this.applyTransform();

        if (progress < 1) {
          this.animationFrameId = requestAnimationFrame(animate);
        } else {
          this.animating = false;
          resolve();
        }
      };

      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
      }
      this.animating = true;
      this.animationFrameId = requestAnimationFrame(animate);
    });
  }

  /** Camera Presets */
  focus(element, options = {}) {
    return this.moveTo(element, { scale: 1.1, duration: 800, ...options });
  }

  pushIn(element, options = {}) {
    return this.moveTo(element, { scale: 1.25, duration: 1200, ...options });
  }

  pullBack(element, options = {}) {
    if (element && typeof element === 'object' && typeof element.getBoundingClientRect !== 'function') {
      options = element;
      element = null;
    }
    return this.moveTo(element, { scale: 1, duration: 1000, ...options });
  }

  panAcross(startElement, endElement, options = {}) {
    return this.moveTo(startElement, { scale: 1.1, duration: 600 }).then(() => {
      return this.moveTo(endElement, { scale: 1.1, duration: 1400, ...options });
    });
  }

  spotlight(element) {
    if (!element) return;
    const allBlocks = this.stage.querySelectorAll('.stage-block, .block-item');
    allBlocks.forEach(b => {
      if (b === element || element.contains(b)) {
        b.classList.add('stage-spotlight-active');
        b.classList.remove('stage-spotlight-dim');
      } else {
        b.classList.add('stage-spotlight-dim');
        b.classList.remove('stage-spotlight-active');
      }
    });
    return this.focus(element);
  }

  clearSpotlight() {
    if (!this.stage) return;
    const allBlocks = this.stage.querySelectorAll('.stage-block, .block-item');
    allBlocks.forEach(b => {
      b.classList.remove('stage-spotlight-dim', 'stage-spotlight-active');
    });
  }

  getTargetTransformForBeat(beat) {
    if (!beat) return { x: 0, y: 0, scale: 1 };
    const preset = beat.cameraPreset || 'focus';
    const targetEl = (beat.targetSelector && typeof document !== 'undefined')
      ? document.querySelector(beat.targetSelector)
      : null;

    let scale = 1.1;
    if (preset === 'push-in') scale = 1.25;
    else if (preset === 'focus' || preset === 'spotlight') scale = 1.1;
    else if (preset === 'pull-back') scale = 1;

    return this.calculateTransformForTarget(targetEl, { scale });
  }

  /** Synchronously sets transform at a given timestamp/beat for deterministic rendering */
  setTransformForTime(beats, activeIndex, localElapsedMs, beatDurationMs) {
    if (!beats || activeIndex < 0 || activeIndex >= beats.length) return;

    const currentBeat = beats[activeIndex];
    const targetEl = (currentBeat.targetSelector && typeof document !== 'undefined')
      ? document.querySelector(currentBeat.targetSelector)
      : null;

    if (currentBeat.cameraPreset === 'spotlight' && targetEl) {
      this.spotlight(targetEl);
    } else {
      this.clearSpotlight();
    }

    const currentTarget = this.getTargetTransformForBeat(currentBeat);
    const prevTarget = activeIndex > 0
      ? this.getTargetTransformForBeat(beats[activeIndex - 1])
      : { x: 0, y: 0, scale: 1 };

    let cameraMoveDuration = 1000;
    if (currentBeat.cameraPreset === 'focus' || currentBeat.cameraPreset === 'spotlight') cameraMoveDuration = 800;
    else if (currentBeat.cameraPreset === 'push-in') cameraMoveDuration = 1200;

    const isRenderMode = typeof document !== 'undefined' && document.body.classList.contains('stage-render-mode');
    let progress = Math.min(1, Math.max(0, localElapsedMs / cameraMoveDuration));
    if (this.reducedMotion || isRenderMode) progress = 1;

    const easeProgress = 1 - Math.pow(1 - progress, 3);

    this.currentTransform = {
      x: prevTarget.x + (currentTarget.x - prevTarget.x) * easeProgress,
      y: prevTarget.y + (currentTarget.y - prevTarget.y) * easeProgress,
      scale: prevTarget.scale + (currentTarget.scale - prevTarget.scale) * easeProgress
    };

    this.applyTransform();
  }

  applyTransform() {
    const target = this.content || (this.viewport ? this.viewport.querySelector('#stage-content') : null) || this.viewport;
    if (!target) return;
    const { x, y, scale } = this.currentTransform;
    target.style.transform = `translate3d(${x}px, ${y}px, 0px) scale(${scale})`;
  }
}
