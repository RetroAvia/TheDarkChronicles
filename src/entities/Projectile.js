export class Projectile {
  // owner: 'enemy' (default — hurts the player, existing turret/boss shots)
  // or 'player' (hurts the boss instead — see Game._resolvePlayerProjectiles).
  // Kept separate from the enemy-projectile resolution path so the two never
  // cross-hit the wrong side.
  constructor({ x, y, vx, vy = 0, w = 12, h = 12, gravity = 0, color = '#ff3b3b', life = 3.5, owner = 'enemy' }) {
    this.x = x; this.y = y;
    this.vx = vx; this.vy = vy;
    this.w = w; this.h = h;
    this.gravity = gravity;
    this.color = color;
    this.life = life;
    this.age = 0;
    this.dead = false;
    this.spin = 0;
    this.owner = owner;
  }

  update(dt) {
    this.age += dt;
    if (this.age >= this.life) { this.dead = true; return; }
    this.vy += this.gravity * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.spin += dt * 10;
  }

  get bounds() {
    return { x: this.x - this.w / 2, y: this.y - this.h / 2, w: this.w, h: this.h };
  }

  /** Inset hit-test box for damage — the drawn glow is a circle inscribed in
   * this square, so the raw square bounds bite into the corners. */
  get hurtBounds() {
    const insetX = this.w * 0.2;
    const insetY = this.h * 0.2;
    return { x: this.x - this.w / 2 + insetX, y: this.y - this.h / 2 + insetY, w: this.w - insetX * 2, h: this.h - insetY * 2 };
  }
}
