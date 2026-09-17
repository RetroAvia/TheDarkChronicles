const KEY_MAP = {
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  jump: ['Space', 'ArrowUp', 'KeyW'],
  dash: ['ShiftLeft', 'ShiftRight', 'KeyK'],
  // Ranged shot — only usable once Player.abilities.ranged is unlocked
  // (the boss-arena set-piece in the final level), but the key is always
  // listened for so the ability can light up the moment it's granted.
  shoot: ['KeyF', 'KeyJ'],
  // Plasma-blade melee swing — a base weapon granted from level 1 onward
  // (see Game._applyClassBonuses), unlike shoot/dash which unlock later.
  attack: ['KeyE', 'KeyL'],
  pause: ['Escape', 'KeyP']
};

export class InputManager {
  constructor() {
    this.state = { left: false, right: false, jump: false, dash: false, shoot: false, attack: false, pause: false };
    this._jumpEdge = false;
    this._dashEdge = false;
    this._shootEdge = false;
    this._attackEdge = false;
    this._pauseEdge = false;
    this._down = new Set();

    // The listeners live on `window`, so without this guard the blanket
    // preventDefault below also swallowed SPACE and the arrow keys while the
    // player was typing their hero name in the menu — a space was literally
    // impossible to type, and the arrows couldn't move the caret.
    this._isTextTarget = (e) => {
      const t = e.target;
      if (!t) return false;
      const tag = t.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || t.isContentEditable === true;
    };

    this._onKeyDown = (e) => {
      if (this._isTextTarget(e)) return;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
      if (this._down.has(e.code)) return;
      this._down.add(e.code);
      this._applyKey(e.code, true);
    };
    this._onKeyUp = (e) => {
      if (this._isTextTarget(e)) return;
      this._down.delete(e.code);
      this._applyKey(e.code, false);
    };
    this._onBlur = () => this.reset();

    window.addEventListener('keydown', this._onKeyDown, { passive: false });
    window.addEventListener('keyup', this._onKeyUp);
    window.addEventListener('blur', this._onBlur);

    this.onPause = null;
  }

  _applyKey(code, isDown) {
    for (const action of Object.keys(KEY_MAP)) {
      if (KEY_MAP[action].includes(code)) {
        if (action === 'jump' && isDown && !this.state.jump) this._jumpEdge = true;
        if (action === 'dash' && isDown && !this.state.dash) this._dashEdge = true;
        if (action === 'shoot' && isDown && !this.state.shoot) this._shootEdge = true;
        if (action === 'attack' && isDown && !this.state.attack) this._attackEdge = true;
        if (action === 'pause' && isDown && !this.state.pause) this._pauseEdge = true;
        this.state[action] = isDown;
      }
    }
  }

  // --- touch bridge, called by MobileControls ---
  setTouch(action, isDown) {
    if (action === 'jump' && isDown && !this.state.jump) this._jumpEdge = true;
    if (action === 'dash' && isDown && !this.state.dash) this._dashEdge = true;
    if (action === 'shoot' && isDown && !this.state.shoot) this._shootEdge = true;
    if (action === 'attack' && isDown && !this.state.attack) this._attackEdge = true;
    this.state[action] = isDown;
  }

  consumeJumpPressed() {
    const v = this._jumpEdge;
    this._jumpEdge = false;
    return v;
  }

  consumeDashPressed() {
    const v = this._dashEdge;
    this._dashEdge = false;
    return v;
  }

  consumeShootPressed() {
    const v = this._shootEdge;
    this._shootEdge = false;
    return v;
  }

  consumeAttackPressed() {
    const v = this._attackEdge;
    this._attackEdge = false;
    return v;
  }

  consumePausePressed() {
    const v = this._pauseEdge;
    this._pauseEdge = false;
    return v;
  }

  reset() {
    this.state.left = this.state.right = this.state.jump = this.state.dash = this.state.shoot = this.state.attack = false;
    this._down.clear();
  }

  destroy() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    window.removeEventListener('blur', this._onBlur);
  }
}
