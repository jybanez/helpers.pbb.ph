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
    ui.iframe.host.css
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
    ui.workspace.bridge.js
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
demos/
  index.html
  cookbook.html
  guide.which-helper.html
  demo.team.assignments.html
  demo.incident.types.html
  demo.grid.html
  demo.tree.grid.html
  demo.hierarchy.map.html
  demo.progress.html
  demo.virtual.list.html
  demo.scheduler.html
  demo.timeline.html
  demo.window.html
  demo.window.manager.html
  demo.iframe.host.html
  demo.workspace.bridge.html
  demo.ui.html
  demo.audio.html
  demo.media.viewer.html
  demo.nav.html
  demo.navbar.html
  demo.sidebar.html
  demo.breadcrumbs.html
  demo.dropdown.html
  demo.dropup.html
  demo.stepper.html
  demo.splitter.html
  demo.inspector.html
  demo.empty.state.html
  demo.skeleton.html
  demo.form.modal.html
index.html
samples/
  samplehierarchy_cebu.json
  sampledata.json
  sampledata_*.json
  samplemedia.json
  iframe/
    iframe-host.fixture.html
    workspace-ui-bridge.fixture.html
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
- `ui.password.js`
  - `createPasswordField(container, options)` reusable password input with shared show/hide toggle behavior for standalone use and auth flows
- `ui.icons.js`
  - `createIcon(name, options)` shared SVG icon creation over a categorized registry with namespaced ids and `currentColor` inheritance
  - `getIconDefinition(name)`, `listIcons()`, and `listIconCategories()` expose registry lookup without requiring projects to own raw SVG strings
- `ui.modal.js`
  - `createModal(options)` general-purpose modal shell (content/header/footer, sizing, focus trap, backdrop/escape close)
  - `createActionModal(options)` modal wrapper with declarative header/footer actions (`headerActions[]`, `actions[]`)
- `ui.window.js`
  - `createWindowManager(options)` desktop-style window manager with draggable/resizable stacked windows, configurable taskbar modes, and maximize/restore behavior
- `ui.iframe.host.js`
  - `createIframeHost(options)` helper-owned iframe surface with loading/error states, narrow source controls, and clean composition with `ui.window`
- `ui.workspace.bridge.js`
  - `installWorkspaceUiBridgeHost(options)` trusted parent-side bridge for iframe-hosted apps
  - `getWorkspaceUiBridge(options)` child-side bridge helper for delegated toasts, dialogs, and explicit action-modals
  - `showWorkspaceActionModal(payload, options)` narrow child-side request helper for parent-owned simple action-modals
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
  - exposes helper-owned values, field errors, form error, busy submit lifecycle, declarative mode rules, hidden/display fields, and hosted `ui.select` integration without widening the base modal shell contract
- `ui.form.modal.presets.js`
  - `createLoginFormModal(options)` opinionated login wrapper over `createFormModal(...)` with field-name remapping support
  - `createReauthFormModal(options)` opinionated re-auth wrapper over `createFormModal(...)` with locked identifier support and field-name remapping
  - `createStatusUpdateFormModal(options)` operational status-change wrapper over `createFormModal(...)` with app-supplied status options and field-name remapping
  - `createReasonFormModal(options)` categorized reason-required wrapper over `createFormModal(...)` with app-supplied reason options and field-name remapping
  - `createAccountFormModal(options)` opinionated account/profile wrapper over `createFormModal(...)` with helper-owned Name and Email rows plus additive `extraRows`
  - `createChangePasswordFormModal(options)` opinionated password-change wrapper over `createFormModal(...)` with helper-owned current/new/confirm password rows
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
  - `createWindowManager(...)`
  - `installWorkspaceUiBridgeHost(...)`
  - `getWorkspaceUiBridge(...)`
  - `createFormModal(...)`
  - `createLoginFormModal(...)`
  - `createReauthFormModal(...)`
  - `createAccountFormModal(...)`
  - `createChangePasswordFormModal(...)`
  - `createIcon(...)`
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
- `items[]` can render dropdown menus by providing:
  - `menuItems: []`
  - optional `menuOptions: {}`
- `actions[]` can render dropdown menus by providing:
  - `menuItems: []`
  - optional `menuOptions: {}`
- item-menu callbacks:
  - `onItemMenuSelect(item, menuItem, meta)`
  - `onItemMenuOpenChange(item, open)`
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
  activeId: "dashboard",
  items: [
    { id: "dashboard", label: "Dashboard" },
    {
      id: "apps",
      label: "Apps",
      menuItems: [
        { id: "app:relay", label: "Relay" },
        { id: "app:workspace", label: "Workspace" },
      ],
    },
  ],
  actions: [
    { id: "help", label: "Help", icon: "<svg viewBox='0 0 24 24'><path d='M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z'/></svg>" },
  ],
  onNavigate(item) { console.log("navbar.navigate", item); },
  onItemMenuSelect(item, menuItem) { console.log("navbar.itemMenu.select", item, menuItem); },
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

- `demos/index.html` -> demo catalog and documentation entry points
- `demos/cookbook.html` -> workflow-first recipe guide for common operational UI patterns
- `demos/guide.which-helper.html` -> helper decision guide for choosing the narrowest documented component
- root `index.html` -> lightweight redirect into `demos/index.html`
- `demos/demo.team.assignments.html` -> two-column Team Assignments demo
  - left: editable list helper
  - right: read-only list helper
  - right column mirrors left via `setList(items[])`
- `demos/demo.incident.types.html` -> Incident Types demo
  - left: editable list helper
  - right: viewer list helper
  - right column mirrors left via `setList(items[])`
- `demos/demo.grid.html` -> dedicated grid demo
  - local grid (client search/sort/pagination)
  - remote grid (query-driven updates)
  - large virtualized grid with fixed-height scrolling
- `demos/demo.tree.grid.html` -> dedicated tree-grid playground
  - expandable hierarchy in tabular columns
  - tree-aware search and lazy loading
  - fixed-row-height virtualization
- `demos/demo.hierarchy.map.html` -> dedicated hierarchy-map playground
  - hierarchy-first visual exploration
  - external entity lane and overlay links
  - zoom/pan and search
- `demos/demo.progress.html` -> progress styles demo
  - live configurable progress
  - style gallery for all rendering variants
- `demos/demo.virtual.list.html` -> dedicated virtual-list playground
  - large row-set windowing
  - `scrollToIndex(...)` controls
  - visible-range callback logging
- `demos/demo.scheduler.html` -> dedicated scheduler/calendar playground
  - month/week views
  - slot and event callback interactions
- `demos/demo.ui.html` -> UI utilities playground
  - modal, dialog, toast, select, datepicker, command palette, tree, kanban, file uploader, drawer, search, tabs, strips, media strip
- `demos/demo.media.viewer.html` -> dedicated media-viewer playground
  - standalone image/video viewer
  - zoom/pan + fit modes
  - optional video audiograph
- `demos/demo.timeline.html` -> dedicated timeline playground
  - vertical grouped timeline
  - horizontal timeline
  - timeline scrubber with seek/range/zoom
  - scrubber updates active timeline item (highlight + horizontal auto-scroll)
- `demos/demo.audio.html` -> audio player + stacked role audiographs
  - sample selector for available `sampledata_*.json`
  - graph style selector
  - sensitivity slider
  - theme toggle
- `demos/demo.nav.html` -> navigation overview and routing page
- `demos/demo.navbar.html` -> dedicated navbar manual/demo
- `demos/demo.sidebar.html` -> dedicated sidebar manual/demo
- `demos/demo.breadcrumbs.html` -> dedicated breadcrumbs manual/demo
- `demos/demo.dropdown.html` -> dedicated dropdown manual/demo
- `demos/demo.dropup.html` -> dedicated dropup manual/demo
- `demos/demo.stepper.html` -> dedicated stepper playground
  - workflow progression states
  - orientation toggle + step navigation
- `demos/demo.splitter.html` -> dedicated splitter playground
  - horizontal and vertical pane resizing
  - pointer + keyboard resize behavior
- `demos/demo.inspector.html` -> dedicated data inspector playground
  - nested object/array inspection
  - copy-path interactions
- `demos/demo.empty.state.html` -> dedicated empty-state playground
  - action callbacks and icon/title/description variants
- `demos/demo.skeleton.html` -> dedicated skeleton playground
  - lines/card/grid variants
  - animation toggle
- `demos/demo.form.modal.html` -> dedicated base form-modal playground
  - base `createFormModal(...)`
  - acceptance-proof hub/uplink flows
- `demos/demo.form.modal.login.html` -> dedicated login preset page
- `demos/demo.form.modal.reauth.html` -> dedicated re-auth preset page
- `demos/demo.form.modal.status.html` -> dedicated status-update preset page
- `demos/demo.form.modal.reason.html` -> dedicated reason-required preset page

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

Related demos:

- `demos/demo.drawers.html`

### `createPasswordField(container, options)` (`js/ui/ui.password.js`)

Purpose:

- Shared password-entry primitive with a helper-owned show/hide toggle.
- Used directly by teams and composed by `createFormModal(...)` password rows, including login and re-auth presets.

Factory:

```js
import { createPasswordField } from "./js/ui/ui.password.js";

const password = createPasswordField(container, options);
```

Options:

| Option | Type | Default | Description |
|---|---|---|---|
| `value` | `string` | `""` | Initial password value. |
| `visible` | `boolean` | `false` | Initial visibility state for the password text. |
| `placeholder` | `string` | `""` | Input placeholder text. |
| `name` | `string` | `""` | Submitted field name. |
| `id` | `string` | `""` | Input id for external labels. |
| `autocomplete` | `string` | `""` | Password-manager hint such as `current-password` or `new-password`. |
| `required` | `boolean` | `false` | Marks the input as required. |
| `disabled` | `boolean` | `false` | Disables both the input and toggle button. |
| `readonly` | `boolean` | `false` | Keeps the value visible/toggleable but non-editable. |
| `ariaLabel` | `string` | `"Password"` | Direct aria-label for unlabeled standalone usage. |
| `showLabel` | `string` | `"Show"` | Toggle label in hidden state. |
| `hideLabel` | `string` | `"Hide"` | Toggle label in visible state. |
| `onChange` | `function` | `null` | Called as `onChange(value, api)` when the value changes. |
| `onToggle` | `function` | `null` | Called as `onToggle(visible, api)` when visibility changes. |

Returned API:

| Method | Arguments | Returns | Description |
|---|---|---|---|
| `getValue()` | none | `string` | Returns the current password value. |
| `setValue(value)` | `string` | `void` | Updates the current value. |
| `isVisible()` | none | `boolean` | Returns whether the password is currently shown as text. |
| `setVisible(visible)` | `boolean` | `void` | Forces the current visibility state. |
| `focus()` | none | `void` | Focuses the underlying input. |
| `update(options)` | partial options | `void` | Updates options such as disabled or visible state. |
| `destroy()` | none | `void` | Removes the helper content from the host container. |

Example:

```js
const password = createPasswordField(document.getElementById("passwordHost"), {
  id: "operator-password",
  name: "operator_password",
  placeholder: "Enter password",
  autocomplete: "current-password",
  onToggle(visible) {
    console.log("visible:", visible);
  },
});
```

Related demos:

- `demos/demo.password.html`
- `demos/demo.form.modal.login.html`
- `demos/demo.form.modal.reauth.html`

### `createIcon(name, options)`, `getIconDefinition(name)`, `listIcons()`, `listIconCategories()` (`js/ui/ui.icons.js`)

Purpose:

- Shared categorized SVG icon registry for helper and app usage.

Design rule:

- one outline visual language
- namespaced stable icon ids
- `SVGElement` output instead of raw HTML strings

V1 categories:

- `actions`
- `navigation`
- `status`
- `media`
- `data`

Primary options:

| Option | Default | Description |
|---|---|---|
| `size` | `16` | Icon width/height in pixels. |
| `title` | `""` | Optional SVG title for non-decorative use. |
| `className` | `""` | Additional SVG class name(s). |
| `strokeWidth` | `1.8` | Outline stroke width override. |
| `decorative` | `true` | Decorative icons are hidden from assistive tech unless a label/title is supplied. |
| `ariaLabel` | `""` | Direct accessible label for non-decorative icons. |

Example:

```js
import { createIcon } from "./js/ui/ui.icons.js";

const closeIcon = createIcon("actions.close", {
  size: 16,
  title: "Close",
  decorative: false,
});

button.prepend(closeIcon);
```

Related demos:

- `demos/demo.icons.html`

### `createModal(options)` (`js/ui/ui.modal.js`)

Purpose:

- General-purpose modal shell for custom content, forms, media, and reusable overlays.

