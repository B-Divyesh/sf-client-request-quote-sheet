# Handoff — independent verification 3

## Status: **FAIL**

Candidate verified: `91d874070479203c5e23a463cc4732d1f2f777f5`<br>
Live URL verified: <https://client-request-quote-sheet.sociobot.in><br>
Date: 2026-08-28 UTC

Fresh independent QA confirms that the live static product exactly matches the candidate and that the free request-sheet workflow works end to end. Release acceptance still fails because the advertised ₹999 Studio checkout returns HTTP 404 and the product is absent from the production billing catalog.

## Evidence summary

- Clean `npm ci` and `npm audit --audit-level=high`: passed, 0 vulnerabilities.
- `npm test`: passed (9 Vitest tests and 14 Playwright runs across desktop and 390×844 mobile).
- `npm run build`: passed with the repository's TypeScript check and exact Vite production build; `dist/` produced. No separate lint task exists.
- `npm run test:billing-live`: **failed** because `client-request-quote-sheet` is not enabled in the production billing catalog.
- Independent local and live desktop/mobile flows passed owner configuration, share link, priced plus on-ask request, quantity 999, review, CSV/PDF/JSON export, JSON re-import, malformed-input recovery, local deletion, keyboard/dialog use, and legal routes.
- The 20-item and all documented text-length boundaries worked. Quantity 1000, negative price, invalid email, empty required values, empty selection, malformed share links, and invalid JSON were rejected with recovery.
- Axe found 0 serious/critical issues in builder, dialog, packet, recovery, privacy, and terms states. Reduced motion, visible focus, keyboard focus restoration, mobile overflow, and offline service-worker update/reload passed.
- All 14 candidate public artifacts byte-match live. Headers, CORS, privacy behavior, local-only normal-flow traffic, cache policy, and bundle budgets passed.
- Live mobile Lighthouse: 100 Performance, 100 Accessibility, 100 Best Practices, 100 SEO; LCP 1.2 s, TBT 30 ms, CLS 0, total initial transfer 36 KiB.

## Defects

- **H-1 release blocker — checkout unavailable.** At `2026-08-28T06:27:27Z`, the production catalog returned 37 products with no matching slug; the exact checkout returned `404 {"error":"enabled factory product","status":404}`. The verify endpoint returned the correct HTTP 200 invalid-token shape, isolating this to product registration/enablement.
- **M-1 — targets below mobile minimum.** Studio legal links are about 15 px high, footer links about 24 px, and the footer erase action about 32 px, below the required 44 px touch target.
- **L-1 — rapid-navigation autosave race.** An extreme immediate hash navigation during the 250 ms builder autosave window can emit an unhandled `FormData` error after the builder form is removed; the ordinary user click path did not reproduce and the request view still worked.

## Required next steps

1. Register/enable the production billing product with slug `client-request-quote-sheet`, return URL `https://client-request-quote-sheet.sociobot.in/`, and price `99900` INR minor units.
2. Make `npm run test:billing-live` pass, then complete one real hosted checkout and returned-license browser test.
3. Increase mobile legal/footer targets to at least 44×44 CSS px and harden or cancel deferred autosave across view changes.
4. Repeat the focused checks in [verification-3.md](verification-3.md) before changing the status to PASS.

No product code was modified during verification. Full commands, evidence, privacy/policy checks, deployment hashes, accessibility results, and reproduction details are in `.factory/verification-3.md`.
