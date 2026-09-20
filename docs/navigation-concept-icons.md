# Website, Voucher and Portal icons

Core IDs (no optional pack):

- navigation.website: browser window for a registered business website.
- navigation.voucher: notched coupon with perforated stub for a redeemable offer.
- navigation.portal: doorway with inward arrow for checkout/redemption access.

Original Helper geometry;24x24 viewBox, currentColor, default1.8 stroke. Distinct
from Home, Dashboard panels, Businesses grid and Ambassadors/users silhouettes.
Preview: ../output/navigation-concepts-preview.png,16/20/24/32px on light/dark.

## Narrow source-mode adoption

Copy only the canonical js/ui/ui.icons.js and js/ui/ui.icons.catalog.js together,
keeping their relative paths. Entry imports catalog with revision0.21.122.
Invalidate the entry module cache with the same revision in your wrapper:

```js
const { createIcon } = await import('./ui.icons.js?v=0.21.122');
button.setAttribute('aria-label', 'Website');
button.append(createIcon('navigation.website', { size: 20 }));
```

Use Voucher and Portal accessible button names with their corresponding IDs.
This leaves Bimo's accepted main/game bundles untouched. Do not extract app-local
SVG or omit the companion catalog file. Full Helper consumers use loader revision
0.21.187; icons/catalog0.21.122, main bundle0.21.187, game bundle0.21.123.
Semantic package version unchanged. Icons demo enumerates all three automatically.

Validation: UI bundle build and contract PASS; registry118/9 PASS; source and
bundled icon regression pages PASS in installed Edge via Playwright explicit
completion wait; all three source/bundle definitions identical; accessible SVG
role/viewBox checks and visual preview at small sizes PASS; diff check PASS.
No Bimo application code changed. Main and optional game JS regenerated because
both embed core icons; CSS and inspection artifacts unchanged.

Handoff: branch icons/website-voucher-portal; commit/PR supplied in Syndicatum.
Pushed for review; no merge/deployment claimed. Cross-team handoff to Developer
and Reviewer. Known limit: consuming application adoption is Developer-owned.
