import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4173';

async function waitForServiceWorkerControl(page: import('@playwright/test').Page): Promise<void> {
  const controlled = await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return false;
    if (navigator.serviceWorker.controller) return true;

    const claimed = new Promise<boolean>((resolve) => {
      navigator.serviceWorker.addEventListener('controllerchange', () => resolve(Boolean(navigator.serviceWorker.controller)), { once: true });
    });

    await navigator.serviceWorker.ready;
    return navigator.serviceWorker.controller ? true : claimed;
  });

  expect(controlled).toBe(true);
}

async function undersizedTargets(page: import('@playwright/test').Page): Promise<string[]> {
  return page.locator('a, button, input, select, textarea').evaluateAll((elements) => elements.flatMap((element) => {
    const control = element as HTMLElement;
    if (control.matches(':disabled, input[type="hidden"]')) return [];
    const style = getComputedStyle(control);
    if (style.display === 'none' || style.visibility === 'hidden') return [];
    const ownRect = control.getBoundingClientRect();
    if (!ownRect.width || !ownRect.height) return [];
    const label = control.matches('input[type="checkbox"], input[type="radio"]') ? control.closest('label') : null;
    const rect = label?.getBoundingClientRect() || ownRect;
    if (rect.width >= 44 && rect.height >= 44) return [];
    const name = control.getAttribute('aria-label') || control.textContent?.trim() || control.getAttribute('name') || control.id || control.tagName;
    return [`${control.tagName.toLowerCase()} "${name}" is ${Math.round(rect.width)}x${Math.round(rect.height)}`];
  }));
}

async function openSampleClient(page: Page): Promise<void> {
  await page.goto('/?demo=1');
  await page.getByRole('button', { name: /Create share link/ }).click();
  await page.goto(await page.locator('#share-url').inputValue());
}

async function prepareSamplePacket(page: Page, clientName = 'Ada Client'): Promise<void> {
  await openSampleClient(page);
  await page.locator('input[data-select="brand-review"]').check();
  await page.locator('#client-name').fill(clientName);
  await page.locator('#client-contact').fill(`${clientName.toLowerCase().replaceAll(' ', '.')}@example.com`);
  await page.getByRole('button', { name: /Review request/ }).click();
  await page.getByRole('button', { name: /Prepare request packet/ }).click();
  await expect(page.getByText('Packet ready')).toBeVisible();
}

test('@claim:packet-exports builds, shares, reviews and exports a request', async ({ page }, testInfo) => {
  const browserErrors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()); });
  page.on('pageerror', (error) => browserErrors.push(error.message));
  await page.goto('/?demo=1');
  await expect(page).toHaveTitle(/Request Sheet/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Build quote request sheets');
  await expect(page.locator('main')).toHaveCount(1);

  await page.locator('#compose').scrollIntoViewIfNeeded();
  await page.getByRole('button', { name: /Create share link/ }).click();
  await expect(page.getByText('Your sheet stays inside this link')).toBeVisible();
  const shareUrl = await page.locator('#share-url').inputValue();
  expect(shareUrl).toContain('#sheet=');

  await page.goto(shareUrl);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Northline Studio');
  await page.locator('input[data-select="brand-review"]').check();
  await page.locator('#client-name').fill('Ada Client');
  await page.locator('#client-contact').fill('ada@example.com');
  await page.locator('#notes').fill('Please include a short handoff call.');
  await page.getByRole('button', { name: /Review request/ }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByText('Still a request')).toBeVisible();
  await page.getByRole('button', { name: /Prepare request packet/ }).click();
  await expect(page.getByText('Packet ready')).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export CSV' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^request-rs-.*\.csv$/);
  const csvPath = await download.path();
  expect(csvPath && (await readFile(csvPath, 'utf8'))).toContain('Ada Client');

  const pdfPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export PDF' }).click();
  const pdf = await pdfPromise;
  const pdfPath = await pdf.path();
  expect(pdfPath && (await readFile(pdfPath)).subarray(0, 8).toString()).toBe('%PDF-1.4');

  const jsonPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save packet' }).click();
  const json = await jsonPromise;
  const jsonPath = await json.path();
  expect(JSON.parse(jsonPath ? await readFile(jsonPath, 'utf8') : '{}')).toMatchObject({ type: 'request-sheet-packet', request: { clientName: 'Ada Client' } });

  const results = await new AxeBuilder({ page }).analyze();
  const serious = results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact || ''));
  expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);

  if (testInfo.project.name === 'mobile') {
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow).toBe(false);
  }
  expect(browserErrors).toEqual([]);
});

