# Incident Component Helpers (Prototype)

A lightweight helper-library prototype for rendering incident-related UI components using plain JavaScript and CSS.

## Repository And Live Demo

- GitHub Repository: `https://github.com/jybanez/helpers.hotline.pbb.ph`
- Live Demo (GitHub Pages): `https://jybanez.github.io/helpers.hotline.pbb.ph`
- Refactor Playbook (for `hotline.pbb.ph` integration): `docs/hotline-refactor-playbook.md`

This repository currently covers **7 helpers**:

- `incidentBase`
- `incidentTeamsAssignments`
- `incidentTeamsAssignmentsEditor`
- `incidentTeamsAssignmentsViewer`
- `incidentTypes`
- `incidentTypesDetailsEditor`
- `incidentTypesDetailsViewer`

## Project Structure

```text
css/
  ui/
    ui.tokens.css
    ui.components.css
    ui.dialog.css
    ui.tabs.css
    ui.strips.css
    ui.media.strip.css
    ui.audio.css
  incident/
    incident.css
    incident.base.css
    incident.teams.assignments.css
    incident.teams.assignments.editor.css
    incident.teams.assignments.viewer.css
    incident.types.css
    incident.types.details.editor.css
    incident.types.details.viewer.css
js/
  ui/
    ui.dom.js
    ui.events.js
    ui.drawer.js
    ui.search.js
    ui.dialog.js
    ui.tabs.js
    ui.strips.js
    ui.media.strip.js
    ui.audio.player.js
    ui.audio.audiograph.js
    ui.audio.callSession.js
  incident/
    incident.base.js
    incident.teams.assignments.js
    incident.teams.assignments.editor.js
    incident.teams.assignments.viewer.js
    incident.types.js
    incident.types.details.editor.js
    incident.types.details.viewer.js
index.html
demo.team.assignments.html
demo.incident.types.html
demo.ui.html
demo.audio.html
sampledata.json
sampledata_*.json
boot.*.json
```

## Contracts

All helpers accept:

1. `container` - target DOM element
2. `data` - data to render
3. `options` - extra behavior/config

All helpers return a stable API:

- `destroy()` - cleanup and unmount
- `update(nextData, nextOptions?)` - re-render without remount

## Internal UI Utilities

Reusable shared UI utilities live under `js/ui`:

- `ui.dom.js`
  - `createElement(tag, config)`
  - `clearNode(node)`
- `ui.events.js`
  - `createEventBag()` for safe event binding/unbinding
- `ui.drawer.js`
  - `createBottomDrawer(options)` reusable bottom drawer shell
- `ui.search.js`
  - `createSearchField(options)` reusable search field with clear + `Esc`-to-clear behavior
- `ui.dialog.js`
  - `uiAlert(message, options)` promise-based alert modal
  - `uiConfirm(message, options)` promise-based confirm modal
  - `uiPrompt(message, options)` promise-based prompt modal
- `ui.tabs.js`
  - `createTabs(container, options)` accessible tablist + panel component
- `ui.strips.js`
  - `createStrip(container, items, options)` selectable pill-strip component (single/multi)
- `ui.media.strip.js`
  - `createMediaStrip(container, items, options)` media thumbnails strip (image/video) with modal viewer/player + in-modal prev/next navigation
  - options include `layout: "scroll" | "wrap"` and `animationMs` (default `300`)
- `ui.audio.player.js`
  - `createAudioPlayer(container, data, options)` reusable transport UI (play/pause, time, seek)
- `ui.audio.audiograph.js`
  - `createAudioGraph(container, data, options)` standalone role audiograph renderer with multiple styles
- `ui.audio.callSession.js`
  - `createAudioCallSession(container, incident, options)` parent orchestrator for timeline playback + stacked role audiographs

Reusable UI styles live under `css/ui`:

- `ui.tokens.css` shared spacing/color/typography tokens
- `ui.components.css` shared primitives (`.ui-button`, `.ui-input`, `.ui-drawer*`)
- `ui.dialog.css` shared dialog/modal styles
- `ui.tabs.css` tab UI styles
- `ui.strips.css` strip/chip selector styles
- `ui.media.strip.css` media strip, thumbnail, and media viewer styles
- `ui.audio.css` audio player, audiograph, and call session styles

Current usage:

- `incident.types` now uses `createEventBag` and `createBottomDrawer`.
- `incident.teams.assignments` now uses `createEventBag` and `createBottomDrawer`.
- `incident.types` and `incident.teams.assignments` now share `createSearchField` for drawer search UX.
- Editor/viewer helpers now apply shared `ui-*` primitives (`ui-title`, `ui-input`, `ui-button`) alongside existing `hh-*` classes for non-breaking style migration.

