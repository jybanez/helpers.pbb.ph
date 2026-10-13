# Object rotation verification

Task 238 implements owner request 10045 and subsequent clarification 10062/10064.
Alfred 10058 corrected the overbroad altitude criterion: preserve strict 2D
validation, reject unsupported coordinates atomically, and do not truncate them.
Design agreement is separate from implementation acceptance and app adoption.

## Passing checks

- `npm run build:ui-bundle`: regenerated main JS/CSS and game JS. Game CSS and
  inspection JS only had line-ending churn and were restored.
- `node tests/ui.bundle.contract.mjs` and `node tests/registry.contract.mjs`:
  main/optional bundle contract and 133 entries / nine groups.
- `node tests/map.drawing.rotation.contract.mjs`: Mercator pivot/distances,
  all polygon rings, legacy/oriented rectangle conversion, no-op geometry,
  center preservation, coherent translation/resize/opposite corner, invalid
  bounds and immutable inputs.
- `node tests/map.drawing.shapes.contract.mjs`: existing geographic shapes.
- `node tests/map.drawing.rotation.regression.mjs`: source/bundle, 1200/375
  viewport widths; flat and bearing31/pitch40 rectangles; real mouse/Space input,
  two rows, focused exclusive state, no handles in Rotate, one history step,
  no-op preserving legacy metadata/history, committed snapshot excludes preview,
  active-drag/style/draft/redo-only rejection, Escape cancellation, oriented
  resize/reimport, structural Point/Circle row omission and measured height.
  Tilted Line/Path/polygons with holes preserve ID0, properties/foreign metadata,
  styles, semantic kind, closure, undo/redo and cancellation. Seam/polar native
  rotation rejects unsafe whole previews and creates no history entry.
- `node tests/drawing.object.offline.regression.mjs`: a cold Chromium client
  with all real network blocked receives only retained loader/main JS/main CSS
  via route fulfillment. New factory and MapLibre factory resolve with no
  modular fallback. A contract adapter exercises already-selected ID0 init,
  native toggle, busy/disabled/class updates, canonical layout, Point-like row
  omission, size update and listener teardown. This is a retained-assets factory
  check, not an application service-worker installation/offline test.
- `node tests/map.drawing.maplibre.regression.mjs`: broad existing source/bundle
  shapes, boundaries, three Helper assets, Line/Path, history/reentrancy, pending
  tiles, clean modes/selection/deletion, pointer/keyboard, confirmation gate,
  explicit edit sessions and lifetime/removal.
- `node tests/map.drawing.toggle.regression.mjs`: existing source/bundle
  desktop/mobile Select-off native navigation, keyboard, history and draft lifecycle.
- `node tests/map.drawing.status.regression.mjs`: source/bundle pending states,
  suppressed/default status, rejected transitions and keyboard focus.
- `node tests/map.drawing.regression.mjs`: existing complete toolbar contract.
- `git diff --check` and all 45 normalized SHA256 entries across the four
  runtime manifests. Cache revision309 applies to affected drawing/icon/main/game
  runtime; package version remains0.21.83.

## Failures and corrections

The initial new rotation fixture failed `native rotation drag` without a full
negative snapshot. It now computes the grab point after keyboard toolbar focus,
and subsequent source/bundle matrices pass. The precise original cause is not
proven; no runtime keyboard fix is claimed.

The first broad MapLibre run failed the Circle handle gesture at375 in source
immediate mode. Its screenshot shows the new top-left demo object toolbar over
the north resize handle. Moving the demo toolbar to bottom-right removed that
collision; the complete broad source/bundle matrix subsequently passed. The
application still owns object anchoring and collision avoidance using `getSize`.

The first Select-toggle run timed out in an unlabeled readiness wait. The original
failure has no stage/viewport snapshot, so its cause remains unproven. Added
read-only stage/state/camera diagnostics to readiness failures without replaying
input or weakening assertions. The following full source/bundle run passed.

The first boundary matrix timed out locating Rotate. A diagnostic reproduction
captured the375 polar grab point atx369.54, outside the canvas ending atx364;
`elementFromPoint` returned body and selection remained null. MapLibre increases
constrained zoom near the pole. Moving the grab point from longitude8 to2 keeps
it on the same unchanged Line inside the mobile canvas. The corrected complete
source/bundle seam/polar matrix passed with the same atomic rejection/history
assertions. No adapter boundary change was made for this fixture failure.

Later component refinements preserve canonical layout under class updates and
hydrate already-selected state; targeted cold offline factory checks cover those
changes. They do not change geometry or navigation behavior.

## Limits

Actual mouse/keyboard input in desktop Chromium at mobile widths is not physical
touch or a phone test. Pointercancel/lostpointercapture cases combine a real
native drag with a synthetic cancellation event. Safari, native touch capture,
assistive technology and application placement/persistence/deployment are not
validated here. Independent exact-head review and verified merge must precede
Developer task239 adoption. Acknowledgement does not transition Responsibility Inbox.
