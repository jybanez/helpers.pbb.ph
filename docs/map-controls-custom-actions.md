# Map controls custom actions (cache revision 0.21.276)

Register custom definitions in `actions`, then include their IDs in `controls`
alongside the existing zoom, compass, pitch, locate, fit and layers groups.
Array order determines display order; unlisted actions do not render.
Existing defaults and built-in callbacks remain unchanged.

```js
const createMapControls = await uiLoader.get("ui.map.controls");
const controls = createMapControls(host, {
  map,
  controls: ["search", "zoom", "compass", "locate"],
  actions: [{
    id: "search", label: "Search map", icon: "actions.search",
    expanded: false, ariaControls: "mobile-search",
    onActivate() {
      revealMobileSearch();
      controls.setActionState("search", { expanded: true });
      searchInput.focus();
    },
  }],
});
// App-owned dismissal:
controls.setActionState("search", { expanded: false });
```

Actions require unique nonempty `id` and accessible `label`. Built-in IDs,
`zoom-in`, `zoom-out` and `pitch-*` are reserved; invalid definitions throw.
`icon` is an optional canonical registered icon name; without it the label renders
as text. Unknown icons follow createIcon error behavior. `title` defaults to the
label and supplies the native tooltip. `visible` defaults to true and `disabled`
to false. `expanded` defaults to null (no aria-expanded); `ariaControls` optionally
identifies the app-owned controlled element. Native buttons provide keyboard
activation; icons are decorative.

`onActivate({id, map, event, button})` runs only for visible, enabled actions.
Helper does not automatically toggle expanded state or manage application search.
Search reveal/dismissal, breakpoints, desktop navbar search and persistence remain
app-owned. No new pointer, wheel, touch or context-menu handlers are installed.

`setActionState(id, {visible?, disabled?, expanded?})` updates in place, preserving
the button and focus; `expanded:null` removes aria-expanded. Returns false for
unknown actions or a destroyed component. `update({actions, controls})` replaces
supplied arrays and rebuilds controls including icons/callbacks. Use setActionState
for focus-sensitive state updates. `getState().actions` returns shallow copies.
Destroy removes action and map listeners and is terminal.

For PBB Map, place `search` immediately before `zoom` in the vertical toolbar,
drive visibility from the mobile breakpoint, and update expanded on every
reveal/dismiss path. Keep desktop search centered in the navbar. Vendor the reviewed
increment and use map-controls/main bundle cache revision `0.21.276`; the package
release version is unchanged. Source and bundle regression coverage:
`node tests/map.controls.regression.mjs`.
