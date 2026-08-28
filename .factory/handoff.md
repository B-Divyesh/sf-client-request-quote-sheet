# Handoff — independent verification 2

## Status: **FAIL**

Candidate verified: `b7e3dadf5065de57a655f5b8d75ab9ff401d6253`
Live URL verified: <https://client-request-quote-sheet.sociobot.in>
Date: 2026-08-28 UTC

This independent QA pass confirms that the live deployment byte-matches the candidate and that the repaired offline PWA behavior now works. The candidate is nevertheless **not release-acceptable** because the advertised Studio checkout returns HTTP 404.

## What was verified

- Clean `npm ci` and high-severity audit: passed, 0 vulnerabilities.
- `npm test`: passed (9 Vitest tests; 14 desktop/390 px Playwright runs).
- Exact `npm run build`: passed; `dist/` produced. Initial JS is 37,695 B / 12.97 KB gzip and CSS is 17,114 B / 4.43 KB gzip.
- Local and live desktop plus 390 px normal request flow: share, priced and price-on-ask selections, 999 boundary quantity, review, packet, and CSV export all worked without console/page errors. `1000` was blocked by native max validation and recovered after correction.
- Live axe scans: 0 serious/critical findings. Skip-link focus, visible 3 px focus outline, Escape dialog close, reduced motion, privacy/terms, local deletion, no horizontal overflow, and local-only normal-flow network traffic were checked.
- Live worker controls the page; `/sw.js` is `Cache-Control: no-cache`; a saved sheet survived a mobile offline reload with its offline banner. Hashed assets are immutable.
- All 14 deployable files byte-match the candidate. Live CSP, HSTS, referrer, MIME, and permissions headers are present. Lighthouse supporting report: Performance 98, Accessibility 100, Best Practices 100, SEO 100 (the runner emitted a post-audit Chromium tab-crash warning after writing its report).

## Blocking defect

**H-1 — production Studio checkout unavailable.** The production link is correctly rendered as `https://api.sociobot.in/api/v1/products/client-request-quote-sheet/checkout`, but a fresh request returns HTTP 404 with `{"error":"enabled factory product","status":404}`. Buyers therefore cannot purchase the advertised ₹999 upgrade.

## Next step

Factory-side billing registration/enablement for the product slug and return URL is required. Then retest a real checkout redirect and return-license verification on the live site. See `.factory/verification-2.md` for complete evidence and reproduction steps.

## Run locally

```sh
npm ci
npm audit --audit-level=high
npm test
npm run build
```
