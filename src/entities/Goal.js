export class Goal {
  constructor({ x, y }) {
    this.x = x; this.y = y;
    this.w = 40; this.h = 70;
    this.t = 0;
  }

  update(dt) {
    this.t += dt;
  }
}
