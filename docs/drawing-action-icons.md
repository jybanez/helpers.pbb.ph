# Drawing action icons

Object controls additionally use `actions.move` (four directional arrows),
`actions.rotate-right`, Fill/Stroke and the canonical `actions.delete` trash
artwork. See [selected-object controls and rotation](drawing-object-rotation.md).
Their current catalog/core/adapter/CSS/main/game cache revision is `0.21.309`.

The complete `createMapDrawingTools` toolbar uses canonical `actions.undo`, `actions.redo`, `actions.clear`, `actions.fill` and `actions.stroke` SVG icons. Clear uses eraser artwork; `actions.delete` remains the trash icon for deleting one object. Existing action names, accessible labels/titles, label visibility, keyboard activation and adapter capability/disabled rules are retained. The component renders these icons internally; consumers should use the complete toolbar without supplying custom Unicode artwork.

Catalog, icon factory, drawing toolbar and optional game bundle cache revision302; adapter and main UI bundle revision302. The game bundle embeds the shared icon catalog, so its generated JavaScript also changes; inspection content does not change. Toolbar surfaces and accent use theme tokens so labels and icons remain readable in dark/light themes; drawing CSS revision297. This adds no asset to PBB Map's loader/main-JS/main-CSS contract and requires no modular fallback. Application adoption follows independent exact-head review and merge; drawing initialization revision296 was accepted and merged separately in PR160.

Fill uses bucket artwork and Stroke an outlined border. Include `fill` and `stroke` in toolbar `actions` to opt in, then use `onAction` with the canonical color picker. The adapter reports geometry-aware Fill/Stroke availability and dirty-aware object Finish/Cancel; see the adapter contract for clean-session switching and explicit Save/Close settlement.

The opt-in `path` mode uses canonical `map.path` connected-segment SVG artwork, distinct from the straight Line symbol. Mode labels, accessible names and native keyboard buttons remain canonical.

Select and Pan now use canonical `map.select` mouse-pointer and `map.pan` open-hand SVG icons (0.21.303), without font/emoji dependence.
