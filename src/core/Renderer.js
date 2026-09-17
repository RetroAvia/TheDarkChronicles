import { getDevicePixelRatio } from '../utils/device.js';
import { GFX } from './quality.js';

// --- design viewport -------------------------------------------------------
// The world is authored in "world units" (see world/levels.js: platforms sit
// between y 0 and ~540). The renderer picks a scale so that AT LEAST this
// much of the world is always visible, instead of the old height-only scale
// which, on a phone held upright, left barely 260 world px of horizontal
// room — roughly one platform's worth of visibility.
const MIN_VIEW_W = 980;   // world px that must fit horizontally
const MIN_VIEW_H = 520;   // world px that must fit vertically
const MIN_SCALE = 0.3;
const MAX_SCALE = 2.4;

// Fallback used only when the player dismisses the "rotate your device"
// prompt and insists on playing upright: a narrower horizontal window than
// landscape, but still ~3x what the old scaling gave them.
const PORTRAIT_VIEW_W = 760;

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.width = 0;
    this.height = 0;
    this.dpr = 1;

    /** Visible world region, in world units. Recomputed on every resize. */
    this.scale = 1;
    this.viewW = MIN_VIEW_W;
    this.viewH = MIN_VIEW_H;

    /** True while the device is upright AND touch-based (see Game: this is
     * what raises the rotate prompt). Recomputed on resize/orientation. */
    this.isPortrait = false;
    /** Set by Game when the player explicitly chooses to play upright. */
    this.allowPortrait = false;

    this._installQualityHook();

    this._resize = this._resize.bind(this);
    window.addEventListener('resize', this._resize);
    window.addEventListener('orientationchange', this._resize);
    // Mobile browsers resize the visual viewport (URL bar collapsing) without
    // always firing a window resize — this keeps the canvas honest.
    window.visualViewport?.addEventListener('resize', this._resize);
    if (typeof ResizeObserver !== 'undefined' && canvas.parentElement) {
      this._ro = new ResizeObserver(this._resize);
      this._ro.observe(canvas.parentElement);
    }
    this._resize();
  }

  /** Routes every `ctx.shadowBlur = n` in the whole renderer through the
   * quality switch, without touching the ~40 call sites that set it. Defines
   * an own property on the context instance that shadows the prototype
   * accessor and forwards to it (see core/quality.js for the reasoning). */
  _installQualityHook() {
    try {
      const proto = Object.getPrototypeOf(this.ctx);
      const desc = Object.getOwnPropertyDescriptor(proto, 'shadowBlur');
      if (!desc || !desc.get || !desc.set) return;
      Object.defineProperty(this.ctx, 'shadowBlur', {
        configurable: true,
        get() { return desc.get.call(this); },
        set(v) { desc.set.call(this, GFX.glow ? v : 0); }
      });
    } catch {
      /* non-standard context — fall back to always-on glow */
    }
  }

  _resize() {
    const parent = this.canvas.parentElement;
    const rect = parent.getBoundingClientRect();
    this.dpr = Math.min(getDevicePixelRatio(), GFX.maxDpr);
    this.width = Math.max(1, Math.round(rect.width));
    this.height = Math.max(1, Math.round(rect.height));
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this._recomputeView();
  }

  _recomputeView() {
    this.isPortrait = this.height > this.width * 1.05;

    const scale = this.isPortrait
      ? this.width / PORTRAIT_VIEW_W
      : Math.min(this.width / MIN_VIEW_W, this.height / MIN_VIEW_H);

    this.scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
    this.viewW = this.width / this.scale;
    this.viewH = this.height / this.scale;
  }

  /** Re-reads the DPR cap after a quality change. */
  refreshQuality() {
    this._resize();
  }

  clear(color = '#050508') {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  destroy() {
    window.removeEventListener('resize', this._resize);
    window.removeEventListener('orientationchange', this._resize);
    window.visualViewport?.removeEventListener('resize', this._resize);
    this._ro?.disconnect();
  }
}
