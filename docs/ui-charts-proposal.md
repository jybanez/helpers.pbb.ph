# UI Charts Proposal

## Summary

Introduce `ui.charts` as the official Helper charting library for PBB browser apps. The library should provide small, accessible, dependency-free chart primitives that can render operational dashboards, SITREP visualizations, resource demand summaries, queue health, activity trends, and admin metrics without each app inventing its own SVG/CSS chart layer.

This proposal is intentionally broader than SITREP. SITREP and PBB Support System are the immediate drivers, but the resulting helper should be reusable by Hotline, Relay, HQ, Maestro, Workspace, and other PBB apps.

## Context

Helpers already provides useful operational UI primitives:

- `ui.grid` and `ui.tree.grid` for tabular data
- `ui.progress` for progress, radial, ring, and step indicators
- `ui.signal.strength` for compact status bars
- `ui.timeline` and `ui.timeline.scrubber`
- `ui.map.controls` for MapLibre-oriented map controls
- `ui.activity.chart` for project/day activity matrices, stacked bars, and sparklines
- `ui.icons` for shared SVG icons

What is missing is a general-purpose chart layer for simple operational data:

- bar charts
- horizontal bar charts
- stacked bar charts
- donut charts
- small line/sparkline charts
- chart legends
- chart tooltips/selection
- empty/loading/error chart states

SITREP dashboards need these for:

- incident types by mentions and locations
- people at risk, people helped, and current records
- population/vulnerable group breakdown
- resource demand by category and item
- assignment status posture
- access constraints by source location
- alert level distribution
- historical SITREP trend snapshots

## Goals

1. Add a shared `ui.charts` module for common chart primitives.
2. Keep the library framework-agnostic and dependency-free.
3. Render with plain DOM/SVG/CSS, not Canvas for V1, so charts remain inspectable, accessible, and printable.
4. Use `currentColor`/CSS variables and Helper tokens for theme alignment.
5. Provide accessible labels, table-like data fallback semantics where practical, and keyboard-friendly selection.
6. Support compact operational dashboard use, not marketing-style visualizations.
7. Keep chart data contracts simple and serializable.
8. Provide demos and regression coverage.

## Non-Goals

- Do not compete with large analytical charting libraries.
- Do not add map rendering; maps remain app-owned or MapLibre-owned.
- Do not add 3D charts.
- Do not add chart animations as a requirement.
- Do not require a framework such as React/Vue.
- Do not require external runtime dependencies or CDN assets.
- Do not fold `ui.activity.chart` into V1 unless Helper chooses to refactor later.

## Proposed Files

```text
js/ui/ui.charts.js
css/ui/ui.charts.css
demos/demo.charts.html
tests/charts.regression.html
tests/charts.regression.mjs
```

Optional if Helper prefers split modules later:

```text
js/ui/charts/chart.dom.js
js/ui/charts/chart.scale.js
js/ui/charts/chart.format.js
```

For V1, a single `ui.charts.js` is probably enough.

## Proposed API

### Unified Factory

```js
import { createChart } from "./ui.charts.js";

const chart = createChart(container, {
  type: "bar",
  title: "Incident Types",
  description: "Current reports by incident type.",
  data: [
    { label: "Flood", value: 9 },
    { label: "Infrastructure Damage", value: 5 },
    { label: "Rescue", value: 5 },
  ],
});
```

Returned instance:

```js
{
  update(nextOptions),
  setData(data),
  getState(),
  destroy()
}
```

### Convenience Factories

Helper may also expose thin wrappers:

```js
createBarChart(container, data, options)
createStackedBarChart(container, data, options)
createDonutChart(container, data, options)
createSparkline(container, data, options)
```

These wrappers should call the same internal implementation as `createChart(...)`.

## V1 Chart Types

### `bar`

Vertical bar chart for compact category comparisons.

Use cases:

- incident type mentions
- resource quantity by category
- reports by status

### `horizontal-bar`

Horizontal bars for long labels and operational categories.

Use cases:

- resource needs
- source locations by open reports
- route constraints by location

### `stacked-bar`

One or more rows with segment values.

Use cases:

- assignment status by team/category
- alert level distribution
- source location status mix

### `donut`

Part-to-whole summaries where there are few categories.

Use cases:

- alert level mix
- open/deferred/resolved/discarded share
- incident type share when categories are limited

### `sparkline`

Small trend over time.

Use cases:

- SITREP count over time
- resource demand trend
- queue/worker health trend

## Data Contracts

### Simple Series

```js
[
  { label: "Flood", value: 9 },
  { label: "Infrastructure Damage", value: 5 },
  { label: "Rescue", value: 5 }
]
```

Optional row fields:

```js
{
  id: "flood",
  label: "Flood",
  value: 9,
  secondaryValue: 5,
  secondaryLabel: "5 locations",
  tone: "info",
  color: "var(--ui-info)",
  icon: "hazard.flood",
  meta: {}
}
```

### Stacked Series

```js
[
  {
    label: "Rescue Team",
    segments: [
      { label: "Assigned", value: 2, tone: "neutral" },
      { label: "En Route", value: 1, tone: "info" },
      { label: "On Scene", value: 3, tone: "success" }
    ]
  }
]
```

### Sparkline Series

```js
[
  { x: "2026-06-01", y: 5 },
  { x: "2026-06-02", y: 9 },
  { x: "2026-06-03", y: 7 }
]
```

## Common Options

```js
{
  type: "bar",
  title: "",
  description: "",
  ariaLabel: "",
  className: "",
  valueLabel: "Value",
  secondaryValueLabel: "",
  orientation: "vertical",
  size: "md", // sm | md | lg
  tone: "neutral",
  palette: "default",
  showLegend: true,
  showValues: true,
  showAxis: true,
  maxValue: null,
  sort: "input", // input | value-desc | value-asc | label
  emptyText: "No chart data available.",
  formatter: null,
  onSelect: null,
  onHover: null
}
```

## Accessibility Requirements

V1 should include:

- `role="figure"` or region semantics with clear accessible label.
- visible title/description options.
- SVG text alternatives or hidden tabular summary for screen readers.
- keyboard-selectable bars/segments when `onSelect` is provided.
- high-contrast enough default color tokens.
- value labels available without hover.
- no information conveyed by color alone; labels, legends, or values must be present.

## Styling Direction

Charts should feel like operational PBB surfaces:

- compact
- readable in dark app shells
- low decoration
- clear labels and values
- stable dimensions
- no marketing-style gradients
- no large decorative visuals

Use Helper CSS variables/tokens where possible.

Recommended tones:

- `neutral`
- `info`
- `success`
- `warning`
- `danger`
- `critical`

If `critical` is not currently a Helper tone, add it only if it fits the broader Helper token model.

## Relationship To `ui.activity.chart`

`ui.activity.chart` currently handles a specific project/day/message activity shape with matrix, stacked bars, and sparklines. It is useful but too specialized to serve as the official chart API for arbitrary operational datasets.

Recommended approach:

- Keep `ui.activity.chart` unchanged for now.
- Add `ui.charts` as the general charting layer.
- Later, Helper may internally refactor `ui.activity.chart` to reuse chart utilities if useful.

## SITREP Examples

### Incident Types

```js
createChart(container, {
  type: "horizontal-bar",
  title: "Current Incident Types",
  valueLabel: "Mentions",
  secondaryValueLabel: "Locations",
  data: sitrep.situation.rollup.incident_types.map((row) => ({
    id: row.type,
    label: row.type,
    value: row.count,
    secondaryValue: row.location_count,
    secondaryLabel: `${row.location_count} locations`,
  })),
});
```

### Population

```js
createChart(container, {
  type: "bar",
  title: "Population Signals",
  valueLabel: "People / families",
  data: sitrep.population.rollup.population_groups.map((row) => ({
    label: row.population_signal,
    value: row.numeric_total || row.reports,
    secondaryLabel: row.people_or_families,
  })),
});
```

### Resource Demand

```js
createChart(container, {
  type: "horizontal-bar",
  title: "Resource Demand",
  valueLabel: "Requested",
  data: sitrep.needs.rollup.category_groups.map((row) => ({
    label: row.category,
    value: row.quantity_requested,
    secondaryLabel: `${row.location_count || 1} locations`,
  })),
});
```

### Assignment Posture

```js
createChart(container, {
  type: "stacked-bar",
  title: "Team Assignment Status",
  data: sitrep.actions.rollup.deployment_groups.map((row) => ({
    label: row.team,
    segments: Object.entries(row.status_counts || {}).map(([status, value]) => ({
      label: status,
      value,
    })),
  })),
});
```

## Demo Requirements

`demos/demo.charts.html` should show:

1. vertical bar chart
2. horizontal bar chart with long labels
3. stacked bar chart
4. donut chart
5. sparkline
6. empty state
7. selectable chart with event log
8. dark/light theme sanity check

## Regression Coverage

Add tests for:

1. module exports
2. empty state rendering
3. simple series normalization
4. stacked series normalization
5. update lifecycle
6. destroy lifecycle
7. selectable bars/segments callback
8. accessible label/title presence
9. long-label layout does not overflow obvious bounds
10. no external dependencies required

## Suggested Rollout

1. Draft `ui.charts` V1 spec from this proposal.
2. Implement bar, horizontal-bar, stacked-bar, donut, and sparkline.
3. Add demo and regression coverage.
4. Update README and demo index.
5. Notify downstream projects to refresh vendored Helpers only after the official Helper branch lands.

