import {
  craftFromLab,
  claimSupplyPack,
  clearLabSlots,
  placeMaterialInLab,
  removeMaterialFromLab,
  unlockRecipeHint,
} from "./game/crafting.js";
import { evaluateOrders, syncOrders } from "./game/orders.js";
import { applyCareAction, applyTicks, getActivePet } from "./game/simulation.js";
import { TICK_MS, appendLog, loadState, persistState, resetState } from "./game/state.js";
import { initDom, renderAll, renderPassive } from "./render/dom.js";
import { PetPainter } from "./render/petPainter.js";

let state = loadState();
syncOrders(state);

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
  onSelectPet: handleSelectPet,
  onCareAction: handleCareAction,
});

const painter = new PetPainter(refs.petCanvas);

recoverOfflineProgress();
commit();

setInterval(() => {
  const changed = stepByClock();
  if (changed) {
    commit();
    return;
  }
  renderPassive(state, refs);
}, 1000);

window.addEventListener("beforeunload", () => {
  persistState(state);
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
  }
  commit();
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
  appendLog(state, "存档已重置。奇物公司重新开业。");
  commit();
}

function handleClaimSupply() {
  const result = claimSupplyPack(state);
  if (!result.ok) {
    appendLog(state, result.reason);
  }
  commit();
}

function handleUnlockHint() {
  const result = unlockRecipeHint(state);
  if (!result.ok) {
    appendLog(state, result.reason);
  }
  commit();
}

function handleTabChange(tabName) {
  if (tabName !== "nursery" && tabName !== "dex") {
    return;
  }
  state.tab = tabName;
  commit();
}

function handleSelectPet(petId) {
  if (!state.pets.some((pet) => pet.id === petId)) {
    return;
  }
  state.activePetId = petId;
  appendLog(state, "已切换当前培育体。");
  commit();
}

function handleCareAction(actionId) {
  if (!state.activePetId) {
    appendLog(state, "没有可照料的奇物。先创建一个吧。");
    commit();
    return;
  }

  const result = applyCareAction(state, state.activePetId, actionId);
  if (!result.ok) {
    appendLog(state, result.reason);
  }
  commit();
}

function stepByClock() {
  const now = Date.now();
  const elapsed = now - state.lastTickAt;
  const ticks = Math.floor(elapsed / TICK_MS);
  if (ticks <= 0) {
    return false;
  }

  applyTicks(state, ticks);
  state.lastTickAt += ticks * TICK_MS;
  return true;
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

function commit() {
  evaluateOrders(state);
  persistState(state);
  renderAll(state, refs);
}
