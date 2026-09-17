import { el } from './dom.js';
import { formatTime } from '../utils/math.js';
import { showToast } from './Toast.js';
import { INSTAGRAM_URL, REWARD_EMAIL, buildRewardMailto } from '../rewards/rewards.js';
import { GFX } from '../core/quality.js';

/** A small, self-contained fireworks canvas for the victory screen — kept
 * separate from the in-game ParticleSystem and self-terminating: the loop
 * checks canvas.isConnected every frame and simply stops once clearRoot()
 * removes the modal, so nothing needs to call back in to tear this down.
 * Skipped entirely when the OS asks for reduced motion. */
function createVictoryFX() {
  if (GFX.reduceMotion) return null;
  const canvas = el('canvas', { class: 'ra-victory-fx', 'aria-hidden': 'true' });
  const ctx = canvas.getContext('2d');
  const colors = ['#00d4ff', '#8b5cf6', '#00ff88', '#ffd23f', '#ff0080', '#00ffff'];
  let particles = [];
  let lastBurst = 0;
  let lastFrameTime = null;

  function resize() {
    const rect = canvas.parentElement?.getBoundingClientRect();
    canvas.width = rect ? rect.width : window.innerWidth;
    canvas.height = rect ? rect.height : window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  function spawnBurst() {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height * 0.55 + 20;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const count = Math.round(30 * GFX.particles);
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const speed = 80 + Math.random() * 130;
      particles.push({
        x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
        life: 0, maxLife: 0.8 + Math.random() * 0.6,
        size: 2 + Math.random() * 2.2, color
      });
    }
  }

  function frame(now) {
    if (!canvas.isConnected) { window.removeEventListener('resize', resize); return; }
    if (lastFrameTime == null) lastFrameTime = now;
    const dt = Math.min(0.05, (now - lastFrameTime) / 1000);
    lastFrameTime = now;
    if (now - lastBurst > 600) { spawnBurst(); lastBurst = now; }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) { particles.splice(i, 1); continue; }
      p.vy += 170 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      ctx.globalAlpha = Math.max(0, 1 - p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  return canvas;
}

const QUALITY_LABEL = { auto: '⚙️ Grafica: Auto', high: '✨ Grafica: Alta', low: '🪫 Grafica: Leggera' };
const QUALITY_ORDER = ['auto', 'high', 'low'];

export function PauseMenu({ onResume, onRestart, onHome, audioEnabled, onToggleAudio, quality = 'auto', onSetQuality }) {
  const audioBtn = el('button', {
    class: 'ra-btn ra-btn--ghost',
    onclick: () => { const on = onToggleAudio(); audioBtn.textContent = on ? '🔊 Audio: ON' : '🔇 Audio: OFF'; }
  }, audioEnabled ? '🔊 Audio: ON' : '🔇 Audio: OFF');

  // Cycles auto → alta → leggera. "Leggera" turns off the neon glow pass,
  // which is by far the most expensive thing the renderer does — the single
  // most effective lever on an older phone.
  let qIndex = Math.max(0, QUALITY_ORDER.indexOf(quality));
  const qualityBtn = el('button', {
    class: 'ra-btn ra-btn--ghost',
    title: 'Riduci gli effetti luminosi se il gioco scatta',
    onclick: () => {
      qIndex = (qIndex + 1) % QUALITY_ORDER.length;
      const setting = QUALITY_ORDER[qIndex];
      const tier = onSetQuality?.(setting);
      qualityBtn.textContent = setting === 'auto' ? `⚙️ Grafica: Auto (${tier === 'low' ? 'leggera' : 'alta'})` : QUALITY_LABEL[setting];
    }
  }, QUALITY_LABEL[QUALITY_ORDER[qIndex]]);

  const panel = el('div', { class: 'ra-panel', style: 'width:min(420px,100%);text-align:center;' }, [
    el('h2', { class: 'ra-title', style: 'font-size:1.4rem;' }, '⏸ PAUSA'),
    el('button', { class: 'ra-btn ra-btn--primary', onclick: onResume }, '▶️ Riprendi'),
    el('div', { class: 'ra-row' }, [audioBtn, qualityBtn]),
    el('button', { class: 'ra-btn ra-btn--ghost', onclick: onRestart }, '🔄 Ricomincia livello'),
    el('button', { class: 'ra-btn ra-btn--danger', onclick: onHome }, '🏠 Menu principale'),
    el('p', { class: 'ra-hint-line' }, 'ESC o P per riprendere')
  ]);
  return el('div', { class: 'ra-screen' }, panel);
}

export function TutorialModal({ onClose }) {
  const panel = el('div', { class: 'ra-panel' }, [
    el('h2', { class: 'ra-title', style: 'font-size:1.3rem;' }, '❓ COME SI GIOCA'),
    el('div', { class: 'ra-text ra-howto' }, [
      el('p', {}, ['⬅️ ➡️ oppure ', el('strong', {}, 'A / D'), ' — Muoviti']),
      el('p', {}, ['⬆️ / ', el('strong', {}, 'SPAZIO'), ' — Salta (tienilo premuto per saltare più in alto; un secondo tocco in aria è il doppio salto)']),
      el('p', {}, [el('strong', {}, 'MAIUSC'), ' — Scatto laterale, invulnerabile mentre dura (si sblocca dopo la Dimensione 2)']),
      el('p', {}, [el('strong', {}, 'E'), ' — Lama al plasma: un fendente corto che elimina un nemico al primo colpo']),
      el('p', {}, [el('strong', {}, 'F'), ' — Fuoco a distanza (classe Tiratore, o nell\'arena finale)']),
      el('p', {}, [el('strong', {}, 'ESC / P'), ' — Pausa']),
      el('p', {}, ['💎 Raccogli ', el('strong', {}, 'tutti i cristalli'), ' prima di raggiungere il portale']),
      el('p', {}, ['👾 Salta sulla testa dei nemici per eliminarli, o colpiscili con la lama']),
      el('p', {}, ['📍 I checkpoint salvano il tentativo: se cadi riparti da lì con l\'energia piena']),
      el('p', {}, ['🧠 Tra un livello e l\'altro trovi un enigma: la risposta giusta vale punti, quella sbagliata te ne toglie — ma non blocca mai la partita']),
      el('p', {}, ['🏆 Completa le Dimensioni 4 e 8 per sbloccare i codici sconto veri del nostro store'])
    ]),
    el('button', { class: 'ra-btn ra-btn--primary', onclick: onClose }, 'Ho capito, si parte!')
  ]);
  return el('div', { class: 'ra-screen' }, panel);
}

/** Deliberately its own small, distinct celebration — NOT the full victory
 * fireworks treatment GameCompleteModal gets — so that spectacle stays
 * unique to actually finishing the real campaign. */
export function TutorialCompleteModal({ onHome }) {
  const panel = el('div', { class: 'ra-panel', style: 'text-align:center;' }, [
    el('div', { class: 'ra-victory-trophy', style: 'font-size:2.4rem;' }, '🎓'),
    el('h2', { class: 'ra-modal-title success' }, '✅ ADDESTRAMENTO COMPLETATO!'),
    el('p', { class: 'ra-text', style: 'text-align:center;color:var(--neon-green);' },
      'Conosci tutte le mosse: movimento, doppio salto, scatto, arma a distanza e lama al plasma.'),
    el('p', { class: 'ra-text', style: 'text-align:center;' }, 'Ora sei pronto per affrontare le vere dimensioni!'),
    el('button', { class: 'ra-btn ra-btn--primary', onclick: onHome }, '🏠 Torna al menu e inizia!')
  ]);
  return el('div', { class: 'ra-screen' }, panel);
}

export function RewardModal({ level, maxLevel, code, discount, minimum, score, heroName, isNew = true, onContinue }) {
  const isFinal = level >= maxLevel;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      showToast('✅ Codice copiato negli appunti!');
    } catch {
      showToast('Copia manualmente il codice qui sopra');
    }
  };

  const mailHref = buildRewardMailto({ code, discount, minimum, heroName, level });

  const panel = el('div', { class: 'ra-panel' }, [
    el('h2', { class: 'ra-modal-title success' }, isNew ? '🎉 RICOMPENSA SBLOCCATA!' : '🎁 IL TUO CODICE'),
    !isNew
      ? el('p', { class: 'ra-text ra-note' }, 'Avevi già sbloccato questa ricompensa: il codice resta lo stesso, è personale e vale una sola volta.')
      : null,
    el('div', { class: 'ra-reward-code' }, [
      el('span', { class: 'ra-reward-code-value' }, code),
      el('button', { class: 'ra-reward-copy', onclick: copy }, '📋 Copia')
    ]),
    el('p', { class: 'ra-reward-line' }, `✨ Sconto ${discount} su ordini sopra ${minimum} ✨`),

    // Primary redemption path: the code is applied by hand after the player
    // emails it, so the modal opens a pre-filled message instead of just
    // telling them an address to copy down.
    el('a', { class: 'ra-btn ra-btn--primary ra-btn--link', href: mailHref }, '✉️ Invia il codice per riscuoterlo'),
    el('p', { class: 'ra-text ra-note' }, [
      'Il codice viene applicato manualmente: mandacelo a ',
      el('strong', {}, REWARD_EMAIL),
      ' e ti confermiamo lo sconto sul prossimo ordine. Lo ritrovi sempre nel menu principale, sotto ',
      el('strong', {}, '“I tuoi codici sconto”'),
      '.'
    ]),
    el('a', { class: 'ra-menu-social', href: INSTAGRAM_URL, target: '_blank', rel: 'noopener noreferrer' }, '📸 Oppure scrivici su Instagram — @retroavia_'),
    el('p', { class: 'ra-reward-score' }, ['Punteggio: ', el('strong', {}, score.toLocaleString('it-IT'))]),
    el('button', { class: 'ra-btn ra-btn--ghost', style: 'margin-top:12px;', onclick: onContinue }, isFinal ? '🏁 Vai al finale' : '➡️ Continua l\'avventura')
  ]);
  return el('div', { class: 'ra-screen' }, panel);
}

