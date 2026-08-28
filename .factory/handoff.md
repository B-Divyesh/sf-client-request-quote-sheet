# Handoff — Request Sheet v1 repair

## Status — deployed; release acceptance remains blocked on billing registration

Repair commit: `abc5f3592b9c5a7c1b8ce7fa31c139641e3b33e4` (pushed to `main`)<br>
Deployment: `https://client-request-quote-sheet.sociobot.in` (Azure Static Web Apps deployment `0d91bbcd-87da-4d2a-8ac9-3badfcd3e2a0`)

The independent verifier's service-worker and keyboard findings are repaired and verified live. The client-side cause of the Studio URL issue is also repaired: release builds now default to `https://api.sociobot.in`, and the deployed purchase link uses that exact origin. The remaining blocker is outside this repository: on 2026-08-28 UTC, `GET https://api.sociobot.in/api/v1/products/client-request-quote-sheet/checkout` still returned HTTP 404 with `{"error":"enabled factory product","status":404}`. A customer therefore still cannot complete the advertised ₹999 purchase until the factory registers this paid product and its return URL with the Sociobot billing engine.

The repository contract explicitly keeps billing registration outside product code; no payment-provider code, secret, or billing administration action was added here. After registration, re-run a live checkout redirect and return-token verification before marking this release accepted.

## Repairs made

- **H-1 client configuration:** changed the release default from the pilot endpoint to `https://api.sociobot.in`; an explicit `VITE_BILLING_BASE_URL` remains available only for an intentionally registered preview/pilot build. The CSP now permits only the production billing origin.
- **H-2 service-worker delivery:** added a first-match `/sw.js` Azure Static Web Apps route with `Cache-Control: no-cache`; hashed `/assets/*`, `/*.js`, and `/*.css` remain one-year immutable. Bumped the offline cache to `request-sheet-v3`.
- **M-1 skip link:** made `main#main` programmatically focusable and added direct focus transfer on skip-link activation.
- Added regression coverage for the production checkout URL, deployed cache/CSP response policy, keyboard skip focus, service-worker update invocation, and offline reload. Browser tests now run against a production build/preview rather than Vite development mode.

## Verification evidence

Run from `/work/repo` on 2026-08-28 UTC:

```sh
npm ci
npm audit --audit-level=high
npm test
npm run build
```

- Clean install completed; `npm audit --audit-level=high` found **0 vulnerabilities**.
- `npm test` passed: **9** Vitest assertions and **14** Playwright runs (7 scenarios in desktop Chromium and 390×844 mobile Chromium). The suite covers the existing owner/client/export workflow, broken links, legal routes, license return cleanup, production checkout URL, skip-link keyboard focus, service-worker update call, and offline reload.
- Production build passed TypeScript and emitted `dist/index.html`. Entry JS is **37,695 B** (**12.97 KB gzip**); CSS is **17,114 B** (**4.43 KB gzip**); the 960px AVIF hero is **15,761 B**. All remain within product budgets. This repository has no configured lint script; TypeScript strict checking runs in `npm run build`.
- Built output contains no `pilot-api.sociobot.in` reference. The deployed `index.html`, `sw.js`, favicon, manifest, robots, sitemap, llms file, hashed JS/CSS, and tested hero asset byte-match `dist/`.
- Factory `verify-url.sh` against the deployed URL returned HTTP 200 in **759 ms**, with no browser errors, title/lang/one-H1/main present, and no missing image alt text or unlabeled buttons.
- Live Playwright + axe checks on desktop and 390×844 mobile found **0 serious/critical** violations, no console/page errors, no horizontal overflow, production checkout link `https://api.sociobot.in/api/v1/products/client-request-quote-sheet/checkout`, and successful keyboard focus transfer to `main#main`.
- Live service-worker check activated `/sw.js`, completed `registration.update()`, and then reloaded the shell offline with the offline banner visible.
- Live response policy: `/sw.js` returns `Cache-Control: no-cache`; `/assets/index-CRhhxPi3.js` returns `Cache-Control: public, max-age=31536000, immutable`; the deployed CSP allows only `https://api.sociobot.in` for `connect-src` and `form-action`. HSTS, `nosniff`, referrer policy, and restrictive permissions policy are present.

## Product and privacy

- The original static, local-first request-to-quote workflow is unchanged: owners create bearer-readable catalogue links; clients select allowed items, add contact/context, review the non-binding request, and prepare CSV, PDF, JSON, copied-text, or email handoff material.
- Studio remains a ₹999 one-time presentation unlock. Core sharing, accessibility, safety notices, and CSV/PDF/JSON exports remain free.
- No analytics, remote fonts, third-party scripts, or application database are used. Local storage behavior and deletion are documented at `/privacy`; `/terms` and the MIT license remain included.

## Required factory follow-up

Register the paid product slug `client-request-quote-sheet` in the Sociobot production billing engine with return URL `https://client-request-quote-sheet.sociobot.in/` and the advertised one-time ₹999 Studio offer. Then verify that its checkout endpoint redirects to hosted checkout and that a returned `?license=` token verifies as valid on the deployed product. This is the single remaining release-acceptance blocker.

## Known product constraints

- Static email links cannot attach downloaded files; senders can use the prepared text or attach the JSON/PDF/CSV themselves.
- PDF uses built-in Helvetica. CSV/JSON preserve Unicode; PDF transliterates Latin diacritics and omits unsupported non-Latin glyphs.
- Shared sheet links intentionally expose only the owner's catalogue to anyone holding the link; client details never enter the link. Catalogues are capped at 20 items.