Factory:

```js
import { createModal } from "./js/ui/ui.modal.js";

const modal = createModal(options);
```

Options:

| Option | Type | Default | Required | Description |
|---|---|---:|---|---|
| `title` | `string` | `""` | no | Header title text. |
| `content` | `string \| HTMLElement \| (() => HTMLElement)` | `""` | no | Body content source. |
| `headerActions` | `string \| HTMLElement \| HTMLElement[] \| (() => HTMLElement)` | `null` | no | Custom header action content. |
| `footer` | `string \| HTMLElement \| (() => HTMLElement)` | `null` | no | Custom footer content. |
| `size` | `"sm" \| "md" \| "lg" \| "xl" \| "full"` | `"md"` | no | Modal width preset. |
| `position` | `"center" \| "top"` | `"center"` | no | Vertical placement. |
| `showHeader` | `boolean` | `true` | no | Shows modal header shell. |
| `showCloseButton` | `boolean` | `true` | no | Shows header close button. |
| `closeOnBackdrop` | `boolean` | `true` | no | Allows backdrop click close. |
| `closeOnEscape` | `boolean` | `true` | no | Allows `Esc` close. |
| `busy` | `boolean` | `false` | no | Opens the modal in busy state. |
| `busyMessage` | `string` | `""` | no | Busy overlay status text. |
| `closeWhileBusy` | `boolean` | `false` | no | Allows explicit close while busy. |
| `backdropCloseWhileBusy` | `boolean` | `false` | no | Allows backdrop close while busy. |
| `escapeCloseWhileBusy` | `boolean` | `false` | no | Allows `Esc` close while busy. |
| `trapFocus` | `boolean` | `true` | no | Keeps keyboard focus inside the modal while open. |
| `lockScroll` | `boolean` | `true` | no | Locks page scroll while open. |
| `initialFocus` | `string \| HTMLElement \| ((panel) => HTMLElement)` | `null` | no | Initial focus target on open. |
| `className` | `string` | `""` | no | Extra panel/root classes. |
| `onOpen` | `(ctx) => void` | `null` | no | Fires after open completes. |
| `onBeforeClose` | `(meta) => boolean \| Promise<boolean>` | `null` | no | Can veto close by returning `false`. |
| `onClose` | `(meta) => void` | `null` | no | Fires after close completes. |

Events / callbacks:

| Callback | Payload | Returns | Description |
|---|---|---|---|
| `onOpen` | `{ modal, refs, state }` | `void` | Fired after the modal opens. |
| `onBeforeClose` | `meta` | `boolean \| Promise<boolean>` | Return `false` to block close. |
| `onClose` | `meta` | `void` | Fired after the modal closes. |

Returned API:

| Method | Arguments | Returns | Description |
|---|---|---|---|
| `open` | `content?, nextOptions?` | `Promise<void>` | Opens the modal and optionally swaps content/options first. |
| `close` | `meta?` | `Promise<boolean>` | Attempts to close and respects `onBeforeClose`. |
| `update` | `nextOptions?` | `void` | Updates modal options without remounting. |
| `setContent` | `content` | `void` | Replaces body content. |
| `setHeaderActions` | `headerActions` | `void` | Replaces header actions. |
| `setFooter` | `footer` | `void` | Replaces footer content. |
| `setTitle` | `title` | `void` | Updates header title. |
| `setBusy` | `isBusy, { message? }` | `void` | Toggles helper-owned busy lock state. |
| `isBusy` | none | `boolean` | Returns current busy state. |
| `getState` | none | `object` | Returns current modal state snapshot. |
| `destroy` | none | `void` | Removes DOM and listeners. |

Returned refs:

- `panel`
- `body`
- `header`
- `title`
- `closeButton`
- `backdrop`

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

Related demos:

- `demos/demo.modal.html`

### `createActionModal(options)` (`js/ui/ui.modal.js`)

Purpose:

- Faster modal setup when footer buttons are known up front.

Factory:

```js
import { createActionModal } from "./js/ui/ui.modal.js";

const modal = createActionModal(options);
```

Options:

| Option | Type | Default | Required | Description |
|---|---|---:|---|---|
| All `createModal(...)` options | inherited | inherited | no | Base modal-shell options remain available. |
| `autoBusy` | `boolean` | `true` | no | Automatically enters busy state for promise-returning actions. |
| `headerActions` | `Action[]` | `[]` | no | Declarative header action buttons. |
| `actions` | `Action[]` | `[]` | no | Declarative footer action buttons. |

Action object contract:

| Property | Type | Default | Required | Description |
|---|---|---:|---|---|
| `id` | `string` | `""` | no | Stable action identifier. |
| `label` | `string` | - | yes | Visible button label. |
| `variant` | `"default" \| "primary" \| "danger" \| "ghost"` | `"default"` | no | Shared button emphasis preset. |
| `icon` | `string` | `null` | no | SVG/HTML icon markup. |
| `iconPosition` | `"start" \| "end"` | `"start"` | no | Icon placement relative to label. |
| `iconOnly` | `boolean` | `false` | no | Renders icon-only action. |
| `ariaLabel` | `string` | `""` | no | Accessible label for icon-only actions. |
| `busyMessage` | `string` | `""` | no | Per-action busy text when auto-busy is active. |
| `closeOnClick` | `boolean` | `true` | no | Controls default close on truthy result. |
| `disabled` | `boolean` | `false` | no | Starts the action disabled. |
| `autoFocus` | `boolean` | `false` | no | Autofocuses the action on open. |
| `onClick` | `({ action, modal, event, placement }) => any` | `null` | no | Action click handler; can return `false` to keep the modal open. |

Events / callbacks:

| Callback | Payload | Returns | Description |
|---|---|---|---|
| `action.onClick` | `{ action, modal, event, placement }` | `any \| Promise<any>` | Action handler for header/footer buttons. |

Returned API:

| Method | Arguments | Returns | Description |
|---|---|---|---|
| All `createModal(...)` methods | inherited | inherited | Base modal API remains available. |
| `setHeaderActions` | `actions[]` | `void` | Replaces declarative header actions. |
| `setActions` | `actions[]` | `void` | Replaces declarative footer actions. |

Auto-busy behavior:

- if `autoBusy !== false` and an action `onClick(...)` returns a promise:
  - modal enters busy state before awaiting the promise
  - modal leaves busy state after resolve/reject
  - duplicate action clicks are ignored while busy
- close rules remain normal:
  - resolved `false` keeps the modal open
  - rejected promise keeps the modal open
  - resolved truthy value closes when `closeOnClick !== false`

Related demos:

- `demos/demo.action.modal.html`

### `createWindowManager(options)` (`js/ui/ui.window.js`)

Purpose:

- Shared desktop-style window manager for non-modal floating tools that need drag, resize, stacking, minimize, and maximize behavior.

Factory:

```js
import { createWindowManager } from "./js/ui/ui.window.js";

const manager = createWindowManager(options);
```

Manager options:

| Option | Type | Default | Required | Description |
|---|---|---:|---|---|
| `container` | `HTMLElement \| null` | `document.body` | no | Host surface for the manager layer and taskbar. |
| `bounds` | `"viewport"` | `"viewport"` | no | Clamps movement and resize to the manager viewport. |
| `showTaskbar` | `boolean` | `true` | no | Enables manager-owned taskbar rendering. |
| `taskbarMode` | `"auto" \| "always" \| "minimized-only"` | `"auto"` | no | Controls whether the taskbar behaves like a workspace window list or a minimized-only recovery strip. |
| `showTaskbarClose` | `boolean` | `true` | no | Shows inline close affordances on taskbar items for closable windows. |
| `taskbarItemOrder` | `"open-order" \| "z-order"` | `"open-order"` | no | Controls taskbar item ordering. |
| `className` | `string` | `""` | no | Extra class names applied to the manager root. |
| `onWindowOpen` | `({ id, window, state }) => void` | `null` | no | Fires after a window opens. |
| `onWindowClose` | `({ id, window, state, meta? }) => void` | `null` | no | Fires after a window closes. |
| `onActiveChange` | `({ id, window, state }) => void` | `null` | no | Fires when active/focused window changes. |

Window factory:

```js
const win = manager.createWindow(options);
```

Window options:

| Option | Type | Default | Required | Description |
|---|---|---:|---|---|
| `id` | `string` | auto-generated | no | Stable window identifier. |
| `title` | `string` | `"Window"` | no | Title-bar label. |
| `content` | `Node \| string \| (window) => Node \| string` | `null` | no | Window body content or content factory. |
| `width` | `number` | `420` | no | Initial window width in pixels. |
| `height` | `number` | `320` | no | Initial window height in pixels. |
| `x` | `number` | centered | no | Initial x position. |
| `y` | `number` | centered | no | Initial y position. |
| `minWidth` | `number` | `280` | no | Minimum resize width. |
| `minHeight` | `number` | `180` | no | Minimum resize height. |
| `draggable` | `boolean` | `true` | no | Enables title-bar drag. |
| `resizable` | `boolean` | `true` | no | Enables edge and corner resize handles. |
| `minimizable` | `boolean` | `true` | no | Enables minimize action and taskbar recovery. |
| `maximizable` | `boolean` | `true` | no | Enables maximize and restore behavior. |
| `closable` | `boolean` | `true` | no | Enables close action. |
| `initialState` | `"normal" \| "maximized" \| "minimized"` | `"normal"` | no | Initial state applied after creation. |
| `className` | `string` | `""` | no | Extra class names for the window root. |
| `headerActions` | `Array<Action>` | `[]` | no | Extra title-bar actions before minimize/maximize/close controls. |
| `onOpen` | `({ state }) => void` | `null` | no | Fires when this window opens. |
| `onClose` | `({ state, meta? }) => void` | `null` | no | Fires when this window closes. |
| `onFocus` | `({ state }) => void` | `null` | no | Fires when this window becomes active. |
| `onMove` | `({ state }) => void` | `null` | no | Fires after drag-based position changes. |
| `onResize` | `({ state }) => void` | `null` | no | Fires after resize changes. |
| `onStateChange` | `({ type, state }) => void` | `null` | no | Fires on minimize, maximize, restore, move, and resize transitions. |

Header action object contract:

| Property | Type | Default | Required | Description |
|---|---|---:|---|---|
| `id` | `string` | `""` | no | Stable action identifier. |
| `label` | `string` | - | yes | Visible or accessible action label. |
| `variant` | `"default" \| "ghost" \| "primary" \| "danger"` | `"ghost"` | no | Shared title-bar action emphasis. |
| `title` | `string` | `""` | no | Native tooltip text. |
| `ariaLabel` | `string` | `""` | no | Accessible label for icon-style actions. |
| `onClick` | `({ manager, window, action, event }) => any` | `null` | no | Header action click handler. |

Returned manager API:

| Method | Arguments | Returns | Description |
|---|---|---|---|
| `createWindow` | `options` | `WindowInstance` | Creates and registers a managed window. |
| `getWindows` | none | `WindowInstance[]` | Returns the current window instances. |
| `getTaskbarWindows` | none | `WindowInstance[]` | Returns windows currently represented in the taskbar in rendered order. |
| `focusWindow` | `id` | `boolean` | Brings the matching window to front. |
| `closeWindow` | `id, meta?` | `boolean` | Closes one window by id. |
| `closeAll` | `meta?` | `void` | Closes all windows. |
| `destroy` | none | `void` | Removes the manager layer, taskbar, and window DOM. |

Taskbar behavior:

- `taskbarMode: "auto"` resolves to:
  - `"minimized-only"` for body-level managers
  - `"always"` for contained workspace-style managers
- `taskbarMode: "always"` keeps all open windows in the taskbar for desktop-style switching
- clicking a non-minimized taskbar item focuses it
- clicking a minimized taskbar item restores and focuses it
- if taskbar items exceed available width, the taskbar scrolls horizontally instead of shrinking items into unreadable pills

Returned window API:

| Method | Arguments | Returns | Description |
|---|---|---|---|
| `open` | none | `boolean` | Opens the window if closed. |
| `close` | `meta?` | `boolean` | Closes the window. |
| `focus` | none | `boolean` | Activates and raises the window. |
| `minimize` | none | `boolean` | Minimizes the window into the taskbar. |
| `maximize` | none | `boolean` | Maximizes the window to manager bounds. |
| `restore` | none | `boolean` | Restores from minimized or maximized state. |
| `setTitle` | `title` | `void` | Replaces title-bar text. |
| `setContent` | `content` | `void` | Replaces body content. |
| `setPosition` | `{ x, y }` | `void` | Updates window position with bounds clamping. |
| `setSize` | `{ width, height }` | `void` | Updates window size with min/bounds enforcement. |
| `getState` | none | `object` | Returns current id, title, rect, z-index, and state flags. |
| `destroy` | none | `void` | Fully disposes the instance. |

