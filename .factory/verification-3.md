# Independent verification 3 — FAIL

**Candidate:** `91d874070479203c5e23a463cc4732d1f2f777f5`<br>
**Live URL:** <https://client-request-quote-sheet.sociobot.in><br>
**Verified:** 2026-08-28 UTC from a clean checkout, Node 22.23.2, Playwright 1.58.2 / Chromium 145.0.7632.6.

## Verdict

**FAIL.** The free, local-first request-to-quote workflow is useful and works end to end. The live static deployment byte-matches the candidate, all local gates pass, accessibility automation is clean, performance is within budget, and PWA offline/update behavior works. Release acceptance is nevertheless blocked because the advertised ₹999 Studio checkout cannot start: the exact production endpoint still returns HTTP 404 and the product is absent from the production billing catalog.

## Clean local gates

The worktree was clean at the exact candidate and `origin/main` resolved to the same SHA before testing.

| Check | Fresh result |
| --- | --- |
| Install | `npm ci` passed; 63 packages installed/audited. |
| Dependency audit | `npm audit --audit-level=high` passed with 0 vulnerabilities. |
| Unit/integration/browser tests | `npm test` passed: 9 Vitest tests and 14 Playwright tests (7 each in desktop Chromium and 390×844 mobile). |
| Type check and exact production build | `npm run build` passed (`tsc --noEmit && vite build`) and produced `dist/`. |
| Lint | No lint script or lint configuration exists; TypeScript checking is part of the build. |
| Live billing release gate | `npm run test:billing-live` failed: `product "client-request-quote-sheet" is not enabled in the billing catalog`. |

No library/CLI/backend checks apply: this is a static PWA.

## Independent end-to-end coverage

I independently exercised the local production preview and the live site at 1280×900 and 390×844, rather than relying only on the repository tests.

- Built a customized owner sheet with a priced item and a price-on-ask item, generated its share link, opened the client view, created a request, reviewed the explicit non-binding warning, prepared a packet, and downloaded CSV, PDF, and JSON. CSV quoting and on-ask status were correct, the PDF began with `%PDF-1.4`, and the JSON packet successfully re-imported into the owner view.
- Tested the largest item and text boundaries: 20 allowed items survived a 5,159-character share URL; the 21st add produced the documented limit notice; 700-character instructions, 500-character validity copy, 100-character name, 160-character contact, and 2,000-character requirements all submitted.
- Quantity `1000` produced native `rangeOverflow`, did not open review, and recovered at the supported maximum `999`. Negative price, malformed email, missing business name, and no selected items were blocked, then recovered after correction.
- A malformed `#sheet=broken` URL showed a clear rebuild recovery page. Invalid JSON packet import showed a corrective error; valid JSON then imported successfully.
- Client contact and requirements never entered the share URL. Normal owner/client flows requested only their own site origin. No analytics, runtime CDN, remote font, or other third-party request appeared. The explicit license action sent only its token to the Sociobot verification endpoint.
- Local deletion removed all `request-sheet:*` and `sb_license:*` records when license deletion was confirmed. `/privacy` and `/terms` loaded directly.
- A production invalid-token check returned HTTP 200 `{valid:false, reason:"invalid", expires_at:null}`, kept Studio controls locked, and showed that free tools remain available. A mocked successful return on the live bundle stored `sb_license:client-request-quote-sheet`, removed `license` from the URL, and enabled Studio controls. A real successful return cannot be obtained while checkout is unavailable.

Normal tested paths had no console errors, page errors, failed requests, script injection, or horizontal overflow. A low-severity timer race found during an extreme rapid-navigation boundary run is recorded below.

## Accessibility and responsive behavior

- Axe scans of builder, review dialog, prepared packet, broken-link recovery, privacy, and terms states found **0 serious or critical violations** in all four local/live desktop/mobile runs.
- The first Tab focused “Skip to main content”; its computed focus treatment was a `3px` brick-red solid outline with `3px` offset. Enter moved focus to `main#main`.
- Item selection worked with Space. The modal initially focused “Close review,” Escape closed it, and focus returned to “Review request.”
- Reduced-motion emulation matched and reduced transition duration to `1e-05s`, with `scroll-behavior: auto`.
- Mobile had no horizontal overflow. The builder, item ledger, packet actions, and dialog stacked without obscuring content. Visual inspection confirmed the product-specific broadsheet direction on both viewport sizes.
- Factory `verify-url.sh` passed: HTTP 200, 590 ms measured load, title, `lang=en`, one H1, main landmark, image alt, and labeled buttons; no console/page errors.
- One non-axe accessibility defect remains: several mobile legal/footer targets are shorter than the contract's 44 px minimum. See M-1.

