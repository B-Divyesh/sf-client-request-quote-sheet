import { describe, expect, it } from 'vitest';
import { billingBaseUrl, checkoutUrl } from './license';

describe('Studio billing endpoint', () => {
  it('uses the production Sociobot billing origin unless a preview explicitly overrides it', () => {
    expect(billingBaseUrl).toBe('https://api.sociobot.in');
    expect(checkoutUrl).toBe('https://api.sociobot.in/api/v1/products/client-request-quote-sheet/checkout');
  });
});