Behavior notes:

- V1 is intentionally narrow:
  - drag by title bar
  - resize by edges/corners
  - active-window stacking
  - minimize/maximize/restore
  - manager-owned taskbar recovery
- V1 does not include:
  - docking
  - snapping
  - tiled layouts
  - saved workspace persistence

Related demos:

- `demos/demo.window.html`
- `demos/demo.window.manager.html`

### `createIframeHost(options)` (`js/ui/ui.iframe.host.js`)

Purpose:

- Shared iframe surface for embedded PBB applications or local helper-owned fixtures, designed to compose over `ui.window` without widening the window subsystem.
- When used as window content, the iframe host can occupy the full window body instead of inheriting generic body padding.

Factory:

```js
import { createIframeHost } from "./js/ui/ui.iframe.host.js";

const iframeHost = createIframeHost(options);
```

Options:

| Option | Type | Default | Required | Description |
|---|---|---:|---|---|
| `src` | `string` | `""` | no | URL loaded into the iframe. |
| `srcdoc` | `string` | `""` | no | Inline document markup used instead of `src` when provided. |
| `title` | `string` | `"Embedded content"` | no | Accessible iframe title. |
| `loadingText` | `string` | `"Loading embedded page..."` | no | Helper-owned loading message. |
| `errorTitle` | `string` | `"Unable to load embedded page"` | no | Helper-owned error heading. |
| `errorMessage` | `string` | `"Check the requested URL or embedded app availability."` | no | Helper-owned error message body. |
| `sandbox` | `string` | documented default | no | Raw iframe sandbox attribute. |
| `referrerPolicy` | `string` | `"strict-origin-when-cross-origin"` | no | Referrer policy applied to the iframe. |
| `allow` | `string` | `""` | no | Raw iframe `allow` attribute. |
| `allowFullscreen` | `boolean` | `false` | no | Adds `allowfullscreen` when needed. |
| `className` | `string` | `""` | no | Extra classes applied to the host root. |
| `onLoad` | `(state) => void` | `null` | no | Fires after a successful iframe load. |
| `onError` | `(state) => void` | `null` | no | Fires when the helper enters an error state. |

Returned API:

| Property / Method | Arguments | Returns | Description |
|---|---|---|---|
| `root` | - | `HTMLElement` | Root host surface. |
| `iframe` | - | `HTMLIFrameElement` | Managed iframe element. |
| `getSrc` | none | `string` | Current `src` value. |
| `setSrc` | `url` | `void` | Replaces the current iframe URL and clears `srcdoc`. |
| `reload` | none | `void` | Reloads the current source. |
| `update` | `options` | `void` | Applies partial option updates. |
| `getState` | none | `object` | Returns current source, title, status, and error state. |
| `destroy` | none | `void` | Removes helper-owned DOM and listeners. |

Behavior notes:

- V1 owns:
  - iframe DOM creation
  - loading surface
  - deterministic error surface for empty/invalid source
  - narrow source changes via `setSrc(...)` and `update(...)`
  - full-bleed composition inside `ui.window` through helper-owned content-fill markers
- V1 intentionally does not own:
  - cross-frame messaging
  - auth brokering
  - Workspace launcher logic
  - automatic embedded title sync
- The dedicated demo uses a same-origin fixture file for deterministic browser behavior:
  - `samples/iframe/iframe-host.fixture.html`

Composition example:

```js
const iframeHost = createIframeHost({
  src: "/pbb/hq/",
  title: "PBB HQ",
});

const win = manager.createWindow({
  title: "PBB HQ",
  content: iframeHost.root,
});
```

Related demos:

- `demos/demo.iframe.host.html`

### `installWorkspaceUiBridgeHost(options)`, `getWorkspaceUiBridge(options)`, `showWorkspaceActionModal(payload, options)` (`js/ui/ui.workspace.bridge.js`)

Purpose:

- Explicit trusted bridge between a parent workspace shell and iframe-hosted child apps so helper-owned overlays can render in the parent document instead of being trapped inside the iframe.

Design rule:

- parent host owns the rendered overlay surfaces
- child helpers delegate only when a trusted bridge is available
- local iframe rendering remains the fallback

Parent host:

```js
import { installWorkspaceUiBridgeHost } from "./js/ui/ui.workspace.bridge.js";

const host = installWorkspaceUiBridgeHost({
  trustedOrigins: [window.location.origin],
});
```

Child helper:

```js
import { getWorkspaceUiBridge } from "./js/ui/ui.workspace.bridge.js";

const bridge = getWorkspaceUiBridge();
const available = await bridge.isAvailable();
```

Parent options:

| Option | Type | Default | Description |
|---|---|---:|---|
| `trustedOrigins` | `string[]` | `[window.location.origin, "null"]` | Allowed child origins for bridge requests. |
| `toastOptions` | `object` | `{}` | Passed to the parent-owned toast stack. |
| `parent` | `HTMLElement` | `document.body` | Parent document node used for delegated modal/dialog rendering. |

Child options:

| Option | Type | Default | Description |
|---|---|---:|---|
| `timeoutMs` | `number` | `900` | Bridge request timeout in milliseconds. |
| `targetOrigin` | `string` | `"*"` | `postMessage` target origin. |

Child API:

| Method | Arguments | Returns | Description |
|---|---|---|---|
| `isAvailable` | none | `Promise<boolean>` | Probes for a trusted parent bridge host. |
| `showToast` | `payload` | `Promise<string \| null>` | Requests parent-owned toast rendering. |
| `dismissToast` | `id` | `Promise<boolean>` | Dismisses a delegated toast by id. |
| `clearToasts` | none | `Promise<boolean>` | Clears delegated toasts. |
| `alert` | `payload` | `Promise<any>` | Delegates `uiAlert(...)` behavior to the parent host. |
| `confirm` | `payload` | `Promise<any>` | Delegates `uiConfirm(...)` behavior to the parent host. |
| `prompt` | `payload` | `Promise<any>` | Delegates `uiPrompt(...)` behavior to the parent host. |
| `showActionModal` | `payload` | `Promise<object>` | Requests a parent-owned simple action modal. |

V1 scope:

- delegated toast delivery
- delegated alert / confirm / prompt dialogs
- explicit parent-owned simple action modal

V1 non-goals:

- automatic `createModal(...)` delegation
- automatic `createFormModal(...)` delegation
- arbitrary parent command execution
- auth brokering or iframe/session ownership

Related demos:

- `demos/demo.workspace.bridge.html`
- `demos/demo.iframe.host.html`

### `createFormModal(options)` (`js/ui/ui.form.modal.js`)

Purpose:

- Schema-driven helper for short modal-bound forms such as login, re-auth, and simple CRUD flows.

Architecture:

- Composes over `createActionModal(...)`
- Reuses helper-owned modal busy-state, close, and focus behavior
- Keeps the public action contract narrow to helper-owned cancel/submit flows with additive `extraActions` support in V1

Factory:

```js
import { createFormModal } from "./js/ui/ui.form.modal.js";

const formModal = createFormModal(options);
```

Options:

| Option | Type | Default | Required | Description |
|---|---|---:|---|---|
| Safe modal options | inherited | inherited | no | Accepts modal-shell options such as `title`, `size`, `className`, `showCloseButton`, `closeOnBackdrop`, `closeOnEscape`, `busyMessage`. |
| `rows` | `Array<Array<FormItem>>` | `[]` | yes | Strict V1 row model for form body layout. |
| `initialValues` | `object` | `{}` | no | Initial field values keyed by field name. |
| `context` | `{ badge?, summary?, kind? }` | `null` | no | Narrow top-level context strip for acceptance-target flows such as geodata-driven hub editing. |
| `mode` | `string` | `""` | no | Declarative form mode used by first-pass rule evaluation. |
| `extraActions` | `Array<FormModalExtraAction>` | `[]` | no | Additive footer actions rendered before helper-owned `Cancel` and `Submit`. Reserved IDs: `cancel`, `submit`. |
| `extraActionsPlacement` | `"start" \| "end"` | `"end"` | no | Places additive footer actions either in the same end cluster or split to the start side of the footer. |
| `submitLabel` | `string` | `"Submit"` | no | Submit action label. |
| `cancelLabel` | `string` | `"Cancel"` | no | Cancel action label. |
| `submitVariant` | `string` | `"primary"` | no | Submit button variant. |
| `submitIcon` | `string` | `null` | no | Submit button icon markup. |
| `cancelIcon` | `string` | `null` | no | Cancel button icon markup. |
| `closeOnSuccess` | `boolean` | `true` | no | Closes modal on truthy submit result. |
| `onSubmit` | `(values, ctx) => any` | `null` | no | Submit handler. |
| `onChange` | `(values, ctx) => void` | `null` | no | Fires on form value change. |

Supported V1 item types:

- `text`
- `alert`
- `divider`
- `hidden`
- `display`
- `ui.select`
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

Password-input note:

- `input: "password"` rows now compose over the shared `createPasswordField(...)` primitive so login, re-auth, and standalone password entry all use the same show/hide behavior.

Field properties:

- `name`
- `label`
- `value`
- `placeholder`
- `required`
- `requiredOn`
- `disabled`
- `readonly`
- `readonlyOn`
- `hiddenOn`
- `autocomplete`
- `min`
- `max`
- `step`
- `options`
- `help`
- `span`

`ui.select` field properties:

- `options` or `items`
- `placeholder`
- `emptyText`
- `searchable`
- `multiple`
- `closeOnSelect`
- `selectOnTab`
- `clearable`

Row model:

| Row shape | Behavior |
|---|---|
| 1 item | Full-width row |
| 2 items | Equal-width two-column row |
| More than 2 items | Rejected or normalized conservatively in V1 |

Layout notes:

- `span: 2` allows an item to span both row columns while preserving the narrow two-column model.
- `hidden` items do not count toward the visible row-column layout.

Events / callbacks:

| Callback | Payload | Returns | Description |
|---|---|---|---|
| `onSubmit` | `values, ctx` | `any \| Promise<any>` | Submit handler. Truthy result closes by default. |
| `extraActions[].onClick` | `values, ctx` | `any \| Promise<any>` | Additive footer action callback. Defaults to non-closing behavior unless `closeOnClick: true` is explicitly provided. |
| `onChange` | `values, ctx` | `void` | Fires on field changes. |

Returned API:

| Method | Arguments | Returns | Description |
|---|---|---|---|
| Modal instance methods | inherited | inherited | Includes `open()`, `close()`, `destroy()`, `setBusy()`, `isBusy()`. |
| `update` | `nextOptions` | `void` | Re-renders form rows/options and updates the composed action modal. |
| `getState` | none | `object` | Returns modal state plus current `mode` and current form `values`. |
| `getValues` | none | `object` | Returns current form values. |
| `setValues` | `values` | `void` | Updates current form values. |
| `setErrors` | `fieldErrors` | `void` | Applies field-level errors by field name. |
| `clearErrors` | none | `void` | Clears field-level errors. |
| `setFormError` | `message` | `void` | Applies a form-level error message. |
| `clearFormError` | none | `void` | Clears the form-level error message. |
| `applyApiErrors` | `response` | `{ fieldErrors, formError }` | Maps common backend error payloads onto helper field/form errors. |

Submit context helpers:

| Helper | Arguments | Returns | Description |
|---|---|---|---|
| `ctx.setErrors` | `fieldErrors` | `void` | Applies field errors from submit logic. |
| `ctx.setFormError` | `message` | `void` | Applies a form-level error from submit logic. |
| `ctx.applyApiErrors` | `response` | `{ fieldErrors, formError }` | Maps common backend error shapes into helper field/form errors. |
| `ctx.mode` | none | `string` | Current declarative form mode. |

Validation and submit behavior:

- helper owns required/basic validation
- app owns domain/business validation
- first invalid field receives focus on helper validation failure
- truthy async submit result closes by default
- falsy or rejected submit keeps the modal open
- `extraActions` render before helper-owned `Cancel` and `Submit`, stay additive, and disable together with the rest of the footer during helper-owned busy state
- `extraActionsPlacement: "start"` visually splits the last extra action away from the helper-owned `Cancel` and `Submit` cluster
- `requiredOn`, `hiddenOn`, and `readonlyOn` are first-pass declarative mode rules
- `context` is intentionally narrow and exists to cover real acceptance-target header/context needs without reopening a larger form-builder surface
- `display` is visual-only and does not participate in payload output
- `hidden` participates in payload output without rendering visible validation UI
- dotted backend error keys such as `uplink_hub_ids.0` map back onto the base field when possible
- `ui.select` hosts the existing shared select helper inside the form modal instead of introducing a second select system
- hosted `ui.select` menus render in a floating body-level layer so they are not clipped by modal or drawer overflow containers

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

