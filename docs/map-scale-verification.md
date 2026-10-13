# Map scale verification

Task240 implements `ui.map.scale` / `createMapScale` by wrapping the complete installed MapLibre4.6.0 ScaleControl, without vendor changes or duplicate distance calculations. The API/reference/placement contract is in [map-scale.md](map-scale.md). The dedicated demo follows the common demo shell and is indexed in both the home page and navigation.

Verification commands:

- `npm run build:ui-bundle`: regenerated main JS/CSS; unrelated game/inspection line-ending churn restored. Main bundle cache310; game remains309 and inspection unchanged; package0.21.83 unchanged.
- `node tests/ui.bundle.contract.mjs`: bundle contract passed.
- `node tests/registry.contract.mjs`:134 entries/9 groups passed.
- `node tests/map.scale.regression.mjs`: source and bundle,1200/375 widths,flat/50-degree pitch,bearing31; native camera zoom m/km and latitude changes, accessible label/reference, lower-left bounds, both token themes,64px overlay clearance, invalid update preservation, duplicate prevention, resize native refresh, idempotent teardown/no further native unproject calls, map removal disposal/recreation. Screenshots captured for each source/bundle,width,pitch/theme combination.
- `node tests/map.scale.offline.regression.mjs`: cold blank browser receives only three retained Helper assets plus existing MapLibre engine/CSS; other network blocked. Real tile-free map/factory,camera label update and teardown passed. This is retained-asset loading evidence, not app service-worker installation or map-tile availability proof.
- `git diff --check` and55 normalized SHA256 entries across five runtime manifests: passed before submission.

Initial source/bundle run passed its assertions, but screenshot inspection showed the demo shell overrode the test's document-root light-theme setting. The fixture now applies theme to the map subtree and asserts that the light foreground differs from dark; rerun verifies actual light styling. This was a test coverage correction, without a component runtime change. Mobile light screenshot inspected afterward: white scale background/dark label inside the dark map is readable.

The CSS supplies left/bottom `env(safe-area-inset-*)` minimum margins. Desktop Chromium checks observe zero device safe-area insets; actual notched-device insets, physical touch, Safari and assistive technology are not validated. Overlay clearance was tested through the public offset API, not the real app's toast rectangles. Terrain rendering/surface distance, application persistence, context replacement, deployment and app-owned service-worker behavior remain outside this library verification. Native scale is a left-edge screen-midpoint geographic reference, not uniform perspective/terrain scale.

All owned browser/static-server sessions are closed in runner `finally` blocks. Screenshots/generated retained-asset harnesses are local output evidence, not runtime dependencies.
