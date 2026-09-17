export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'class') node.className = value;
    else if (key === 'html') node.innerHTML = value;
    else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2).toLowerCase(), value);
    else if (value !== undefined && value !== null) node.setAttribute(key, value);
  }
  for (const child of [].concat(children)) {
    if (child == null) continue;
    node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return node;
}

export const root = () => document.getElementById('ui-root');

export function mount(node) {
  root().appendChild(node);
  return node;
}

/** Clears the UI root, but lets whatever was on screen fade out over a
 * couple frames instead of vanishing instantly — new content (mounted right
 * after, by every caller) fades/rises in on top per its own entrance
 * animation, so the two together read as a soft crossfade between screens. */
export function clearRoot() {
  const r = root();
  const outgoing = Array.from(r.children);
  for (const node of outgoing) {
    // The outgoing screen lingers for ~170ms so the two screens crossfade —
    // but it stayed fully interactive for that whole window, which meant a
    // quick double-tap could land on a button belonging to the screen that
    // was already on its way out. Kill input on it the instant it starts to
    // leave, and hide it from assistive tech at the same time.
    node.style.pointerEvents = 'none';
    node.setAttribute('aria-hidden', 'true');
    node.classList.add('ra-anim-fade-out-quick');
    setTimeout(() => node.remove(), 170);
  }
}

export function removeNode(node, delayMs = 0) {
  if (!node) return;
  if (delayMs <= 0) { node.remove(); return; }
  node.classList.add('ra-anim-fade-out');
  node.style.animation = `ra-fade-out ${delayMs}ms ease forwards`;
  setTimeout(() => node.remove(), delayMs);
}

/** A one-off full-screen radial flash, independent of #ui-root (so it layers
 * cleanly over both the outgoing menu and the incoming level fade rather
 * than competing with clearRoot()'s own crossfade) — used to punctuate the
 * moment a run actually begins (see Game.startGame). Removes itself; no
 * caller cleanup needed. */
export function flashScreen(className = 'ra-warp-flash', durationMs = 650) {
  const node = document.createElement('div');
  node.className = className;
  document.body.appendChild(node);
  setTimeout(() => node.remove(), durationMs);
}