Related demos:

- `demos/demo.dialog.alert.html`
- `demos/demo.dialog.confirm.html`
- `demos/demo.dialog.prompt.html`

### `createLoginFormModal(options)`, `createReauthFormModal(options)`, `createStatusUpdateFormModal(options)`, `createReasonFormModal(options)`, `createAccountFormModal(options)`, `createChangePasswordFormModal(options)` (`js/ui/ui.form.modal.presets.js`)

Purpose:

- Prebuilt auth wrappers over `createFormModal(...)` for shared cross-project consistency.

Design rule:

- wrappers own structure and defaults
- engineers can still provide field-name mappings and submit behavior

Preset summary:

| Factory | Primary use | App-supplied vocabulary | Field remapping |
|---|---|---|---|
| `createLoginFormModal(...)` | Shared login flow | no | `identifier`, `password` |
| `createReauthFormModal(...)` | Re-auth/session confirmation | no | `identifier`, `password` |
| `createStatusUpdateFormModal(...)` | Operational status update | `statusOptions` | `status`, `remarks`, `notify` |
| `createReasonFormModal(...)` | Categorized reason-required flow | `reasonOptions` | `reasonCode`, `reasonDetails`, `confirmText`, `notify` |
| `createAccountFormModal(...)` | Shared account/profile edit flow | no | `name`, `email` |
| `createChangePasswordFormModal(...)` | Shared password-change flow | no | `currentPassword`, `newPassword`, `confirmPassword` |

Common preset rules:

| Rule | Description |
|---|---|
| Structure ownership | Helper owns row structure, ordering, and validation defaults. |
| Field-name mapping | Engineers can remap payload field names to match project backends. |
| Busy behavior | Presets reuse `createFormModal(...)` busy submit handling. |
| Submit behavior | App code still owns the actual `onSubmit(values, ctx)` implementation. |
| Session expiry detection | Re-auth auto-launch is app-owned. `createReauthFormModal(...)` does not monitor timeout state or open itself. |

Preset options:

| Factory | Notable options |
|---|---|
| `createLoginFormModal(...)` | `title`, `message`, `submitLabel`, `busyMessage`, `identifierKind`, `identifierLabel`, `identifierPlaceholder`, `identifierAutocomplete`, `passwordLabel`, `passwordPlaceholder`, `fields`, `initialValues`, `onSubmit` |
| `createReauthFormModal(...)` | `title`, `message`, `submitLabel`, `busyMessage`, `identifierKind`, `identifierLabel`, `identifierValue`, `passwordLabel`, `passwordPlaceholder`, `fields`, `initialValues`, `onSubmit` |
| `createStatusUpdateFormModal(...)` | `title`, `message`, `submitLabel`, `busyMessage`, `statusOptions`, `statusLabel`, `remarksLabel`, `remarksPlaceholder`, `showNotify`, `notifyLabel`, `fields`, `initialValues`, `onSubmit` |
| `createReasonFormModal(...)` | `title`, `message`, `submitLabel`, `busyMessage`, `reasonOptions`, `reasonLabel`, `detailsLabel`, `detailsPlaceholder`, `confirmPhrase`, `confirmLabel`, `showNotify`, `notifyLabel`, `fields`, `initialValues`, `onSubmit` |
| `createAccountFormModal(...)` | `title`, `message`, `submitLabel`, `busyMessage`, `nameLabel`, `namePlaceholder`, `emailLabel`, `emailPlaceholder`, `fields`, `initialValues`, `extraRows`, `extraActions`, `extraActionsPlacement`, `onSubmit` |
| `createChangePasswordFormModal(...)` | `title`, `message`, `submitLabel`, `busyMessage`, `currentPasswordLabel`, `currentPasswordPlaceholder`, `newPasswordLabel`, `newPasswordPlaceholder`, `confirmPasswordLabel`, `confirmPasswordPlaceholder`, `fields`, `initialValues`, `onSubmit` |

Returned API:

| Method | Arguments | Returns | Description |
|---|---|---|---|
| Preset instance methods | inherited | inherited | Presets return the same API shape as `createFormModal(...)`. |

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

Re-auth implementation note:

- `createReauthFormModal(...)` is a UI wrapper, not a session watchdog.
- Detect expiry in app code through:
  - `401` / `419` API responses
  - an app-owned idle/session timer
  - an explicit backend "session expired" contract
- Keep one reusable re-auth modal instance near the authenticated app shell.
- When expiry is detected:
  - pause or defer the protected action
  - open the shared re-auth modal
  - on successful re-auth, resume or retry the blocked action if appropriate
- Do not let each screen create its own competing re-auth modal instance.

Related demos:

- `demos/demo.form.modal.html`
- `demos/demo.form.modal.login.html`
- `demos/demo.form.modal.reauth.html`
- `demos/demo.form.modal.account.html`
- `demos/demo.form.modal.change.password.html`
- `demos/demo.form.modal.status.html`
- `demos/demo.form.modal.reason.html`

### `uiAlert(message, options)`, `uiConfirm(message, options)`, `uiPrompt(message, options)` (`js/ui/ui.dialog.js`)

Purpose:

- Promise-based convenience dialogs built on top of `createActionModal(...)`.

Factory:

```js
const result = await uiConfirm(message, options);
```

Shared options:

| Option | Type | Default | Applies to | Description |
|---|---|---:|---|---|
| Modal shell options | inherited | inherited | all | Supports shell options such as `title`, `size`, `className`, `showCloseButton`, `allowBackdropClose`, `allowEscClose`. |
| `headerActions` | `Action[]` | `[]` | all | Declarative header actions using the same contract as `createActionModal(...)`. |
| `variant` | `"default" \| "success" \| "info" \| "warning" \| "error"` | `"default"` | all | Dialog-level semantic styling. |
| `description` | `string` | `""` | all | Secondary guidance text shown below the main message. |
| `showVariantIcon` | `boolean` | `true` for non-default variants | all | Suppresses built-in semantic status icon when `false`. |
| `variantIcon` | `string` | `null` | all | Custom SVG markup replacing the built-in semantic icon. |
| `speak` | `boolean` | `false` | all | Speaks dialog content after open. |
| `speakText` | `string` | `""` | all | Custom speech text override. |
| `voiceName` | `string` | `""` | all | Preferred speech-synthesis voice. |
| `speakRate` | `number` | speech default | all | Speech rate override. |
| `speakPitch` | `number` | speech default | all | Speech pitch override. |
| `speakVolume` | `number` | speech default | all | Speech volume override. |

Variant behavior:

| Variant | Default primary emphasis |
|---|---|
| `default` | standard button emphasis |
| `success` | `primary` |
| `info` | `primary` |
| `warning` | `danger` for confirm/prompt primary action |
| `error` | `danger` for confirm/prompt primary action |

Action-icon options:

| Helper | Icon options |
|---|---|
| `uiAlert(...)` | `okIcon`, `okIconPosition`, `okIconOnly`, `okAriaLabel` |
| `uiConfirm(...)` | `cancelIcon`, `cancelIconPosition`, `cancelIconOnly`, `cancelAriaLabel`, `confirmIcon`, `confirmIconPosition`, `confirmIconOnly`, `confirmAriaLabel` |
| `uiPrompt(...)` | `cancelIcon`, `cancelIconPosition`, `cancelIconOnly`, `cancelAriaLabel`, `submitIcon`, `submitIconPosition`, `submitIconOnly`, `submitAriaLabel` |

Returned values:

| Helper | Returns |
|---|---|
| `uiAlert(...)` | `Promise<void>` |
| `uiConfirm(...)` | `Promise<boolean>` |
| `uiPrompt(...)` | `Promise<string \| null>` |

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

Related demos:

- `demos/demo.command.palette.html`

### `createToastStack(options)` (`js/ui/ui.toast.js`)

Purpose:

- Global toast-notification stack for transient feedback, semantic status messaging, and optional speech synthesis.

Factory:

```js
import { createToastStack } from "./js/ui/ui.toast.js";

const toasts = createToastStack(options);
```

Options:

| Option | Type | Default | Required | Description |
|---|---|---:|---|---|
| `position` | `string` | `"top-right"` | no | Toast stack placement. |
| `maxVisible` | `number` | `4` | no | Maximum visible toasts before queueing. |
| `duration` | `number` | `4000` | no | Default auto-dismiss duration in milliseconds. |
| `speak` | `boolean` | `false` | no | Enables speech synthesis for matching toasts. |
| `speakTypes` | `string[]` | `[]` | no | Restricts speech to selected toast variants. |
| `voiceName` | `string` | `""` | no | Preferred speech voice. |
| `speakRate` | `number` | speech default | no | Speech rate override. |
| `speakPitch` | `number` | speech default | no | Speech pitch override. |
| `speakVolume` | `number` | speech default | no | Speech volume override. |
| `speakFormatter` | `(toast) => string` | `null` | no | Custom speech text formatter. |
| `speakCooldownMs` | `number` | `0` | no | Prevents repeated speech in quick succession. |
| `waitForSpeechBeforeDismiss` | `boolean` | `true` | no | Defers auto-dismiss countdown until speech ends. |
| `showVariantIcon` | `boolean` | `true` | no | Shows built-in semantic icons by default. |
| `variantIcon` | `string` | `null` | no | Replaces built-in semantic icon globally. |

Per-toast `show(...)` options:

| Option | Type | Default | Description |
|---|---|---:|---|
| `type` | `"info" \| "success" \| "warning" \| "error"` | `"info"` | Semantic toast variant. |
| `title` | `string` | `""` | Optional toast heading. |
| `duration` | `number` | stack default | Per-toast auto-dismiss duration. |
| `showVariantIcon` | `boolean` | stack/default behavior | Suppresses semantic icon per toast. |
| `variantIcon` | `string` | `null` | Custom icon per toast. |
| `speak` | `boolean` | stack/default behavior | Enables or suppresses speech per toast. |
| `voiceName` | `string` | stack/default behavior | Per-toast voice override. |

Returned API:

| Method | Arguments | Returns | Description |
|---|---|---|---|
| `show` | `message, options?` | `string \| object` | Adds a toast and returns a handle/id. |
| `dismiss` | `id` | `void` | Removes a single toast. |
| `clear` | none | `void` | Clears all toasts. |
| `getVoices` | none | `SpeechSynthesisVoice[]` | Returns available voices for UI selection. |
| `getState` | none | `object` | Returns current queue/visible state. |
| `destroy` | none | `void` | Removes stack DOM and listeners. |

Behavior notes:

- Dialog and toast semantic icons share the same helper-owned icon language.
- Speech is opt-in and should remain explicit in app integrations.
- When `waitForSpeechBeforeDismiss` is enabled, spoken toasts remain visible until narration completes.

Example:

```js
import { createToastStack } from "./js/ui/ui.toast.js";

const toasts = createToastStack({
  speak: true,
  speakTypes: ["error"],
});

toasts.show("Settings saved.", { type: "success", title: "Saved" });
toasts.show("Unable to reach gateway.", { type: "error", speak: true });
```

Related demos:

- `demos/demo.tree.html`

### `createGrid(container, rows, options)` (`js/ui/ui.grid.js`)

Purpose:

- Reusable data grid/table for local and remote data flows.

Modes:

| Mode | Behavior |
|---|---|
| `local` | Grid applies search, sort, and pagination internally. |
| `remote` | Grid emits query changes; parent fetches and updates rows. |

Factory:

```js
import { createGrid } from "./js/ui/ui.grid.js";

const grid = createGrid(container, rows, options);
```

Options:

