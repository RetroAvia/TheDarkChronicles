import { el } from './dom.js';

export class HUD {
  constructor({ maxEnergy, onPause }) {
    this.energyOrbs = Array.from({ length: maxEnergy }, () => el('div', { class: 'ra-energy-orb' }));
    this.crystalLabel = el('span', {}, '0/0');
    this.levelLabel = el('span', { class: 'ra-hud-level' }, '');
    this.scoreLabel = el('span', { class: 'ra-hud-score' }, '0');

    this.node = el('div', { class: 'ra-hud' }, [
      el('div', { class: 'ra-hud-group' }, [
        el('div', { class: 'ra-hud-energy' }, this.energyOrbs),
        this.levelLabel
      ]),
      el('div', { class: 'ra-hud-group ra-hud-crystals' }, [
        '💎', this.crystalLabel,
        el('span', { class: 'ra-hud-sep', 'aria-hidden': 'true' }, '·'),
        this.scoreLabel
      ]),
      el('button', { class: 'ra-hud-pause', onclick: onPause, 'aria-label': 'Pausa' }, '⏸')
    ]);

    this._last = { energy: -1, crystals: '', level: '', score: -1 };
  }

  /** Re-triggers a CSS animation on `node` by removing then re-adding the
   * class on the next frame (a class that's already present won't restart
   * its animation just by being "set" again). */
  static _pop(node, cls) {
    node.classList.remove(cls);
    // eslint-disable-next-line no-unused-expressions
    void node.offsetWidth; // force reflow so the browser forgets the animation ran
    node.classList.add(cls);
  }

  update({ energy, maxEnergy, crystals, total, levelName, score }) {
    if (energy !== this._last.energy) {
      const lost = this._last.energy >= 0 && energy < this._last.energy;
      this.energyOrbs.forEach((orb, i) => orb.classList.toggle('empty', i >= energy));
      if (lost) HUD._pop(this.node, 'ra-anim-energy-shake');
      this._last.energy = energy;
    }
    const crystalText = `${crystals}/${total}`;
    if (crystalText !== this._last.crystals) {
      const gained = this._last.crystals !== '' && crystals > Number(this._last.crystals.split('/')[0] || 0);
      this.crystalLabel.textContent = crystalText;
      if (gained) HUD._pop(this.crystalLabel, 'ra-anim-value-pop');
      this._last.crystals = crystalText;
    }
    if (levelName !== this._last.level) {
      this.levelLabel.textContent = levelName;
      this._last.level = levelName;
    }
    if (score !== this._last.score) {
      const gained = this._last.score >= 0 && score > this._last.score;
      this.scoreLabel.textContent = score.toLocaleString('it-IT');
      if (gained) HUD._pop(this.scoreLabel, 'ra-anim-value-pop');
      this._last.score = score;
    }
  }
}
