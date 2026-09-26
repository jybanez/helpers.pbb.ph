# Tabs

Helper UI revision **0.21.206** adds the reusable attached presentation:

```js
const createTabs = await uiLoader.get("ui.tabs");
const tabs = createTabs(host, {
  variant: "attached",
  ariaLabel: "Project details",
  activeId: "summary",
  tabs: [
    { id: "summary", label: "Summary", content: "Project summary" },
    { id: "history", label: "History", render(panel) { panel.textContent = "History"; } },
  ],
});
```

`variant` accepts `"attached"` or `"pill"` (default). String values are trimmed
and case normalized; omitted, unknown and non-string values use the existing pill
appearance. The normalized root modifier is `.ui-tabs.is-attached`. No client CSS
is needed. Dark/light and other Helper themes use their existing theme tokens.

Attached tabs have adjacent rectangular boundaries and share the panel background
and edge when selected. The row scrolls horizontally at narrow widths; its scrollbar
is hidden to keep the shared edge intact. Touch/trackpad scrolling and keyboard focus
reveal offscreen tabs. Focus uses an inset ring so it is not clipped. When placing
the host in a custom flex/grid layout, allow the host to shrink (`min-width: 0`).

Keyboard behavior is unchanged: Left/Right move focus (clamped at the ends), Home/End
focus the first/last tab, and Enter/Space select. The selected tab remains the sole
tab stop. Clicking selects. Selection rerenders the tablist and active panel as before;
this change does not add focus restoration after selection.

`setActive(id, emit = true)`, `getActiveId()`, and `destroy()` are unchanged.
`update(newTabs, { activeId, variant })` accepts an optional variant; omitting it keeps
the current presentation. Pass new tab definitions, as with the existing update API.
Content still supports text, nodes, fragments and arrays, and `render(panel, tab)`
takes precedence. Callbacks and node reuse follow the existing lifecycle.

For modular loading, refresh `js/ui/ui.loader.js` and the tabs JS/CSS assets. For
bundle consumers, refresh both `dist/helpers.ui.bundle.min.js` and `.css` together
with cache key `0.21.206`. The bundled `uiLoader.get("ui.tabs")` exposes the same API.
The main bundle and tabs revisions change; unrelated module revisions do not.

See [the live demo](../demos/demo.tabs.html). Run `node tests/tabs.regression.mjs`
for source and bundle browser regressions.
