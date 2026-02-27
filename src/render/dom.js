import { formatRelativeTicks, toPercent } from "../core/utils.js";
import { MATERIALS, materialName } from "../data/materials.js";
import { getSynthesisPaths, getSpecies, rarityLabel, RECIPES } from "../data/recipes.js";
import { listShopItems } from "../game/economy.js";
import { HINT_COST, supplyCooldownRemaining } from "../game/crafting.js";
import {
  CARE_ACTIONS,
  averageCondition,
  getActivePet,
  growthProgress,
  listPetEffects,
} from "../game/simulation.js";
import { getStage } from "../data/stages.js";

export function initDom(handlers) {
  const refs = {
    statPoints: byId("statPoints"),
    statCrafts: byId("statCrafts"),
    statDex: byId("statDex"),
    statOrders: byId("statOrders"),
    btnSound: byId("btnSound"),
    materials: byId("materials"),
    labSlots: Array.from(document.querySelectorAll(".slot")),
    btnCraft: byId("btnCraft"),
    btnClear: byId("btnClear"),
    btnReset: byId("btnReset"),
    btnSupply: byId("btnSupply"),
    btnHint: byId("btnHint"),
    supplyHint: byId("supplyHint"),
    hintBoard: byId("hintBoard"),
    activeMeta: byId("activeMeta"),
    activeName: byId("activeName"),
    activeRarity: byId("activeRarity"),
    stageName: byId("stageName"),
    growthValue: byId("growthValue"),
    growthMeter: byId("growthMeter"),
    meterSatiety: byId("meterSatiety"),
    meterMood: byId("meterMood"),
    meterCleanliness: byId("meterCleanliness"),
    meterEnergy: byId("meterEnergy"),
    valueSatiety: byId("valueSatiety"),
    valueMood: byId("valueMood"),
    valueCleanliness: byId("valueCleanliness"),
    valueEnergy: byId("valueEnergy"),
    effectList: byId("effectList"),
    careActions: byId("careActions"),
    shopActions: byId("shopActions"),
    tabs: Array.from(document.querySelectorAll(".tab")),
    collectionList: byId("collectionList"),
    orderBoard: byId("orderBoard"),
    eventLog: byId("eventLog"),
    petCanvas: byId("petCanvas"),
    mobileTabs: Array.from(document.querySelectorAll(".mobile-tab")),
    panes: {
      lab: byId("paneLab"),
      pet: byId("panePet"),
      collection: byId("paneCollection"),
      manage: byId("paneManage"),
    },
  };

  refs.btnCraft.addEventListener("click", handlers.onCraft);
  refs.btnClear.addEventListener("click", handlers.onClearSlots);
  refs.btnReset.addEventListener("click", handlers.onReset);
  refs.btnSupply.addEventListener("click", handlers.onClaimSupply);
  refs.btnHint.addEventListener("click", handlers.onUnlockHint);
  refs.btnSound.addEventListener("click", handlers.onToggleSound);

  refs.materials.addEventListener("click", (event) => {
    const target = event.target.closest("[data-material-id]");
    if (!target) {
      return;
    }
    handlers.onMaterialSelect(target.dataset.materialId);
  });

  refs.materials.addEventListener("dragstart", (event) => {
    const target = event.target.closest("[data-material-id]");
    if (!target || !event.dataTransfer) {
      return;
    }
    event.dataTransfer.setData("text/plain", target.dataset.materialId ?? "");
  });

  refs.labSlots.forEach((slotElement) => {
    slotElement.addEventListener("click", () => {
      handlers.onSlotClick(Number(slotElement.dataset.slot));
    });

    slotElement.addEventListener("dragover", (event) => {
      event.preventDefault();
      slotElement.classList.add("dragover");
    });

    slotElement.addEventListener("dragleave", () => {
      slotElement.classList.remove("dragover");
    });

    slotElement.addEventListener("drop", (event) => {
      event.preventDefault();
      slotElement.classList.remove("dragover");
      const materialId = event.dataTransfer?.getData("text/plain");
      if (!materialId) {
        return;
      }
      handlers.onMaterialDrop(materialId, Number(slotElement.dataset.slot));
    });
  });

  refs.tabs.forEach((tabButton) => {
    tabButton.addEventListener("click", () => {
      handlers.onTabChange(tabButton.dataset.tab);
    });
  });

  refs.mobileTabs.forEach((tabButton) => {
    tabButton.addEventListener("click", () => {
      handlers.onMobilePaneChange(tabButton.dataset.pane);
    });
  });

  refs.collectionList.addEventListener("click", (event) => {
    const target = event.target.closest("[data-pet-id]");
    if (!target) {
      return;
    }
    handlers.onSelectPet(target.dataset.petId);
  });

  refs.careActions.addEventListener("click", (event) => {
    const target = event.target.closest("[data-action-id]");
    if (!target) {
      return;
    }
    handlers.onCareAction(target.dataset.actionId);
  });

  refs.shopActions.addEventListener("click", (event) => {
    const target = event.target.closest("[data-shop-id]");
    if (!target) {
      return;
    }
    handlers.onUseShopItem(target.dataset.shopId);
  });

  renderCareActions(refs.careActions);
  renderShopActions(refs.shopActions);
  return refs;
}

