import { STORAGE, readJson, writeJson } from './storage';

export interface LicenseState {
  token: string;
  valid: boolean;
  checking: boolean;
  notice: string;
}

interface Verdict { valid: boolean; checkedAt: number; reason?: string }

const PRODUCT = 'client-request-quote-sheet';
// Release builds must always point at the live billing engine. A preview may
// explicitly opt into the pilot endpoint with VITE_BILLING_BASE_URL.
export const billingBaseUrl = import.meta.env.VITE_BILLING_BASE_URL || 'https://api.sociobot.in';
export const checkoutUrl = `${billingBaseUrl}/api/v1/products/${PRODUCT}/checkout`;

export function initialLicense(): LicenseState {
  const params = new URLSearchParams(location.search);
  const incoming = params.get('license')?.trim() || '';
  if (incoming) {
    localStorage.setItem(STORAGE.license, incoming);
    localStorage.removeItem(STORAGE.licenseVerdict);
    params.delete('license');
    const query = params.toString();
    history.replaceState(null, '', `${location.pathname}${query ? `?${query}` : ''}${location.hash}`);
  }
  const token = incoming || localStorage.getItem(STORAGE.license) || '';
  const verdict = readJson<Verdict | null>(STORAGE.licenseVerdict, null);
  return { token, valid: !!token && verdict?.valid === true, checking: !!token, notice: '' };
}

export async function verifyLicense(state: LicenseState, force = false): Promise<LicenseState> {
  if (!state.token) return { ...state, valid: false, checking: false };
  const cached = readJson<Verdict | null>(STORAGE.licenseVerdict, null);
  if (!force && cached && Date.now() - cached.checkedAt < 86_400_000) return { ...state, valid: cached.valid, checking: false };
  try {
    const response = await fetch(`${billingBaseUrl}/api/v1/products/${PRODUCT}/verify?license=${encodeURIComponent(state.token)}`, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('Verification unavailable');
    const result = await response.json() as { valid?: boolean; reason?: string };
    const valid = result.valid === true;
    writeJson(STORAGE.licenseVerdict, { valid, reason: result.reason, checkedAt: Date.now() });
    return { ...state, valid, checking: false, notice: valid ? 'Studio license active.' : 'License no longer active. Free tools remain available.' };
  } catch {
    return { ...state, checking: false, notice: state.valid ? 'Using your last verified license while offline.' : 'Could not verify this license. Check your connection and try again.' };
  }
}

export function storeLicense(token: string): LicenseState {
  localStorage.setItem(STORAGE.license, token.trim());
  localStorage.removeItem(STORAGE.licenseVerdict);
  return { token: token.trim(), valid: false, checking: true, notice: 'Checking license…' };
}