| Option | Type | Default | Required | Description |
|---|---|---:|---|---|
| `mode` | `"local" \| "remote"` | `"local"` | no | Chooses internal vs app-owned querying behavior. |
| `columns` | `Column[]` | `[]` | yes | Column definitions. |
| `rowKey` | `string \| ((row, index) => key)` | `"id"` | no | Stable row identifier. |
| `selectable` | `"none" \| "single" \| "multi"` | `"none"` | no | Selection mode. |
| `selectedKeys` | `Array<string \| number>` | `[]` | no | Initial selected rows. |
| `enableSort` | `boolean` | `false` | no | Enables sorting UI and state. |
| `enableSearch` | `boolean` | `false` | no | Enables search UI and query state. |
| `enablePagination` | `boolean` | `false` | no | Enables paging UI and state. |
| `enableColumnResize` | `boolean` | `false` | no | Enables resizable columns. |
| `enableVirtualization` | `boolean` | `false` | no | Enables row virtualization for large sets. |
| `minColumnWidth` | `number` | `72` | no | Minimum resizable column width. |
| `columnWidths` | `object` | `{}` | no | Per-column width overrides keyed by `column.key`. |
| `wrapCellContent` | `boolean` | `true` | no | Global cell wrapping behavior. |
| `search` | `string` | `""` | no | Initial search term. |
| `searchPlaceholder` | `string` | `"Search"` | no | Search field placeholder. |
| `page` | `number` | `1` | no | Current page. |
| `pageSize` | `number` | `20` | no | Rows per page. |
| `pageSizeOptions` | `number[]` | component default | no | Page-size choices. |
| `totalRows` | `number` | local row count | no | Remote-mode total row count. |
| `virtualRowHeight` | `number` | `40` | no | Virtualized row height. |
| `virtualOverscan` | `number` | `8` | no | Extra rows rendered outside viewport. |
| `virtualThreshold` | `number` | `80` | no | Row-count threshold before virtualization becomes active. |
| `loading` | `boolean` | `false` | no | Loading state. |
| `errorText` | `string` | `""` | no | Error state copy. |
| `emptyText` | `string` | `"No rows."` | no | Empty state copy. |

Column definition:

| Property | Type | Default | Description |
|---|---|---:|---|
| `key` | `string` | - | Required stable column id. |
| `label` | `string` | - | Header label. |
| `width` | `number \| string` | auto | Initial width. |
| `align` | `"left" \| "center" \| "right"` | `"left"` | Cell alignment. |
| `sortable` | `boolean` | inherited | Enables sorting for the column. |
| `wrap` | `boolean` | inherited | Per-column wrapping override. |
| `format` | `(value, row) => string` | `null` | Simple text formatting hook. |
| `renderCell` | `({ row, value, key, column }) => any` | `null` | Full custom cell rendering hook. |

Events / callbacks:

| Callback | Payload | Returns | Description |
|---|---|---|---|
| `onRowClick` | `row, meta` | `void` | Fires when a row is clicked. |
| `onSelectionChange` | `selectedRows, selectedKeys` | `void` | Fires when selection changes. |
| `onQueryChange` | `query` | `void` | Remote-mode query change callback. |
| `onColumnResize` | `{ key, width, columnWidths }` | `void` | Fires after a resize interaction. |

Returned API:

| Method | Arguments | Returns | Description |
|---|---|---|---|
| `update` | `nextRows, nextOptions?` | `void` | Re-renders rows/options without remounting. |
| `setRows` | `rows[]` | `void` | Replaces current rows. |
| `setQuery` | `query` | `void` | Updates grid query state. |
| `getQuery` | none | `object` | Returns current grid query. |
| `getSelectedRows` | none | `array` | Returns selected rows. |
| `clearSelection` | none | `void` | Clears selected rows. |
| `getState` | none | `object` | Returns grid state snapshot. |
| `destroy` | none | `void` | Removes DOM and listeners. |

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

Related demos:

- `demos/demo.grid.html`

### `createTreeGrid(container, options)` (`js/ui/ui.tree.grid.js`)

Purpose:

- Hierarchical grid with tree indentation in the first column, aligned tabular columns, tree-aware search, and optional virtualization.

Factory:

```js
import { createTreeGrid } from "./js/ui/ui.tree.grid.js";

const treeGrid = createTreeGrid(container, options);
```

Options:

| Option | Type | Default | Required | Description |
|---|---|---:|---|---|
| `columns` | `Column[]` | `[]` | yes | Column definitions for the tabular layout. |
| `rows` | `TreeRow[]` | `[]` | no | Initial tree rows. |
| `rowKey` | `string \| ((row) => key)` | `"id"` | no | Stable row identifier. |
| `expandAll` | `boolean` | `false` | no | Starts with all loaded nodes expanded. |
| `lazyLoadChildren` | `(node) => Promise<TreeRow[]>` | `null` | no | Loads children on demand for nodes with `hasChildren`. |
| `enableColumnResize` | `boolean` | `false` | no | Enables column resize behavior. |
| `enableVirtualization` | `boolean` | `false` | no | Enables fixed-row-height virtualization. |
| `virtualRowHeight` | `number` | component default | no | Virtualized row height. |
| `searchTerm` | `string` | `""` | no | Current tree-aware search term. |
| `searchFields` | `string[]` | `["label"]` | no | Fields included in search matching. |
| `autoExpandMatches` | `boolean` | `true` | no | Temporarily expands matching ancestor paths. |
| `highlightMatches` | `boolean` | `true` | no | Highlights all occurrences in rendered text. |
| `emptyText` | `string` | `"No rows."` | no | Normal empty state copy. |
| `emptySearchText` | `string` | `"No matching results."` | no | Empty state while search is active. |
| `chrome` | `boolean` | `true` | no | Removes outer shell when `false`. |

Events / callbacks:

| Callback | Payload | Returns | Description |
|---|---|---|---|
| `onRowClick` | `row, meta` | `void` | Fires when a visible tree row is clicked. |
| `onToggle` | `row, expanded` | `void` | Fires on expand/collapse. |
| `onSelectionChange` | `selectedRows, selectedKeys` | `void` | Fires when selection changes. |
| `onColumnResize` | `{ key, width, columnWidths }` | `void` | Fires after a resize interaction. |

Returned API:

| Method | Arguments | Returns | Description |
|---|---|---|---|
| `update` | `nextOptions?` | `void` | Updates tree-grid options/state. |
| `setRows` | `rows[]` | `void` | Replaces current tree data. |
| `setSearchTerm` | `term` | `void` | Applies tree-aware search term. |
| `clearSearch` | none | `void` | Clears current search state. |
| `expandAll` | none | `void` | Expands loaded nodes. |
| `collapseAll` | none | `void` | Collapses all nodes. |
| `getState` | none | `object` | Returns tree-grid state, including `search`. |
| `destroy` | none | `void` | Removes DOM and listeners. |

Behavior notes:

- Search is tree-aware rather than flat filtering.
- Matching descendants keep their ancestor path visible.
- `getState().search` includes:
  - `active`
  - `term`
  - `matchCount`
  - `visibleCount`

Related demos:

- `demos/demo.tree.grid.html`

### `createHierarchyMap(container, options)` (`js/ui/ui.hierarchy.map.js`)

Purpose:

- Hierarchy-first visual explorer for rooted structures with optional external-entity lane and overlay relationship links.

Factory:

```js
import { createHierarchyMap } from "./js/ui/ui.hierarchy.map.js";

const map = createHierarchyMap(container, options);
```

Options:

| Option | Type | Default | Required | Description |
|---|---|---:|---|---|
| `data` | `{ root, externals?, links? }` | `null` | yes | Rooted hierarchy plus optional overlay relationships. |
| `chrome` | `boolean` | `true` | no | Removes outer shell when `false`. |
| `layout` | `"org"` | `"org"` | no | Current hierarchy layout mode. |
| `orientation` | `"vertical" \| "horizontal"` | `"vertical"` | no | Primary hierarchy direction. |
| `nodeWidth` | `number` | component default | no | Node-card width. |
| `nodeHeight` | `number` | component default | no | Node-card height basis. |
| `levelGap` | `number` | component default | no | Gap between hierarchy levels. |
| `siblingGap` | `number` | component default | no | Gap between sibling nodes. |
| `externalLane` | `"right" \| "left"` | `"right"` | no | Side used for external entities. |
| `showOverlayLinks` | `boolean` | `true` | no | Shows secondary relationship links. |
| `showExternalNodes` | `boolean` | `true` | no | Shows external-entity lane. |
| `collapsible` | `boolean` | `true` | no | Enables node expand/collapse. |
| `lazyLoadChildren` | `(node) => Promise<Node[]>` | `null` | no | Loads node children on demand. |
| `searchTerm` | `string` | `""` | no | Tree-aware hierarchy search term. |
| `searchFields` | `string[]` | `["label", "type"]` | no | Fields included in matching. |
| `autoExpandMatches` | `boolean` | `true` | no | Expands matching paths while search is active. |
| `highlightMatches` | `boolean` | `true` | no | Highlights matching text in node labels. |
| `selectable` | `boolean` | `true` | no | Enables node/link selection. |
| `pan` | `boolean` | `true` | no | Enables viewport panning. |
| `zoom` | `boolean` | `true` | no | Enables zoom controls/gestures. |
| `fitOnOpen` | `boolean` | `true` | no | Fits hierarchy into viewport on open. |
| `minZoom` | `number` | `0.5` | no | Minimum zoom factor. |
| `maxZoom` | `number` | `2.5` | no | Maximum zoom factor. |
| `zoomStep` | `number` | `0.1` | no | Zoom increment size. |

Events / callbacks:

| Callback | Payload | Returns | Description |
|---|---|---|---|
| `onNodeClick` | `{ node, path }` | `void` | Fires when a node card is selected. |
| `onNodeToggle` | `{ node, expanded }` | `void` | Fires on expand/collapse. |
| `onLinkClick` | `{ link }` | `void` | Fires when an overlay link is selected. |
| `onSelectionChange` | `{ selectedNode, selectedLink }` | `void` | Fires on selection changes. |

Returned API:

| Method | Arguments | Returns | Description |
|---|---|---|---|
| `getData` | none | `object` | Returns current hierarchy data. |
| `getState` | none | `object` | Returns zoom, pan, selection, expansion, and search state. |
| `setData` | `nextData` | `void` | Replaces hierarchy data. |
| `update` | `nextOptions` | `void` | Updates map options. |
| `setSearchTerm` | `term` | `void` | Applies hierarchy search term. |
| `clearSearch` | none | `void` | Clears search state. |
| `expandNode` | `nodeId` | `void` | Expands a specific node. |
| `collapseNode` | `nodeId` | `void` | Collapses a specific node. |
| `toggleNode` | `nodeId` | `void` | Toggles a specific node. |
| `expandAll` | none | `void` | Expands loaded nodes. |
| `collapseAll` | none | `void` | Collapses all nodes. |
| `focusNode` | `nodeId` | `void` | Focuses/centers a node if possible. |
| `selectNode` | `nodeId` | `void` | Selects a node. |
| `selectLink` | `linkId` | `void` | Selects an overlay link. |
| `zoomIn` | none | `void` | Increases zoom. |
| `zoomOut` | none | `void` | Decreases zoom. |
| `resetView` | none | `void` | Resets pan/zoom. |
| `fitToView` | none | `void` | Fits current hierarchy into the viewport. |
| `destroy` | none | `void` | Removes DOM and listeners. |

Behavior notes:

- Primary hierarchy uses one parent per node.
- Secondary cross-relationships belong in `links`, not as second tree parents.
- External entities render in a side lane and overlay links remain secondary to the tree structure.

Related demos:

- `demos/demo.hierarchy.map.html`

### `createProgress(container, data, options)` (`js/ui/ui.progress.js`)

Purpose:

- General-purpose progress indicator with multiple rendering styles.
- Useful for upload, sync, workflow, and status-progress surfaces.

Factory:

```js
import { createProgress } from "./js/ui/ui.progress.js";

const progress = createProgress(container, data, options);
```

Data shape:

| Property | Type | Description |
|---|---|---|
| `value` | `number` | Current numeric value. |
| `label` | `string` | Display label. |
| `currentStep` | `number` | Current step for `steps` style. |
| `totalSteps` | `number` | Total steps for `steps` style. |

Options:

| Option | Type | Default | Required | Description |
|---|---|---:|---|---|
| `style` | `"linear" \| "striped" \| "gradient" \| "segmented" \| "steps" \| "radial" \| "ring" \| "indeterminate"` | `"linear"` | no | Progress render style. |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | no | Component size preset. |
| `showLabel` | `boolean` | `true` | no | Shows label text. |
| `showPercent` | `boolean` | `false` | no | Shows percent display. |
| `animate` | `boolean` | `false` | no | Enables animated progress updates. |
| `rounded` | `boolean` | `true` | no | Rounds track corners. |
| `glow` | `boolean` | `false` | no | Adds glow emphasis. |
| `indeterminate` | `boolean` | `false` | no | Forces indeterminate mode. |
| `min` | `number` | `0` | no | Minimum progress value. |
| `max` | `number` | `100` | no | Maximum progress value. |
| `segments` | `number` | component default | no | Segment count for segmented style. |
| `totalSteps` | `number` | data/default | no | Total steps fallback. |
| `color` | `string` | theme default | no | Track fill color override. |
| `trackColor` | `string` | theme default | no | Track background color override. |
| `ariaLabel` | `string` | `""` | no | Accessibility label. |
| `className` | `string` | `""` | no | Extra container class. |

