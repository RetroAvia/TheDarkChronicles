import { el } from './dom.js';
import { showToast } from './Toast.js';
import {
  INSTAGRAM_URL, MIDPOINT_LEVEL, REWARD_EMAIL, buildRewardMailto, getRewardInfo
} from '../rewards/rewards.js';
import { LEVELS } from '../world/levels.js';
import { CLASSES } from '../world/classes.js';

const TIER_LEVEL = { midpoint: MIDPOINT_LEVEL, final: LEVELS.length };

/** The unlocked-codes panel. Codes are redeemed by emailing them to
 * RetroAvia, so this is the player's permanent record of what they earned —
 * previously the victory screen told them to "check the menu" and the menu
 * showed nothing at all, which meant a closed tab lost the code for good. */
function RewardsPanel(save, heroName) {
  const entries = Object.entries(save.data.rewardCodes || {})
    .filter(([, code]) => typeof code === 'string' && code)
    .sort((a, b) => (TIER_LEVEL[a[0]] || 0) - (TIER_LEVEL[b[0]] || 0));

  if (!entries.length) return null;

  const rows = entries.map(([tier, code]) => {
    const level = TIER_LEVEL[tier] || LEVELS.length;
    const { discount, minimum } = getRewardInfo(level);

    const copyBtn = el('button', {
      class: 'ra-code-action',
      'aria-label': `Copia il codice ${code}`,
      onclick: async () => {
        try {
          await navigator.clipboard.writeText(code);
          showToast('✅ Codice copiato negli appunti!');
        } catch {
          showToast('Selezionalo e copialo a mano 🙂');
        }
      }
    }, '📋');

    const mailBtn = el('a', {
      class: 'ra-code-action',
      href: buildRewardMailto({ code, discount, minimum, heroName, level }),
      'aria-label': `Invia il codice ${code} via email`
    }, '✉️');

    return el('div', { class: 'ra-code-row' }, [
      el('div', { class: 'ra-code-main' }, [
        el('span', { class: 'ra-code-value' }, code),
        el('span', { class: 'ra-code-meta' }, `Sconto ${discount} · ordini sopra ${minimum}`)
      ]),
      el('div', { class: 'ra-code-actions' }, [copyBtn, mailBtn])
    ]);
  });

  return el('details', { class: 'ra-codes', open: '' }, [
    el('summary', { class: 'ra-codes-summary' }, `🎁 I tuoi codici sconto (${entries.length})`),
    ...rows,
    el('p', { class: 'ra-codes-hint' }, `Inviali a ${REWARD_EMAIL} per farli applicare al tuo ordine.`)
  ]);
}

