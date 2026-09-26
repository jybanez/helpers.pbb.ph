# Splitter

UI revision **0.21.207** adds a larger transparent resize target and double-click reset
to the canonical `ui.splitter`, including `chrome: false` layouts.

```js
const createSplitter = await uiLoader.get("ui.splitter");
const splitter = createSplitter(host, {
  chrome: false,
  panePadding: 0,
  orientation: "horizontal", // left/right; vertical means top/bottom
  initialRatio: 0.35,
  minRatio: 0.2,
  maxRatio: 0.8,
  paneA: leftContent,
  paneB: rightContent,
  onResize(ratio, state) { savePreference(ratio); },
});
```

The visible divider remains 8px, centered in a **24px reserved grid track**. The
extra area is transparent and accepts pointer input; it does not overlay pane
controls. This uses 16px more layout space than the previous track. Ratios divide
the remaining pane space. Hover/drag colors use theme tokens; keyboard focus has
an inset outline. `chrome: false` still removes the outer background and border.
Content supplied inside panes retains its own styling. Give chromeless hosts a
usable height, as before.

Double-clicking restores the current configured `initialRatio` (default `0.5`),
clamped to `minRatio`/`maxRatio`, and calls `onResize(ratio, state)` once. Pressing
without dragging does not change the ratio or emit; dragging uses the distance
from the initial pointer position, including when grabbed at the target edge.
`update({ initialRatio })` changes the reset destination as well as the current
ratio. Restoring saved preferences with `setRatio(savedRatio)` leaves the reset
destination unchanged.

Arrow keys resize by 0.02; Home/End select min/max. `disabled: true` disables drag,
keyboard and double-click interactions. Equal min/max ratios also make the divider
static. These modes keep layout intact and remove the divider from keyboard tab
navigation. Programmatic `setRatio` remains available and constrained by min/max.
Use `update({ disabled: false })` to re-enable an unlocked splitter.

Update and destroy cancel active drags, remove temporary listeners, release pointer
capture, and restore pre-drag cursor/selection styles. Pointer cancellation, capture
loss and window blur also end dragging. Nested splitters retain independent ratios
and orientation. Destroy nested component instances explicitly when disposing them.

Public methods: `setRatio(ratio, { emit: true })`, `update(options)`, `getState()`,
and `destroy()`. Source and bundle APIs match. Refresh the loader and splitter JS/CSS
for modular clients, or both main distribution JS/CSS assets with cache key
`0.21.207` for bundled clients. Package semantic version is unchanged.

Browser regression pages (wait for `body.dataset.status` to become `pass`):

- `tests/splitter.interaction.regression.html` and `?bundle`: both orientations,
  dark/light themes, framed/chromeless, reset/callbacks, bounds, keyboard, pointer
  identity, disabled/static, nested reset and active-drag cleanup.
- `tests/splitter.theme.regression.html`: token and interaction styling.
- `tests/splitter.nested.regression.html`: sizing, alignment and mixed orientations.

See [the demo](../demos/demo.splitter.html) for nested composition and theme switching.
