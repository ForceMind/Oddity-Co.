import { clamp } from "../core/utils.js";
import { SHOP_ITEMS } from "../data/shop.js";
import { appendLog } from "./state.js";

const ITEM_BY_ID = Object.fromEntries(SHOP_ITEMS.map((item) => [item.id, item]));

export function listShopItems() {
  return SHOP_ITEMS;
}

export function useShopItem(state, petId, itemId) {
  const pet = state.pets.find((item) => item.id === petId);
  if (!pet) {
    return { ok: false, reason: "没有可使用道具的奇物。" };
  }

  const item = ITEM_BY_ID[itemId];
  if (!item) {
    return { ok: false, reason: "未知道具。" };
  }

  if (state.points < item.cost) {
    return { ok: false, reason: `研究点不足，需要 ${item.cost} 点。` };
  }

  state.points -= item.cost;

  for (const key of ["satiety", "mood", "cleanliness", "energy"]) {
    if (!Number.isFinite(item.effects[key])) {
      continue;
    }
    pet.stats[key] = clamp((pet.stats[key] ?? 0) + item.effects[key], 0, 100);
  }

  pet.growth += item.growthGain ?? 0;
  appendLog(state, `${pet.name} 使用「${item.name}」。`);
  return { ok: true, item };
}