## PWA, deployment identity, policies, and budgets

- Service workers controlled fresh local and live mobile contexts. `registration.update()` completed; after forced offline reload, the shell, saved business name, and offline banner remained available with no page error.
- Every one of the **14** public files in the exact candidate `dist/` byte-matched its live URL by SHA-256: HTML, hashed JS/CSS, five responsive hero assets, favicon, manifest, service worker, robots, sitemap, and `llms.txt`. `staticwebapp.config.json` is deployment configuration rather than a public asset. The live deployment therefore matches this candidate's product artifact.
- Live `/`, `/privacy`, and `/terms` returned HTTP 200. HTML used `public, must-revalidate, max-age=30`; hashed JS used `public, max-age=31536000, immutable`; `/sw.js` used `no-cache`.
- Live headers included HSTS, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Content-Type-Options: nosniff`, restrictive camera/microphone/geolocation Permissions-Policy, and CSP limited to self plus `https://api.sociobot.in` for billing connections/forms. Billing CORS explicitly allowed the live origin.
- Entry JS is 37,695 B / 12.97 KB gzip; CSS is 17,114 B / 4.43 KB gzip; there are no font files; the mobile hero AVIF is 15,761 B. All pass the 200 KB JS, 50 KB CSS, 120 KB font, and 300 KB mobile-hero budgets.
- Lighthouse 12.8.2 mobile simulation on the live URL scored **100 Performance / 100 Accessibility / 100 Best Practices / 100 SEO**. FCP 1.2 s, LCP 1.2 s, TBT 30 ms, CLS 0, Speed Index 1.3 s, and initial transfer 36 KiB. Lab Lighthouse does not produce a real-user INP value; TBT is supporting responsiveness evidence.

## Defects

### H-1 — Release blocker: advertised Studio checkout is unavailable

At `2026-08-28T06:27:27Z`, fresh production evidence was:

```text
GET https://api.sociobot.in/api/v1/products
→ 200; 37 products; no client-request-quote-sheet entry

GET https://api.sociobot.in/api/v1/products/client-request-quote-sheet/checkout
→ 404 {"error":"enabled factory product","status":404}

GET https://api.sociobot.in/api/v1/products/client-request-quote-sheet/verify?license=fresh-verification-3-probe
→ 200 {"expires_at":null,"reason":"invalid","valid":false}
```

The live “Buy Studio once” link points to that exact checkout URL. Buyers cannot purchase the advertised ₹999 one-time unlock or obtain a real return token. The healthy verify endpoint and exact candidate/live artifact match isolate the defect to missing production billing registration/enablement, not static configuration or a stale deployment.

**Required fix:** register/enable `client-request-quote-sheet` in the Sociobot billing engine with return URL `https://client-request-quote-sheet.sociobot.in/`, price `99900` INR minor units, and hosted checkout. Then require `npm run test:billing-live` to pass and complete one real checkout/return/license verification.

### M-1 — Mobile legal/footer targets are below 44 px

At 390 px, the inline Studio terms/privacy links measured about 15 px high, footer Privacy/Terms links about 24 px high, and “Erase local data” about 32 px high. These are visible interactive targets below the attached accessibility/design contract's 44×44 CSS px minimum. Axe does not flag this rule, so its clean result does not clear the defect.

### L-1 — Deferred autosave can throw after extremely rapid hash navigation

In the automated 20-item/max-text boundary run, navigating programmatically to the generated hash within the 250 ms autosave window produced:

```text
Failed to construct 'FormData': parameter 1 is not of type 'HTMLFormElement'.
```

The client sheet still loaded and submitted. The ordinary “Create share link” → “Open client view” click path did not reproduce locally or live, so this is low severity, but the deferred builder save should be cancelled or tolerate the builder form having been removed.

## Retest

```sh
npm ci
npm audit --audit-level=high
npm test
npm run build
npm run test:billing-live
```

Do not mark release PASS until the live billing gate and a real checkout return pass. Retest M-1 at 390 px and the L-1 rapid-navigation case after product changes.
