# Incident Component Helpers (Prototype)

A lightweight helper-library prototype for rendering incident-related UI components using plain JavaScript and CSS.

## Repository And Live Demo

- GitHub Repository: `https://github.com/jybanez/helpers.pbb.ph`
- Live Demo (GitHub Pages): `https://jybanez.github.io/helpers.pbb.ph`
- Refactor Playbook (for `*.pbb.ph` project integrations): `docs/pbb-refactor-playbook.md`

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
    ui.modal.css
    ui.dialog.css
    ui.toast.css
    ui.select.css
    ui.toggle.css
    ui.datepicker.css
    ui.timeline.css
    ui.timeline.scrubber.css
    ui.command.palette.css
    ui.tree.css
    ui.kanban.css
    ui.stepper.css
    ui.splitter.css
    ui.data.inspector.css
    ui.empty.state.css
    ui.skeleton.css
    ui.file.uploader.css
    ui.tabs.css
    ui.strips.css
    ui.media.strip.css
    ui.audio.css
    ui.grid.css
    ui.tree.grid.css
    ui.progress.css
    ui.virtual.list.css
    ui.scheduler.css
    ui.nav.css
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
    ui.loader.js
    ui.drawer.js
    ui.search.js
    ui.modal.js
    ui.dialog.js
    ui.toast.js
    ui.select.js
    ui.toggle.button.js
    ui.toggle.group.js
    ui.datepicker.js
    ui.timeline.js
    ui.timeline.scrubber.js
    ui.command.palette.js
    ui.tree.js
    ui.kanban.js
    ui.stepper.js
    ui.splitter.js
    ui.data.inspector.js
    ui.empty.state.js
    ui.skeleton.js
    ui.file.uploader.js
    ui.tabs.js
    ui.strips.js
    ui.media.strip.js
    ui.grid.js
    ui.tree.grid.js
    ui.progress.js
    ui.virtual.list.js
    ui.scheduler.js
    ui.menu.js
    ui.dropdown.js
    ui.dropup.js
    ui.navbar.js
    ui.sidebar.js
    ui.breadcrumbs.js
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
demo.grid.html
demo.progress.html
demo.virtual.list.html
demo.scheduler.html
demo.timeline.html
demo.ui.html
demo.audio.html
demo.nav.html
demo.stepper.html
demo.splitter.html
demo.inspector.html
demo.empty.state.html
demo.skeleton.html
samples/
  sampledata.json
  sampledata_*.json
  samplemedia.json
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
- `ui.loader.js`
  - `uiLoader.load(name)` ensures component CSS is injected once
  - `uiLoader.import(name)` injects CSS and dynamically imports the component module
  - `uiLoader.get(name)` resolves the registry export directly
  - `uiLoader.create(name, ...args)` invokes factory-style exports by registry key
  - `uiLoader.loadMany(names)` batch-loads multiple registry entries
  - `uiLoader.loadManyGroup(names)` loads named registry groups like `core-shell`, `forms`, `data`, `media`
  - diagnostics: `getRegistry()`, `getGroups()`, `getLoadedCss()`, `getLoadedModules()`, `getFailedCss()`, `getFailedModules()`, `getDiagnostics()`
- `ui.drawer.js`
  - `createBottomDrawer(options)` reusable bottom drawer shell
- `ui.search.js`
  - `createSearchField(options)` reusable search field with clear + `Esc`-to-clear behavior
- `ui.modal.js`
  - `createModal(options)` general-purpose modal shell (content/header/footer, sizing, focus trap, backdrop/escape close)
  - `createActionModal(options)` modal wrapper with declarative footer actions (`actions[]`)
- `ui.dialog.js`
  - `uiAlert(message, options)` promise-based alert modal
  - `uiConfirm(message, options)` promise-based confirm modal
  - `uiPrompt(message, options)` promise-based prompt modal
- `ui.toast.js`
  - `createToastStack(options)` global toast notifications (info/success/warn/error), optional speech synthesis (`speak`, `speakTypes`, `speakRate`, `speakPitch`, `speakVolume`, `voiceName`, `speakFormatter`, `speakCooldownMs`)
  - speech is opt-in (`speak: false` by default); can be overridden per-toast via `show(message, { speak: true | false })`
  - when speech is enabled, auto-dismiss countdown can start after speech ends via `waitForSpeechBeforeDismiss` (default `true`)
  - `getVoices()` returns available speech voices so UI can render a voice selector; per-toast `voiceName` override is supported in `show(message, { voiceName })`
- `ui.select.js`
  - `createSelect(container, items, options)` single/multi select with optional search and keyboard navigation (`ArrowUp/ArrowDown/Home/End/Enter/Escape`, optional `selectOnTab`)
- `ui.toggle.button.js`
  - `createToggleButton(container, options)` reusable binary toggle button with `aria-pressed`, tones, variants, icon/label support, and `setPressed/getPressed`
- `ui.toggle.group.js`
  - `createToggleGroup(container, options)` grouped toggle composition with `multi` or single-select behavior, `getValue()`, `setItems()`, and `updateItem()`
- `ui.datepicker.js`
  - `createDatepicker(container, options)` single/range date picker with optional time controls, min/max bounds, disabled-date callback, and `setValue/getValue`
- `ui.timeline.js`
  - `createTimeline(container, items, options)` event timeline with `vertical`/`horizontal` orientation, optional date grouping, and item/action click hooks
- `ui.timeline.scrubber.js`
  - `createTimelineScrubber(container, options)` timeline scrubber/playhead with optional range handles and zoom levels
- `ui.command.palette.js`
  - `createCommandPalette(options)` global command launcher with keyboard shortcut, search, and action execution
- `ui.tree.js`
  - `createTree(container, data, options)` expandable/selectable tree view with optional checkboxes
- `ui.kanban.js`
  - `createKanban(container, lanes, options)` lane-based board with draggable cards and move callbacks
- `ui.stepper.js`
  - `createStepper(container, steps, options)` step indicator/navigation component for multi-step workflows
- `ui.splitter.js`
  - `createSplitter(container, options)` resizable two-pane layout primitive (horizontal/vertical)
- `ui.data.inspector.js`
  - `createDataInspector(container, data, options)` expandable object/JSON inspector with copy-path actions
- `ui.empty.state.js`
  - `createEmptyState(container, data, options)` standardized empty/error/no-result presentation block
- `ui.skeleton.js`
  - `createSkeleton(container, data, options)` loading placeholders (`lines`, `card`, `grid`)
- `ui.file.uploader.js`
  - `createFileUploader(container, options)` drag/drop file queue with validation, progress, retry/cancel/remove, and adapter upload hook