export function renderAll(state, refs) {
  renderStats(state, refs);
  renderSoundState(state, refs);
  renderMaterials(state, refs);
  renderLabSlots(state, refs);
  renderActivePet(state, refs);
  renderCollection(state, refs);
  renderOrders(state, refs);
  renderTabs(state, refs);
  renderLog(state, refs);
  renderSupply(state, refs);
  renderHints(state, refs);
  renderMobilePane(state, refs);
}

export function renderPassive(state, refs) {
  renderSupply(state, refs);
  renderMobilePane(state, refs);
}

export function flashPane(refs, paneKey) {
  const pane = refs.panes?.[paneKey];
  if (!pane) {
    return;
  }
  pane.classList.remove("flash");
  window.requestAnimationFrame(() => {
    pane.classList.add("flash");
    setTimeout(() => pane.classList.remove("flash"), 520);
  });
}

function renderStats(state, refs) {
  refs.statPoints.textContent = String(state.points);
  refs.statCrafts.textContent = String(state.craftCount);
  refs.statDex.textContent = String(Object.keys(state.dex).length);
  refs.statOrders.textContent = String(state.completedOrderCount ?? 0);
}

function renderSoundState(state, refs) {
  refs.btnSound.textContent = `音效：${state.soundOn ? "开" : "关"}`;
}

function renderMaterials(state, refs) {
  refs.materials.innerHTML = "";
  for (const material of MATERIALS) {
    const count = state.mats[material.id] ?? 0;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "material";
    button.draggable = true;
    button.dataset.materialId = material.id;
    button.dataset.type = material.id;
    button.disabled = count <= 0;
    button.innerHTML = `
      <div class="top">
        <span class="name">${material.name}</span>
        <span class="tag">${material.tag}</span>
      </div>
      <span class="count">库存: ${count}</span>
    `;
    refs.materials.appendChild(button);
  }
}

function renderLabSlots(state, refs) {
  refs.labSlots.forEach((slotElement, idx) => {
    const materialId = state.labSlots[idx];
    if (!materialId) {
      slotElement.innerHTML = idx === 2 ? "放置材料 3（可选）" : `放置材料 ${idx + 1}`;
      return;
    }
    slotElement.innerHTML = `
      <span class="slot-name">${materialName(materialId)}</span>
      <span class="slot-meta">点击移除</span>
    `;
  });
}

