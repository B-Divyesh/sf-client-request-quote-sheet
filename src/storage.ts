export function isDemoMode(): boolean {
  return typeof location !== 'undefined' && new URLSearchParams(location.search).get('demo') === '1';
}

function activeKey(key: string): string {
  return isDemoMode() ? `demo:${key}` : key;
}

export const STORAGE = {
  get sheet(): string { return activeKey('request-sheet:builder:v1'); },
  get lastRequest(): string { return activeKey('request-sheet:last-request:v1'); },
  get draftPrefix(): string { return activeKey('request-sheet:draft:'); },
  get license(): string { return activeKey('sb_license:client-request-quote-sheet-studio'); },
  get licenseVerdict(): string { return activeKey('request-sheet:studio-license-verdict:v2'); },
};

export function readJson<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJson(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function clearProductData(keepLicense = true): number {
  const dataPrefix = isDemoMode() ? 'demo:request-sheet:' : 'request-sheet:';
  const keys = Object.keys(localStorage).filter((key) => key.startsWith(dataPrefix));
  if (!keepLicense) {
    if (localStorage.getItem(STORAGE.license) !== null) keys.push(STORAGE.license);
    if (!isDemoMode() && localStorage.getItem('sb_license:client-request-quote-sheet') !== null) keys.push('sb_license:client-request-quote-sheet');
  }
  const uniqueKeys = [...new Set(keys)];
  uniqueKeys.forEach((key) => localStorage.removeItem(key));
  return uniqueKeys.length;
}
