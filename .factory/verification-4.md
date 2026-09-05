# Build quote-request sheets — independent verification 4

## Verdict: FAIL

**Finding count: 6. Untested public claim count: 9.**

The useful request-to-quote flow works, the live checkout opens at the advertised price, and all declared commands exit successfully. Release acceptance still fails because the demo reset is unreliable, required route accessibility and site structure are incomplete, and public claims are missing complete tagged tests.

Implementation candidate: `60ba2c7e3cef45d716ccfb9edd4545a51851ced6`

Documentation baseline reviewed: `d3448acdd6b00a6b9dd678b31b1d7bda2de479ae`

Live URL: <https://client-request-quote-sheet.sociobot.in>

Verified: 5 September 2026 UTC

`d3448ac` changes only `.factory/handoff.md`. `60ba2c7` is the last implementation/configuration candidate. A fresh build from the documentation baseline produces the same artifact, and all 18 public files byte-match the live responses by SHA-256. `staticwebapp.config.json` is deployment configuration and is not a public file.

## Job, audience, and first action

- **Job:** Turn an allowed service list and client selections into a non-binding quote-request packet.
- **Audience:** Freelancers and small service businesses that take requests from repeat clients.
- **First action:** Choose **Try it with sample data**. The page says the filled service list opens for editing.

At 1366×900 and 390×844, the headline, explanatory sentence, sample action, and action explanation are visible before scrolling. The three required plain facts are visible on desktop but below the first 844 px phone viewport.

## Findings

### H-1 — Reset demo can save the edit it is supposed to discard

From a fresh live context:

1. Open `/?demo=1`.
2. Change **Business name** to `Immediate reset proof`.
3. Immediately choose **Reset demo**.

The field still reads `Immediate reset proof`, and a reload preserves it. Choosing **Reset demo** a second time restores `Northline Studio`.

The first reset clears demo storage, then the pending 250 ms builder save is flushed during render and writes the edited snapshot back. The declared `@claim:demo-sandbox` test waits for autosave before resetting, so it passes without covering this normal timing boundary. The real-workspace marker remained unchanged, and **Start for real** removed all `demo:` keys.

Required repair: cancel the pending demo save before clearing, or clear again after pending work is cancelled. Add an immediate edit → reset → reload regression.

### H-2 — Nine public claims have no complete tagged claim command

All five commands in `.factory/claims.json` passed, but the registry and tagged assertions do not cover these public behaviors:

1. Exporting while offline. `@claim:offline-reload` checks the cached shell and saved sheet, but never exports a file.
2. Importing a JSON request packet and exporting it again.
3. Copying a prepared request as text.
4. Opening a prepared email request.
5. Applying a Studio custom closing line.
6. Collecting the Studio client-reference field.
7. Removing the Request Sheet credit with Studio.
8. Restoring Studio by pasting a license into the visible form.
9. Erasing sheet data while retaining or removing the license as chosen.

Independent spot checks found each behavior functional: offline CSV contained the client, invalid JSON recovered to a valid imported packet, copy/email output was populated, a mocked valid production-contract response enabled all three Studio presentation controls, pasted restore used the Studio verify URL, and both deletion choices behaved correctly. They remain untested public claims under the attached claims contract because no declared command proves them from a clean sandbox. The public price-on-ask behavior has unit coverage, but it also lacks its own claims entry/tag.

Required repair: register each distinct public claim and give it exactly one tagged observable test. Extend the offline claim test to create and inspect an export while the context is offline.

### M-1 — Client-route changes do not move or announce focus

After generating a sample share link and choosing **Open client view**, the hash route renders `Northline Studio`, but `document.activeElement` is `BODY`; the new `<h1>` is not focused. There is no route-title announcement region. Existing polite regions belong to the estimate and toast.

The skip link, dialog focus entry, Escape close, and focus restoration all pass. This finding is limited to the attached site-structure requirement for route changes and back/forward navigation.

Required repair: after the hash route renders, focus the new programmatically focusable `<h1>` and announce its title in a dedicated polite live region. Add forward/back coverage.

### M-2 — The designed 404 lacks the required shared page structure

An unknown path correctly returns HTTP 404, with the expected title, one `<h1>`, and a working home link. The status is intentional and is not the defect.

The response contains only `<main>`. It has no skip link, header, navigation, or footer, while the attached accessibility and site-structure contracts require those elements on every route.

Required repair: keep the 404 status and design, but add the standard skip/header/nav/main/footer structure.

### L-1 — The landing page misses required plain-words and section elements

- The headline, “A request sheet, not a storefront,” names the artifact and a non-goal rather than the job. It is neither verb-first nor “X for Y.”
- The supporting sentence mentions repeat clients but does not name the service-business audience.
- At 390×844, none of the three required plain facts appears before scrolling.
- There is no **How it works** section with three verb-led steps.
- The footer omits the required “Built by Param Factory” attribution.

The product purpose is understandable from the full first-screen paragraph and the working form, so this is low severity, but it does not meet the attached mandatory first-screen and standard-skeleton contract.

### L-2 — The sitemap omits the public demo URL

`sitemap.xml` lists `/`, `/privacy`, and `/terms`, but not the required public demo entry `/?demo=1`. The demo URL direct-loads successfully and has its own title, so it is a real public place under the attached site-structure contract.

## Declared claims

Each command was run literally from the fresh checkout.