function renderActivePet(state, refs) {
  const pet = getActivePet(state);

  if (!pet) {
    refs.activeMeta.textContent = "暂无奇物，先去研发台创建一个。";
    refs.activeName.textContent = "未选择";
    refs.activeRarity.textContent = "-";
    refs.activeRarity.className = "";
    refs.stageName.textContent = "阶段：-";
    refs.growthValue.textContent = "0%";
    setMeter(refs.growthMeter, 0);
    renderStatMeter(refs.meterSatiety, refs.valueSatiety, 0);
    renderStatMeter(refs.meterMood, refs.valueMood, 0);
    renderStatMeter(refs.meterCleanliness, refs.valueCleanliness, 0);
    renderStatMeter(refs.meterEnergy, refs.valueEnergy, 0);
    refs.effectList.innerHTML = "";
    setButtonsDisabled(refs.careActions, true);
    setButtonsDisabled(refs.shopActions, true);
    return;
  }

  refs.activeMeta.textContent = `${pet.desc} · 年龄 ${formatRelativeTicks(pet.ageTicks)} · 平均状态 ${Math.round(averageCondition(pet))}`;
  refs.activeName.textContent = pet.name;
  refs.activeRarity.textContent = `${rarityLabel(pet.rarity)} | 第 ${pet.stage} 阶段`;
  refs.activeRarity.className = `rarity ${pet.rarity}`;

  const stage = getStage(pet.stage);
  const growth = growthProgress(pet);
  refs.stageName.textContent = `阶段：${stage.name}`;
  refs.growthValue.textContent = growth.text;
  setMeter(refs.growthMeter, growth.percent);

  renderStatMeter(refs.meterSatiety, refs.valueSatiety, pet.stats.satiety ?? 0);
  renderStatMeter(refs.meterMood, refs.valueMood, pet.stats.mood ?? 0);
  renderStatMeter(refs.meterCleanliness, refs.valueCleanliness, pet.stats.cleanliness ?? 0);
  renderStatMeter(refs.meterEnergy, refs.valueEnergy, pet.stats.energy ?? 0);

  renderEffectList(refs.effectList, pet);
  setButtonsDisabled(refs.careActions, false);
  setButtonsDisabled(refs.shopActions, false);
}

function renderEffectList(container, pet) {
  const effects = listPetEffects(pet);
  if (!effects.length) {
    container.innerHTML = `<span class="effect-chip">状态稳定</span>`;
    return;
  }

  container.innerHTML = "";
  for (const effect of effects) {
    const chip = document.createElement("span");
    chip.className = `effect-chip ${effect.tag === "负向" ? "negative" : ""}`;
    chip.textContent = `${effect.name} ${effect.remaining}刻`;
    container.appendChild(chip);
  }
}

function renderCollection(state, refs) {
  refs.collectionList.innerHTML = "";

  if (state.tab === "nursery") {
    if (state.pets.length === 0) {
      refs.collectionList.innerHTML = `<div class="empty-note">育成仓为空。先合成并培养一个奇物吧。</div>`;
      return;
    }

    for (const pet of state.pets) {
      const sampleCount = state.speciesCount?.[pet.speciesId] ?? 1;
      const card = document.createElement("button");
      card.type = "button";
      card.className = "collection-item";
      if (pet.id === state.activePetId) {
        card.classList.add("active");
      }
      card.dataset.petId = pet.id;
      card.innerHTML = `
        <span class="name">${pet.name}</span>
        <span class="rarity ${pet.rarity}">${rarityLabel(pet.rarity)}</span>
        <span class="meta">阶段：${getStage(pet.stage).name} | 平均状态：${Math.round(averageCondition(pet))}</span>
        <span class="meta">样本数：${sampleCount} | 同种共鸣：${Math.max(0, sampleCount - 1)}</span>
      `;
      refs.collectionList.appendChild(card);
    }
    return;
  }

  const discovered = Object.entries(state.dex).sort((a, b) => (a[1] ?? "").localeCompare(b[1] ?? ""));
  if (discovered.length === 0) {
    refs.collectionList.innerHTML = `<div class="empty-note">图鉴还没有记录，继续研发解锁新物种。</div>`;
    return;
  }

  for (const [speciesId, firstSeenAt] of discovered) {
    const species = getSpecies(speciesId);
    const paths = getSynthesisPaths(speciesId).map((item) => item.text).join(" / ") || "未知";
    const discoveredCount = state.speciesCount?.[speciesId] ?? 1;

    const card = document.createElement("div");
    card.className = "collection-item";
    card.innerHTML = `
      <span class="name">${species.name}</span>
      <span class="rarity ${species.rarity}">${rarityLabel(species.rarity)}</span>
      <span class="meta">首次发现：${formatDate(firstSeenAt)}</span>
      <span class="meta">发现次数：${discoveredCount}</span>
      <span class="meta">合成路径：${paths}</span>
      <span class="meta">${species.desc}</span>
    `;
    refs.collectionList.appendChild(card);
  }
}

