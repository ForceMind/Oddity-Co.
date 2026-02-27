export function loadJson(key, fallbackFactory) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return typeof fallbackFactory === "function" ? fallbackFactory() : null;
    }
    return JSON.parse(raw);
  } catch {
    return typeof fallbackFactory === "function" ? fallbackFactory() : null;
  }
}

export function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
