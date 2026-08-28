import type { RequestPacket, RequestSheet } from './types';

function bytesToBase64(bytes: Uint8Array): string {
  let value = '';
  bytes.forEach((byte) => { value += String.fromCharCode(byte); });
  return btoa(value).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

function base64ToBytes(value: string): Uint8Array {
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/');
  const decoded = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='));
  return Uint8Array.from(decoded, (char) => char.charCodeAt(0));
}

export function encodeSheet(sheet: RequestSheet): string {
  return bytesToBase64(new TextEncoder().encode(JSON.stringify(sheet)));
}

function cleanText(value: unknown, max = 500): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export function decodeSheet(value: string): RequestSheet {
  const parsed = JSON.parse(new TextDecoder().decode(base64ToBytes(value))) as Partial<RequestSheet>;
  if (parsed.version !== 1 || !Array.isArray(parsed.items)) throw new Error('Unsupported sheet');
  const businessName = cleanText(parsed.businessName, 80);
  const items = parsed.items.slice(0, 20).map((item, index) => ({
    id: cleanText(item?.id, 80) || `item-${index}`,
    name: cleanText(item?.name, 100),
    description: cleanText(item?.description, 300),
    unit: cleanText(item?.unit, 30) || 'item',
    price: typeof item?.price === 'number' && Number.isFinite(item.price) && item.price >= 0 ? Math.round(item.price * 100) / 100 : null,
  })).filter((item) => item.name);
  if (!businessName || !items.length) throw new Error('Incomplete sheet');
  const supported = ['USD', 'EUR', 'GBP', 'INR', 'AUD', 'CAD'];
  return {
    version: 1,
    businessName,
    heading: cleanText(parsed.heading, 100) || 'Service request',
    intro: cleanText(parsed.intro, 700),
    email: cleanText(parsed.email, 160),
    currency: supported.includes(parsed.currency || '') ? parsed.currency! : 'USD',
    validityNote: cleanText(parsed.validityNote, 500),
    items,
    customClosing: cleanText(parsed.customClosing, 300),
    referenceLabel: cleanText(parsed.referenceLabel, 60),
    hideCredit: parsed.hideCredit === true,
  };
}

export function isRequestPacket(value: unknown): value is RequestPacket {
  if (!value || typeof value !== 'object') return false;
  const packet = value as Partial<RequestPacket>;
  if (packet.type !== 'request-sheet-packet' || packet.version !== 1 || !packet.sheet || !packet.request) return false;
  const sheet = packet.sheet as Partial<RequestSheet>;
  const request = packet.request as Partial<RequestPacket['request']>;
  const supported = ['USD', 'EUR', 'GBP', 'INR', 'AUD', 'CAD'];
  if (typeof sheet.businessName !== 'string' || !supported.includes(sheet.currency || '')) return false;
  if (typeof request.reference !== 'string' || typeof request.clientName !== 'string' || typeof request.contact !== 'string') return false;
  if (!Array.isArray(request.lines) || request.lines.length < 1 || request.lines.length > 20) return false;
  return request.lines.every((line) => line && typeof line.name === 'string' && typeof line.unit === 'string'
    && Number.isInteger(line.quantity) && line.quantity > 0 && line.quantity <= 999
    && (line.price === null || (typeof line.price === 'number' && Number.isFinite(line.price) && line.price >= 0)));
}
