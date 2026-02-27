export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function setKey(materialIds) {
  return [...materialIds].sort().join("+");
}

export function weightedPick(pool, rng = Math.random) {
  const total = pool.reduce((sum, item) => sum + (item.weight ?? item.w ?? 0), 0);
  if (total <= 0) {
    return pool[pool.length - 1] ?? null;
  }
  let cursor = rng() * total;
  for (const item of pool) {
    cursor -= item.weight ?? item.w ?? 0;
    if (cursor <= 0) {
      return item;
    }
  }
  return pool[pool.length - 1] ?? null;
}

export function randomFrom(items, rng = Math.random) {
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }
  const idx = Math.floor(rng() * items.length);
  return items[idx];
}

export function uid(prefix = "id") {
  const stamp = Date.now().toString(36);
  const salt = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${stamp}_${salt}`;
}

export function average(values) {
  if (!values.length) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function formatRelativeTicks(ticks, tickMinutes = 10) {
  const totalMinutes = Math.max(0, Math.floor(ticks * tickMinutes));
  if (totalMinutes < 60) {
    return `${totalMinutes} 分钟`;
  }
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (!minutes) {
    return `${hours} 小时`;
  }
  return `${hours} 小时 ${minutes} 分钟`;
}

export function toPercent(value, maxValue = 100) {
  if (maxValue <= 0) {
    return 0;
  }
  return clamp((value / maxValue) * 100, 0, 100);
}
