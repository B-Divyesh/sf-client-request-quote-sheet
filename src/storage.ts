export const STORAGE = {
  sheet: 'request-sheet:builder:v1',
  lastRequest: 'request-sheet:last-request:v1',
  draftPrefix: 'request-sheet:draft:',
  license: 'sb_license:client-request-quote-sheet',
  licenseVerdict: 'request-sheet:license-verdict:v1',
} as const;

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
  const keys = Object.keys(localStorage).filter((key) => key.startsWith('request-sheet:'));
  if (!keepLicense) keys.push(STORAGE.license);
  keys.forEach((key) => localStorage.removeItem(key));
  return keys.length;
}
