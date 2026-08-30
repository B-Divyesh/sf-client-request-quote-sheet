import './style.css';
import { currencies, defaultSheet } from './defaults';
import { decodeSheet, encodeSheet, isRequestPacket } from './encoding';
import { downloadBlob, formatMoney, packetSummary, packetToCsv, packetToPdf, packetTotal } from './exports';
import { checkoutUrl, initialLicense, storeLicense, verifyLicense, type LicenseState } from './license';
import { clearProductData, isDemoMode, readJson, STORAGE, writeJson } from './storage';
import type { ClientRequest, RequestPacket, RequestSheet, SheetItem } from './types';

const app = document.querySelector<HTMLDivElement>('#app')!;
const demoMode = isDemoMode();
let license: LicenseState = initialLicense();
let pendingBuilderSave: { sheet: RequestSheet; timer: number } | null = null;
let pendingRequestUpdate: { run: () => void; timer: number } | null = null;

function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]!);
}

function icon(name: 'arrow' | 'plus' | 'minus' | 'copy' | 'download' | 'check'): string {
  const paths = {
    arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    copy: '<rect x="8" y="8" width="11" height="11"/><path d="M16 8V5H5v11h3"/>',
    download: '<path d="M12 3v12m-5-5 5 5 5-5M5 20h14"/>',
    check: '<path d="m5 12 4 4 10-10"/>',
  };
  return `<svg aria-hidden="true" viewBox="0 0 24 24">${paths[name]}</svg>`;
}

function shell(content: string, section = ''): string {
  const offline = navigator.onLine ? '' : '<div class="network-banner" role="status">Offline — your saved sheet and exports still work on this device.</div>';
  const demo = demoMode ? '<aside class="demo-banner" aria-label="Demo mode"><strong>Demo — sample data, nothing is saved to your real sheet.</strong><span><button type="button" data-action="reset-demo">Reset demo</button><button type="button" data-action="leave-demo">Start for real</button></span></aside>' : '';
  const homeUrl = demoMode ? '/?demo=1' : '/';
  const privacyUrl = demoMode ? '/privacy?demo=1' : '/privacy';
  const termsUrl = demoMode ? '/terms?demo=1' : '/terms';
  return `${offline}${demo}
    <header class="site-header">
      <a class="wordmark" href="${homeUrl}"><span aria-hidden="true">RS/</span> Request Sheet</a>
      <nav aria-label="Primary">
        <a ${section === 'build' && !demoMode ? 'aria-current="page"' : ''} href="${homeUrl}">Build a sheet</a>
        <a ${demoMode && section !== 'privacy' ? 'aria-current="page"' : ''} href="/?demo=1">Demo</a>
        <a ${section === 'privacy' ? 'aria-current="page"' : ''} href="${privacyUrl}">Privacy</a>
        <a href="${homeUrl}#studio">Studio <span class="edition-mark">+</span></a>
      </nav>
    </header>
    <main id="main" tabindex="-1">${content}</main>
    <footer class="site-footer">
      <div><strong>Request Sheet</strong><p>Build and export quote requests without an account.</p></div>
      <div><a href="${privacyUrl}">Privacy</a><a href="${termsUrl}">Terms</a><button class="link-button" data-action="clear-data">Erase local data</button></div>
      <p class="provenance">No analytics. No accounts. Editorial image generated for this product with the factory image model. Version 1.0.1 · repair 4.</p>
    </footer>
    <div class="toast" id="toast" role="status" aria-live="polite" aria-atomic="true"></div>`;
}

