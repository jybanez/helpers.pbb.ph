# MapLibre drawing adapter

`ui.map.drawing.maplibre` exports `createMapLibreDrawingAdapter(map, options)`.
It implements the complete existing `ui.map.drawing` adapter boundary; the toolbar
remains engine independent and existing consumers need not adopt this module.

```js
const createAdapter = await uiLoader.get("ui.map.drawing.maplibre");
const createTools = await uiLoader.get("ui.map.drawing");
const adapter = createAdapter(map, { onError: reportDrawingError });
const tools = createTools(toolbar, { adapter, features: adapter.getFeatures(), orientation: "horizontal" });
tools.setFeatures(existingFeatures);
adapter.on("update", feature => updateApplicationDraft(feature));
// Teardown both instances; the toolbar does not own its adapter or map.
tools.destroy(); adapter.destroy();
```

## Engine and local runtime

The engine uses MapLibre's public GeoJSON source, layer, projection, rendered-hit
query and navigation-handler APIs directly. No additional drawing engine is
needed for this deliberately bounded point/line/polygon and vertex-edit scope.
MapLibre is supplied by the host; no global MapLibre dependency exists in the
adapter or toolbar. The existing local `vendor/maplibre/maplibre-gl.js` and CSS
are pinned to **4.6.0**, licensed BSD-3-Clause (full local `LICENSE.txt`). The
worker is embedded in the standard script; deployments must permit its blob
worker under their CSP. The Helper adapter is covered by the repository license.
The demo uses local assets and a background-only style, requires no tile server,
glyphs or sprites and reports actual engine failures rather than substituting a
mock. Serve the repo through HTTP (for example WAMP); open
`demos/demo.map.drawing.html`, or append `?bundle` to exercise bundled factories.

