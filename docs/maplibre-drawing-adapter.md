# MapLibre drawing adapter

`ui.map.drawing.maplibre` exports `createMapLibreDrawingAdapter(map, options)`.
It implements the complete existing `ui.map.drawing` adapter boundary; the toolbar
remains engine independent and existing consumers need not adopt this module.

```js
const createAdapter = await uiLoader.get("ui.map.drawing.maplibre");
const createTools = await uiLoader.get("ui.map.drawing");
const adapter = createAdapter(map, { lineBehavior: "segment", onError: reportDrawingError });
const tools = createTools(toolbar, { adapter, features: adapter.getFeatures(), orientation: "horizontal", modes: ["select", "pan", "point", "line", "path", "polygon"] });
tools.setFeatures(existingFeatures);
adapter.on("update", feature => updateApplicationDraft(feature));
// Teardown both instances; the toolbar does not own its adapter or map.
tools.destroy(); adapter.destroy();
```

## Engine and local runtime

The engine uses MapLibre's public GeoJSON source, layer, projection, rendered-hit
query and navigation-handler APIs directly. No additional drawing engine is
needed for this deliberately bounded point/line/path/polygon/shape and object-edit scope.
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

- Modes: `select`, `pan`, `point`, `line`, `path`, `polygon`, `rectangle`, `circle`. Unsupported modes throw `RangeError`. Circle and Rectangle construction and shape editing are described below.
- Points commit on click. With `lineBehavior: "segment"`, Line anchors its start
  on the first click, shows a live pointer endpoint preview, and automatically
  commits exactly two distinct vertices on the second click. Path adds successive
  connected vertices and completes with double-click or Finish (at least two
  distinct vertices). The second click of double-click does not duplicate its
  endpoint; map double-click zoom is disabled during drawing. Preview is not
  authored geometry and creates no history unit. Polygon needs three distinct
  vertices and a closed nonzero-area ring. Completion returns to Select.
- Compatibility: omitted `lineBehavior` defaults to `"legacy-path"`, retaining
  the old multi-point Line + Finish behavior. Explicit `"segment"` enables the
  distinct Line workflow; `path` always has Path behavior. Other option values
  throw `RangeError` before installing listeners. The complete toolbar accepts
  opt-in `path` without changing its default mode list. Demo defaults to segment;
  `?legacy` (or `?bundle=legacy`) exercises old consumers.
- Authored LineStrings store `properties.helperDrawingKind` as `"line"` for
  segment Line or `"path"` for Path/legacy Line. `getDrawingKind(id)` returns
  `line` only for a two-point LineString explicitly tagged `line`; all other
  LineStrings are paths. Imports are never migrated or rewritten. Metadata-free
  two- or multi-point LineStrings remain unchanged, including numeric ID0.
- Select a line/path, then drag any segment to translate all vertices together.
  Hit testing uses projected screen segments, including bearing/pitch; vertex
  handles within12 pixels win before segment hits within8 pixels. Translation
  applies one longitude/latitude delta from the original gesture snapshot to
  every vertex, preserving geographic shape; it does not rotate, scale or snap.
  Boundary policy: segment translation uses the primary projected copy and
  stops atomically at longitude[-180,180] and Mercator latitude limits
  ±85.0511287798066. A candidate violating any vertex bound, a longitude delta
  greater than180° (world-copy jump), or an original vertex outside Mercator
  limits is ignored; the last valid preview remains. No vertex is independently
  wrapped/clamped, no seam splitting occurs, and imports are never migrated.
  Existing out-of-Mercator data remains readable/exportable but cannot be
  translated as a segment. Cancel still restores the original snapshot.
  Vertex editing retains its existing finite bounds (longitude±180°, latitude±90°),
  including explicit edits beyond Mercator; the stricter whole-segment policy
  does not change vertex validation. Drag vertex handles to reshape individual vertices; polygon first-vertex edits update the closing
  coordinate. Holes can be imported and their existing vertices edited.
  Each released changed gesture is one canonical history unit. In edit sessions,
  gesture history stays local until Finish; Cancel restores the session baseline.
  Pointer cancellation/blur/lost capture restores only the active gesture;
  Escape cancels the session. Removal restores original authored data, stops
  further notifications and restores navigation. No persistence is performed.
