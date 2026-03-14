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
    ui.form.modal.css
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
    ui.media.viewer.css
    ui.audio.css
    ui.grid.css
    ui.tree.grid.css
    ui.hierarchy.map.css
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
    ui.semantic.icons.js
    ui.toast.js
    ui.form.modal.js
    ui.form.modal.presets.js
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
    ui.media.viewer.js
    ui.grid.js
    ui.tree.grid.js
    ui.hierarchy.map.js
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
demo.hierarchy.map.html
demo.progress.html
demo.virtual.list.html
demo.scheduler.html
demo.timeline.html
demo.ui.html
demo.audio.html
demo.media.viewer.html
demo.nav.html
demo.stepper.html
demo.splitter.html
demo.inspector.html
demo.empty.state.html
demo.skeleton.html
samples/
  samplehierarchy_cebu.json
  sampledata.json
  sampledata_*.json
  samplemedia.json
scripts/
  generate.hierarchy.sample.ps1
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
  - `createActionModal(options)` modal wrapper with declarative header/footer actions (`headerActions[]`, `actions[]`)
- `ui.dialog.js`
  - `uiAlert(message, options)` promise-based alert modal
  - `uiConfirm(message, options)` promise-based confirm modal
  - `uiPrompt(message, options)` promise-based prompt modal
- `ui.toast.js`
  - `createToastStack(options)` global toast notifications (info/success/warn/error), optional speech synthesis (`speak`, `speakTypes`, `speakRate`, `speakPitch`, `speakVolume`, `voiceName`, `speakFormatter`, `speakCooldownMs`)
  - default semantic status icons are shown per toast variant; callers can suppress or override them with `showVariantIcon` / `variantIcon`
  - speech is opt-in (`speak: false` by default); can be overridden per-toast via `show(message, { speak: true | false })`
  - when speech is enabled, auto-dismiss countdown can start after speech ends via `waitForSpeechBeforeDismiss` (default `true`)
  - `getVoices()` returns available speech voices so UI can render a voice selector; per-toast `voiceName` override is supported in `show(message, { voiceName })`
- `ui.form.modal.js`
  - `createFormModal(options)` schema-driven modal form helper for short login/re-auth/CRUD flows using a strict row-based body model over `createActionModal(...)`
  - exposes helper-owned values, field errors, form error, and busy submit lifecycle without widening the base modal shell contract
- `ui.form.modal.presets.js`
  - `createLoginFormModal(options)` opinionated login wrapper over `createFormModal(...)` with field-name remapping support
  - `createReauthFormModal(options)` opinionated re-auth wrapper over `createFormModal(...)` with locked identifier support and field-name remapping
  - `createStatusUpdateFormModal(options)` operational status-change wrapper over `createFormModal(...)` with app-supplied status options and field-name remapping
  - `createReasonFormModal(options)` categorized reason-required wrapper over `createFormModal(...)` with app-supplied reason options and field-name remapping
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
  - `createTree(container, data, options)` expandable/selectable tree view with optional checkboxes, lazy child loading, and optional chrome-less rendering
- `ui.kanban.js`
  - `createKanban(container, lanes, options)` lane-based board with draggable cards and move callbacks
- `ui.stepper.js`
  - `createStepper(container, steps, options)` step indicator/navigation component for multi-step workflows
- `ui.splitter.js`
  - `createSplitter(container, options)` resizable two-pane layout primitive (horizontal/vertical)
- `ui.data.inspector.js`
  - `createDataInspector(container, data, options)` expandable object/JSON inspector with copy-path actions and optional chrome-less rendering
- `ui.empty.state.js`
  - `createEmptyState(container, data, options)` standardized empty/error/no-result presentation block with optional chrome-less rendering
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
- `ui.media.viewer.js`
  - `createMediaViewer(container, options)` standalone image/video lightbox viewer with zoom/pan, fit modes, gallery navigation, and optional video audiograph