## Common Options

- `theme`: `"dark"` | `"light"` (default `"dark"`)
- `className`: extra class for root element
- `emptyText`: fallback text for empty state
- `locale`, `timezone`: formatting support
- `debug`: boolean (default `false`)
- `lookups`: boot-reference object

Editor-only options:

- `onChange(payload)`
- `onSubmit(payload)` (emit-only, no auto-submit)

## Team Assignment Helpers

### List Helper: `incidentTeamsAssignments`

Required options:

- `categories` (array)
- `teams` (array)
- `noticeAlreadyExist(team)` (function)
- `incident_id`
- `operator_id`

Optional list options:

- `editable` (default `true`)
- `headerText` (default `"Dispatch Details"`)
- `drawerHeaderText` (default `"Select Teams to Dispatch"`)
- `onAssignTeam(newAssignment)`
- `onOpenDrawer()`
- `onCloseDrawer()`

List behavior:

- `editable=true`: list renders editor instances and shows `Assign Teams` button
- `editable=false`: list renders viewer instances and does not show drawer/actions
- Assign drawer supports:
  - category filtering (`All Categories` default)
  - search within filtered team set
  - duplicate hint on already assigned teams (same `team_id` where status is not `cancelled`)

If required list options are missing:

- helper logs console error
- renders nothing
- still returns stable API

`incidentTeamsAssignmentsEditor` and `incidentTeamsAssignmentsViewer` now support enriched team assignment rendering:

- Header with team name + category
- Status stepper timeline (`requested`, `accepted`, `en_route`, `on_scene`)
- Cancellation reason block when status is `cancelled`
- Notes thread (editor includes add-note input)
- Resource allocation table (shown only for `accepted|en_route|on_scene|completed` and when team resources exist)

Required options for editor/viewer:

- `incident_id`
- `team_id`
- `assigned_by_operator_id`

If required options are missing:

- helper logs console error
- that instance renders nothing
- helper still returns stable `{ destroy, update }`

Editor callbacks:

- `onStatusNext(assignmentId, toStatus)`
- `onCancel(assignmentId, fromStatus, reasonCode, reasonNote)`
- `onDelete(assignmentId)`
- `onContactChange(assignmentId, value)`
- `onNoteAdd(assignmentId, note)`
- `onAllocateChange(assignmentId, resourceTypeId, allocated)`

Confirm handlers (required in editor):

- `confirmStatus(toStatus)`
- `confirmCancel(fromStatus, reasonCode, reasonNote)`
- `confirmDelete()`

All confirm handlers may return `boolean | Promise<boolean>`.

Runtime methods:

- `incidentTeamsAssignmentsEditor.getData()` -> current assignment payload object
- `incidentTeamsAssignmentsViewer.getData()` -> current assignment payload object
- `incidentTeamsAssignments.setList(items[])` -> replaces current list and rebuilds child instances
- `incidentTeamsAssignments.getData()` -> array of assignment payloads from child instances
- `incidentTeamsAssignments.getState()` -> `{ list, options, drawerState }`

## Incident Types Helpers

`incidentTypes` supports list rendering for incident type cards.

- `editable=true` (default): renders `incidentTypesDetailsEditor` children
- `editable=false`: renders `incidentTypesDetailsViewer` children
- `headerText` default: `"Incident Details"`
- `drawerHeaderText` default: `"Select Reported Incidents"`
- required: `categories` (incident categories array)
- required: `incidentTypes` (incident types array)
- optional callbacks: `noticeAlreadyExists(incidentType)`, `onOpenDrawer()`, `onCloseDrawer()`, `onAddIncidentType(payload)`
- accepts incident payload or normalized incident-type item array
- `setList(items[])` replaces list and re-renders
- `getData()` returns current child payload array
- `getState()` returns `{ list, options, drawerState }`
- required when `editable=true`: `options.removeIncidentType` must be a function
- missing required list options: console error + render nothing + stable API

Single item shape used by editor/viewer:

```js
{
  id,
  incident_id,
  incident_type_id,
  incident_type_category_id,
  incident_type_category_name,
  name,
  fields: [],
  detail_entries: [],
  resources: [],
  resources_needed: []
}
```

`incidentTypesDetailsEditor` options:

- `removeIncidentType(incidentTypeData)` (required in editor)
- `onFieldChange(incidentTypeId, fieldKey, value)`
- `onResourceChange(incidentTypeId, resourceTypeId, quantityNeeded)`

