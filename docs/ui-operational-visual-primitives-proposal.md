# UI Operational Visual Primitives Proposal

## Summary

Add three small Helper primitives that complement `ui.charts` and `ui.icons` for operational dashboards:

- `ui.stat.cards`
- `ui.map.legend`
- `ui.map.markers`

These primitives should help PBB apps present key metrics, map legends, and map marker semantics consistently without each app creating local card, legend, and marker conventions.

The immediate driver is SITREP and PBB Support System, but these helpers should remain reusable across Hotline, Relay, HQ, Maestro, Workspace, MapServer-powered apps, and future PBB operational dashboards.

## Context

SITREP dashboards need more than charts:

- leadership-facing KPI cards
- compact risk and accomplishment summaries
- map legends for alert levels, boundaries, clusters, and incident markers
- marker styling for source hubs, target hubs, incidents, hotspots, and access constraints
- consistent visual language between maps, charts, tables, and official SITREP sections

Helpers already has useful primitives such as `ui.icons`, `ui.progress`, `ui.grid`, `ui.tabs`, `ui.map.controls`, and proposed `ui.charts`. This proposal fills the remaining small-but-important visualization gaps.

## Goals

1. Provide reusable, framework-agnostic DOM/CSS primitives.
2. Keep map engine ownership outside Helper; Helper should style and compose controls, not own MapLibre.
3. Use existing Helper icon and token systems.
4. Support compact operational layouts and responsive dashboards.
5. Provide accessible labels and non-color-only indicators.
6. Keep APIs serializable and easy for PHP/Laravel apps to feed.

## Non-Goals

- Do not implement a map engine.
- Do not implement chart primitives here; that belongs to `ui.charts`.
- Do not implement full dashboard layout or persistence.
- Do not add app-specific SITREP business logic into Helper.
- Do not hardcode Hotline or Support System names in the API.

## Proposed Modules

```text
js/ui/ui.stat.cards.js
css/ui/ui.stat.cards.css

js/ui/ui.map.legend.js
css/ui/ui.map.legend.css

js/ui/ui.map.markers.js
css/ui/ui.map.markers.css
```

Recommended demos and tests:

```text
demos/demo.stat.cards.html
demos/demo.map.legend.html
demos/demo.map.markers.html

tests/stat.cards.regression.html
tests/stat.cards.regression.mjs
tests/map.legend.regression.html
tests/map.legend.regression.mjs
tests/map.markers.regression.html
tests/map.markers.regression.mjs
```

If Helper prefers fewer demos, a single `demos/demo.operational.visuals.html` could cover all three.

## `ui.stat.cards`

### Purpose

Render compact metric cards for dashboards and operational summaries.

Examples:

- People at Risk: `61`
- People Helped: `8`
- Current Records: `42`
- Open Reports: `40`
- Areas Constrained: `2`
- Resource Units Requested: `256`

### Proposed API

```js
import { createStatCards } from "./ui.stat.cards.js";

const cards = createStatCards(container, [
  {
    id: "people-at-risk",
    label: "People at Risk",
    value: 61,
    note: "Across 5 source hubs",
    icon: "population.people-at-risk",
    tone: "warning",
  },
  {
    id: "people-helped",
    label: "People Helped",
    value: 8,
    note: "Verified from source accomplishments",
    icon: "population.people-helped",
    tone: "success",
  },
], {
  columns: "auto",
  size: "md",
  chrome: true,
});
```

Returned instance:

```js
{
  update(nextItems, nextOptions),
  setItems(items),
  getState(),
  destroy()
}
```

### Item Contract

```js
{
  id: "people-at-risk",
  label: "People at Risk",
  value: 61,
  unit: "people",
  note: "Across 5 source hubs",
  detail: "Highest source: Apas, 20 people",
  icon: "population.people-at-risk",
  tone: "warning",
  trend: {
    direction: "up", // up | down | flat
    label: "+12 since previous SITREP"
  },
  action: {
    label: "View population",
    value: "population"
  },
  meta: {}
}
```

