// Level geometry is derived from the player's REAL movement envelope — every
// gap below was checked against actual simulated trajectories of the physics
// in Player.js (a small headless harness that drives the real Player/Platform
// classes with a scripted jump/double-jump/dash plan and asserts on where the
// player actually lands), not hand-waved estimates. Three techniques are
// assumed of the player, matching what the tutorial/story text teaches:
//   normal jump        run + jump, ~90-170px horizontal depending on rise
//   double jump (DJ)    jump, then jump again near the apex — big vertical
//                       reach, safe up to ~140-180px rise with a 100-220px gap
//   dash-jump (dash)    jump, then dash near the apex — extends the flat top
//                       of the arc outward, safe up to ~250px flat gap and the
//                       only way to clear the widest gaps
// Gaps flagged "(DJ)" or "(dash)" are sized so the relevant ability is
// required — a plain running jump physically cannot cross them. Platform
// widths are chosen generously (rather than razor-thin) so that realistic
// momentum carried over from the previous hop can't cause an overshoot past
// the landing zone — narrow (~100px) landing platforms right after a DJ gap
// were verified to sometimes fail exactly this way and were widened to 130px+.
//
// Checkpoint convention: `cp.y = targetPlatform.y - 60` (with the Checkpoint
// default h:60) drops the respawned player ~44px above the platform surface —
// a small safe fall before landing normally, never inside geometry. A
// checkpoint must NEVER sit on a `crumble` platform: that platform can be
// long gone by the time a later death respawns the player there. (Game.js
// also resets crumbled platforms on every checkpoint respawn as a second,
// systemic safety net — see LevelRuntime.resetCrumblingPlatforms.)
//
// Boss arenas: `bossArena.platforms/hazards/goal/boss` describe a genuinely
// separate "room", entered through the black-hole portal (Game.js
// _startBossPortal/_updatePortal) once the player crosses `triggerX` in the
// main dimension. Its coordinate space is offset far past any main-dimension
// geometry (arena data starts at x >= 5000, dimensions top out around x
// 2700) purely so nothing from the main room can ever visually or physically
// overlap the arena or vice versa — LevelRuntime swaps the whole
// platform/hazard/goal/boss set wholesale via getters once `inBossArena`
// flips true (see world/LevelRuntime.js), rather than reusing the main
// level's platforms with a different coat of paint.
//
// A "miniboss" (Delta's Custode del Nucleo) is different from an arena boss:
// it's fought in-level, no portal, no separate room — just a `type: 'boss'`
// entry in the ordinary `enemies` array at the end of the level, exactly like
// every regular boss fight before arenas existed.