`incidentTypesDetailsEditor` methods:

- `getData()`
- `validate()` -> `{ status, errors: [{ field_key, error }] }`
- `isValid()`

`incidentTypesDetailsViewer` methods:

- `getData()`
- `validate()`
- `isValid()`

Behavior implemented:

- Header shows incident type name + category subtitle
- Editor shows remove icon (viewer hides it)
- Editor list shows `Add Incidents` button
- Add flow uses a bottom drawer with:
  - category filter from `options.categories`
  - type chips from `options.incidentTypes`
  - search with clear button and `Esc`-to-clear
  - duplicate block on existing `incident_type_id` in current list
- Fields section:
  - sorted by `field.sort_order`
  - supports `text|number|textarea|select|multiselect`
  - required indicator + required attribute for required fields
  - number `min/max/step` support
  - multiselect stored as comma-separated values in `detail_entries[].field_value`
  - values resolved by `detail_entries[].field_key`
- Resources section:
  - rendered only when `resources_needed` is not empty
  - labels from `resources[].name`
  - quantities resolved by `resource_type_id`
  - editor uses numeric inputs; viewer uses text
- Missing required data/options:
  - logs console error
  - renders nothing
  - returns stable API object

## Lookup Keys

Supported lookup keys in `incidentBase`:

- `teamStatuses`
- `incidentStatuses`
- `alertLevels`
- `incidentTypes`
- `incidentCategories`
- `teams`
- `resourceTypes`
- `operators`

Missing references trigger console warnings.

## Audio UI Helpers

### `createAudioGraph(container, data, options)` (standalone)

Standalone audiograph component for a single role, usable with or without the call-session helper.

Data:

- `role`
- `roleLabel`
- `muted`
- `isPlaying`
- `currentMs`
- `durationMs`

Options:

- `style`: `vu | dots | mirrored | spectrum | neon | particle | shockwave | tsunami | plasma | burst | heartbeat`
- `sensitivity` (default `3.4`)
- `gateThreshold` (default `0.06`)
- `attackMs` (default `45`)
- `releaseMs` (default `260`)
- `intensityCurve` (default `1.7`)
- `freezeOnPause` (default `true`)
- `overlayHeader` (default `true`)
- `headerInsetPx` (default `30`)
- `showMute`, `muteLabel`, `unmuteLabel`
- `onToggleMute(muted, state)`

Methods:

- `destroy()`
- `update(nextData, nextOptions?)`
- `setMuted(muted, { notify? })`
- `setPlayback({ isPlaying, currentMs, durationMs })`
- `attachAudio(audioElement)`
- `unlockAudioContext()`
- `getState()`

### `createAudioPlayer(container, data, options)`

Reusable transport controls.

Data:

- `isPlaying`
- `currentMs`
- `durationMs`

Options:

- `playLabel`, `pauseLabel`
- `onTogglePlay(nextPlaying, state)`
- `onSeek(nextMs, meta)`

Methods:

- `destroy()`
- `update(nextData, nextOptions?)`
- `setPlaying(isPlaying)`
- `setCurrent(currentMs)`
- `setDuration(durationMs)`
- `getState()`

### `createAudioCallSession(container, incident, options)`

Parent helper for session playback from `incident.media[]`.

Behavior:

- Parses audio roles using `incident.media[].metadata.recording_role` with format:
  - `<role>-<call_id>-<timestamp>`
- Invalid `recording_role` format is skipped.
- Role streams are timestamp-aligned on one timeline.
- Timestamp gaps are treated as silence.
- Per-role mute keeps global timeline playing.
- Timeline seek/rewind works across the full session.
- Uses `incident.call_duration_seconds` (when present) as total timeline duration source of truth.

Role labels:

- `caller` -> `incident.caller.name` fallback `caller`
- `operator` -> `incident.operator.name` fallback `operator`
- unknown role -> role token

Options:

- `autoplay`
- `baseUrl`
- `audiographStyle`
- `roleStyles`
- `sensitivity`
- `showMute`
- `onError(error)`
- `onStateChange(state)`

Methods:

- `destroy()`
- `update(nextIncident, nextOptions?)`
- `play()`
- `pause()`
- `seek(nextMs)`
- `getState()`

## Demo Usage

Open from a local server (Apache/WAMP/Nginx):

- `index.html` -> library home page + demo links
- `demo.team.assignments.html` -> two-column Team Assignments demo
  - left: editable list helper
  - right: read-only list helper
  - right column mirrors left via `setList(items[])`