- `ui.grid.js`
  - `createGrid(container, rows, options)` data grid/table with local/remote modes, optional sort/search/pagination, optional row virtualization, and optional chrome-less rendering
- `ui.tree.grid.js`
  - `createTreeGrid(container, options)` tree grid with first-column hierarchy, aligned tabular columns, expand/collapse controls, tree-aware search, column resize, optional fixed-row-height virtualization, lazy child loading, and optional chrome-less rendering
- `ui.hierarchy.map.js`
  - `createHierarchyMap(container, options)` hierarchy-first visual explorer with external entity lane, overlay relationship links, search, zoom/pan, selection, and optional chrome-less rendering
- `ui.progress.js`
  - `createProgress(container, data, options)` progress indicator with multiple styles (linear, segmented, steps, radial, ring, etc.)
- `ui.virtual.list.js`
  - `createVirtualList(container, items, options)` virtualized list primitive for very large row sets with optional chrome-less rendering
- `ui.scheduler.js`
  - `createScheduler(container, data, options)` month/week scheduler primitive with slot/event interactions and optional chrome-less rendering
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
  - button variants:
    - `.ui-button-primary` emphasized filled action
    - `.ui-button-ghost` transparent background with border
    - `.ui-button-borderless` borderless transparent action
    - `.ui-button-quiet` low-emphasis bordered action
    - `.ui-button-link` link-style action
    - `.ui-button-icon` square icon button sizing helper
  - cell-action helpers:
    - `.ui-cell-actions` inline action-row wrapper for grid/tree-grid/list cells
    - `.ui-cell-action` per-action alignment helper for icon/button controls inside dense cells
  - form feedback:
    - `.ui-form-error` inline validation/auth error text for shared form/modal flows
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
- `ui.media.strip.css` media strip and thumbnail launcher styles
- `ui.media.viewer.css` modal media viewer styles
- `ui.audio.css` audio player, audiograph, and call session styles
- `ui.grid.css` data-grid/table styles
- `ui.tree.grid.css` tree-grid styles
- `ui.hierarchy.map.css` hierarchy map styles
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
- `chrome: false` is only exposed by components that own a real library-managed outer shell.
- Components without distinct wrapper chrome should not add a no-op `chrome` flag.
- Prefer shared styling contracts before adding project-local CSS overrides.
- Prefer documented helper components and preset wrappers before building app-local UI for the same workflow.
- Common helper-first checks for repeated operational flows:
  - `createFormModal(...)`
  - `createLoginFormModal(...)`
  - `createReauthFormModal(...)`
  - `createStatusUpdateFormModal(...)`
  - `createReasonFormModal(...)`
  - `uiAlert(...)`, `uiConfirm(...)`, `uiPrompt(...)`
  - `createToastStack(...)`
  - `createMediaViewer(...)`
  - `createHierarchyMap(...)`
- If the library is close but missing a repeated capability, do not patch the shared helper contract ad hoc from project work.
- Submit a proposal or spec update first so the shared helper change can be reviewed for:
  - cross-project reuse
  - naming consistency
  - contract boundaries
  - demo and regression impact
- Start with `css/ui/ui.components.css` primitives such as:
  - button variants: `.ui-button-primary`, `.ui-button-ghost`, `.ui-button-borderless`, `.ui-button-quiet`, `.ui-button-link`, `.ui-button-icon`
  - dense cell actions: `.ui-cell-actions`, `.ui-cell-action`
  - form feedback: `.ui-form-error`
  - shell/layout primitives: `.ui-panel`, `.ui-surface`, `.ui-field`, `.ui-label`, `.ui-badge`, `.ui-eyebrow`, `.ui-shell-header`, `.ui-shell-search`
- If the same override appears more than once in a consuming app, it is a candidate to move back into the shared library instead of remaining project-local.

Recommended keys:

- UI utilities:
  - `ui.modal`
  - `ui.dialog`
  - `ui.toast`