Returned API:

| Method | Arguments | Returns | Description |
|---|---|---|---|
| `update` | `nextData, nextOptions?` | `void` | Re-renders progress data/options. |
| `setValue` | `value` | `void` | Updates numeric value. |
| `getState` | none | `object` | Returns progress state snapshot. |
| `destroy` | none | `void` | Removes DOM and listeners. |

Behavior notes:

- `data.value` is normalized against `min` / `max` for percent-based styles.
- `steps` style prefers `data.currentStep` / `data.totalSteps` and falls back to `options.totalSteps`.
- `indeterminate` rendering can be requested either by style or by `options.indeterminate`.

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

Related demos:

- `demos/demo.progress.html`

### `createVirtualList(container, items, options)` (`js/ui/ui.virtual.list.js`)

Purpose:

- Render large lists with stable performance via viewport virtualization/windowing.

Factory:

```js
import { createVirtualList } from "./js/ui/ui.virtual.list.js";

const list = createVirtualList(container, items, options);
```

Options:

| Option | Type | Default | Required | Description |
|---|---|---:|---|---|
| `height` | `number \| string` | component default | no | Viewport height. |
| `rowHeight` | `number` | component default | no | Fixed row height used for virtualization math. |
| `overscan` | `number` | component default | no | Extra rows rendered outside the viewport. |
| `emptyText` | `string` | `"No items."` | no | Empty state copy. |
| `className` | `string` | `""` | no | Extra container class. |
| `renderItem` | `(item, index) => HTMLElement \| string` | required in practice | no | Row renderer. |
| `onRangeChange` | `({ start, end }, state) => void` | `null` | no | Fires when visible window changes. |

Returned API:

| Method | Arguments | Returns | Description |
|---|---|---|---|
| `update` | `nextItems, nextOptions?` | `void` | Re-renders items/options. |
| `setItems` | `items` | `void` | Replaces current items. |
| `scrollToIndex` | `index, behavior?` | `void` | Scrolls the list to a given item index. |
| `getState` | none | `object` | Returns virtualization state. |
| `destroy` | none | `void` | Removes DOM and listeners. |

Related demos:

- `demos/demo.virtual.list.html`

### `createScheduler(container, data, options)` (`js/ui/ui.scheduler.js`)

Purpose:

- Render reusable scheduler/calendar primitives with month/week views.

Factory:

```js
import { createScheduler } from "./js/ui/ui.scheduler.js";

const scheduler = createScheduler(container, data, options);
```

Data shape:

| Property | Type | Description |
|---|---|---|
| `date` | `Date \| string` | Current focused date. |
| `events` | `Array<{ id, title, start, end?, color? }>` | Scheduler events. |

Options:

| Option | Type | Default | Required | Description |
|---|---|---:|---|---|
| `view` | `"month" \| "week"` | `"month"` | no | Current scheduler view. |
| `locale` | `string` | browser default | no | Locale for date formatting. |
| `weekStartsOn` | `number` | `0` | no | First day of week (`0..6`). |
| `events` | `array` | `[]` | no | Default event source if not passed in `data`. |
| `onViewChange` | `(view, state) => void` | `null` | no | Fires when view changes. |
| `onDateChange` | `(date, state) => void` | `null` | no | Fires when focused date changes. |
| `onSlotClick` | `({ date, view }, state) => void` | `null` | no | Fires when a slot is clicked. |
| `onEventClick` | `(event, state) => void` | `null` | no | Fires when an event is clicked. |

Returned API:

| Method | Arguments | Returns | Description |
|---|---|---|---|
| `update` | `nextData, nextOptions?` | `void` | Re-renders scheduler data/options. |
| `setView` | `view` | `void` | Changes active view. |
| `setDate` | `date` | `void` | Changes focused date. |
| `getState` | none | `object` | Returns scheduler state snapshot. |
| `destroy` | none | `void` | Removes DOM and listeners. |

Related demos:

- `demos/demo.scheduler.html`

### `createDatepicker(container, options)` (`js/ui/ui.datepicker.js`)

Purpose:

- Render a reusable date picker for single or range selection with optional time inputs.

Factory:

```js
import { createDatepicker } from "./js/ui/ui.datepicker.js";

const picker = createDatepicker(container, options);
```

Options:

| Option | Type | Default | Required | Description |
|---|---|---:|---|---|
| `mode` | `"single" \| "range"` | `"single"` | no | Selection mode. |
| `value` | `Date \| string \| null \| { start, end } \| [start, end]` | `null` | no | Initial selected value. |
| `showTime` | `boolean` | `false` | no | Enables time inputs. |
| `closeOnSelect` | `boolean` | `true` | no | Closes picker after selection when possible. |
| `weekStartsOn` | `number` | `0` | no | First day of week (`0..6`). |
| `yearRangePast` | `number` | component default | no | Year range backward from current year. |
| `yearRangeFuture` | `number` | component default | no | Year range forward from current year. |
| `min` | `Date \| string \| null` | `null` | no | Minimum selectable date. |
| `max` | `Date \| string \| null` | `null` | no | Maximum selectable date. |
| `disabledDates` | `(date) => boolean` | `null` | no | Custom date-disable callback. |
| `locale` | `string` | browser default | no | Locale for formatting. |
| `placeholder` | `string` | `""` | no | Input placeholder. |
| `className` | `string` | `""` | no | Extra container class. |
| `onChange` | `(value, state) => void` | `null` | no | Fires when the selected value changes. |

Returned API:

| Method | Arguments | Returns | Description |
|---|---|---|---|
| `update` | `nextOptions?` | `void` | Updates picker options. |
| `setValue` | `nextValue` | `void` | Replaces selected value. |
| `getValue` | none | `any` | Returns selected value. |
| `getState` | none | `object` | Returns datepicker state snapshot. |
| `destroy` | none | `void` | Removes DOM and listeners. |

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

Related demos:

- `demos/demo.kanban.html`

### `createTimeline(container, items, options)` (`js/ui/ui.timeline.js`)

Purpose:

- Render incident/activity events in vertical log mode or horizontal milestone mode.

Factory:

```js
import { createTimeline } from "./js/ui/ui.timeline.js";

const timeline = createTimeline(container, items, options);
```

Recommended item shape:

| Property | Type | Description |
|---|---|---|
| `id` | `string` | Stable event identifier. |
| `timestamp` | `string \| number \| Date` | Event time. |
| `title` | `string` | Primary event label. |
| `subtitle` | `string` | Secondary event label. |
| `description` | `string` | Longer body copy. |
| `status` | `string` | Suggested values: `assigned`, `requested`, `accepted`, `en_route`, `on_scene`, `completed`, `cancelled`. |
| `meta` | `string[]` | Optional tag list. |
| `actions` | `Array<{ id, label, className? }>` | Optional per-item actions. |

Options:

| Option | Type | Default | Required | Description |
|---|---|---:|---|---|
| `ariaLabel` | `string` | `""` | no | Accessible label for the timeline. |
| `orientation` | `"vertical" \| "horizontal"` | `"vertical"` | no | Timeline orientation. |
| `density` | `"compact" \| "comfortable"` | `"comfortable"` | no | Item density preset. |
| `groupByDate` | `boolean` | `false` | no | Groups vertical timeline items by date. |
| `showConnector` | `boolean` | `true` | no | Shows connector lines between items. |
| `linkedRange` | `{ startMs, endMs, anchorMs? } \| null` | `null` | no | Filters visible items by relative timestamp range. |
| `includeUndatedInRange` | `boolean` | `false` | no | Keeps undated items while a linked range is active. |
| `emptyText` | `string` | `"No events."` | no | Empty state copy. |
| `className` | `string` | `""` | no | Extra container class. |
| `locale` | `string` | browser default | no | Locale used for date formatting. |
| `timeZone` | `string` | browser default | no | Time zone used for date formatting. |
| `onItemClick` | `(item) => void` | `null` | no | Fires when an item is clicked. |
| `onActionClick` | `(action, item) => void` | `null` | no | Fires when an item action is clicked. |

Returned API:

| Method | Arguments | Returns | Description |
|---|---|---|---|
| `update` | `nextItems, nextOptions?` | `void` | Re-renders timeline items/options. |
| `append` | `items` | `void` | Appends items to the end of the timeline. |
| `prepend` | `items` | `void` | Prepends items to the start of the timeline. |
| `setLinkedRange` | `range \| null` | `void` | Applies or clears linked range filtering. |
| `getState` | none | `object` | Returns timeline state, including visible items. |
| `destroy` | none | `void` | Removes DOM and listeners. |

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

Related demos:

- `demos/demo.timeline.html`

### `createTimelineScrubber(container, options)` (`js/ui/ui.timeline.scrubber.js`)

Purpose:

- Add an interactive timeline seek bar with optional range selection and zoom.
- Time labels auto-scale by duration:
  - `< 1h` -> `mm:ss`
  - `>= 1h` -> `hh:mm:ss`
  - `>= 1 day` -> `dd:hh:mm:ss`

Factory:

```js
import { createTimelineScrubber } from "./js/ui/ui.timeline.scrubber.js";

const scrubber = createTimelineScrubber(container, options);
```

Options:

| Option | Type | Default | Required | Description |
|---|---|---:|---|---|
| `ariaLabel` | `string` | `""` | no | Accessible scrubber label. |
| `valueLabel` | `string` | component default | no | Current-value label text. |
| `rangeStartLabel` | `string` | component default | no | Range-start label text. |
| `rangeEndLabel` | `string` | component default | no | Range-end label text. |
| `durationMs` | `number` | `0` | no | Total duration. |
| `valueMs` | `number` | `0` | no | Current seek position. |
| `enableRange` | `boolean` | `false` | no | Enables range handles. |
| `range` | `{ startMs, endMs }` | `null` | no | Selected range. |
| `zoom` | `number` | `1` | no | Current zoom level. |
| `zoomLevels` | `number[]` | component default | no | Available zoom levels. |
| `showZoomControls` | `boolean` | `true` | no | Shows zoom controls. |
| `seekStepMs` | `number` | `1000` | no | Keyboard seek step. |
| `seekStepMsFast` | `number` | `10000` | no | Shift+keyboard seek step. |
| `preventPageScrollOnInteract` | `boolean` | `true` | no | Prevents page scroll during interaction. |

Events / callbacks:

| Callback | Payload | Returns | Description |
|---|---|---|---|
| `onSeek` | `(valueMs, state)` | `void` | Fires when the current playhead position changes. |
| `onRangeChange` | `({ startMs, endMs }, state)` | `void` | Fires when range handles move. |
| `onZoomChange` | `(zoom, state)` | `void` | Fires when zoom changes. |

Returned API:

| Method | Arguments | Returns | Description |
|---|---|---|---|
| `update` | `nextOptions?` | `void` | Updates scrubber options. |
| `setTime` | `ms` | `void` | Sets current time. |
| `setRange` | `startMs, endMs` | `void` | Sets selected range. |
| `setDuration` | `ms` | `void` | Updates total duration. |
| `setZoom` | `zoom` | `void` | Sets zoom level. |
| `getValue` | none | `number` | Returns current time. |
| `getState` | none | `object` | Returns scrubber state snapshot. |
| `destroy` | none | `void` | Removes DOM and listeners. |

Behavior notes:

- `enableRange` should be enabled when the scrubber is linked to range-aware surfaces like `createTimeline(...)`.
- Keyboard seeking uses `seekStepMs`, and `Shift` uses `seekStepMsFast`.
- Time label formatting automatically changes with total duration so the same control can cover short clips and multi-day ranges.

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

Related demos:

- `demos/demo.timeline.html`

### `createCommandPalette(options)` (`js/ui/ui.command.palette.js`)

Purpose:

- Global quick-action launcher (`Ctrl/Cmd + K`) with search and keyboard navigation.
- Supports static + async command sources with grouped/pinned/recent views.

Factory:

```js
import { createCommandPalette } from "./js/ui/ui.command.palette.js";

const palette = createCommandPalette(options);
```

Options:

