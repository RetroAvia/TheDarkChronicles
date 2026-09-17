import { clamp } from '../utils/math.js';

const GRAVITY = 2300;
const MAX_FALL = 1350;
const MOVE_SPEED = 270;
const GROUND_ACCEL = 2200;
const AIR_ACCEL = 1300;
const GROUND_FRICTION = 2400;
const JUMP_VELOCITY = -760;
const DOUBLE_JUMP_VELOCITY = -640;
const SPRING_VELOCITY = -980;
const JUMP_CUT_MULT = 0.42;
const COYOTE_TIME = 0.1;
const JUMP_BUFFER = 0.12;

const DASH_SPEED = 620;
const DASH_TIME = 0.16;
const DASH_COOLDOWN = 0.55;

// Melee weapon ("Lama al Plasma") — a short forward swing, see requestAttack/
// meleeBounds below. Short enough to demand real positioning (unlike the
// ranged shot), which is exactly why it's allowed to one-shot regular
// enemies and — like a stomp — damage a boss only during its vulnerable window.
const MELEE_DURATION = 0.16;
const MELEE_COOLDOWN = 0.5;

export class Player {
  constructor() {
    this.w = 30;
    this.h = 44;
    this.x = 0; this.y = 0;
    this.vx = 0; this.vy = 0;
    this.onGround = false;
    this.facing = 1;
    this.energy = 3;
    this.maxEnergy = 3;
    this.invulnerable = false;
    this.invulnTime = 0;
    this.isDying = false;
    this.dyingTime = 0;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.animState = 'idle';
    this.animTime = 0;
    this.landedThisFrame = false;
    this.jumpedThisFrame = false;
    this.doubleJumpedThisFrame = false;
    this.springBouncedThisFrame = false;

    // Squash & stretch "juice": a single signed offset decayed toward 0 each
    // frame. Positive = stretched tall/thin (takeoff), negative = squashed
    // short/wide (landing/impact). Purely cosmetic — read only by drawPlayer.
    this.squash = 0;

    // abilities — unlocked progressively, set by Game from save data.
    // `ranged` is the odd one out: it's never persisted to the save file,
    // just granted for the boss-arena set-piece in the final level (see
    // Game._updatePortal) and reset like everything else on the next
    // loadLevel — a one-fight power-up, not a permanent unlock. `melee` is
    // similar (never persisted) but Game._applyClassBonuses re-grants it
    // unconditionally on every loadLevel — a base weapon everyone has from
    // the very first level, not an unlock at all.
    this.abilities = { doubleJump: false, dash: false, ranged: false, melee: false };
    this.usedAirJump = false;

    this.shootRequested = false;
    this.shootCooldown = 0;
    this.justFired = false;

    this.isDashing = false;
    this.dashTime = 0;
    this.dashCooldown = 0;
    this.dashRequested = false;
    this.dashJustStarted = false;

    this.attackDuration = MELEE_DURATION;
    this.isAttacking = false;
    this.attackTime = 0;
    this.attackCooldown = 0;
    this.attackRequested = false;
    this.attackJustStarted = false;

    this.groundPlatform = null;
    this.springGrace = 0;
  }

  spawn(x, y) {
    this.resetPosition(x, y);
    this.isDying = false;
    this.dyingTime = 0;
    this.invulnerable = false;
    this.invulnTime = 0;
    this.energy = this.maxEnergy;
  }

  /** Repositions the player after a non-fatal life loss, WITHOUT refilling energy. */
  resetPosition(x, y) {
    this.x = x; this.y = y;
    this.vx = 0; this.vy = 0;
    this.onGround = false;
    this.groundPlatform = null;
    this.isDashing = false;
    this.dashTime = 0;
  }

  requestJump() {
    this.jumpBufferTimer = JUMP_BUFFER;
  }

  requestDash() {
    if (this.abilities.dash) this.dashRequested = true;
  }

  requestShoot() {
    if (this.abilities.ranged) this.shootRequested = true;
  }

  requestAttack() {
    if (this.abilities.melee) this.attackRequested = true;
  }

  releaseJump() {
    // A spring bounce isn't triggered by pressing jump, so it would feel
    // broken/unfair for it to fizzle out just because the player wasn't
    // already holding the button when they landed on the pad — springs get
    // a short grace window immune to the jump-cut (see update()).
    if (this.springGrace > 0) return;
    if (this.vy < JUMP_VELOCITY * JUMP_CUT_MULT) {
      this.vy = JUMP_VELOCITY * JUMP_CUT_MULT;
    }
  }

