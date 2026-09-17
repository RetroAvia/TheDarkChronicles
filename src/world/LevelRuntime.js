import { Platform } from '../entities/Platform.js';
import { Collectible } from '../entities/Collectible.js';
import { Enemy } from '../entities/Enemy.js';
import { Boss } from '../entities/Boss.js';
import { Goal } from '../entities/Goal.js';
import { Hazard } from '../entities/Hazard.js';
import { Checkpoint } from '../entities/Checkpoint.js';
import { getLevel } from './levels.js';

// Framing padding around a level's real content box (see `viewBounds`).
// Top gets more room than the bottom because the player jumps upward: a
// double jump clears ~180px, and the camera should not have to scramble to
// keep up with a perfectly ordinary hop.
const PAD_TOP = 190;
const PAD_BOTTOM = 80;
// How far below the content the player has to fall before it counts as a
// void fall. Per level, rather than a single global constant, so a level
// whose floor sits high doesn't need a pointless extra second of falling.
const VOID_DROP = 210;

function boundsOf(platforms, extras = []) {
  let top = Infinity;
  let bottom = -Infinity;
  let right = 0;
  for (const p of platforms) {
    top = Math.min(top, p.y);
    bottom = Math.max(bottom, p.y + p.h);
    right = Math.max(right, p.x + p.w);
  }
  for (const e of extras) {
    if (!e) continue;
    top = Math.min(top, e.y ?? Infinity);
    bottom = Math.max(bottom, (e.y ?? -Infinity) + (e.h ?? 0));
    right = Math.max(right, (e.x ?? 0) + (e.w ?? 0));
  }
  if (!Number.isFinite(top)) { top = 0; bottom = 575; }
  return {
    worldW: right + 220,
    top: top - PAD_TOP,
    bottom: bottom + PAD_BOTTOM,
    voidY: bottom + VOID_DROP
  };
}

export class LevelRuntime {
  constructor(levelIndex) {
    this.data = getLevel(levelIndex);
    this._platforms = this.data.platforms.map((p) => new Platform(p));
    this.collectibles = this.data.collectibles.map((c) => new Collectible(c));
    this.enemies = (this.data.enemies || []).filter((e) => e.type !== 'boss').map((e) => new Enemy(e));
    this._hazards = (this.data.hazards || []).map((h) => new Hazard(h));
    this.checkpoints = (this.data.checkpoints || []).map((c) => new Checkpoint(c));
    this.projectiles = [];
    this._goal = new Goal(this.data.goal);

    const bossData = (this.data.enemies || []).find((e) => e.type === 'boss');
    this._boss = bossData ? new Boss(bossData) : null;

    // Content box of the main dimension, used both for camera framing and for
    // the void-fall threshold (see Game._handleVoidFall).
    this._bounds = boundsOf(this.data.platforms, [
      ...this.data.collectibles.map((c) => ({ ...c, w: 20, h: 20 })),
      { ...this.data.goal, w: 40, h: 70 },
      ...(this.data.signs || []).map((s) => ({ x: s.x - 110, y: s.y - 120, w: 220, h: 120 }))
    ]);
    this._worldWidth = this._bounds.worldW;

    // A genuinely separate boss-arena "room", entered through the black-hole
    // portal (Game.js _startBossPortal/_updatePortal). Its platforms/hazards/
    // goal/boss live in their own coordinate space (see levels.js) and are
    // swapped in wholesale via the getters below once `inBossArena` flips.
    const arena = this.data.bossArena;
    if (arena && arena.platforms) {
      this.arenaPlatforms = arena.platforms.map((p) => new Platform(p));
      this.arenaHazards = (arena.hazards || []).map((h) => new Hazard(h));
      this.arenaGoal = new Goal(arena.goal);
      this.arenaBoss = arena.boss ? new Boss(arena.boss) : null;
      // The arena's side walls run from y:0 to the floor, so using them for
      // the framing box would reintroduce the dead sky the camera rework
      // exists to remove. Frame on the playable floor/ledges instead.
      const framing = arena.platforms.filter((p) => p.h < 200);
      this._arenaBounds = boundsOf(framing.length ? framing : arena.platforms, [
        arena.boss ? { ...arena.boss } : null,
        { ...arena.goal, w: 40, h: 70 }
      ]);
      this._arenaBounds.worldW = Math.max(...arena.platforms.map((p) => p.x + p.w)) + 220;
      this.arenaWorldWidth = this._arenaBounds.worldW;
    } else {
      this.arenaPlatforms = null;
      this.arenaHazards = null;
      this.arenaGoal = null;
      this.arenaBoss = null;
      this.arenaWorldWidth = 0;
      this._arenaBounds = null;
    }
    this.inBossArena = false;
  }

