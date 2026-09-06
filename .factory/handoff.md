# Handoff — repair 5

## Status: PASS

Implementation candidate: `35c6a4d9f8c21c46d81f725e251ade50d8c1b5fd`
Documentation evidence commit: `711c81280f892452a7c261efb28e69f5dfddc075`
Live URL: <https://client-request-quote-sheet.sociobot.in>
Verified and deployed: 2026-09-06 UTC

## Product check

- **Job:** Turn an allowed service list and client selections into a non-binding quote-request packet.
- **Audience:** Freelancers and small service businesses with repeat clients.
- **First action:** Choose **Try it with sample data**; it opens a filled service list for editing.

Fresh desktop and 390 × 844 phone checks confirm that the job, audience, sample action, its result, and the three plain facts appear before the hero image. The visual system remains the documented monochrome request-docket broadsheet.

## What changed

- Cancel pending builder and client-draft timers before **Reset demo** clears demo storage. An immediate edit → reset → reload now restores Northline Studio and cannot write into `demo:` afterward.
- Add a dedicated polite route announcer and focus each new route H1 after client-sheet hash navigation and browser back navigation.
- Give the deliberate static 404 a skip link, shared header/navigation, focusable main, footer, plain recovery copy, and the existing HTTP 404 status.
- Make the landing headline name the job, name service businesses in the supporting sentence, put the three facts in the phone first screen, add three clear **How it works** steps, and add the Param Factory footer attribution.
- Add the public `?demo=1` entry to the sitemap.
- Expand `.factory/claims.json` from 5 to 15 outcome-based claims. New browser claims cover offline export, packet import/re-export, copy, email, price-on-ask handling, all three Studio presentation controls, pasted-license restore, and both data-deletion choices.
- Add `.factory/catalog-description.txt` and the required evidence copy. The catalog description is: “Build quote request sheets for repeat-client service businesses.”

## Verification

From the documented clean setup:

```sh
npm ci
npm audit --audit-level=high
npm run lint
npm run typecheck
npm test
npm run build
npm run test:billing-live
```

All passed. `npm test` passed 10 unit tests and 50 Playwright desktop/mobile runs. Each of the 15 exact claim commands in `.factory/claims.json` was also run individually with the documented Chromium project; all passed. The live billing contract passed: the registered Studio offer redirects to hosted checkout and returns the expected invalid-license response shape.

Live HTTPS verification after deployment:

- `PLAYWRIGHT_BASE_URL=https://client-request-quote-sheet.sociobot.in npm run test:e2e` passed all 50 runs in fresh desktop and phone contexts.
- `/opt/fleet/lib/verify-url.sh` passed: HTTP 200, 706 ms measured load, no console/page errors, title, `lang=en`, one H1, main landmark, image alt text, and labeled buttons.
- Route checks: `/`, `/?demo=1`, `/privacy`, and `/terms` returned HTTP 200 with their own correct titles; `/missing-page` returned HTTP 404 with one H1 and main.
- Playwright axe scans found no serious or critical issues across builder, client, legal, recovery, and 404 states. Keyboard, visible focus, 44 px targets, reduced motion, valid/invalid/boundary/recovery flows, local deletion, and offline reload/export passed.
- All 18 deployable public files byte-match the live responses. Root policy headers include the expected CSP, referrer policy, MIME protection, and permissions policy; `/sw.js` is `Cache-Control: no-cache`.
- Lighthouse live mobile report: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 1.00 s, LCP 1.11 s, TBT 38.5 ms, CLS 0. The Lighthouse runner wrote this valid report, then reported a Chromium tab crash during teardown; separate browser checks completed cleanly.

## Deployment

Built `dist/` and deployed it with the factory static deploy tool to the existing `sf-client-request-quote-sheet` Azure Static Web App. The deploy reused the existing app and its production domain; HTTPS now serves the implementation asset `index-CdVANELG.js` from the implementation SHA above.

## Known limits

- Studio checkout, catalog price, return URL, and invalid-token verification are live. The automated suite proves paid presentation behavior with a mocked valid billing response and proves pasted-license restoration. It does not complete a real paid purchase or use a real entitlement token; that requires a legitimate buyer transaction through the hosted merchant flow.
- No product defects are known. The Lighthouse teardown warning is runner-only evidence, not a page error.
