# UI Map Drawing Tools Proposal

## Summary

Add `ui.map.drawing` as the official Helper UI surface for map drawing controls.

The component should provide reusable drawing-mode controls, editing actions, measurement display, and an adapter contract for map engines such as MapLibre. Helper should own the toolbar UI and normalized drawing events; host apps should continue to own the map instance, geometry persistence, permissions, domain meaning, and backend synchronization.

The immediate driver is Hotline/Support map work, but the helper should remain reusable for Relay, HQ, MapServer-powered apps, Workspace-hosted maps, and future PBB operational map tools.

## Context

PBB apps increasingly need map annotation and operational geometry workflows:

- caller location review
- source and target hub annotations
- incident perimeter sketches
- blocked-road or access-route markings
- search/rescue areas
- evacuation or hazard zones
- SITREP map side-panel geometry review
- Support consolidated map overlays

Without a shared helper, each app is likely to create its own drawing toolbar, mode naming, action icons, GeoJSON callback shape, and measurement display. That creates visual drift and makes it harder to share map UX patterns between Hotline, Support, and other PBB apps.

Helpers already has related map primitives:

- `ui.map.controls` for zoom, bearing, pitch, locate, fit, and layers
- `ui.map.legend` for map keys
- `ui.map.markers` for standardized DOM marker styling
- `ui.icons` for operational icon language

`ui.map.drawing` should complement these by standardizing the drawing control surface.

## Goals

1. Provide a reusable drawing toolbar for PBB map UIs.
2. Keep Helper map-engine agnostic through an adapter contract.
3. Support MapLibre-friendly integration without hard-coding MapLibre as the only runtime.
4. Output normalized GeoJSON features or feature collections.
5. Support compact operational layouts and outside-map mounting, such as in navbars, sidebars, or workspace panels.
6. Support accessible keyboard/button controls and visible state.
7. Keep drawing persistence and app-specific business meaning outside Helper.
8. Provide focused demos and regression coverage.

## Non-Goals

- Do not implement a full GIS editor.
- Do not own MapLibre sources, layers, map lifecycle, or persistence by default.
- Do not require a specific drawing library such as Mapbox GL Draw in the core Helper API.
- Do not add topology validation, snapping, geofencing policy, or advanced spatial analysis in V1.
- Do not store geometries in Helper-owned global state beyond the current control state.
- Do not hardcode Hotline, Support, SITREP, or MapServer business logic.

## Proposed Files

```text
js/ui/ui.map.drawing.js
css/ui/ui.map.drawing.css
demos/demo.map.drawing.html
tests/map.drawing.regression.html
tests/map.drawing.regression.mjs
```

Optional adapter examples if implementation needs them:

```text
js/ui/adapters/ui.map.drawing.maplibre.js
docs/ui-map-drawing-maplibre-adapter-notes.md
```

For V1, the core component can be a pure DOM/control primitive with an app-supplied adapter object.

## Proposed API

```js
import { createMapDrawingTools } from "./js/ui/ui.map.drawing.js";

const drawing = createMapDrawingTools(container, {
  modes: ["select", "point", "line", "polygon", "rectangle", "circle"],
  activeMode: "select",
  actions: ["finish", "cancel", "undo", "redo", "delete", "clear"],
  orientation: "vertical",
  adapter: mapDrawingAdapter,
  onModeChange(mode, state) {},
  onCreate(feature, state) {},
  onUpdate(feature, state) {},
  onDelete(featureId, state) {},
  onAction(action, state) {},
});
```

Returned instance:

```js
{
  update(nextOptions),
  setMode(mode),
  setFeatures(features),
  getState(),
  destroy()
}
```

## Drawing Modes

Recommended V1 modes:

- `select`: select/edit existing geometry
- `point`: place one point/marker
- `line`: draw a LineString
- `polygon`: draw a Polygon
- `rectangle`: draw a rectangular Polygon
- `circle`: draw a radius/circle approximation as Polygon plus radius metadata
- `pan`: optional explicit map navigation mode if apps want it visible

Potential later modes:

- `freehand`
- `multipoint`
- `measure-line`
- `measure-area`
- `bearing`
- `split`
- `merge`

## Actions

Recommended V1 actions:

- `finish`: complete the current drawing
- `cancel`: abandon the current drawing
- `undo`: undo last vertex/action if adapter supports it
- `redo`: redo last undone action if adapter supports it
- `delete`: delete selected feature or vertex
- `clear`: clear drawing set

Actions should expose disabled state when the adapter reports they are unavailable.

## Data Contract

Helper should standardize on GeoJSON-compatible features:

```js
{
  type: "Feature",
  id: "draw-1",
  geometry: {
    type: "Polygon",
    coordinates: [...]
  },
  properties: {
    label: "Search area",
    drawingType: "polygon",
    tone: "warning",
    source: "operator",
    meta: {}
  }
}
```

For circles, V1 can emit:

```js
{
  type: "Feature",
  geometry: {
    type: "Polygon",
    coordinates: [...]
  },
  properties: {
    drawingType: "circle",
    center: [lng, lat],
    radiusMeters: 250
  }
}
```

## Adapter Contract

The adapter should be optional. Without an adapter, the component behaves as a UI-only toolbar and emits `onModeChange` / `onAction`.

Suggested adapter shape:

```js
const adapter = {
  setMode(mode) {},
  getMode() {},
  getFeatures() {},
  setFeatures(features) {},
  clear() {},
  deleteSelected() {},
  undo() {},
  redo() {},
  finish() {},
  cancel() {},
  getCapabilities() {
    return {
      modes: ["select", "point", "line", "polygon"],
      actions: {
        undo: true,
        redo: false,
        delete: true,
        clear: true,
      },
    };
  },
  on(eventName, callback) {
    return () => {};
  },
};
```

Adapter events should normalize to:

- `create`: new GeoJSON feature
- `update`: updated GeoJSON feature
- `delete`: deleted feature id or feature
- `select`: selected feature id or feature
- `measure`: measurement summary
- `modechange`: current drawing mode

## Measurement

V1 should include a small measurement display area when provided by the adapter or by app state.

Suggested state:

```js
measurement: {
  distanceMeters: 1260,
  areaSquareMeters: 34000,
  radiusMeters: 250,
  label: "1.26 km"
}
```

Helper should format basic measurements when numeric values are provided, but advanced geodesic calculations can remain app/adapter-owned.

## Options

```js
{
  modes: [],
  actions: [],
  activeMode: "select",
  orientation: "vertical", // vertical | horizontal
  placement: "map", // map | external
  size: "md", // sm | md | lg
  variant: "neutral",
  chrome: true,
  labels: "auto", // auto | always | none
  disabled: false,
  busy: false,
  features: [],
  selectedFeatureId: "",
  measurement: null,
  adapter: null,
  className: "",
  ariaLabel: "Map drawing tools",
  onModeChange: null,
  onAction: null,
  onCreate: null,
  onUpdate: null,
  onDelete: null,
  onSelect: null,
}
```

## Accessibility Requirements

V1 should include:

- `role="toolbar"` on the control surface.
- Each mode/action rendered as a real `button`.
- `aria-pressed` for the active mode.
- `aria-disabled` and `disabled` for unavailable actions.
- Clear accessible labels for icon-only buttons.
- Keyboard navigation through native tab order.
- Visible focus states.
- Non-color-only active/disabled indicators.
- Optional visible labels for external/sidebar use.

## Styling Direction

The component should feel like a PBB operational map tool:

- compact
- icon-first
- stable button sizes
- vertical or horizontal orientation
- no marketing-style decoration
- compatible with map overlays and external navbars
- supports `chrome:false` when embedded in app-owned shells

Recommended icon mapping:

- `select`: pointer/cursor
- `pan`: hand
- `point`: map pin
- `line`: route
- `polygon`: shape/polygon
- `rectangle`: square
- `circle`: circle
- `finish`: check
- `cancel`: x
- `undo`: rotate-left
- `redo`: rotate-right
- `delete`: trash
- `clear`: eraser

Use `ui.icons` IDs where available, and add missing generic drawing icons only if needed.

## Demo Requirements

`demos/demo.map.drawing.html` should show:

1. vertical map-overlay toolbar
2. horizontal external toolbar
3. active mode switching
4. disabled actions from adapter capability state
5. measurement display
6. event log for mode/action/create/update/delete/select
7. no-map mock adapter example
8. MapLibre integration notes in reference metadata without requiring MapLibre in regression tests

## Regression Coverage

Add tests for:

1. module exports
2. default rendering
3. mode buttons and active mode state
4. orientation classes
5. `chrome:false`
6. adapter `setMode(...)` calls
7. action button callbacks
8. disabled/busy state
9. measurement display
10. `setFeatures(...)`, `update(...)`, `getState()`, and `destroy()`
11. no external MapLibre/global dependency
12. accessible toolbar/button labels

## Suggested Rollout

1. Finalize the adapter contract and V1 mode/action names.
2. Implement the pure Helper control surface.
3. Add a mock adapter demo and regression tests.
4. Add MapLibre integration notes or example adapter.
5. Update README, changelog, demo navigation, and bundle contract.
6. Notify downstream PBB browser apps to refresh from the official Helper repo.