- `ui.tabs.js`
  - `createTabs(container, options)` accessible tablist + panel component
- `ui.strips.js`
  - `createStrip(container, items, options)` selectable pill-strip component (single/multi)
- `ui.media.strip.js`
  - `createMediaStrip(container, items, options)` media thumbnails strip (image/video) with modal viewer/player + in-modal prev/next navigation
  - options include `layout: "scroll" | "wrap"` and `animationMs` (default `300`)
- `ui.grid.js`
  - `createGrid(container, rows, options)` data grid/table with local/remote modes, optional sort/search/pagination, and optional row virtualization
- `ui.tree.grid.js`
  - `createTreeGrid(container, options)` tree grid with first-column hierarchy, aligned tabular columns, expand/collapse controls, and column resize
- `ui.progress.js`
  - `createProgress(container, data, options)` progress indicator with multiple styles (linear, segmented, steps, radial, ring, etc.)
- `ui.virtual.list.js`
  - `createVirtualList(container, items, options)` virtualized list primitive for very large row sets
- `ui.scheduler.js`
  - `createScheduler(container, data, options)` month/week scheduler primitive with slot/event interactions
- `ui.menu.js`
  - `createMenu(triggerEl, items, options)` anchored popover menu primitive
  - item icon contract: `icon` (SVG/HTML string), `iconPosition: "start" | "end"`, `iconOnly: boolean`
- `ui.dropdown.js`
  - `createDropdown(triggerEl, items, options)` preset wrapper for bottom placement
  - uses `ui.menu` item icon contract
- `ui.dropup.js`
  - `createDropup(triggerEl, items, options)` preset wrapper for top placement
  - uses `ui.menu` item icon contract
- `ui.navbar.js`
  - `createNavbar(container, data, options)` top navigation bar
  - item/action icon contract: `icon` (SVG/HTML string), `iconPosition: "start" | "end"`, `iconOnly: boolean`
- `ui.sidebar.js`
  - `createSidebar(container, data, options)` side navigation panel
  - item icon contract: `icon` (SVG/HTML string), `iconPosition: "start" | "end"`, `iconOnly: boolean`
- `ui.breadcrumbs.js`
  - `createBreadcrumbs(container, data, options)` breadcrumb navigation
  - crumb icon contract: `icon` (SVG/HTML string), `iconPosition: "start" | "end"`, `iconOnly: boolean`
- `ui.audio.player.js`
  - `createAudioPlayer(container, data, options)` reusable transport UI (play/pause, time, seek)
- `ui.audio.audiograph.js`
  - `createAudioGraph(container, data, options)` standalone role audiograph renderer with multiple styles
- `ui.audio.callSession.js`
  - `createAudioCallSession(container, incident, options)` parent orchestrator for timeline playback + stacked role audiographs

Reusable UI styles live under `css/ui`:

- `ui.tokens.css` shared spacing/color/typography tokens
- `ui.components.css` shared primitives (`.ui-button`, `.ui-input`, `.ui-panel`, `.ui-surface`, `.ui-field`, `.ui-label`, `.ui-badge`, `.ui-eyebrow`, `.ui-shell-header`, `.ui-shell-search`)
- `ui.modal.css` shared modal shell styles
- `ui.dialog.css` dialog-specific styles on top of modal shell
- `ui.toast.css` toast notification styles
- `ui.select.css` select/dropdown styles
- `ui.toggle.css` toggle button + toggle group styles
- `ui.datepicker.css` datepicker styles
- `ui.timeline.css` timeline styles
- `ui.timeline.scrubber.css` timeline scrubber styles
- `ui.command.palette.css` command palette styles
- `ui.tree.css` tree view styles
- `ui.kanban.css` kanban board styles
- `ui.stepper.css` stepper styles
- `ui.splitter.css` splitter/pane resize styles
- `ui.data.inspector.css` data inspector styles
- `ui.empty.state.css` empty-state styles
- `ui.skeleton.css` skeleton loading styles
- `ui.file.uploader.css` file uploader styles
- `ui.tabs.css` tab UI styles
- `ui.strips.css` strip/chip selector styles
- `ui.media.strip.css` media strip, thumbnail, and media viewer styles
- `ui.audio.css` audio player, audiograph, and call session styles
- `ui.grid.css` data-grid/table styles
- `ui.tree.grid.css` tree-grid styles
- `ui.progress.css` progress styles
- `ui.virtual.list.css` virtual-list styles
- `ui.scheduler.css` scheduler styles
- `ui.nav.css` navigation/menu styles

Current usage:

- `incident.types` now uses `createEventBag` and `createBottomDrawer`.
- `incident.teams.assignments` now uses `createEventBag` and `createBottomDrawer`.
- `incident.types` and `incident.teams.assignments` now share `createSearchField` for drawer search UX.
- Editor/viewer helpers now apply shared `ui-*` primitives (`ui-title`, `ui-input`, `ui-button`) alongside existing `hh-*` classes for non-breaking style migration.

## Component Loading

Application integrations should use the registry loader.

- `uiLoader` is the public app-loading contract.
- App code should call components by registry key.
- Direct path imports are for internal library work only and should be avoided in consuming apps.

Recommended keys:

- UI utilities:
  - `ui.modal`
  - `ui.dialog`
  - `ui.toast`
  - `ui.grid`
  - `ui.timeline`
  - `ui.file.uploader`
- Incident helpers:
  - `incident.base`
  - `incident.teams.assignments`
  - `incident.teams.assignments.editor`
  - `incident.teams.assignments.viewer`
  - `incident.types`
  - `incident.types.details.editor`
  - `incident.types.details.viewer`

Loader example:

```js
import { uiLoader } from "./js/ui/ui.loader.js";

const modal = await uiLoader.create("ui.modal", {
  title: "Registry Loaded Modal",
  content: "CSS and JS were loaded through uiLoader.",
});

modal.open();
```

Batch loading example:

```js
import { uiLoader } from "./js/ui/ui.loader.js";

await uiLoader.loadMany([
  "ui.modal",
  "ui.dialog",
  "ui.toast",
]);
```

Group loading example:

```js
import { uiLoader } from "./js/ui/ui.loader.js";

await uiLoader.loadManyGroup(["core-shell", "forms"]);
```

Diagnostics example:

```js
import { uiLoader } from "./js/ui/ui.loader.js";

uiLoader.setDebug(true);
console.log(uiLoader.getDiagnostics());
```

Registry contract test:

```sh
node tests/registry.contract.mjs
```

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

