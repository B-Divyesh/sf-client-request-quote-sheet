# Handoff — independent verification 4

## Status: FAIL

Independent verification found **6 findings** and **9 public claims without a complete tagged claim command**. The full report is in `.factory/verification-4.md`.

Implementation candidate: `60ba2c7e3cef45d716ccfb9edd4545a51851ced6`

Documentation baseline: `d3448acdd6b00a6b9dd678b31b1d7bda2de479ae`

Live URL: <https://client-request-quote-sheet.sociobot.in>

Verified: 5 September 2026 UTC

`d3448ac` is report-only. `60ba2c7` is the last implementation/configuration commit and is the implementation reviewed. A fresh build produced 18 public files that all byte-match the live deployment.

## What passed

- Fresh install, audit, lint, strict type-check, 10 unit tests, 28 local browser runs, and production build.
- The same 28 browser runs against live desktop and 390×844 contexts.
- All five declared claims commands, including the production billing gate.
- Normal request flow, CSV/PDF/JSON output, JSON import recovery, price-on-ask output, copy, email link, offline reload/export, local deletion, and demo isolation from real keys.
- Live `$9.99` Studio checkout redirected to hosted Dodo checkout and showed the correct price. A mocked valid production response proved pasted restore and all three presentation controls.
- All earlier checkout, service-worker cache, skip-link, touch-target, and deferred-save navigation findings are repaired.
- Lighthouse report: 100 Performance / 100 Accessibility / 100 Best Practices / 100 SEO. The known post-report Chromium teardown crash remains; the report is valid and other browser checks exit cleanly.

## Release blockers

1. Immediate edit → **Reset demo** preserves the edit through reload; the second reset works. The declared test waits past the race and misses it.
2. Nine public claims have no complete tagged claim command: offline export; JSON import/re-export; copied text; email request; three Studio presentation controls; pasted-license restore; and both local-data deletion choices.
3. Hash-route changes render the client sheet without moving focus to or announcing the new H1.
4. The intentional 404 has the right status and design but lacks the required skip link, header, navigation, and footer.
5. The landing page misses required first-screen/section/footer elements, and the phone first viewport does not show the three plain facts.
6. The sitemap omits `/?demo=1`.

## How to reproduce

```sh
npm ci
npm audit --audit-level=high
npm run lint
npm run typecheck
npm test
npm run build
npm run test:billing-live
PLAYWRIGHT_BASE_URL=https://client-request-quote-sheet.sociobot.in npm run test:e2e
```

For the reset defect, open the live `/?demo=1`, change **Business name**, and immediately choose **Reset demo**. The changed value remains after reload. Choose reset again to recover the original Northline Studio sample.

## Next steps

- Cancel pending demo saves before reset and add an immediate-reset regression.
- Complete `.factory/claims.json` and add one tagged observable test for every public claim.
- Implement route focus/announcement and the required 404/landing/footer/sitemap structure.
- Deploy the repaired artifact and run a fresh independent verification.

No product code was changed in this verification. Only `.factory/verification-4.md`, this handoff, and the required external evidence copies are report outputs.