- `getCapabilities()` dynamically reports `finish`, `cancel`, `undo`, `redo`,
  `delete`, `clear`, `fill`, `stroke`. Editing remains `drag-existing-vertices` for compatibility; `segmentTranslation: true`,
  `lineBehavior` and `drawingKinds: ["line", "path"]` describe the added capabilities. Measurement is false.
  There is no snapping, vertex insertion/removal,
  point whole-feature translation, multi-selection or geometric topology validation.

Selected ordinary Polygons support whole-object dragging from rendered interior or
outer/inner ring edges, including transparent-fill edges. Vertex handles retain
priority. The topmost rendered feature must match the selection, so another object
covering it cannot move the underlying Polygon. Hole interiors allow map panning.
Every ring translates from the original gesture snapshot by the same longitude/
latitude delta; ring order, winding, exact closure, supported 2D coordinates,
properties and foreign JSON geometry members remain intact. Unknown/mismatched
shape metadata remains unchanged generic data; recognized Circle/Rectangle retain
their dedicated transforms. No new coordinate dimensions are accepted.

Whole-Polygon translation follows the whole-segment world/Mercator policy: reject
the entire candidate, preserve the last valid preview and allow return to valid
coordinates. Existing out-of-Mercator imports remain intact but cannot be body
translated. No-op/wholly rejected gestures create no history. Released gestures
create one Undo unit; existing session rollback and immediate committed-snapshot,
Escape/cancel/lost-capture/context/removal protections apply. No persistence or
application Save behavior changes. See `tests/map.drawing.polygon.regression.mjs`.
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
No altitude, antimeridian splitting, ring-orientation
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
when no eligible object exists or the current session is dirty or dragging. A clean
session can switch directly with `beginEdit(targetId)` or a feature click. The replacement receives a fresh session ID; selecting its own
object retains the ID. Missing targets and blank clicks retain the current session. Read
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

Selection switches are blocked while the session is dirty or dragging; choose
explicit accept/rollback first. Imports and Clear remain blocked during any edit session. Explicit supported
mode changes from a clean, idle session end it without persistence or a history
unit and enter the requested mode. Pan/Point/Line/Polygon are then available;
Select retains the clean session/token without duplicate notifications. Dirty or
dragging sessions keep Select-only mode capability and reject mode changes until
explicit Finish/Cancel. Clean transitions retain authored data and global redo,
reject stale session tokens and publish final mode/session state with read-only
notification guards. Removal during settlement stops later notifications. Clean switching preserves the authored model
and global undo/redo; it discards the old session-local history. After local Undo
returns to the original model, direct switching becomes available again.

Object `actions.finish` and `actions.cancel` are true only while dirty (Finish
also requires no active drag). Clean toolbar Finish/Cancel are disabled, while
explicit `acceptEdit(sessionId)` and `rollbackEdit(sessionId)` remain available
for application Save/Close settlement. Imperative Cancel/Escape still rolls back
a clean session. Draft drawing Finish/Cancel keep their previous rules.

Optional toolbar actions `fill` and `stroke` render canonical SVGs and forward
through `onAction`; the MapLibre adapter exposes capabilities but does not open
a color dialog. Fill applies to points/polygons; Stroke applies to all supported
objects. Both are available only during an idle object edit session. Consumers
use the existing complete color picker, capture session/layer context and submit
colors through `updateFeature`. The demo routes these actions to its canonical
pickers. Defaults remain unchanged unless these actions are explicitly included.
Selected-object Delete is available during a clean, idle session. The existing
`beforeDelete` request is unchanged: veto, errors, asynchronous returns and Cancel
preserve the clean session, selection, authored data and global history. Explicit
one-shot confirmation ends that unchanged session and commits deletion as one
global undo unit. Dirty or dragging sessions reject deletion before opening the
hook; finish or cancel explicitly first. Clear still requires no object session.
A clean switch, mutation/Undo, gesture, settlement, import or destruction makes
an earlier request stale. Confirmation additionally checks the captured session
identity. A no-hook consumer retains immediate deletion. Deletion callbacks
observe the ended session; its final `editchange(null)` is omitted after removal.

The deletion gate still applies after acceptance/rollback, and any previous
confirmation becomes stale when a session starts. Ordinary legacy edits still
use immediate commit/history semantics. `getCapabilities()` adds `editSessions`
and `featureStyles`; available modes reflect clean/dirty/dragging state.

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