test('reports broken share links with a recovery path', async ({ page }) => {
  await page.goto('/#sheet=broken');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('This request sheet is incomplete.');
  await expect(page.getByRole('link', { name: /Build a new sheet/ })).toBeVisible();
});

test('shows a designed not-found route with a way back', async ({ page }) => {
  await page.goto('/missing-page');
  await expect(page).toHaveTitle('Page not found — Request Sheet');
  await expect(page.getByRole('banner')).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible();
  await expect(page.getByRole('contentinfo')).toContainText('Built by Param Factory');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('This page was not found.');
  await expect(page.getByRole('link', { name: /Build a request sheet/ })).toHaveAttribute('href', '/');
  await page.getByRole('link', { name: 'Skip to main content' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('main#main')).toBeFocused();
});

test('legal routes are direct-loadable and local data can be erased', async ({ page }) => {
  await page.goto('/privacy');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Your request stays on your device.');
  await expect(page.getByText('License verification sends only')).toBeVisible();
  await page.goto('/terms');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('A draft is not an order.');
});

test('@claim:studio-price keeps the Studio purchase link and exact price on the production billing endpoint', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('$9.99 USD, one-time.', { exact: false })).toBeVisible();
  await expect(page.getByRole('link', { name: /Buy Studio for \$9.99/ })).toHaveAttribute(
    'href',
    'https://api.sociobot.in/api/v1/products/client-request-quote-sheet-studio/checkout',
  );
});

test('does not run a stale autosave after rapid share-hash navigation', async ({ page }) => {
  const browserErrors: string[] = [];
  page.on('pageerror', (error) => browserErrors.push(error.message));
  await page.goto('/');

  await page.evaluate(() => {
    const input = document.querySelector<HTMLInputElement>('#business-name')!;
    input.value = 'Autosave race proof';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    document.querySelector<HTMLFormElement>('#builder-form')!.requestSubmit();
    const target = document.querySelector<HTMLTextAreaElement>('#share-url')!.value;
    location.hash = new URL(target).hash;
  });

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Autosave race proof');
  await page.evaluate(() => {
    const input = document.querySelector<HTMLInputElement>('#client-name')!;
    input.value = 'Rapid client';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    location.hash = '';
  });
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Build quote request sheets');
  await page.waitForTimeout(350);
  expect(browserErrors).toEqual([]);
});

test('keeps every interactive target at least 44 by 44 CSS pixels at 390px', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  expect(await undersizedTargets(page)).toEqual([]);

  await page.goto('/privacy');
  expect(await undersizedTargets(page)).toEqual([]);
  await page.goto('/terms');
  expect(await undersizedTargets(page)).toEqual([]);

  await page.goto('/');
  await page.getByRole('button', { name: /Create share link/ }).click();
  const shareUrl = await page.locator('#share-url').inputValue();
  await page.goto(shareUrl);
  expect(await undersizedTargets(page)).toEqual([]);
  await page.locator('input[data-select="brand-review"]').check();
  await page.locator('#client-name').fill('Target Tester');
  await page.locator('#client-contact').fill('target@example.com');
  await page.getByRole('button', { name: /Review request/ }).click();
  expect(await undersizedTargets(page)).toEqual([]);
  await page.getByRole('button', { name: /Prepare request packet/ }).click();
  expect(await undersizedTargets(page)).toEqual([]);
});

test('@claim:demo-sandbox keeps sample work in the demo namespace and discards an immediate edit on reset', async ({ page }) => {
  await page.goto('/');
  await page.locator('#business-name').fill('Real workspace proof');
  await page.waitForFunction(() => localStorage.getItem('request-sheet:builder:v1')?.includes('Real workspace proof') ?? false);

  await page.getByRole('link', { name: /Try it with sample data/ }).click();
  await expect(page).toHaveURL(/\?demo=1#compose$/);
  await expect(page.getByText(/Demo — sample data/)).toBeVisible();
  await page.locator('#business-name').fill('Demo workspace proof');
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.locator('#business-name')).toHaveValue('Northline Studio');
  await page.reload();
  await expect(page.locator('#business-name')).toHaveValue('Northline Studio');
  await page.getByRole('button', { name: 'Start for real' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('#business-name')).toHaveValue('Real workspace proof');
  expect(await page.evaluate(() => Object.keys(localStorage).filter((key) => key.startsWith('demo:')))).toEqual([]);
});

test('moves keyboard focus into main content through the skip link', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main#main')).toBeFocused();
});

