# map.layer

Original Helper stacked-layer geometry in the canonical `map` category: three
paths,24x24 viewBox, no fill, currentColor and the existing default1.8 rounded
stroke. No new image assets or dependencies. `createIcon('map.layer')` works
through the existing `ui.icons` API in modular source and the main UI bundle.

Preview `demos/demo.map.layer.icon.html` (or `?bundle`) shows16/20/24/32px in
dark/light themes; the icon catalog enumerates it automatically and links this
preview. The existing icon regression includes resolution, shape, decorative and
named accessibility checks.

For the future app action, use the host's canonical icon-only control with both
accessible label and title **Manage personal layers**. The SVG may remain
decorative because its containing control owns the accessible name. Place the
control upper-right with safe-area spacing and separation from existing controls.
It must open the canonical management modal immediately in loading state before
reading storage, retain actionable loading errors and validate active fields
before saving. This library change implements only the icon; app control/modal
and personal-layer persistence require their subsequent feature implementation.
The icon conveys no guarantee that layers are stored or available offline.

Runtime revisions and LF-normalized SHA256 are in `map-layer-icon-runtime.json`.
Semantic package version remains0.21.83; unchanged styles are included in runtime
provenance. Task203 is reviewed independently of adapter task202/PR153.
After reconciliation with PR153, icons/game retain0.21.287 and the main UI bundle uses0.21.290 after the deletion-gate addition; both provenance manifests describe the combined runtime.