function showToast(message: string): void {
  const toast = document.querySelector<HTMLDivElement>('#toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('is-visible');
  window.setTimeout(() => toast.classList.remove('is-visible'), 2800);
}

function formatPrice(item: SheetItem, sheet: RequestSheet): string {
  return item.price === null ? 'Price on ask' : `${formatMoney(item.price, sheet.currency)} / ${item.unit}`;
}

function itemEditor(item: SheetItem, index: number): string {
  return `<fieldset class="item-editor" data-item-id="${escapeHtml(item.id)}">
    <legend>Item <span>${String(index + 1).padStart(2, '0')}</span></legend>
    <div class="field field-wide"><label for="item-name-${index}">Service or product name</label><input id="item-name-${index}" name="itemName" maxlength="100" value="${escapeHtml(item.name)}" required></div>
    <div class="field field-wide"><label for="item-description-${index}">Short description</label><textarea id="item-description-${index}" name="itemDescription" maxlength="300" rows="2">${escapeHtml(item.description)}</textarea></div>
    <div class="field"><label for="item-unit-${index}">Unit</label><input id="item-unit-${index}" name="itemUnit" maxlength="30" value="${escapeHtml(item.unit)}" required></div>
    <div class="field"><label for="item-price-${index}">Indicative price <span>(blank = on ask)</span></label><input id="item-price-${index}" name="itemPrice" type="number" min="0" step="0.01" inputmode="decimal" value="${item.price ?? ''}"></div>
    <button class="text-action danger" type="button" data-action="remove-item" ${index === 0 ? 'disabled' : ''}>Remove item ${index + 1}</button>
  </fieldset>`;
}

function builderPage(): string {
  const sheet = readJson<RequestSheet>(STORAGE.sheet, defaultSheet);
  const premiumDisabled = license.valid ? '' : 'disabled';
  const licenseNotice = license.notice ? `<p class="license-notice" role="status">${escapeHtml(license.notice)}</p>` : '';
  return shell(`
    <section class="hero">
      <div class="hero-copy">
        <p class="kicker">Client request builder</p>
        <h1>A request sheet,<br><em>not a storefront.</em></h1>
        <p class="dek">Give repeat clients one focused place to mark what they need. Every selection becomes a quote draft, never an order.</p>
        <div class="hero-actions"><a class="button primary" href="/?demo=1#compose">Try it with sample data ${icon('arrow')}</a><a class="button secondary" href="#compose">Build your own sheet</a></div>
        <p class="action-note">The sample opens a filled service list you can edit.</p>
      </div>
      <figure class="hero-plate">
        <picture>
          <source type="image/avif" srcset="/assets/request-docket-hero-960.avif 960w, /assets/request-docket-hero-1536.avif 1536w" sizes="(max-width: 720px) 100vw, 48vw">
          <source type="image/webp" srcset="/assets/request-docket-hero-960.webp 960w, /assets/request-docket-hero-1536.webp 1536w" sizes="(max-width: 720px) 100vw, 48vw">
          <img src="/assets/request-docket-hero-960.jpg" width="960" height="640" alt="A paper request docket with checked line items, a proofing stamp, paper clips and a typesetter ruler" fetchpriority="high" decoding="async">
        </picture>
        <figcaption>Request → review → quote. No checkout in between.</figcaption>
      </figure>
    </section>
    <section class="principles" aria-label="Product facts">
      <p><span>01</span> Your entries stay local</p><p><span>02</span> Works offline after one visit</p><p><span>03</span> Studio costs $9.99 once</p>
    </section>
    <section class="compose" id="compose">
      <div class="section-lead"><p class="folio">Set the terms</p><h2>Compose the sheet</h2><p>Start with the example, then make it yours. Your item list is encoded in the link—nothing is published to our servers.</p></div>
      <form id="builder-form" novalidate aria-describedby="builder-error">
        <div class="form-grid">
          <div class="field"><label for="business-name">Business name</label><input id="business-name" name="businessName" maxlength="80" value="${escapeHtml(sheet.businessName)}" required></div>
          <div class="field"><label for="quote-email">Quote email</label><input id="quote-email" name="email" maxlength="160" type="email" value="${escapeHtml(sheet.email)}" aria-describedby="email-hint"><small id="email-hint">Used only to prepare the client’s email.</small></div>
          <div class="field"><label for="sheet-heading">Sheet heading</label><input id="sheet-heading" name="heading" maxlength="100" value="${escapeHtml(sheet.heading)}" required></div>
          <div class="field"><label for="currency">Currency</label><select id="currency" name="currency">${currencies.map((currency) => `<option ${sheet.currency === currency ? 'selected' : ''}>${currency}</option>`).join('')}</select></div>
          <div class="field field-wide"><label for="intro">Client instruction</label><textarea id="intro" name="intro" maxlength="700" rows="3">${escapeHtml(sheet.intro)}</textarea></div>
          <div class="field field-wide"><label for="validity">Price and availability note</label><textarea id="validity" name="validityNote" maxlength="500" rows="2">${escapeHtml(sheet.validityNote)}</textarea></div>
        </div>
        <div class="ledger-heading"><div><p class="folio">Allowed items</p><h3>Your working list</h3></div><button class="button secondary" type="button" data-action="add-item">${icon('plus')} Add item</button></div>
        <div id="item-editors">${sheet.items.map(itemEditor).join('')}</div>
        <p class="form-error" id="builder-error" role="alert"></p>
        <div class="form-actions"><button class="button primary" type="submit">Create share link ${icon('arrow')}</button><span class="autosave-status" id="save-status" aria-live="polite">Saved on this device</span></div>
      </form>
      <section id="share-result" class="result-sheet" hidden aria-live="polite"></section>
    </section>
    <section class="packet-reader">
      <div class="section-lead"><p class="folio">Request packet import</p><h2>Open a request packet</h2><p>A client can send the small JSON packet they downloaded. Open it here to inspect the request and export CSV or PDF again.</p></div>
      <label class="file-drop" for="packet-file"><span>Choose a request packet</span><small>JSON · read only in this browser</small><input id="packet-file" type="file" accept="application/json,.json" aria-describedby="packet-error"></label>
      <p class="form-error" id="packet-error" role="alert"></p>
      <div id="import-result"></div>
    </section>
    <section class="studio" id="studio">
      <div class="studio-title"><p class="kicker">Studio edition</p><h2>Add details to each request.</h2><p>$9.99 USD, one-time. Remove Request Sheet credit, add your closing line, and collect a client reference. Core sharing, CSV, PDF and JSON exports stay free.</p><a class="button studio-buy" href="${checkoutUrl}">Buy Studio for $9.99 ${icon('arrow')}</a></div>
      <div class="studio-controls">
        <div class="studio-status"><span class="stamp ${license.valid ? 'active' : ''}">${license.valid ? 'Licensed' : 'Optional'}</span><p>${license.valid ? 'Studio presentation controls are active.' : 'A license unlocks presentation controls on this device.'}</p></div>
        ${licenseNotice}
        <div class="field"><label for="custom-closing">Custom closing line</label><input id="custom-closing" maxlength="300" value="${escapeHtml(sheet.customClosing || '')}" ${premiumDisabled}></div>
        <div class="field"><label for="reference-label">Client reference label</label><input id="reference-label" maxlength="60" value="${escapeHtml(sheet.referenceLabel || '')}" ${premiumDisabled}></div>
        <label class="check-field"><input id="hide-credit" type="checkbox" ${sheet.hideCredit ? 'checked' : ''} ${premiumDisabled}><span>Remove “Made with Request Sheet” credit</span></label>
        <form id="license-form" class="license-form"><label for="license-token">Have a license? Paste it here</label><div><input id="license-token" autocomplete="off" spellcheck="false" value="${escapeHtml(license.token)}"><button class="button secondary" type="submit">Verify license</button></div></form>
        <p class="legal-note">Sociobot/Dodo is the merchant of record. A refund revokes the license. See <a href="${demoMode ? '/terms?demo=1' : '/terms'}">terms</a> and <a href="${demoMode ? '/privacy?demo=1' : '/privacy'}">privacy</a>.</p>
      </div>
    </section>`, 'build');
}

function collectBuilderSheet(form = document.querySelector<HTMLFormElement>('#builder-form')): RequestSheet {
  if (!form) throw new Error('Builder form is unavailable');
  const data = new FormData(form);
  const items = [...form.querySelectorAll<HTMLElement>('.item-editor')].map((row, index) => {
    const value = (name: string) => row.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[name="${name}"]`)?.value.trim() || '';
    const rawPrice = value('itemPrice');
    return { id: row.dataset.itemId || `item-${index}`, name: value('itemName'), description: value('itemDescription'), unit: value('itemUnit') || 'item', price: rawPrice === '' ? null : Math.max(0, Number(rawPrice)) };
  });
  return {
    version: 1,
    businessName: String(data.get('businessName') || '').trim(),
    heading: String(data.get('heading') || '').trim(),
    intro: String(data.get('intro') || '').trim(),
    email: String(data.get('email') || '').trim(),
    currency: String(data.get('currency') || 'USD') as RequestSheet['currency'],
    validityNote: String(data.get('validityNote') || '').trim(),
    items,
    customClosing: license.valid ? document.querySelector<HTMLInputElement>('#custom-closing')?.value.trim() : '',
    referenceLabel: license.valid ? document.querySelector<HTMLInputElement>('#reference-label')?.value.trim() : '',
    hideCredit: license.valid ? document.querySelector<HTMLInputElement>('#hide-credit')?.checked : false,
  };
}

function persistBuilderSheet(sheet: RequestSheet): boolean {
  const saved = writeJson(STORAGE.sheet, sheet);
  const status = document.querySelector('#save-status');
  if (status) status.textContent = saved ? 'Saved on this device' : 'Could not save — storage may be full';
  return saved;
}

function flushPendingBuilderSave(): void {
  if (!pendingBuilderSave) return;
  window.clearTimeout(pendingBuilderSave.timer);
  const { sheet } = pendingBuilderSave;
  pendingBuilderSave = null;
  persistBuilderSheet(sheet);
}

function saveBuilder(): boolean {
  if (pendingBuilderSave) {
    window.clearTimeout(pendingBuilderSave.timer);
    pendingBuilderSave = null;
  }
  const form = document.querySelector<HTMLFormElement>('#builder-form');
  return form ? persistBuilderSheet(collectBuilderSheet(form)) : false;
}

function scheduleBuilderSave(form: HTMLFormElement): void {
  const sheet = collectBuilderSheet(form);
  if (pendingBuilderSave) window.clearTimeout(pendingBuilderSave.timer);
  const timer = window.setTimeout(() => {
    pendingBuilderSave = null;
    persistBuilderSheet(sheet);
  }, 250);
  pendingBuilderSave = { sheet, timer };
}

function packetPanel(packet: RequestPacket, imported = false): string {
  const total = packetTotal(packet);
  return `<section class="packet-panel" data-packet="${imported ? 'imported' : 'created'}">
    <div class="packet-head"><div><p class="folio">${imported ? 'Packet opened' : 'Packet ready'}</p><h3>${escapeHtml(packet.request.reference)}</h3></div><span class="stamp active">Draft</span></div>
    <dl class="packet-meta"><div><dt>Client</dt><dd>${escapeHtml(packet.request.clientName)}</dd></div><div><dt>Contact</dt><dd>${escapeHtml(packet.request.contact)}</dd></div><div><dt>Priced estimate</dt><dd>${escapeHtml(formatMoney(total, packet.sheet.currency))}${packet.request.lines.some((line) => line.price === null) ? ' + on-ask items' : ''}</dd></div></dl>
    <ol class="packet-lines">${packet.request.lines.map((line) => `<li><span>${line.quantity} × ${escapeHtml(line.name)}</span><strong>${line.price === null ? 'On ask' : escapeHtml(formatMoney(line.price * line.quantity, packet.sheet.currency))}</strong></li>`).join('')}</ol>
    <div class="packet-actions"><button class="button secondary" data-export="csv">${icon('download')} Export CSV</button><button class="button secondary" data-export="pdf">${icon('download')} Export PDF</button><button class="button secondary" data-export="json">${icon('download')} Save packet</button><button class="button secondary" data-export="copy">${icon('copy')} Copy summary</button>${packet.sheet.email ? `<a class="button primary" href="mailto:${encodeURIComponent(packet.sheet.email)}?subject=${encodeURIComponent(`Request ${packet.request.reference} from ${packet.request.clientName}`)}&body=${encodeURIComponent(packetSummary(packet))}">Email request ${icon('arrow')}</a>` : ''}</div>
    <p class="legal-note">Files contain the contact details entered above. Share them only with the intended business.</p>
  </section>`;
}

function bindPacketActions(container: ParentNode, packet: RequestPacket): void {
  container.querySelectorAll<HTMLElement>('[data-export]').forEach((button) => button.addEventListener('click', async () => {
    const filename = `request-${packet.request.reference.toLowerCase()}`;
    const action = button.dataset.export;
    if (action === 'csv') downloadBlob(new Blob([packetToCsv(packet)], { type: 'text/csv;charset=utf-8' }), `${filename}.csv`);
    if (action === 'pdf') downloadBlob(packetToPdf(packet), `${filename}.pdf`);
    if (action === 'json') downloadBlob(new Blob([JSON.stringify(packet, null, 2)], { type: 'application/json' }), `${filename}.json`);
    if (action === 'copy') {
      try { await navigator.clipboard.writeText(packetSummary(packet)); showToast('Request summary copied.'); }
      catch { showToast('Copy was blocked. Select and copy from the review instead.'); }
    }
  }));
}

function bindBuilder(): void {
  const form = document.querySelector<HTMLFormElement>('#builder-form')!;
  form.addEventListener('input', () => scheduleBuilderSave(form));
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const error = document.querySelector<HTMLParagraphElement>('#builder-error')!;
    error.textContent = '';
    if (!form.reportValidity()) return;
    const sheet = collectBuilderSheet();
    if (!sheet.items.some((item) => item.name)) { error.textContent = 'Add at least one named item before creating a link.'; return; }
    saveBuilder();
    const url = `${location.origin}${location.pathname}${demoMode ? '?demo=1' : ''}#sheet=${encodeSheet(sheet)}`;
    const result = document.querySelector<HTMLElement>('#share-result')!;
    result.hidden = false;
    result.innerHTML = `<p class="folio">Link ready</p><h3>Your sheet stays inside this link</h3><p>Send it only to people you expect requests from. Anyone with the link can view its item list.</p><label for="share-url">Share URL</label><textarea id="share-url" readonly rows="3">${escapeHtml(url)}</textarea><div class="packet-actions"><button class="button secondary" type="button" data-action="copy-link">${icon('copy')} Copy link</button><a class="button primary" href="${escapeHtml(url)}">Open client view ${icon('arrow')}</a></div>`;
    result.querySelector('[data-action="copy-link"]')?.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(url); showToast('Share link copied.'); }
      catch { (result.querySelector('#share-url') as HTMLTextAreaElement).select(); showToast('Select and copy the highlighted link.'); }
    });
    result.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
  });
  document.querySelector('[data-action="add-item"]')?.addEventListener('click', () => {
    saveBuilder();
    const sheet = readJson<RequestSheet>(STORAGE.sheet, defaultSheet);
    if (sheet.items.length >= 20) { showToast('A sheet can contain up to 20 items.'); return; }
    sheet.items.push({ id: crypto.randomUUID(), name: '', description: '', unit: 'item', price: null });
    writeJson(STORAGE.sheet, sheet);
    render();
    document.querySelector<HTMLInputElement>('.item-editor:last-child input')?.focus();
  });
  document.querySelectorAll('[data-action="remove-item"]').forEach((button) => button.addEventListener('click', () => {
    const row = (button as HTMLElement).closest<HTMLElement>('.item-editor');
    if (!row || !confirm(`Remove item ${row.querySelector('legend')?.textContent?.trim()}?`)) return;
    const sheet = collectBuilderSheet();
    sheet.items = sheet.items.filter((item) => item.id !== row.dataset.itemId);
    writeJson(STORAGE.sheet, sheet);
    render();
  }));
  ['custom-closing', 'reference-label', 'hide-credit'].forEach((id) => document.querySelector(`#${id}`)?.addEventListener('input', saveBuilder));
  document.querySelector<HTMLFormElement>('#license-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const token = document.querySelector<HTMLInputElement>('#license-token')!.value;
    if (!token.trim()) { showToast('Paste a license token first.'); return; }
    license = storeLicense(token);
    license = await verifyLicense(license, true);
    render();
    document.querySelector('#studio')?.scrollIntoView();
  });
  document.querySelector<HTMLInputElement>('#packet-file')?.addEventListener('change', async (event) => {
    const input = event.currentTarget as HTMLInputElement;
    const error = document.querySelector<HTMLParagraphElement>('#packet-error')!;
    error.textContent = '';
    if (!input.files?.[0]) return;
    try {
      if (input.files[0].size > 250_000) throw new Error('too-large');
      const value = JSON.parse(await input.files[0].text()) as unknown;
      if (!isRequestPacket(value)) throw new Error('invalid');
      const result = document.querySelector<HTMLDivElement>('#import-result')!;
      result.innerHTML = packetPanel(value, true);
      bindPacketActions(result, value);
    } catch {
      error.textContent = 'That file is not a valid Request Sheet packet. Ask the client to download the JSON packet again.';
    }
  });
}

