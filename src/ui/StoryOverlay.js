import { el } from './dom.js';

const CHARS_PER_SEC = 55;

export function StoryOverlay({ story, onContinue }) {
  const textNode = el('span', {});
  const caret = el('span', { class: 'ra-caret' }, '▌');
  const textWrap = el('p', { class: 'ra-story-text' }, [textNode, caret]);

  const actionBtn = el('button', { class: 'ra-btn ra-btn--primary', style: 'opacity:0;pointer-events:none;' }, story.actionText);

  let full = story.text;
  let i = 0;
  let done = false;
  let raf = null;
  let last = performance.now();
  let acc = 0;

  function finish() {
    done = true;
    textNode.textContent = full;
    caret.style.display = 'none';
    actionBtn.style.opacity = '1';
    actionBtn.style.pointerEvents = 'auto';
    if (raf) cancelAnimationFrame(raf);
  }

  function tick(now) {
    if (done) return;
    // Defensive: if this overlay is ever torn down some other way than
    // finish()/onContinue (both of which already cancel raf), stop the loop
    // instead of ticking a detached node forever.
    if (!node.isConnected) return;
    const dt = (now - last) / 1000;
    last = now;
    acc += dt * CHARS_PER_SEC;
    while (acc >= 1 && i < full.length) {
      i++; acc -= 1;
    }
    textNode.textContent = full.slice(0, i);
    if (i >= full.length) { finish(); return; }
    raf = requestAnimationFrame(tick);
  }
  raf = requestAnimationFrame(tick);

  actionBtn.addEventListener('click', onContinue);

  const skipBtn = el('button', { class: 'ra-story-skip', onclick: () => { if (done) onContinue(); else finish(); } }, 'Salta ›');

  const inner = el('div', { class: 'ra-story-inner' }, [
    el('h2', { class: 'ra-story-title' }, story.title),
    textWrap,
    el('div', { class: 'ra-story-actions' }, [actionBtn])
  ]);

  const node = el('div', { class: 'ra-story' }, [skipBtn, inner]);
  node.addEventListener('click', (e) => {
    if (e.target === node && !done) finish();
  });

  return node;
}
