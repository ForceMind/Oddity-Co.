import {
  craftFromLab,
  claimSupplyPack,
  clearLabSlots,
  placeMaterialInLab,
  removeMaterialFromLab,
  unlockRecipeHint,
} from "./game/crafting.js";
import { useShopItem } from "./game/economy.js";
import { evaluateOrders, syncOrders } from "./game/orders.js";
import { applyCareAction, applyTicks, getActivePet } from "./game/simulation.js";
import { TICK_MS, appendLog, loadState, persistState, resetState } from "./game/state.js";
import { flashPane, initDom, renderAll, renderPassive } from "./render/dom.js";
import { PetPainter } from "./render/petPainter.js";
import { SoundEngine } from "./render/sound.js";

let state = loadState();
syncOrders(state);

const sound = new SoundEngine({ effects: state.soundOn, bgm: state.bgmOn });
const refs = initDom({
  onMaterialSelect: handleMaterialSelect,
  onMaterialDrop: handleMaterialDrop,
  onSlotClick: handleSlotClick,
  onCraft: handleCraft,
  onClearSlots: handleClearSlots,
  onReset: handleReset,
  onClaimSupply: handleClaimSupply,
  onUnlockHint: handleUnlockHint,
  onTabChange: handleTabChange,
  onCompanySectionChange: handleCompanySectionChange,
  onSelectPet: handleSelectPet,
  onCareAction: handleCareAction,
  onUseShopItem: handleUseShopItem,
  onMobilePaneChange: handleMobilePaneChange,
  onToggleSound: handleToggleSound,
  onToggleBgm: handleToggleBgm,
});

const painter = new PetPainter(refs.petCanvas);

recoverOfflineProgress();
commit();

setInterval(() => {
  const tickSummary = stepByClock();
  if (tickSummary) {
    commit({ tickSummary });
    return;
  }
  renderPassive(state, refs);
}, 1000);

window.addEventListener("beforeunload", () => {
  persistState(state);
  sound.dispose();
});

requestAnimationFrame(function animate(timeMs) {
  painter.render(getActivePet(state), timeMs);
  requestAnimationFrame(animate);
});

function handleMaterialSelect(materialId) {
  const result = placeMaterialInLab(state, materialId);
  if (!result.ok) {
    appendLog(state, result.reason);
  }
  commit();
}

function handleMaterialDrop(materialId, slotIndex) {
  const result = placeMaterialInLab(state, materialId, slotIndex);
  if (!result.ok) {
    appendLog(state, result.reason);
  }
  commit();
}

function handleSlotClick(slotIndex) {
  const result = removeMaterialFromLab(state, slotIndex);
  if (!result.ok) {
    return;
  }
  commit();
}

function handleCraft() {
  const result = craftFromLab(state);
  if (!result.ok) {
    appendLog(state, result.reason);
    commit();
    return;
  }

  state.mobilePane = "pet";
  commit({ sound: "craft", flash: "pet" });
}

function handleClearSlots() {
  clearLabSlots(state);
  appendLog(state, "研发槽位已清空。材料已返还库存。");
  commit();
}

function handleReset() {
  const confirmed = window.confirm("确认重置存档吗？将清空图鉴、育成仓与材料进度。");
  if (!confirmed) {
    return;
  }

  state = resetState();
  syncOrders(state);
  syncSoundMode();
  appendLog(state, "存档已重置。奇物公司重新开业。");
  commit();
}

function handleClaimSupply() {
  const result = claimSupplyPack(state);
  if (!result.ok) {
    appendLog(state, result.reason);
    commit();
    return;
  }
  commit({ sound: "success", flash: "lab" });
}

function handleUnlockHint() {
  const result = unlockRecipeHint(state);
  if (!result.ok) {
    appendLog(state, result.reason);
    commit();
    return;
  }
  commit({ sound: "success" });
}

function handleTabChange(tabName) {
  if (tabName !== "nursery" && tabName !== "dex") {
    return;
  }
  state.tab = tabName;
  commit();
}

function handleCompanySectionChange(section) {
  if (!["collection", "orders", "log"].includes(section)) {
    return;
  }
  state.companySection = section;
  state.mobilePane = "company";
  commit();
}

function handleSelectPet(petId) {
  if (!state.pets.some((pet) => pet.id === petId)) {
    return;
  }
  state.activePetId = petId;
  state.mobilePane = "pet";
  appendLog(state, "已切换当前培育体。")
  commit({ flash: "pet" });
}

function handleCareAction(actionId) {
  if (!state.activePetId) {
    appendLog(state, "没有可照料的奇物。先去实验室创建一个吧。");
    state.mobilePane = "lab";
    commit();
    return;
  }

  const result = applyCareAction(state, state.activePetId, actionId);
  if (!result.ok) {
    appendLog(state, result.reason);
    commit();
    return;
  }

  commit({ sound: "care", flash: "pet" });
}

function handleUseShopItem(itemId) {
  if (!state.activePetId) {
    appendLog(state, "没有可使用道具的奇物。先选择一个培育体。");
    state.mobilePane = "company";
    state.companySection = "collection";
    commit();
    return;
  }

  const result = useShopItem(state, state.activePetId, itemId);
  if (!result.ok) {
    appendLog(state, result.reason);
    commit();
    return;
  }

  commit({ sound: "success", flash: "pet" });
}

function handleMobilePaneChange(pane) {
  if (!["lab", "pet", "company"].includes(pane)) {
    return;
  }
  state.mobilePane = pane;
  commit();
}

function handleToggleSound() {
  state.soundOn = !state.soundOn;
  syncSoundMode();
  commit();
  if (state.soundOn) {
    sound.beep("success");
  }
}

function handleToggleBgm() {
  state.bgmOn = !state.bgmOn;
  syncSoundMode();
  commit();
}

function stepByClock() {
  const now = Date.now();
  const elapsed = now - state.lastTickAt;
  const ticks = Math.floor(elapsed / TICK_MS);
  if (ticks <= 0) {
    return null;
  }

  const tickSummary = applyTicks(state, ticks);
  state.lastTickAt += ticks * TICK_MS;
  return tickSummary;
}

function recoverOfflineProgress() {
  const now = Date.now();
  const elapsed = now - state.lastTickAt;
  const ticks = Math.floor(elapsed / TICK_MS);
  if (ticks <= 0) {
    return;
  }

  applyTicks(state, ticks);
  state.lastTickAt = now;
  appendLog(state, `离线期间推进 ${ticks} 个成长刻，已自动结算。`);
}

function commit(meta = {}) {
  const orderSummary = evaluateOrders(state);
  syncSoundMode();
  persistState(state);
  renderAll(state, refs);

  if (meta.flash) {
    flashPane(refs, meta.flash);
  }

  if (meta.sound) {
    sound.beep(meta.sound);
  }

  if (meta.tickSummary?.stageUps > 0) {
    sound.beep("stage");
    flashPane(refs, "pet");
  }

  if (meta.tickSummary?.newEffects > 0) {
    sound.beep("effect");
  }

  if (orderSummary?.completed > 0) {
    sound.beep("order");
    flashPane(refs, "company");
  }
}

function syncSoundMode() {
  sound.setEffectsEnabled(state.soundOn);
  sound.setBgmEnabled(state.bgmOn);
  sound.setTheme(mapPaneToTheme(state.mobilePane));
  if (state.bgmOn) {
    sound.startBgm();
  }
}

function mapPaneToTheme(pane) {
  if (pane === "pet") {
    return "pet";
  }
  if (pane === "company") {
    return "company";
  }
  return "lab";
}
