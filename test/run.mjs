import { installGlobals, calls, canvas, uiRoot, VIEWPORT, document as doc, window as win } from './harness.mjs';
installGlobals();

const { Renderer } = await import('../src/core/Renderer.js');
const { Game } = await import('../src/core/Game.js');
const { LEVELS } = await import('../src/world/levels.js');
const { GFX } = await import('../src/core/quality.js');

let failures = 0;
const log = [];
function check(name, cond, detail = '') {
  if (cond) { log.push(`  ✓ ${name}`); }
  else { failures++; log.push(`  ✗ ${name} ${detail}`); }
}
function section(t) { log.push(`\n── ${t}`); }

const renderer = new Renderer(canvas);
const game = new Game(renderer);

function frames(n, dt = 1 / 60) {
  for (let i = 0; i < n; i++) { game.update(dt); game.render(); }
}
function press(k, on) { game.input.state[k] = on; }
function tapJump() { game.input._jumpEdge = true; }

// ---------------------------------------------------------------- boot
section('Avvio e menu');
check('il renderer calcola una scala finita', Number.isFinite(renderer.scale) && renderer.scale > 0, `scale=${renderer.scale}`);
check('la finestra mostra almeno 900 unità di mondo', renderer.viewW >= 900, `viewW=${renderer.viewW.toFixed(0)}`);
check('lo stato iniziale è il menu', game.state === 'menu');
frames(30);
check('il menu renderizza senza eccezioni', calls.ctx > 0);
check('nessuna coordinata NaN nel menu', calls.nan.length === 0, calls.nan.slice(0, 3).join(' | '));
check('il menu non disegna un livello residuo', game.level === null);

// il campo nome accetta uno spazio (la preventDefault non deve colpire gli input)
const nameInput = uiRoot.querySelector('INPUT');
check('il campo nome esiste', !!nameInput);
let defaultPrevented = false;
win.dispatch('keydown', { code: 'Space', target: nameInput, preventDefault: () => { defaultPrevented = true; } });
check('SPAZIO non è bloccato nel campo nome', !defaultPrevented);
defaultPrevented = false;
win.dispatch('keydown', { code: 'Space', target: doc.body, preventDefault: () => { defaultPrevented = true; } });
check('SPAZIO è bloccato durante il gioco', defaultPrevented);

// ---------------------------------------------------------------- tutorial
section('Tutorial giocabile');
calls.nan.length = 0;
game.startTutorial();
frames(120);
check('il tutorial parte', game.currentLevelIndex === 0 && game.state === 'playing');
check('il tutorial concede tutte le abilità', game.player.abilities.dash && game.player.abilities.ranged && game.player.abilities.melee);
check('nessun NaN nel tutorial', calls.nan.length === 0, calls.nan.slice(0, 3).join(' | '));
check('camera finita nel tutorial', Number.isFinite(game.camera.x) && Number.isFinite(game.camera.y));
check('il tutorial non tocca i progressi salvati', game.save.data.bestLevel === 1);

// ---------------------------------------------------------- ogni livello
section('Tutti gli 8 livelli: 400 frame ciascuno con input casuali');
for (const lvl of LEVELS) {
  calls.nan.length = 0;
  game.save.data.bestLevel = lvl.id;
  game.startGame('Test Hero', 'guardiano', lvl.id);
  // salta la storia introduttiva
  game.beginPlaying();
  let minCamY = Infinity, maxCamY = -Infinity, ok = true, err = null;
  try {
    for (let i = 0; i < 400; i++) {
      press('right', i % 90 < 60);
      press('left', i % 90 >= 80);
      if (i % 37 === 0) tapJump();
      if (i % 53 === 0) game.input._dashEdge = true;
      if (i % 29 === 0) game.input._attackEdge = true;
      if (i % 61 === 0) game.input._shootEdge = true;
      game.update(1 / 60);
      game.render();
      minCamY = Math.min(minCamY, game.camera.y);
      maxCamY = Math.max(maxCamY, game.camera.y);
    }
  } catch (e) { ok = false; err = e; }
  const b = game.level.viewBounds;
  check(`L${lvl.id} ${lvl.name}: nessuna eccezione`, ok, err ? `${err.message}\n${(err.stack || '').split('\n')[1]}` : '');
  check(`L${lvl.id}: nessun NaN disegnato`, calls.nan.length === 0, calls.nan.slice(0, 2).join(' | '));
  check(`L${lvl.id}: camera entro i limiti del livello`,
    minCamY >= b.top - 60 && maxCamY <= Math.max(b.top, b.bottom - renderer.viewH) + 60,
    `camY ${minCamY.toFixed(0)}..${maxCamY.toFixed(0)} vs [${b.top.toFixed(0)}, ${(b.bottom - renderer.viewH).toFixed(0)}]`);
  check(`L${lvl.id}: il giocatore resta in scena`,
    game.player.x >= -50 && Number.isFinite(game.player.x) && Number.isFinite(game.player.y));
  press('right', false); press('left', false);
}

// -------------------------------------------------- proiettili vs geometria
section('I proiettili si fermano sulla geometria');
game.save.data.bestLevel = 8;
game.startGame('Test Hero', 'tiratore', 7);
game.beginPlaying();
const { Projectile } = await import('../src/entities/Projectile.js');
const plat = game.level.platforms[2];
game.level.addProjectile(new Projectile({
  x: plat.x + plat.w / 2, y: plat.y - 30, vx: 0, vy: 400, color: '#fff'
}));
const before = game.level.projectiles.length;
frames(20);
check('un colpo lanciato contro una piattaforma viene assorbito',
  game.level.projectiles.length < before || game.level.projectiles.every((p) => p.y < plat.y + plat.h),
  `rimasti ${game.level.projectiles.length}`);