  takeHit(knockbackDir = 0) {
    if (this.invulnerable || this.isDying || this.isDashing) return false;
    this.energy -= 1;
    this.invulnerable = true;
    this.invulnTime = 1.4;
    this.vy = -420;
    if (knockbackDir) this.vx = knockbackDir * 220;
    return true;
  }

  die() {
    this.isDying = true;
    this.dyingTime = 0;
    this.vx = 0;
    this.vy = -500;
  }

  update(dt, input, world) {
    this.landedThisFrame = false;
    this.jumpedThisFrame = false;
    this.doubleJumpedThisFrame = false;
    this.dashJustStarted = false;
    this.springBouncedThisFrame = false;
    this.justFired = false;
    this.attackJustStarted = false;

    if (this.isDying) {
      this.dyingTime += dt;
      this.vy += GRAVITY * dt;
      this.y += this.vy * dt;
      this.animState = 'dying';
      return;
    }

    this.dashCooldown = Math.max(0, this.dashCooldown - dt);
    this.springGrace = Math.max(0, this.springGrace - dt);
    this.shootCooldown = Math.max(0, this.shootCooldown - dt);
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);

    // --- ranged shot trigger — only meaningful once abilities.ranged is on,
    // but harmless to leave wired up the rest of the time since
    // requestShoot() already gates on the ability itself. ---
    if (this.shootRequested) {
      this.shootRequested = false;
      if (this.abilities.ranged && this.shootCooldown <= 0) {
        this.justFired = true;
        this.shootCooldown = 0.42;
      }
    }

    // --- melee swing trigger ("Lama al Plasma") — a short, close-range
    // forward slash; see meleeBounds below for the actual hit-test box,
    // resolved in Game._resolveEnemies/_resolveBoss like the ranged shot. ---
    if (this.attackRequested) {
      this.attackRequested = false;
      if (this.abilities.melee && !this.isAttacking && this.attackCooldown <= 0) {
        this.isAttacking = true;
        this.attackJustStarted = true;
        this.attackTime = MELEE_DURATION;
        this.attackCooldown = MELEE_COOLDOWN;
        this.squash = 0.16;
      }
    }
    if (this.isAttacking) {
      this.attackTime -= dt;
      if (this.attackTime <= 0) this.isAttacking = false;
    }

    // --- dash trigger (overrides normal horizontal control while active) ---
    if (this.dashRequested) {
      this.dashRequested = false;
      if (this.abilities.dash && !this.isDashing && this.dashCooldown <= 0) {
        this.isDashing = true;
        this.dashJustStarted = true;
        this.dashTime = DASH_TIME;
        this.dashCooldown = DASH_COOLDOWN;
        this.vx = this.facing * DASH_SPEED;
        this.vy = 0;
        this.invulnerable = true;
        this.invulnTime = Math.max(this.invulnTime, DASH_TIME + 0.05);
        this.squash = 0.2;
      }
    }

    if (this.isDashing) {
      this.dashTime -= dt;
      if (this.dashTime <= 0) {
        this.isDashing = false;
        this.vx *= 0.5;
      }
    }

    // --- horizontal ---
    const wantDir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    if (!this.isDashing) {
      const accel = this.onGround ? GROUND_ACCEL : AIR_ACCEL;
      if (wantDir !== 0) {
        this.vx += wantDir * accel * dt;
        this.vx = clamp(this.vx, -MOVE_SPEED, MOVE_SPEED);
        this.facing = wantDir;
      } else if (this.onGround) {
        const decel = GROUND_FRICTION * dt;
        if (Math.abs(this.vx) <= decel) this.vx = 0;
        else this.vx -= Math.sign(this.vx) * decel;
      }
    } else if (wantDir !== 0) {
      this.facing = wantDir;
    }