| Claim | Declared command result | Independent live result |
| --- | --- | --- |
| `demo-sandbox` | PASS, 1 browser test | **FAIL at immediate reset boundary**; isolation and exit pass |
| `packet-exports` | PASS, 1 browser test | CSV, PDF, and JSON pass with populated sample output |
| `offline-reload` | PASS, 1 browser test | Reload and saved sheet pass; manual offline CSV passes; declared assertion is incomplete |
| `local-only` | PASS, 1 browser test | Normal demo flow used only the product origin |
| `studio-price` | PASS, browser test plus live billing check | Catalog is 999 USD minor units; clean browser reached hosted Dodo checkout showing 9.99 |

## Clean checkout and build evidence

Fresh clone: `/work/client-request-quote-sheet-verify4.6t1EBo`, exact `d3448acdd6b00a6b9dd678b31b1d7bda2de479ae`, clean before and after verification.

| Check | Result |
| --- | --- |
| `npm ci` | PASS; 181 packages installed |
| `npm audit --audit-level=high` | PASS; 0 vulnerabilities |
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| `npm test` | PASS; 10 Vitest tests and 28 Playwright runs |
| `npm run build` | PASS; `dist/index.html` at artifact root |
| Entry JS | 40,552 B raw / 13.71 KB gzip |
| CSS | 18,125 B raw / 4.60 KB gzip |
| Mobile AVIF hero | 15,761 B |

The full 28-run browser suite also passed against the live HTTPS origin in desktop Chromium and a 390×844 phone context.

## Live workflow evidence

- One-click sample opened Northline Studio with Brand review, Landing page, and Custom support. The demo banner stayed visible in builder and client views.
- A populated request with `999 × Brand review` and `1 × Custom support` produced `$449,550.00 + on-ask items`, contact details, requirements, CSV, PDF, JSON, copied text, and an email link.
- Empty selection showed a specific recovery message. Quantity 1000 remained invalid with `rangeOverflow` and “Value must be less than or equal to 999”; correcting to 999 succeeded. This closes the earlier quantity-display observation without an invalid packet.
- Missing business name, malformed email, and negative price were blocked with native corrective messages, then recovered. The 20-item limit held and explained the limit.
- Malformed share links and malformed JSON packets showed recovery instructions. Valid JSON then imported and exposed all export actions.
- Privacy deletion retained the license when Cancel was chosen and removed it when confirmed. No real data changed during demo checks.
- Reduced motion matched, used `scroll-behavior: auto`, and reduced transitions to `1e-05s`.
- The first Tab focused the skip link with a 3 px brick-red outline and 3 px offset; Enter focused `main#main`. All measured mobile controls remained at least 44×44 CSS px.
- Axe scans in the repository suite found no serious or critical violations across builder, packet, invalid-link, privacy, terms, and 404 states on desktop and phone.
- Factory `verify-url.sh` passed the live demo in 551 ms with no console/page errors, one H1, `lang=en`, main, image alt text, and labeled buttons.
- All 14 unique internal links crawled from the public pages returned 200. The checkout link redirected correctly; privacy and support email links were valid `mailto:` links.
- An intentionally missing route returned HTTP 404 with the designed page. Its browser resource error is expected evidence of the deliberate 404, not a separate defect.

## Checkout, privacy, offline, and response policy

- A fresh desktop checkout reached `checkout.dodopayments.com`, title `Sociobot | Checkout`, and displayed `9.99`. No payment was submitted.
- `npm run test:billing-live` passed the enabled `client-request-quote-sheet-studio` catalog identity, `price_minor: 999`, USD currency, return URL, hosted redirect, and invalid-token response shape.
- Live root HTML is short-revalidated; `/sw.js` is `no-cache`; hashed assets are one-year immutable.
- CSP limits scripts and styles to self, billing connections/forms to `https://api.sociobot.in`, and framing to none. HSTS, MIME sniffing protection, referrer policy, and restrictive permissions policy are present.
- Service-worker control, explicit update, offline reload, saved demo state, and an actual CSV export while offline all passed.
- Normal owner/client traffic used only the product origin. There are no runtime third-party scripts, fonts, analytics requests, or application database calls.
- This is a static PWA. Backend tenant isolation, restart persistence, health, and 429 checks do not apply.

## Performance evidence

Lighthouse 12.8.2 wrote a valid live mobile report with Performance 100, Accessibility 100, Best Practices 100, and SEO 100. FCP was 1.01 s, LCP 1.11 s, TBT 24 ms, CLS 0, and Speed Index 1.01 s. As in the previous handoff, the CLI exited after writing the report because its Chromium tab crashed during teardown; the separate browser, Axe, and URL checks completed cleanly.

## Earlier finding disposition

| Earlier issue | Current disposition |
| --- | --- |
| Production checkout unavailable | Repaired; live $9.99 hosted checkout opens |
| Unversioned service worker cached immutable | Repaired; `/sw.js` is `no-cache`, update/offline checks pass |
| Skip link did not move focus | Repaired; skip link focuses `main#main` |
| Mobile targets below 44 px | Repaired; complete 390 px measurement passes |
| Deferred autosave hash-navigation error | Repaired; exact regression passes locally and live with no page error |
| Quantity 1000 displayed while estimate clamps | Safely blocked by native max validation; correction to 999 succeeds |

No product source was modified during verification.
