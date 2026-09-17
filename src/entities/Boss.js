import { clamp } from '../utils/math.js';

const PATROL_TIME = 2.1;
const CHARGE_TELEGRAPH_TIME = 0.4;
const CHARGE_TIME = 0.6;
const CHARGE_SPEED_MULT = 5.5;
const TELEGRAPH_TIME = 0.65;
const SHOT_COUNT = 3;
const SHOT_INTERVAL = 0.16;
const VULNERABLE_TIME = 2.0;

// Round 11 rework: a real Souls-style multi-phase escalation instead of a
// flat fight — the first chunk of health plays exactly like before ("dalla 8
// alla 5 è come ora", per the explicit request), then every further hit
// unlocks something new on top of the existing speed/timing ramp, so the
// fight keeps changing shape all the way to the kill instead of just getting
// incrementally faster. Four tiers, keyed by phase number:
//   1 — baseline (unchanged).
//   2 — faster/shorter windows (as the old "enraged" tier) + a 3-way spread
//       shot during 'attack' instead of a single aimed bolt.
//   3 — faster still (old "furious" tier) + a chance to chain a second charge
//       right after the first instead of going straight to the ranged volley.
//   4 — the most extreme timings + a shockwave when a charge slams into the
//       arena wall, punishing standing right next to it even if the charge
//       itself was dodged. One last, genuinely dangerous push before it dies.
const PHASE_STATS = {
  1: { patrolMult: 1, telegraphMult: 1, shotBonus: 0, shotIntervalMult: 1, vulnMult: 1, speedMult: 1, chargeChance: 0, spreadShots: 0, comboChance: 0, slam: false },
  2: { patrolMult: 0.55, telegraphMult: 0.7, shotBonus: 2, shotIntervalMult: 0.65, vulnMult: 0.7, speedMult: 1.7, chargeChance: 0.4, spreadShots: 3, comboChance: 0, slam: false },
  3: { patrolMult: 0.4, telegraphMult: 0.55, shotBonus: 4, shotIntervalMult: 0.5, vulnMult: 0.55, speedMult: 2.2, chargeChance: 0.7, spreadShots: 3, comboChance: 0.45, slam: false },
  4: { patrolMult: 0.3, telegraphMult: 0.42, shotBonus: 6, shotIntervalMult: 0.4, vulnMult: 0.42, speedMult: 2.8, chargeChance: 0.85, spreadShots: 5, comboChance: 0.6, slam: true }
};

export class Boss {
  constructor({ x, y, w = 46, h = 46, range = 60, speed = 55, health = 3, name = "L'Entità Suprema" }) {
    this.x = x; this.y = y; this.w = w; this.h = h;
    this.originX = x;
    this.range = range;
    this.speed = speed;
    this.dir = -1;
    this.maxHealth = health;
    this.health = health;
    this.alive = true;
    this.defeated = false;
    this.deathTimer = 0;
    this.name = name;

    this.state = 'patrol';
    this.stateTime = 0;
    this.shotsRemaining = 0;
    this.shotTimer = 0;
    this.wantsToFire = false;
    this.fireDir = -1;
    this.chargeDir = 1;
    this.t = 0;
    this.hurtFlash = 0;
    this.hitCooldown = 0;

    // Fires once each time the fight crosses into a new phase (see
    // PHASE_STATS above) — Game.js reads and clears it to play a roar/
    // screen-shake beat instead of the escalation happening silently.
    this.justEnraged = null; // null | 2 | 3 | 4
    this._lastPhaseSeen = 1;

    // Fires the one frame the boss enters 'vulnerable' — Game.js reads and
    // clears it to play a distinct chime/particle cue, so "you can hit it
    // now" is unmistakable even mid-chaos, not just a colour change on a
    // small on-screen shape (Round 10 fix, see attack/state machine below).
    this.justBecameVulnerable = false;

    // Phase 3+: caps the charge-combo chain at one extra charge per sequence
    // (reset the instant a fresh charge sequence starts from patrol) so it
    // stays a real hazard to read and dodge, not an endless loop.
    this.chargedComboUsed = false;

    // Phase 4 only: a one-shot AoE flag set the instant a charge slams into
    // the arena wall — Game.js consumes it, checks the player's distance,
    // and applies a hit + shockwave cue if they were standing too close.
    // null when inactive, {x, y, radius} for the one frame it fires.
    this.justSlammed = null;
  }