### Navigation/Menu Utilities

#### `createMenu(triggerEl, items, options)`

Purpose:

- Reusable anchored popover menu used by dropdown/dropup wrappers.

Menu item icon contract:

- `icon`: SVG/HTML string
- `iconPosition`: `"start"` or `"end"` (optional, per-item override)
- `iconOnly`: `true|false` (optional, per-item override)

Example item:

```js
{
  id: "archive",
  label: "Archive",
  icon: '<svg viewBox="0 0 24 24"><path d="M20 6H4v14h16V6Zm-2 4v2H6v-2h12ZM21 2H3v2h18V2Z"/></svg>',
  iconPosition: "start",
  iconOnly: false
}
```

Useful options:

- `placement`: `"bottom-start" | "bottom-end" | "top-start" | "top-end"`
- `align`: `"left" | "right"` (overrides horizontal side while keeping top/bottom from placement)
- `offset`: number
- `closeOnSelect`: boolean
- `closeOnOutsideClick`: boolean
- `closeOnEscape`: boolean
- `matchTriggerWidth`: boolean
- `onSelect(item, meta)`
- `onOpenChange(open)`

Methods:

- `open()`
- `close()`
- `toggle()`
- `update(items?, options?)`
- `destroy()`
- `getState()`

#### `createDropdown(triggerEl, items, options)`

- Wrapper over `createMenu` with default `placement: "bottom-start"`.
- Supports the same item icon contract and options/methods.
- Supports `align: "left" | "right"` shortcut:
  - `left` -> `bottom-start`
  - `right` -> `bottom-end`

#### `createDropup(triggerEl, items, options)`

- Wrapper over `createMenu` with default `placement: "top-start"`.
- Supports the same item icon contract and options/methods.
- Supports `align: "left" | "right"` shortcut:
  - `left` -> `top-start`
  - `right` -> `top-end`

#### `createNavbar(container, data, options)`

- Top navigation with `items[]` and `actions[]`.
- `items[]` and `actions[]` support the same icon contract (`icon`, `iconPosition`, `iconOnly`).
- `actions[]` can render dropdown menus by providing:
  - `menuItems: []`
  - optional `menuOptions: {}`
- menu callbacks:
  - `onActionMenuSelect(action, item, meta)`
  - `onActionMenuOpenChange(action, open)`
- Global defaults:
  - `iconPosition` (default `"start"`)
  - `iconOnly` (default `false`)

#### `createSidebar(container, data, options)`

- Side navigation with `items[]`.
- `items[]` support the same icon contract (`icon`, `iconPosition`, `iconOnly`).
- Global defaults:
  - `iconPosition` (default `"start"`)
  - `iconOnly` (default `false`)

#### `createBreadcrumbs(container, data, options)`

- Breadcrumb trail with optional stateful helpers (`setItems`, `addCrumb`, `getItems`, `reset`).
- `items[]` support the same icon contract (`icon`, `iconPosition`, `iconOnly`).
- Global defaults:
  - `iconPosition` (default `"start"`)
  - `iconOnly` (default `false`)

### Navigation/Menu Quickstart

Copy-paste snippets (all are ES module usage):

#### 1) `createMenu`

```js
import { createMenu } from "./js/ui/ui.menu.js";

const trigger = document.getElementById("menuBtn");
const menu = createMenu(trigger, [
  { id: "new", label: "New", icon: "<svg viewBox='0 0 24 24'><path d='M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2h6Z'/></svg>" },
  { id: "delete", label: "Delete", danger: true },
], {
  placement: "bottom-start",
  onSelect(item) { console.log("menu.select", item); },
});

trigger.addEventListener("click", () => menu.toggle());
```

#### 2) `createDropdown`

```js
import { createDropdown } from "./js/ui/ui.dropdown.js";

const dd = createDropdown(document.getElementById("dropdownBtn"), [
  { id: "caller", label: "Caller View" },
  { id: "operator", label: "Operator View" },
], {
  onSelect(item) { console.log("dropdown.select", item.id); },
});
```

#### 3) `createDropup`

```js
import { createDropup } from "./js/ui/ui.dropup.js";

const du = createDropup(document.getElementById("dropupBtn"), [
  { id: "today", label: "Today" },
  { id: "week", label: "This Week" },
], {
  onSelect(item) { console.log("dropup.select", item.id); },
});
```

#### 4) `createNavbar`

```js
import { createNavbar } from "./js/ui/ui.navbar.js";

createNavbar(document.getElementById("navbarHost"), {}, {
  brandText: "Hotline UI",
  activeId: "incidents",
  items: [
    { id: "dashboard", label: "Dashboard" },
    { id: "incidents", label: "Incidents" },
  ],
  actions: [
    { id: "help", label: "Help", icon: "<svg viewBox='0 0 24 24'><path d='M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z'/></svg>" },
  ],
  onNavigate(item) { console.log("navbar.navigate", item); },
  onAction(action) { console.log("navbar.action", action); },
});
```

#### 5) `createSidebar`

```js
import { createSidebar } from "./js/ui/ui.sidebar.js";

createSidebar(document.getElementById("sidebarHost"), {}, {
  title: "Sections",
  activeId: "calls",
  items: [
    { id: "calls", label: "Calls" },
    { id: "dispatch", label: "Dispatch" },
  ],
  onNavigate(item) { console.log("sidebar.navigate", item); },
  onToggleCollapsed(collapsed) { console.log("sidebar.collapsed", collapsed); },
});
```

#### 6) `createBreadcrumbs`

```js
import { createBreadcrumbs } from "./js/ui/ui.breadcrumbs.js";

const bc = createBreadcrumbs(document.getElementById("crumbHost"), {}, {
  autoTruncateOnNavigate: true,
  items: [
    { id: "home", label: "Home" },
    { id: "incidents", label: "Incidents" },
    { id: "details", label: "Details" },
  ],
  onNavigate(item, index, nextItems) {
    console.log("breadcrumbs.navigate", item, index, nextItems);
  },
});

bc.addCrumb({ id: "photos", label: "Photos" });
console.log(bc.getItems());
```

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
- `demo.grid.html` -> dedicated grid demo
  - local grid (client search/sort/pagination)
  - remote grid (query-driven updates)
  - large virtualized grid with fixed-height scrolling
- `demo.progress.html` -> progress styles demo
  - live configurable progress
  - style gallery for all rendering variants
- `demo.virtual.list.html` -> dedicated virtual-list playground
  - large row-set windowing
  - `scrollToIndex(...)` controls
  - visible-range callback logging
