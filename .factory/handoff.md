# Handoff — Request Sheet offline PWA repair

## Status

Repair commit: `108b8ea05439b8a87c79b05fe9add90afc5fc2e8` (pushed to `main`)<br>
Deployed static site: <https://client-request-quote-sheet.sociobot.in>

The failed offline regression is repaired and deployed. The original Vite + TypeScript static artifact remains `dist/` with `index.html` at its root.

## What changed

- Reproduced the prior browser failure from a clean production build: after going offline, the page contained only the static skip link because the module script received the HTML fallback instead of its cached JavaScript.
- Root cause: Vite Preview responses vary by `Origin`. The service worker precached the built module, but `caches.match(event.request)` treated the later module request as a Vary mismatch; the catch-all HTML fallback then caused a module MIME error.
- Bumped the offline cache to `request-sheet-v4`. Precache lookup now uses `ignoreVary: true`, and the HTML fallback is restricted to navigation requests. Cached JavaScript therefore remains JavaScript when offline.
- Replaced the fragile offline test flow with a focused production-preview regression: it waits for `navigator.serviceWorker.controller`, saves `Offline proof studio`, invokes `registration.update()`, takes the context offline, reloads, and proves the H1, saved sheet value, and offline status banner survive. It runs on both desktop Chromium and the 390×844 mobile profile.
- Preserved the earlier production billing URL, `/sw.js` `Cache-Control: no-cache`, immutable hashed assets, and skip-link focus transfer fixes.

## Verification evidence

Run in `/work/repo` on 2026-08-28 UTC:

```sh
npm ci
npm audit --audit-level=high
npm run build
npm test
```

- `npm ci` completed and `npm audit --audit-level=high` reported **0 vulnerabilities**.
- `npm run build` passed TypeScript and Vite, producing `dist/`. Built entry JS: **37,695 B** (**12.97 KB gzip**); CSS: **17,114 B** (**4.43 KB gzip**); all below the static-product budgets.
- `npm test` passed: **9** Vitest tests and **14** Playwright runs (7 scenarios each in desktop Chromium and 390×844 mobile). Coverage includes owner/client/export flow, invalid share link, direct privacy/terms routes, production billing URL, keyboard skip focus, axe serious/critical checks, returned license cleanup, and the controlled offline reload/update regression.
- Factory `verify-url.sh` passed against the deployed URL: HTTP **200**, **765 ms** load, no console/page errors, title/lang/one H1/main present, no missing image alt text, and no unlabeled buttons.
- Live Playwright checks on both desktop and 390×844 mobile confirmed one H1/main, production checkout URL, keyboard focus transfer to `main#main`, a controlling service worker, no horizontal overflow, and no console/page errors. After offline reload each returned H1 `A request sheet, not a storefront.`, saved value `Live offline proof`, and the offline banner.
- Live response policy: `/sw.js` serves `Cache-Control: no-cache` and contains `request-sheet-v4`; hashed JS serves `public, max-age=31536000, immutable`. CSP permits only `https://api.sociobot.in` for billing connections/forms.
- Live mobile Lighthouse produced **100** Performance, **100** Accessibility, **100** Best Practices, and **100** SEO; FCP **1.00 s**, LCP **1.11 s**, TBT **36 ms**, CLS **0**. Chromium emitted a post-collection tab-crash warning while collecting screenshot/BFCache artifacts, but the JSON report was written and the independent Playwright/URL checks above completed cleanly.

## Product, privacy, and known gap

The local-first request-to-quote workflow, local data deletion, `/privacy`, `/terms`, original generated artwork, and free CSV/PDF/JSON exports are unchanged. There are no analytics, remote fonts, third-party scripts, or application database.

The deployed Studio link correctly targets `https://api.sociobot.in/api/v1/products/client-request-quote-sheet/checkout`, but a direct live request still returned **404** on 2026-08-28 UTC. The required next step is factory-side billing registration of this product slug and its return URL; it is outside this static repository and no payment-provider code or billing credentials were added here.
