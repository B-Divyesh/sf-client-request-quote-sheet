# Build quote-request sheets — independent verification 5

## Verdict: PASS

**Finding count: 0. Untested public claim count: 0.**

Implementation candidate: `35c6a4d9f8c21c46d81f725e251ade50d8c1b5fd`

Documentation evidence commit: `711c81280f892452a7c261efb28e69f5dfddc075`

Documentation citation follow-up and reviewed baseline: `0b67203079f1ec85ad34fcbb9100e7053ec61fbe`

Live URL: <https://client-request-quote-sheet.sociobot.in>

Verified: 6 September 2026 UTC from a fresh clone with Node 22.23.2, npm 10.9.8, Playwright 1.58.2, and Chromium 145.

The implementation is accepted. The live site matches the candidate, the complete request-to-quote job works on desktop and phone, all earlier findings are repaired, every declared claim command passes, and no untested public claim remains.

## Job, audience, and first action

- **Job:** Turn an allowed service list and client selections into a non-binding quote-request packet.
- **Audience:** Freelancers and small service businesses that take requests from repeat clients.
- **First action:** Choose **Try it with sample data**. The page says it opens a filled service list for editing.

In fresh 1366×900 desktop and 390×844 phone contexts, the job headline, audience sentence, sample action, action result, and all three facts appeared before scrolling. The phone view keeps the primary action clear without hiding the real-workspace action.

## Clean checkout and quality gates

Fresh clone: `/work/client-request-quote-sheet-verify5.r4ilYe`, exact reviewed baseline `0b67203079f1ec85ad34fcbb9100e7053ec61fbe`. Product sources are identical to implementation `35c6a4d`; later commits change documentation only.

| Check | Result |
| --- | --- |
| `npm ci` | PASS; 181 packages installed and audited |
| `npm audit --audit-level=high` | PASS; 0 vulnerabilities |
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| `npm test` | PASS; 10 Vitest tests and 50 Playwright desktop/phone runs |
| `npm run build` | PASS; `dist/index.html` is at the artifact root |
| `npm run test:billing-live` | PASS; catalog, price, return URL, checkout redirect, and verify response |
| Live browser suite | PASS; 50/50 against the production URL |
| Independent live browser checks | PASS; 4/4 desktop/phone checks after verifier-fixture corrections |

One first local `npm test` attempt timed out in the desktop deletion test while waiting for its second autosave; the other 49 runs passed. The exact claim command then passed, 10 repeated isolated runs passed, the full live suite passed 50/50, and a second full local `npm test` passed 50/50. The product behavior did not reproduce as a defect, so this is recorded as a runner-only transient rather than a finding.

Build budgets:

| Asset | Size | Budget |
| --- | ---: | ---: |
| Entry JavaScript | 41,497 B raw / 13.97 kB gzip | ≤ 200 kB |
| CSS | 19,373 B raw / 4.87 kB gzip | ≤ 50 kB |
| Fonts | 0 B | ≤ 120 kB |
| Mobile AVIF hero | 15,761 B | ≤ 300 kB |

## Declared claims

Each exact `test` string in `.factory/claims.json` was run from the clean clone. Each claim ID appears in exactly one tagged test; there are 15 tags and 15 unique IDs.

| Claim | Result | Observable evidence |
| --- | --- | --- |
| `demo-sandbox` | PASS | Real marker survived demo use; immediate edit/reset restored Northline Studio; exit cleared all `demo:` keys |
| `packet-exports` | PASS | Populated CSV, PDF `%PDF-1.4`, and structured JSON downloaded |
| `offline-reload` | PASS | Controlled worker reloaded the saved sample while offline |
| `offline-exports` | PASS | A prepared CSV downloaded and contained the client while offline |
| `packet-import-export` | PASS | Valid JSON imported and exported again as populated CSV |
| `packet-copy` | PASS | Clipboard contained the prepared client summary |
| `packet-email` | PASS | `mailto:` contained the expected recipient, subject, client, and line item |
| `price-on-ask` | PASS | On-ask work stayed outside the priced estimate and was labeled in output |
| `studio-closing` | PASS | A licensed closing line appeared on the shared request |
| `studio-reference` | PASS | A licensed reference field appeared and its value entered the JSON packet |
| `studio-credit` | PASS | Licensed removal omitted the Request Sheet credit |
| `studio-license-restore` | PASS | A pasted mocked-valid license enabled Studio controls |
| `local-data-deletion` | PASS | Cancel retained the license; confirmation removed it; sheet data reset both times |
| `local-only` | PASS | The full demo request flow made requests only to the product origin |
| `studio-price` | PASS | Page and catalog say $9.99 USD once; checkout redirects to the hosted merchant; verify returns the expected shape |

The landing page, legal pages, footer, demo copy, and README were cross-checked against this registry. Statements about local work, offline use and export, packet formats, price-on-ask handling, Studio controls and price, deletion, and sandbox isolation are covered. No missing, false, incomplete, duplicate, or untested public claim was found.