interface RequestDraft {
  quantities: Record<string, number>;
  clientName: string;
  contact: string;
  requestedBy: string;
  clientReference: string;
  notes: string;
}

function draftKey(encoded: string): string { return `${STORAGE.draftPrefix}${encoded.slice(0, 24)}`; }

function requestPage(sheet: RequestSheet, encoded: string): string {
  const draft = readJson<RequestDraft>(draftKey(encoded), { quantities: {}, clientName: '', contact: '', requestedBy: '', clientReference: '', notes: '' });
  const rows = sheet.items.map((item, index) => {
    const quantity = draft.quantities[item.id] || 0;
    return `<li class="request-row ${quantity ? 'is-selected' : ''}" data-line-id="${escapeHtml(item.id)}">
      <label class="select-item"><input type="checkbox" ${quantity ? 'checked' : ''} data-select="${escapeHtml(item.id)}"><span class="box-mark" aria-hidden="true">${icon('check')}</span><span class="item-number">${String(index + 1).padStart(2, '0')}</span><span><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.description)}</small></span></label>
      <div class="item-price"><strong>${escapeHtml(formatPrice(item, sheet))}</strong></div>
      <div class="quantity" aria-label="Quantity for ${escapeHtml(item.name)}"><button type="button" data-quantity="minus" aria-label="Decrease ${escapeHtml(item.name)}" ${quantity ? '' : 'disabled'}>${icon('minus')}</button><input type="number" min="0" max="999" value="${quantity}" inputmode="numeric" aria-label="Quantity for ${escapeHtml(item.name)}" data-quantity-input="${escapeHtml(item.id)}"><button type="button" data-quantity="plus" aria-label="Increase ${escapeHtml(item.name)}">${icon('plus')}</button></div>
    </li>`;
  }).join('');
  return shell(`<article class="request-view">
    <header class="request-masthead"><div><p class="kicker">Prepared request sheet</p><h1>${escapeHtml(sheet.businessName)}</h1></div><div class="request-folio"><span>Sheet</span><strong>01</strong><small>Human review required</small></div></header>
    <section class="request-intro"><p class="folio">${escapeHtml(sheet.heading)}</p><p class="dek">${escapeHtml(sheet.intro)}</p><aside><strong>Before you mark the sheet</strong><p>${escapeHtml(sheet.validityNote)}</p></aside></section>
      <form id="request-form" novalidate aria-describedby="request-error">
      <fieldset class="request-ledger"><legend><span>Available work</span><small>Select one or more</small></legend><ol>${rows}</ol></fieldset>
      <section class="running-total" aria-live="polite"><div><span>Priced-line estimate</span><strong id="estimate">${formatMoney(0, sheet.currency)}</strong></div><p id="estimate-note">No items selected. Prices and availability remain subject to review.</p></section>
      <section class="client-details"><div class="section-lead"><p class="folio">Your details</p><h2>Give the request context</h2></div><div class="form-grid">
        <div class="field"><label for="client-name">Your name</label><input id="client-name" name="clientName" autocomplete="name" maxlength="100" value="${escapeHtml(draft.clientName)}" required></div>
        <div class="field"><label for="client-contact">Email or phone</label><input id="client-contact" name="contact" autocomplete="email" maxlength="160" value="${escapeHtml(draft.contact)}" required><small>Only the business receiving your packet sees this.</small></div>
        <div class="field"><label for="requested-by">Needed by <span>(optional)</span></label><input id="requested-by" name="requestedBy" type="date" value="${escapeHtml(draft.requestedBy)}"></div>
        ${sheet.referenceLabel ? `<div class="field"><label for="client-reference">${escapeHtml(sheet.referenceLabel)} <span>(optional)</span></label><input id="client-reference" name="clientReference" maxlength="80" value="${escapeHtml(draft.clientReference)}"></div>` : '<input type="hidden" name="clientReference" value="">'}
        <div class="field field-wide"><label for="notes">Requirements, sizes or useful context</label><textarea id="notes" name="notes" maxlength="2000" rows="6">${escapeHtml(draft.notes)}</textarea></div>
      </div></section>
      <p id="request-error" class="form-error" role="alert"></p>
      <div class="request-submit"><p>This creates a draft for the business to review. It does not place an order, reserve stock or accept a price.</p><button class="button primary" type="submit">Review request ${icon('arrow')}</button></div>
    </form>
    <div id="packet-result"></div>
    ${sheet.customClosing ? `<blockquote class="custom-closing">${escapeHtml(sheet.customClosing)}</blockquote>` : ''}
    ${sheet.hideCredit ? '' : '<p class="sheet-credit">Made with Request Sheet — a local-first quoting utility.</p>'}
    <dialog id="review-dialog" aria-labelledby="review-title"><div id="review-content"></div></dialog>
  </article>`, '');
}

