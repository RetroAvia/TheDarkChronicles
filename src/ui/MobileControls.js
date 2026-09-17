import { el } from './dom.js';

function bindPress(btn, onDown, onUp) {
  const down = (e) => { e.preventDefault(); btn.classList.add('active'); onDown(); };
  const up = (e) => { e.preventDefault(); btn.classList.remove('active'); onUp(); };
  btn.addEventListener('touchstart', down, { passive: false });
  btn.addEventListener('touchend', up, { passive: false });
  btn.addEventListener('touchcancel', up, { passive: false });
  btn.addEventListener('mousedown', down);
  btn.addEventListener('mouseup', up);
  btn.addEventListener('mouseleave', up);
}

export function MobileControls(input, hasDash = false) {
  const leftBtn = el('button', { class: 'ra-touch-btn', 'aria-label': 'Sinistra' }, '◀');
  const rightBtn = el('button', { class: 'ra-touch-btn', 'aria-label': 'Destra' }, '▶');
  const jumpBtn = el('button', { class: 'ra-touch-btn ra-touch-btn--jump', 'aria-label': 'Salta' }, '⤒');

  bindPress(leftBtn, () => input.setTouch('left', true), () => input.setTouch('left', false));
  bindPress(rightBtn, () => input.setTouch('right', true), () => input.setTouch('right', false));
  bindPress(jumpBtn, () => input.setTouch('jump', true), () => input.setTouch('jump', false));

  const rightCluster = [jumpBtn];
  if (hasDash) {
    const dashBtn = el('button', { class: 'ra-touch-btn ra-touch-btn--dash', 'aria-label': 'Scatto' }, '💨');
    bindPress(dashBtn, () => input.setTouch('dash', true), () => input.setTouch('dash', false));
    rightCluster.unshift(dashBtn);
  }
  // Ranged shot — only ever granted mid-level (the boss-arena set-piece), so
  // this starts hidden and Game.js reveals it (querying '.ra-touch-btn--shoot')
  // the moment Player.abilities.ranged actually turns on.
  const shootBtn = el('button', { class: 'ra-touch-btn ra-touch-btn--shoot', 'aria-label': 'Spara', hidden: true }, '🔫');
  bindPress(shootBtn, () => input.setTouch('shoot', true), () => input.setTouch('shoot', false));
  rightCluster.unshift(shootBtn);

  // Plasma blade — a base weapon from level 1 onward (Game._applyClassBonuses
  // grants it unconditionally), so unlike shoot it's visible from the start.
  const attackBtn = el('button', { class: 'ra-touch-btn ra-touch-btn--melee', 'aria-label': 'Lama' }, '⚔️');
  bindPress(attackBtn, () => input.setTouch('attack', true), () => input.setTouch('attack', false));
  rightCluster.unshift(attackBtn);

  return el('div', { class: 'ra-mobile-controls' }, [
    el('div', { class: 'ra-touch-pad' }, [leftBtn, rightBtn]),
    el('div', { class: 'ra-touch-pad ra-touch-pad--right' }, rightCluster)
  ]);
}

export function TutorialHint(abilities = {}) {
  const items = [
    el('span', {}, [el('kbd', {}, '◄'), el('kbd', {}, '►'), ' muovi']),
    el('span', {}, [el('kbd', {}, 'SPAZIO'), abilities.doubleJump ? ' salta / doppio salto' : ' salta'])
  ];
  items.push(el('span', {}, [el('kbd', {}, 'E'), ' lama']));
  if (abilities.dash) items.push(el('span', {}, [el('kbd', {}, 'MAIUSC'), ' scatto']));
  // Only ever true at beginPlaying() time for the tiratore class (permanent
  // ranged from level 1, see Game._applyClassBonuses) or the tutorial (full
  // kit from the start) — previously this hint never mentioned the shoot key
  // at all, even when the ability was already active.
  if (abilities.ranged) items.push(el('span', {}, [el('kbd', {}, 'F'), ' spara']));
  items.push(el('span', {}, [el('kbd', {}, 'ESC'), ' pausa']));
  return el('div', { class: 'ra-tutorial' }, items);
}
