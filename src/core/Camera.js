import { damp, clamp } from '../utils/math.js';

export class Camera {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.shakeTime = 0;
    this.shakeMag = 0;
    this.shakeX = 0;
    this.shakeY = 0;
  }

  /**
   * @param {object} player
   * @param {number} viewW visible world width this frame
   * @param {number} viewH visible world height this frame
   * @param {object} bounds { worldW, top, bottom } — the level's actual
   *   content box. `top`/`bottom` come from the level geometry rather than a
   *   fixed world height, which is what stops levels whose platforms all sit
   *   low from being framed with half a screen of empty sky above them.
   */
  follow(player, viewW, viewH, bounds) {
    this._player = player;
    this._viewW = viewW;
    this._viewH = viewH;
    this._bounds = bounds;

    const centerX = player.x + player.w / 2;
    const lookahead = clamp(player.vx * 0.3, -95, 95);
    this.targetX = clamp(centerX - viewW / 2 + lookahead, 0, Math.max(0, bounds.worldW - viewW));

    // --- vertical ---------------------------------------------------------
    const contentH = bounds.bottom - bounds.top;
    const centerY = player.y + player.h / 2;

    if (contentH <= viewH) {
      // Everything fits: centre the level's content in frame instead of
      // pinning the view to y=0 and leaving the dead space at the top.
      this.targetY = (bounds.top + bounds.bottom) / 2 - viewH / 2;
      this._minY = this._maxY = this.targetY;
    } else {
      this._minY = bounds.top;
      this._maxY = bounds.bottom - viewH;
      // Taller than the screen: follow the player, but only once they leave a
      // generous central dead zone, so ordinary jumps don't pan the camera.
      const deadTop = this.targetY + viewH * 0.34;
      const deadBottom = this.targetY + viewH * 0.62;
      if (centerY < deadTop) this.targetY = centerY - viewH * 0.34;
      else if (centerY > deadBottom) this.targetY = centerY - viewH * 0.62;
      this.targetY = clamp(this.targetY, bounds.top, bounds.bottom - viewH);
    }
  }

  shake(magnitude, duration) {
    this.shakeMag = Math.max(this.shakeMag, magnitude);
    this.shakeTime = Math.max(this.shakeTime, duration);
  }

  update(dt) {
    this.x = damp(this.x, this.targetX, 9, dt);
    // Slower vertically than horizontally on purpose: a snappy vertical
    // camera reads as seasickness, a lazy one reads as weight.
    this.y = damp(this.y, this.targetY, 6, dt);

    // Hard safety net: however far the smooth follow lags behind a burst of
    // speed (dash, knockback, spring), the player must never leave the frame.
    if (this._player && this._viewW) {
      const marginX = 56;
      if (this._viewW > marginX * 2) {
        const minCamX = this._player.x + this._player.w - this._viewW + marginX;
        const maxCamX = this._player.x - marginX;
        this.x = clamp(this.x, minCamX, maxCamX);
      }
      this.x = clamp(this.x, 0, Math.max(0, this._bounds.worldW - this._viewW));

      const marginY = 48;
      if (this._viewH > marginY * 2) {
        const minCamY = this._player.y + this._player.h - this._viewH + marginY;
        const maxCamY = this._player.y - marginY;
        this.y = clamp(this.y, minCamY, maxCamY);
      }
      // The level's own framing box always wins. Without this, a player
      // falling into the void dragged the camera hundreds of pixels below
      // the level with them, so the last thing they saw before respawning
      // was empty gradient instead of the ground they just missed.
      if (this._minY !== undefined) this.y = clamp(this.y, this._minY, this._maxY);
    }

    if (this.shakeTime > 0) {
      this.shakeTime -= dt;
      const falloff = Math.max(this.shakeTime, 0);
      this.shakeX = (Math.random() * 2 - 1) * this.shakeMag * falloff;
      this.shakeY = (Math.random() * 2 - 1) * this.shakeMag * falloff * 0.6;
      if (this.shakeTime <= 0) { this.shakeMag = 0; this.shakeX = 0; this.shakeY = 0; }
    }
  }

  reset(x = 0, y = 0) {
    this.x = x;
    this.targetX = x;
    this.y = y;
    this.targetY = y;
    this.shakeTime = 0;
    this.shakeX = 0;
    this.shakeY = 0;
  }
}