function readRequestDraft(sheet: RequestSheet, encoded: string): RequestDraft {
  const form = document.querySelector<HTMLFormElement>('#request-form')!;
  const data = new FormData(form);
  const quantities: Record<string, number> = {};
  sheet.items.forEach((item) => {
    const input = form.querySelector<HTMLInputElement>(`[data-quantity-input="${CSS.escape(item.id)}"]`);
    quantities[item.id] = Math.max(0, Math.min(999, Math.floor(Number(input?.value) || 0)));
  });
  const draft = { quantities, clientName: String(data.get('clientName') || '').trim(), contact: String(data.get('contact') || '').trim(), requestedBy: String(data.get('requestedBy') || ''), clientReference: String(data.get('clientReference') || '').trim(), notes: String(data.get('notes') || '').trim() };
  writeJson(draftKey(encoded), draft);
  return draft;
}

function updateEstimate(sheet: RequestSheet, encoded: string): void {
  const draft = readRequestDraft(sheet, encoded);
  let total = 0;
  let selected = 0;
  let onAsk = 0;
  sheet.items.forEach((item) => {
    const quantity = draft.quantities[item.id] || 0;
    const row = document.querySelector<HTMLElement>(`[data-line-id="${CSS.escape(item.id)}"]`);
    row?.classList.toggle('is-selected', quantity > 0);
    const checkbox = row?.querySelector<HTMLInputElement>('[data-select]');
    if (checkbox) checkbox.checked = quantity > 0;
    row?.querySelector<HTMLButtonElement>('[data-quantity="minus"]')?.toggleAttribute('disabled', quantity === 0);
    if (quantity) { selected += 1; if (item.price === null) onAsk += 1; else total += item.price * quantity; }
  });
  document.querySelector('#estimate')!.textContent = formatMoney(total, sheet.currency);
  document.querySelector('#estimate-note')!.textContent = selected ? `${selected} selected${onAsk ? ` · ${onAsk} priced after review` : ''}. This is not a binding quote.` : 'No items selected. Prices and availability remain subject to review.';
}

