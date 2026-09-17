export const PALETTES = {
  alpha: {
    platform: '#173a63', platformDark: '#0c1c33', platformEdge: '#00d4ff',
    crystal: '#00d4ff', crystalDark: '#0a4a66',
    enemy: '#8b5cf6', enemyDark: '#3a1e66', boss: '#ff3b3b',
    goal: '#00d4ff',
    suitLight: '#eaf6ff', suitDark: '#0e7ba8', accent: '#00d4ff', thruster: '#00d4ff'
  },
  beta: {
    platform: '#0f4a3c', platformDark: '#082720', platformEdge: '#00ff88',
    crystal: '#00ff88', crystalDark: '#0a5c3f',
    enemy: '#00d4ff', enemyDark: '#0a4a66', boss: '#ff3b3b',
    goal: '#00ff88',
    suitLight: '#eafff5', suitDark: '#0e8a63', accent: '#00ff88', thruster: '#00ffcc'
  },
  gamma: {
    platform: '#5c2a12', platformDark: '#2c1108', platformEdge: '#ff6b35',
    crystal: '#ff6b35', crystalDark: '#7a2f0e',
    enemy: '#ff0080', enemyDark: '#5c0033', boss: '#ff3b3b',
    goal: '#ff6b35',
    suitLight: '#fff0e6', suitDark: '#b8460f', accent: '#ff6b35', thruster: '#ff8a5c'
  },
  delta: {
    platform: '#5c5312', platformDark: '#2c2708', platformEdge: '#ffd23f',
    crystal: '#ffd23f', crystalDark: '#7a6a0e',
    enemy: '#00ffff', enemyDark: '#0a5c5c', boss: '#ff3b3b',
    goal: '#ffd23f',
    suitLight: '#fffbe6', suitDark: '#b89a0f', accent: '#ffd23f', thruster: '#fff08a'
  },
  epsilon: {
    platform: '#0c3a52', platformDark: '#061f2c', platformEdge: '#28c8ff',
    crystal: '#28c8ff', crystalDark: '#0a4a66',
    enemy: '#00ff88', enemyDark: '#0a5c3f', boss: '#ff3b3b',
    goal: '#28c8ff',
    suitLight: '#e6f8ff', suitDark: '#0e6ba8', accent: '#28c8ff', thruster: '#7be3ff'
  },
  zeta: {
    platform: '#2e0f52', platformDark: '#16072c', platformEdge: '#c15cff',
    crystal: '#c15cff', crystalDark: '#5c0e7a',
    enemy: '#ff0080', enemyDark: '#5c0033', boss: '#ff3b3b',
    goal: '#c15cff',
    suitLight: '#f6e6ff', suitDark: '#6a0e8a', accent: '#c15cff', thruster: '#e08aff'
  },
  eta: {
    platform: '#4a3a10', platformDark: '#241c08', platformEdge: '#ffe066',
    crystal: '#ffe066', crystalDark: '#7a6a0e',
    enemy: '#ff6b35', enemyDark: '#7a2f0e', boss: '#ff3b3b',
    goal: '#ffe066',
    suitLight: '#fffbe6', suitDark: '#b89a0f', accent: '#ffe066', thruster: '#fff2a8'
  },
  omega: {
    platform: '#4a1030', platformDark: '#220718', platformEdge: '#ff3b3b',
    crystal: '#ff3b3b', crystalDark: '#7a0e1e',
    enemy: '#8b5cf6', enemyDark: '#3a1e66', boss: '#ff3b3b',
    goal: '#ff3b3b',
    suitLight: '#ffe6ea', suitDark: '#8f0e28', accent: '#ff3b3b', thruster: '#ff5c7a'
  },
  // The boss-arena set-piece: a distinct sunken-cathedral look, not just a
  // darker filter over Omega's colors — swapped in wholesale (see Game.render)
  // for the whole time level.inBossArena is true.
  arena: {
    platform: '#241018', platformDark: '#0e0509', platformEdge: '#ff2d4a',
    crystal: '#ff3b3b', crystalDark: '#7a0e1e',
    enemy: '#8b5cf6', enemyDark: '#3a1e66', boss: '#ff2d4a',
    goal: '#ff3b3b',
    suitLight: '#ffe6ea', suitDark: '#8f0e28', accent: '#ff2d4a', thruster: '#ff5c7a'
  }
};

export function getPalette(key) {
  return PALETTES[key] || PALETTES.alpha;
}
