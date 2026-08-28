# Handoff — Request Sheet v1

## Shipped

- A responsive, monochrome broadsheet interface based on `.factory/design.md`, with an original generated editorial docket image in responsive AVIF, WebP and JPEG formats.
- Owner workflow: edit business details and up to 20 allowed items, choose priced or price-on-ask lines, autosave locally, and create/copy/open a self-contained share link.
- Client workflow: select items, adjust quantities, see a priced-line estimate, enter minimal contact/context, review the non-binding status, and create a reference-numbered request packet.
- Owner handoff: CSV and lightweight PDF quote-draft exports, portable JSON packet, copied plain-text summary, email handoff, and local JSON packet import/re-export.
- First-class invalid-link, form error, empty-selection, offline, saved, and license states. Local data deletion is available from every page.
- Studio one-time unlock through the Sociobot contract: pilot checkout link, return-token capture and URL cleanup, once-daily cached verification, optimistic cached access, revoked/invalid handling, and manual license restore. No accessibility, safety, sharing, or export feature is gated.
- Direct `/privacy` and `/terms` routes, Azure Static Web Apps navigation/security headers, manifest, service worker and local-only data model.

## Verification

Run from `/work/repo`:

```sh
npm install
npm test
npm run build
```

Verified 2026-08-28:

- `npm test`: 6 Vitest assertions and 8 Playwright project tests passed (desktop Chromium + 390×844 mobile).
- End-to-end test covers build → share → select → validate → review → packet → CSV download; it also checks no browser console/page errors and no serious/critical axe violations.
- `npm run build`: passes TypeScript and writes `dist/index.html`.
- Initial production assets, uncompressed: 37.1 KB JS, 17.1 KB CSS; 960 px hero is 15.8 KB AVIF / 32.0 KB WebP / 66.3 KB JPEG. All are below the stated budgets.
- Lighthouse mobile against the production build: Performance 100, Accessibility 100, Best Practices 100, SEO 100; LCP 1.2 s, CLS 0, Total Blocking Time 10 ms. INP is not available from a synthetic no-interaction run; the end-to-end flow exercises interaction paths.
- Manual production-browser offline reload passed after service-worker activation; the page reports its offline state and retains the builder/export functionality.
- `npm audit`: 0 production and development vulnerabilities.

## Deployment

- Build command: `npm run build`
- Static output: `./dist`
- Release should set `VITE_BILLING_BASE_URL=https://api.sociobot.in`; without it, the documented staging default is `https://pilot-api.sociobot.in`.
- The factory must register the `client-request-quote-sheet` paid product and return URL; no opaque product ID is hardcoded here.

## Known constraints / next steps

- Static email links cannot attach downloaded files; clients may send the prefilled text or attach the JSON/PDF/CSV themselves. A remote inbox is intentionally out of v1 scope.
- PDF uses the browser-independent built-in Helvetica PDF font. CSV/JSON preserve Unicode; PDF transliterates Latin diacritics and omits unsupported non-Latin glyphs. A future self-hosted subset font can broaden PDF scripts while staying inside the JavaScript budget.
- Share links contain the catalogue and are intentionally bearer-readable. They never contain client details. Very long catalogues are capped at 20 items to keep links practical.
- No live production billing call was made from this work order; mocked verification covers the contract and the factory completes registration/release switching.
