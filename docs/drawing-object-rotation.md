# Selected-object Move/Rotate controls

Load `ui.map.drawing.object` through the canonical loader. Its factory is
`createMapDrawingObjectTools(container, options)`; source consumers can import
that export from `ui.map.drawing.js`. It renders icon-only rows:

```
[Move] [Rotate]
[Fill] [Stroke] [Delete]
```

Pass the same `adapter` used by construction tools. Construction Finish/Cancel,
global Undo/Redo and Select/Pan remain independent. Existing drawing tools do
not gain these rows unless `objectControls: true` is specified. The dedicated
factory hides itself without a selected object in Select mode. `update` supports
the existing disabled/busy/placement/size/chrome options; `getSize()` returns the
current rendered width and height for application positioning. The application
owns anchoring and viewport collision avoidance. `destroy()` releases listeners
and content. Destroy the control before its adapter.

`onAction(action, state)` supplies Fill/Stroke callbacks to the application's
complete color workflow; Delete calls the adapter's existing `deleteSelected`
and therefore preserves its confirmation/context gate. No persistence is added.

The adapter owns `setObjectMode('move' | 'rotate')`, `getObjectMode()` and
`getState().objectMode`. Capability fields `objectModes.move/rotate` determine
availability; `objectControlsVisible` determines selected-object presentation.
`objectmodechange`, `objectmoderejected` and `statechange` expose authoritative
changes. A rejected switch returns false without changing the mode. Selecting
a different object resets Move; reselecting the same object retains its mode.
Select off retains the selection and object mode while native map navigation
remains available. Active drafts, redo-only drafts, style transactions and
gestures reject object-mode switching. No optimistic pressed state is retained.

Move preserves body translation and vertex editing. Rotate removes vertex
handles and rotates the whole selected Line/Path/Polygon/Rectangle by dragging
its rendered body or edge. A pointer at the pivot cannot define an angle.
Point and recognized geodesic Circle have no meaningful rotation: the whole
Move/Rotate row is omitted without an empty gap, leaving Move implicit and
the applicable action row. `objectRotationSupported` reports structural support
independently of transient `objectModes` locks; rotatable objects retain the row
while temporarily disabled. `getSize()` reflects the resulting layout.
Released gestures make one undo/redo entry; previews are excluded from
immediate `getFeatures()`. Escape, pointer cancellation, lost capture, blur and
teardown restore the gesture baseline through the existing transaction path.

Rotation uses normalized Web Mercator coordinates, x east and y north. The
pivot is the arithmetic mean of the outer ring's unique vertices for a Polygon,
all vertices for a Line/Path, or the declared center for an oriented rectangle.
It is frozen at gesture start. The angle follows pointer positions unprojected
onto this geographic plane, so bearing/pitch do not change the saved orientation.
All rings share that rotation; closure, holes, IDs (including numeric 0), styles,
foreign feature/geometry/properties and Line/Path semantics remain intact.
World-seam spans and unsafe longitude/Mercator latitude results are rejected
atomically; the last valid preview remains. This preserves the existing strict
2D import contract: altitude coordinates are rejected, never truncated.

Legacy rectangles remain `{kind:'rectangle', bounds:[[west,south],[east,north]]}`.
After rotation they use an explicit representation:

```js
{kind:'rectangle', projection:'mercator', center:[longitude,latitude],
 width:0.0001, height:0.00005, angleDegrees:60}
```

Width/height are positive normalized Mercator plane units, angle is degrees
counterclockwise from east. No stale geographic bounds remain. Geometry is
regenerated from the declared center/dimensions/angle and recognized only when
it matches. Export/reimport retains the shape. Move changes its geographic
center while keeping Mercator dimensions and angle; corner resize keeps the
opposite corner and orientation fixed. Crossing that corner is rejected.
Unknown or inconsistent shape metadata remains generic Polygon metadata.

The drawing demo presents the complete object control on selection, alongside
its independent construction tools. `?toggle` uses immediate edits; `?bundle=toggle`
exercises the delivered bundle. Automated mobile coverage uses desktop Chromium
at a mobile viewport width; physical touch, Safari and assistive technology
require separate verification.
## Selected-object row alignment

The complete object-tools component centers each rendered row within its measured width. Move/Rotate is centered above Fill/Stroke/Delete. Use the existing `chrome:false` option to omit component background/border/padding while retaining individual button styling. An application-owned host background must be removed by the application. Point/Circle still omit the entire interaction row, and `getSize()` reflects actual rendered dimensions. Construction toolbar alignment is unchanged. Presentation CSS revision311; adapter/geometry contracts remain309.
