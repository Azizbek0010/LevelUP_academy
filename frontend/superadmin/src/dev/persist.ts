const KEY_PREFIX = 'educrm-mock-';

export function loadMock<T>(key: string, defaults: T): T {
  try {
    const raw = localStorage.getItem(KEY_PREFIX + key);
    if (!raw) return defaults;
    return JSON.parse(raw) as T;
  } catch {
    return defaults;
  }
}

export function saveMock<T>(key: string, value: T): void {
  try {
    localStorage.setItem(KEY_PREFIX + key, JSON.stringify(value));
  } catch {
    // ignore — quota exceeded, private mode, etc.
  }
}

/** Wipe all mock data (useful for a "reset demo" button). */
export function resetAllMocks(): void {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(KEY_PREFIX)) keys.push(k);
  }
  for (const k of keys) localStorage.removeItem(k);
}