- `ui.media.viewer`
- `ui.grid`
- `ui.hierarchy.map`
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
node tests/tree.grid.regression.mjs
node tests/modal.busy.regression.mjs
node tests/form.modal.regression.mjs
node tests/form.modal.presets.regression.mjs
```

## Chrome-less Components

`chrome: false` is supported only on components that own a real library-managed outer shell.

| Component key | Factory | `chrome: false` | Notes |
| --- | --- | --- | --- |
| `ui.grid` | `createGrid` | Yes | Removes outer grid frame; table internals remain intact. |
| `ui.tree` | `createTree` | Yes | Removes outer tree shell; node rendering and lazy loading are unchanged. |
| `ui.tree.grid` | `createTreeGrid` | Yes | Removes outer tree-grid frame; hierarchy, resize, and virtualization remain intact. |
| `ui.virtual.list` | `createVirtualList` | Yes | Removes outer list shell; viewport/layer behavior remains intact. |
| `ui.data.inspector` | `createDataInspector` | Yes | Removes outer inspector shell; nested node rendering remains intact. |
| `ui.empty.state` | `createEmptyState` | Yes | Removes dashed empty-state frame so the host layout owns the presentation shell. |
| `ui.scheduler` | `createScheduler` | Yes | Removes outer scheduler shell; month/week layout and interactions remain intact. |
| `ui.timeline` | `createTimeline` | No | No distinct outer shell today; no-op `chrome` flags are intentionally avoided. |
| `ui.stepper` | `createStepper` | No | Styling is item-level, not wrapper-shell-level. |
| `ui.skeleton` | `createSkeleton` | No | Visuals are internal placeholder blocks; there is no meaningful outer shell to disable. |

Rule of thumb:

- If the component owns a visible outer border/background/padding shell, it may expose `chrome: false`.
- If the component only renders internal items/blocks and has no distinct wrapper chrome, it should not expose the flag.

## Common Options

- `theme`: `"dark"` | `"light"` (default `"dark"`)
- `className`: extra class for root element
- `ariaLabel`: accessible label for wrapper/region style components where supported
- `emptyText`: fallback text for empty state
- `locale`, `timezone`: formatting support
- `debug`: boolean (default `false`)
- `lookups`: boot-reference object

Editor-only options:

- `onChange(payload)`
- `onSubmit(payload)` (emit-only, no auto-submit)

## Toggle Components

The shared toggle layer standardizes binary on/off controls so consuming apps do not need to invent local active/inactive button behavior.

Recommended use cases:

- map-toolbar toggles such as `Terrain` and `POI`
- filter chips
- admin settings toggles
- compact action strips
- segmented single-select controls

### `createToggleButton(container, options)`

Reusable binary toggle rendered as a native `button` with `aria-pressed`.

Supported options:

- `id`
- `label`
- `pressed`
- `icon`
- `ariaLabel`
- `variant`: `"pill" | "segmented" | "chip" | "icon" | "ghost"`
- `tone`: `"neutral" | "success" | "info" | "warning" | "danger"`
- `size`: `"sm" | "md" | "lg"`
- `quiet`
- `disabled`
- `leadingDot`
- `iconPosition`: `"start" | "end"`
- `count`
- `loading`
- `tooltip`
- `className`
- `onChange(payload)`

Accessibility contract:

- renders as a native `button`
- always sets `type="button"`
- always syncs `aria-pressed="true|false"`
- icon-only toggles require `ariaLabel`; invalid icon-only usage logs `console.error(...)` and renders nothing

Returned API:

- `setPressed(nextPressed, emit = false)`
- `getPressed()`
- `setDisabled(nextDisabled)`
- `setLabel(nextLabel)`
- `update(nextOptions = {})`
- `getState()`
- `destroy()`

`onChange(payload)` callback shape:

```js
{
  id: "terrain",
  pressed: true,
  button, // toggle-button instance
  event,  // click event or null when emitted programmatically
}
```

Example:

```js
const toggle = createToggleButton(container, {
  id: "terrain",
  label: "Terrain",
  pressed: true,
  variant: "pill",
  tone: "success",
  leadingDot: true,
  onChange(payload) {
    console.log(payload.id, payload.pressed);
  },
});
```

### `createToggleGroup(container, options)`

Composes multiple toggle buttons with shared sizing, tone, and selection rules.

Supported options:

- `items`
- `variant`: `"pill" | "segmented" | "chip" | "icon" | "ghost"`
- `tone`: `"neutral" | "success" | "info" | "warning" | "danger"`
- `size`: `"sm" | "md" | "lg"`
- `multi`
- `allowNone`
- `quiet`
- `disabled`
- `leadingDot`
- `className`
- `name`
- `onChange(payload)`

Group modes:

- `multi: true`
  - each toggle is independent
  - best for overlays and filters
- `multi: false`
  - behaves like a single-select group
  - `allowNone: false` guarantees one pressed item remains selected

Implementation note:

- `segmented` is supported at the button level but is primarily intended for grouped usage

Returned API:

- `getItems()`
- `getValue()`
- `setItems(nextItems = [])`
- `updateItem(id, patch = {})`
- `setPressed(id, nextPressed, emit = false)`
- `update(nextOptions = {})`
- `destroy()`

`onChange(payload)` callback shape:

```js
{
  items,        // cloned group item array
  changedItem,  // cloned item that changed
  changedIndex, // index of the changed item
  group,        // toggle-group instance
  value,        // pressed ids[] for multi, single id|null for single-select
}
```

Example:

```js
const group = createToggleGroup(container, {
  items: [
    { id: "terrain", label: "Terrain", pressed: true },
    { id: "poi", label: "POI", pressed: false },
  ],
  variant: "segmented",
  tone: "success",
  multi: true,
  onChange(payload) {
    console.log(payload.value, payload.changedItem);
  },
});
```

Shared styling contract:

- Use `ui.toggle.css` for toggle-specific visuals.
- For toolbar shells and surrounding layout, prefer shared primitives from `ui.components.css`.
- Do not replace toggle styling with project-local pressed-state implementations unless the shared contract is insufficient.

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

- `ariaLabel`, `seekLabel`
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

- `ariaLabel`
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
- `demo.media.viewer.html` -> dedicated media-viewer playground
  - standalone image/video viewer
  - zoom/pan + fit modes
  - optional video audiograph
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
- `samples/samplemedia.json` (for media-strip and media-viewer demos)
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
- `headerActions` (`string | HTMLElement | HTMLElement[] | () => HTMLElement`)
- `footer` (`string | HTMLElement | () => HTMLElement`)
- `size`: `"sm" | "md" | "lg" | "xl" | "full"`
- `position`: `"center" | "top"`
- `showHeader`, `showCloseButton`
- `closeOnBackdrop`, `closeOnEscape`
- `busy`
- `busyMessage`
- `closeWhileBusy`
- `backdropCloseWhileBusy`
- `escapeCloseWhileBusy`
- `trapFocus`, `lockScroll`
- `initialFocus` (`selector | HTMLElement | (panel) => HTMLElement`)
- `className`
- `onOpen(ctx)`, `onBeforeClose(meta)`, `onClose(meta)`

Methods:

- `open(content?, nextOptions?)`
- `close(meta?)`
- `update(nextOptions?)`
- `setContent(content)`
- `setHeaderActions(headerActions)`
- `setFooter(footer)`
- `setTitle(title)`
- `setBusy(isBusy, { message? })`
- `isBusy()`
- `destroy()`
- `getState()`

Busy-state behavior:

- modal shell exposes a helper-owned busy overlay
- `setBusy(true, { message })`:
  - sets `aria-busy="true"` on the modal panel
  - disables body/footer/header actions
  - disables close controls when the close policy forbids close while busy
  - suppresses duplicate interaction while the modal is intentionally locked
- default busy close policies are safe:
  - `closeWhileBusy: false`
  - `backdropCloseWhileBusy: false`
  - `escapeCloseWhileBusy: false`

Example:

```js
import { createModal } from "./js/ui/ui.modal.js";

