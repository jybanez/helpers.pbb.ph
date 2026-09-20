# Dashboard icon

Identifier: `navigation.dashboard` (core catalog, no optional pack).
Three rounded panels: tall left panel and two stacked right panels, distinct
from Home and a four-square Businesses layout. Standard24x24 viewBox,
currentColor, default1.8 stroke. Original Helper geometry; no new dependency.

```js
import { uiLoader } from './js/ui/ui.loader.js?v=0.21.186';
const { createIcon } = await uiLoader.get('ui.icons');
button.setAttribute('aria-label', 'Dashboard');
button.append(createIcon('navigation.dashboard', { size: 20 }));
```

The button supplies its accessible name; its icon is decorative by default.
For standalone meaningful artwork use `{title:'Dashboard', decorative:false}`.

Integration: consume this commit's canonical icon source/catalog and loader
or rebuilt bundle through the loader. Icons/catalog cache revision0.21.121;
main UI bundle0.21.186; optional game bundle0.21.122 (it embeds the same catalog).
Package semantic version unchanged. Do not copy app-local SVG artwork.
Existing approved Bimo bundles should not be broadly upgraded without their
normal compatibility review; source-mode consumers may use the updated icon
module and catalog directly with cache-busted URLs.

Preview: ../output/dashboard-icon-preview.png (16/20/24/32px, light and dark).
Official icons demo enumerates this core icon automatically.

Validation: build:ui-bundle, UI bundle contract, registry118 entries/9 groups;
source and bundled icons regression pages pass in installed Edge via Playwright;
source/bundle dashboard definition equality and accessible SVG/viewBox check;
visual preview inspected. Legacy node tests/icons.regression.mjs browser runner
returned a still-pending DOM and failed; the same test page passed in Edge with
an explicit completion wait. No claim that the legacy runner passed.

Handoff: icons/dashboard; commit supplied in Syndicatum return; pushed/PR status
supplied there. Main and optional game JS rebuilt because both embed the catalog;
CSS/inspection artifacts unchanged. Cross-team delivery to Developer/Reviewer.
Remaining limitation: Bimo UI integration not performed; deployment awaits merge.
