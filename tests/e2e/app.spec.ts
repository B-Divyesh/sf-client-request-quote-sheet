import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('builds, shares, reviews and exports a request', async ({ page }, testInfo) => {
  const browserErrors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()); });
  page.on('pageerror', (error) => browserErrors.push(error.message));
  await page.goto('/');
  await expect(page).toHaveTitle(/Request Sheet/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/A request sheet/);
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

test('legal routes are direct-loadable and local data can be erased', async ({ page }) => {
  await page.goto('/privacy');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Your request stays on your device.');
  await expect(page.getByText('License verification sends only')).toBeVisible();
  await page.goto('/terms');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('A draft is not an order.');
});

test('keeps the Studio purchase link on the production billing endpoint', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: /Buy Studio once/ })).toHaveAttribute(
    'href',
    'https://api.sociobot.in/api/v1/products/client-request-quote-sheet/checkout',
  );
});

test('moves keyboard focus into main content through the skip link', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main#main')).toBeFocused();
});

test('keeps an installed shell usable offline and accepts a service-worker update check', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    await registration.update();
  });
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/A request sheet/);
  await expect(page.getByText(/Offline — your saved sheet/)).toBeVisible();
  await context.setOffline(false);
});

test('accepts a returned Studio license and removes it from the URL', async ({ page }) => {
  await page.route('https://api.sociobot.in/**/verify?license=test-token', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ valid: true, reason: 'ok', expires_at: null }) });
  });
  await page.goto('/?license=test-token#studio');
  await expect(page).not.toHaveURL(/license=/);
  await expect(page.getByText('Licensed', { exact: true })).toBeVisible();
  await expect(page.locator('#custom-closing')).toBeEnabled();
  await expect(page.evaluate(() => localStorage.getItem('sb_license:client-request-quote-sheet'))).resolves.toBe('test-token');
});
