import { loadJson, saveJson } from "../core/storage.js";
import { createInitialStock } from "../data/materials.js";

export const SAVE_KEY = "oddity_company_v2";
export const TICK_MS = 5000;
export const SUPPLY_COOLDOWN_MS = 60000;
export const MAX_PETS = 24;

export function createDefaultState() {
  return {
    version: 4,
    createdAt: new Date().toISOString(),
    points: 0,
    craftCount: 0,
    craftStats: {
      common: 0,
      rare: 0,
      weird: 0,
      hidden: 0,
    },
    careCount: 0,
    mats: createInitialStock(),
    labSlots: [null, null, null],
    pets: [],
    activePetId: null,
    dex: {},
    speciesCount: {},
    duplicateAbsorbCount: 0,
    tab: "nursery",
    mobilePane: "lab",
    soundOn: true,
    logs: ["[系统] 欢迎来到奇物公司。先拖材料进行研发。"],
    lastTickAt: Date.now(),
    lastSupplyAt: 0,
    unlockedHints: [],
    orders: [],
    completedOrderCount: 0,
    orderStreak: 0,
    lastOrderCompleteAt: 0,
  };
}

export function loadState() {
  const raw = loadJson(SAVE_KEY, createDefaultState);
  return migrateState(raw);
}

export function persistState(state) {
  saveJson(SAVE_KEY, state);
}

export function resetState() {
  const next = createDefaultState();
  persistState(next);
  return next;
}

export function appendLog(state, message) {
  const clock = new Date().toLocaleTimeString("zh-CN", { hour12: false });
  state.logs.unshift(`[${clock}] ${message}`);
  if (state.logs.length > 40) {
    state.logs.length = 40;
  }
}

function migrateState(source) {
  const base = createDefaultState();
  if (!source || typeof source !== "object") {
    return base;
  }

  const state = {
    ...base,
    ...source,
  };

  state.points = Number.isFinite(state.points) ? Math.max(0, Math.floor(state.points)) : 0;
  state.craftCount = Number.isFinite(state.craftCount)
    ? Math.max(0, Math.floor(state.craftCount))
    : Number.isFinite(source.tries)
      ? Math.max(0, Math.floor(source.tries))
      : 0;
  state.craftStats = {
    common: Number.isFinite(source?.craftStats?.common) ? Math.max(0, Math.floor(source.craftStats.common)) : 0,
    rare: Number.isFinite(source?.craftStats?.rare) ? Math.max(0, Math.floor(source.craftStats.rare)) : 0,
    weird: Number.isFinite(source?.craftStats?.weird) ? Math.max(0, Math.floor(source.craftStats.weird)) : 0,
    hidden: Number.isFinite(source?.craftStats?.hidden) ? Math.max(0, Math.floor(source.craftStats.hidden)) : 0,
  };
  state.careCount = Number.isFinite(source.careCount) ? Math.max(0, Math.floor(source.careCount)) : 0;

  state.mats = {
    ...createInitialStock(),
    ...(source.mats && typeof source.mats === "object" ? source.mats : {}),
  };

  state.labSlots = Array.isArray(source.labSlots)
    ? [source.labSlots[0] ?? null, source.labSlots[1] ?? null, source.labSlots[2] ?? null]
    : [null, null, null];

  state.pets = Array.isArray(source.pets)
    ? source.pets
        .filter((pet) => pet && typeof pet === "object")
        .map((pet) => ({
          ...pet,
          effects: Array.isArray(pet.effects)
            ? pet.effects.filter(
                (effect) =>
                  effect &&
                  typeof effect === "object" &&
                  typeof effect.id === "string" &&
                  Number.isFinite(effect.remaining),
              )
            : [],
        }))
    : [];

  state.dex = source.dex && typeof source.dex === "object" ? source.dex : {};
  state.speciesCount = source.speciesCount && typeof source.speciesCount === "object" ? source.speciesCount : {};
  state.duplicateAbsorbCount = Number.isFinite(source.duplicateAbsorbCount)
    ? Math.max(0, Math.floor(source.duplicateAbsorbCount))
    : 0;

  state.tab = source.tab === "dex" ? "dex" : "nursery";
  state.mobilePane = typeof source.mobilePane === "string" ? source.mobilePane : "lab";
  state.soundOn = typeof source.soundOn === "boolean" ? source.soundOn : true;

  state.logs = Array.isArray(source.logs)
    ? source.logs.filter((entry) => typeof entry === "string").slice(0, 40)
    : base.logs;

  state.lastTickAt = Number.isFinite(source.lastTickAt) ? source.lastTickAt : Date.now();
  state.lastSupplyAt = Number.isFinite(source.lastSupplyAt) ? source.lastSupplyAt : 0;

  state.unlockedHints = Array.isArray(source.unlockedHints)
    ? source.unlockedHints.filter((item) => typeof item === "string")
    : [];
  state.orders = Array.isArray(source.orders) ? source.orders.filter((item) => item && typeof item === "object") : [];
  state.completedOrderCount = Number.isFinite(source.completedOrderCount)
    ? Math.max(0, Math.floor(source.completedOrderCount))
    : 0;
  state.orderStreak = Number.isFinite(source.orderStreak) ? Math.max(0, Math.floor(source.orderStreak)) : 0;
  state.lastOrderCompleteAt = Number.isFinite(source.lastOrderCompleteAt) ? source.lastOrderCompleteAt : 0;

  if (!state.activePetId && state.pets[0]) {
    state.activePetId = state.pets[0].id;
  }

  if (state.activePetId && !state.pets.some((pet) => pet.id === state.activePetId)) {
    state.activePetId = state.pets[0]?.id ?? null;
  }

  return state;
}