test('moves focus and announces the new title when a shared request route opens and closes', async ({ page }) => {
  await page.goto('/?demo=1');
  await page.getByRole('button', { name: /Create share link/ }).click();
  await page.getByRole('link', { name: /Open client view/ }).click();
  const clientHeading = page.getByRole('heading', { level: 1, name: 'Northline Studio' });
  await expect(clientHeading).toBeFocused();
  await expect(page.locator('#route-announcement')).toHaveText(/Opened Request for Northline Studio — Request Sheet/);

  await page.goBack();
  const builderHeading = page.getByRole('heading', { level: 1, name: 'Build quote request sheets' });
  await expect(builderHeading).toBeFocused();
  await expect(page.locator('#route-announcement')).toHaveText(/Opened Demo — Request Sheet/);
});

test('supports keyboard selection and restores focus after closing review', async ({ page }) => {
  await page.goto('/?demo=1');
  await page.getByRole('button', { name: /Create share link/ }).click();
  await page.goto(await page.locator('#share-url').inputValue());
  const item = page.locator('input[data-select="brand-review"]');
  await item.focus();
  await page.keyboard.press('Space');
  await expect(item).toBeChecked();
  await page.locator('#client-name').fill('Keyboard Client');
  await page.locator('#client-contact').fill('keyboard@example.com');
  const review = page.getByRole('button', { name: /Review request/ });
  await review.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Close review' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(review).toBeFocused();
});

test('has no serious accessibility violations on primary and legal states', async ({ page }) => {
  for (const route of ['/?demo=1', '/privacy', '/terms', '/#sheet=broken', '/missing-page']) {
    await page.goto(route);
    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact || ''));
    expect(serious, `${route}: ${JSON.stringify(serious, null, 2)}`).toEqual([]);
  }
});

test('@claim:offline-reload keeps the controlled production shell and demo sheet after an offline reload', async ({ browser }) => {
  const context = await browser.newContext({ baseURL });
  try {
    const page = await context.newPage();
    await page.goto('/?demo=1');
    await page.locator('#business-name').fill('Offline proof studio');
    await page.waitForFunction(() => localStorage.getItem('demo:request-sheet:builder:v1')?.includes('Offline proof studio') ?? false);

    await waitForServiceWorkerControl(page);
    await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.ready;
      await registration.update();
    });

    await context.setOffline(true);
    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Build quote request sheets');
    await expect(page.locator('#business-name')).toHaveValue('Offline proof studio');
    await expect(page.getByText(/Offline — your saved sheet/)).toBeVisible();
  } finally {
    await context.close();
  }
});

test('@claim:offline-exports exports a prepared sample request while offline after the first visit', async ({ browser }) => {
  const context = await browser.newContext({ baseURL, acceptDownloads: true });
  try {
    const page = await context.newPage();
    await page.goto('/?demo=1');
    await waitForServiceWorkerControl(page);
    await context.setOffline(true);
    await page.reload();
    await page.getByRole('button', { name: /Create share link/ }).click();
    await page.goto(await page.locator('#share-url').inputValue());
    await page.locator('input[data-select="brand-review"]').check();
    await page.locator('#client-name').fill('Offline export client');
    await page.locator('#client-contact').fill('offline-export@example.com');
    await page.getByRole('button', { name: /Review request/ }).click();
    await page.getByRole('button', { name: /Prepare request packet/ }).click();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export CSV' }).click();
    const csv = await downloadPromise;
    const csvPath = await csv.path();
    expect(csvPath && await readFile(csvPath, 'utf8')).toContain('Offline export client');
  } finally {
    await context.close();
  }
});

test('@claim:local-only keeps the normal demo workflow on the site origin', async ({ page }) => {
  const requestedUrls: string[] = [];
  page.on('request', (request) => requestedUrls.push(request.url()));
  await page.goto('/?demo=1');
  await page.getByRole('button', { name: /Create share link/ }).click();
  const shareUrl = await page.locator('#share-url').inputValue();
  await page.goto(shareUrl);
  await page.locator('input[data-select="brand-review"]').check();
  await page.locator('#client-name').fill('Local Client');
  await page.locator('#client-contact').fill('local@example.com');
  await page.getByRole('button', { name: /Review request/ }).click();
  await page.getByRole('button', { name: /Prepare request packet/ }).click();

  const origins = [...new Set(requestedUrls.map((url) => new URL(url).origin))];
  expect(origins).toEqual([new URL(page.url()).origin]);
});