- `demo.scheduler.html` -> dedicated scheduler/calendar playground
  - month/week views
  - slot and event callback interactions
- `demo.ui.html` -> UI utilities playground
  - modal, dialog, toast, select, datepicker, command palette, tree, kanban, file uploader, drawer, search, tabs, strips, media strip
- `demo.timeline.html` -> dedicated timeline playground
  - vertical grouped timeline
  - horizontal timeline
  - timeline scrubber with seek/range/zoom
  - scrubber updates active timeline item (highlight + horizontal auto-scroll)
- `demo.audio.html` -> audio player + stacked role audiographs
  - sample selector for available `sampledata_*.json`
  - graph style selector
  - sensitivity slider
  - theme toggle
- `demo.nav.html` -> navigation/menu utilities playground
  - navbar, sidebar, breadcrumbs, dropdown, dropup
- `demo.stepper.html` -> dedicated stepper playground
  - workflow progression states
  - orientation toggle + step navigation
- `demo.splitter.html` -> dedicated splitter playground
  - horizontal and vertical pane resizing
  - pointer + keyboard resize behavior
- `demo.inspector.html` -> dedicated data inspector playground
  - nested object/array inspection
  - copy-path interactions
- `demo.empty.state.html` -> dedicated empty-state playground
  - action callbacks and icon/title/description variants
- `demo.skeleton.html` -> dedicated skeleton playground
  - lines/card/grid variants
  - animation toggle

Demo pages load:

- `samples/sampledata.json`
- `samples/sampledata_*.json` (in specific demos)
- `samples/samplemedia.json` (for media-strip demo)
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

### `createModal(options)` (`js/ui/ui.modal.js`)

Purpose:

- General-purpose modal shell for custom content, forms, media, and reusable overlays.

Key options:

- `title`
- `content` (`string | HTMLElement | () => HTMLElement`)
- `footer` (`string | HTMLElement | () => HTMLElement`)
- `size`: `"sm" | "md" | "lg" | "xl" | "full"`
- `position`: `"center" | "top"`
- `showHeader`, `showCloseButton`
- `closeOnBackdrop`, `closeOnEscape`
- `trapFocus`, `lockScroll`
- `initialFocus` (`selector | HTMLElement | (panel) => HTMLElement`)
- `className`
- `onOpen(ctx)`, `onBeforeClose(meta)`, `onClose(meta)`

Methods:

- `open(content?, nextOptions?)`
- `close(meta?)`
- `update(nextOptions?)`
- `setContent(content)`
- `setFooter(footer)`
- `setTitle(title)`
- `destroy()`
- `getState()`

Example:

```js
import { createModal } from "./js/ui/ui.modal.js";

const modal = createModal({
  title: "Reusable Modal",
  size: "md",
  content: "Hello from modal body",
});

modal.open();
// later
modal.close({ reason: "done" });
```

### `createActionModal(options)` (`js/ui/ui.modal.js`)

Purpose:

- Faster modal setup when footer buttons are known up front.

Key options:

- all `createModal(...)` options
- `actions`: array of button actions
  - `id`
  - `label` (required)
  - `variant`: `"default" | "primary" | "danger" | "ghost"`
  - `closeOnClick` (default `true`)
  - `disabled`
  - `autoFocus`
  - `onClick({ action, modal, event })` (can return `false` to prevent close)

Methods:

- all `createModal(...)` methods
- `setActions(actions[])`

Example:

```js
import { createActionModal } from "./js/ui/ui.modal.js";

const modal = createActionModal({
  title: "Delete Record",
  content: "This action cannot be undone.",
  actions: [
    { id: "cancel", label: "Cancel", variant: "ghost" },
    {
      id: "delete",
      label: "Delete",
      variant: "danger",
      autoFocus: true,
      async onClick() {
        await apiDeleteRecord();
      },
    },
  ],
});

modal.open();
```

### `createGrid(container, rows, options)` (`js/ui/ui.grid.js`)

Purpose:

- Reusable data grid/table for local and remote data flows.

Modes:

- `mode: "local"`: grid applies search/sort/pagination in component.
- `mode: "remote"`: grid emits query changes; parent fetches and updates rows.

Core options:

- `columns`: array of column definitions
  - `key`, `label`
  - optional: `width`, `align`, `sortable`
  - optional render hooks: `format(value, row)`, `renderCell({ row, value, key, column })`
- `rowKey`: string key or function `(row, index) => key`
- `selectable`: `"none" | "single" | "multi"`
- `selectedKeys`: initial selected row keys
- capability toggles:
  - `enableSort`
  - `enableSearch`
  - `enablePagination`
  - `enableColumnResize`
  - `enableVirtualization`
- column resize options:
  - `minColumnWidth` (default `72`)
  - `columnWidths` (object map by `column.key`, e.g. `{ status: 160 }`)
- content wrapping options:
  - `wrapCellContent` (default `true`) global cell wrapping behavior
  - per-column override: `column.wrap` (`true|false`)
- search options:
  - `search`, `searchPlaceholder`
- paging options:
  - `page`, `pageSize`, `pageSizeOptions`, `totalRows` (remote)
- virtualization options:
  - `virtualRowHeight` (default `40`)
  - `virtualOverscan` (default `8`)
  - `virtualThreshold` (default `80`)
- state display:
  - `loading`, `errorText`, `emptyText`

Events:

- `onRowClick(row, meta)`
- `onSelectionChange(selectedRows, selectedKeys)`
- `onQueryChange(query)` (remote mode)
- `onColumnResize({ key, width, columnWidths })`

Methods:

- `destroy()`
- `update(nextRows, nextOptions?)`
- `setRows(rows[])`
- `setQuery(query)`
- `getQuery()`
- `getSelectedRows()`
- `clearSelection()`
- `getState()`

Example (remote mode with optional features enabled):

```js
import { createGrid } from "./js/ui/ui.grid.js";

const grid = createGrid(container, [], {
  mode: "remote",
  columns,
  enableSort: true,
  enableSearch: true,
  enablePagination: true,
  page: 1,
  pageSize: 20,
  totalRows: 0,
  onQueryChange(query) {
    // fetch from API using query, then:
    // grid.setRows(apiRows);
    // grid.update(apiRows, { totalRows: apiTotal });
  },
});
```

### `createProgress(container, data, options)` (`js/ui/ui.progress.js`)

Purpose:

- General-purpose progress indicator with multiple rendering styles.

Data:

- `value`
- `label`
- `currentStep` (for `steps`)
- `totalSteps` (for `steps`)

Options:

