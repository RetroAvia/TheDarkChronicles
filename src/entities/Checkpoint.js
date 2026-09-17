export class Checkpoint {
  constructor({ x, y, w = 28, h = 60 }) {
    this.x = x; this.y = y; this.w = w; this.h = h;
    this.activated = false;
    this.t = 0;
    // Time since activation, used to draw a one-shot expanding pulse ring;
    // stays small (never reset) once activated so the ring only ever plays once.
    this.activeTime = 0;
  }

  update(dt) {
    this.t += dt;
    if (this.activated && this.activeTime < 1) this.activeTime += dt;
  }

  get bounds() {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }
}
