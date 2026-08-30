# Request Sheet

Request Sheet is a local-first quote-request handoff for freelancers and small service businesses. An owner lists the work clients may request. Each line has an indicative price or “price on ask.” The owner then shares one encoded link. A client selects quantities and adds contact details and requirements. The resulting packet can be reviewed as CSV, PDF, JSON, copied text, or email.

It deliberately does not provide checkout, inventory, accounts, payment collection, automatic acceptance, or a CRM.

## Product flow

1. The owner edits the example item list and creates a share link.
2. The complete item list is encoded in the URL fragment; it is not uploaded.
3. The client selects work and reviews the explicit estimate/non-binding notice.
4. The client downloads or sends a request packet.
5. The owner can open the JSON packet on the home page and export it again as CSV or PDF.

Drafts and configuration stay in browser `localStorage`. The service worker caches the application shell for repeat offline use. There are no analytics, remote fonts, runtime CDNs, or application database. See `/privacy` and `/terms` in the app.

## Develop and verify

Requires Node.js 22+.

```sh
npm install
npm run dev
npm test
npm run lint
npm run typecheck
npm run build
```

Open `/?demo=1` or choose **Try it with sample data** for an isolated sample. Demo changes use `demo:` local-storage keys. **Reset demo** clears only those keys. **Start for real** discards them before opening the real workspace.

`npm test` runs Vitest and Playwright 1.58.2 checks in desktop Chromium and a 390×844 mobile viewport. `npm run lint` checks source and tests. `npm run typecheck` runs strict TypeScript checking. Deploy the generated `dist/` directory with `index.html` at its root.

Run the same browser suite against a deployed site with `PLAYWRIGHT_BASE_URL=https://example.test npm run test:e2e`.

## Paid unlock

Studio is a $9.99 USD one-time presentation upgrade. It removes the Request Sheet credit and adds a custom closing line and client-reference field. Sharing and every export format remain free.

Release builds use the Sociobot production billing endpoint by default. Buyers return from hosted checkout with a license token. For a registered pilot product only, opt into the pilot endpoint explicitly.

```sh
VITE_BILLING_BASE_URL=https://pilot-api.sociobot.in npm run build
```

Checkout and verification follow `/api/v1/products/client-request-quote-sheet-studio/...`; there is no payment-provider code or product ID in this repository.

Before deploying a paid release, run the live factory contract check.

```sh
npm run test:billing-live
```

It verifies the exact product, $9.99 USD price, and return URL in the production catalog. It also checks the hosted redirect and license-verification response. This check runs separately because it depends on the factory billing service.

## Structure

- `src/main.ts` — owner builder, client request flow, legal views and interaction binding
- `src/encoding.ts` — safe URL item-list codec and request-packet validation
- `src/exports.ts` — CSV, text and dependency-free PDF generation
- `src/license.ts` — cached one-time license restore/verification
- `public/sw.js` — versioned offline application shell
- `.factory/design.md` — product-specific visual system and image provenance

## License

MIT. See [LICENSE](LICENSE).