export const LEVELS = [
  {
    id: 1,
    key: 'alpha',
    name: 'Dimensione Alpha',
    subtitle: 'Il Risveglio',
    spawn: { x: 50, y: 400 },
    unlocksAfterClear: 'doubleJump',
    platforms: [
      { x: 0, y: 500, w: 200, h: 20 },
      { x: 300, y: 450, w: 150, h: 20 },
      { x: 550, y: 400, w: 150, h: 20 },
      { x: 800, y: 350, w: 200, h: 20 },
      { x: 1110, y: 380, w: 140, h: 20 },
      { x: 1330, y: 320, w: 130, h: 20, moving: { axis: 'y', range: 12, speed: 1.0, phase: 0 } },
      { x: 1550, y: 280, w: 140, h: 20 },
      { x: 1800, y: 230, w: 200, h: 20 }
    ],
    collectibles: [
      { x: 350, y: 420 },
      { x: 600, y: 370 },
      { x: 850, y: 320 },
      { x: 1160, y: 350 },
      { x: 1390, y: 290 },
      { x: 1850, y: 200 }
    ],
    enemies: [
      { x: 400, y: 420, w: 30, h: 30, vx: 1, range: 80, type: 'patrol' },
      { x: 1600, y: 250, w: 28, h: 28, vx: -1, range: 60, type: 'patrol' }
    ],
    hazards: [],
    checkpoints: [
      { x: 611, y: 340 },
      { x: 1395, y: 260 }
    ],
    goal: { x: 1950, y: 150 }
  },
  {
    id: 2,
    key: 'beta',
    name: 'Dimensione Beta',
    subtitle: 'Le Isole Fluttuanti',
    spawn: { x: 50, y: 400 },
    unlocksAfterClear: 'dash',
    platforms: [
      { x: 0, y: 520, w: 160, h: 20 },
      { x: 230, y: 470, w: 110, h: 20, moving: { axis: 'y', range: 14, speed: 1.1, phase: 0 } },
      { x: 420, y: 420, w: 110, h: 20 },
      { x: 681, y: 260, w: 120, h: 20 }, // (DJ) +160 rise
      { x: 935, y: 320, w: 120, h: 20, moving: { axis: 'y', range: 16, speed: 0.9, phase: 2 } },
      { x: 1143, y: 260, w: 120, h: 20 },
      { x: 1341, y: 210, w: 150, h: 20 },
      { x: 1581, y: 260, w: 120, h: 20, moving: { axis: 'x', range: 18, speed: 1.0, phase: 1 } },
      { x: 1801, y: 220, w: 120, h: 20 },
      // Bounce pad tucked just below the direct jump line to platform9: a
      // player who clears the gap normally never touches it (the running-jump
      // arc passes well above), but stepping off the edge and free-falling
      // instead lands square on it for a big, reliable boing up onto
      // platform9 — an optional bit of dynamism/forgiveness, not a gate.
      { x: 1930, y: 280, w: 50, h: 16, spring: true },
      { x: 2031, y: 180, w: 160, h: 20 }
    ],
    collectibles: [
      { x: 265, y: 440 },
      { x: 475, y: 390 },
      { x: 741, y: 230 },
      { x: 995, y: 290 },
      { x: 1203, y: 230 },
      { x: 1631, y: 230 },
      { x: 1861, y: 190 },
      { x: 2101, y: 150 }
    ],
    enemies: [
      { x: 265, y: 440, w: 25, h: 25, vx: -1, range: 70, type: 'patrol' },
      { x: 1090, y: 280, w: 26, h: 26, range: 90, speed: 50, type: 'flyer' },
      { x: 1620, y: 230, w: 25, h: 25, vx: -1, range: 40, type: 'patrol' },
      { x: 1900, y: 190, w: 26, h: 26, range: 60, speed: 55, type: 'flyer' }
    ],
    hazards: [
      { x: 1090, y: 290, w: 40, h: 20, type: 'laser', cycle: 2.2, activeRatio: 0.45, phase: 0.6 },
      { x: 1900, y: 200, w: 40, h: 20, type: 'laser', cycle: 2.0, activeRatio: 0.4, phase: 1.2 }
    ],
    checkpoints: [
      { x: 475, y: 360 },
      { x: 1400, y: 150 }
    ],
    goal: { x: 2131, y: 100 }
  },
  {
    id: 3,
    key: 'gamma',
    name: 'Dimensione Gamma',
    subtitle: 'Il Guanto di Sfida',
    spawn: { x: 50, y: 400 },
    unlocksAfterClear: null,
    platforms: [
      { x: 0, y: 500, w: 130, h: 20 },
      { x: 213, y: 450, w: 125, h: 20, crumble: true },
      { x: 421, y: 400, w: 125, h: 20 },
      { x: 629, y: 350, w: 125, h: 20, crumble: true },
      { x: 949, y: 350, w: 150, h: 20 }, // (dash) 195px flat gap — beyond a plain jump's ~176px max reach
      { x: 1182, y: 300, w: 125, h: 20, crumble: true },
      { x: 1385, y: 250, w: 150, h: 20 },
      { x: 1655, y: 220, w: 130, h: 20, crumble: true },
      { x: 1980, y: 170, w: 150, h: 20 }, // (dash) second dash showcase, 195px flat gap
      { x: 2230, y: 130, w: 160, h: 20 }
    ],
    collectibles: [
      { x: 283, y: 420 },
      { x: 491, y: 370 },
      { x: 699, y: 320 },
      { x: 1024, y: 320 },
      { x: 1252, y: 270 },
      { x: 1460, y: 220 },
      { x: 1700, y: 190 },
      { x: 2050, y: 140 },
      { x: 2280, y: 100 }
    ],
    enemies: [
      { x: 491, y: 370, w: 25, h: 25, vx: 1, range: 55, type: 'hunter', speed: 65 },
      { x: 699, y: 324, w: 26, h: 26, type: 'turret', fireRate: 2.4 },
      { x: 1252, y: 275, w: 25, h: 25, vx: -1, range: 40, type: 'patrol' },
      { x: 1700, y: 195, w: 25, h: 25, vx: 1, range: 40, type: 'patrol' },
      { x: 2260, y: 104, w: 26, h: 26, type: 'turret', fireRate: 2.2 }
    ],
    hazards: [
      { x: 312, y: 430, w: 18, h: 20, type: 'spikes' },
      { x: 1755, y: 200, w: 16, h: 20, type: 'spikes' }
    ],
    checkpoints: [
      // On platform4 (x:949), which is stable — never place a checkpoint on
      // a `crumble` platform: it can vanish under a later respawn and drop
      // the player straight back into the void.
      { x: 1010, y: 290 },
      { x: 2280, y: 70 }
    ],
    goal: { x: 2330, y: 50 }
  },
  {
    id: 4,
    key: 'delta',
    name: 'Dimensione Delta',
    subtitle: 'Precisione Assoluta',
    spawn: { x: 50, y: 380 },
    unlocksAfterClear: null,
    platforms: [
      { x: 0, y: 480, w: 110, h: 20 },
      { x: 203, y: 430, w: 105, h: 20, moving: { axis: 'x', range: 20, speed: 1.2, phase: 1 } },
      { x: 401, y: 380, w: 105, h: 20 },
      { x: 599, y: 330, w: 105, h: 20, moving: { axis: 'x', range: 22, speed: 1.0, phase: 3 } },
      { x: 866, y: 190, w: 105, h: 20 }, // (DJ) +140 rise
      { x: 1069, y: 150, w: 105, h: 20 },
      { x: 1287, y: 110, w: 110, h: 20 },
      { x: 1497, y: 150, w: 110, h: 20 },
      { x: 1697, y: 110, w: 110, h: 20, moving: { axis: 'y', range: 14, speed: 1.0, phase: 1 } },
      { x: 1907, y: 110, w: 200, h: 20 },
      // Extension added when Delta gained a miniboss (previously the level
      // ended at the platform above) — a flat 140px gap, comfortably a plain
      // jump, leading into the Custode's own small arena floor. Widened from
      // 260 (Round 10 fix — the boss's own patrol/charge range left almost
      // no safe standing room on a floor that small, and no-gun players had
      // nowhere to retreat to while waiting for the vulnerable window).
      { x: 2247, y: 110, w: 340, h: 24 }
    ],
    collectibles: [
      { x: 263, y: 400 },
      { x: 461, y: 350 },
      { x: 659, y: 300 },
      { x: 926, y: 160 },
      { x: 1129, y: 120 },
      { x: 1342, y: 90 },
      { x: 1552, y: 120 },
      { x: 1752, y: 80 },
      { x: 1990, y: 70 },
      { x: 2320, y: 80 }
    ],
    enemies: [
      { x: 263, y: 400, w: 25, h: 25, vx: 1, range: 40, type: 'patrol' },
      { x: 461, y: 354, w: 26, h: 26, type: 'turret', fireRate: 2.0 },
      { x: 659, y: 305, w: 25, h: 25, vx: -1, range: 50, type: 'hunter', speed: 70 },
      { x: 1230, y: 130, w: 26, h: 26, range: 80, speed: 60, type: 'flyer' },
      { x: 1547, y: 125, w: 25, h: 25, vx: 1, range: 45, type: 'hunter', speed: 70 },
      { x: 1970, y: 84, w: 26, h: 26, type: 'turret', fireRate: 2.0 },
      // The Custode del Nucleo — Delta's miniboss: a real (if smaller and
      // shorter) multi-phase fight fought in-level, no portal needed. Half
      // the health of the final boss, so it still escalates through phase 2/
      // 3 but the whole fight is meant to feel like a stiff test, not an
      // endurance run — a taste of what Omega has waiting. Recentred on the
      // widened floor above and range trimmed from 80 (Round 10 fix — its
      // patrol/charge excursion used to span almost the entire old, much
      // smaller platform; this now leaves a real safe zone on both sides).
      { x: 2385, y: 46, w: 64, h: 64, range: 65, speed: 60, health: 5, type: 'boss', name: 'Il Custode del Nucleo' }
    ],
    hazards: [
      { x: 238, y: 410, w: 20, h: 20, type: 'spikes' },
      { x: 1850, y: 95, w: 36, h: 20, type: 'laser', cycle: 2.0, activeRatio: 0.42, phase: 0.8 },
      { x: 2400, y: 90, w: 36, h: 20, type: 'laser', cycle: 2.0, activeRatio: 0.4, phase: 0.5 }
    ],
    checkpoints: [
      // Was sitting on platform4 (x:599, a horizontally-moving platform) with
      // cp.y=320 instead of the required 270 (platform4.y=330 - 60): the
      // respawn point landed 6px INSIDE the platform's body, and the real
      // collision resolver shoves an embedded spawn downward through solid
      // ground instead of placing it on top — sending every checkpoint
      // retry straight into the void. Moved onto platform3 (x:401, stable,
      // not moving), correctly offset per the standard convention.
      { x: 450, y: 320 },
      // Pre-miniboss checkpoint, on the last stable platform before the gap
      // into the Custode's arena — a death against it retries right at the
      // doorstep instead of the whole level.
      { x: 1990, y: 50 }
    ],
    goal: { x: 2430, y: 30 }
  },
  {
    id: 5,
    key: 'epsilon',
    name: 'Dimensione Epsilon',
    subtitle: 'La Cascata Digitale',
    spawn: { x: 50, y: 380 },
    unlocksAfterClear: null,
    platforms: [
      { x: 0, y: 460, w: 150, h: 20 },
      { x: 260, y: 520, w: 120, h: 20, moving: { axis: 'y', range: 14, speed: 1.1, phase: 0 } },
      { x: 480, y: 440, w: 110, h: 20 },
      { x: 690, y: 360, w: 110, h: 20, crumble: true },
      { x: 900, y: 280, w: 110, h: 20 },
      { x: 1150, y: 280, w: 130, h: 20, moving: { axis: 'x', range: 20, speed: 1.0, phase: 2 } },
      { x: 1400, y: 230, w: 120, h: 20 },
      { x: 1650, y: 180, w: 120, h: 20, crumble: true },
      { x: 1900, y: 150, w: 200, h: 20 }
    ],
    collectibles: [
      { x: 300, y: 470 },
      { x: 530, y: 400 },
      { x: 740, y: 320 },
      { x: 950, y: 240 },
      { x: 1210, y: 240 },
      { x: 1460, y: 190 },
      { x: 1710, y: 140 },
      { x: 1970, y: 110 }
    ],
    enemies: [
      { x: 60, y: 435, w: 25, h: 25, vx: 1, range: 50, type: 'patrol' },
      { x: 500, y: 415, w: 25, h: 25, vx: -1, range: 45, speed: 65, type: 'hunter' },
      { x: 1030, y: 250, w: 26, h: 26, range: 80, speed: 60, type: 'flyer' },
      { x: 1420, y: 204, w: 26, h: 26, type: 'turret', fireRate: 2.0 },
      { x: 1670, y: 155, w: 25, h: 25, vx: 1, range: 40, type: 'patrol' }
    ],
    hazards: [
      { x: 730, y: 340, w: 18, h: 20, type: 'spikes' },
      { x: 880, y: 260, w: 36, h: 20, type: 'laser', cycle: 2.0, activeRatio: 0.4, phase: 0.3 }
    ],
    checkpoints: [
      { x: 520, y: 380 },
      { x: 1440, y: 170 }
    ],
    goal: { x: 2000, y: 70 }
  },
  {
    id: 6,
    key: 'zeta',
    name: 'Dimensione Zeta',
    subtitle: 'Il Labirinto Neurale',
    spawn: { x: 50, y: 420 },
    unlocksAfterClear: null,
    platforms: [
      { x: 0, y: 480, w: 120, h: 20 },
      { x: 200, y: 430, w: 100, h: 20 },
      { x: 400, y: 380, w: 100, h: 20 },
      { x: 660, y: 250, w: 100, h: 20 }, // (DJ) +130 rise
      { x: 860, y: 250, w: 100, h: 20, moving: { axis: 'x', range: 18, speed: 1.0, phase: 1 } },
      { x: 1060, y: 200, w: 100, h: 20 },
      { x: 1355, y: 200, w: 110, h: 20 }, // (dash) 195px flat gap
      { x: 1600, y: 150, w: 110, h: 20, crumble: true },
      { x: 1850, y: 110, w: 110, h: 20 },
      { x: 2100, y: 110, w: 200, h: 20, moving: { axis: 'y', range: 12, speed: 1.2, phase: 0 } }
    ],
    collectibles: [
      { x: 240, y: 400 },
      { x: 440, y: 350 },
      { x: 700, y: 220 },
      { x: 900, y: 220 },
      { x: 1100, y: 170 },
      { x: 1395, y: 170 },
      { x: 1640, y: 120 },
      { x: 1890, y: 80 },
      { x: 2180, y: 80 }
    ],
    enemies: [
      { x: 220, y: 405, w: 25, h: 25, vx: 1, range: 45, type: 'patrol' },
      { x: 700, y: 225, w: 26, h: 26, type: 'turret', fireRate: 1.9 },
      { x: 1080, y: 175, w: 25, h: 25, vx: -1, range: 40, speed: 70, type: 'hunter' },
      { x: 1395, y: 175, w: 26, h: 26, type: 'turret', fireRate: 1.8 },
      { x: 1870, y: 85, w: 26, h: 26, range: 90, speed: 65, type: 'flyer' },
      { x: 2140, y: 85, w: 25, h: 25, vx: 1, range: 50, type: 'patrol' }
    ],
    hazards: [
      { x: 640, y: 260, w: 16, h: 20, type: 'spikes' },
      { x: 1620, y: 130, w: 36, h: 20, type: 'laser', cycle: 2.2, activeRatio: 0.42, phase: 0.9 }
    ],
    checkpoints: [
      { x: 440, y: 320 },
      { x: 1395, y: 140 }
    ],
    goal: { x: 2230, y: 30 }
  },
  {
    id: 7,
    key: 'eta',
    name: 'Dimensione Eta',
    subtitle: "L'Ultima Soglia",
    spawn: { x: 50, y: 400 },
    unlocksAfterClear: null,
    platforms: [
      { x: 0, y: 460, w: 110, h: 20 },
      { x: 190, y: 410, w: 100, h: 20 },
      { x: 390, y: 360, w: 100, h: 20 },
      { x: 585, y: 230, w: 130, h: 20 }, // (DJ) +130 rise, widened landing
      { x: 815, y: 230, w: 100, h: 20 },
      { x: 1010, y: 230, w: 150, h: 20 },
      { x: 1355, y: 230, w: 100, h: 20 }, // (dash) 195px flat gap
      { x: 1550, y: 180, w: 100, h: 20 },
      { x: 1745, y: 130, w: 100, h: 20 },
      { x: 1940, y: 130, w: 100, h: 20 },
      { x: 2235, y: 130, w: 220, h: 20 } // (dash) second dash showcase, 195px flat gap
    ],
    collectibles: [
      { x: 230, y: 380 },
      { x: 430, y: 330 },
      { x: 630, y: 190 },
      { x: 850, y: 200 },
      { x: 1060, y: 200 },
      { x: 1390, y: 200 },
      { x: 1585, y: 150 },
      { x: 1780, y: 100 },
      { x: 1975, y: 100 },
      { x: 2320, y: 90 }
    ],
    enemies: [
      { x: 210, y: 385, w: 25, h: 25, vx: 1, range: 40, type: 'patrol' },
      // y is the enemy's TOP edge: 230 (platform top) - 26 (height) = 204 so
      // it rests on the surface. It used to be 235, which buried the turret
      // 31px inside the platform it is supposed to be standing on.
      { x: 630, y: 204, w: 26, h: 26, type: 'turret', fireRate: 1.8 },
      { x: 850, y: 205, w: 25, h: 25, vx: -1, range: 45, speed: 75, type: 'hunter' },
      { x: 1060, y: 205, w: 25, h: 25, vx: 1, range: 60, speed: 75, type: 'hunter' },
      { x: 1585, y: 155, w: 26, h: 26, type: 'turret', fireRate: 1.7 },
      { x: 1975, y: 105, w: 26, h: 26, range: 100, speed: 70, type: 'flyer' }
    ],
    hazards: [
      { x: 815, y: 210, w: 16, h: 20, type: 'spikes' },
      { x: 1745, y: 110, w: 16, h: 20, type: 'spikes' },
      { x: 1150, y: 190, w: 36, h: 20, type: 'laser', cycle: 2.0, activeRatio: 0.42, phase: 1.1 }
    ],
    checkpoints: [
      { x: 855, y: 170 },
      { x: 1980, y: 70 }
    ],
    goal: { x: 2380, y: 50 }
  },
  {
    id: 8,
    key: 'omega',
    name: 'Dimensione Omega',
    subtitle: 'Lo Scontro Finale',
    spawn: { x: 50, y: 420 },
    unlocksAfterClear: null,
    platforms: [
      { x: 0, y: 520, w: 90, h: 20 },
      { x: 193, y: 480, w: 95, h: 20, crumble: true },
      { x: 391, y: 440, w: 95, h: 20, moving: { axis: 'y', range: 12, speed: 1.3, phase: 0 } },
      { x: 681, y: 440, w: 140, h: 20 }, // (dash) 195px flat gap, extra-wide landing
      { x: 961, y: 300, w: 105, h: 20 }, // (DJ) +140 rise
      { x: 1175, y: 300, w: 115, h: 20, moving: { axis: 'x', range: 20, speed: 1.1, phase: 2 } },
      { x: 1390, y: 270, w: 110, h: 20, moving: { axis: 'y', range: 14, speed: 1.0, phase: 3 } },
      // The final calm platform before the black hole — smaller than the old
      // reused "boss plateau" (this no longer needs to host the fight; the
      // boss lives in its own arena room now, see bossArena below).
      { x: 1600, y: 300, w: 180, h: 24 }
    ],
    collectibles: [
      { x: 248, y: 450 },
      { x: 446, y: 410 },
      { x: 751, y: 410 },
      { x: 1021, y: 270 },
      { x: 1240, y: 270 },
      { x: 1435, y: 240 },
      // These two used to hang in mid-air over the 100px void gap between
      // platform 1390 and platform 1600 — reachable (verified in the physics
      // sim) but only as a grab during the jump arc, and a miss meant losing
      // energy in the void and re-crossing the gap backwards, all for a
      // MANDATORY crystal immediately before the final boss. They now sit on
      // the last solid ledge, which `triggerX` was moved past so the player
      // actually gets to stand on it (see bossArena.triggerX below).
      { x: 1640, y: 265 },
      { x: 1700, y: 265 }
    ],
    enemies: [
      { x: 446, y: 415, w: 25, h: 25, vx: -1, range: 35, type: 'hunter', speed: 60 },
      { x: 751, y: 414, w: 26, h: 26, type: 'turret', fireRate: 1.8 },
      { x: 1128, y: 280, w: 26, h: 26, range: 70, speed: 65, type: 'flyer' },
      { x: 1435, y: 245, w: 25, h: 25, vx: 1, range: 40, type: 'patrol' }
      // The boss itself no longer lives in this array — it's a resident of
      // its own arena room (bossArena.boss below), not the main dimension.
    ],
    hazards: [
      { x: 749, y: 420, w: 16, h: 20, type: 'spikes' }
      // The old laser at x:1700 sat past triggerX (unreachable for the same
      // reason as the relocated crystals above) — moved into the arena
      // itself, where it actually adds pressure to the fight.
    ],
    checkpoints: [
      { x: 420, y: 380 },
      { x: 1211, y: 240 }
    ],
    // Never actually reached in practice — crossing triggerX always fires
    // the portal first (see Game._updateGameplay) — but LevelRuntime still
    // wants a well-formed main-dimension goal object, so it's left in place
    // at its original spot rather than removed.
    goal: { x: 1850, y: 230 },
    // Crossing triggerX (just short of the final platform) fires the
    // one-time black-hole "warp" transition (see Game.js _startBossPortal)
    // that pulls the player OUT of this dimension entirely and into a
    // genuinely separate arena room — not a reskinned corner of Omega, a
    // different place, reached the way the story describes: "prendi il buco
    // nero, però poi entri in una nuova mappa, in una nuova stanza."
    //
    // The arena's own coordinate space starts at x:5000 — far past anything
    // in the main dimension (which tops out around x:1780) — purely so none
    // of the two rooms' geometry can ever overlap; LevelRuntime swaps the
    // whole platform/hazard/goal/boss set via getters once inBossArena
    // flips true (see world/LevelRuntime.js).
    bossArena: {
      // Was 1560, which fired the portal while the player was still airborne
      // over the gap — they never set foot on the final ledge, and the two
      // crystals meant to sit on it had to be moved out over the void. 1745
      // is on the right-hand third of that ledge (1600..1780): the player
      // lands, collects, and walks into the black hole deliberately.
      triggerX: 1745,
      entryX: 5090,
      entryY: 300,
      platforms: [
        { x: 5000, y: 380, w: 900, h: 24 },
        { x: 5040, y: 290, w: 130, h: 20 },
        { x: 5730, y: 290, w: 130, h: 20 },
        // Solid walls sealing both edges of the arena floor (y:0 down to the
        // floor's own bottom edge, 380+24=404, so there's no gap) — this is a
        // genuinely separate boss room, not open dimension geometry, and
        // running/jumping off either side used to drop the player into the
        // void with a stale respawnPoint left over from the main dimension
        // (see Game.js _updatePortal), soft-locking them into an endless
        // fall. Walling the room off is the real fix; _updatePortal also now
        // points respawnPoint at the arena itself as a defense-in-depth
        // safety net for any other way out (e.g. boss knockback).
        { x: 4980, y: 0, w: 20, h: 404 },
        { x: 5900, y: 0, w: 20, h: 404 }
      ],
      hazards: [
        { x: 5350, y: 340, w: 40, h: 20, type: 'laser', cycle: 2.4, activeRatio: 0.4, phase: 0.5 }
      ],
      // On the floor itself, past the boss — no platforming required right
      // after a boss kill, deliberately.
      goal: { x: 5820, y: 300 },
      // Much bigger than any regular enemy and twice the health of the
      // original fight — a real final-boss silhouette that takes a genuine
      // multi-phase fight to bring down. y is set so its bottom edge sits
      // exactly on the arena floor (y:380), same convention as every other
      // grounded enemy. range:250 keeps its patrol comfortably inside the
      // 900px-wide floor either side of center.
      boss: { x: 5402, y: 284, w: 96, h: 96, range: 250, speed: 55, health: 8 }
    }
  }
];

