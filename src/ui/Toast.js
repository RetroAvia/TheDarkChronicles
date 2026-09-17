import { el, mount } from './dom.js';

let activeTimer = null;

/** Transient in-game message. Also mirrored into #ui-announcer, the one
 * element in the page that carries aria-live — the whole UI root used to,
 * which made screen readers re-read every menu and every page of story text
 * on each transition. */
export function showToast(message, duration = 2200) {
  const existing = document.querySelector('.ra-toast');
  if (existing) existing.remove();
  if (activeTimer) clearTimeout(activeTimer);

  const node = el('div', { class: 'ra-toast' }, message);
  mount(node);

  const announcer = document.getElementById('ui-announcer');
  if (announcer) announcer.textContent = message;

  activeTimer = setTimeout(() => {
    node.remove();
    if (announcer && announcer.textContent === message) announcer.textContent = '';
  }, duration);
}