- `demo.incident.types.html` -> Incident Types demo
  - left: editable list helper
  - right: viewer list helper
  - right column mirrors left via `setList(items[])`
- `demo.ui.html` -> UI utilities playground
  - dialog, drawer, search, tabs, strips, media strip
- `demo.audio.html` -> audio player + stacked role audiographs
  - sample selector for available `sampledata_*.json`
  - graph style selector
  - sensitivity slider
  - theme toggle

Demo pages load:

- `sampledata.json`
- `sampledata_*.json` (in specific demos)
- `boot.team.assignment.status.json`
- `boot.incident.status.json`
- `boot.alert.levels.json`
- `boot.incident.types.json`
- `boot.incident.categories.json`
- `boot.teams.json`
- `boot.resource.types.json`
- `boot.operators.json`

## Minimal Import Example

```html
<script type="module">
  import { incidentTeamsAssignments } from "./js/incident/incident.teams.assignments.js";

  const api = incidentTeamsAssignments(
    document.getElementById("target"),
    incidentData,
    { theme: "dark", lookups }
  );

  // later
  api.update(nextIncidentData, { theme: "light" });
  // cleanup
  api.destroy();
</script>
```

## Detailed Usage Reference

### `incidentBase(container, data, options)`

Purpose:

- Shared incident-level utilities, lookup resolving, debug logging.

Key options:

- `lookups`: object containing boot references.
- `debug`: `true|false`, enables extra console/debug output.

Lookup keys expected:

- `teamStatuses`, `incidentStatuses`, `alertLevels`, `incidentTypes`, `incidentCategories`, `teams`, `resourceTypes`, `operators`

Behavior:

- Missing lookup reference entries are warned in console.
- Returns stable API (`destroy`, `update`) even with invalid data.

Example:

```js
import { incidentBase } from "./js/incident/incident.base.js";

const baseApi = incidentBase(document.createElement("div"), {}, {
  debug: false,
  lookups,
});
```

### `incidentTeamsAssignments(container, data, options)`

Purpose:

- Renders list of team assignment cards.
- Chooses editor/viewer child helper per `options.editable`.

Required options:

- `categories`, `teams`, `noticeAlreadyExist(team)`, `incident_id`, `operator_id`

Optional options:

- `editable` (default `true`)
- `headerText` (default `"Dispatch Details"`)
- `drawerHeaderText` (default `"Select Teams to Dispatch"`)
- `onOpenDrawer()`, `onCloseDrawer()`
- `onAssignTeam(newAssignmentPayload)`

Methods:

- `setList(items[])`
- `getData()`
- `getState()`
- `update(nextData, nextOptions?)`
- `destroy()`

Example:

```js
import { incidentTeamsAssignments } from "./js/incident/incident.teams.assignments.js";

const api = incidentTeamsAssignments(container, incidentPayload, {
  editable: true,
  incident_id: incidentPayload.id,
  operator_id: 2,
  categories,
  teams,
  noticeAlreadyExist(team) {
    console.log("Already assigned:", team.name);
  },
  onAssignTeam(payload) {
    console.log("New assignment payload:", payload);
  },
});
```

### `incidentTeamsAssignmentsEditor(container, data, options)`

Purpose:

- Single assignment editable card with status progression, notes, and allocations.

Required options:

- `incident_id`, `team_id`, `assigned_by_operator_id`
- `confirmStatus(toStatus)`, `confirmCancel(fromStatus, reasonCode, reasonNote)`, `confirmDelete()`

Callbacks:

- `onStatusNext(assignmentId, toStatus)`
- `onCancel(assignmentId, fromStatus, reasonCode, reasonNote)`
- `onDelete(assignmentId)`
- `onContactChange(assignmentId, value)`
- `onNoteAdd(assignmentId, note)`
- `onAllocateChange(assignmentId, resourceTypeId, allocated)`

Notes:

- Confirm callbacks may return `boolean | Promise<boolean>`.
- Missing required options: logs error, renders nothing, returns stable API.

### `incidentTeamsAssignmentsViewer(container, data, options)`

Purpose:

- Single assignment read-only card mirroring editor output.

Required options:

- `incident_id`, `team_id`, `assigned_by_operator_id`

Notes:

- No editor controls rendered (cancel/next status/note input hidden).
- Same stable API (`destroy`, `update`, `getData`).

### `incidentTypes(container, data, options)`

Purpose:

- List helper for incident type details cards.
- `editable=true` uses editor children, `editable=false` uses viewer children.

Required options:

- `categories`, `incidentTypes`
- `removeIncidentType(incidentTypeData)` is required when `editable=true`