Reference APIs: [Map](https://maplibre.org/maplibre-gl-js/docs/API/classes/Map/),
[DragPanHandler](https://maplibre.org/maplibre-gl-js/docs/API/classes/DragPanHandler/).
Compatibility is verified with the local 4.6.0 runtime, rather than inferred from
the current online documentation.

## Capabilities and interaction

- Modes: `select`, `pan`, `point`, `line`, `polygon`. Unsupported modes throw
  `RangeError`; toolbar rectangle/circle buttons are disabled by capabilities.
- Points commit on click. Lines need two distinct vertices; polygons need three
  distinct vertices and a closed nonzero-area ring. Finish commits and returns
  to Select. Click a feature in Select, then drag one existing vertex. Polygon
  first-vertex edits update the matching closing coordinate. Holes can be
  imported and their existing vertices edited.
- `getCapabilities()` dynamically reports `finish`, `cancel`, `undo`, `redo`,
  `delete`, `clear`. Editing is `drag-existing-vertices`; measurement is false.
  There is no rectangle/circle generation, snapping, vertex insertion/removal,
  whole-feature translation, multi-selection or geometric topology validation.
- Map-focused Enter adds a coordinate at map center in drawing modes; Escape
  cancels; Delete/Backspace deletes the selection; Ctrl/Cmd+Z undoes, Shift+Z or
  Ctrl/Cmd+Y redoes. Toolbar controls provide native keyboard access including
  Finish. This is not a complete keyboard vertex editor or assistive-technology
  acceptance claim.
- Draft undo/redo removes/restores pending vertices before committed history.
  Committed edits, creates, delete and clear each form one undo unit, up to
  `historyLimit` (positive integer, default100). New committed changes clear
  committed redo. Cancel discards the draft or reverts an active vertex preview;
  it does not undo completed features. Import resets all history and draft state.

## Confirming authored deletion

Optional adapter `beforeDelete(request)` gates public `deleteSelected()` and
`clear()`, including complete toolbar Delete/Clear and canvas Delete/Backspace.
Toolbar `onAction` is post-mutation, not a veto hook. No keyboard interception or
replacement toolbar is needed. Without the hook behavior stays immediate.
With it only synchronous `true` permits immediate deletion; all other returns,
including Promises, veto without mutation or automatic replay. Errors cancel the
request and report through `onError`; rejected native Promises are also reported.

The frozen request contains `action` (`delete`/`clear`), frozen `featureIds`
(original numeric/string IDs), opaque editor `revision`, `confirm()` and `cancel()`.
After explicit human confirmation, `confirm()` bypasses the hook once and returns
whether deletion was accepted. Dismissal calls `cancel()` and discards the request.
Selection, mode, draft/history, import, geometry/gesture changes and destruction
invalidate old requests, even when imported IDs are identical. Starting a drag
invalidates a request even if that drag is later cancelled. Revisions are not
storage versions and need not increment by one. Recursive delete/clear/confirm
inside the hook returns false without replay. The app owns dialog deduplication
and must additionally check active layer identity and storage revision, which the
adapter cannot know. Do not mutate the adapter inside geometry event callbacks.

```js
beforeDelete(request) {
  if (pendingConfirmation) { request.cancel(); return false; }
  const context = captureLayerAndStorageRevision();
  pendingConfirmation = request;
  const modal = createActionModal({
    title: "Delete drawing", content: "Delete this drawing?", autoBusy: false,
    actions: [
      { id: "cancel", label: "Cancel", onClick() { request.cancel(); } },
      { id: "confirm", label: "Delete", onClick() {
        if (isCurrentLayerAndStorageRevision(context)) request.confirm();
      } },
    ],
    onBeforeClose() { request.cancel(); return true; },
    onClose() {
      request.cancel();
      if (pendingConfirmation === request) pendingConfirmation = null;
      modal.destroy();
    },
  });
  modal.open(); // Also close/cancel this modal when the app context is invalidated.
  return false;
}
```

Show the canonical confirmation immediately from a synchronous hook, return false,
and call `confirm()` only from the explicitly confirmed action. Context cancellation
must cancel/discard the request. The app owns durable saving and uncertain storage
outcomes. This gate covers explicit delete/clear; undo/redo, replacement imports
and app-owned layer deletion retain the consuming workflow's policies. Clear can
discard a draft as before; request IDs describe only committed features. The demo
checkbox exercises the canonical dialog with default immediate deletion retained.
The demo uses the complete `ui.action.modal` because the current `ui.dialog.confirm`
convenience wrapper does not expose dismissal/context-abort lifecycle hooks.
No custom modal is constructed. Disable automatic busy behavior when performing
context validation first; app persistence workflows need their own validated
submission/error/uncertain-outcome handling after this in-memory example.

## API, data and event ownership

Options: `features` initial feature array/FeatureCollection, `idPrefix` unique
reserved source/layer prefix (generated by default), `historyLimit`, `onError`,
and optional synchronous `beforeDelete(request)`.
Use one active adapter per map: input handlers intentionally own drawing gestures.
Do not reuse the reserved prefix in host sources/layers during the adapter's life.

Methods: `on(event, callback)` returns an unsubscribe function; `setMode(mode)`,
`setFeatures(features)`, `validateFeatures(features)`, `getFeatures()`, `getMode()`, `getState()`,
`getCapabilities()`, `finish()`, `cancel()`, `undo()`, `redo()`, `deleteSelected()`,
`clear()`, `destroy()`. `finish()` returns false when insufficient vertices exist;
otherwise validates, commits and returns true. Invalid drafts report through
`onError`, return false and remain editable. Invalid imports throw before changing
the model. Pointer edits rejected on validation revert to the previous committed
geometry and report through `onError`.
`validateFeatures` is a pure preflight returning a defensive validated copy; the
toolbar uses this optional adapter method before its legacy normalization so
unsupported values cannot be coerced before the adapter sees them.

Events conform to the existing component: `create`/`update` carry a GeoJSON
Feature; `delete` carries its original ID (one event per deleted feature);
`select` carries `{featureId, feature}` or null; `modechange` carries the string;
`measure` carries null to clear measurement and refresh action availability.
Initial construction is silent. Import emits the creates/updates/deletes needed
to reconcile consumers, without adding undo history. Undo/redo also emit geometry
differences. Drag previews render without update events; one update occurs on
valid pointer release. A cancelled preview emits no geometry change.

Callbacks receive independent JSON copies; a subscriber exception is reported to
`onError` (default console error), while other subscribers and lifecycle cleanup
continue. Event subscribers should not synchronously invoke mutating adapter
methods: these events describe the current committed operation, not a queued
command transport. Keep persistence, permissions, personal-layer UI, storage and
transport decisions in the application. This module saves/uploads nothing.

IDs must be nonempty strings or finite numbers; numeric0 is retained. IDs must
be unique even when string and numeric forms are equivalent. New drawn features
use prefix plus `crypto.randomUUID()` in a secure browser context. Imports retain
IDs, properties and geometry exactly; get/set/event copies prevent caller-owned
data mutation. Before cloning, the complete input batch (including foreign members)
must consist of JSON data: null, strings, booleans, finite numbers, dense ordinary
arrays, and plain objects with Object/null prototypes. Objects require own
enumerable string-keyed data properties. Undefined, functions, symbols (values
or keys), BigInt, nonfinite numbers, cycles, sparse/extended arrays, accessors,
hidden properties, custom prototypes and class/built-in instances (including
Date, Map, Set and boxed primitives) are rejected. No toJSON hooks are run.
Repeated noncyclic references are allowed; object/prototype identity is not part
of the GeoJSON data contract. Defensive structured clones retain negative zero
and nested JSON values. GeoJSON properties must be an object or null.
Geometry accepts only Point/LineString/Polygon with finite **2D** longitude/latitude
in [-180,180]/[-90,90]. Coordinates use browser double precision without rounding.
Polygon ring validation uses a 1e-12 degree-squared tolerance on signed twice-area.
No altitude, circle-radius metadata, antimeridian splitting, ring-orientation
normalization or self-intersection/hole-containment validation is performed.
Input rejection is atomic; the previous model and current gesture remain intact.

## Map lifecycle

The adapter owns one GeoJSON source and four layers (fill, line, point, vertex).
Drafts and selection/vertex visual metadata exist only in rendered copies; exports
contain the original user data. It rehydrates these resources on `style.load`
and deferred `styledata` reconciliation for style-diff updates, while retaining
the model, selected ID and draft. Construction can precede initial
style load. On destroy it removes owned layers before source, unsubscribes map,
canvas and window listeners and restores the previous canvas cursor. Map removal
also disposes the adapter. Subsequent mutations are inert; reads retain last
committed features. Destroy is idempotent.

Drawing temporarily disables drag-pan, double-click zoom and map keyboard
navigation; vertex drag also disables rotate/touch navigation. Each operation
captures enabled states and restores them on finish/cancel/release/destroy,
including handlers already disabled by the host. Host code must not independently
toggle these same handlers during an owned gesture. Pointer cancel/lost capture
and window blur roll back a vertex preview. Scrolling/zooming in select/pan is
otherwise left to MapLibre. This bounded implementation does not claim tested
real-touch editing, physical-phone behavior or screen-reader acceptance.

## Verification and provenance

`node tests/map.drawing.maplibre.regression.mjs` drives the real local MapLibre
runtime through Playwright CLI, source and bundle modes, desktop1200/mobile375
widths. It covers pointer-created features and edits, keyboard finish/cancel and
history, imported numeric0 and nested metadata, invalid input, style rehydration,
observer error isolation, navigation restoration, owned resource/listener cleanup
and map removal. Screenshots are under `output/playwright/`.

Also run `node tests/map.drawing.regression.mjs`, bundle and registry contracts.
`maplibre-drawing-runtime.json` records LF-normalized SHA256 runtime provenance;
the package version remains0.21.83, adapter/main UI cache revision0.21.290;
the toolbar core also uses0.21.288.
CSS is unchanged. Acceptance covers the library; PBB Map personal-layer UI and
persistence require their own design, implementation and acceptance.

## Existing-object edit sessions and styles (adapter revision295)

Legacy edits remain immediate unless `beginEdit(id)` is called in Select with
no drag or pending draft. IDs include numeric zero; the method returns false
when no eligible object exists or another session is active. Read
`getState().editSession.id` after beginning and capture it for asynchronous UI.

```js
if (adapter.beginEdit(0)) {
  const sessionId = adapter.getState().editSession.id;
  adapter.updateFeature(0, {
    style: { fill: fillPicker.getValue(), stroke: strokePicker.getValue() },
  }, { sessionId });
  // After explicit Finish: adapter.acceptEdit(sessionId).
  // After explicit Cancel: adapter.rollbackEdit(sessionId).
}
```

`updateFeature(id, patch, { sessionId }?)` accepts only `geometry`, `properties`
and `style`. Geometry and properties replace those complete values; unspecified
values stay intact. Style replaces `properties.helperStyle`; `style: null`
removes that reserved value and restores default rendering. A non-null style is
an object with optional `fill` and `stroke`, each exactly `{ r, g, b, a }`:
integer RGB0–255 and finite alpha0–1, directly matching color-picker `getValue()`.
Pass both colors when both should be retained. Unknown style keys and invalid
JSON/geometry/colors throw TypeError before model, selection, history or events
change. IDs cannot be changed through this method. `getFeatureStyle(id?)` returns
a defensive copy, `{}` for an unstyled object, or null for no matching object.
Imports also validate the reserved helperStyle property. Export includes styles;
internal paint fields are source-only and never added to authored features.

During a session, vertex drags and updates are previews. Existing update events
still fire so the app can refresh its working draft, but must not be treated as
accepted persistence. Undo/redo use session-local history. Complete drawing
toolbar Finish/Cancel and map Escape call accept/rollback. Accept groups all
changes into one global undo unit; rollback restores geometry, properties and
styles exactly, retaining prior global undo/redo. No-op acceptance retains prior
redo. Active drags block accept/update/undo/redo; rollback aborts a drag first.
Destroy discards unaccepted session changes without persistence or teardown
callbacks. Session IDs increase per instance; pass the captured ID to accept,
rollback and update to reject stale UI results, and separately guard adapter/layer
identity when an instance is replaced.

Selection clicks, mode changes, imports, delete and clear are blocked while an
edit session is active (return false); choose explicit accept/rollback first.
The deletion gate still applies after acceptance/rollback, and any previous
confirmation becomes stale when a session starts. Ordinary legacy edits still
use immediate commit/history semantics. `getCapabilities()` adds `editSessions`
and `featureStyles`; while editing, available modes are Select only.

Fill colors apply to polygons and point interiors; stroke colors apply to lines,
polygon outlines and point borders. Explicit style overrides the old selection
color; selected vertex handles remain visible. Missing styles retain the existing
blue/amber defaults, polygon fill opacity0.22 and point border. Alpha is applied
independently to fill and stroke (including exact zero). Draft paint and vertex
handles remain the canonical defaults. Style rehydration after map style reload
uses the same per-feature source properties and expressions.

`getState()` adds `editSession` (id, featureId, dirty, dragging, canUndo, canRedo),
`dragging` and `anchor`. The anchor is the longitude/latitude bounding-box midpoint
of draft vertices, otherwise selected-object vertices; no selection gives null.
It is not a pixel position or a geodesic/antimeridian-aware centroid. Project it
with `map.project(state.anchor)`, and reposition on map movement/resize.
`statechange` publishes those interaction fields plus revision after draft/model
changes and during pointer dragging; use it for an object-relative toolbar.
`editchange` signals session begin/end. These events contain defensive snapshots.
The app still owns object-toolbar/navigation UI, dirty-close confirmation,
permission checks, session save, offline recovery and uncertain persistence.
The demo uses the complete drawing toolbar and color-picker components to
exercise selected-object begin, Fill/Stroke and Finish/Cancel.

Adapter event listeners are read-only: reentrant mutation calls (including
begin/accept/rollback, import, undo/redo, update, mode changes, deletion and
explicit destroy) return false while events are being delivered. Observe snapshots
there; invoke later UI actions outside the callback with captured adapter/layer
identity and session ID. No rejected mutation is queued or automatically replayed.
Map removal still disposes the adapter even if initiated during an event.