test('@claim:packet-import-export imports a JSON packet and exports it again', async ({ page }) => {
  const packet = {
    type: 'request-sheet-packet',
    version: 1,
    sheet: { version: 1, businessName: 'Northline Studio', heading: 'Services request', intro: '', email: 'quotes@example.com', currency: 'USD', validityNote: '', items: [] },
    request: { reference: 'RS-IMPORTED', createdAt: '2026-09-06T12:00:00.000Z', clientName: 'Imported client', contact: 'imported@example.com', requestedBy: '', clientReference: '', notes: 'Imported request details.', lines: [{ id: 'brand-review', name: 'Brand review', description: 'A focused review.', unit: 'review', price: 450, quantity: 2 }] },
  };
  await page.goto('/?demo=1');
  await page.locator('#packet-file').setInputFiles({
    name: 'northline-request.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(packet)),
  });
  await expect(page.locator('[data-packet="imported"]')).toContainText('Imported client');

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export CSV' }).click();
  const csv = await downloadPromise;
  const csvPath = await csv.path();
  expect(csvPath && await readFile(csvPath, 'utf8')).toContain('Imported client');
});

test('@claim:packet-copy copies a prepared request summary as text', async ({ page }) => {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await prepareSamplePacket(page, 'Copy client');
  await page.getByRole('button', { name: 'Copy summary' }).click();
  await expect(page.locator('#toast')).toHaveText('Request summary copied.');
  await expect(page.evaluate(() => navigator.clipboard.readText())).resolves.toContain('Copy client');
});

test('@claim:packet-email opens a prepared email request with its request details', async ({ page }) => {
  await prepareSamplePacket(page, 'Email client');
  const href = await page.getByRole('link', { name: 'Email request' }).getAttribute('href');
  expect(href).not.toBeNull();
  const email = new URL(href!);
  expect(email.protocol).toBe('mailto:');
  expect(decodeURIComponent(email.pathname)).toBe('quotes@example.com');
  expect(email.searchParams.get('subject')).toContain('Email client');
  expect(email.searchParams.get('body')).toContain('Brand review');
});

test('@claim:price-on-ask keeps an on-ask item outside the priced estimate', async ({ page }) => {
  await openSampleClient(page);
  await page.locator('input[data-select="custom-support"]').check();
  await page.locator('#client-name').fill('On ask client');
  await page.locator('#client-contact').fill('on-ask@example.com');
  await page.getByRole('button', { name: /Review request/ }).click();
  await expect(page.getByRole('dialog')).toContainText('On ask');
  await expect(page.getByRole('dialog')).toContainText('$0.00');
  await page.getByRole('button', { name: /Prepare request packet/ }).click();
  await expect(page.getByText('$0.00 + on-ask items')).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export CSV' }).click();
  const csv = await downloadPromise;
  const csvPath = await csv.path();
  expect(csvPath && await readFile(csvPath, 'utf8')).toContain('Price on ask');
});

test('@claim:studio-closing adds a licensed custom closing line to the shared request', async ({ page }) => {
  await page.route('https://api.sociobot.in/**/verify?license=closing-token', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ valid: true, reason: 'ok', expires_at: null }),
  }));
  await page.goto('/?license=closing-token');
  await expect(page.locator('#custom-closing')).toBeEnabled();
  await page.locator('#custom-closing').fill('We will confirm scope before sending your quote.');
  await page.getByRole('button', { name: /Create share link/ }).click();
  await page.goto(await page.locator('#share-url').inputValue());
  await expect(page.locator('.custom-closing')).toHaveText('We will confirm scope before sending your quote.');
});