const modal = createModal({
  title: "Reusable Modal",
  size: "md",
  content: "Hello from modal body",
  headerActions: [
    Object.assign(document.createElement("button"), { className: "ui-button ui-button-ghost", type: "button", textContent: "Refresh" }),
  ],
});

modal.open();
modal.setBusy(true, { message: "Saving..." });
// later
modal.setBusy(false);
modal.close({ reason: "done" });
```

### `createActionModal(options)` (`js/ui/ui.modal.js`)

Purpose:

- Faster modal setup when footer buttons are known up front.

Key options:

- all `createModal(...)` options
- `autoBusy` (default `true`)
- `headerActions`: array of button actions using the same action object contract as footer `actions`
- `actions`: array of button actions
  - `id`
  - `label` (required)
  - `variant`: `"default" | "primary" | "danger" | "ghost"`
  - `icon`: SVG/HTML string
  - `iconPosition`: `"start" | "end"`
  - `iconOnly`
  - `ariaLabel` (recommended when `iconOnly: true`)
  - `busyMessage`
  - `closeOnClick` (default `true`)
  - `disabled`
  - `autoFocus`
  - `onClick({ action, modal, event, placement })` (can return `false` to prevent close)

Methods:

- all `createModal(...)` methods
- `setHeaderActions(actions[])`
- `setActions(actions[])`

Auto-busy behavior:

- if `autoBusy !== false` and an action `onClick(...)` returns a promise:
  - modal enters busy state before awaiting the promise
  - modal leaves busy state after resolve/reject
  - duplicate action clicks are ignored while busy
- close rules remain normal:
  - resolved `false` keeps the modal open
  - rejected promise keeps the modal open
  - resolved truthy value closes when `closeOnClick !== false`

### `createFormModal(options)` (`js/ui/ui.form.modal.js`)

Purpose:

- Schema-driven helper for short modal-bound forms such as login, re-auth, and simple CRUD flows.

Architecture:

- Composes over `createActionModal(...)`
- Reuses helper-owned modal busy-state, close, and focus behavior
- Keeps the public action contract narrow to standard cancel/submit flows in V1

Key options:

- safe applicable modal options such as `title`, `size`, `className`, `showCloseButton`, `closeOnBackdrop`, `closeOnEscape`, `busyMessage`
- `rows`: array of row arrays
  - one item in a row => full width
  - two items in a row => equal-width columns
  - more than two items => rejected or normalized conservatively
- `initialValues`
- `submitLabel`
- `cancelLabel`
- `submitVariant`
- `submitIcon`
- `cancelIcon`
- `closeOnSuccess` (default `true`)
- `onSubmit(values, ctx)`
- `onChange(values, ctx)` optional

Supported V1 item types:

- `text`
- `alert`
- `divider`
- `input`
- `textarea`
- `select`
- `checkbox`

Supported V1 `input` types:

- `text`
- `email`
- `password`
- `number`
- `date`
- `url`
- `search`

Field properties:

- `name`
- `label`
- `value`
- `placeholder`
- `required`
- `disabled`
- `readonly`
- `autocomplete`
- `min`
- `max`
- `step`
- `options`
- `help`

Methods:

- all modal-instance methods such as `open()`, `close()`, `destroy()`, `setBusy()`, `isBusy()`
- `getValues()`
- `setValues(values)`
- `setErrors(fieldErrors)`
- `clearErrors()`
- `setFormError(message)`
- `clearFormError()`

Validation and submit behavior:

- helper owns required/basic validation
- app owns domain/business validation
- first invalid field receives focus on helper validation failure
- truthy async submit result closes by default
- falsy or rejected submit keeps the modal open

Example:

```js
import { createFormModal } from "./js/ui/ui.form.modal.js";

