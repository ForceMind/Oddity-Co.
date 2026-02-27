import { average, clamp } from "../core/utils.js";
import { getStage, MAX_STAGE } from "../data/stages.js";
import { RARITY_POINT_REWARD } from "../data/recipes.js";
import { appendLog } from "./state.js";

const STAT_KEYS = ["satiety", "mood", "cleanliness", "energy"];

const DECAY_PER_TICK = {
  satiety: 1.8,
  mood: 1.3,
  cleanliness: 1.2,
  energy: 1.5,
};

export const CARE_ACTIONS = [
  {
    id: "feed",
    label: "喂食",
    summary: "饱腹 +24，心情 +4",
    effects: { satiety: 24, mood: 4, cleanliness: -4, energy: 1 },
    cost: 0,
    growthBoost: 4,
  },
  {
    id: "play",
    label: "互动",
    summary: "心情 +22，体力 -8",
    effects: { satiety: -6, mood: 22, cleanliness: -5, energy: -8 },
    cost: 0,
    growthBoost: 6,
  },
  {
    id: "clean",
    label: "清洁",
    summary: "清洁 +30，心情 +2",
    effects: { satiety: -4, mood: 2, cleanliness: 30, energy: -3 },
    cost: 0,
    growthBoost: 3,
  },
  {
    id: "rest",
    label: "休息",
    summary: "体力 +28，心情 +5",
    effects: { satiety: -7, mood: 5, cleanliness: -2, energy: 28 },
    cost: 0,
    growthBoost: 5,
  },
  {
    id: "stabilize",
    label: "稳定激发",
    summary: "消耗 6 点，四维 +12",
    effects: { satiety: 12, mood: 12, cleanliness: 12, energy: 12 },
    cost: 6,
    growthBoost: 12,
  },
];

const ACTION_BY_ID = Object.fromEntries(CARE_ACTIONS.map((item) => [item.id, item]));

export function getPetById(state, petId) {
  return state.pets.find((pet) => pet.id === petId) ?? null;
}

export function getActivePet(state) {
  if (!state.activePetId) {
    return null;
  }
  return getPetById(state, state.activePetId);
}

export function applyCareAction(state, petId, actionId) {
  const pet = getPetById(state, petId);
  if (!pet) {
    return { ok: false, reason: "当前没有可照料的奇物。" };
  }

  const action = ACTION_BY_ID[actionId];
  if (!action) {
    return { ok: false, reason: "未知照料动作。" };
  }

  if (action.cost > 0 && state.points < action.cost) {
    return { ok: false, reason: `研究点不足，需要 ${action.cost} 点。` };
  }

  state.points -= action.cost;
  for (const key of STAT_KEYS) {
    const current = pet.stats[key] ?? 50;
    pet.stats[key] = clamp(current + (action.effects[key] ?? 0), 0, 100);
  }
  pet.growth += action.growthBoost;

  appendLog(state, `${pet.name} 执行「${action.label}」。`);
  return { ok: true };
}

export function applyTicks(state, ticks) {
  const appliedTicks = Math.max(0, Math.floor(ticks));
  if (appliedTicks <= 0 || state.pets.length === 0) {
    return;
  }

  for (const pet of state.pets) {
    const stageFactor = 1 + (pet.stage - 1) * 0.12;
    for (const key of STAT_KEYS) {
      const decay = DECAY_PER_TICK[key] * stageFactor * appliedTicks;
      pet.stats[key] = clamp((pet.stats[key] ?? 50) - decay, 0, 100);
    }

    pet.ageTicks += appliedTicks;

    const values = STAT_KEYS.map((key) => pet.stats[key] ?? 0);
    const avg = average(values);
    const min = Math.min(...values);

    let growthGain = appliedTicks * pet.potential * (0.45 + avg / 100);
    if (min < 35) {
      growthGain *= 0.6;
    }
    if (min < 20) {
      growthGain *= 0.45;
    }
    if (min <= 5) {
      growthGain *= 0.2;
    }

    pet.growth += growthGain;

    while (pet.stage < MAX_STAGE) {
      const requirement = growthRequirement(pet.stage);
      if (pet.growth < requirement) {
        break;
      }
      pet.growth -= requirement;
      pet.stage += 1;

      for (const key of STAT_KEYS) {
        pet.stats[key] = clamp((pet.stats[key] ?? 50) + 8, 0, 100);
      }

      const reward = 6 + (RARITY_POINT_REWARD[pet.rarity] ?? 2);
      state.points += reward;
      appendLog(state, `${pet.name} 进化到「${getStage(pet.stage).name}」，获得 ${reward} 研究点。`);
    }
  }
}

export function growthProgress(pet) {
  if (!pet) {
    return { percent: 0, text: "0%" };
  }
  if (pet.stage >= MAX_STAGE) {
    return { percent: 100, text: "MAX" };
  }
  const requirement = growthRequirement(pet.stage);
  const percent = clamp((pet.growth / requirement) * 100, 0, 100);
  return { percent, text: `${Math.round(percent)}%` };
}

export function averageCondition(pet) {
  if (!pet) {
    return 0;
  }
  return average([pet.stats.satiety, pet.stats.mood, pet.stats.cleanliness, pet.stats.energy]);
}

function growthRequirement(stageLevel) {
  const stage = getStage(stageLevel);
  return stage.requiredGrowth > 0 ? stage.requiredGrowth : Infinity;
}