| Option | Type | Default | Required | Description |
|---|---|---:|---|---|
| `commands` | `Command[]` | `[]` | no | Static command list. |
| `providers` | `Array<(ctx) => Command[] \| Promise<Command[]>>` | `[]` | no | Static/async providers. |
| `providerDebounceMs` | `number` | component default | no | Debounce before running providers. |
| `title` | `string` | `"Command Palette"` | no | Dialog title. |
| `placeholder` | `string` | `"Search commands"` | no | Search input placeholder. |
| `emptyText` | `string` | `"No commands found."` | no | Empty state copy. |
| `loadingText` | `string` | `"Loading..."` | no | Provider loading copy. |
| `shortcut` | `string` | `"k"` | no | Keyboard shortcut key. |
| `metaKey` | `boolean` | `true` | no | Requires `Meta` / `Cmd`. |
| `ctrlKey` | `boolean` | `true` | no | Requires `Ctrl`. |
| `groupBySection` | `boolean` | `true` | no | Groups commands by section. |
| `showPinned` | `boolean` | `true` | no | Shows pinned commands section. |
| `showRecent` | `boolean` | `true` | no | Shows recent commands section. |
| `pinnedCommandIds` | `string[]` | `[]` | no | Initial pinned commands. |
| `recentCommandIds` | `string[]` | `[]` | no | Initial recent commands. |
| `maxRecent` | `number` | component default | no | Maximum stored recent commands. |
| `historyStorageKey` | `string` | `""` | no | Optional localStorage key for recent history. |
| `onRun` | `(command) => void` | `null` | no | Fires when a command runs. |
| `onHistoryChange` | `(recentCommandIds, state) => void` | `null` | no | Fires when recent-history state changes. |

Command shape:

| Property | Type | Description |
|---|---|---|
| `id` | `string` | Stable command id. |
| `label` | `string` | Visible command text. |
| `section` | `string` | Optional grouping section. |
| `keywords` | `string[]` | Optional search keywords. |
| `shortcut` | `string` | Optional visible shortcut hint. |
| `icon` | `string` | Optional icon markup. |
| `disabled` | `boolean` | Prevents execution when `true`. |
| `run` | `() => any` | Local command execution handler. |

Returned API:

| Method | Arguments | Returns | Description |
|---|---|---|---|
| `open` | none | `void` | Opens the palette. |
| `close` | none | `void` | Closes the palette. |
| `update` | `nextOptions?` | `void` | Updates palette options. |
| `setQuery` | `text` | `void` | Applies search text. |
| `getState` | none | `object` | Returns palette state. |
| `destroy` | none | `void` | Removes DOM and listeners. |

Related demos:

- `demos/demo.media.strip.html`

### `createTree(container, data, options)` (`js/ui/ui.tree.js`)

Purpose:

- Expandable/selectable hierarchical view with optional checkboxes.
- Supports lazy async child loading and optional virtualization for very large node sets.

Factory:

```js
import { createTree } from "./js/ui/ui.tree.js";

const tree = createTree(container, data, options);
```

Options:

| Option | Type | Default | Required | Description |
|---|---|---:|---|---|
| `expandAll` | `boolean` | `false` | no | Starts with all loaded nodes expanded. |
| `selectable` | `boolean` | `true` | no | Enables node selection. |
| `checkable` | `boolean` | `false` | no | Enables checkbox state. |
| `className` | `string` | `""` | no | Extra container class. |
| `lazyLoadChildren` | `(node, state) => Promise<Node[]>` | `null` | no | Loads children for nodes with `hasChildren`. |
| `onLoadChildren` | `(node, children, state) => void` | `null` | no | Fires after lazy children load. |
| `enableVirtualization` | `boolean` | `false` | no | Enables virtualization for large trees. |
| `virtualHeight` | `number \| string` | component default | no | Virtualized viewport height. |
| `virtualRowHeight` | `number` | component default | no | Virtualized row height. |
| `virtualOverscan` | `number` | component default | no | Extra rows rendered outside viewport. |
| `onToggle` | `(node, isExpanded) => void` | `null` | no | Fires on expand/collapse. |
| `onSelect` | `(node) => void` | `null` | no | Fires on node selection. |
| `onCheck` | `(node, checked, checkedIds) => void` | `null` | no | Fires on checkbox changes. |

Returned API:

| Method | Arguments | Returns | Description |
|---|---|---|---|
| `update` | `nextData, nextOptions?` | `void` | Re-renders tree data/options. |
| `expandAll` | none | `void` | Expands loaded nodes. |
| `collapseAll` | none | `void` | Collapses all nodes. |
| `setSelected` | `nodeId` | `void` | Selects a node by id. |
| `getState` | none | `object` | Returns tree state. |
| `destroy` | none | `void` | Removes DOM and listeners. |

`getState()` includes:
- `visibleRows[]` (`{ id, level }`) for current expanded/filter view

Related demos:

- `demos/demo.datepicker.html`

### `createKanban(container, lanes, options)` (`js/ui/ui.kanban.js`)

Purpose:

- Lane/card board for dispatch/incident workflow with drag-and-drop card moves.
- Suitable for workflow, incident, and queue movement where lane transitions matter.

Factory:

```js
import { createKanban } from "./js/ui/ui.kanban.js";

const board = createKanban(container, lanes, options);
```

Lane/card shape:

| Property | Type | Description |
|---|---|---|
| `id` | `string` | Stable lane/card identifier. |
| `title` | `string` | Default lane/card title field. |
| `cards` | `Array<object>` | Card collection for each lane. |
| `meta` | `object / any` | Optional extra card metadata. |

Options:

| Option | Type | Default | Required | Description |
|---|---|---:|---|---|
| `draggable` | `boolean` | `true` | no | Enables drag-and-drop. |
| `className` | `string` | `""` | no | Extra container class. |
| `ariaLabel` | `string` | `""` | no | Accessibility label. |
| `keyboardMoves` | `boolean` | `true` | no | Enables keyboard move interactions. |
| `laneIdKey` | `string` | `"id"` | no | Lane id key override. |
| `laneTitleKey` | `string` | `"title"` | no | Lane title key override. |
| `cardIdKey` | `string` | `"id"` | no | Card id key override. |
| `cardTitleKey` | `string` | `"title"` | no | Card title key override. |
| `cardMetaKey` | `string` | `"meta"` | no | Card metadata key override. |
| `wipLimits` | `object` | `{}` | no | Per-lane WIP limits. |
| `validateMove` | `(payload) => boolean \| { ok: false, reason }` | `null` | no | Move validation hook. |

Events / callbacks:

| Callback | Payload | Returns | Description |
|---|---|---|---|
| `onCardClick` | `(card, laneId)` | `void` | Fires when a card is selected. |
| `onCardMove` | `(payload)` | `void` | Fires after a successful move. |
| `onMoveRejected` | `(payload)` | `void` | Fires when a move is blocked by validation or WIP rules. |

Returned API:

| Method | Arguments | Returns | Description |
|---|---|---|---|
| `update` | `nextLanes, nextOptions?` | `void` | Re-renders lanes/options. |
| `moveCard` | `cardId, fromLaneId, toLaneId, toIndex?` | `void` | Moves a card programmatically. |
| `getState` | none | `object` | Returns board state snapshot. |
| `destroy` | none | `void` | Removes DOM and listeners. |

Behavior notes:

- Key override options let projects reuse existing lane/card payloads without reshaping all field names.
- `validateMove` should hold business rules such as lane restrictions or prerequisite states.
- `wipLimits` are presentation-time constraints; keep authoritative workflow validation in app logic as well.

Related demos:

- `demos/demo.file.uploader.html`

### `createStepper(container, steps, options)` (`js/ui/ui.stepper.js`)

Purpose:

- Render workflow steps with current/completed/future states.

Factory:

```js
import { createStepper } from "./js/ui/ui.stepper.js";

const stepper = createStepper(container, steps, options);
```

Recommended step shape:

| Property | Type | Description |
|---|---|---|
| `id` | `string` | Stable step identifier. |
| `label` | `string` | Visible step label. |
| `description` | `string` | Optional secondary copy. |
| `status` | `"complete" \| "current" \| "upcoming" \| string` | Optional explicit status override. |

Options:

| Option | Type | Default | Required | Description |
|---|---|---:|---|---|
| `orientation` | `"horizontal" \| "vertical"` | `"horizontal"` | no | Stepper orientation. |
| `clickable` | `boolean` | `false` | no | Enables step click navigation. |
| `currentStepId` | `string` | first step/default | no | Active step id. |

Events / callbacks:

| Callback | Payload | Returns | Description |
|---|---|---|---|
| `onStepClick` | `(step, index, state)` | `void` | Fires when a step is selected in clickable mode. |

Returned API:

| Method | Arguments | Returns | Description |
|---|---|---|---|
| `update` | `nextSteps, nextOptions?` | `void` | Re-renders steps/options. |
| `setCurrentStep` | `stepId` | `void` | Marks a specific step as current. |
| `getState` | none | `object` | Returns stepper state snapshot. |
| `destroy` | none | `void` | Removes DOM and listeners. |

Behavior notes:

- `currentStepId` should be a stable step id, not an array index, so state survives reordered step lists.
- Use `clickable` only when the surrounding flow genuinely supports direct navigation.
- Prefer `createProgress(...)` instead when the UI only needs a scalar progress meter rather than named workflow steps.

Related demos:

- `demos/demo.stepper.html`

### `createSplitter(container, options)` (`js/ui/ui.splitter.js`)

Purpose:

- Provide a reusable two-pane resizable layout primitive.

Factory:

```js
import { createSplitter } from "./js/ui/ui.splitter.js";

const splitter = createSplitter(container, options);
```

Options:

| Option | Type | Default | Required | Description |
|---|---|---:|---|---|
| `orientation` | `"horizontal" \| "vertical"` | `"horizontal"` | no | Split direction between pane A and pane B. |
| `initialRatio` | `number` | component default | no | Starting pane ratio. |
| `minRatio` | `number` | component default | no | Minimum allowed ratio. |
| `maxRatio` | `number` | component default | no | Maximum allowed ratio. |
| `paneA` | `HTMLElement \| string \| () => HTMLElement` | `null` | no | Pane A content source. |
| `paneB` | `HTMLElement \| string \| () => HTMLElement` | `null` | no | Pane B content source. |

Events / callbacks:

| Callback | Payload | Returns | Description |
|---|---|---|---|
| `onResize` | `(ratio, state)` | `void` | Fires when the splitter ratio changes. |

Returned API:

| Method | Arguments | Returns | Description |
|---|---|---|---|
| `update` | `nextOptions?` | `void` | Re-renders splitter options/content. |
| `setRatio` | `ratio` | `void` | Sets pane ratio programmatically. |
| `getState` | none | `object` | Returns splitter state snapshot. |
| `destroy` | none | `void` | Removes DOM and listeners. |

Behavior notes:

- Use `minRatio` / `maxRatio` to prevent unusable pane sizes.
- Pane content can be passed as elements, strings, or factories; keep heavy child components mounted outside if state retention matters.

Related demos:

- `demos/demo.splitter.html`

### `createDataInspector(container, data, options)` (`js/ui/ui.data.inspector.js`)

Purpose:

- Inspect nested objects/arrays with expand/collapse and path copy.

Factory:

```js
import { createDataInspector } from "./js/ui/ui.data.inspector.js";

const inspector = createDataInspector(container, data, options);
```

Options:

| Option | Type | Default | Required | Description |
|---|---|---:|---|---|
| `expandDepth` | `number` | component default | no | Initial expansion depth. |
| `emptyText` | `string` | component default | no | Empty-state copy. |
| `className` | `string` | `""` | no | Extra container class. |

Events / callbacks:

| Callback | Payload | Returns | Description |
|---|---|---|---|
| `onCopyPath` | `(path, value)` | `void` | Fires when a path-copy action is triggered. |

Returned API:

| Method | Arguments | Returns | Description |
|---|---|---|---|
| `update` | `nextData, nextOptions?` | `void` | Re-renders inspected data/options. |
| `getState` | none | `object` | Returns inspector state snapshot. |
| `destroy` | none | `void` | Removes DOM and listeners. |

Behavior notes:

- Use `expandDepth` conservatively for large payloads to avoid overwhelming the initial render.
- This is for inspection and debugging; prefer dedicated detail UIs for operational editing workflows.

Related demos:

- `demos/demo.inspector.html`

### `createEmptyState(container, data, options)` (`js/ui/ui.empty.state.js`)

Purpose:

- Standardize empty/no-results/error views with optional actions.

Factory:

```js
import { createEmptyState } from "./js/ui/ui.empty.state.js";

const emptyState = createEmptyState(container, data, options);
```

Data shape:

| Property | Type | Description |
|---|---|---|
| `title` | `string` | Primary empty-state heading. |
| `description` | `string` | Secondary explanation text. |
| `iconHtml` | `string` | Optional icon markup. |
| `actions` | `Array<{ id, label, className? }>` | Optional action list. |

Events / callbacks:

| Callback | Payload | Returns | Description |
|---|---|---|---|
| `onActionClick` | `(action, state)` | `void` | Fires when an empty-state action is selected. |

Returned API:

