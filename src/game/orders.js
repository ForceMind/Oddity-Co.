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
    return;
  }

  for (const order of completed) {
    completeOrder(state, order);
  }

  state.orders = state.orders.filter((order) => !completed.some((item) => item.id === order.id));
  syncOrders(state);
}

function completeOrder(state, order) {
  state.completedOrderCount = (state.completedOrderCount ?? 0) + 1;
  state.points += order.reward.points;

  for (const [materialId, amount] of Object.entries(order.reward.mats ?? {})) {
    state.mats[materialId] = (state.mats[materialId] ?? 0) + amount;
  }

  const matText = Object.entries(order.reward.mats ?? {})
    .map(([materialId, amount]) => `${materialName(materialId)} +${amount}`)
    .join("，");

  const rewardText = matText
    ? `奖励：研究点 +${order.reward.points}，${matText}`
    : `奖励：研究点 +${order.reward.points}`;

  appendLog(state, `订单完成「${order.label}」(${order.required}/${order.required})。${rewardText}`);
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
