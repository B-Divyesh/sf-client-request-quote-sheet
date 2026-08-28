import { describe, expect, it } from 'vitest';
import { decodeSheet, encodeSheet, isRequestPacket } from './encoding';
import { packetToCsv, packetToPdf, packetTotal } from './exports';
import { defaultSheet } from './defaults';
import type { RequestPacket } from './types';

const packet: RequestPacket = {
  type: 'request-sheet-packet',
  version: 1,
  sheet: defaultSheet,
  request: {
    reference: 'RS-20260828-TEST',
    createdAt: '2026-08-28T10:00:00.000Z',
    clientName: 'Ada Client',
    contact: 'ada@example.com',
    requestedBy: '2026-09-14',
    clientReference: 'PO-42',
    notes: 'Include the extended, "quoted" review.',
    lines: [
      { ...defaultSheet.items[0]!, quantity: 2 },
      { ...defaultSheet.items[2]!, quantity: 1 },
    ],
  },
};

describe('portable sheet encoding', () => {
  it('round trips the owner configuration', () => {
    expect(decodeSheet(encodeSheet(defaultSheet))).toEqual(defaultSheet);
  });

  it('rejects a malformed sheet', () => {
    expect(() => decodeSheet('not-base64')).toThrow();
  });
});

describe('owner exports', () => {
  it('keeps on-ask work out of the estimate', () => {
    expect(packetTotal(packet)).toBe(900);
  });

  it('quotes CSV cells and names human review status', () => {
    const csv = packetToCsv(packet);
    expect(csv).toContain('"Include the extended, ""quoted"" review."');
    expect(csv).toContain('"Draft — human review required"');
    expect(csv.split('\r\n')).toHaveLength(3);
  });

  it('builds a real PDF blob', async () => {
    const bytes = new Uint8Array(await packetToPdf(packet).arrayBuffer());
    expect(new TextDecoder().decode(bytes.slice(0, 8))).toBe('%PDF-1.4');
    expect(bytes.length).toBeGreaterThan(500);
  });

  it('recognises only versioned request packets', () => {
    expect(isRequestPacket(packet)).toBe(true);
    expect(isRequestPacket({ version: 1 })).toBe(false);
  });
});
