# Request Sheet — visual thesis

## Direction: monochrome typographic broadsheet

Request Sheet should feel like a well-set job docket passed across a counter: formal enough to trust, plain enough to mark up, and visibly separate from a retail storefront. The interface borrows the hierarchy of a black-and-white trade broadsheet—masthead, rules, folios, compact labels, and generous reading columns—without imitating newsprint distress or sacrificing form clarity. There is no generic gradient, dashboard chrome, or card grid.

## Palette

The product is intentionally single-mode, like an inked sheet of warm stock; the background is always explicitly painted.

| Token | Value | Use |
| --- | --- | --- |
| Paper | `#f2efe6` | page ground |
| Sheet | `#fbfaf5` | forms and reading surfaces |
| Ink | `#181816` | primary text, rules |
| Carbon | `#4d4b45` | secondary copy (7.6:1 on paper) |
| Rule | `#aaa69a` | non-text separators |
| Signal | `#b53a24` | restrained stamp/action accent |
| Signal dark | `#7f2516` | accessible action fill/links |
| Success | `#24583c` | completed state plus text/icon |
| Warning | `#73510d` | caution plus text/icon |
| Danger | `#8b211b` | destructive state plus text/icon |

The single brick-red signal recalls a proofreader's mark and is reserved for decisive actions and stamped states. Body text and controls meet WCAG AA contrast on both paper surfaces.

## Typography

- Display and section headlines: `Georgia`, `Times New Roman`, serif. These platform faces create editorial authority without a font download.
- Interface, labels, and data: `Arial`, `Helvetica Neue`, sans-serif. Uppercase labels are spaced rather than made tiny.
- Scale: 12 / 14 / 16 / 20 / 28 / clamp(42–78) px. Body is never below 16 px; long copy targets 60–70 characters with 1.55 leading. Numeric totals use tabular figures.

No third-party or remote font resources are loaded. The pairing is deliberately native, fast, and robust in generated print/PDF artifacts.

## Layout and spacing

An 8 px base rhythm with 4 px for fine optical adjustment. Desktop uses a 12-column editorial grid with a narrow folio rail; task content stays within 1180 px. Heavy 2 px rules define major sections; hairlines only subdivide related rows. The request view puts the masthead and status before the item ledger. On 390 px screens, the folio rail disappears, data tables become stacked ledger entries, and the sticky total becomes an in-flow summary so it never masks content or safe areas. Touch targets are at least 44 px.

## Interaction grammar

- Primary actions read as solid ink blocks; secondary actions resemble bordered docket controls.
- Item selection acts like marking a paper order line: quantity controls appear in place and the running estimate updates immediately.
- State changes use proofing language: “Draft saved”, “Request packet ready”, “License active”. Price-on-ask lines never enter the estimate.
- Destructive actions name their subject and require confirmation; local data deletion reports exactly what was cleared.
- Focus is a 3 px signal-colored outline with 3 px offset, visible on every paper/ink surface.

## Motion policy

Motion is limited to 180–220 ms opacity/transform transitions: a request row settles upward when selected; notices enter from their source; the review sheet opens from the action area. Nothing loops. Under `prefers-reduced-motion: reduce`, transitions and smooth scrolling become instant while hierarchy, outlines, and text retain every state cue.

## Original asset plan and prompt sheet

The hero is a generated still-life of an unbranded service request docket: top-down, cut-paper editorial construction, typed rule lines without legible words, black graphite quantity marks, a red proofing stamp, ruler and paper clip. It clarifies the handoff from request to human-reviewed quote and is not a product mockup or capability claim. The asset is cropped as a narrow front-page plate so the working form remains the hero.

**Prompt (source of truth)**

> Use case: stylized-concept. Asset type: editorial landing-page plate for a request-to-quote utility. Scene/backdrop: top-down arrangement on warm off-white archival paper. Subject: an unbranded service request docket assembled from layered paper, crisp ruled line items, small quantity boxes with graphite ticks, a folded estimate slip, one restrained brick-red circular proofing mark, steel paper clip and narrow typesetter ruler. Style/medium: tactile monochrome cut-paper still life, analog editorial photography, subtle halftone grain, highly legible shapes but no readable text. Composition/framing: landscape 3:2, strong vertical rules, main docket on the right, quiet negative paper space on the left, no hands or people. Lighting/mood: soft overcast window light, precise, calm, trustworthy. Color palette: warm paper, carbon black, graphite grey, single brick-red accent. Materials/textures: cotton paper, pencil, oxidized steel. Constraints: original scene, no logos, no brands, no readable text, no watermark, no UI screen, no money, no shopping cart, no signatures. Avoid: colorful objects, gradients, glossy 3D, retail packaging, photoreal people, illegible letter-like gibberish, excessive distress.

Generate with `/opt/fleet/lib/gen-image.sh` at 1536×1024, review visually, retain source plus JSON prompt sidecar under `assets/src/`, and ship responsive WebP/AVIF variants with the mobile hero below 300 KB.

## Provenance

- `assets/src/request-docket-hero.png`: original AI-generated image using the factory Azure image deployment (`factory-image`), generated 2026-08-28 from the prompt above. No reference images, people, brands, or copyrighted characters. Use licensed for this product; disclosed in the site footer.
- Interface icons are hand-authored inline SVG strokes following the same docket/rule vocabulary; they are functional, not decorative.
