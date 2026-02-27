import { uid } from "../core/utils.js";
import { MATERIALS, materialName } from "../data/materials.js";
import { ACTIVE_ORDER_LIMIT, ORDER_TEMPLATES } from "../data/orders.js";
import { appendLog } from "./state.js";

export function syncOrders(state) {
  state.orders = Array.isArray(state.orders) ? state.orders : [];
  while (state.orders.length < ACTIVE_ORDER_LIMIT) {
    const next = createOrder(state);
    if (!next) {
      break;
    }
    state.orders.push(next);
  }
}

export function evaluateOrders(state) {
  syncOrders(state);

  const completed = [];
  for (const order of state.orders) {
    order.progress = calcOrderProgress(state, order);
    if (order.progress >= order.required) {
      completed.push(order);
    }
  }

  if (!completed.length) {
    return { completed: 0, comboBonus: 0 };
  }

  let totalComboBonus = 0;
  for (const order of completed) {
    totalComboBonus += completeOrder(state, order);
  }

  state.orders = state.orders.filter((order) => !completed.some((item) => item.id === order.id));
  syncOrders(state);
  return { completed: completed.length, comboBonus: totalComboBonus };
}

function completeOrder(state, order) {
  const now = Date.now();
  const windowMs = 180000;
  if (state.lastOrderCompleteAt > 0 && now - state.lastOrderCompleteAt <= windowMs) {
    state.orderStreak = (state.orderStreak ?? 0) + 1;
  } else {
    state.orderStreak = 1;
  }
  state.lastOrderCompleteAt = now;

  const comboRate = Math.min(0.8, Math.max(0, state.orderStreak - 1) * 0.2);
  const comboBonus = Math.floor(order.reward.points * comboRate);

  state.completedOrderCount = (state.completedOrderCount ?? 0) + 1;
  state.points += order.reward.points + comboBonus;

  for (const [materialId, amount] of Object.entries(order.reward.mats ?? {})) {
    state.mats[materialId] = (state.mats[materialId] ?? 0) + amount;
  }

  const matText = Object.entries(order.reward.mats ?? {})
    .map(([materialId, amount]) => `${materialName(materialId)} +${amount}`)
    .join("，");

  const pointText = comboBonus > 0
    ? `研究点 +${order.reward.points}（连击加成 +${comboBonus}）`
    : `研究点 +${order.reward.points}`;
  const rewardText = matText
    ? `奖励：${pointText}，${matText}`
    : `奖励：${pointText}`;

  appendLog(state, `订单完成「${order.label}」(${order.required}/${order.required})。${rewardText}`);
  return comboBonus;
}

function createOrder(state) {
  const activeTemplateIds = new Set((state.orders ?? []).map((order) => order.templateId));
  const templatePool = ORDER_TEMPLATES.filter((template) => !activeTemplateIds.has(template.id));
  const pool = templatePool.length ? templatePool : ORDER_TEMPLATES;
  if (!pool.length) {
    return null;
  }

  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  for (const template of shuffled) {
    const created = createOrderFromTemplate(state, template);
    if (created) {
      return created;
    }
  }
  return null;
}

function createOrderFromTemplate(state, template) {
  const tier = Math.floor((state.completedOrderCount ?? 0) / 2);
  const currentProgress = calcProgressByType(state, template.type);

  const requiredRaw = template.base + template.growth * tier;
  const requiredFromTier = template.cap ? Math.min(template.cap, requiredRaw) : requiredRaw;
  const required = Math.max(requiredFromTier, currentProgress + 1);

  if (template.cap && required > template.cap) {
    return null;
  }

  const points = template.rewardPoints + tier * 2;
  const mats = randomMatRewards(2 + Math.floor(Math.random() * 2));

  return {
    id: uid("ord"),
    templateId: template.id,
    label: template.label,
    description: template.description.replace("{required}", String(required)),
    type: template.type,
    required,
    progress: currentProgress,
    reward: {
      points,
      mats,
    },
  };
}

function calcOrderProgress(state, order) {
  return calcProgressByType(state, order.type);
}

function calcProgressByType(state, type) {
  if (type === "craft_count") {
    return state.craftCount ?? 0;
  }

  if (type === "dex_count") {
    return Object.keys(state.dex ?? {}).length;
  }

  if (type === "max_stage") {
    return state.pets.reduce((max, pet) => Math.max(max, pet.stage ?? 1), 0);
  }

  if (type === "healthy_pet_count") {
    return state.pets.filter((pet) => averagePetStats(pet) >= 72).length;
  }

  if (type === "high_rarity_craft_count") {
    const stats = state.craftStats ?? {};
    return (stats.rare ?? 0) + (stats.weird ?? 0) + (stats.hidden ?? 0);
  }

  if (type === "care_count") {
    return state.careCount ?? 0;
  }

  return 0;
}

function averagePetStats(pet) {
  const stats = pet.stats ?? {};
  const values = [stats.satiety ?? 0, stats.mood ?? 0, stats.cleanliness ?? 0, stats.energy ?? 0];
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function randomMatRewards(maxItems) {
  const result = {};
  const draws = 1 + Math.floor(Math.random() * maxItems);

  for (let i = 0; i < draws; i += 1) {
    const material = MATERIALS[Math.floor(Math.random() * MATERIALS.length)];
    if (!material) {
      continue;
    }
    const amount = 1 + Math.floor(Math.random() * 2);
    result[material.id] = (result[material.id] ?? 0) + amount;
  }

  return result;
}