Optional options:

- `headerText` (default `"Incident Details"`)
- `drawerHeaderText` (default `"Select Reported Incidents"`)
- `noticeAlreadyExists(incidentType)`
- `onOpenDrawer()`, `onCloseDrawer()`, `onAddIncidentType(payload)`

Methods:

- `setList(items[])`
- `getData()`
- `getState()`
- `update(nextData, nextOptions?)`
- `destroy()`

### `incidentTypesDetailsEditor(container, data, options)`

Purpose:

- Single incident-type editable detail card.

Required options:

- `removeIncidentType(incidentTypeData)`

Optional callbacks:

- `onFieldChange(incidentTypeId, fieldKey, value)`
- `onResourceChange(incidentTypeId, resourceTypeId, quantityNeeded)`

Methods:

- `getData()`
- `validate()`
- `isValid()`
- `update(nextData, nextOptions?)`
- `destroy()`

Field support:

- `text`, `number`, `textarea`, `select`, `multiselect`
- `multiselect` stored as comma-separated string in `detail_entries[].field_value`

### `incidentTypesDetailsViewer(container, data, options)`

Purpose:

- Read-only version of incident-type details card.

Methods:

- `getData()`
- `validate()`
- `isValid()`
- `update(nextData, nextOptions?)`
- `destroy()`

### `createBottomDrawer(options)` (`js/ui/ui.drawer.js`)

Purpose:

- Reusable drawer shell used by list helpers and demo UIs.

Key options:

- `title`
- `closeLabel`
- `animationMs` (default `220`)
- `position`: `"top" | "bottom" | "left" | "right"` (default `"bottom"`)
- class overrides:
  - `backdropClass`, `panelClass`, `headerClass`, `titleClass`, `closeClass`, `bodyClass`
- `onClose()`

Returned refs/methods:

- refs: `panel`, `body`, `header`, `title`, `closeButton`, `backdrop`
- methods: `open(parent?)`, `close()`, `destroy()`, `isOpen()`

Example:

```js
import { createBottomDrawer } from "./js/ui/ui.drawer.js";

const drawer = createBottomDrawer({
  title: "Select Teams",
  position: "right",
  animationMs: 260,
  onClose() {
    console.log("drawer closed");
  },
});
drawer.open(document.body);
```

### `createMediaStrip(container, items, options)` (`js/ui/ui.media.strip.js`)

Purpose:

- Render image/video thumbs and open modal viewer/player.

Key options:

- `layout`: `"scroll" | "wrap"`
- `animationMs` (default `300`)
- `autoplay`, `muted`, `loop`, `showControls`
- `baseUrl`
- `onOpen(item, index)`, `onClose(item, index)`

Methods:

- `update(nextItems, nextOptions?)`
- `openById(id)`
- `openByIndex(index)`
- `getState()`
- `destroy()`

### Audio UI

Use these together for call sessions, or individually for custom layouts.

- `createAudioPlayer`:
  - transport only (play/pause + clock + seek)
- `createAudioGraph`:
  - standalone graph with styles and mute control
- `createAudioCallSession`:
  - parent coordinator with timestamp alignment and role tracks

Recommended integration flow:

1. Normalize incident payload (`incident.media`, caller/operator names, call duration).
2. Mount `createAudioCallSession` for the full experience.
3. Use `onStateChange(state)` to sync external UI if needed.
4. Use `update(nextIncident, nextOptions?)` when refreshed incident data arrives.

## Notes

- This is a scaffold/prototype for testing flow.
- You can extend this with additional incident component helpers later while keeping the same API pattern.
- For maintainers integrating into `hotline.pbb.ph`, follow `docs/hotline-refactor-playbook.md` before refactoring contracts.

## Release Notes

### v0.1.0

- Initial public prototype published
- Incident helper set (`teams.assignments`, `types`, details editor/viewer)
- Shared UI utility layer (`ui.dom`, `ui.events`, `ui.drawer`, `ui.search`, `ui.dialog`, `ui.tabs`, `ui.strips`)
- Demo pages published via GitHub Pages

### v0.2.0

- Added audio UI utility layer:
  - `ui.audio.player`
  - `ui.audio.audiograph` (standalone)
  - `ui.audio.callSession`
- Added `demo.audio.html` with sample selector + live style/sensitivity controls
- Added advanced audiograph styles:
  - `neon`, `particle`, `shockwave`, `tsunami`, `plasma`, `burst`, `heartbeat`
- Added silence-gate + attack/release + freeze-on-pause visualization behavior
- Added overlay-header mode for audiographs to maximize graph area
