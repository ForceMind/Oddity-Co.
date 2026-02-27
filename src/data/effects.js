export const EFFECT_DEFS = {
  hyper: {
    id: "hyper",
    name: "亢奋",
    tag: "正向",
    duration: 9,
    chance: 0.06,
    condition(pet) {
      return (pet.stats.mood ?? 0) > 80;
    },
    statDelta: { energy: -0.5, mood: 0.8 },
    growthMult: 1.24,
  },
  bloated: {
    id: "bloated",
    name: "胀气",
    tag: "负向",
    duration: 10,
    chance: 0.08,
    condition(pet) {
      return (pet.stats.satiety ?? 0) > 90;
    },
    statDelta: { mood: -1.6, satiety: -0.7, energy: -0.4 },
    growthMult: 0.7,
  },
  grimy: {
    id: "grimy",
    name: "粘污",
    tag: "负向",
    duration: 12,
    chance: 0.09,
    condition(pet) {
      return (pet.stats.cleanliness ?? 0) < 28;
    },
    statDelta: { mood: -1.4, cleanliness: -0.7 },
    growthMult: 0.74,
  },
  starving: {
    id: "starving",
    name: "饥饿躁动",
    tag: "负向",
    duration: 10,
    chance: 0.08,
    condition(pet) {
      return (pet.stats.satiety ?? 0) < 20;
    },
    statDelta: { mood: -1.2, energy: -1.8 },
    growthMult: 0.58,
  },
  resonance: {
    id: "resonance",
    name: "共振态",
    tag: "正向",
    duration: 10,
    chance: 0.025,
    condition(pet) {
      const { satiety = 0, mood = 0, cleanliness = 0, energy = 0 } = pet.stats;
      return pet.stage >= 4 && satiety > 70 && mood > 70 && cleanliness > 70 && energy > 70;
    },
    statDelta: { mood: 0.8, energy: 0.4 },
    growthMult: 1.55,
  },
};

export const EFFECT_TRIGGER_ORDER = ["bloated", "grimy", "starving", "hyper", "resonance"];

export function getEffectDef(effectId) {
  return EFFECT_DEFS[effectId] ?? null;
}
