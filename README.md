# Request Sheet

Request Sheet is a local-first request-to-quote handoff for freelancers and small service businesses. An owner defines the work clients may request, marks each line with an indicative price or “price on ask”, and shares one encoded link. A client selects quantities, adds minimal contact details and requirements, then creates a non-binding request packet the owner can review as CSV, PDF, JSON, copied text, or email.

It deliberately does not provide checkout, inventory, accounts, payment collection, automatic acceptance, or a CRM.

## Product flow

1. The owner edits the example catalogue and creates a share link.
2. The complete catalogue is encoded in the URL fragment; it is not uploaded.
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
npm run build
```

`npm test` runs Vitest unit coverage and Playwright 1.58.2 end-to-end checks in desktop Chromium and a 390×844 mobile viewport. The production build command is exactly `npm run build`; deploy the generated `dist/` directory with `index.html` at its root.

## Paid unlock

Studio is a ₹999 one-time presentation upgrade. It removes the Request Sheet credit and adds a custom closing line and client-reference field. Sharing and every export format remain free.

Release builds use the Sociobot production billing endpoint by default. A registered product sends buyers to hosted checkout and returns them to this site with a license token. For a registered pilot product only, opt into the pilot endpoint explicitly:

```sh
VITE_BILLING_BASE_URL=https://pilot-api.sociobot.in npm run build
```

Checkout and verification follow `/api/v1/products/client-request-quote-sheet/...`; there is no payment-provider code or product ID in this repository.

Before deploying a paid release, run the live factory contract check as well:

```sh
npm run test:billing-live
```

It verifies that the exact product is enabled in the production catalog with the advertised ₹999 INR price and this product's return URL, that checkout redirects to the hosted merchant page, and that license verification responds. It intentionally runs separately from offline/local tests because it depends on the factory billing service.

## Structure

- `src/main.ts` — owner builder, client request flow, legal views and interaction binding
- `src/encoding.ts` — safe URL catalogue codec and request-packet validation
- `src/exports.ts` — CSV, text and dependency-free PDF generation
- `src/license.ts` — cached one-time license restore/verification
- `public/sw.js` — versioned offline application shell
- `.factory/design.md` — product-specific visual system and image provenance

## License

MIT. See [LICENSE](LICENSE).
