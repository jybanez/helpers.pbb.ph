# Selected-object toolbar centering

Task242 scopes presentation to `createMapDrawingObjectTools`. Inspection found no existing alignment option; its vertical root stretched each horizontal group to the full width, leaving the shorter Move/Rotate pair at the start. The scoped `.ui-map-drawing-object-tools` rule now centers groups. Construction controls and all geometry/interaction JavaScript are unchanged.

The existing `chrome:false` API removes canonical root background, border and padding, preserving individual button styling. The drawing demo uses it. App-owned host chrome is task243's responsibility and is not changed in the Helper repository. Point/Circle continue omitting the entire interaction row without empty spacing. Consumers retain the complete factory and supported `getSize()` placement API.

Main bundle and drawing CSS cache311; modular drawing/adapter/shape/icon JS309, optional game309, inspection and package0.21.83 remain unchanged. Shared runtime hashes are regenerated with `node scripts/generate.object.row.runtime.mjs` (run after older scoped provenance generators when assembling revision311).

Verification: `npm run build:ui-bundle`, UI bundle contract, registry134/9, extended existing rotation native source/bundle1200/375 flat/tilted fixture. Added assertions compare rendered row centers within1px, shorter upper row, getSize vs root bounds, transparent borderless root, retained individual borders and busy/disabled button states. Existing native Space/pressed/focus, history/cancel/guard/reset and Point/Circle row/size checks remain. Screenshots: object-row-center-{source,bundle}-{1200,375}-{flat,tilted}.png under local output/playwright. Source mobile tilted screenshot inspected. Existing runner also covers generic geometry and atomic boundary rejection; no new geometry implementation is introduced.

55 normalized hash entries across five runtime manifests and scoped diff checks are required before submission. No app deployment, physical touch/Safari/assistive-technology or real app overlay-clearance claim is made. Previously disclosed geometry fixture limitations remain unchanged.
