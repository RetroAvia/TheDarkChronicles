export class Platform {
  constructor({ x, y, w, h, moving = null, crumble = false, spring = false }) {
    this.x = x; this.y = y; this.w = w; this.h = h;
    this.baseX = x; this.baseY = y;
    this.moving = moving; // { axis: 'x'|'y', range, speed, phase }
    this.crumble = crumble;
    this.crumbleTimer = null;
    this.gone = false;
    this._t = moving?.phase ?? 0;
    this.deltaX = 0;
    this.deltaY = 0;

    // Spring/bounce pad: launches the player back into the air instead of
    // letting them stand on it. bounceTime drives a brief squash-down visual.
    this.spring = spring;
    this.bounceTime = 0;
  }

  update(dt) {
    const prevX = this.x;
    const prevY = this.y;

    if (this.moving && !this.gone) {
      this._t += dt * this.moving.speed;
      const offset = Math.sin(this._t) * this.moving.range;
      if (this.moving.axis === 'x') this.x = this.baseX + offset;
      else this.y = this.baseY + offset;
    }
    if (this.crumbleTimer !== null) {
      this.crumbleTimer -= dt;
      if (this.crumbleTimer <= 0) this.gone = true;
    }
    if (this.bounceTime > 0) this.bounceTime -= dt;

    this.deltaX = this.x - prevX;
    this.deltaY = this.y - prevY;
  }

  triggerCrumble() {
    if (this.crumble && this.crumbleTimer === null) this.crumbleTimer = 0.45;
  }

  triggerBounce() {
    this.bounceTime = 0.28;
  }

  /** 0..1 squash progress for the spring's compress-then-release visual. */
  get bounceSquash() {
    if (this.bounceTime <= 0) return 0;
    return this.bounceTime / 0.28;
  }

  /** Restores a crumbling platform to its pristine state. Used when the player
   * respawns at a checkpoint without the level fully reloading (a void-fall
   * respawn), so a platform destroyed on an earlier pass never permanently
   * blocks the path back to where they died. */
  reset() {
    if (this.crumble) {
      this.gone = false;
      this.crumbleTimer = null;
    }
  }

  get shakeAmount() {
    if (this.crumbleTimer === null) return 0;
    return (1 - this.crumbleTimer / 0.45) * 3;
  }
}