function makePacket(sheet: RequestSheet, draft: RequestDraft): RequestPacket {
  const stamp = new Date().toISOString().slice(0, 10).replaceAll('-', '');
  const suffix = crypto.getRandomValues(new Uint32Array(1))[0]!.toString(36).slice(0, 4).toUpperCase().padStart(4, '0');
  const request: ClientRequest = {
    reference: `RS-${stamp}-${suffix}`,
    createdAt: new Date().toISOString(),
    clientName: draft.clientName,
    contact: draft.contact,
    requestedBy: draft.requestedBy,
    clientReference: draft.clientReference,
    notes: draft.notes,
    lines: sheet.items.filter((item) => (draft.quantities[item.id] || 0) > 0).map((item) => ({ ...item, quantity: draft.quantities[item.id]! })),
  };
  return { type: 'request-sheet-packet', version: 1, sheet, request };
}

function bindRequest(sheet: RequestSheet, encoded: string): void {
  const form = document.querySelector<HTMLFormElement>('#request-form')!;
  const updateNow = (): void => {
    if (pendingRequestUpdate) window.clearTimeout(pendingRequestUpdate.timer);
    pendingRequestUpdate = null;
    if (form.isConnected) updateEstimate(sheet, encoded);
  };
  form.addEventListener('input', () => {
    if (pendingRequestUpdate) window.clearTimeout(pendingRequestUpdate.timer);
    const run = updateNow;
    const timer = window.setTimeout(run, 180);
    pendingRequestUpdate = { run, timer };
  });
  form.addEventListener('change', updateNow);
  document.querySelectorAll<HTMLInputElement>('[data-select]').forEach((checkbox) => checkbox.addEventListener('change', () => {
    const input = document.querySelector<HTMLInputElement>(`[data-quantity-input="${CSS.escape(checkbox.dataset.select!)}"]`)!;
    input.value = checkbox.checked ? String(Math.max(1, Number(input.value) || 1)) : '0';
    updateEstimate(sheet, encoded);
  }));
  document.querySelectorAll<HTMLButtonElement>('[data-quantity]').forEach((button) => button.addEventListener('click', () => {
    const row = button.closest<HTMLElement>('[data-line-id]')!;
    const input = row.querySelector<HTMLInputElement>('[data-quantity-input]')!;
    input.value = String(Math.max(0, Math.min(999, Number(input.value) + (button.dataset.quantity === 'plus' ? 1 : -1))));
    updateEstimate(sheet, encoded);
  }));
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (pendingRequestUpdate) window.clearTimeout(pendingRequestUpdate.timer);
    pendingRequestUpdate = null;
    const error = document.querySelector<HTMLParagraphElement>('#request-error')!;
    error.textContent = '';
    const draft = readRequestDraft(sheet, encoded);
    if (!Object.values(draft.quantities).some((quantity) => quantity > 0)) { error.textContent = 'Select at least one item before reviewing your request.'; document.querySelector('.request-ledger')?.scrollIntoView({ behavior: 'smooth' }); return; }
    if (!form.reportValidity()) return;
    const preview = makePacket(sheet, draft);
    const dialog = document.querySelector<HTMLDialogElement>('#review-dialog')!;
    const total = packetTotal(preview);
    dialog.querySelector('#review-content')!.innerHTML = `<div class="dialog-head"><div><p class="folio">Final check</p><h2 id="review-title">Review your request</h2></div><button class="dialog-close" type="button" aria-label="Close review">×</button></div><p>${preview.request.lines.length} line${preview.request.lines.length === 1 ? '' : 's'} for <strong>${escapeHtml(sheet.businessName)}</strong></p><ol class="packet-lines">${preview.request.lines.map((line) => `<li><span>${line.quantity} × ${escapeHtml(line.name)}</span><strong>${line.price === null ? 'On ask' : escapeHtml(formatMoney(line.price * line.quantity, sheet.currency))}</strong></li>`).join('')}</ol><p class="review-total"><span>Priced-line estimate</span><strong>${escapeHtml(formatMoney(total, sheet.currency))}</strong></p><div class="notice-box"><strong>Still a request</strong><p>The business must confirm scope, timing, availability and final price.</p></div><div class="dialog-actions"><button class="button secondary dialog-back" type="button">Go back</button><button class="button primary" id="prepare-packet" type="button">Prepare request packet ${icon('arrow')}</button></div>`;
    dialog.querySelectorAll('.dialog-close,.dialog-back').forEach((button) => button.addEventListener('click', () => dialog.close()));
    dialog.querySelector('#prepare-packet')?.addEventListener('click', () => {
      writeJson(STORAGE.lastRequest, preview);
      const result = document.querySelector<HTMLDivElement>('#packet-result')!;
      result.innerHTML = packetPanel(preview);
      bindPacketActions(result, preview);
      dialog.close();
      result.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    });
    dialog.showModal();
  });
  updateEstimate(sheet, encoded);
}