  get platforms() {
    return this.inBossArena && this.arenaPlatforms ? this.arenaPlatforms : this._platforms;
  }

  get hazards() {
    return this.inBossArena && this.arenaHazards ? this.arenaHazards : this._hazards;
  }

  get goal() {
    return this.inBossArena && this.arenaGoal ? this.arenaGoal : this._goal;
  }

  get boss() {
    return this.inBossArena && this.arenaPlatforms ? this.arenaBoss : this._boss;
  }

  get worldWidth() {
    return this.inBossArena && this.arenaPlatforms ? this.arenaWorldWidth : this._worldWidth;
  }

  /** { worldW, top, bottom, voidY } for whichever room the player is in. */
  get viewBounds() {
    return this.inBossArena && this._arenaBounds ? this._arenaBounds : this._bounds;
  }

  get voidY() {
    return this.viewBounds.voidY;
  }

  get totalCrystals() {
    return this.collectibles.length;
  }

  get collectedCrystals() {
    return this.collectibles.filter((c) => c.collected).length;
  }

  get allCollected() {
    return this.collectedCrystals === this.totalCrystals;
  }

  get bossCleared() {
    const boss = this.boss;
    return !boss || boss.defeated;
  }

  addProjectile(projectile) {
    this.projectiles.push(projectile);
  }

  /** Restores every crumbling platform to its pristine state. Called whenever
   * the player respawns at a checkpoint without a full level reload, so an
   * already-crumbled platform can never permanently strand a checkpoint. */
  resetCrumblingPlatforms() {
    for (const p of this._platforms) p.reset();
    if (this.arenaPlatforms) for (const p of this.arenaPlatforms) p.reset();
  }

  /** Projectiles used to ignore level geometry entirely: turret bolts flew
   * through floors (reading as a cheap, unavoidable hit) and the player's
   * ranged shot could hit the final boss straight through the arena wall.
   * A bolt now dies where it hits something solid, with its impact point
   * reported back so Game can spark it. */
  _collideProjectiles() {
    const impacts = [];
    for (const p of this.projectiles) {
      if (p.dead) continue;
      const b = p.bounds;
      for (const pl of this.platforms) {
        if (pl.gone) continue;
        if (b.x < pl.x + pl.w && b.x + b.w > pl.x && b.y < pl.y + pl.h && b.y + b.h > pl.y) {
          p.dead = true;
          impacts.push({ x: p.x, y: p.y, color: p.color });
          break;
        }
      }
    }
    return impacts;
  }

  update(dt, playerX, playerY) {
    for (const p of this.platforms) p.update(dt);
    for (const c of this.collectibles) c.update(dt);
    for (const e of this.enemies) e.update(dt, playerX, playerY);
    for (const h of this.hazards) h.update(dt);
    for (const cp of this.checkpoints) cp.update(dt);
    if (this.boss) this.boss.update(dt, playerX);
    this.goal.update(dt);

    for (const p of this.projectiles) p.update(dt);
    const impacts = this._collideProjectiles();
    this.projectiles = this.projectiles.filter((p) => !p.dead);
    return impacts;
  }
}