function renderOrders(state, refs) {
  refs.orderBoard.innerHTML = "";
  const summary = document.createElement("div");
  summary.className = "empty-note";
  summary.textContent = `当前订单连击：${state.orderStreak ?? 0}`;
  refs.orderBoard.appendChild(summary);

  if (!Array.isArray(state.orders) || state.orders.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-note";
    empty.textContent = "暂无订单，稍后会自动生成。";
    refs.orderBoard.appendChild(empty);
    return;
  }

  for (const order of state.orders) {
    const card = document.createElement("div");
    card.className = "order-card";

    const progress = Math.max(0, Math.floor(order.progress ?? 0));
    const required = Math.max(1, Math.floor(order.required ?? 1));
    const percent = Math.max(0, Math.min(100, (progress / required) * 100));
    const matReward = Object.entries(order.reward?.mats ?? {})
      .map(([materialId, amount]) => `${materialName(materialId)} +${amount}`)
      .join("，");

    card.innerHTML = `
      <div class="title">${order.label}</div>
      <div class="desc">${order.description}</div>
      <div class="order-progress">
        <div class="meter"><i style="width:${percent}%"></i></div>
        <b>${Math.min(progress, required)} / ${required}</b>
      </div>
      <div class="reward">奖励：研究点 +${order.reward?.points ?? 0}${matReward ? `，${matReward}` : ""}</div>
    `;
    refs.orderBoard.appendChild(card);
  }
}

function renderTabs(state, refs) {
  refs.tabs.forEach((tabButton) => {
    tabButton.classList.toggle("active", tabButton.dataset.tab === state.tab);
  });
}

function renderLog(state, refs) {
  refs.eventLog.innerHTML = "";
  if (!state.logs.length) {
    refs.eventLog.innerHTML = "<p>暂无日志。</p>";
    return;
  }

  for (const line of state.logs.slice(0, 24)) {
    const p = document.createElement("p");
    p.textContent = line;
    refs.eventLog.appendChild(p);
  }
}

function renderSupply(state, refs) {
  const remainMs = supplyCooldownRemaining(state);
  if (remainMs <= 0) {
    refs.supplyHint.textContent = "材料包可领取";
    return;
  }
  refs.supplyHint.textContent = `材料包冷却：${Math.ceil(remainMs / 1000)} 秒`;
}

function renderHints(state, refs) {
  if (!state.unlockedHints.length) {
    refs.hintBoard.textContent = `未解锁配方情报。可花 ${HINT_COST} 研究点购买一条。`;
    return;
  }

  const lines = RECIPES.filter((recipe) => state.unlockedHints.includes(recipe.key)).map(
    (recipe) => `${recipe.name}: ${recipe.hint}`,
  );

  refs.hintBoard.innerHTML = lines.map((line) => `<div>${line}</div>`).join("");
}

function renderMobilePane(state, refs) {
  const mobile = window.matchMedia("(max-width: 860px)").matches;
  document.body.classList.toggle("mobile-mode", mobile);

  if (!mobile) {
    Object.values(refs.panes).forEach((pane) => pane.classList.remove("active"));
    refs.mobileTabs.forEach((tab) => tab.classList.remove("active"));
    return;
  }

  const pane = refs.panes[state.mobilePane] ? state.mobilePane : "lab";
  Object.entries(refs.panes).forEach(([key, element]) => {
    element.classList.toggle("active", key === pane);
  });

  refs.mobileTabs.forEach((tabButton) => {
    tabButton.classList.toggle("active", tabButton.dataset.pane === pane);
  });
}

function renderCareActions(container) {
  container.innerHTML = "";
  for (const action of CARE_ACTIONS) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.actionId = action.id;
    button.innerHTML = `
      <span class="main">${action.label}</span>
      <span class="sub">${action.summary}</span>
    `;
    container.appendChild(button);
  }
}

function renderShopActions(container) {
  container.innerHTML = "";
  for (const item of listShopItems()) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.shopId = item.id;
    button.innerHTML = `
      <span class="main">${item.name}</span>
      <span class="sub">${item.desc} · ${item.cost} 点</span>
    `;
    container.appendChild(button);
  }
}

function setButtonsDisabled(container, disabled) {
  container.querySelectorAll("button").forEach((button) => {
    button.disabled = disabled;
  });
}

function renderStatMeter(meterElement, valueElement, value) {
  const normalized = Math.round(value);
  setMeter(meterElement, normalized);
  valueElement.textContent = String(normalized);
}

function setMeter(target, value) {
  target.style.width = `${toPercent(value, 100)}%`;
}

function byId(id) {
  const node = document.getElementById(id);
  if (!node) {
    throw new Error(`Missing required element: ${id}`);
  }
  return node;
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "未知";
  }
  return date.toLocaleString("zh-CN", { hour12: false });
}
