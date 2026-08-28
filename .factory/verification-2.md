# Independent verification 2 — FAIL

**Candidate:** `b7e3dadf5065de57a655f5b8d75ab9ff401d6253`
**Live URL:** <https://client-request-quote-sheet.sociobot.in>
**Verified:** 2026-08-28 UTC from a clean checkout, Node 22, Playwright/Chromium 1.58.2.

## Verdict

**FAIL.** The local-first request-sheet product, deployment identity, accessibility, offline PWA behavior, and production-build quality gates pass. The advertised ₹999 Studio purchase cannot start: the exact production checkout URL returns HTTP 404. This is a release-blocking paid-unlock failure outside the static bundle (the live deployment otherwise exactly matches this candidate).

## Reproducible local gates

| Check | Result |
| --- | --- |
| Clean install | `npm ci` completed; `npm audit --audit-level=high` reported 0 vulnerabilities. |
| Unit/integration and browser suite | `npm test` passed: 9 Vitest tests and 14 Playwright runs (7 scenarios in each of desktop Chromium and 390×844 mobile). |
| Type check / exact production build | `npm run build` passed (`tsc --noEmit && vite build`) and wrote `dist/`. |
| Lint | No lint script or linter is configured in `package.json`. |
| Bundle budgets | Entry JS: 37,695 B (12.97 KB gzip); CSS: 17,114 B (4.43 KB gzip); mobile hero AVIF: 15,761 B. All are within the 200 KB JS, 50 KB CSS, and 300 KB mobile-image budgets. |
| Lighthouse, live mobile | Performance 98, Accessibility 100, Best Practices 100, SEO 100; FCP 1.2 s, LCP 1.2 s, TBT 140 ms, CLS 0. Lighthouse wrote the JSON report but emitted a post-audit Chromium-tab-crash warning, so the score is supporting evidence; the independent browser checks below completed cleanly. |

## End-to-end evidence

- On both local production preview and the live site, at desktop and 390 px, I created a share link, opened it, operated item checkboxes and fields with the keyboard, selected both a priced item and an on-ask item, entered quantity **999**, completed minimal contact details and requirements, reviewed the explicit non-binding notice, prepared a packet, and downloaded CSV. The review showed `999 × Brand review` and `On ask`; the CSV contained the submitted client name.
- Client contact text was not present in the shared URL. The normal-flow network log contained only the corresponding site origin; no analytics, remote fonts, runtime CDNs, or unexpected third-party requests were observed.
- The invalid boundary `1000` sets native `rangeOverflow` with “Value must be less than or equal to 999.”, does not open the review dialog, and recovers successfully after correction to `999`. A malformed `#sheet=broken` route presents the “This request sheet is incomplete.” recovery page.
- Local data deletion was exercised on live: one product local-storage record before deletion and zero after confirming sheet-data deletion. `/privacy` and `/terms` direct-load.
- Axe Playwright scans found **0 serious or critical violations** after the completed packet flow in each local/live, desktop/390 px run. There was no mobile horizontal overflow and no console or page errors.
- Keyboard: Tab exposes the skip link with a `rgb(181, 58, 36) solid 3px` outline and 3 px offset; Enter places focus on `main#main`. The native review dialog can be closed with Escape. Reduced-motion emulation matched and reduced transition/animation duration to `1e-05s`.
- PWA: on the live 390 px site a controlling worker registered at `/sw.js`; `registration.update()` completed, `/sw.js` fetched HTTP 200 with `Cache-Control: no-cache`, then an offline reload preserved the saved builder value `Live offline proof`, loaded the H1, and showed the offline banner. This independently confirms the earlier offline deployment regression is repaired.

## Deployment identity, privacy, and response policy

- Every 14 deployable candidate files byte-matched its live URL: HTML, JS, CSS, five responsive hero variants, manifest, service worker, favicon, robots, sitemap, and `llms.txt`. `staticwebapp.config.json` is deploy configuration, not a public artifact. The live service is the tested candidate build.
- Live `/` returns CSP restricting scripts/styles to `self`, `connect-src` and `form-action` to `self` plus `https://api.sociobot.in`, HSTS, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Content-Type-Options: nosniff`, and restrictive camera/microphone/geolocation Permissions-Policy.
- Live hashed JS is `public, max-age=31536000, immutable`; the unversioned `/sw.js` is correctly `no-cache`. The app uses local storage, offers deletion, includes `/privacy` and `/terms`, and ships no third-party font or script.

## Release-blocking defect

### H-1 — Production Studio checkout is unavailable

**Evidence:** the live “Buy Studio once” link exactly matches the contract URL:

```text
https://api.sociobot.in/api/v1/products/client-request-quote-sheet/checkout
```

A fresh request on 2026-08-28 returned **HTTP 404** with:

```json
{"error":"enabled factory product","status":404}
```

The companion verify endpoint returned HTTP 200 for a placeholder token (`{"valid":false,"reason":"invalid","expires_at":null}`), so this is specifically an unavailable checkout/product-registration issue, not a stale static configuration. The page markets the Studio upgrade for ₹999 and links buyers to this endpoint.

**Impact:** a buyer cannot purchase the advertised one-time upgrade or obtain a working license. This violates the paid-unlock contract and blocks release acceptance even though all free core functions remain usable.

**Required resolution:** register/enable `client-request-quote-sheet` and its return URL in the Sociobot billing engine, then verify an actual hosted-checkout redirect and returned-license verification on the live URL. No product-code change is indicated by this evidence.

## Retest commands

```sh
npm ci
npm audit --audit-level=high
npm test
npm run build
```

After billing registration, retest the production checkout redirect and a real return token; also retain the live offline reload/update check above.
