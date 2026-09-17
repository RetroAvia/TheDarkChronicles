// Environmental hazards. 'spikes' are always dangerous (a static obstacle you
// must jump/dash over). 'laser' toggles on a timer with a brief warning
// blink before it switches on, so every hit is something the player could
// have seen coming.

export class Hazard {
  constructor({ x, y, w, h, type = 'spikes', cycle = 2.4, activeRatio = 0.55, phase = 0 }) {
    this.x = x; this.y = y; this.w = w; this.h = h;
    this.type = type;
    this.cycle = cycle;
    this.activeRatio = activeRatio;
    this.t = phase;
  }

  update(dt) {
    if (this.type === 'laser') this.t += dt;
  }

  get active() {
    if (this.type === 'spikes') return true;
    const local = this.t % this.cycle;
    return local < this.cycle * this.activeRatio;
  }

  get telegraph() {
    if (this.type !== 'laser') return false;
    const warn = 0.35;
    const local = this.t % this.cycle;
    return local >= this.cycle - warn;
  }

  get bounds() {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }

  /** Inset hit-test box used for damage. Spikes are drawn as a row of
   * triangular teeth with empty notches between them and a bare sliver at
   * each end — the full rectangle claims those empty corners too, which
   * reads as an unfair hit when the player only grazes the very edge.
   * The laser gate is a solid beam with no such gaps, so it keeps the full
   * rectangle (already softened by its telegraph blink before switching on). */
  get hurtBounds() {
    if (this.type !== 'spikes') return this.bounds;
    const insetX = this.w * 0.12;
    const insetY = this.h * 0.3; // teeth taper to a point near the top
    return { x: this.x + insetX, y: this.y + insetY, w: this.w - insetX * 2, h: this.h - insetY };
  }
}