// --------------------------------------------------------- arena del boss
section('Portale e arena del boss (Omega)');
calls.nan.length = 0;
game.save.data.bestLevel = 8;
game.startGame('Test Hero', 'acrobata', 8);
game.beginPlaying();
game.player.x = game.level.data.bossArena.triggerX + 5;
frames(150);
check('il portale trasporta nell\'arena', game.level.inBossArena === true, `stato=${game.state}`);
check('la barra del boss è montata', !!game.bossBar);
check('il boss dell\'arena esiste', !!game.level.boss && game.level.boss.maxHealth === 8);
check('il fuoco a distanza è concesso nell\'arena', game.player.abilities.ranged === true);
check('il punto di respawn è dentro l\'arena', game.respawnPoint.x > 5000);
check('nessun NaN nell\'arena', calls.nan.length === 0, calls.nan.slice(0, 2).join(' | '));

// abbatti il boss e verifica la sequenza finale
const boss = game.level.boss;
for (let i = 0; i < 4000 && boss.alive; i++) {
  boss.state = 'vulnerable';
  boss.hitCooldown = 0;
  boss.takeDamage();
  game.update(1 / 60);
}
check('il boss può essere sconfitto', boss.defeated === true, `hp=${boss.health}`);
check('il traguardo dell\'arena si sblocca', game.level.bossCleared === true);

// --------------------------------------------------------------- ricompense
section('Codici sconto');
game.heroName = 'Gabriele';
game.showReward(4);
const code1 = game.save.getRewardCode('midpoint');
check('il livello 4 genera un codice RETRO3', !!code1 && code1.startsWith('RETRO3'), String(code1));
game.showReward(4);
const code2 = game.save.getRewardCode('midpoint');
check('rigiocare NON genera un secondo codice', code1 === code2, `${code1} vs ${code2}`);
check('un solo codice memorizzato', game.save.data.unlockedRewards.length === 1);

game.showReward(8);
const codeF = game.save.getRewardCode('final');
check('il livello 8 genera un codice RETRO5', !!codeF && codeF.startsWith('RETRO5'));
game.save.reset();
check('azzerare i progressi NON cancella i codici',
  game.save.getRewardCode('midpoint') === code1 && game.save.getRewardCode('final') === codeF);
check('azzerare i progressi riporta al livello 1', game.save.data.bestLevel === 1);

// il menu mostra i codici
game.showMainMenu();
const codeRows = uiRoot.querySelectorAll('.ra-code-row');
check('il menu elenca i codici sbloccati', codeRows.length === 2, `trovate ${codeRows.length} righe`);

// --------------------------------------------------------------- pausa/ESC
section('Pausa e riprendi con ESC');
game.save.data.bestLevel = 3;
game.startGame('Test Hero', 'acrobata', 2);
game.beginPlaying();
game.input._pauseEdge = true;
game.update(1 / 60);
check('ESC mette in pausa', game.state === 'paused');
game.input._pauseEdge = true;
game.update(1 / 60);
check('ESC riprende dalla pausa', game.state === 'playing');

// ------------------------------------------------- punteggio dopo game over
section('Il punteggio non si gonfia dopo un Game Over');
game.score = 5000;
game.levelStartScore = 5000;
game.score += 800;               // punti raccolti nel tentativo
game.triggerGameOver();
const screens = uiRoot.querySelectorAll('.ra-screen');
const gameOverScreen = screens[screens.length - 1];
const retry = gameOverScreen.querySelectorAll('.ra-btn')[0];
check('la schermata uscente non è più cliccabile', screens.length < 2 || screens[0].style.pointerEvents === 'none');
retry.click();
check('il punteggio torna a quello di inizio livello', game.score === 5000, `score=${game.score}`);

// ------------------------------------------------------------- qualità
section('Interruttore qualità');
const tier = game.setQuality('low');
check('la qualità bassa disattiva il glow', tier === 'low' && GFX.glow === false);
const ctx = renderer.ctx;
ctx.shadowBlur = 20;
check('shadowBlur è intercettato in qualità bassa', ctx.shadowBlur === 0, `valore=${ctx.shadowBlur}`);
game.setQuality('high');
ctx.shadowBlur = 20;
check('shadowBlur torna attivo in qualità alta', ctx.shadowBlur === 20);
check('la qualità è persistita', game.save.data.settings.quality === 'high');

// ------------------------------------------------------- resilienza loop
section('Resilienza del game loop');
const { GameLoop } = await import('../src/core/GameLoop.js');
let ticks = 0;
const loop = new GameLoop({ update: () => { ticks++; throw new Error('boom'); }, render: () => {}, onError: () => {} });
loop._running = true;
const origRaf = globalThis.requestAnimationFrame;
let scheduled = 0;
globalThis.requestAnimationFrame = () => { scheduled++; return 1; };
loop._tick(16);
loop._tick(32);
globalThis.requestAnimationFrame = origRaf;
loop.stop();
check('un\'eccezione non blocca il loop', scheduled === 2 && ticks === 2, `frame=${scheduled} tick=${ticks}`);

// ------------------------------------------------------------- riepilogo
console.log(log.join('\n'));
console.log(`\n${failures === 0 ? '✅ TUTTI I CONTROLLI SUPERATI' : `❌ ${failures} CONTROLLI FALLITI`}`);
process.exit(failures === 0 ? 0 : 1);