export function MainMenu({ save, audioEnabled, onStart, onTutorial, onPlayTutorial, onToggleAudio, onReset }) {
  const unlockedUpTo = Math.min(save.data.bestLevel, LEVELS.length);
  const hasProgress = unlockedUpTo > 1 || save.data.unlockedRewards.length > 0;
  let selectedClass = save.data.chosenClass || CLASSES[0].id;
  let selectedLevel = unlockedUpTo;

  const nameInput = el('input', {
    class: 'ra-name-input',
    type: 'text',
    maxlength: '12',
    autocomplete: 'off',
    spellcheck: 'false',
    placeholder: 'Il tuo nome da eroe...',
    value: save.data.heroName || ''
  });

  // --- level map (also the level selector) --------------------------------
  const rewardLevelIds = new Set([MIDPOINT_LEVEL, LEVELS.length]);
  const mapNodes = [];
  const mapTrackChildren = [];

  const startBtn = el('button', { class: 'ra-btn ra-btn--primary ra-start-btn' }, '');

  function refreshSelection() {
    mapNodes.forEach((node, i) => {
      node.classList.toggle('selected', LEVELS[i].id === selectedLevel);
    });
    const lvl = LEVELS[selectedLevel - 1];
    if (!hasProgress) startBtn.textContent = '🚀 Inizia l\'avventura';
    else if (selectedLevel === unlockedUpTo) startBtn.textContent = `➡️ Continua — ${lvl.name}`;
    else startBtn.textContent = `🔁 Rigioca — ${lvl.name}`;
  }

  LEVELS.forEach((lvl, i) => {
    const unlocked = lvl.id <= unlockedUpTo;
    const state = lvl.id < unlockedUpTo ? 'done' : lvl.id === unlockedUpTo ? 'current' : 'locked';
    const isReward = rewardLevelIds.has(lvl.id);
    const node = el(unlocked ? 'button' : 'div', {
      class: `ra-map-node ${state} ${isReward ? 'reward' : ''}`.trim(),
      type: unlocked ? 'button' : null,
      title: `${lvl.name} — ${lvl.subtitle}${isReward ? ' 🎁' : ''}${unlocked ? '' : ' (bloccata)'}`,
      'aria-label': `${lvl.name}${unlocked ? '' : ' — bloccata'}`,
      onclick: unlocked ? () => { selectedLevel = lvl.id; refreshSelection(); } : null
    }, unlocked ? String(lvl.id) : '🔒');
    mapNodes.push(node);
    mapTrackChildren.push(el('div', { class: 'ra-map-node-wrap' }, [node]));
    if (i < LEVELS.length - 1) {
      mapTrackChildren.push(el('div', { class: `ra-map-link ${lvl.id < unlockedUpTo ? 'done' : ''}`.trim() }));
    }
  });

  const map = el('div', { class: 'ra-map' }, [
    el('div', { class: 'ra-map-track' }, mapTrackChildren),
    el('p', { class: 'ra-map-caption' },
      hasProgress
        ? `Tocca una dimensione sbloccata per rigiocarla · 🎁 ai livelli ${MIDPOINT_LEVEL} e ${LEVELS.length}`
        : `${LEVELS.length} dimensioni · 🎁 sui livelli ${MIDPOINT_LEVEL} e ${LEVELS.length}`)
  ]);

  // --- class selection ----------------------------------------------------
  const classCards = CLASSES.map((cls) => el('button', {
    class: `ra-class-card ${cls.id === selectedClass ? 'selected' : ''}`.trim(),
    type: 'button',
    title: cls.description,
    'aria-label': `${cls.name}: ${cls.tagline}`,
    onclick: () => {
      selectedClass = cls.id;
      classCards.forEach((c, idx) => c.classList.toggle('selected', CLASSES[idx].id === selectedClass));
    }
  }, [
    el('span', { class: 'ra-class-icon' }, cls.icon),
    el('span', { class: 'ra-class-name' }, cls.name),
    el('span', { class: 'ra-class-tagline' }, cls.tagline)
  ]));

  const audioBtn = el('button', {
    class: 'ra-btn ra-btn--ghost',
    onclick: () => {
      const enabled = onToggleAudio();
      audioBtn.textContent = enabled ? '🔊 Audio: ON' : '🔇 Audio: OFF';
    }
  }, audioEnabled ? '🔊 Audio: ON' : '🔇 Audio: OFF');

  startBtn.addEventListener('click', () => {
    onStart(nameInput.value.trim() || 'Explorer', selectedClass, selectedLevel);
  });
  refreshSelection();

  // The scrolling part of the panel; the primary CTA is pinned below it so it
  // can never end up under the fold on a short laptop screen.
  const scroller = el('div', { class: 'ra-menu-scroll' }, [
    el('p', { class: 'ra-eyebrow' }, 'RetroAvia presenta'),
    el('h1', { class: 'ra-title ra-menu-logo' }, 'THE DARK CHRONICLES'),
    el('p', { class: 'ra-menu-tagline' }, `${LEVELS.length} dimensioni digitali. Cristalli da salvare. Sconti veri da sbloccare.`),
    map,
    RewardsPanel(save, save.data.heroName),
    el('label', { class: 'ra-field-label', for: 'ra-hero-name' }, 'Il tuo nome da eroe'),
    nameInput,
    el('p', { class: 'ra-class-label' }, 'Scegli la tua classe'),
    el('div', { class: 'ra-class-grid' }, classCards),
    el('div', { class: 'ra-row' }, [
      el('button', { class: 'ra-btn ra-btn--ghost', onclick: onPlayTutorial }, '🎮 Tutorial giocabile'),
      el('button', { class: 'ra-btn ra-btn--ghost', onclick: onTutorial }, '❓ Come si gioca')
    ]),
    el('div', { class: 'ra-row' }, [
      audioBtn,
      hasProgress
        ? el('button', {
            class: 'ra-btn ra-btn--ghost ra-btn--quiet',
            onclick: () => {
              if (confirm('Azzerare i progressi? I codici sconto già ottenuti restano salvati.')) onReset();
            }
          }, '↺ Azzera progressi')
        : null
    ]),
    el('a', {
      class: 'ra-menu-social',
      href: INSTAGRAM_URL,
      target: '_blank',
      rel: 'noopener noreferrer'
    }, '📸 Seguici su Instagram — @retroavia_')
  ]);

  nameInput.id = 'ra-hero-name';

  const panel = el('div', { class: 'ra-panel ra-panel--menu' }, [
    scroller,
    el('div', { class: 'ra-menu-cta' }, [startBtn])
  ]);

  return el('div', { class: 'ra-screen' }, panel);
}