export function GameCompleteModal({ heroName, gameTime, score, energy, maxEnergy, onHome }) {
  const stats = [
    ['🏆 Esploratore', heroName],
    ['⏱️ Tempo', formatTime(gameTime)],
    ['💯 Punteggio', score.toLocaleString('it-IT')],
    ['⚡ Energia finale', `${energy}/${maxEnergy}`]
  ];
  const statGrid = el('div', { class: 'ra-stat-grid' }, stats.map(([label, value], i) =>
    el('div', { class: 'ra-anim-slide-up', style: `animation-delay:${0.25 + i * 0.1}s;` }, [el('strong', {}, label), value])
  ));

  const fx = createVictoryFX();
  const panel = el('div', { class: 'ra-panel' }, [
    el('div', { class: 'ra-victory-trophy' }, '🏆'),
    el('h2', { class: 'ra-modal-title success ra-victory-title' }, '👑 MISSIONE COMPLETATA!'),
    el('p', { class: 'ra-text', style: 'text-align:center;color:var(--neon-green);font-size:1.05rem;' }, '🎉 Hai salvato tutte le dimensioni! 🎉'),
    statGrid,
    el('p', { class: 'ra-text', style: 'text-align:center;color:var(--neon-green);' },
      '🌌 Sei ufficialmente un Maestro Esploratore. I tuoi codici sconto ti aspettano nel menu, sotto “I tuoi codici sconto”: da lì puoi copiarli o inviarceli per email quando vuoi.'),
    el('button', { class: 'ra-btn ra-btn--primary', onclick: onHome }, '🏠 Torna al menu')
  ]);
  return el('div', { class: 'ra-screen' }, fx ? [fx, panel] : [panel]);
}

