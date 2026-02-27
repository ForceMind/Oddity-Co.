import { clamp, randomFrom, uid } from "../core/utils.js";
import { RARITY_GROWTH_BONUS } from "../data/recipes.js";

const BASE_STATS = {
  satiety: 74,
  mood: 72,
  cleanliness: 70,
  energy: 68,
};

function jitter(value, spread = 10) {
  return clamp(Math.round(value + (Math.random() * 2 - 1) * spread), 45, 95);
}

export function createPetFromSpecies(species) {
  const eyeVariance = randomFrom([-1, 0, 0, 1]);
  const eyeCount = clamp((species.eyeBase ?? 2) + eyeVariance, 1, 5);

  return {
    id: uid("pet"),
    speciesId: species.id,
    name: species.name,
    rarity: species.rarity,
    desc: species.desc,
    stage: 1,
    growth: 0,
    ageTicks: 0,
    potential: RARITY_GROWTH_BONUS[species.rarity] ?? 1,
    stats: {
      satiety: jitter(BASE_STATS.satiety, 8),
      mood: jitter(BASE_STATS.mood, 8),
      cleanliness: jitter(BASE_STATS.cleanliness, 8),
      energy: jitter(BASE_STATS.energy, 8),
    },
    genes: {
      shape: species.shape,
      palette: species.palette,
      eyeCount,
      hornStyle: randomFrom(species.hornOptions ?? ["none"]),
      tailStyle: randomFrom(species.tailOptions ?? ["none"]),
      pattern: randomFrom(species.patternOptions ?? ["dot"]),
      wobbleSeed: Math.random() * 2 + 0.25,
      hueShift: Math.round((Math.random() * 2 - 1) * 10),
    },
    createdAt: new Date().toISOString(),
    note: species.desc,
  };
}
