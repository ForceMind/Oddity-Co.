import { randomFrom, weightedPick } from "../core/utils.js";
import { MATERIALS, materialName } from "../data/materials.js";
import {
  FALLBACK_POOL,
  RECIPES,
  RARITY_POINT_REWARD,
  findRecipe,
  getSpecies,
  rarityLabel,
} from "../data/recipes.js";
import { createPetFromSpecies } from "./petFactory.js";
import { MAX_PETS, SUPPLY_COOLDOWN_MS, appendLog } from "./state.js";

export const HINT_COST = 10;

export function placeMaterialInLab(state, materialId, preferredSlot = null) {
  if ((state.mats[materialId] ?? 0) <= 0) {
    return { ok: false, reason: `${materialName(materialId)} 数量不足。` };
  }

  const slot = preferredSlot ?? state.labSlots.findIndex((item) => item === null);
  if (slot < 0 || slot >= state.labSlots.length) {
    return { ok: false, reason: "没有可用槽位。" };
  }

  if (state.labSlots[slot]) {
    return { ok: false, reason: "该槽位已被占用。" };
  }

  state.labSlots[slot] = materialId;
  state.mats[materialId] = (state.mats[materialId] ?? 0) - 1;
  return { ok: true };
}

export function removeMaterialFromLab(state, slotIndex) {
  const materialId = state.labSlots[slotIndex];
  if (!materialId) {
    return { ok: false, reason: "槽位为空。" };
  }

  state.labSlots[slotIndex] = null;
  state.mats[materialId] = (state.mats[materialId] ?? 0) + 1;
  return { ok: true };
}

export function clearLabSlots(state) {
  for (let idx = 0; idx < state.labSlots.length; idx += 1) {
    const materialId = state.labSlots[idx];
    if (!materialId) {
      continue;
    }
    state.mats[materialId] = (state.mats[materialId] ?? 0) + 1;
    state.labSlots[idx] = null;
  }
}

export function craftFromLab(state) {
  const used = state.labSlots.filter(Boolean);
  if (used.length < 2) {
    return { ok: false, reason: "至少放入 2 个材料才能创建奇物。" };
  }

  const recipe = findRecipe(used);
  const pool = recipe ? recipe.pool : FALLBACK_POOL;
  const picked = weightedPick(pool);
  const species = getSpecies(picked.speciesId);
  const pet = createPetFromSpecies(species);

  state.pets.unshift(pet);
  state.activePetId = pet.id;
  state.craftCount += 1;

  const isNew = !state.dex[species.id];
  if (isNew) {
    state.dex[species.id] = new Date().toISOString();
  }

  const reward = (RARITY_POINT_REWARD[species.rarity] ?? 2) + 1;
  state.points += reward;

  state.labSlots = [null, null, null];

  if (state.pets.length > MAX_PETS) {
    const removed = state.pets.pop();
    if (removed && removed.id === state.activePetId) {
      state.activePetId = state.pets[0]?.id ?? null;
    }
  }

  const recipeTitle = recipe ? `【${recipe.name}】` : "【未知配方】";
  const newTag = isNew ? " 新发现。" : "";
  appendLog(
    state,
    `${recipeTitle} 创建出 ${species.name}（${rarityLabel(species.rarity)}），获得 ${reward} 研究点。${newTag}`,
  );

  return {
    ok: true,
    recipe,
    pet,
    isNew,
  };
}

export function claimSupplyPack(state) {
  const remain = supplyCooldownRemaining(state);
  if (remain > 0) {
    return { ok: false, reason: `补给冷却中，还需 ${Math.ceil(remain / 1000)} 秒。` };
  }

  const packSize = 4 + Math.floor(Math.random() * 3);
  const gains = {};

  for (let i = 0; i < packSize; i += 1) {
    const material = randomFrom(MATERIALS);
    if (!material) {
      continue;
    }
    state.mats[material.id] = (state.mats[material.id] ?? 0) + 1;
    gains[material.id] = (gains[material.id] ?? 0) + 1;
  }

  state.lastSupplyAt = Date.now();

  const summary = Object.entries(gains)
    .map(([materialId, amount]) => `${materialName(materialId)} +${amount}`)
    .join("，");

  appendLog(state, `领取材料包：${summary}。`);
  return { ok: true, gains };
}

export function supplyCooldownRemaining(state, nowMs = Date.now()) {
  if (!state.lastSupplyAt) {
    return 0;
  }
  const elapsed = nowMs - state.lastSupplyAt;
  return Math.max(0, SUPPLY_COOLDOWN_MS - elapsed);
}

export function unlockRecipeHint(state) {
  const locked = RECIPES.filter((recipe) => !state.unlockedHints.includes(recipe.key));
  if (locked.length === 0) {
    return { ok: false, reason: "全部配方情报已解锁。" };
  }

  if (state.points < HINT_COST) {
    return { ok: false, reason: `研究点不足，需要 ${HINT_COST} 点。` };
  }

  state.points -= HINT_COST;
  const target = randomFrom(locked);
  state.unlockedHints.push(target.key);

  appendLog(state, `购买配方情报：${target.name} -> ${target.hint}`);
  return { ok: true, recipe: target };
}
