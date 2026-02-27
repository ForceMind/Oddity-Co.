import { loadJson, saveJson } from "../core/storage.js";
import { createInitialStock } from "../data/materials.js";

export const SAVE_KEY = "oddity_company_v2";
export const TICK_MS = 5000;
export const SUPPLY_COOLDOWN_MS = 60000;
export const MAX_PETS = 24;

export function createDefaultState() {
  return {
    version: 2,
    createdAt: new Date().toISOString(),
    points: 0,
    craftCount: 0,
    mats: createInitialStock(),
    labSlots: [null, null, null],
    pets: [],
    activePetId: null,
    dex: {},
    tab: "nursery",
    logs: ["[系统] 欢迎来到奇物公司。先拖材料进行研发。"],
    lastTickAt: Date.now(),
    lastSupplyAt: 0,
    unlockedHints: [],
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

  state.mats = {
    ...createInitialStock(),
    ...(source.mats && typeof source.mats === "object" ? source.mats : {}),
  };

  state.labSlots = Array.isArray(source.labSlots)
    ? [source.labSlots[0] ?? null, source.labSlots[1] ?? null, source.labSlots[2] ?? null]
    : [null, null, null];

  state.pets = Array.isArray(source.pets)
    ? source.pets.filter((pet) => pet && typeof pet === "object")
    : [];

  state.dex = source.dex && typeof source.dex === "object" ? source.dex : {};

  state.tab = source.tab === "dex" ? "dex" : "nursery";

  state.logs = Array.isArray(source.logs)
    ? source.logs.filter((entry) => typeof entry === "string").slice(0, 40)
    : base.logs;

  state.lastTickAt = Number.isFinite(source.lastTickAt) ? source.lastTickAt : Date.now();
  state.lastSupplyAt = Number.isFinite(source.lastSupplyAt) ? source.lastSupplyAt : 0;

  state.unlockedHints = Array.isArray(source.unlockedHints)
    ? source.unlockedHints.filter((item) => typeof item === "string")
    : [];

  if (!state.activePetId && state.pets[0]) {
    state.activePetId = state.pets[0].id;
  }

  if (state.activePetId && !state.pets.some((pet) => pet.id === state.activePetId)) {
    state.activePetId = state.pets[0]?.id ?? null;
  }

  return state;
}