### Options

```js
{
  className: "",
  ariaLabel: "Key metrics",
  columns: "auto", // auto | 1 | 2 | 3 | 4
  size: "md", // sm | md | lg
  chrome: true,
  selectable: false,
  selectedId: "",
  emptyText: "No metrics to display.",
  formatter: null,
  onSelect: null
}
```

### Required Features

- icon support through `createIcon(...)`
- tone variants: `neutral`, `info`, `success`, `warning`, `danger`, `critical`
- stable grid layout
- optional selected state
- empty state
- long label/value handling
- accessible labels for icon-only or compact cards

## `ui.map.legend`

### Purpose

Render map legends and color/marker keys consistently beside MapLibre or other map surfaces.

Examples:

- alert levels
- incident marker types
- route statuses
- source vs target hubs
- cluster size ranges
- boundary fill meaning
- data quality indicators

### Proposed API

```js
import { createMapLegend } from "./ui.map.legend.js";

const legend = createMapLegend(container, {
  title: "SITREP Map Legend",
  sections: [
    {
      title: "Alert Level",
      items: [
        { label: "Normal", tone: "success", swatch: "solid" },
        { label: "Elevated", tone: "warning", swatch: "solid" },
        { label: "Critical", tone: "critical", swatch: "solid" },
      ],
    },
    {
      title: "Markers",
      items: [
        { label: "Incident", icon: "places.pin", marker: "pin" },
        { label: "Source Hub", icon: "map.source-hub", marker: "hub" },
        { label: "Cluster", icon: "map.cluster", marker: "cluster" },
      ],
    },
  ],
});
```

Returned instance:

```js
{
  update(nextOptions),
  setSections(sections),
  getState(),
  destroy()
}
```

### Section Contract

```js
{
  title: "Alert Level",
  description: "Boundary and marker color reflects source alert level.",
  items: []
}
```

### Item Contract

```js
{
  id: "critical",
  label: "Critical",
  description: "Immediate response pressure",
  tone: "critical",
  color: "var(--ui-critical)",
  icon: "alert.critical",
  swatch: "solid", // solid | outline | dashed | gradient | marker | line
  marker: "pin", // pin | dot | cluster | hub | hotspot | route
  count: 2,
  disabled: false
}
```

### Options

```js
{
  className: "",
  ariaLabel: "Map legend",
  title: "",
  sections: [],
  compact: false,
  collapsible: false,
  defaultCollapsed: false,
  showCounts: true,
  emptyText: "No legend items to display.",
  onToggle: null
}
```

### Required Features

- works outside a map container
- compact and full modes
- supports icons, swatches, line styles, and marker samples
- optional counts
- accessible text for all visual samples
- no dependency on MapLibre

## `ui.map.markers`

### Purpose

Provide standardized DOM marker elements and style helpers that apps can pass to MapLibre, Leaflet, or app-owned map implementations.

Helper should not own marker placement. It should produce marker DOM and marker metadata.

### Proposed API

```js
import { createMapMarker, createMapClusterMarker, getMapMarkerClass } from "./ui.map.markers.js";

const markerEl = createMapMarker({
  type: "incident",
  tone: "warning",
  icon: "hazard.flood",
  label: "Flood incident",
  count: 1,
});

const clusterEl = createMapClusterMarker({
  count: 14,
  tone: "critical",
  label: "14 incidents",
});
```

### Marker Contract

```js
{
  id: "incident-123",
  type: "incident", // incident | source-hub | target-hub | hotspot | route | boundary-centroid
  tone: "warning",
  icon: "hazard.flood",
  label: "Flood incident",
  count: 1,
  selected: false,
  active: false,
  muted: false,
  size: "md", // sm | md | lg
  pulse: false,
  meta: {}
}
```

### Cluster Contract

```js
{
  count: 14,
  tone: "critical",
  label: "14 incidents",
  size: "md",
  selected: false,
  active: false
}
```

