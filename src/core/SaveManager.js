const STORAGE_KEY = 'retroavia.dimensions.v4';
const LEGACY_KEYS = ['retroavia.dimensions.v3', 'retroavia.dimensions.v2'];

const DEFAULT_PROGRESS = {
  heroName: '',
  bestLevel: 1,
  bestScore: 0,
  /** Flat list of every code ever issued — kept for backwards compatibility
   * with saves written before `rewardCodes` existed. */
  unlockedRewards: [],
  /** The authoritative store: one stable code per reward tier, keyed by the
   * level that grants it ({ "4": "RETRO3-…", "8": "RETRO5-…" }). Replaying a
   * reward level re-shows the SAME code instead of minting a new one — see
   * Game.showReward. That matters commercially: codes are redeemed by email
   * and tracked by hand, so one player must map to one code per tier. */
  rewardCodes: {},
  levelStats: {},
  abilities: {
    doubleJump: false,
    dash: false
  },
  // Chosen once at game start (see MainMenu/Game._applyClassBonuses) —
  // 'tiratore' | 'acrobata' | 'guardiano' | null (not yet chosen, or an
  // older save from before classes existed — treated as no bonus).
  chosenClass: null,
  settings: {
    audio: true,
    quality: 'auto',   // 'auto' | 'high' | 'low' — see core/quality.js
    allowPortrait: false
  },
  completedGame: false
};

export class SaveManager {
  constructor() {
    this.data = this.load();
  }

  load() {
    try {
      let raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        // One-time migration so existing players keep their progress (and,
        // more importantly, any discount code they already earned).
        for (const key of LEGACY_KEYS) {
          const legacy = localStorage.getItem(key);
          if (legacy) { raw = legacy; break; }
        }
      }
      if (!raw) return structuredClone(DEFAULT_PROGRESS);
      const parsed = JSON.parse(raw);
      const data = {
        ...structuredClone(DEFAULT_PROGRESS),
        ...parsed,
        settings: { ...DEFAULT_PROGRESS.settings, ...parsed.settings },
        abilities: { ...DEFAULT_PROGRESS.abilities, ...parsed.abilities },
        rewardCodes: { ...(parsed.rewardCodes || {}) }
      };
      // Older saves only had the flat list: rebuild the per-tier map from it
      // so a returning player doesn't get a second code for a tier they
      // already completed.
      if (Object.keys(data.rewardCodes).length === 0 && Array.isArray(data.unlockedRewards)) {
        for (const code of data.unlockedRewards) {
          if (typeof code !== 'string') continue;
          if (code.startsWith('RETRO3') && !data.rewardCodes.midpoint) data.rewardCodes.midpoint = code;
          if (code.startsWith('RETRO5') && !data.rewardCodes.final) data.rewardCodes.final = code;
        }
      }
      return data;
    } catch {
      return structuredClone(DEFAULT_PROGRESS);
    }
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch {
      /* storage unavailable (private mode, quota) — fail silently */
    }
  }

  recordLevelResult(level, score, cleared) {
    this.data.bestLevel = Math.max(this.data.bestLevel, cleared ? level + 1 : level);
    this.data.bestScore = Math.max(this.data.bestScore, score);
    const prevBest = this.data.levelStats[level]?.bestScore ?? 0;
    this.data.levelStats[level] = { bestScore: Math.max(prevBest, score), cleared: cleared || !!this.data.levelStats[level]?.cleared };
    this.save();
  }

  /** Returns the code already issued for this tier, or null. */
  getRewardCode(tier) {
    return this.data.rewardCodes[tier] || null;
  }

  /** Stores a code for a tier the first time it is earned, and returns
   * whether it was new (used to word the reward screen differently on a
   * replay). Never overwrites an existing one. */
  setRewardCode(tier, code) {
    if (this.data.rewardCodes[tier]) return false;
    this.data.rewardCodes[tier] = code;
    if (!this.data.unlockedRewards.includes(code)) this.data.unlockedRewards.push(code);
    this.save();
    return true;
  }

  unlockAbility(name) {
    if (!this.data.abilities[name]) {
      this.data.abilities[name] = true;
      this.save();
      return true;
    }
    return false;
  }

  setHeroName(name) {
    this.data.heroName = name;
    this.save();
  }

  setClass(id) {
    this.data.chosenClass = id;
    this.save();
  }

  setSetting(key, value) {
    this.data.settings[key] = value;
    this.save();
  }

  markGameCompleted() {
    this.data.completedGame = true;
    this.save();
  }

  /** Wipes progress but DELIBERATELY keeps the discount codes already earned:
   * they are redeemed by email and tracked by hand, so letting a reset mint a
   * fresh set would both confuse the player and break that tracking. */
  reset() {
    const keptCodes = { ...this.data.rewardCodes };
    const keptList = [...this.data.unlockedRewards];
    const keptSettings = { ...this.data.settings };
    const keptName = this.data.heroName;
    this.data = structuredClone(DEFAULT_PROGRESS);
    this.data.rewardCodes = keptCodes;
    this.data.unlockedRewards = keptList;
    this.data.settings = keptSettings;
    this.data.heroName = keptName;
    this.save();
  }
}