// Authoring reference only: level geometry is laid out assuming roughly this
// much vertical room. The renderer no longer uses a fixed world height — the
// camera frames each level's real content box and derives its own void-fall
// threshold from it (see world/LevelRuntime.js viewBounds/voidY).
export const DESIGN_HEIGHT = 575;

// ---------------------------------------------------------------- tutorial
// "Level 0": a short, real playable tutorial that teaches every core
// mechanic through hands-on stations (move, jump, double jump, dash, ranged
// weapon, melee weapon, crystal/checkpoint) instead of a text popup — per
// explicit request: "un livello 0 tutorial... un bel tutorial anche
// visivamente." Deliberately declared OUTSIDE the LEVELS array — it is
// never LEVELS[8], never counted in LEVELS.length, and getLevel(0) below
// special-cases it — so MAX_LEVELS/REWARD_LEVELS/bestLevel-clamping/
// MainMenu's level-map/every index-based lookup into LEVELS stay completely
// untouched (see Game.js startTutorial/_completeTutorial for the dedicated,
// separate flow that plays this level without touching save progress,
// quizzes or reward logic).
//
// Every gap below reuses EXACT deltas already proven reachable in the real
// campaign levels (same technique tags as above), rather than new,
// unverified numbers:
//   plain jump   gap 100 / rise 50   — reused from Alpha plat1->plat2
//   double jump  gap 151 / rise 160  — reused from Beta plat3->plat4 (DJ)
//   dash         gap 195, flat       — reused from Gamma plat4->plat5 (dash)
// The two "dummy" practice enemies use type:'patrol', range:0 — with a
// clamp range of zero they're shoved back to their origin the instant they'd
// move away from it, reusing plain Enemy code with zero new mechanics and
// reading as a stationary practice target rather than a real threat.
export const TUTORIAL_LEVEL = {
  id: 0,
  key: 'alpha', // no dimension of its own — reuses Alpha's palette/background/accent
  name: 'Addestramento',
  subtitle: 'Impara le basi',
  spawn: { x: 50, y: 400 },
  unlocksAfterClear: null,
  platforms: [
    { x: 0, y: 500, w: 260, h: 20 }, // station 1: move
    { x: 360, y: 450, w: 180, h: 20 }, // station 2: jump (gap 100, rise 50)
    { x: 691, y: 290, w: 150, h: 20 }, // station 3: double jump (gap 151, rise 160)
    { x: 1036, y: 290, w: 160, h: 20 }, // station 4: dash (flat gap 195)
    { x: 1276, y: 290, w: 260, h: 20 }, // station 5: ranged weapon dummy
    { x: 1636, y: 290, w: 260, h: 20 }, // station 6: melee weapon dummy
    { x: 1996, y: 290, w: 220, h: 20 }, // station 7: crystal + checkpoint
    { x: 2316, y: 290, w: 220, h: 20 } // station 8: goal
  ],
  collectibles: [
    { x: 2070, y: 260 }
  ],
  enemies: [
    { x: 1420, y: 260, w: 30, h: 30, vx: 1, range: 0, type: 'patrol' }, // ranged dummy
    { x: 1740, y: 260, w: 30, h: 30, vx: 1, range: 0, type: 'patrol' } // melee dummy
  ],
  hazards: [],
  checkpoints: [
    { x: 2020, y: 230 }
  ],
  goal: { x: 2450, y: 210 },
  // Custom field, read only by WorldRenderer.drawTutorialSign (see Game.render)
  // — every other level leaves this undefined, so it's fully additive and
  // inert everywhere else in the codebase.
  signs: [
    { x: 130, y: 370, icon: '🕹️', lines: ['MUOVITI', '◄ ► oppure A / D'] },
    { x: 230, y: 370, icon: '⬆️', lines: ['SALTA', 'SPAZIO per saltare'] },
    { x: 500, y: 320, icon: '🦘', lines: ['DOPPIO SALTO', 'Salta di nuovo in aria!'] },
    { x: 800, y: 160, icon: '💨', lines: ['SCATTO', 'MAIUSC per uno scatto rapido'] },
    { x: 1300, y: 160, icon: '🔫', lines: ['ARMA A DISTANZA', 'F (o J) per sparare'] },
    { x: 1660, y: 160, icon: '⚔️', lines: ['LAMA AL PLASMA', 'E (o L) per un fendente'] },
    { x: 2000, y: 160, icon: '💎', lines: ['CRISTALLI & CHECKPOINT', 'Raccogli e salva i progressi'] },
    { x: 2340, y: 160, icon: '🌀', lines: ['SEI PRONTO!', 'Entra nel portale finale'] }
  ]
};

export function getLevel(index) {
  if (index === 0) return TUTORIAL_LEVEL;
  return LEVELS[index - 1];
}
