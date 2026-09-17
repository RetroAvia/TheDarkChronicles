import { randRange } from '../utils/math.js';
import { GFX } from './quality.js';

const MAX_PARTICLES = 420;
// Dropping one particle per spawn with shift() re-indexes the whole array
// every single time the cap is hit — exactly when the system is already
// under load. Trimming a block at a time amortises that to ~1/32 as often.
const TRIM_BLOCK = 32;

export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  /** Burst sizes scale with the quality tier (see core/quality.js), so the
   * low tier thins every effect instead of only killing the glow. */
  _count(n) {
    return Math.max(1, Math.round(n * GFX.particles));
  }

  _spawn(p) {
    if (this.particles.length >= MAX_PARTICLES) this.particles.splice(0, TRIM_BLOCK);
    this.particles.push(p);
  }

  emit(preset, x, y, opts = {}) {
    switch (preset) {
      case 'dust':
        for (let i = 0; i < this._count(4); i++) {
          this._spawn({
            x: x + randRange(-4, 4), y: y + randRange(-2, 2),
            vx: randRange(-30, 30) * (opts.dir || 1), vy: randRange(-40, -10),
            life: 0, maxLife: randRange(0.25, 0.45), size: randRange(2, 4),
            color: 'rgba(255,255,255,0.5)', gravity: 260, shape: 'circle'
          });
        }
        break;
      case 'jump':
        for (let i = 0; i < this._count(8); i++) {
          this._spawn({
            x, y, vx: randRange(-60, 60), vy: randRange(10, 60),
            life: 0, maxLife: randRange(0.3, 0.5), size: randRange(2, 4),
            color: opts.color || 'rgba(0,212,255,0.7)', gravity: 200, shape: 'circle'
          });
        }
        break;
      case 'sparkle':
        for (let i = 0; i < this._count(14); i++) {
          const a = randRange(0, Math.PI * 2);
          const speed = randRange(60, 180);
          this._spawn({
            x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
            life: 0, maxLife: randRange(0.35, 0.7), size: randRange(2, 5),
            color: opts.color || 'rgba(0,255,136,0.9)', gravity: 40, shape: 'star'
          });
        }
        break;
      case 'explosion':
        for (let i = 0; i < this._count(26); i++) {
          const a = randRange(0, Math.PI * 2);
          const speed = randRange(80, 320);
          this._spawn({
            x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
            life: 0, maxLife: randRange(0.4, 0.9), size: randRange(2, 6),
            color: opts.color || 'rgba(255,59,59,0.85)', gravity: 160, shape: 'circle'
          });
        }
        break;
      case 'portal':
        for (let i = 0; i < this._count(3); i++) {
          const a = randRange(0, Math.PI * 2);
          const r = randRange(10, 34);
          this._spawn({
            x: x + Math.cos(a) * r, y: y + Math.sin(a) * r,
            vx: -Math.cos(a) * 30, vy: -Math.sin(a) * 30 - 20,
            life: 0, maxLife: randRange(0.5, 0.9), size: randRange(2, 4),
            color: opts.color || 'rgba(139,92,246,0.8)', gravity: -20, shape: 'circle'
          });
        }
        break;
      case 'vortexIn':
        // Sucked toward a fixed target point rather than flying free —
        // update() gives these an accelerating pull instead of gravity.
        this._spawn({
          x, y, vx: 0, vy: 0,
          targetX: opts.targetX, targetY: opts.targetY,
          life: 0, maxLife: randRange(0.5, 0.85), size: randRange(2, 5),
          color: opts.color || 'rgba(139,92,246,0.85)', gravity: 0, shape: opts.shape || 'circle',
          vortex: true
        });
        break;
      case 'ember':
        // Slow drifting embers for the boss-arena atmosphere — rises gently
        // and fades, unlike every other preset which falls.
        this._spawn({
          x, y, vx: randRange(-8, 8), vy: randRange(-30, -14),
          life: 0, maxLife: randRange(1.6, 2.6), size: randRange(1.5, 3),
          color: opts.color || 'rgba(255,110,70,0.5)', gravity: -6, shape: 'circle'
        });
        break;
      case 'hit':
        for (let i = 0; i < this._count(10); i++) {
          const a = randRange(0, Math.PI * 2);
          this._spawn({
            x, y, vx: Math.cos(a) * randRange(40, 140), vy: Math.sin(a) * randRange(40, 140),
            life: 0, maxLife: randRange(0.25, 0.4), size: randRange(2, 4),
            color: 'rgba(255,107,53,0.85)', gravity: 120, shape: 'circle'
          });
        }
        break;
      case 'slash':
        // Biased into a forward cone (opts.dir: ±1) instead of a full burst —
        // reads as a quick directional swing rather than an omnidirectional pop.
        for (let i = 0; i < this._count(10); i++) {
          const baseAngle = opts.dir > 0 ? 0 : Math.PI;
          const a = baseAngle + randRange(-0.5, 0.5);
          const speed = randRange(120, 260);
          this._spawn({
            x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed - 30,
            life: 0, maxLife: randRange(0.15, 0.3), size: randRange(2, 4),
            color: opts.color || 'rgba(120,220,255,0.9)', gravity: 200, shape: 'star'
          });
        }
        break;
      default:
        break;
    }
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) { this.particles.splice(i, 1); continue; }
      if (p.vortex) {
        // Accelerating pull toward a fixed point — the "sucked into the
        // black hole" motion, distinct from the free-flight gravity below.
        const dx = p.targetX - p.x, dy = p.targetY - p.y;
        const dist = Math.max(1, Math.hypot(dx, dy));
        const t = p.life / p.maxLife;
        const speed = 160 + t * 520;
        p.x += (dx / dist) * speed * dt;
        p.y += (dy / dist) * speed * dt;
      } else {
        p.vy += p.gravity * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }
    }
  }

  render(ctx, camX) {
    for (const p of this.particles) {
      const t = p.life / p.maxLife;
      const alpha = 1 - t;
      const size = p.size * (1 - t * 0.5);
      ctx.globalAlpha = Math.max(alpha, 0);
      ctx.fillStyle = p.color;
      const sx = p.x - camX;
      if (p.shape === 'star') {
        drawStar(ctx, sx, p.y, size);
      } else {
        ctx.beginPath();
        ctx.arc(sx, p.y, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  clear() {
    this.particles.length = 0;
  }
}

function drawStar(ctx, x, y, r) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {   // 4 spokes of the star glyph, not a count
    ctx.rotate(Math.PI / 2);
    ctx.moveTo(0, 0);
    ctx.lineTo(r, 0);
  }
  ctx.strokeStyle = ctx.fillStyle;
  ctx.lineWidth = Math.max(r * 0.35, 0.6);
  ctx.stroke();
  ctx.restore();
}