const formModal = createFormModal({
  title: "Operator Login",
  rows: [
    [{ type: "text", content: "Please sign in to continue." }],
    [{ type: "input", input: "email", name: "email", label: "Email address", required: true }],
    [{ type: "input", input: "password", name: "password", label: "Password", required: true }],
  ],
  submitLabel: "Login",
  busyMessage: "Signing in...",
  async onSubmit(values, ctx) {
    const ok = await apiLogin(values);
    if (!ok) {
      ctx.setErrors({ password: "Invalid password." });
      return false;
    }
    return true;
  },
});

formModal.open();
```

### `createLoginFormModal(options)`, `createReauthFormModal(options)`, `createStatusUpdateFormModal(options)`, `createReasonFormModal(options)` (`js/ui/ui.form.modal.presets.js`)

Purpose:

- Prebuilt auth wrappers over `createFormModal(...)` for shared cross-project consistency.

Design rule:

- wrappers own structure and defaults
- engineers can still provide field-name mappings and submit behavior

`createLoginFormModal(options)` supports:

- `title`
- `message`
- `submitLabel`
- `busyMessage`
- `identifierKind: "email" | "username"`
- `identifierLabel`
- `identifierPlaceholder`
- `identifierAutocomplete`
- `passwordLabel`
- `passwordPlaceholder`
- `fields`
  - `identifier`
  - `password`
- `initialValues`
- `onSubmit(values, ctx)`

`createReauthFormModal(options)` supports:

- `title`
- `message`
- `submitLabel`
- `busyMessage`
- `identifierKind: "email" | "username"`
- `identifierLabel`
- `identifierValue`
- `passwordLabel`
- `passwordPlaceholder`
- `fields`
  - `identifier`
  - `password`
- `initialValues`
- `onSubmit(values, ctx)`

`createStatusUpdateFormModal(options)` supports:

- `title`
- `message`
- `submitLabel`
- `busyMessage`
- `statusOptions`
- `statusLabel`
- `remarksLabel`
- `remarksPlaceholder`
- `showNotify`
- `notifyLabel`
- `fields`
  - `status`
  - `remarks`
  - `notify`
- `initialValues`
- `onSubmit(values, ctx)`

`createReasonFormModal(options)` supports:

- `title`
- `message`
- `submitLabel`
- `busyMessage`
- `reasonOptions`
- `reasonLabel`
- `detailsLabel`
- `detailsPlaceholder`
- `confirmPhrase`
- `confirmLabel`
- `showNotify`
- `notifyLabel`
- `fields`
  - `reasonCode`
  - `reasonDetails`
  - `confirmText`
  - `notify`
- `initialValues`
- `onSubmit(values, ctx)`

Example:

```js
import { createLoginFormModal } from "./js/ui/ui.form.modal.presets.js";