- `style`: `linear | striped | gradient | segmented | steps | radial | ring | indeterminate`
- `size`: `sm | md | lg`
- `showLabel`, `showPercent`
- `animate`, `rounded`, `glow`
- `indeterminate`
- `min`, `max`
- `segments` (for `segmented`)
- `totalSteps` (default for `steps`)
- `color`, `trackColor`
- `ariaLabel`, `className`

Methods:

- `destroy()`
- `update(nextData, nextOptions?)`
- `setValue(value)`
- `getState()`

Example:

```js
import { createProgress } from "./js/ui/ui.progress.js";

const progress = createProgress(container, {
  label: "Upload",
  value: 42,
}, {
  style: "gradient",
  showPercent: true,
  animate: true,
});

progress.setValue(70);
```

### `createVirtualList(container, items, options)` (`js/ui/ui.virtual.list.js`)

Purpose:

- Render large lists with stable performance via viewport virtualization/windowing.

Options:

- `height`
- `rowHeight`
- `overscan`
- `emptyText`, `className`
- `renderItem(item, index)` returns `HTMLElement | string`
- `onRangeChange({ start, end }, state)`

Methods:

- `update(nextItems, nextOptions?)`
- `setItems(items)`
- `scrollToIndex(index, behavior?)`
- `getState()`
- `destroy()`

### `createScheduler(container, data, options)` (`js/ui/ui.scheduler.js`)

Purpose:

- Render reusable scheduler/calendar primitives with month/week views.

Data shape:

- `date` (current focus date)
- `events[]`: `{ id, title, start, end?, color? }`

Options:

- `view`: `month | week`
- `locale`
- `weekStartsOn` (`0..6`)
- `events[]` (default source if not passed in `data`)
- `onViewChange(view, state)`
- `onDateChange(date, state)`
- `onSlotClick({ date, view }, state)`
- `onEventClick(event, state)`

Methods:

- `update(nextData, nextOptions?)`
- `setView(view)`
- `setDate(date)`
- `getState()`
- `destroy()`

### `createDatepicker(container, options)` (`js/ui/ui.datepicker.js`)

Purpose:

- Render a reusable date picker for single or range selection with optional time inputs.

Options:

- `mode`: `single | range`
- `value`: single date (`Date|string|null`) or range (`{ start, end } | [start, end]`)
- `showTime`: `boolean`
- `closeOnSelect`: `boolean`
- `weekStartsOn`: `0-6`
- `yearRangePast`, `yearRangeFuture`: year jump range around current view year
- `min`, `max`: date bounds
- `disabledDates(date)`: callback to disable custom dates
- `locale`, `placeholder`, `className`
- `onChange(value, state)`

Methods:

- `update(nextOptions?)`
- `setValue(nextValue)`
- `getValue()`
- `getState()`
- `destroy()`

Example:

```js
import { createDatepicker } from "./js/ui/ui.datepicker.js";

const single = createDatepicker(container, {
  mode: "single",
  placeholder: "Pick date",
  onChange(value) {
    console.log("single", value);
  },
});

const range = createDatepicker(rangeContainer, {
  mode: "range",
  showTime: true,
  closeOnSelect: false,
});
```

### `createTimeline(container, items, options)` (`js/ui/ui.timeline.js`)

Purpose:

- Render incident/activity events in vertical log mode or horizontal milestone mode.

Item shape (recommended):

- `id`, `timestamp`, `title`
- optional `subtitle`, `description`, `status`
- `status` recommended values: `assigned | requested | accepted | en_route | on_scene | completed | cancelled`
- optional `meta[]` tag strings
- optional `actions[]` with `{ id, label, className? }`

Options:

- `orientation`: `vertical | horizontal`
- `density`: `compact | comfortable`
- `groupByDate`: `boolean` (vertical only)
- `showConnector`: `boolean`
- `linkedRange`: `{ startMs, endMs, anchorMs? } | null`
  - filters visible events by relative timestamp range
  - `anchorMs` is optional; when omitted, timeline uses the earliest event timestamp as anchor
- `includeUndatedInRange`: `boolean`
- `emptyText`, `className`
- `locale`, `timeZone`
- `onItemClick(item)`
- `onActionClick(action, item)`

Methods:

- `update(nextItems, nextOptions?)`
- `append(items)`
- `prepend(items)`
- `setLinkedRange(range|null)`
- `destroy()`
- `getState()`

`getState()` returns both:
- `items` (full normalized timeline list)
- `visibleItems` (range-filtered list after `linkedRange`)

Example:

```js
import { createTimeline } from "./js/ui/ui.timeline.js";

const timeline = createTimeline(container, events, {
  orientation: "vertical",
  groupByDate: true,
  onItemClick(item) {
    console.log("timeline item", item.id);
  },
});
```

### `createTimelineScrubber(container, options)` (`js/ui/ui.timeline.scrubber.js`)

Purpose:

- Add an interactive timeline seek bar with optional range selection and zoom.
- Time labels auto-scale by duration:
  - `< 1h` -> `mm:ss`
  - `>= 1h` -> `hh:mm:ss`
  - `>= 1 day` -> `dd:hh:mm:ss`

Options:

- `durationMs`, `valueMs`
- `enableRange`
- `range`: `{ startMs, endMs }`
- `zoom`, `zoomLevels`
- `showZoomControls`
- `seekStepMs` (keyboard seek step, default `1000`)
- `seekStepMsFast` (Shift+keyboard seek step, default `10000`)
- `preventPageScrollOnInteract` (default `true`)
- `onSeek(valueMs, state)`
- `onRangeChange({ startMs, endMs }, state)`
- `onZoomChange(zoom, state)`

Methods:

- `update(nextOptions?)`
- `setTime(ms)`
- `setRange(startMs, endMs)`
- `setDuration(ms)`
- `setZoom(zoom)`
- `getValue()`
- `getState()`
- `destroy()`

Example:

```js
import { createTimelineScrubber } from "./js/ui/ui.timeline.scrubber.js";

const scrubber = createTimelineScrubber(container, {
  durationMs: 600000,
  valueMs: 65000,
  enableRange: true,
  range: { startMs: 40000, endMs: 210000 },
  zoomLevels: [1, 2, 5],
  onSeek(valueMs) {
    console.log("seek", valueMs);
  },
});
```

### `createCommandPalette(options)` (`js/ui/ui.command.palette.js`)

Purpose:

- Global quick-action launcher (`Ctrl/Cmd + K`) with search and keyboard navigation.
- Supports static + async command sources with grouped/pinned/recent views.

Options:

