import { el } from './dom.js';

// Labels are generated from the boss's own `name` (default "L'Entità
// Suprema" for the final boss, but the Delta miniboss carries its own name)
// so the bar reads correctly for any boss fight, not just the final one.
function labelsByPhase(name) {
  const n = (name || "L'Entità Suprema").toUpperCase();
  return {
    1: {
      patrol: n,
      chargeTelegraph: '⚠️ SI PREPARA...',
      charge: '💥 CARICA!',
      telegraph: '⚠️ SI PREPARA...',
      attack: '🔥 ATTACCA!',
      vulnerable: '✨ VULNERABILE — SALTACI SOPRA O SPARA!',
      defeated: '💀 SCONFITTA'
    },
    2: {
      patrol: `💢 ${n} — INFURIATA`,
      chargeTelegraph: '⚠️ SI PREPARA... (CARICA!)',
      charge: '💥 CARICA VELOCE!',
      telegraph: '⚠️ SI PREPARA... (VELOCE!)',
      attack: '🔥🔥 ATTACCA IN FURIA!',
      vulnerable: '✨ VULNERABILE — ORA!',
      defeated: '💀 SCONFITTA'
    },
    3: {
      patrol: `💀 ${n} — FURIOSA`,
      chargeTelegraph: '⚠️⚠️ CARICA IMMINENTE!',
      charge: '💥💥 CARICA FURIOSA!',
      telegraph: '⚠️⚠️ SI PREPARA...',
      attack: '🔥🔥🔥 ATTACCO FURIOSO!',
      vulnerable: '✨ VULNERABILE — ORA!',
      defeated: '💀 SCONFITTA'
    },
    4: {
      patrol: `💢 ${n} — DISPERATA`,
      chargeTelegraph: '⚠️⚠️⚠️ CARICA DISPERATA!',
      charge: '💥💥💥 CARICA DISPERATA!',
      telegraph: '⚠️⚠️⚠️ ULTIMO ASSALTO...',
      attack: '🔥🔥🔥🔥 ATTACCO DISPERATO!',
      vulnerable: '✨ VULNERABILE — ORA O MAI PIÙ!',
      defeated: '💀 SCONFITTA'
    }
  };
}

const PHASE_COLOR = { 1: '#fff', 2: '#ff5c5c', 3: '#ff2d4a', 4: '#ffd23f' };
const PHASE_BORDER = { 1: 'var(--glass-border)', 2: 'rgba(255,59,59,0.6)', 3: 'rgba(255,45,74,0.85)', 4: 'rgba(255,210,63,0.9)' };

export class BossBar {
  constructor() {
    this.pips = [];
    this.label = el('div', { class: 'ra-bossbar-label' }, "L'ENTITÀ SUPREMA");
    this.pipRow = el('div', { class: 'ra-bossbar-pips' });

    // Positioned by CSS (.ra-bossbar) BELOW the HUD rather than inline at
    // top:14px, where it sat on top of the crystal/score readout — both were
    // centred at the top of the screen and overlapped during every boss fight.
    this.node = el('div', { class: 'ra-bossbar', role: 'status' }, [this.label, this.pipRow]);

    this._lastHealth = -1;
    this._lastState = '';
    this._lastPhase = 1;
  }

  update(boss) {
    if (boss.health !== this._lastHealth) {
      this.pipRow.innerHTML = '';
      for (let i = 0; i < boss.maxHealth; i++) {
        this.pipRow.appendChild(el('div', {
          class: `ra-bossbar-pip ${i < boss.health ? 'filled' : ''}`.trim()
        }));
      }
      this._lastHealth = boss.health;
    }
    const phase = boss.currentPhase || 1;
    if (boss.state !== this._lastState || phase !== this._lastPhase) {
      const byPhase = labelsByPhase(boss.name);
      const labels = byPhase[phase] || byPhase[1];
      this.label.textContent = labels[boss.state] || labels.patrol;
      this.label.style.color = !boss.defeated ? PHASE_COLOR[phase] : '#fff';
      this.node.style.borderColor = !boss.defeated ? PHASE_BORDER[phase] : 'var(--glass-border)';
      this._lastState = boss.state;
      this._lastPhase = phase;
    }
    this.node.style.display = boss.defeated ? 'none' : 'block';
  }
}
