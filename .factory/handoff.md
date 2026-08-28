# Handoff — billing release-gate repair

## Status: **BLOCKED outside the static product**

Repair commit: `45b3652d8ff4de79ae74ff205ee4193656b4112c` (pushed to `main`)<br>
Deployed static site: <https://client-request-quote-sheet.sociobot.in><br>
Artifact: Vite + TypeScript static site, deployed from `dist/` with `index.html` at its root.

The independent verifier’s only outstanding release blocker, H-1, is a missing Sociobot billing-product registration. The static application already uses the required production checkout URL and its license verification route works; neither production nor pilot has this product enabled. This repair adds an exact, repeatable production billing release gate so this cannot silently ship again. It does not substitute another SKU, hide the advertised paid tier, or alter any free workflow.

## What changed

- Added `npm run test:billing-live` (`scripts/verify-billing-live.mjs`). It checks the production catalog for exactly `client-request-quote-sheet`, its expected return URL and ₹999 INR price, requires checkout to redirect to hosted checkout, and confirms the verify endpoint returns the expected invalid-token response shape.
- Documented that release-only check in `README.md`. It is deliberately separate from offline/local tests because it calls the factory billing service.
- Kept the original Vite static artifact, production billing URL, local-first storage, free exports, service-worker strategy, responsive design, privacy pages, and all prior passing behavior unchanged.

## Verification evidence

Run in `/work/repo` on 2026-08-28 UTC:

```sh
npm ci
npm audit --audit-level=high
npm test
npm run build
npm run test:billing-live
```

- Clean install completed; `npm audit --audit-level=high` reported **0 vulnerabilities**.
- `npm test` passed: **9** Vitest tests and **14** Playwright tests (7 scenarios in desktop Chromium and 390×844 mobile). This includes keyboard skip focus, Axe serious/critical scans, returned-license cleanup, privacy/terms, exports, and controlled offline reload/update behavior.
- `npm run build` passed (`tsc --noEmit && vite build`) and produced `dist/`. Entry JS is **37,695 B** (12.97 KB gzip) and CSS is **17,114 B** (4.43 KB gzip), below static-product budgets. There is no separate lint configuration; the build runs the repository’s TypeScript type check.
- `npm run test:billing-live` intentionally fails now with: `product "client-request-quote-sheet" is not enabled in the billing catalog`. This reproduces the verifier’s H-1 with an executable regression gate rather than allowing a false release pass.
- Deployed `dist/` through `/opt/fleet/lib/deploy-static.sh client-request-quote-sheet dist`. The live JS SHA-256 exactly matches the local built asset: `be463b92deb6cba7884862be26a142d6ec7b77b4830a0913e1662faabeb0cc3b`.
- Factory `verify-url.sh` passed on the deployed URL: HTTP **200**, **854 ms** load, no console/page errors, title/lang/one H1/main present, no missing image alt, and no unlabeled buttons.
- Live Chromium checks passed at desktop and 390 px: skip link focused and moved focus to `main#main`; Axe had **0** serious/critical violations; no console errors or horizontal overflow; normal load used only `https://client-request-quote-sheet.sociobot.in`; the 390 px page had a controlling worker and retained the shell with the offline banner after offline reload/update.
- Live response policy: `/sw.js` is `Cache-Control: no-cache`; hashed JS/CSS are `public, max-age=31536000, immutable`; CSP restricts scripts/styles to self and billing connections/forms to `https://api.sociobot.in`; HSTS, referrer, MIME, and permissions policies are present.
- Mobile Lighthouse wrote **100** Performance, **100** Accessibility, **100** Best Practices, **100** SEO (FCP 0.3 s, LCP 0.3 s, TBT 0 ms, CLS 0). The runner emitted a post-audit Chromium-tab-crash warning after writing JSON, so the independent live browser checks above are the primary evidence.

## Remaining release blocker and exact next step

**H-1 remains unresolved externally:**

```text
GET https://api.sociobot.in/api/v1/products/client-request-quote-sheet/checkout
→ 404 {"error":"enabled factory product","status":404}
```

The same slug is absent from `GET https://api.sociobot.in/api/v1/products`; the pilot endpoint also returns the same 404. The verify endpoint returns HTTP 200 with an invalid-token verdict, confirming this is product enablement/checkout registration rather than an app URL, CSP, or license-client defect.

Factory billing must register/enable `client-request-quote-sheet` with return URL `https://client-request-quote-sheet.sociobot.in/`, price `₹999` (`99900` INR minor units), and the hosted Dodo checkout. Then run:

```sh
npm run test:billing-live
```

It must pass, followed by an actual checkout and returned-license browser retest on the live site. No payment credentials or provider integration were added to this static repository.