- `commands[]`: `{ id, label, section?, keywords?, shortcut?, icon?, disabled?, run? }`
- `providers[]`: async/static providers `(ctx) => commands[] | Promise<commands[]>`
  - `ctx = { query, state, open }`
- `providerDebounceMs`
- `title`, `placeholder`, `emptyText`
- `loadingText`
- `shortcut` (default `"k"`), `metaKey`, `ctrlKey`
- `groupBySection` (default `true`)
- `showPinned`, `showRecent`
- `pinnedCommandIds[]`
- `recentCommandIds[]`, `maxRecent`
- `historyStorageKey` (optional localStorage key)
- `onRun(command)`
- `onHistoryChange(recentCommandIds, state)`

Methods:

- `open()`, `close()`
- `update(nextOptions?)`
- `setQuery(text)`
- `getState()`
- `destroy()`

### `createTree(container, data, options)` (`js/ui/ui.tree.js`)

Purpose:

- Expandable/selectable hierarchical view with optional checkboxes.
- Supports lazy async child loading and optional virtualization for very large node sets.

Options:

- `expandAll`, `selectable`, `checkable`, `className`
- `lazyLoadChildren(node, state)` async loader for nodes with `hasChildren: true`
- `onLoadChildren(node, children, state)`
- virtualization:
  - `enableVirtualization`
  - `virtualHeight`
  - `virtualRowHeight`
  - `virtualOverscan`
- `onToggle(node, isExpanded)`
- `onSelect(node)`
- `onCheck(node, checked, checkedIds)`

Methods:

- `update(nextData, nextOptions?)`
- `expandAll()`
- `collapseAll()`
- `setSelected(nodeId)`
- `getState()`
- `destroy()`

`getState()` includes:
- `visibleRows[]` (`{ id, level }`) for current expanded/filter view

### `createKanban(container, lanes, options)` (`js/ui/ui.kanban.js`)

Purpose:

- Lane/card board for dispatch/incident workflow with drag-and-drop card moves.

Data shape:

- `lanes[]`: `{ id, title, cards[] }`
- `cards[]`: `{ id, title, meta? }`

Options:

- `draggable`, `className`
- `keyboardMoves` (default `true`)
- key mapping options:
  - `laneIdKey`, `laneTitleKey`
  - `cardIdKey`, `cardTitleKey`, `cardMetaKey`
- `wipLimits`: `{ [laneId]: number }`
- `validateMove({ card, fromLaneId, toLaneId, fromIndex, toIndex, lanes })`
  - return `false` or `{ ok:false, reason }` to block move
- `onCardClick(card, laneId)`
- `onCardMove({ card, fromLaneId, toLaneId, fromIndex, toIndex, lanes })`
- `onMoveRejected({ reason, card, fromLaneId, toLaneId, fromIndex, toIndex })`

Methods:

- `update(nextLanes, nextOptions?)`
- `moveCard(cardId, fromLaneId, toLaneId, toIndex?)`
- `getState()`
- `destroy()`

### `createStepper(container, steps, options)` (`js/ui/ui.stepper.js`)

Purpose:

- Render workflow steps with current/completed/future states.

Options:

- `orientation`: `horizontal | vertical`
- `clickable`: `boolean`
- `currentStepId`
- `onStepClick(step, index, state)`

Methods:

- `update(nextSteps, nextOptions?)`
- `setCurrentStep(stepId)`
- `getState()`
- `destroy()`

### `createSplitter(container, options)` (`js/ui/ui.splitter.js`)

Purpose:

- Provide a reusable two-pane resizable layout primitive.

Options:

- `orientation`: `horizontal | vertical`
- `initialRatio`, `minRatio`, `maxRatio`
- `paneA`, `paneB` (`HTMLElement | string | function`)
- `onResize(ratio, state)`

Methods:

- `update(nextOptions?)`
- `setRatio(ratio)`
- `getState()`
- `destroy()`

### `createDataInspector(container, data, options)` (`js/ui/ui.data.inspector.js`)

Purpose:

- Inspect nested objects/arrays with expand/collapse and path copy.

Options:

- `expandDepth`
- `emptyText`, `className`
- `onCopyPath(path, value)`

Methods:

- `update(nextData, nextOptions?)`
- `getState()`
- `destroy()`

### `createEmptyState(container, data, options)` (`js/ui/ui.empty.state.js`)

Purpose:

- Standardize empty/no-results/error views with optional actions.

Data/Options:

- `title`, `description`, `iconHtml`
- `actions[]`: `{ id, label, className? }`
- `onActionClick(action, state)`

Methods:

- `update(nextData, nextOptions?)`
- `getState()`
- `destroy()`

### `createSkeleton(container, data, options)` (`js/ui/ui.skeleton.js`)

Purpose:

- Render loading placeholders while data is being fetched/rendered.

Options:

- `variant`: `lines | card | grid`
- `animated`
- `lines`, `rows`, `columns`

Methods:

- `update(nextData, nextOptions?)`
- `getState()`
- `destroy()`

### `createFileUploader(container, options)` (`js/ui/ui.file.uploader.js`)

Purpose:

- Handle drag/drop or browse file intake with queue state, validation, and upload lifecycle hooks.

Options:

- input/queue:
  - `accept`, `multiple`, `maxFiles`
  - `maxFileSize`
  - `allowedTypes` (`["image/", ".pdf", "video/mp4"]`)
- behavior:
  - `autoUpload`
  - `smoothProgress` (default `true`)
  - `progressAnimationMs` (default `220`)
  - `useChunkUpload` (default `false`)
  - `chunkSize` (default `1MB`)
  - `uploadKeyPrefix` (default `"upload"`)
  - UI text options (`dropText`, `emptyText`, `startText`, `clearText`, `browseText`)
- hooks:
  - `onUpload(item, controls)` async upload adapter
  - chunk/resume hooks:
    - `onGetResumeState({ item, uploadKey, state }) -> { uploadedBytes? }`
    - `onCreateUploadSession({ item, uploadKey, state, signal })`
    - `onUploadChunk(payload)` where payload includes:
      - `item`, `uploadKey`, `session`
      - `chunkIndex`, `totalChunks`
      - `chunkStart`, `chunkEnd`, `chunkSize`, `chunk`
      - `uploadedBytes`, `totalBytes`, `signal`
      - `reportChunkProgress(ratio)`
    - `onPersistResumeState({ item, uploadKey, uploadedBytes, totalBytes, chunkIndex, totalChunks, session })`
    - `onFinalizeUpload({ item, uploadKey, session, totalBytes, totalChunks, state, signal })`
    - `onClearResumeState({ item, uploadKey, session })`
  - `onChange(state)`
  - `onError(error, item, state)`
  - `onComplete(state)`

