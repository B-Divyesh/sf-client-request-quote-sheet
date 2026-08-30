# Handoff — repair 4

## Status: PASS

Base report commit: `b6e7b72f2a4031039e8d137d8ba0690cb1fb3b66`

Repaired candidate: `60ba2c7a` plus this evidence-only handoff commit

Live URL: <https://client-request-quote-sheet.sociobot.in>

Deployment: Azure Static Web Apps, static `dist/`, deployment `3b26b9f2-46a1-489d-be6a-3f5a626c94d8`

Verified: 2026-08-30 UTC

The three verifier findings and the controller's replacement-billing requirement are repaired. The original Vite + TypeScript static/PWA artifact and all previously passing free workflows remain in place.

## Repairs

- **Checkout and price:** Studio now uses the enabled Live SKU `client-request-quote-sheet-studio`. Checkout and verification both use that slug. All product, terms, README, and test copy says **$9.99 USD, one-time**. The license key is now `sb_license:client-request-quote-sheet-studio`; the verdict cache was versioned so an obsolete SKU verdict cannot enable the replacement SKU.
- **Autosave race:** deferred builder saves capture an immutable sheet and are flushed before render. Request-draft timers are also flushed before their form is replaced. The exact synchronous input → submit → hash navigation that previously threw the `FormData` error is a browser regression, followed by the same boundary on the client form.
- **Touch targets:** Studio legal links, footer links, the erase action, navigation, and the dialog close control now retain at least 44×44 CSS px. A 390 px regression measures every visible link, button, input, select, and textarea across builder, legal, client, dialog, and prepared-packet states. It also caught and fixed a fractional flex shrink to 43.98 px.
- **Tryable sandbox:** the first screen now offers **Try it with sample data**. `?demo=1` uses only `demo:` storage keys, shows a persistent banner, resets independently, and deletes demo records before **Start for real**.
- Added the required claims registry, copy audit, demo documentation, route titles, social metadata, derived social/touch assets, and a designed HTTP 404. Unknown live paths return 404; `/privacy` and `/terms` still direct-load with 200.
- Added ESLint and explicit type-check scripts. The service worker remains revalidating and advances to cache `request-sheet-v5`.

## Reproduction and regression evidence

Before changes, an untouched build reproduced the exact race:

```text
input event → builder requestSubmit() → immediate generated #sheet navigation
pageerror: Failed to construct 'FormData': parameter 1 is not of type 'HTMLFormElement'.
```

The regression at `tests/e2e/app.spec.ts` runs that same sequence and waits beyond the old 250 ms timer. It reports no page or console errors and repeats the route-change boundary for the 180 ms client draft timer.

The claims in `.factory/claims.json` each have a tagged browser test. They cover the isolated demo, CSV/PDF/JSON exports, offline reload, same-origin normal-flow traffic, and exact Studio price/checkout identity.

## Local quality gates

Run from a clean dependency install:

```sh
npm ci
npm audit --audit-level=high
npm run lint
npm run typecheck
npm test
npm run build
npm run test:billing-live
```

- Install and audit: passed; 0 vulnerabilities.
- ESLint: passed.
- Strict TypeScript: passed.
- Unit/integration: 10 Vitest assertions passed.
- Browser suite: 28 Playwright runs passed, 14 each in desktop Chromium and 390×844 mobile.
- Production build: passed; `dist/index.html` is at the artifact root.
- Entry JS: 40,552 B raw / 13.71 KB gzip. CSS: 18,125 B raw / 4.60 KB gzip. Mobile AVIF hero: 15,761 B. All budgets pass.
- Axe Playwright found 0 serious or critical violations in builder, prepared packet, invalid-link, privacy, terms, and 404 states.
- Keyboard checks passed skip navigation, Space selection, Enter review, dialog focus entry, Escape close, and focus restoration.
- Offline checks used a new browser context, a controlled worker, explicit `registration.update()`, offline reload, the offline status, and persisted demo data.
- Factory `verify-url.sh` passed the demo URL in 555 ms with no console/page errors, one H1, `lang=en`, main, alt text, and labeled buttons.
- Live Lighthouse JSON: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 0.9 s, LCP 1.1 s, TBT 10 ms, CLS 0, Speed Index 0.9 s. Lighthouse wrote the complete report before its Chromium tab emitted the same post-audit crash seen by prior verification.

## Live checkout, return, identity, and policy evidence

- Production catalog: `client-request-quote-sheet-studio`, `price_minor: 999`, `currency: USD`, and `product_url: https://client-request-quote-sheet.sociobot.in/`.
- Production checkout: HTTP 303 to `https://checkout.dodopayments.com/session/...`; Chromium reached HTTP 200, title `Sociobot | Checkout`, and rendered the `9.99` price.
- Return/license success path: browser test accepts `?license=test-token`, calls `/products/client-request-quote-sheet-studio/verify`, stores the exact replacement-SKU key, strips the token from the URL, and enables Studio after a recorded valid API response.
- Live invalid-token path: production verify returned HTTP 200, the token was stripped and stored under the replacement key, Studio stayed locked, and the free tools remained available.
- `npm run test:billing-live` passed the catalog identity, exact price, return URL, hosted-checkout host, and verify-response contract.
- The full 28-run Playwright suite passed again against the deployed HTTPS origin on desktop and mobile.
- All 18 public `dist/` files byte-matched the live responses by SHA-256. The deployment config is not a public asset.
- Live policy: HTML uses `public, must-revalidate, max-age=30`; `/sw.js` uses `no-cache`; hashed assets use one-year immutable caching. CSP limits scripts/styles to self and billing connections/forms to `https://api.sociobot.in`. HSTS, MIME sniffing protection, referrer policy, and restrictive permissions policy are present.

No real-money payment was submitted during verification. The production hosted checkout and return URL are live; the successful returned-license state is covered with the billing API's valid-response contract, while the real production invalid-token reconciliation was exercised directly.

## Known gaps

No known product release blocker remains. The Lighthouse CLI exits after writing its valid report because its headless Chromium tab crashes during teardown; browser, Axe, and factory URL checks complete cleanly.