    // --- jump buffering / coyote time / double jump ---
    this.coyoteTimer = this.onGround ? COYOTE_TIME : Math.max(0, this.coyoteTimer - dt);
    this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - dt);

    if (this.jumpBufferTimer > 0 && !this.isDashing) {
      if (this.coyoteTimer > 0) {
        this.vy = JUMP_VELOCITY;
        this.onGround = false;
        this.coyoteTimer = 0;
        this.jumpBufferTimer = 0;
        this.jumpedThisFrame = true;
        this.usedAirJump = false;
        this.squash = 0.3;
      } else if (this.abilities.doubleJump && !this.usedAirJump) {
        this.vy = DOUBLE_JUMP_VELOCITY;
        this.jumpBufferTimer = 0;
        this.usedAirJump = true;
        this.doubleJumpedThisFrame = true;
        this.squash = 0.34;
      }
    }

    // --- vertical ---
    if (!this.isDashing) {
      this.vy += GRAVITY * dt;
      this.vy = Math.min(this.vy, MAX_FALL);
    }

    const wasOnGround = this.onGround;
    const prevX = this.x;
    const prevY = this.y;

    // carry the player along with the platform they're standing on
    if (wasOnGround && this.groundPlatform && !this.groundPlatform.gone) {
      this.x += this.groundPlatform.deltaX || 0;
      this.y += this.groundPlatform.deltaY || 0;
    }

    const impactVy = this.vy; // fall speed at the moment of collision, before it's zeroed below

    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.onGround = false;
    this.groundPlatform = null;

    this._resolveCollisions(world, prevX, prevY);

    if (this.onGround) {
      this.usedAirJump = false;
      if (!wasOnGround) {
        this.landedThisFrame = true;
        // Harder landings squash more — a light hop barely registers, a long
        // fall reads as a real impact. Clamped so it never gets cartoonish.
        this.squash = -clamp(impactVy / 1500, 0.18, 0.5);
      }
    }

    // Squash & stretch decays back toward neutral every frame regardless of
    // what triggered it, independent of the branches above.
    this.squash *= Math.max(0, 1 - dt * 11);

    // --- invulnerability ---
    if (this.invulnerable && !this.isDashing) {
      this.invulnTime -= dt;
      if (this.invulnTime <= 0) this.invulnerable = false;
    }

    // --- animation state ---
    this.animTime += dt;
    if (this.isDashing) this.animState = 'dash';
    else if (!this.onGround) this.animState = this.vy < 0 ? 'jump' : 'fall';
    else if (Math.abs(this.vx) > 20) this.animState = 'run';
    else this.animState = 'idle';
  }

  _resolveCollisions(world, prevX, prevY) {
    const prevBottom = prevY + this.h;
    const EPS = 0.6;

    for (const platform of world.platforms) {
      if (platform.gone) continue;
      const px = platform.x, py = platform.y, pw = platform.w, ph = platform.h;

      const overlapX = Math.min(this.x + this.w, px + pw) - Math.max(this.x, px);
      const overlapY = Math.min(this.y + this.h, py + ph) - Math.max(this.y, py);
      if (overlapX <= 0 || overlapY <= 0) continue;

      const cameFromAbove = prevBottom <= py + EPS && this.vy >= 0;
      const cameFromBelow = prevY >= py + ph - EPS && this.vy <= 0;

      if (cameFromAbove) {
        this.y = py - this.h;
        if (platform.spring) {
          this.vy = SPRING_VELOCITY;
          this.onGround = false;
          this.usedAirJump = false; // a bounce refreshes the air-jump, same as touching solid ground
          this.squash = 0.42;
          this.springBouncedThisFrame = true;
          this.springGrace = 0.3;
          platform.triggerBounce?.();
        } else {
          this.vy = 0;
          this.onGround = true;
          this.groundPlatform = platform;
          platform.triggerCrumble?.();
        }
      } else if (cameFromBelow) {
        this.y = py + ph;
        if (this.vy < 0) this.vy = 0;
      } else if (overlapX < overlapY) {
        this.x = prevX < px ? px - this.w : px + pw;
        if (this.isDashing) { this.isDashing = false; this.dashTime = 0; }
        this.vx = 0;
      } else if (this.y < py) {
        this.y = py - this.h;
        this.vy = 0;
        this.onGround = true;
        this.groundPlatform = platform;
        platform.triggerCrumble?.();
      } else {
        this.y = py + ph;
        if (this.vy < 0) this.vy = 0;
      }
    }
  }

  get bounds() {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }

  /** Slightly inset hit-test box used when checking incoming damage. Platform
   * collision, collectibles, checkpoints and the goal all keep using the
   * full `bounds` (precise footing, generous pickups) — only "does this hurt
   * me" gets a small margin, matching the same forgiveness given to enemies/
   * hazards/projectiles on their side of the same check. */
  get hurtBounds() {
    const insetX = this.w * 0.12;
    const insetY = this.h * 0.08;
    return { x: this.x + insetX, y: this.y + insetY, w: this.w - insetX * 2, h: this.h - insetY * 2 };
  }

  /** The plasma blade's active hit-test box: a wedge extending forward from
   * the player in whichever direction they're facing, only meaningful while
   * isAttacking is true. Reaches further than hurtBounds/bounds — the whole
   * point of a melee weapon is not having to stand directly on the enemy. */
  get meleeBounds() {
    const reach = this.w * 0.95;
    const x = this.facing > 0 ? this.x + this.w * 0.5 : this.x + this.w * 0.5 - reach;
    return { x, y: this.y + this.h * 0.08, w: reach, h: this.h * 0.86 };
  }
}