test('@claim:studio-reference collects a licensed client reference in the exported packet', async ({ page }) => {
  await page.route('https://api.sociobot.in/**/verify?license=reference-token', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ valid: true, reason: 'ok', expires_at: null }),
  }));
  await page.goto('/?license=reference-token');
  await expect(page.locator('#reference-label')).toBeEnabled();
  await page.locator('#reference-label').fill('Project code');
  await page.getByRole('button', { name: /Create share link/ }).click();
  await page.goto(await page.locator('#share-url').inputValue());
  await page.getByLabel(/Project code/).fill('NL-204');
  await page.locator('input[data-select="brand-review"]').check();
  await page.locator('#client-name').fill('Reference client');
  await page.locator('#client-contact').fill('reference@example.com');
  await page.getByRole('button', { name: /Review request/ }).click();
  await page.getByRole('button', { name: /Prepare request packet/ }).click();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save packet' }).click();
  const json = await downloadPromise;
  const jsonPath = await json.path();
  const exported = JSON.parse(jsonPath ? await readFile(jsonPath, 'utf8') : '{}');
  expect(exported.request.clientReference).toBe('NL-204');
});

test('@claim:studio-credit removes the licensed Request Sheet credit from the shared request', async ({ page }) => {
  await page.route('https://api.sociobot.in/**/verify?license=credit-token', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ valid: true, reason: 'ok', expires_at: null }),
  }));
  await page.goto('/?license=credit-token');
  await expect(page.locator('#hide-credit')).toBeEnabled();
  await page.locator('#hide-credit').check();
  await page.getByRole('button', { name: /Create share link/ }).click();
  await page.goto(await page.locator('#share-url').inputValue());
  await expect(page.locator('.sheet-credit')).toHaveCount(0);
});

test('@claim:studio-license-restore restores Studio from a pasted license', async ({ page }) => {
  await page.route('https://api.sociobot.in/**/verify?license=pasted-license-token', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ valid: true, reason: 'ok', expires_at: null }),
  }));
  await page.goto('/');
  await page.locator('#license-token').fill('pasted-license-token');
  await page.getByRole('button', { name: 'Verify license' }).click();
  await expect(page.getByText('Licensed', { exact: true })).toBeVisible();
  await expect(page.locator('#custom-closing')).toBeEnabled();
});

test('@claim:local-data-deletion erases sheet data while preserving or removing the license by choice', async ({ page }) => {
  await page.goto('/');
  await page.locator('#business-name').fill('Data to erase');
  await page.waitForFunction(() => localStorage.getItem('request-sheet:builder:v1')?.includes('Data to erase') ?? false);
  await page.evaluate(() => {
    localStorage.setItem('sb_license:client-request-quote-sheet-studio', 'retain-license-token');
    localStorage.setItem('request-sheet:studio-license-verdict:v2', JSON.stringify({ valid: false, checkedAt: Date.now() }));
  });
  await page.reload();
  await expect(page.locator('#business-name')).toHaveValue('Data to erase');
  await expect(page.locator('#license-token')).toHaveValue('retain-license-token');

  page.once('dialog', (dialog) => dialog.dismiss());
  await page.getByRole('button', { name: 'Erase local data' }).click();
  await expect(page.locator('#toast')).toContainText('erased');
  await page.waitForTimeout(450);
  await page.reload();
  await expect(page.locator('#business-name')).toHaveValue('Northline Studio');
  await expect(page.locator('#license-token')).toHaveValue('retain-license-token');

  await page.locator('#business-name').fill('Second data to erase');
  await page.waitForFunction(() => localStorage.getItem('request-sheet:builder:v1')?.includes('Second data to erase') ?? false);
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Erase local data' }).click();
  await expect(page.locator('#toast')).toContainText('including the license');
  await page.waitForTimeout(450);
  await page.reload();
  await expect(page.locator('#business-name')).toHaveValue('Northline Studio');
  await expect(page.locator('#license-token')).toHaveValue('');
});

test('accepts a returned Studio license and removes it from the URL', async ({ page }) => {
  let verificationUrl = '';
  await page.route('https://api.sociobot.in/**/verify?license=test-token', async (route) => {
    verificationUrl = route.request().url();
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ valid: true, reason: 'ok', expires_at: null }) });
  });
  await page.goto('/?license=test-token#studio');
  await expect(page).not.toHaveURL(/license=/);
  await expect(page.getByText('Licensed', { exact: true })).toBeVisible();
  await expect(page.locator('#custom-closing')).toBeEnabled();
  expect(verificationUrl).toContain('/products/client-request-quote-sheet-studio/verify?license=test-token');
  await expect(page.evaluate(() => localStorage.getItem('sb_license:client-request-quote-sheet-studio'))).resolves.toBe('test-token');
});
