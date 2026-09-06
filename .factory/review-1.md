# Review 1 — Build quote request sheets

## Verdict: PASS

**Finding count: 0. Untested public claim count: 0.**

Implementation candidate reviewed: `35c6a4d9f8c21c46d81f725e251ade50d8c1b5fd`

Documentation commit reviewed: `681a4eb99ff44b3c995edbfe08a604579cf171f2`

Live URL: <https://client-request-quote-sheet.sociobot.in>

Reviewed: 6 September 2026 UTC, from a fresh clone using Node 22 and Playwright 1.58.2.

The implementation candidate is accepted. The later changes between the implementation candidate and the reviewed documentation commit affect `.factory` material and `README.md`, not product source or deploy configuration.

## Job, audience, and first action

- **Job:** Build an allowed service list into a non-binding quote request.
- **Audience:** Service businesses with repeat clients.
- **First action:** Choose **Try it with sample data**. It opens a filled service list for editing.

Fresh 1366×900 desktop and 390×844 phone contexts showed all three items at scroll position zero. The job headline was **Build quote request sheets** and the audience sentence was visible on both screens.

## Clean checkout checks

Fresh clone: `/tmp/client-request-quote-sheet-review-1.PUNzC0/repo`, at `681a4eb99ff44b3c995edbfe08a604579cf171f2`.

| Check | Result |
| --- | --- |
| `npm ci` | PASS; 181 packages installed and 0 vulnerabilities reported |
| `npm audit --audit-level=high` | PASS; 0 vulnerabilities |
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| `npm test` | PASS; 10 Vitest tests and 50 desktop/phone Playwright tests |
| `npm run build` | PASS; `dist/index.html` at artifact root |
| `npm run test:billing-live` | PASS; catalog, USD 9.99 price, return URL, hosted checkout redirect, and invalid-license response |
| Live Playwright suite | PASS; 50 desktop/phone checks |

The build produced 41,497 B JavaScript (13.97 kB gzip) and 19,373 B CSS (4.87 kB gzip), within the static-product budgets.

## Declared claims

All 15 literal commands from `.factory/claims.json` passed individually in the clean clone. The registry has 15 IDs, each has exactly one `@claim:` test tag, and there are no extra or duplicate tags.

| Claim IDs verified | Result |
| --- | --- |
| `demo-sandbox`, `packet-exports`, `offline-reload`, `offline-exports`, `packet-import-export` | PASS |
| `packet-copy`, `packet-email`, `price-on-ask`, `studio-closing`, `studio-reference` | PASS |
| `studio-credit`, `studio-license-restore`, `local-data-deletion`, `local-only`, `studio-price` | PASS |

The live billing check is part of the exact `studio-price` claim command and passed. Landing copy, demo copy, legal copy, footer copy, and README claims were compared with the registry. No public claim was missing a complete observable test.

## Live workflow and recovery checks

- In fresh desktop and phone contexts, the one-click sample loaded **Northline Studio** with **Brand review**, **Landing page**, and **Custom support**. The persistent demo banner, **Reset demo**, and **Start for real** controls were present.
- An immediate demo edit followed by reset restored Northline Studio. Leaving demo restored separate real-workspace markers (`Real workspace desktop` and `Real workspace phone`), proving that demo did not change real data.
- The live suite passed normal packet creation, CSV/PDF/JSON export, JSON re-import, copy, email, priced and price-on-ask output, invalid share-link recovery, empty selection, max quantity, negative price, malformed packet recovery, and local-data deletion choices.
- Keyboard skip, checkbox selection, dialog Escape, dialog focus restoration, client-route focus/announcement, Back navigation, visible focus, 44 px mobile targets, and reduced-motion behavior passed.
- Offline reload and offline CSV export passed in independent fresh browser contexts after service-worker control.

This is a static PWA. Backend tenant isolation, restart persistence, health, and rate-limit checks do not apply. There is no account, database, CLI, desktop artifact, or AI action.

## Accessibility, routes, privacy, and deployment

- Axe scans on `/`, `/?demo=1`, `/privacy`, `/terms`, `/#sheet=broken`, and `/missing-page` found zero serious or critical violations at desktop and phone sizes.
- `/`, `/?demo=1`, `/privacy`, and `/terms` returned 200 with distinct browser titles. The designed `/missing-page` returned intentional HTTP 404 with header, navigation, skip link, main landmark, H1, footer, and a home link.
- The only console message for `/missing-page` was the browser's expected failed-resource message for the deliberate HTTP 404 navigation. It was not an application error. Other checked routes had no console or page errors.
- All same-origin links found on the landing page returned 200. The production checkout redirects to hosted checkout; no payment was submitted.
- Normal request work stayed on the product origin. No analytics, remote fonts, runtime CDN, or unexpected third-party request appeared. Billing is contacted only by explicit license or checkout work.
- Root headers include self-only CSP with the necessary Sociobot billing exception, HSTS, strict-origin referrer policy, MIME-sniffing protection, and a restrictive permissions policy. `/sw.js` is `no-cache`.
- All 18 public files from the clean build SHA-256 byte-match the live responses. `staticwebapp.config.json` remains deployment configuration, not a public asset.

## Earlier finding disposition

| Earlier issue | Current disposition and evidence |
| --- | --- |
| Production Studio checkout unavailable | Repaired. `npm run test:billing-live` passes catalog identity, USD 9.99 price, return URL, hosted redirect, and verification response. |
| Service worker cached immutable | Repaired. Live `/sw.js` has `Cache-Control: no-cache`; update, offline reload, and offline export tests pass. |
| Skip link did not move focus | Repaired. Keyboard test focuses `main#main`. |
| Quantity 1000 display observation | Safely blocked by native maximum validation; the live suite verifies recovery at 999 before a packet can be prepared. |
| Mobile controls below 44 px | Repaired. The phone suite measures all interactive controls at least 44×44 CSS px. |
| Deferred autosave after rapid hash navigation | Repaired. Local and live regression coverage passes without a page error. |
| Demo reset preserved an immediate edit | Repaired. The exact demo claim covers immediate edit, reset, reload, and real-workspace isolation. |
| Nine public behaviors lacked claim tests | Repaired. The registry now has 15 complete, unique claim commands and tags. |
| Client-route changes did not focus or announce | Repaired. Forward and Back route tests focus the H1 and verify the polite announcement. |
| 404 lacked shared structure | Repaired. The intentional 404 has the required shared site structure and way home. |
| Landing first screen and footer were incomplete | Repaired. Job, audience, first action, action result, and three facts are visible before scrolling on desktop and phone; required steps and attribution are present. |
| Sitemap omitted the demo URL | Repaired. Live sitemap lists `/?demo=1`. |

No product code was changed during this review.
