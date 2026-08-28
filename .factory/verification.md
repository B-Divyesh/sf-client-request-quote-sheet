# Independent verification 1 — FAIL

**Candidate:** `538ca2d443e09891d96859269375324964db705a`  
**Live URL:** <https://client-request-quote-sheet.sociobot.in>  
**Verified:** 2026-08-28 UTC, from a clean checkout with Node 22.23.2, Chromium 145 / Playwright 1.58.2.

## Verdict

**FAIL.** The central free request-to-quote flow is sound, but the live, advertised Studio purchase flow is unavailable: its checkout endpoint returns HTTP 404. The PWA also sends a one-year immutable cache policy for its unversioned service-worker script, so installed clients cannot reliably receive updates. These defects must be resolved and reverified before release acceptance.

## Reproducible local gates

| Check | Result |
| --- | --- |
| Clean install | `npm ci` completed; `npm audit` reported 0 vulnerabilities |
| Unit + integration | `npm test` passed: 6 Vitest assertions and 8 Playwright tests (desktop + 390×844 mobile) |
| Type check / exact production build | `npm run build` passed (`tsc --noEmit && vite build`) and produced `dist/` |
| Lint | No lint script or linter is configured in this repository |
| Bundle budget | Initial JS 37,558 B (12.94 KB gzip); CSS 17,114 B (4.43 KB gzip); all within 200 KB JS / 50 KB CSS. Mobile AVIF hero is 15,761 B |
| Lighthouse, local production preview | Performance 97, Accessibility 100, Best Practices 100, SEO 100; FCP 1.0 s, LCP 1.2 s, TBT 190 ms, CLS 0. The Lighthouse runner emitted a post-audit Chromium tab-crash runtime warning, so the scores are supporting evidence rather than a clean runner completion. |

## End-to-end and UX evidence

- Desktop and 390×844 mobile: created a share link, opened the client sheet, selected an item using keyboard Space, completed name/contact, reviewed the non-binding notice, prepared a packet, and downloaded CSV, PDF, and JSON. The product prevented final submission with a typed quantity of `1000` (`max=999`); a boundary quantity of `999` exported successfully.
- Invalid `#sheet=broken` link shows the recovery page; empty selection and required-field validation are covered by the application and repository test suite. Legal routes direct-load.
- Desktop and mobile had no horizontal overflow at 390 px. Original imagery loaded successfully. The normal flow logged no console errors or page errors.
- Axe (`@axe-core/playwright`) found **0 serious/critical** violations on the packet-ready client flow, locally and live.
- Reduced-motion CSS is present. A local production service-worker install and offline reload succeeded; the offline status banner appeared and the shell loaded from cache.
- Keyboard defect: after Tab to “Skip to main content” and Enter, focus became `BODY`, not `#main` (which has no `tabindex`). See defect M-1.

## Privacy, network, headers, and live identity

- Normal local and live flows made requests only to the site origin (`/`, current hero AVIF, hashed JS, hashed CSS). No analytics, remote fonts, scripts, or unexpected outbound requests were observed. The only code-level external endpoints are the Sociobot billing APIs.
- Live response headers include CSP limiting scripts/styles to `self`, `connect-src` and `form-action` to the two Sociobot API origins, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Content-Type-Options: nosniff`, restrictive Permissions-Policy, and HSTS. Hashed JS/CSS/assets are long-lived immutable as appropriate.
- `/privacy` and `/terms` direct-load successfully; local storage is described and a deletion control exists.
- All **12 deployable** files from the candidate `dist/` directory byte-match the live URL (HTML, JS, CSS, images, manifest, service worker, robots, sitemap, favicon and llms file). `staticwebapp.config.json` is deployment configuration and is intentionally not a public asset. The live site is therefore the candidate build, not a stale deployment.

## Release-blocking defects

### H-1 — Studio purchase flow is broken in production

**Evidence:** the live “Buy Studio once” link is `https://pilot-api.sociobot.in/api/v1/products/client-request-quote-sheet/checkout`; a fresh GET on 2026-08-28 returned HTTP `404` with JSON. The production endpoint required by the product contract, `https://api.sociobot.in/api/v1/products/client-request-quote-sheet/checkout`, also returned HTTP `404`.

**Impact:** a customer cannot buy the advertised ₹999 one-time upgrade or obtain a working paid license. The live build uses the staging/pilot default rather than the release API, and the product is not registered at either queried endpoint.

**Required resolution:** register the paid product and return URL with the Sociobot billing engine, build/redeploy with `VITE_BILLING_BASE_URL=https://api.sociobot.in`, then verify a successful checkout redirect and return-token verification against the live product.

### H-2 — Service-worker updates are not safely cacheable

**Evidence:** live `/sw.js` returns `Cache-Control: public, max-age=31536000, immutable`. The service worker is named `/sw.js` rather than content-hashed; the broad `/*.js` immutable route in `public/staticwebapp.config.json` applies to it. In a local production preview, a registered worker's explicit `registration.update()` did not fetch a substituted new `/sw.js` response or install an update while the immutable response was fresh.

**Impact:** installed users can remain on an obsolete shell after a release, including after bug or security fixes. This fails the required PWA update check.

**Required resolution:** serve `/sw.js` with `Cache-Control: no-cache` (or similarly revalidating policy), retain immutable caching only for content-hashed assets, and reverify an update from an old worker to a changed worker plus offline reload.

### M-1 — Skip link does not move keyboard focus into main content

**Evidence:** on the live-equivalent production build at 390 px, Tab focuses “Skip to main content”; Enter leaves `document.activeElement` as `BODY`, not the `main#main` target.

**Impact:** keyboard and screen-reader users cannot reliably bypass the navigation to the working content. This falls short of the stated keyboard/skip-link baseline.

**Required resolution:** make the main target programmatically focusable (for example `tabindex="-1"`) and transfer focus on skip activation; recheck with keyboard only.

## Non-blocking observation

- Typing `1000` into a quantity field immediately displays an estimate clamped to 999 while the field continues to display 1000. Native `max=999` validation prevents review/submission, so no incorrect packet is produced, but normalizing the displayed value or showing an inline explanation would make boundary recovery clearer.

## Retest command set

```sh
npm ci
npm test
npm run build
# serve dist and exercise the flows above in Chromium/Playwright
```

Retest H-1 on the deployed URL only after billing registration and production configuration, and retest H-2 with a previously installed service worker before changing this verdict.
