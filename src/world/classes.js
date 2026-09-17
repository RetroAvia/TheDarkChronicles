// Character classes — chosen once at game start (MainMenu), applied by
// Game._applyClassBonuses. Deliberately a light-touch pick (one permanent,
// thematic head start each) rather than a full skill tree with a choice at
// every level-up: that fuller roguelite-style system is real future-round
// material, not something to bolt on half-finished here. Every other
// ability still unlocks progressively exactly as before, for every class.
export const CLASSES = [
  {
    id: 'tiratore',
    name: 'Tiratore',
    icon: '🔫',
    tagline: 'Fuoco a distanza fin da Alpha',
    description: "Il colpo a distanza è sempre attivo, non solo nell'arena finale: per chi preferisce colpire da lontano invece di rischiare il contatto."
  },
  {
    id: 'acrobata',
    name: 'Acrobata',
    icon: '🤸',
    tagline: 'Salto doppio e scatto già sbloccati',
    description: 'Parte con salto doppio e scatto già pronti fin dal primo livello: massima libertà di movimento per chi vuole esplorare ogni scorciatoia.'
  },
  {
    id: 'guardiano',
    name: 'Guardiano',
    icon: '🛡️',
    tagline: 'Un punto energia in più',
    description: 'Più resistente degli altri esploratori: un punto energia extra fin dall\'inizio, per chi preferisce incassare qualche colpo senza troppi pensieri.'
  }
];

export function getClass(id) {
  return CLASSES.find((c) => c.id === id) || null;
}
