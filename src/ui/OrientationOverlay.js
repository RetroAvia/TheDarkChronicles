import { el } from './dom.js';

/** Shown on touch devices held upright. A side-scrolling platformer needs
 * horizontal room: in portrait the visible slice of the world is roughly a
 * third of what the level design assumes, so the game asks for a rotation
 * first — and lets the player refuse, because a blocked screen with no way
 * out is worse than a cramped one.
 *
 * Mounted directly on <body>, not in #ui-root, so screen transitions
 * (clearRoot) can never wipe it while it is still relevant. */
export function OrientationOverlay({ onDismiss }) {
  const phone = el('div', { class: 'ra-rotate-phone' }, [
    el('div', { class: 'ra-rotate-phone-screen' })
  ]);

  return el('div', { class: 'ra-rotate' }, [
    el('div', { class: 'ra-rotate-inner' }, [
      phone,
      el('h2', { class: 'ra-rotate-title' }, 'Ruota il dispositivo'),
      el('p', { class: 'ra-rotate-text' },
        'The Dark Chronicles si gioca in orizzontale: avrai tre volte più campo visivo e i comandi non copriranno la scena.'),
      el('button', {
        class: 'ra-btn ra-btn--ghost ra-rotate-dismiss',
        onclick: onDismiss
      }, 'Gioca comunque in verticale')
    ])
  ]);
}
