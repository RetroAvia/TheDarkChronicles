import { clamp, randRange } from '../utils/math.js';

export class Enemy {
  constructor({ x, y, w = 28, h = 28, vx = 1, range = 80, type = 'patrol', speed = 70, fireRate = 2.2 }) {
    this.x = x; this.y = y; this.w = w; this.h = h;
    this.originX = x;
    this.originY = y;
    this.dir = vx >= 0 ? 1 : -1;
    this.range = range;
    this.type = type;
    this.speed = speed;
    this.alive = true;
    this.deathTimer = 0;
    this.t = Math.random() * Math.PI * 2;
    this.hurtFlash = 0;

    // turret-only
    this.fireRate = fireRate;
    this.fireTimer = fireRate * 0.5;
    this.wantsToFire = false;
    this.fireDir = 1;

    // hunter/flyer behavior state — see update() for the state machines.
    this.state = 'patrol';
    this.chaseTimer = 0;
    this.alertTimer = 0;
    this.diveCooldown = randRange(0, 0.8); // desync multiple flyers a bit
    this.diveTimer = 0;
    this.recoverTimer = 0;
    this.diveVX = 0;
    this.diveVY = 0;
  }

  update(dt, playerX, playerY) {
    this.t += dt;
    if (!this.alive) {
      this.deathTimer += dt;
      return;
    }
    if (this.hurtFlash > 0) this.hurtFlash -= dt;
    this.wantsToFire = false;

    if (this.type === 'hunter' && playerX !== undefined) {
      this._updateHunter(dt, playerX);
    } else if (this.type === 'flyer') {
      this._updateFlyer(dt, playerX, playerY);
    } else if (this.type === 'turret') {
      this._updateTurret(dt, playerX);
    } else {
      this.x += this.dir * this.speed * dt;
      this._clampToRange('x');
    }
  }

  /** Notices the player within a wide radius (with a short telegraphed
   * pause before lunging), keeps chasing for a bit after losing sight
   * rather than snapping back instantly, then gives up and resumes patrol. */
  _updateHunter(dt, playerX) {
    const dist = playerX - this.x;
    const seesPlayer = Math.abs(dist) < this.range * 1.6;
    this.chaseTimer = Math.max(0, this.chaseTimer - dt);
    this.alertTimer = Math.max(0, this.alertTimer - dt);

    if (seesPlayer && this.state === 'patrol' && this.chaseTimer <= 0) {
      this.state = 'alert';
      this.alertTimer = 0.18;
      this.hurtFlash = Math.max(this.hurtFlash, 0.18); // quick "spotted you" flash
    }
    if (seesPlayer) this.chaseTimer = 0.9; // keep chasing this long after last contact

    if (this.state === 'alert') {
      this.dir = dist >= 0 ? 1 : -1; // face the player while winding up
      if (this.alertTimer <= 0) this.state = 'chase';
    } else if (this.chaseTimer > 0) {
      this.state = 'chase';
      this.dir = dist >= 0 ? 1 : -1;
      this.x += this.dir * this.speed * 1.3 * dt;
    } else {
      this.state = 'patrol';
      this.x += this.dir * this.speed * 0.5 * dt;
    }
    this._clampToRange('x');
  }

  /** Patrols its usual sine-bob path until the player wanders close, then
   * telegraphs briefly and dive-bombs their last-seen position (locked at
   * dive-start, so it's dodgeable), recovers back to its path, and cools
   * down before it can dive again. */
  _updateFlyer(dt, playerX, playerY) {
    this.diveCooldown = Math.max(0, this.diveCooldown - dt);

    if (this.state === 'diving') {
      this.diveTimer -= dt;
      this.x += this.diveVX * dt;
      this.y += this.diveVY * dt;
      if (this.diveTimer <= 0) { this.state = 'recovering'; this.recoverTimer = 0.7; }
      return;
    }
    if (this.state === 'recovering') {
      this.recoverTimer -= dt;
      const pull = Math.min(1, dt * 3);
      this.x += (this.originX - this.x) * pull;
      this.y += (this.originY - this.y) * pull;
      if (this.recoverTimer <= 0) { this.state = 'patrol'; this.diveCooldown = 2.2; }
      return;
    }
    if (this.state === 'alert') {
      this.alertTimer -= dt;
      if (this.alertTimer <= 0) {
        this.state = 'diving';
        this.diveTimer = 0.55;
        const dx = this._diveTargetX - this.x;
        const dy = this._diveTargetY - this.y;
        const dist = Math.max(1, Math.hypot(dx, dy));
        const diveSpeed = this.speed * 4.2;
        this.diveVX = (dx / dist) * diveSpeed;
        this.diveVY = (dy / dist) * diveSpeed;
      }
      return;
    }

    // patrol
    this.x += this.dir * this.speed * dt;
    this.y = this.originY + Math.sin(this.t * 2.1) * 26;
    this._clampToRange('x');
    if (playerX !== undefined && playerY !== undefined && this.diveCooldown <= 0) {
      const dist = Math.hypot(playerX - this.x, playerY - this.y);
      if (dist < this.range * 2.4) {
        this.state = 'alert';
        this.alertTimer = 0.3;
        this.hurtFlash = Math.max(this.hurtFlash, 0.3);
        this._diveTargetX = playerX;
        this._diveTargetY = playerY;
      }
    }
  }

  /** Stays dormant until the player is within range (so it never snipes you
   * from off-screen), then fires at its normal rate — speeding up when the
   * player is right on top of it for extra tension. */
  _updateTurret(dt, playerX) {
    if (playerX !== undefined) this.fireDir = playerX >= this.x ? 1 : -1;
    const dist = playerX !== undefined ? Math.abs(playerX - this.x) : Infinity;
    const detected = dist < 340;
    if (detected) {
      this.fireTimer -= dt;
      if (this.fireTimer <= 0) {
        this.fireTimer = dist < 140 ? this.fireRate * 0.65 : this.fireRate;
        this.wantsToFire = true;
      }
    } else {
      // Cools down slowly while the player is away, so it doesn't
      // instant-fire the moment they wander back within range.
      this.fireTimer = Math.min(this.fireTimer + dt * 0.4, this.fireRate * 0.5);
    }
  }

  _clampToRange(axis) {
    const origin = axis === 'x' ? this.originX : this.originY;
    const traveled = this[axis] - origin;
    if (traveled > this.range) { this[axis] = origin + this.range; this.dir = -1; }
    if (traveled < -this.range) { this[axis] = origin - this.range; this.dir = 1; }
  }

  kill() {
    this.alive = false;
    this.deathTimer = 0;
  }

  get squashT() {
    return clamp(this.deathTimer / 0.3, 0, 1);
  }

  get bounds() {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }

  /** Slightly inset hit-test box used when checking damage against the
   * player. The drawn body is a spiky/rounded shape that doesn't fill its
   * square bounding box, especially at the corners — hitting the player with
   * the full square feels cheap. Stomp detection deliberately keeps using
   * the full `bounds` (see Game.js), since landing precision there should
   * stay generous in the player's favor either way. */
  get hurtBounds() {
    const insetX = this.w * 0.16;
    const insetY = this.h * 0.14;
    return { x: this.x + insetX, y: this.y + insetY, w: this.w - insetX * 2, h: this.h - insetY * 2 };
  }
}
