# UI Map Drawing Tools Implementation Checklist

This checklist tracks the proposed `ui.map.drawing` rollout for reusable PBB map drawing controls.

## Source Proposal

- [x] Draft `docs/ui-map-drawing-tools-proposal.md`.
- [x] Confirm V1 name: `ui.map.drawing`.
- [x] Confirm factory name: `createMapDrawingTools(container, options)`.
- [x] Confirm adapter-first architecture with no hard dependency on MapLibre.
- [x] Confirm V1 mode list.
- [x] Confirm V1 action list.
- [x] Confirm GeoJSON feature output expectations.
- [x] Confirm measurement responsibilities between Helper and app/adapter.

## Phase 1: Contract Finalization

- [x] Define normalized mode names: `select`, `point`, `line`, `polygon`, `rectangle`, `circle`, optional `pan`.
- [x] Define normalized action names: `finish`, `cancel`, `undo`, `redo`, `delete`, `clear`.
- [x] Define option defaults for `orientation`, `placement`, `size`, `variant`, `chrome`, `labels`, `disabled`, and `busy`.
- [x] Define adapter method contract.
- [x] Define adapter event contract.
- [x] Define measurement object shape.
- [x] Define callback payloads for mode/action/create/update/delete/select.
- [x] Define `getState()` return shape.

## Phase 2: Core Helper Module

- [x] Add `js/ui/ui.map.drawing.js`.
- [x] Add `css/ui/ui.map.drawing.css`.
- [x] Register `ui.map.drawing` in `js/ui/ui.loader.js`.
- [x] Add mode toolbar rendering.
- [x] Add action toolbar rendering.
- [x] Add active mode state and `aria-pressed`.
- [x] Add disabled/busy state handling.
- [x] Add `orientation: "vertical" | "horizontal"`.
- [x] Add `placement: "map" | "external"` styling classes.
- [x] Add `labels: "auto" | "always" | "none"`.
- [x] Add `chrome:false`.
- [x] Add size variants.
- [x] Add measurement display.
- [x] Add feature count/selected feature display if accepted for V1.
- [x] Add update lifecycle.
- [x] Add setMode lifecycle.
- [x] Add setFeatures lifecycle.
- [x] Add getState lifecycle.
- [x] Add destroy lifecycle.

## Phase 3: Adapter Integration

- [x] Wire mode buttons to `adapter.setMode(mode)` when provided.
- [x] Wire action buttons to adapter methods when provided.
- [x] Read adapter capabilities for disabled actions.
- [x] Subscribe to adapter events with cleanup on destroy.
- [x] Normalize adapter create/update/delete/select/modechange/measure events.
- [x] Keep UI-only behavior working when no adapter is provided.
- [x] Preserve app-owned metadata and feature IDs.
- [x] Avoid MapLibre globals in the core module.

## Phase 4: Icons And Visual Language

- [x] Audit existing `ui.icons` IDs for drawing controls.
- [x] Reuse existing icons where available.
- [x] Add missing generic drawing icons only if needed.
- [x] Add stable focus states.
- [x] Add active/disabled/busy indicators that are not color-only.
- [x] Verify compact toolbar sizing in map overlay placement.
- [x] Verify external/sidebar toolbar layout.

## Phase 5: Demo And Documentation

- [x] Add `demos/demo.map.drawing.html`.
- [x] Register the demo in shared navigation.
- [x] Add structured demo reference metadata.
- [x] Demonstrate vertical map-overlay toolbar.
- [x] Demonstrate horizontal external toolbar.
- [x] Demonstrate mock adapter mode/action events.
- [x] Demonstrate measurement display.
- [x] Demonstrate disabled action state.
- [x] Add README API section.
- [x] Update `CHANGELOG.md`.
- [x] Add MapLibre adapter notes if implementation includes an example adapter.

## Phase 6: Regression Coverage

- [x] Add `tests/map.drawing.regression.html`.
- [x] Add `tests/map.drawing.regression.mjs`.
- [x] Test module exports.
- [x] Test default rendering.
- [x] Test mode switching.
- [x] Test action callbacks.
- [x] Test adapter calls.
- [x] Test adapter event cleanup.
- [x] Test disabled and busy states.
- [x] Test orientation classes.
- [x] Test `chrome:false`.
- [x] Test measurement display.
- [x] Test lifecycle methods.
- [x] Test accessible toolbar/button labels.
- [x] Test no MapLibre/global dependency.

## Phase 7: Bundle And Handoff

- [x] Rebuild `dist/` with `npm run build:ui-bundle`.
- [x] Run `node tests/map.drawing.regression.mjs`.
- [x] Run `node tests/ui.bundle.contract.mjs`.
- [x] Run `node tests/registry.contract.mjs`.
- [x] Review generated `dist/` changes.
- [x] Commit and push to the official Helper repo.
- [x] Notify PBB browser apps in the shared chat log after the official Helper change lands.