  get bounds() {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }

  /** Inset hit-test box for incoming damage against the player — see
   * Enemy.hurtBounds for the reasoning; the boss uses the same spiky
   * silhouette so the same margin applies. */
  get hurtBounds() {
    const insetX = this.w * 0.16;
    const insetY = this.h * 0.14;
    return { x: this.x + insetX, y: this.y + insetY, w: this.w - insetX * 2, h: this.h - insetY * 2 };
  }

  get vulnerable() {
    return this.state === 'vulnerable';
  }

  get isCharging() {
    return this.state === 'charge';
  }

  get isChargeTelegraph() {
    return this.state === 'chargeTelegraph';
  }

  /** Four escalating tiers keyed off remaining health (see PHASE_STATS
   * above for what each actually changes). Thresholds scale with maxHealth
   * so a shorter fight (the Delta miniboss's 5 health) still ramps up
   * sensibly even though it never reaches phase 4 with much room to spare:
   * phase 2 kicks in at half health, phase 3 at a quarter, phase 4 (the
   * last, most dangerous stretch) at the final eighth — always at least the
   * single last hit before defeat. */
  get currentPhase() {
    const p2 = Math.floor(this.maxHealth / 2);
    const p3 = Math.floor(this.maxHealth / 4);
    const p4 = Math.max(1, Math.floor(this.maxHealth / 8));
    if (this.health <= p4) return 4;
    if (this.health <= p3) return 3;
    if (this.health <= p2) return 2;
    return 1;
  }

  takeDamage() {
    if (!this.vulnerable || this.hitCooldown > 0) return false;
    return this._applyDamage();
  }

  /** The player's ranged shot (see Game._resolvePlayerProjectiles). Round 10
   * fix: this used to land regardless of the boss's state — patrol,
   * telegraph, even mid-attack — which let a ranged-capable player poke the
   * boss down from total safety without ever engaging the punish window at
   * all, trivializing both Il Custode del Nucleo and the final boss. Now it
   * requires the exact same `vulnerable` window a stomp does — a genuine
   * alternative to the stomp (no precise platforming needed to land it) but
   * not a way to skip the fight's actual risk/reward loop. */
  takeRangedDamage() {
    if (!this.vulnerable || this.hitCooldown > 0) return false;
    return this._applyDamage();
  }

  _applyDamage() {
    this.health -= 1;
    this.hurtFlash = 0.2;
    this.hitCooldown = 0.4;
    if (this.health <= 0) {
      this.state = 'defeated';
      this.defeated = true;
      this.alive = false;
      this.deathTimer = 0;
    } else {
      // Both damage entry points gate on `vulnerable`, so that is always the
      // state we are leaving here — the old extra checks for chargeTelegraph/
      // charge were unreachable.
      this.state = 'patrol';
      this.stateTime = 0;
    }
    const phase = this.currentPhase;
    if (phase > this._lastPhaseSeen) {
      this.justEnraged = phase;
      this._lastPhaseSeen = phase;
    }
    return true;
  }

  /** Game.js calls this once per frame after checking justEnraged, so the
   * one-shot roar/shake only fires the single frame the phase actually flips. */
  consumeEnrageFlag() {
    const v = this.justEnraged;
    this.justEnraged = null;
    return v;
  }

  /** Same one-shot pattern as consumeEnrageFlag, for the vulnerable-window cue. */
  consumeVulnerableFlag() {
    const v = this.justBecameVulnerable;
    this.justBecameVulnerable = false;
    return v;
  }

  /** Same one-shot pattern again, for the phase-4 charge-wall shockwave. */
  consumeSlamFlag() {
    const v = this.justSlammed;
    this.justSlammed = null;
    return v;
  }

  /** How many projectiles the current attack volley fires per shot "tick"
   * (see wantsToFire/Game._processEmitters) — 1 in phase 1, a real fan from
   * phase 2 on. Only meaningful while actually firing. */
  get shotSpread() {
    return Math.max(1, PHASE_STATS[this.currentPhase].spreadShots || 1);
  }