### Suggested Marker Types

| Type | Purpose |
| --- | --- |
| `incident` | Individual incident coordinate |
| `source-hub` | Source hub that submitted a SITREP |
| `target-hub` | Consolidating/current hub |
| `hotspot` | High concentration area |
| `route` | Route/access issue |
| `boundary-centroid` | Label/marker for administrative area |

### Required Features

- return plain `HTMLElement`
- no map engine dependency
- icon support through `createIcon(...)`
- count badge support
- selected/active/muted states
- small/medium/large sizes
- accessible label
- CSS variables for tone/color
- marker shape variants: `pin`, `dot`, `hub`, `cluster`, `hotspot`, `route`

## SITREP Integration Examples

### Summary Cards

```js
createStatCards(container, [
  {
    id: "risk",
    label: "People at Risk",
    value: sitrep.population.rollup.people_at_risk,
    icon: "population.people-at-risk",
    tone: "warning",
  },
  {
    id: "helped",
    label: "People Helped",
    value: sitrep.population.rollup.citizens_assisted,
    icon: "population.people-helped",
    tone: "success",
  },
  {
    id: "records",
    label: "Current Records",
    value: sitrep.population.rollup.record_count,
    icon: "assets.clipboard",
    tone: "info",
  },
]);
```

### SITREP Map Legend

```js
createMapLegend(container, {
  title: "Map Legend",
  sections: [
    {
      title: "Alert Level",
      items: [
        { label: "Normal", tone: "success", icon: "alert.normal" },
        { label: "Elevated", tone: "warning", icon: "alert.elevated" },
        { label: "Critical", tone: "critical", icon: "alert.critical" },
      ],
    },
    {
      title: "Evidence",
      items: [
        { label: "Incident", marker: "pin", icon: "places.pin" },
        { label: "Cluster", marker: "cluster", icon: "map.cluster" },
        { label: "Route Issue", marker: "route", icon: "places.route" },
      ],
    },
  ],
});
```

### Incident Marker

```js
const marker = createMapMarker({
  type: "incident",
  tone: incident.alert_level === "Critical" ? "critical" : "warning",
  icon: incident.icon || "places.pin",
  label: incident.label,
});
```

## Relationship To Other Helper Modules

- `ui.icons`: provides icons used inside cards, legends, and markers.
- `ui.charts`: provides quantitative chart surfaces.
- `ui.progress`: remains useful inside cards when a ratio/progress indicator is needed.
- `ui.map.controls`: remains the map-control dock; this proposal adds map visual semantics only.
- `ui.grid`: remains the detailed tabular view for drill-down.

## Demo Requirements

### `demo.stat.cards.html`

- compact card row
- large dashboard card row
- icon and no-icon cards
- selectable cards
- trend labels
- long-value handling
- empty state

### `demo.map.legend.html`

- alert legend
- marker legend
- line/route legend
- compact mode
- collapsible mode
- counts
- empty state

### `demo.map.markers.html`

- marker gallery by type
- tones and sizes
- selected/active/muted states
- count badges
- cluster markers
- DOM marker example suitable for MapLibre

## Regression Coverage

Add tests for:

1. module exports
2. empty states
3. card rendering with icons, tones, and selected state
4. card update/destroy lifecycle
5. legend sections and items rendering
6. legend compact/collapsed modes
7. marker DOM creation for each marker type
8. marker selected/active/muted states
9. marker accessibility labels
10. no dependency on MapLibre globals

## Suggested Rollout

1. Finalize this proposal into implementation specs.
2. Implement `ui.stat.cards` first because it benefits dashboards immediately.
3. Implement `ui.map.legend` next because it helps Support map readability.
4. Implement `ui.map.markers` after icon expansion lands, so marker types can use official operational icons.
5. Update README, demo index, and bundle contract.
6. Downstream apps refresh vendored Helpers only after official Helper changes land.