const modal = createLoginFormModal({
  fields: {
    identifier: "user_email",
    password: "user_password",
  },
  initialValues: {
    user_email: "operator@pbb.ph",
  },
  async onSubmit(values, ctx) {
    const ok = await apiLogin(values);
    if (!ok) {
      ctx.setErrors({ user_password: "Invalid password." });
      return false;
    }
    return true;
  },
});

modal.open();
```

### `uiAlert(message, options)`, `uiConfirm(message, options)`, `uiPrompt(message, options)` (`js/ui/ui.dialog.js`)

Purpose:

- Promise-based convenience dialogs built on top of `createActionModal(...)`.

Shared options:

- modal shell options such as `title`, `size`, `className`, `showCloseButton`, `allowBackdropClose`, `allowEscClose`
- `headerActions`: declarative header action objects using the same contract as `createActionModal(...)`
- `variant`: `default | success | info | warning | error`
  - applies semantic dialog styling without changing the underlying modal shell contract
  - `uiConfirm(...)` and `uiPrompt(...)` also use the dialog variant to choose a safer default emphasis for the primary action:
    - `warning` / `error` => default primary action emphasis becomes `danger`
    - `success` / `info` => default primary action emphasis remains `primary`
- `description`: optional secondary guidance text shown below the main dialog message
- semantic icon options:
  - `showVariantIcon`: `false` to suppress the built-in status icon
  - `variantIcon`: custom SVG markup to replace the built-in status icon for non-`default` variants
- optional speech options:
  - `speak`: `true` to read the dialog after open
  - `speakText`: custom text to read instead of the default title/message/description composition
  - `voiceName`: preferred speech-synthesis voice name
  - `speakRate`
  - `speakPitch`
  - `speakVolume`

Icon-capable action options:

- `uiAlert(...)`
  - `okIcon`
  - `okIconPosition`
  - `okIconOnly`
  - `okAriaLabel`
- `uiConfirm(...)`
  - `cancelIcon`
  - `cancelIconPosition`
  - `cancelIconOnly`
  - `cancelAriaLabel`
  - `confirmIcon`
  - `confirmIconPosition`
  - `confirmIconOnly`
  - `confirmAriaLabel`
- `uiPrompt(...)`
  - `cancelIcon`
  - `cancelIconPosition`
  - `cancelIconOnly`
  - `cancelAriaLabel`
  - `submitIcon`
  - `submitIconPosition`
  - `submitIconOnly`
  - `submitAriaLabel`

Example:

```js
const confirmed = await uiConfirm("Proceed with dispatch?", {
  title: "Confirm Dispatch",
  variant: "warning",
  headerActions: [
    {
      id: "preview",
      label: "Preview",
      variant: "ghost",
      icon: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5c5.05 0 9.27 3.11 11 7-1.73 3.89-5.95 7-11 7S2.73 15.89 1 12c1.73-3.89 5.95-7 11-7Z" fill="currentColor"></path></svg>`,
      onClick() {
        return false;
      },
    },
  ],
  cancelIcon: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.3 5.71 12 12l6.3 6.29-1.41 1.41L10.59 13.4 4.29 19.7 2.88 18.29 9.17 12 2.88 5.71 4.29 4.3l6.3 6.29 6.29-6.3z" fill="currentColor"></path></svg>`,
  confirmIcon: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.55 17.4 4.8 12.65l1.4-1.4 3.35 3.35 8.25-8.25 1.4 1.4-9.65 9.65z" fill="currentColor"></path></svg>`,
});
```

Example:

```js
import { createActionModal } from "./js/ui/ui.modal.js";