| Method | Arguments | Returns | Description |
|---|---|---|---|
| `update` | `nextData, nextOptions?` | `void` | Re-renders empty-state content/options. |
| `getState` | none | `object` | Returns empty-state snapshot. |
| `destroy` | none | `void` | Removes DOM and listeners. |

Behavior notes:

- Use this for empty, filtered-empty, and recoverable error surfaces that still benefit from a consistent action block.
- For loading states, prefer `createSkeleton(...)` instead of reusing empty-state messaging.

Related demos:

- `demos/demo.empty.state.html`

### `createSkeleton(container, data, options)` (`js/ui/ui.skeleton.js`)

Purpose:

- Render loading placeholders while data is being fetched/rendered.

Factory:

```js
import { createSkeleton } from "./js/ui/ui.skeleton.js";

const skeleton = createSkeleton(container, data, options);
```

Options:

| Option | Type | Default | Required | Description |
|---|---|---:|---|---|
| `variant` | `"lines" \| "card" \| "grid"` | `"lines"` | no | Skeleton layout preset. |
| `animated` | `boolean` | `true` | no | Enables shimmer/animation. |
| `lines` | `number` | component default | no | Line count for `lines` variant. |
| `rows` | `number` | component default | no | Row count for `grid` variant. |
| `columns` | `number` | component default | no | Column count for `grid` variant. |

Returned API:

| Method | Arguments | Returns | Description |
|---|---|---|---|
| `update` | `nextData, nextOptions?` | `void` | Re-renders skeleton configuration. |
| `getState` | none | `object` | Returns skeleton state snapshot. |
| `destroy` | none | `void` | Removes DOM and listeners. |

Behavior notes:

- Match the skeleton variant to the real layout so loading and loaded states feel related.
- Use restrained animation in dense dashboards where too many shimmering surfaces become distracting.

Related demos:

- `demos/demo.skeleton.html`

### `createFileUploader(container, options)` (`js/ui/ui.file.uploader.js`)

Purpose:

- Handle drag/drop or browse file intake with queue state, validation, and upload lifecycle hooks.

Factory:

```js
import { createFileUploader } from "./js/ui/ui.file.uploader.js";

const uploader = createFileUploader(container, options);
```

Options:

| Option | Type | Default | Required | Description |
|---|---|---:|---|---|
| `accept` | `string` | `""` | no | Native input `accept` filter. |
| `multiple` | `boolean` | `true` | no | Allows multiple file selection. |
| `maxFiles` | `number` | component default | no | Maximum queued files. |
| `maxFileSize` | `number` | `0` | no | Maximum bytes per file. |
| `allowedTypes` | `string[]` | `[]` | no | Allowed MIME/prefix/extension filters. |
| `ariaLabel` | `string` | `""` | no | Root accessibility label. |
| `dropzoneAriaLabel` | `string` | `""` | no | Dropzone accessibility label. |
| `autoUpload` | `boolean` | `false` | no | Starts upload immediately after intake. |
| `smoothProgress` | `boolean` | `true` | no | Animates progress transitions. |
| `progressAnimationMs` | `number` | `220` | no | Progress animation duration. |
| `useChunkUpload` | `boolean` | `false` | no | Enables chunk/resume mode. |
| `chunkSize` | `number` | `1048576` | no | Chunk size in bytes. |
| `uploadKeyPrefix` | `string` | `"upload"` | no | Prefix for resume-state keys. |
| `dropText` | `string` | component default | no | Dropzone primary text. |
| `emptyText` | `string` | component default | no | Empty-queue copy. |
| `startText` | `string` | component default | no | Start-upload button text. |
| `clearText` | `string` | component default | no | Clear-queue button text. |
| `browseText` | `string` | component default | no | Browse button text. |
| `onUpload` | `(item, controls) => Promise<any>` | `null` | no | Basic async upload adapter. |
| `onChange` | `(state) => void` | `null` | no | Fires on queue state changes. |
| `onError` | `(error, item, state) => void` | `null` | no | Fires on upload/intake errors. |
| `onComplete` | `(state) => void` | `null` | no | Fires when queue completes. |

Chunk/resume hooks:

| Hook | Description |
|---|---|
| `onGetResumeState({ item, uploadKey, state })` | Returns persisted upload progress. |
| `onCreateUploadSession({ item, uploadKey, state, signal })` | Creates remote/local upload session. |
| `onUploadChunk(payload)` | Uploads an individual chunk. |
| `onPersistResumeState({ item, uploadKey, uploadedBytes, totalBytes, chunkIndex, totalChunks, session })` | Persists resume progress. |
| `onFinalizeUpload({ item, uploadKey, session, totalBytes, totalChunks, state, signal })` | Finalizes upload after chunks complete. |
| `onClearResumeState({ item, uploadKey, session })` | Clears stored resume state. |

Returned API:

| Method | Arguments | Returns | Description |
|---|---|---|---|
| `addFiles` | `files` | `void` | Adds files into the queue. |
| `start` | none | `Promise<void>` | Starts upload flow. |
| `clear` | none | `void` | Clears the queue. |
| `update` | `nextOptions?` | `void` | Updates uploader options. |
| `remove` | `itemId` | `void` | Removes a queued item. |
| `retry` | `itemId` | `Promise<void>` | Retries a failed item. |
| `getState` | none | `object` | Returns queue state. |
| `destroy` | none | `void` | Removes DOM and listeners. |

Note:

- `ui.file.uploader` composes `ui.progress` per queued file row for consistent progress visuals and behavior.

Related demos:

- `demos/demo.ui.html`

### `createMediaStrip(container, items, options)` (`js/ui/ui.media.strip.js`)

Purpose:

- Render image/video thumbs and open the shared standalone media viewer.
- Useful as the lightweight browsing surface paired with `createMediaViewer(...)`.

Factory:

```js
import { createMediaStrip } from "./js/ui/ui.media.strip.js";

const strip = createMediaStrip(container, items, options);
```

Recommended item shape:

| Property | Type | Description |
|---|---|---|
| `id` | `string` | Stable media identifier. |
| `type` | `"image" \| "video"` | Media type. |
| `src` | `string` | Full-size source URL. |
| `thumb` | `string` | Thumbnail URL. |
| `title` | `string` | Optional visible title/label. |

Options:

| Option | Type | Default | Required | Description |
|---|---|---:|---|---|
| `layout` | `"scroll" \| "wrap"` | `"scroll"` | no | Thumbnail layout mode. |
| `animationMs` | `number` | `300` | no | Transition duration. |
| `autoplay` | `boolean` | `false` | no | Autoplay video thumbs/viewer as supported. |
| `muted` | `boolean` | `false` | no | Starts media muted. |
| `loop` | `boolean` | `false` | no | Loops video playback. |
| `showControls` | `boolean` | `true` | no | Shows media controls where relevant. |
| `viewerAriaLabel` | `string` | `""` | no | Accessibility label passed to the viewer. |
| `viewerFit` | `"contain" \| "cover" \| "original"` | `"contain"` | no | Viewer fit mode. |
| `showViewerHeader` | `boolean` | `true` | no | Shows viewer header. |
| `showViewerFooter` | `boolean` | `true` | no | Shows viewer footer. |
| `showViewerCounter` | `boolean` | `true` | no | Shows viewer counter. |
| `showViewerClose` | `boolean` | `true` | no | Shows viewer close action. |
| `showViewerPrevNext` | `boolean` | `true` | no | Shows viewer prev/next controls. |
| `showViewerToolbar` | `boolean` | `true` | no | Shows viewer toolbar. |
| `showViewerAudiograph` | `boolean` | `false` | no | Shows audiograph for video items. |
| `baseUrl` | `string` | `""` | no | Base URL for relative media paths. |

Events / callbacks:

| Callback | Payload | Returns | Description |
|---|---|---|---|
| `onOpen` | `(item, index)` | `void` | Fires when viewer opens from the strip. |
| `onClose` | `(item, index)` | `void` | Fires when viewer closes. |

Returned API:

| Method | Arguments | Returns | Description |
|---|---|---|---|
| `update` | `nextItems, nextOptions?` | `void` | Re-renders strip items/options. |
| `openById` | `id` | `void` | Opens a media item by id. |
| `openByIndex` | `index` | `void` | Opens a media item by index. |
| `getState` | none | `object` | Returns strip state snapshot. |
| `destroy` | none | `void` | Removes DOM and listeners. |

Behavior notes:

- `ui.media.strip` now delegates full-view behavior to `ui.media.viewer` so zoom/pan/video viewing stays centralized in one component.
- Keep thumbnails lightweight; full-size assets belong in the viewer/player layer.
- Use `baseUrl` when items carry relative asset paths from app APIs.

Related demos:

- `demos/demo.ui.html`

### `createMediaViewer(container, options)` (`js/ui/ui.media.viewer.js`)

Purpose:

- Render a standalone modal/lightbox viewer for image/video items with transform-based zoom/pan.

Factory:

```js
import { createMediaViewer } from "./js/ui/ui.media.viewer.js";

const viewer = createMediaViewer(container, options);
```

Options:

| Option | Type | Default | Required | Description |
|---|---|---:|---|---|
| `items` | `array` | `[]` | no | Media items available to the viewer. |
| `index` | `number` | `0` | no | Initial active item index. |
| `open` | `boolean` | `false` | no | Starts viewer open when `true`. |
| `fit` | `"contain" \| "cover" \| "original"` | `"contain"` | no | Fit mode for the active media. |
| `zoomStep` | `number` | component default | no | Zoom increment size. |
| `minZoom` | `number` | component default | no | Minimum zoom. |
| `maxZoom` | `number` | component default | no | Maximum zoom. |
| `wheelZoom` | `boolean` | `true` | no | Enables mouse-wheel zoom. |
| `panWhenZoomed` | `boolean` | `true` | no | Enables panning while zoomed. |
| `loop` | `boolean` | `false` | no | Loops prev/next navigation. |
| `showHeader` | `boolean` | `true` | no | Shows header chrome. |
| `showFooter` | `boolean` | `true` | no | Shows footer chrome. |
| `showCounter` | `boolean` | `true` | no | Shows active-item counter. |
| `showClose` | `boolean` | `true` | no | Shows close control. |
| `showPrevNext` | `boolean` | `true` | no | Shows prev/next controls. |
| `showToolbar` | `boolean` | `true` | no | Shows zoom/fit toolbar. |
| `closeOnBackdrop` | `boolean` | `true` | no | Allows backdrop close. |
| `closeOnEscape` | `boolean` | `true` | no | Allows `Esc` close. |
| `ariaLabel` | `string` | `""` | no | Accessible viewer label. |
| `autoplayVideo` | `boolean` | `false` | no | Starts video playback automatically. |
| `mutedVideo` | `boolean` | `false` | no | Starts video muted. |
| `loopVideo` | `boolean` | `false` | no | Loops video playback. |
| `showVideoControls` | `boolean` | `true` | no | Shows native/custom video controls. |
| `showAudiograph` | `boolean` | `false` | no | Shows video audiograph when supported. |
| `audiographStyle` | `string` | component default | no | Audiograph render style. |
| `audiographSensitivity` | `number` | component default | no | Audiograph sensitivity multiplier. |
| `onOpen` | `(item, index) => void` | `null` | no | Fires when viewer opens. |
| `onChange` | `(item, index) => void` | `null` | no | Fires when active item changes. |
| `onClose` | `() => void` | `null` | no | Fires when viewer closes. |
| `onZoomChange` | `(state) => void` | `null` | no | Fires on zoom state changes. |

Returned API:

| Method | Arguments | Returns | Description |
|---|---|---|---|
| `open` | `index?` | `void` | Opens the viewer at a given index. |
| `close` | none | `void` | Closes the viewer. |
| `next` | none | `void` | Advances to the next item. |
| `prev` | none | `void` | Moves to the previous item. |
| `setIndex` | `index` | `void` | Sets the active item. |
| `zoomIn` | none | `void` | Increases zoom. |
| `zoomOut` | none | `void` | Decreases zoom. |
| `resetView` | none | `void` | Resets pan/zoom transforms. |
| `setFit` | `fit` | `void` | Updates fit mode. |
| `update` | `nextOptions?` | `void` | Updates viewer options/state. |
| `getState` | none | `object` | Returns viewer state. |
| `destroy` | none | `void` | Removes DOM and listeners. |

Related demos:

- `demos/demo.media.viewer.html`

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

### Current Stable Line: `v0.21.x`

- Latest documented release: `v0.21.11`
- All library modules now follow monotonic SemVer in release notes:
  - breaking API changes -> `major`
  - new components/features -> `minor`
  - fixes/docs/internal cleanup -> `patch`

### Next Planned Line: `v0.22.x`

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



