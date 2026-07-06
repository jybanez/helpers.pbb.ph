# `ui.chart.xy` V1 Checklist

Date: 2026-07-06

## Purpose

Add a generic X/Y chart primitive for reusable trend and reference visualizations across PBB apps.

This component is not clinical-specific. Natalium can use it for vitals and growth/reference charts, while other apps can use it for response times, queue metrics, delivery backlogs, telemetry, and score/progress curves.

## Boundary

Helper owns:

- SVG line and point rendering
- multiple series rendering
- numeric/date/category X normalization
- Y-axis threshold lines
- Y-axis shaded bands
- formatter hooks
- hover/select callbacks
- loading, empty, and error states
- accessible summary table
- demo, docs, registry, and bundle wiring

Apps own:

- data loading
- domain calculations
- medical datasets
- z-score/percentile interpretation
- units and clinical labels
- drill-down surfaces
- large-data aggregation and downsampling

## V1 API

Registry key:

```text
ui.chart.xy
```

Factory:

```js
import { createXyChart } from "./js/ui/ui.chart.xy.js";

const chart = createXyChart(container, {
  title: "Response Time",
  xType: "date",
  xLabel: "Date",
  yLabel: "Minutes",
  series: [
    {
      id: "median",
      label: "Median",
      points: [
        { x: "2026-07-01", y: 12 },
        { x: "2026-07-02", y: 9 },
      ],
    },
  ],
  thresholds: [{ axis: "y", value: 15, label: "Target", tone: "warning" }],
  bands: [{ axis: "y", from: 0, to: 10, label: "Healthy", tone: "success" }],
});
```

Methods:

- `update(options)`
- `setSeries(series)`
- `getState()`
- `destroy()`

## Non-Goals

- no clinical calculations
- no percentile or z-score interpretation
- no zoom/pan
- no brushing
- no huge-data virtualization
- no canvas/WebGL renderer

## Implementation Checklist

- [x] Add `js/ui/ui.chart.xy.js`.
- [x] Add `css/ui/ui.chart.xy.css`.
- [x] Register `ui.chart.xy` in `js/ui/ui.loader.js`.
- [x] Add focused `demos/demo.chart.xy.html`.
- [x] Add demo navigation and index card.
- [x] Add regression coverage.
- [x] Add bundle contract coverage.
- [x] Update README and changelog.
- [x] Rebuild generated bundles.
- [x] Verify chart XY regression.
- [x] Verify bundle and registry contracts.
- [ ] Notify PBB Natalium with PR link and consumption guidance.