A supported post-dispatch path is to record context in a read-only listener and
act only from a subsequent explicit UI action. For example:

```js
let toolbarContext;
const owner = adapter;
owner.on("statechange", state => {
  toolbarContext = { owner, layerId: activeLayerId,
    sessionId: state.editSession?.id, revision: state.revision };
  repositionToolbar(state.anchor); // Project/clamp only; do not mutate adapter.
});
function finishFromUserClick() {
  const expected = toolbarContext;
  if (!expected || adapter !== expected.owner || activeLayerId !== expected.layerId) return false;
  const current = adapter.getState();
  if (current.revision !== expected.revision || current.editSession?.id !== expected.sessionId) return false;
  return adapter.acceptEdit(expected.sessionId);
}
```

Use the same captured-context check for explicit Close/Discard rollback. A Save
workflow must settle the active object edit first and persist only after successful
acceptance; captured layer/storage identity still requires its own authorization
and uncertain-outcome checks. Do not queue/replay rejected destructive or save
actions automatically. `destroy()` has no public removal-bypass parameter; actual
map removal is the sole internal forced-disposal path.

Map removal is an immediate lifetime boundary, including removal inside a read-only notification. Pending drag completion and active-drag rollback stop after removal without restoring stale previews or adding history. Rollback captures its session before notifications; selection, edit acceptance, drawing completion and hydration also check lifetime before continuing. Already completed changes remain completed when removal occurs during their publication.

Initial hydration uses available style structure, not isStyleLoaded(): pending base tiles must not delay the owned GeoJSON source/layers. Creating before style availability still waits for style.load/styledata; creating after style.load hydrates immediately even while tiles remain pending.


## Circle, Rectangle and immediate editing (0.21.303)

`editBehavior: "immediate"` opts into completed object edits as global undo units. Omitted `editBehavior` remains `"session"` with the existing begin/accept/rollback API. Immediate mode does not start explicit sessions; `beginEdit` returns false. Completed vertex, segment and shape gestures are one unit, with no object Finish/Cancel checkpoint. Atomic `updateFeature` remains one unit. Undo restores geometry and metadata together. Selection/tool switches after completed edits preserve the layer draft. Application layer Save and dirty-exit confirmation remain application responsibilities.

Circle and Rectangle take two points: center/radius endpoint or opposite corners. Pointer motion previews without committing. Focused canvas Enter uses the map center; with host keyboard navigation enabled, arrow keys pan during these two modes, updating the preview before the second Enter. Escape cancels only unfinished construction/gesture. Path/Polygon retain Finish. Circle has four cardinal radius handles; Rectangle has four corner handles with the opposite corner fixed. A handle takes priority over whole-shape dragging from the interior/boundary.

Exported geometry is Polygon plus `properties.helperShape`:

```js
{ kind: "circle", center: [longitude, latitude], radiusMeters: 250 }
{ kind: "rectangle", bounds: [[west, south], [east, north]] }
```

Circle uses mean Earth radius 6371008.8 metres and 64 deterministic geodesic vertices, starting north and advancing clockwise. Radius is finite, positive and smaller than a hemisphere. Moving it regenerates the geodesic ring from its new center, preserving radius in metres; geographic radius does not imply a screen circle under projection, bearing or pitch. Rectangle sides follow geographic longitude/latitude axes and retain that orientation under camera transforms; it is not a screen-aligned rectangle. Bounds must have positive width and height. Resize/movement atomically update Polygon coordinates and metadata, preserving foreign JSON geometry members and unrelated properties.

Only the exact documented schema with matching deterministic geometry (one ring, expected vertex count, absolute coordinate tolerance 1e-10 degrees) receives shape handles. Invalid, unknown or mismatched metadata remains a generic Polygon, preserving imported geometry/properties byte-for-byte through import/export. No migration regenerates an import. New shapes and shape gestures stop atomically at longitude ±180 and Mercator latitude ±85.0511287798066; Circle checks geographic extrema as well as vertices. Wrapped-world deltas over 180 degrees and degenerate constructions are rejected. A rejected movement retains the last valid preview. No vertex is independently clamped or wrapped. Existing generic imported geometry retains the adapter's legacy coordinate validation and vertex editing limits.

