const MAX_DT = 1 / 20; // clamp huge deltas (tab switches, breakpoints) to keep physics stable

export class GameLoop {
  constructor({ update, render, onError }) {
    this.update = update;
    this.render = render;
    this.onError = onError || null;
    this._running = false;
    this._raf = null;
    this._last = 0;
    this._errorCount = 0;

    this._tick = this._tick.bind(this);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this._last = 0; // avoid a giant dt spike on return
    });
  }

  start() {
    if (this._running) return;
    this._running = true;
    this._last = 0;
    this._raf = requestAnimationFrame(this._tick);
  }

  stop() {
    this._running = false;
    if (this._raf) cancelAnimationFrame(this._raf);
  }

  _tick(now) {
    if (!this._running) return;

    // Reschedule FIRST. Previously the next frame was requested only after
    // update() and render() had both returned, so a single thrown exception
    // anywhere in the game permanently froze the canvas with no message and
    // no recovery — the worst possible failure mode in production.
    this._raf = requestAnimationFrame(this._tick);

    if (!this._last) this._last = now;
    let dt = (now - this._last) / 1000;
    this._last = now;
    dt = Math.min(dt, MAX_DT);

    try {
      this.update(dt);
      this.render();
    } catch (err) {
      this._errorCount += 1;
      // Log once with detail, then stay quiet: a bug that fires every frame
      // must not also drown the console (or the user's battery) in noise.
      if (this._errorCount === 1) {
        console.error('[RetroAvia] errore nel game loop:', err);
        this.onError?.(err);
      }
      if (this._errorCount > 600) this.stop(); // ~10s of solid failure: give up cleanly
    }
  }
}