function invalidSheetPage(): string {
  return shell(`<section class="state-page"><p class="kicker">Link cannot be read</p><h1>This request sheet is incomplete.</h1><p>The link may have been copied only in part. Ask the business to send it again, or build a fresh sheet.</p><a class="button primary" href="/">Build a new sheet ${icon('arrow')}</a></section>`);
}

function notFoundPage(): string {
  return shell(`<section class="state-page"><p class="kicker">Page not found</p><h1>This page is not on the sheet.</h1><p>Check the address or return to the request-sheet builder.</p><a class="button primary" href="/">Build a request sheet ${icon('arrow')}</a></section>`);
}

function privacyPage(): string {
  return shell(`<article class="legal-page"><p class="kicker">Plain-language policy · 30 August 2026</p><h1>Your request stays on your device.</h1><p class="dek">Request Sheet has no accounts, analytics or application database. The site itself does not receive the item list, contact details or requirements you enter.</p><h2>What is stored</h2><p>Your sheet, unfinished request, last request packet, and license verdict are saved in this browser’s local storage. A shared URL contains the owner’s item-list configuration. Client contact details are never put in that URL.</p><h2>What leaves the device</h2><p>Your entries stay on the device until you choose an action. Copy, download and email actions put the request under your control. Email opens your own mail app. License verification sends only the pasted license token to the Sociobot billing API. The generated hero image and application files are served from this site; there are no third-party fonts or scripts.</p><h2>Deletion and retention</h2><p>Use “Erase local data” below or in the footer at any time. Downloaded files and sent messages must be removed where you saved or sent them. The license token is retained by default so a customer does not lose their purchase; the deletion dialog offers to remove it too.</p><button class="button danger-button" data-action="clear-data">Erase data on this device</button><h2>Contact</h2><p>Privacy questions: <a href="mailto:privacy@sociobot.in">privacy@sociobot.in</a>.</p></article>`, 'privacy');
}