Methods:

- `addFiles(files)`
- `start()`
- `clear()`
- `update(nextOptions?)`
- `remove(itemId)`
- `retry(itemId)`
- `getState()`
- `destroy()`

Note:

- `ui.file.uploader` composes `ui.progress` per queued file row for consistent progress visuals and behavior.

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
- For maintainers integrating into any `*.pbb.ph` project, follow `docs/pbb-refactor-playbook.md` before refactoring contracts.

## Roadmap

### Current Stable Line: `v0.16.x`

- Latest documented release: `v0.16.4`
- All library modules now follow monotonic SemVer in release notes:
  - breaking API changes -> `major`
  - new components/features -> `minor`
  - fixes/docs/internal cleanup -> `patch`

### Next Planned Line: `v0.17.x` (Unreleased)

- Dedicated accessibility hardening pass across all UI utilities
- Additional data-entry primitives (mask/format helpers, richer validation wrappers)
- Performance refinements for heavy demo pages (timeline/grid/audio)

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

### v0.3.0

- Added `ui.grid` component with local/remote modes
- Added optional sorting/search/pagination capabilities (especially for remote data)
- Added row selection (`single`/`multi`) and query/state APIs
- Added grid demo section in `demo.ui.html`

### v0.4.0

- Added navigation/menu utility layer:
  - `ui.menu`, `ui.dropdown`, `ui.dropup`
  - `ui.navbar`, `ui.sidebar`, `ui.breadcrumbs`
- Added `ui.nav.css` styles
- Added `demo.nav.html` for interactive navigation demos

### v0.5.0

- Expanded navigation/menu capabilities:
  - unified icon contract across nav components (`icon`, `iconPosition`, `iconOnly`)
  - breadcrumb built-in state helpers (`setItems`, `addCrumb`, `getItems`, `reset`)
  - navbar action menus (`menuItems`, `menuOptions`) with callbacks
  - menu alignment support (`align: left|right`) and placement refinements
- Improved navigation UX:
  - animated sidebar collapse/expand
  - animated dropdown/dropup show/hide with deferred unmount
  - sidebar collapsed icon-only item rendering
- Updated `demo.nav.html`:
  - sidebar-responsive layout collapse behavior
  - breadcrumb add/reset/truncate wiring via library API

### v0.6.0

- Grid improvements:
  - added optional row virtualization:
    - `enableVirtualization`
    - `virtualRowHeight`
    - `virtualOverscan`
    - `virtualThreshold`
  - large-list rendering stability fixes (virtual windowing + row-event cleanup)
  - retained column-resize support in virtualized mode
- Demo restructuring:
  - added dedicated `demo.grid.html` with:
    - local grid
    - remote grid
    - large virtualized fixed-height grid
  - removed grid section from `demo.ui.html`

### v0.7.0

- Added general-purpose modal foundation:
  - `ui.modal.js`
  - `ui.modal.css`
  - reusable modal API with focus trap, escape/backdrop close, sizing, lifecycle hooks
- Refactored dialog helpers to use modal foundation:
  - `uiAlert`
  - `uiConfirm`
  - `uiPrompt`
- Added progress UI library:
  - `ui.progress.js`
  - `ui.progress.css`
  - styles: `linear`, `striped`, `gradient`, `segmented`, `steps`, `radial`, `ring`, `indeterminate`
- Added `demo.progress.html` and linked it from `index.html`

### v0.8.0

- Added toast notifications utility:
  - `ui.toast.js`
  - `ui.toast.css`
- Added select component utility:
  - `ui.select.js`
  - `ui.select.css`
- Updated `demo.ui.html`:
  - new Toast section (info/success/warn/error actions)
  - new Select section (single + multi searchable select)

### v0.9.0

- Added datepicker utility:
  - `ui.datepicker.js`
  - `ui.datepicker.css`
  - supports `single` and `range` modes with optional time inputs
- Added action modal wrapper:
  - `createActionModal(...)` in `ui.modal.js` for declarative footer actions
- Refactored dialog helpers to use action modal internals:
  - `uiAlert`, `uiConfirm`, `uiPrompt`
- Updated `demo.ui.html`:
  - new Datepicker section (single + range/time examples)
- Enhanced toast speech controls:
  - optional delayed dismiss until speech ends (`waitForSpeechBeforeDismiss`)
  - voice selection support (`voiceName`, `getVoices()`)

### v0.10.0

- Added timeline utility:
  - `ui.timeline.js`
  - `ui.timeline.css`
  - supports `vertical` and `horizontal` orientations
  - supports optional vertical date grouping and item/action callbacks
- Updated `demo.ui.html`:
  - new Timeline section with vertical + horizontal examples

### v0.11.0

- Added timeline scrubber utility:
  - `ui.timeline.scrubber.js`
  - `ui.timeline.scrubber.css`
  - seek/playhead, optional range handles, zoom levels
- Added dedicated timeline demo:
  - `demo.timeline.html`
  - scrubber-driven active item highlighting + horizontal auto-scroll
- Updated `demo.ui.html`:
  - timeline/scrubber moved out to dedicated page for clearer utility coverage

### v0.12.0

- Added command palette utility:
  - `ui.command.palette.js`
  - `ui.command.palette.css`
  - shortcut-driven quick actions (`Ctrl/Cmd + K`)
- Added tree utility:
  - `ui.tree.js`
  - `ui.tree.css`
  - expandable/selectable/checkable hierarchy

### v0.13.0

- Added file uploader utility:
  - `ui.file.uploader.js`
  - `ui.file.uploader.css`
  - drag/drop queue, validation, progress, retry/cancel/remove, upload adapter hook
- Improved timeline demo integration:
  - scrubber range now filters visible timeline items
  - seek highlight operates on filtered result set
- UX polishing:
  - fixed-height, scrollable event logs across demo pages
  - global themed scrollbar styling in `ui.tokens.css`

### v0.13.1

- Timeline polishing (roadmap v0.13 progress):
  - added component-level linked range filtering in `ui.timeline`:
    - `options.linkedRange = { startMs, endMs, anchorMs? }`
    - `setLinkedRange(range|null)`
    - `getState().visibleItems`
  - updated `demo.timeline.html` to use timeline API linked-range filtering (not demo-only external filtering)

### v0.13.2

- Kanban v2 (roadmap v0.13 progress):
  - intra-lane reorder support (drag/drop and programmatic `toIndex`)
  - lane WIP limits via `wipLimits`
  - move validation hook via `validateMove(...)`
  - rejected-move event via `onMoveRejected(...)`
  - keyboard-accessible card moves (arrow keys)