export function GameOverModal({ level, maxLevel, score, gameTime, bestLevel, onRetry, onHome }) {
  const panel = el('div', { class: 'ra-panel' }, [
    el('h2', { class: 'ra-modal-title danger' }, '💀 MISSIONE FALLITA'),
    el('p', { class: 'ra-text', style: 'text-align:center;color:var(--neon-orange);' }, '⚡ Le entità corrotte hanno vinto... per ora ⚡'),
    el('div', { class: 'ra-stat-grid' }, [
      el('div', {}, [el('strong', {}, '🎯 Livello raggiunto'), `${level}/${maxLevel}`]),
      el('div', {}, [el('strong', {}, '💯 Punteggio finale'), score.toLocaleString('it-IT')]),
      el('div', {}, [el('strong', {}, '⏱️ Tempo sopravvissuto'), formatTime(gameTime)])
    ]),
    el('p', { class: 'ra-text', style: 'text-align:center;font-size:0.8rem;opacity:0.75;margin-top:2px;' },
      `💾 Progressi salvati — la prossima partita riparte dalla Dimensione ${Math.min(bestLevel, maxLevel)}`),
    el('div', { class: 'ra-row' }, [
      el('button', { class: 'ra-btn ra-btn--primary', onclick: onRetry }, '🔄 Riprova questo livello'),
      el('button', { class: 'ra-btn ra-btn--ghost', onclick: onHome }, '🏠 Menu')
    ])
  ]);
  return el('div', { class: 'ra-screen' }, panel);
}
