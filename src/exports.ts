import type { RequestPacket } from './types';

export function formatMoney(value: number, currency: string): string {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 2 }).format(value);
}

export function packetTotal(packet: RequestPacket): number {
  return packet.request.lines.reduce((sum, line) => sum + (line.price === null ? 0 : line.price * line.quantity), 0);
}

function csvCell(value: unknown): string {
  const text = String(value ?? '').replaceAll('\r', ' ').replaceAll('\n', ' ');
  return `"${text.replaceAll('"', '""')}"`;
}

export function packetToCsv(packet: RequestPacket): string {
  const headers = ['Request reference', 'Created', 'Client', 'Contact', 'Needed by', 'Client reference', 'Item', 'Quantity', 'Unit', 'Unit price', 'Price status', 'Line estimate', 'Request notes', 'Quote status'];
  const rows = packet.request.lines.map((line) => [
    packet.request.reference,
    packet.request.createdAt,
    packet.request.clientName,
    packet.request.contact,
    packet.request.requestedBy,
    packet.request.clientReference,
    line.name,
    line.quantity,
    line.unit,
    line.price ?? '',
    line.price === null ? 'Price on ask' : 'Indicative',
    line.price === null ? '' : (line.price * line.quantity).toFixed(2),
    packet.request.notes,
    'Draft — human review required',
  ]);
  return [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
}

function ascii(value: string): string {
  return value.normalize('NFKD').replace(/[^\x20-\x7E]/g, '').replaceAll('\\', '\\\\').replaceAll('(', '\\(').replaceAll(')', '\\)');
}

function wrap(value: string, length = 88): string[] {
  const words = ascii(value).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  words.forEach((word) => {
    if (`${current} ${word}`.trim().length > length && current) {
      lines.push(current);
      current = word;
    } else current = `${current} ${word}`.trim();
  });
  if (current) lines.push(current);
  return lines.length ? lines : [''];
}

function pdfLines(packet: RequestPacket): string[] {
  const total = packetTotal(packet);
  const lines = [
    packet.sheet.businessName.toUpperCase(),
    'REQUEST / QUOTE DRAFT',
    `Reference: ${packet.request.reference}`,
    `Prepared: ${new Date(packet.request.createdAt).toLocaleString()}`,
    '',
    `Client: ${packet.request.clientName}`,
    `Contact: ${packet.request.contact}`,
    packet.request.requestedBy ? `Needed by: ${packet.request.requestedBy}` : '',
    packet.request.clientReference ? `Client reference: ${packet.request.clientReference}` : '',
    '',
    'REQUESTED ITEMS',
  ].filter((line, index) => line || index === 4 || index === 9);
  packet.request.lines.forEach((line) => {
    const price = line.price === null ? 'price on ask' : `${formatMoney(line.price * line.quantity, packet.sheet.currency)} indicative`;
    lines.push(...wrap(`${line.quantity} x ${line.name} / ${line.unit} — ${price}`));
    if (line.description) lines.push(...wrap(`  ${line.description}`));
  });
  lines.push('', `Priced-line estimate: ${formatMoney(total, packet.sheet.currency)}${packet.request.lines.some((line) => line.price === null) ? ' + items priced on ask' : ''}`);
  lines.push('', 'REQUIREMENTS', ...wrap(packet.request.notes || 'No additional requirements supplied.'));
  lines.push('', 'This is a request draft, not an accepted order or binding quote. Price, scope, timing and availability require owner review.');
  return lines;
}

export function packetToPdf(packet: RequestPacket): Blob {
  const chunks: string[][] = [];
  const all = pdfLines(packet);
  while (all.length) chunks.push(all.splice(0, 45));
  const objects: string[] = [''];
  const add = (body: string) => { objects.push(body); return objects.length - 1; };
  const fontId = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const pagesId = add('PAGES_PLACEHOLDER');
  const pageIds: number[] = [];
  chunks.forEach((pageLines) => {
    const commands = pageLines.map((line, index) => `BT /F1 ${index < 2 ? 14 : 10} Tf 54 ${760 - index * 15} Td (${ascii(line)}) Tj ET`).join('\n');
    const streamId = add(`<< /Length ${commands.length} >>\nstream\n${commands}\nendstream`);
    pageIds.push(add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${streamId} 0 R >>`));
  });
  objects[pagesId] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;
  const catalogId = add(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);
  let output = '%PDF-1.4\n%RequestSheet\n';
  const offsets = [0];
  for (let index = 1; index < objects.length; index += 1) {
    offsets[index] = new TextEncoder().encode(output).length;
    output += `${index} 0 obj\n${objects[index]}\nendobj\n`;
  }
  const xref = new TextEncoder().encode(output).length;
  output += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let index = 1; index < objects.length; index += 1) output += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`;
  output += `trailer\n<< /Size ${objects.length} /Root ${catalogId} 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Blob([output], { type: 'application/pdf' });
}

export function packetSummary(packet: RequestPacket): string {
  const lines = packet.request.lines.map((line) => `- ${line.quantity} × ${line.name} (${line.price === null ? 'price on ask' : formatMoney(line.price * line.quantity, packet.sheet.currency)})`);
  return [
    `Request ${packet.request.reference} for ${packet.sheet.businessName}`,
    `From: ${packet.request.clientName} — ${packet.request.contact}`,
    packet.request.requestedBy ? `Needed by: ${packet.request.requestedBy}` : '',
    packet.request.clientReference ? `Reference: ${packet.request.clientReference}` : '',
    '', ...lines, '', `Requirements: ${packet.request.notes || 'None supplied.'}`,
    '', 'This is a request for human review, not an accepted order or binding quote.',
  ].filter((line) => line !== '').join('\n');
}

export function downloadBlob(blob: Blob, filename: string): void {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}