### Completed color interactions

Use the complete picker `onInput` / `onChange` callbacks with the adapter APIs:

```js
const token = adapter.beginStyleChange(); // selected feature; false if unavailable
adapter.previewStyle({ fill: rgba, stroke: otherRgba }, token);
adapter.finishStyleChange(token); // one completed undo unit
// Or adapter.cancelStyleChange(token): no history unit.
```

Tokens are adapter-local, stale-safe and rejected during callback reentry. Preview accepts a complete helperStyle object and preserves its RGBA precision. `getState().features` exposes render previews; in immediate mode `getFeatures()` excludes pending geometry/style previews. `getCapabilities().canPersist` is false during pending style, drag, construction or a dirty explicit edit session. Before Save, the app explicitly calls `settleStyleChange({ commit: true })` and verifies `canPersist`; for dialog dismissal, `settleStyleChange()` cancels. Save itself remains app-owned.

Selection/mode changes cancel unfinished style preview before switching. Undo/Redo first cancel a pending preview without consuming earlier history. Valid external `setFeatures` cancels a preview and replaces/reset its context; invalid imports leave it untouched. Destroy/map removal cancel pending preview while retaining earlier completed immediate units. Cancel/no-op creates no undo unit. Old callbacks cannot finish a cancelled token. During a pending style interaction, other feature mutations and deletion are unavailable. Explicit settlement APIs avoid application-local token protocols.

The complete toolbar accepts `hideUnavailableActions: ["fill", "finish", "cancel"]` as an opt-in. Omitted defaults retain disabled actions. Immediate demos hide irrelevant Fill and idle Finish/Cancel, retaining construction and preview Cancel and disabled Undo/Redo. Select/Pan use canonical mouse-pointer/open-hand SVG icons.

### Optional Select toggle

Pass `selectToggle: true` to both `createMapLibreDrawingAdapter(map, options)` and
`createMapDrawingTools(container, options)`. Both default to false. Selection starts
enabled. The toolbar hides Pan and turns Select into a native toggle button:
pressed means object selection/editing; unpressed in Pan means navigation only.
Capabilities expose `selectToggle` and `selectionEnabled`; the toolbar reads the
actual accepted adapter mode, including initial mode and rejected requests.
Keyboard activation retains button focus and truthful `aria-pressed`/titles.

Navigation preserves selected identity, features, metadata and undo/redo history.
Vertex handles disappear, pointer editing and editing keyboard shortcuts stop,
and native map pan/zoom/rotate/tilt retain the host's configured availability.
Re-enabling Select restores the retained selection and handles.

With this option, changing modes during a live drag, pending style transaction,
construction draft or draft redo returns false without discarding work.
Capabilities expose a user-facing `modeTransitionReason` while blocked; the
complete toolbar displays it as status feedback. Direct rejected adapter calls
emit `moderejected` with `requestedMode`, actual `mode`, and `reason`.
Calling the current mode is a no-op. Finish or explicit Cancel remains available; Cancel
restores transient edits or discards unfinished construction while retaining
earlier completed layer edits. Finish, Cancel and automatic completion (including
Point) return to Select. Existing dirty-session guards still apply. Default
consumers retain the existing mode transition and repeated Point behavior.

Try `demos/demo.map.drawing.html?toggle` or `?bundle=toggle`. Run
`node tests/map.drawing.toggle.regression.mjs` for Chromium pointer/keyboard
desktop/mobile-width coverage; physical touch, Safari and assistive technology
are not covered by these automated checks.

Event semantics: style preview/cancellation dispatches `measure` and `statechange` only, never committed `update`. Successful changed settlement dispatches one `update` for the feature then state; unchanged settlement dispatches state without update/history. Dirty tracking must compare committed `getFeatures()`, never `getState().features`. After context cancellation, a late onChange must retain its original token and call `finishStyleChange(originalToken)` (which returns false), never begin a new transaction for a newly selected object. Native demo callbacks ignore a completed change whose original transaction has already disappeared.

For action visibility, the toolbar opt-in uses `getCapabilities().actionVisibility` before falling back to action availability. This keeps relevant Fill visible but disabled during a pending interaction and shows Path/Polygon Finish before enough vertices exist, while hiding idle immediate object Finish/Cancel. Visibility does not enable an unavailable action.