  update(dt, playerX) {
    this.t += dt;
    this.wantsToFire = false;
    if (this.hurtFlash > 0) this.hurtFlash -= dt;
    if (this.hitCooldown > 0) this.hitCooldown -= dt;

    if (this.defeated) {
      this.deathTimer += dt;
      return;
    }

    this.stateTime += dt;
    const phase = this.currentPhase;
    const stats = PHASE_STATS[phase];
    const patrolTime = PATROL_TIME * stats.patrolMult;
    const telegraphTime = TELEGRAPH_TIME * stats.telegraphMult;
    const shotCount = SHOT_COUNT + stats.shotBonus;
    const shotInterval = SHOT_INTERVAL * stats.shotIntervalMult;
    const vulnerableTime = VULNERABLE_TIME * stats.vulnMult;
    const patrolSpeed = this.speed * stats.speedMult;

    switch (this.state) {
      case 'patrol': {
        this.x += this.dir * patrolSpeed * dt;
        const traveled = this.x - this.originX;
        if (traveled > this.range) { this.x = this.originX + this.range; this.dir = -1; }
        if (traveled < -this.range) { this.x = this.originX - this.range; this.dir = 1; }
        if (this.stateTime > patrolTime) {
          this.chargedComboUsed = false; // fresh sequence — the combo may fire once
          if (phase >= 2 && Math.random() < stats.chargeChance) {
            this.state = 'chargeTelegraph';
            this.stateTime = 0;
            this.chargeDir = (playerX !== undefined && playerX < this.x) ? -1 : 1;
          } else {
            this.state = 'telegraph';
            this.stateTime = 0;
            if (playerX !== undefined) this.fireDir = playerX >= this.x ? 1 : -1;
          }
        }
        break;
      }
      case 'chargeTelegraph': {
        if (this.stateTime > CHARGE_TELEGRAPH_TIME) {
          this.state = 'charge';
          this.stateTime = 0;
        }
        break;
      }
      case 'charge': {
        this.x += this.chargeDir * this.speed * CHARGE_SPEED_MULT * dt;
        const traveled = this.x - this.originX;
        const hitWall = traveled > this.range || traveled < -this.range;
        if (hitWall) {
          this.x = clamp(this.x, this.originX - this.range, this.originX + this.range);
          // Phase 4: the impact itself is a hazard, not just the charge's
          // travel path — punishes hugging the wall to "wait out" the dash.
          if (stats.slam) {
            this.justSlammed = { x: this.x + this.w / 2, y: this.y + this.h / 2, radius: this.w * 1.6 };
          }
        }
        if (hitWall || this.stateTime > CHARGE_TIME) {
          // Phase 3+: a chance to chain straight into a second charge before
          // settling into the ranged volley — capped at one extra per
          // sequence (chargedComboUsed) so it reads as a real "flurry" beat
          // rather than an unreadable loop.
          if (!this.chargedComboUsed && Math.random() < stats.comboChance) {
            this.chargedComboUsed = true;
            this.state = 'chargeTelegraph';
            this.stateTime = 0;
            this.chargeDir = (playerX !== undefined && playerX < this.x) ? -1 : 1;
          } else {
            this.state = 'telegraph';
            this.stateTime = 0;
            if (playerX !== undefined) this.fireDir = playerX >= this.x ? 1 : -1;
          }
        }
        break;
      }
      case 'telegraph': {
        if (this.stateTime > telegraphTime) {
          this.state = 'attack';
          this.stateTime = 0;
          this.shotsRemaining = shotCount;
          this.shotTimer = 0;
        }
        break;
      }
      case 'attack': {
        this.shotTimer -= dt;
        if (this.shotsRemaining > 0 && this.shotTimer <= 0) {
          this.shotTimer = shotInterval;
          this.shotsRemaining -= 1;
          this.wantsToFire = true;
        }
        if (this.shotsRemaining <= 0 && this.shotTimer <= 0) {
          this.state = 'vulnerable';
          this.stateTime = 0;
          this.justBecameVulnerable = true;
        }
        break;
      }
      case 'vulnerable': {
        if (this.stateTime > vulnerableTime) {
          this.state = 'patrol';
          this.stateTime = 0;
        }
        break;
      }
      default:
        break;
    }
  }

  get squashT() {
    return clamp(this.deathTimer / 0.6, 0, 1);
  }
}
