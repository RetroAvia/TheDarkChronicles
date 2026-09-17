// Business-critical reward data — the discount mechanics themselves (3%/5%,
// 150€/180€ minimums, Instagram handle) are kept identical to the original
// release and must never change without an explicit request. Only WHICH
// level triggers the midpoint reward has changed: now that the campaign
// runs 8 levels instead of 5, the midpoint reward moved from Gamma (level 3)
// to Delta (level 4) so it still lands roughly halfway through the run.
//
// Redemption model (explicit, by design): the codes are NOT wired to a
// store checkout. The player emails the code to RetroAvia, which keeps track
// of who has already redeemed which tier and applies the discount manually.
// That is why the code only has to be a stable, human-readable identifier —
// and why it must stay stable: one player, one code per tier, forever. See
// SaveManager.getRewardCode/setRewardCode and Game.showReward.

export const MIDPOINT_LEVEL = 4;

/** Where players send their code to redeem it. */
export const REWARD_EMAIL = 'retroaviaofficial@gmail.com';

export const INSTAGRAM_HANDLE = 'retroavia_';
export const INSTAGRAM_URL = 'https://www.instagram.com/retroavia_';

/** Reward tiers are keyed by name, not by level number, so the save file
 * stays valid even if the campaign length changes again later. */
export function getRewardTier(level) {
  return level === MIDPOINT_LEVEL ? 'midpoint' : 'final';
}

export function getRewardInfo(level) {
  if (level === MIDPOINT_LEVEL) {
    return { prefix: 'RETRO3', discount: '3%', minimum: '150€' };
  }
  return { prefix: 'RETRO5', discount: '5%', minimum: '180€' };
}

export function generateRewardCode(level, playerName) {
  const { prefix } = getRewardInfo(level);
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  const nameHash = (playerName || 'RA').replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase().padEnd(2, 'X');
  return `${prefix}-${nameHash}${timestamp.slice(-3)}-${random}`;
}

/** Pre-filled email for redeeming a code. Everything RetroAvia needs to
 * identify the player and the tier is already in the subject and body, so
 * redemption is a two-tap flow from the reward screen. */
export function buildRewardMailto({ code, discount, minimum, heroName, level }) {
  const subject = `Codice sconto RetroAvia — ${code}`;
  const body = [
    'Ciao RetroAvia!',
    '',
    `Ho completato The Dark Chronicles e ho sbloccato questo codice sconto:`,
    '',
    `   CODICE: ${code}`,
    `   Sconto: ${discount} su ordini sopra ${minimum}`,
    '',
    `Esploratore: ${heroName || 'Explorer'}`,
    `Dimensione completata: ${level}`,
    '',
    'Vorrei usarlo per il mio prossimo ordine. Grazie!',
    ''
  ].join('\n');
  return `mailto:${REWARD_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