const modal = createActionModal({
  title: "Delete Record",
  content: "This action cannot be undone.",
  headerActions: [
    {
      id: "preview",
      label: "Preview",
      variant: "ghost",
      onClick() {
        return false;
      },
    },
  ],
  actions: [
    { id: "cancel", label: "Cancel", variant: "ghost" },
    {
      id: "delete",
      label: "Delete",
      variant: "danger",
      icon: "<svg viewBox='0 0 24 24'><path d='M9 3h6l1 2h4v2H4V5h4l1-2Zm1 7h2v8h-2v-8Zm4 0h2v8h-2v-8ZM7 10h2v8H7v-8Z'/></svg>",
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

- `ariaLabel`
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

- `ariaLabel`
- `valueLabel`, `rangeStartLabel`, `rangeEndLabel`
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

- `draggable`, `className`, `ariaLabel`
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
  - `ariaLabel`, `dropzoneAriaLabel`
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

- Render image/video thumbs and open the shared standalone media viewer.

Key options:

- `layout`: `"scroll" | "wrap"`
- `animationMs` (default `300`)
- `autoplay`, `muted`, `loop`, `showControls`
- `viewerAriaLabel`
- `viewerFit`
- `showViewerHeader`
- `showViewerFooter`
- `showViewerCounter`
- `showViewerClose`
- `showViewerPrevNext`
- `showViewerToolbar`
- `showViewerAudiograph`
- `baseUrl`
- `onOpen(item, index)`, `onClose(item, index)`

Methods:

- `update(nextItems, nextOptions?)`
- `openById(id)`
- `openByIndex(index)`
- `getState()`
- `destroy()`

Note:

- `ui.media.strip` now delegates full-view behavior to `ui.media.viewer` so zoom/pan/video viewing stays centralized in one component.

### `createMediaViewer(container, options)` (`js/ui/ui.media.viewer.js`)

Purpose:

- Render a standalone modal/lightbox viewer for image/video items with transform-based zoom/pan.

Key options:

- data/state:
  - `items`
  - `index`
  - `open`
- viewing:
  - `fit: "contain" | "cover" | "original"`
  - `zoomStep`
  - `minZoom`
  - `maxZoom`
  - `wheelZoom`
  - `panWhenZoomed`
  - `loop`
- shell:
  - `showHeader`
  - `showFooter`
  - `showCounter`
  - `showClose`
  - `showPrevNext`
  - `showToolbar`
  - `closeOnBackdrop`
  - `closeOnEscape`
  - `ariaLabel`
- video:
  - `autoplayVideo`
  - `mutedVideo`
  - `loopVideo`
  - `showVideoControls`
  - `showAudiograph`
  - `audiographStyle`
  - `audiographSensitivity`
- hooks:
  - `onOpen(item, index)`
  - `onChange(item, index)`
  - `onClose()`
  - `onZoomChange(state)`

Methods:

- `open(index?)`
- `close()`
- `next()`
- `prev()`
- `setIndex(index)`
- `zoomIn()`
- `zoomOut()`
- `resetView()`
- `setFit(fit)`
- `update(nextOptions?)`
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

### Current Stable Line: `v0.20.x`

- Latest documented release: `v0.20.6`
- All library modules now follow monotonic SemVer in release notes:
  - breaking API changes -> `major`
  - new components/features -> `minor`
  - fixes/docs/internal cleanup -> `patch`

### Next Planned Line: `v0.21.x`

- Dedicated accessibility hardening pass across all UI utilities
- Additional data-entry primitives (mask/format helpers, richer validation wrappers)
- Performance refinements for heavy demo pages (timeline/grid/audio)

## Changelog

For full release history, see `CHANGELOG.md`.

### Release Line Index

- `v0.19.x`
  - hierarchy map, real Cebu hierarchy sample generator, hierarchy demo
- `v0.18.x`
  - media viewer, modal action/header consistency, `ui.tree.grid` search, regression harnesses
- `v0.17.x`
  - accessibility hardening across interactive UI components and demos
- `v0.16.x`
  - `uiLoader`, toggle primitives, `ui.tree.grid`, `chrome: false` support
- `v0.15.x`
  - `ui.virtual.list`, `ui.scheduler`, uploader chunk/resume hooks
- `v0.14.x`
  - workflow/layout/data primitives, command-palette expansion, tree expansion
- `v0.13.x`
  - uploader baseline, timeline refinements, `ui.kanban`
- `v0.12.x`
  - `ui.command.palette`, `ui.tree`
- `v0.11.x`
  - `ui.timeline.scrubber`
- `v0.10.x`
  - `ui.timeline`
- `v0.9.x`
  - `ui.datepicker`, `createActionModal(...)`
- `v0.8.x`
  - `ui.toast`, `ui.select`
- `v0.7.x`
  - `ui.modal`, `ui.progress`
- `v0.6.x`
  - `ui.grid` virtualization and dedicated grid demo
- `v0.5.x`
  - navigation/menu refinements
- `v0.4.x`
  - navigation/menu utility layer
- `v0.3.x`
  - `ui.grid` baseline
- `v0.2.x`
  - audio UI layer
- `v0.1.x`
  - initial public prototype