## Live workflow evidence

- The one-click sample opened Northline Studio with Brand review, Landing page, and Custom support. The **Demo — sample data, nothing is saved to your real sheet** label remained visible in builder and client views.
- An immediate demo edit followed by **Reset demo** restored the original sample, survived reload, and left the real-workspace marker unchanged. **Start for real** removed demo keys and restored the real workspace.
- A prepared request with `999 × Brand review` and one Custom support line produced a `$449,550.00` priced estimate plus an on-ask line. CSV content preserved the quantity and on-ask status.
- Empty selection produced a specific error. Quantity `1000` set native `rangeOverflow`, did not open review, and recovered at `999`. A negative price blocked sharing and recovered at zero.
- The 20-item maximum held and explained the limit. A malformed JSON packet showed corrective text; a valid packet then imported successfully. A malformed share link showed its rebuild path.
- Copy, email, CSV, PDF, JSON, JSON re-import, legal deletion choices, and Studio controls passed through the declared tests.
- Normal flow traffic stayed on the product origin. No analytics, third-party scripts, remote fonts, or application API requests appeared. Billing traffic occurred only after an explicit license or checkout action.
- The service worker took control, updated successfully, preserved saved work after offline reload, and exported while offline. `/sw.js` is served with `Cache-Control: no-cache`.

This is a static PWA. Backend tenant isolation, server restart persistence, health, and 429/`Retry-After` checks do not apply. No account, database, CLI, desktop installer, or AI action exists. The brief does not imply a useful AI step; deterministic local capture and export are the right scope.

## Accessibility and route behavior

- The factory URL verifier passed `/` and `/?demo=1`: HTTP 200, correct title and `lang=en`, one H1, main landmark, complete image alt text, labeled buttons, and no console or page errors.
- Independent Axe scans reported **zero violations of any severity** on demo, privacy, terms, broken-link recovery, and 404 states at 1366×900 and 390×844.
- The shipped packet-flow scans reported no serious or critical violations. All tested mobile controls measured at least 44×44 CSS px.
- Keyboard-only selection, skip-link focus, dialog entry, Escape close, and focus restoration passed. Hash route changes and browser Back focused the new H1 and updated the polite route announcement.
- Reduced-motion emulation matched and reduced transitions to `1e-05s`. There is no autoplay, flashing, or looping motion.
- `/`, `/?demo=1`, `/privacy`, and `/terms` return 200 with distinct titles. `/missing-page` deliberately returns HTTP 404 and includes skip link, header, navigation, main, H1, footer, and a way home.
- All discovered internal destinations returned 200. The only 404 in the crawl was the current 404 page's own `#main` skip target, which correctly retains the parent HTTP 404 status. Mail links were well formed. The checkout link returned a 303 to hosted checkout.
- The sitemap lists `/`, `/?demo=1`, `/privacy`, and `/terms`.

## Live identity, privacy, and performance

- All 18 deployable files from the clean candidate build byte-match the live responses by SHA-256. `staticwebapp.config.json` is deployment configuration and is not a public file.
- Root headers include the matching self-only CSP with the Sociobot billing exception, HSTS, `Referrer-Policy`, MIME-sniffing protection, and restrictive Permissions-Policy. Hashed assets are immutable; HTML is short-revalidated.
- A fresh hosted-checkout browser reached `checkout.dodopayments.com`, title `Sociobot | Checkout`, and displayed `9.99`. No purchase was submitted. Invalid-token verification remains available.
- Lighthouse 12.8.2 produced a complete live mobile report: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 0.98 s, LCP 1.10 s, TBT 20 ms, CLS 0, Speed Index 0.98 s, and 38,126 B transferred. The CLI reported the known Chromium tab crash after writing the report; separate browser and URL checks closed normally.

## Earlier finding disposition

| Earlier issue | Current disposition |
| --- | --- |
| Production checkout unavailable | Repaired; catalog and hosted $9.99 checkout pass |
| Unversioned service worker cached immutable | Repaired; `/sw.js` is `no-cache`; update and offline reload pass |
| Skip link did not move focus | Repaired; it focuses `main#main` |
| Mobile targets below 44 px | Repaired; complete phone measurement passes |
| Deferred autosave hash-navigation error | Repaired; exact regression passes locally and live |
| Quantity 1000 display observation | Safely blocked; correction to 999 produces a valid packet |
| Demo reset restored a pending edit | Repaired; immediate edit/reset/reload passes locally and live |
| Nine public behaviors lacked complete claim tests | Repaired; 15 declared claims have 15 unique outcome tests |
| Client route did not focus or announce | Repaired; forward and Back both focus and announce |
| 404 lacked shared structure | Repaired while retaining the correct HTTP 404 status |
| Landing headline, audience, facts, steps, and attribution were incomplete | Repaired and visible at desktop and phone sizes |
| Sitemap omitted the demo URL | Repaired; the live sitemap includes `/?demo=1` |

No product code was changed during verification.