function termsPage(): string {
  return shell(`<article class="legal-page"><p class="kicker">Terms · 30 August 2026</p><h1>A draft is not an order.</h1><p class="dek">Request Sheet helps one person describe requested work to another. It does not create a binding quote, reserve stock, accept an order, collect payment, or guarantee availability.</p><h2>Using the product</h2><p>You are responsible for checking every exported request and formal quote. Do not use the product for unlawful, dangerous or sensitive-data workflows. Shared links should go only to intended recipients because anyone holding a link can view its item list.</p><h2>Studio license</h2><p>Studio costs $9.99 USD as a one-time purchase. It adds the presentation controls listed on the product page. Core sharing and exports remain free. Sociobot/Dodo is the merchant of record and handles checkout and refunds. A refunded, expired or revoked license stops enabling Studio features but does not affect free features or local request data.</p><h2>Availability and warranty</h2><p>The software is provided “as is” under the MIT License. Keep copies of files you need. Browser storage can be cleared by your device or browser. We may improve or discontinue the hosted service, while the source remains usable under its license.</p><h2>Contact</h2><p>Terms questions: <a href="mailto:support@sociobot.in">support@sociobot.in</a>.</p></article>`);
}

function bindGlobal(): void {
  document.querySelectorAll('[data-action="clear-data"]').forEach((button) => button.addEventListener('click', () => {
    const includeLicense = confirm('Erase your Studio license from this device too? Select Cancel to keep the license while erasing sheets and request drafts.');
    const count = clearProductData(!includeLicense);
    showToast(`${count} local record${count === 1 ? '' : 's'} erased${includeLicense ? ', including the license' : ''}.`);
    if (location.pathname === '/') window.setTimeout(render, 400);
  }));
  document.querySelector('[data-action="reset-demo"]')?.addEventListener('click', () => {
    clearProductData(false);
    history.replaceState(null, '', '/?demo=1#compose');
    render();
    showToast('Demo reset to the sample sheet.');
  });
  document.querySelector('[data-action="leave-demo"]')?.addEventListener('click', () => {
    clearProductData(false);
    location.assign('/');
  });
}

