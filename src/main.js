import './style/theme.css';
import './style/base.css';
import './style/animations.css';
import './style/ui.css';

import { Renderer } from './core/Renderer.js';
import { Game } from './core/Game.js';
import { GameLoop } from './core/GameLoop.js';

const canvas = document.getElementById('game-canvas');
const renderer = new Renderer(canvas);
const game = new Game(renderer);

const loop = new GameLoop({
  update: (dt) => game.update(dt),
  render: () => game.render(),
  onError: () => {
    // The loop itself now survives an exception (it reschedules before
    // running), but the player still deserves to know something went wrong
    // instead of watching the game quietly misbehave.
    const note = document.createElement('div');
    note.className = 'ra-crash-note';
    note.textContent = '⚠️ Si è verificato un problema tecnico. Se il gioco si comporta in modo strano, ricarica la pagina.';
    document.body.appendChild(note);
    setTimeout(() => note.remove(), 9000);
  }
});

loop.start();

// Dismiss the boot splash once the first frame is actually on screen, so the
// player never stares at a black rectangle while the module graph loads.
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    const splash = document.getElementById('boot-splash');
    if (!splash) return;
    splash.classList.add('is-done');
    setTimeout(() => splash.remove(), 600);
  });
});

if (import.meta.env.DEV) {
  window.__retroaviaGame = game;
}
