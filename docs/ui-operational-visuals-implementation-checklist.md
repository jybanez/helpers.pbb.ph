# UI Operational Visuals Implementation Checklist

This checklist tracks the Helper-side rollout for the SITREP icon expansion, operational visual primitives, and general charting support requested by Hotline Beta and Support System.

## Source Proposals

- [x] Review `docs/ui-icons-sitrep-expansion-proposal.md`.
- [x] Review `docs/ui-operational-visual-primitives-proposal.md`.
- [x] Review `docs/ui-charts-proposal.md`.
- [x] Confirm naming conventions stay broad enough for non-SITREP PBB dashboards.
- [x] Confirm no app-specific Hotline or Support System logic enters Helper modules.

## Phase 1: SITREP / Operational Icon Expansion

- [x] Audit current `ui.icons` registry for reusable existing glyphs and overlapping IDs.
- [x] Add stable operational icon IDs for SITREP core sections.
- [x] Add alert and severity icon IDs.
- [x] Add incident and hazard icon IDs.
- [x] Add population and vulnerable-group icon IDs.
- [x] Add route and access icon IDs.
- [x] Add resources and logistics icon IDs.
- [x] Add team and response icon IDs.
- [x] Add map and geography icon IDs.
- [x] Add data quality and verification icon IDs.
- [x] Update icon demo/catalog visibility.
- [x] Add regression coverage for `getIconDefinition(...)`, `createIcon(...)`, category listing, and `currentColor` inheritance.
- [x] Update README/docs with the new operational icon categories.
- [x] Rebuild `dist/` if icon bundle output changes.

## Phase 2: `ui.stat.cards`

- [x] Finalize the `createStatCards(container, items, options)` contract.
- [x] Implement card rendering with icon, label, value, unit, note, detail, trend, tone, and action metadata.
- [x] Implement `columns`, `size`, `chrome`, `selectable`, `selectedId`, `emptyText`, `formatter`, and `onSelect` options.
- [x] Add stable responsive grid sizing and long-label/value handling.
- [x] Add accessible labels and non-color-only tone communication.
- [x] Add update, setItems, getState, and destroy lifecycle methods.
- [x] Add `demos/demo.stat.cards.html`.
- [x] Add regression coverage for empty state, icons, tones, selection, update, destroy, and accessibility.
- [x] Register the demo in shared navigation and reference metadata.
- [x] Rebuild `dist/`.

## Phase 3: `ui.map.legend`

- [x] Finalize the `createMapLegend(container, options)` contract.
- [x] Implement sections and legend items with title, description, icon, tone, color, swatch, marker, count, and disabled state.
- [x] Support compact and full display modes.
- [x] Support collapsible/defaultCollapsed behavior.
- [x] Render swatches, line styles, marker samples, icons, and counts without depending on MapLibre.
- [x] Add accessible text for every visual sample.
- [x] Add update, setSections, getState, and destroy lifecycle methods.
- [x] Add `demos/demo.map.legend.html`.
- [x] Add regression coverage for sections, items, compact mode, collapsed mode, counts, empty state, and no MapLibre global dependency.
- [x] Register the demo in shared navigation and reference metadata.
- [x] Rebuild `dist/`.

## Phase 4: `ui.map.markers`

- [x] Finalize `createMapMarker(...)`, `createMapClusterMarker(...)`, and `getMapMarkerClass(...)` contracts.
- [x] Implement marker types: incident, source-hub, target-hub, hotspot, route, and boundary-centroid.
- [x] Implement marker shapes: pin, dot, hub, cluster, hotspot, and route.
- [x] Support icon, count badge, selected, active, muted, size, pulse, label, tone, and custom color metadata.
- [x] Return plain `HTMLElement` instances suitable for MapLibre markers and other app-owned map engines.
- [x] Add accessible labels for all marker variants.
- [x] Add `demos/demo.map.markers.html`.
- [x] Add regression coverage for marker types, shapes, states, count badges, accessibility, and no MapLibre global dependency.
- [x] Register the demo in shared navigation and reference metadata.
- [x] Rebuild `dist/`.

## Phase 5: `ui.charts`

- [ ] Finalize `createChart(container, options)` plus convenience factory exports.
- [ ] Implement simple-series normalization.
- [ ] Implement stacked-series normalization.
- [ ] Implement sparkline-series normalization.
- [ ] Implement vertical bar charts.
- [ ] Implement horizontal bar charts with long-label handling.
- [ ] Implement stacked bar charts.
- [ ] Implement donut charts.
- [ ] Implement sparklines.
- [ ] Implement empty, loading, and error states if accepted into V1.
- [ ] Implement title, description, ariaLabel, value labels, legends, axes, maxValue, sorting, formatter, onSelect, and onHover options.
- [ ] Add keyboard-selectable bars/segments when `onSelect` is provided.
- [ ] Add hidden or visible data summary semantics so values are not conveyed by color alone.
- [ ] Add `demos/demo.charts.html`.
- [ ] Add regression coverage for exports, normalization, update, destroy, selection, accessibility, long-label layout, empty state, and no external dependency.
- [ ] Register the demo in shared navigation and reference metadata.
- [ ] Rebuild `dist/`.

## Release / Handoff

- [x] Run focused regressions for each new component family.
- [x] Run bundle contract and registry contract checks.
- [x] Review generated `dist/` changes.
- [x] Update `CHANGELOG.md`.
- [x] Notify Hotline Beta and Support System in the shared chat log after official Helper changes land.
- [ ] Tell downstream apps to refresh from the official Helpers source instead of copying individual files.