function render(): void {
  flushPendingBuilderSave();
  if (pendingRequestUpdate) {
    window.clearTimeout(pendingRequestUpdate.timer);
    const { run } = pendingRequestUpdate;
    pendingRequestUpdate = null;
    run();
  }
  if (location.pathname === '/privacy' || location.pathname === '/privacy/') {
    document.title = 'Privacy — Request Sheet';
    app.innerHTML = privacyPage();
  }
  else if (location.pathname === '/terms' || location.pathname === '/terms/') {
    document.title = 'Terms — Request Sheet';
    app.innerHTML = termsPage();
  }
  else if (location.pathname === '/' || location.pathname === '') {
    const match = location.hash.match(/^#sheet=(.+)$/);
    if (match) {
      try {
        const encoded = match[1]!;
        const sheet = decodeSheet(encoded);
        document.title = `Request for ${sheet.businessName} — Request Sheet`;
        app.innerHTML = requestPage(sheet, encoded);
        bindRequest(sheet, encoded);
      } catch {
        document.title = 'Incomplete link — Request Sheet';
        app.innerHTML = invalidSheetPage();
      }
    } else {
      document.title = demoMode ? 'Demo — Request Sheet' : 'Request Sheet — Build a quote request form';
      app.innerHTML = builderPage();
      bindBuilder();
    }
  }
  else {
    document.title = 'Page not found — Request Sheet';
    app.innerHTML = notFoundPage();
  }
  bindGlobal();
}

document.querySelector<HTMLAnchorElement>('.skip-link')?.addEventListener('click', (event) => {
  event.preventDefault();
  document.querySelector<HTMLElement>('#main')?.focus();
});

window.addEventListener('hashchange', render);
window.addEventListener('online', render);
window.addEventListener('offline', render);
render();

if ('serviceWorker' in navigator && import.meta.env.PROD) window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => undefined));
if (license.token) verifyLicense(license).then((next) => { license = next; if (!location.hash.startsWith('#sheet=')) render(); });
