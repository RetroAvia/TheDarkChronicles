export class Collectible {
  constructor({ x, y }) {
    this.x = x; this.y = y;
    this.w = 20; this.h = 20;
    this.collected = false;
    this.bobPhase = Math.random() * Math.PI * 2;
    this.spin = 0;
  }

  update(dt) {
    this.bobPhase += dt * 2.4;
    this.spin += dt * 1.6;
  }

  get renderY() {
    return this.y + Math.sin(this.bobPhase) * 5;
  }
}