- Added kanban utility:
  - `ui.kanban.js`
  - `ui.kanban.css`
  - drag-drop lane card movement with callbacks
- Updated `demo.ui.html`:
  - new sections for command palette, tree, and kanban

### v0.13.3

- Timeline scrubber interaction hardening (roadmap v0.13 progress):
  - improved pointer interaction stability (`preventDefault` + propagation control on drag gestures)
  - keyboard seek controls on scrubber rail:
    - `ArrowLeft/ArrowRight`, `Home/End`, `PageUp/PageDown`
    - configurable `seekStepMs` and `seekStepMsFast` (Shift)
  - wheel-to-horizontal-scroll handling in zoomed scrubber viewport
  - `preventPageScrollOnInteract` option (default `true`)

### v0.14.0

- Added workflow/layout/data primitives:
  - `ui.stepper.js` + `ui.stepper.css`
  - `ui.splitter.js` + `ui.splitter.css`
  - `ui.data.inspector.js` + `ui.data.inspector.css`
  - `ui.empty.state.js` + `ui.empty.state.css`
  - `ui.skeleton.js` + `ui.skeleton.css`
- Added dedicated demo pages:
  - `demo.stepper.html`
  - `demo.splitter.html`
  - `demo.inspector.html`
  - `demo.empty.state.html`
  - `demo.skeleton.html`
- Kept `demo.ui.html` focused on general UI playground utilities

### v0.14.1

- Command palette v2 (roadmap v0.14 progress):
  - async command providers (`providers[]`)
  - grouped sections rendering
  - pinned/recent command groups
  - history persistence (`historyStorageKey`)
  - history change hook (`onHistoryChange`)
- Updated `demo.ui.html` command palette demo to exercise provider + pinned/recent behavior

### v0.14.2

- Tree v2 (roadmap v0.14 progress):
  - async/lazy child loading:
    - `lazyLoadChildren(node, state)`
    - `onLoadChildren(node, children, state)`
  - optional virtualization for large trees:
    - `enableVirtualization`
    - `virtualHeight`
    - `virtualRowHeight`
    - `virtualOverscan`
  - `getState().visibleRows` added for flattened visible tree snapshot
- Updated `demo.ui.html` tree section to demonstrate:
  - lazy loading on demand
  - large-node virtualization behavior

### v0.15.0

- Added virtual list primitive (roadmap v0.15 progress):
  - `ui.virtual.list.js`
  - `ui.virtual.list.css`
  - windowed rendering with configurable `height`, `rowHeight`, and `overscan`
  - API: `update`, `setItems`, `scrollToIndex`, `getState`, `destroy`
- Added dedicated `demo.virtual.list.html`
- Linked new demo from `index.html`

### v0.15.1

- Added scheduler/calendar primitive (roadmap v0.15 progress):
  - `ui.scheduler.js`
  - `ui.scheduler.css`
  - month/week views with event and slot callbacks
- Added dedicated `demo.scheduler.html`
- Linked new demo from `index.html`

### v0.15.2

- File uploader v2 chunk/resume hooks (roadmap v0.15 progress):
  - `useChunkUpload`, `chunkSize`
  - `onGetResumeState`, `onCreateUploadSession`
  - `onUploadChunk`, `onPersistResumeState`
  - `onFinalizeUpload`, `onClearResumeState`
- Updated `demo.ui.html` uploader demo to exercise chunk upload + localStorage resume-state flow

### v0.16.0

- Added registry-based component loader:
  - `js/ui/ui.loader.js`
  - `uiLoader.load(name)`
  - `uiLoader.loadMany(names)`
  - `uiLoader.import(name)`
- Added explicit loader registry coverage for:
  - `ui.*` browser utilities
  - `incident.*` helper modules
- Added deduplicated stylesheet injection so engineers can load CSS and JS through one API instead of manual asset wiring
- Updated README and playbook to document `uiLoader` as the preferred shared loading path for project integrations

### v0.16.1

- Converted all `demo*.html` pages to use `uiLoader` instead of manual component stylesheet tags and direct component module imports
- Standardized demo boot flow:
  - head bootstrap uses `window.__demoLoaderReady = uiLoader.loadMany([...])`
  - page scripts await loader readiness and import modules via `uiLoader.import(...)`
- Demos now serve as the canonical reference for loader-based integration across the library

### v0.16.2

- Strengthened `uiLoader` contract:
  - export-aware registry entries via `export`
  - `uiLoader.get(name)` for resolved exports
  - `uiLoader.create(name, ...args)` for factory-style creation by registry key
  - grouped loading via `loadGroup(name)` and `loadManyGroup(names)`
  - loader diagnostics via `getFailedCss()`, `getFailedModules()`, `getDiagnostics()`, `setDebug(...)`
- Added alias registry keys for common utility exports:
  - `ui.action.modal`
  - `ui.dialog.alert`
  - `ui.dialog.confirm`
  - `ui.dialog.prompt`
  - `ui.dom.createElement`
  - `ui.dom.clearNode`
  - `ui.events.createEventBag`
- Expanded shared primitive CSS in `ui.components.css`:
  - `ui-surface`, `ui-panel`
  - `ui-field`, `ui-label`
  - `ui-badge`, `ui-eyebrow`
  - `ui-shell-header`, `ui-shell-search`
  - normalized button variants (`ui-button-primary`, `ui-button-ghost`, `ui-button-danger`)
- Added registry contract test:
  - `node tests/registry.contract.mjs`
- Tightened integration guidance in README and playbook:
  - app integrations should use `uiLoader` by registry key
  - direct path imports are treated as internal-library usage

### v0.16.3

- Added toggle primitives:
  - `js/ui/ui.toggle.button.js`
  - `js/ui/ui.toggle.group.js`
  - `css/ui/ui.toggle.css`
- Added loader registry entries:
  - `ui.toggle.button`
  - `ui.toggle.group`
- Added toggle components to the `forms` loader group
- Updated `demo.ui.html`:
  - standalone toggle button demo
  - multi toggle group demo
  - single-select segmented toggle group demo

### v0.16.4

- Added hierarchical tree grid component:
  - `js/ui/ui.tree.grid.js`
  - `css/ui/ui.tree.grid.css`
- Added loader registry entry:
  - `ui.tree.grid`
- Added `ui.tree.grid` to the `data` loader group
- Added dedicated demo page:
  - `demo.tree.grid.html`
- Linked tree grid demo from `index.html`
