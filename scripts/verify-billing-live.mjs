/**
 * Release-only contract test for the paid unlock.
 *
 * It intentionally talks to the production billing service, so it is kept
 * outside `npm test`: local product work must remain possible when the
 * factory billing service is unavailable. Run it before a paid release.
 */
const product = 'client-request-quote-sheet';
const billingBaseUrl = (process.env.BILLING_BASE_URL || 'https://api.sociobot.in').replace(/\/$/, '');
const productUrl = process.env.BILLING_PRODUCT_URL || 'https://client-request-quote-sheet.sociobot.in/';
const checkoutUrl = `${billingBaseUrl}/api/v1/products/${product}/checkout`;
const verifyUrl = `${billingBaseUrl}/api/v1/products/${product}/verify?license=release-contract-probe`;

function fail(message) {
  process.stderr.write(`Billing release check failed: ${message}\n`);
  process.exitCode = 1;
}

async function request(url, options = {}) {
  try {
    return await fetch(url, { signal: AbortSignal.timeout(20_000), ...options });
  } catch (error) {
    fail(`could not reach ${url}: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

const catalogResponse = await request(`${billingBaseUrl}/api/v1/products`, {
  headers: { Accept: 'application/json' },
});
if (!catalogResponse) process.exit();
if (!catalogResponse.ok) {
  fail(`catalog returned HTTP ${catalogResponse.status}`);
  process.exit();
}

let catalog;
try {
  catalog = await catalogResponse.json();
} catch {
  fail('catalog did not return JSON');
  process.exit();
}

const registeredProduct = Array.isArray(catalog?.data)
  ? catalog.data.find((entry) => entry?.slug === product)
  : undefined;

if (!registeredProduct) {
  fail(`product "${product}" is not enabled in the billing catalog`);
  process.exit();
}
if (registeredProduct.checkout_url !== checkoutUrl) {
  fail(`catalog checkout URL is ${JSON.stringify(registeredProduct.checkout_url)}, expected ${checkoutUrl}`);
}
if (registeredProduct.product_url !== productUrl) {
  fail(`catalog return URL is ${JSON.stringify(registeredProduct.product_url)}, expected ${productUrl}`);
}
if (registeredProduct.currency !== 'INR' || registeredProduct.price_minor !== 99_900) {
  fail(`catalog price is ${registeredProduct.price_minor} ${registeredProduct.currency}, expected 99900 INR for the advertised ₹999 unlock`);
}

const checkoutResponse = await request(checkoutUrl, { redirect: 'manual' });
if (!checkoutResponse) process.exit();
if (checkoutResponse.status < 300 || checkoutResponse.status > 399) {
  fail(`checkout returned HTTP ${checkoutResponse.status}; expected a redirect to hosted checkout`);
} else if (!checkoutResponse.headers.get('location')) {
  fail('checkout redirect did not include a Location header');
}

const verifyResponse = await request(verifyUrl, { headers: { Accept: 'application/json' } });
if (!verifyResponse) process.exit();
if (!verifyResponse.ok) {
  fail(`license verification returned HTTP ${verifyResponse.status}`);
} else {
  try {
    const verdict = await verifyResponse.json();
    if (verdict?.valid !== false || typeof verdict?.reason !== 'string') fail('license verification did not return the expected invalid-token verdict shape');
  } catch {
    fail('license verification did not return JSON');
  }
}

if (process.exitCode) process.exit();
process.stdout.write(`Billing release check passed for ${product}. Checkout redirected and license verification is available.\n`);
