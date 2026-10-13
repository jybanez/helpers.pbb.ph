# Canonical ruler endpoint dragging (task 253)

The complete MapRuler now owns dragging either completed endpoint. It uses canonical drawing-adapter conventions: public rendered-feature hit tests, pointer capture, public unproject/native distance, transient GeoJSON and saved camera-handler enabled states. The result remains complete while dragging; line/cues/distance update continuously. Touch queries extend 22px around the visible endpoint (12px mouse). Camera navigation remains available elsewhere.

Release commits and suppresses its compatibility click. Cancellation, lost capture, blur or style replacement restores the original endpoint. Reset/exit/Escape/destroy/removal restore pointer/gesture/cursor ownership. Copy is unavailable during drag; changing endpoints invalidates pending clipboard feedback. No application renderer, drawing storage or GPS workflow is added.

Validation:

- `npm run build:ui-bundle` and scoped revision 314 for main JavaScript/ruler/loader/demo; CSS/icons/game remain 312.
- `node tests/map.ruler.drag.regression.mjs`: source/bundle native mouse drags of both endpoints, continuous/final native distance and rendered line/both cues, native navigation away from targets, prior-disabled handlers, injected pointer cancellation, reset/Escape/style replacement, captured outside release, native antimeridian drag and removal during capture. Fresh Chromium mobile context uses CDP native touch input to drag both endpoints from within the expanded touch hit region. Storage remains unchanged; screenshots retained.
- `node tests/map.ruler.rendering.regression.mjs`: native dragging with held raster/DEM and continuous repaint, desktop/mobile widths, full/diff style replacement, terrain/2D3D, null style and zero redundant style writes, plus existing fresh touch measurement checks.
- Existing ruler regression, cold offline regression, bundle contract and registry contract (135 entries/9 groups).
- Six runtime manifests refreshed with normalized SHA256 hashes.

The first drag fixture run timed out after reset: it seeded synthetic map clicks without a new pointer press, so intentional release suppression still applied. The fixture now sends the new press before those setup clicks; native input checks are unchanged. Failure is disclosed rather than treated as a runtime defect. Tests distinguish synthetic pointer cancellation from native mouse/touch drags. This library fixture simulates continuous GeoJSON updates; actual application live GPS ripples remain Developer integration coverage after independent release review. Physical touch/Safari/AT/operating-system clipboard permissions are not certified. The prior owner-session cause remains unverified.
