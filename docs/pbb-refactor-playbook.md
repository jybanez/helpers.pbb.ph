# PBB Refactor Playbook

This guide is for engineers integrating this library into `*.pbb.ph` projects without breaking behavior.

## 1) Source Of Truth

- API and behavior contracts live in:
  - `README.md` (public contract)
  - `js/incident/*.js` (runtime contract)
  - `js/ui/*.js` (shared UI contract)
- If docs and implementation differ, implementation currently wins. Update docs in the same change.

## 2) Non-Negotiable Helper Contract

Every helper must keep:

- Signature: `(container, data, options)`
- Stable return shape:
  - `destroy()`
  - `update(nextData, nextOptions?)`
- List helpers additionally expose:
  - `setList(items[])`
  - `getData()`
  - `getState()`

Do not remove or rename these methods in refactors.

## 3) Error Handling Rules

Required option missing behavior must remain:

- `console.error(...)`
- render nothing for that instance
- still return stable API object

Validation is per-instance, never global.

## 4) Refactor Order (Safe Sequence)

1. Move repeated UI behavior into `js/ui/*` first.
2. Apply utilities to one incident helper.
3. Validate demo pages.
4. Apply to second helper.
5. Update `README.md` + this playbook in same commit.

Avoid simultaneous behavior changes and structural refactors in one PR.

## 5) Integration Pattern In pbb.ph Projects

Use adapter functions between helper callbacks and backend APIs.

- Keep helpers UI-focused.
- Keep API payload mapping outside helpers.
- App integrations should use `uiLoader` by registry key.
- Direct path imports from `js/ui/*` and `js/incident/*` are internal-library usage, not app integration usage.

Example adapter boundary:

- Helper emits: `onStatusNext(assignmentId, toStatus)`
- App adapter transforms to API payload and calls endpoint.
- API response normalized and fed back through `setList(...)`/`update(...)`.

## 6) Data Normalization Rule

Normalize API data before passing to helpers.

- Team assignments: ensure `team`, `team.category`, `team.resources` shape.
- Incident types: ensure `fields`, `detail_entries`, `resources`, `resources_needed`.

Never add backend-specific quirks inside helper rendering logic.

## 7) Current Known Pitfalls

1. Event cleanup regressions:
   - Always use `createEventBag()` for listeners in list/drawer flows.
2. Drawer regressions:
   - Keep `onOpenDrawer` / `onCloseDrawer` firing behavior.
3. Resource rendering confusion:
   - Incident type resource section is shown from `resources[]`, quantity resolved via `resources_needed[]` fallback `0`.
4. Focus/scroll jumps:
   - Keep keyed reconciliation and anchor restoration in list helpers.
5. Audio autoplay/context warnings:
   - Keep audio context unlock logic tied to user gesture (`Play`) path.
6. Audio timeline mismatches:
   - Prefer `incident.call_duration_seconds` for total session duration when present.
   - Keep per-segment timestamp positioning from `recording_role`.
7. Virtualized grid jank:
   - Row-level listeners must be cleaned between virtual window renders.
   - Avoid full DOM rebuild when visible start/end window did not change.
8. Menu alignment regressions:
   - Use centralized alignment/placement resolution in menu core (`ui.menu`), not only wrapper helpers.
9. Sidebar animation loss:
   - Avoid full rerender on collapse toggle; prefer in-place class/state updates to preserve transitions.

## 8) UI Utility Ownership

Shared UI layer:

- `js/ui/ui.dom.js`
- `js/ui/ui.events.js`
- `js/ui/ui.drawer.js`
- `js/ui/ui.search.js`
- `js/ui/ui.modal.js`
- `js/ui/ui.dialog.js`
- `js/ui/ui.toast.js`
- `js/ui/ui.select.js`
- `js/ui/ui.toggle.button.js`
- `js/ui/ui.toggle.group.js`
- `js/ui/ui.datepicker.js`
- `js/ui/ui.timeline.js`
- `js/ui/ui.timeline.scrubber.js`
- `js/ui/ui.command.palette.js`
- `js/ui/ui.tree.js`
- `js/ui/ui.kanban.js`
- `js/ui/ui.file.uploader.js`
- `js/ui/ui.tabs.js`
- `js/ui/ui.strips.js`
- `js/ui/ui.media.strip.js`
- `js/ui/ui.grid.js`
- `js/ui/ui.tree.grid.js`
- `js/ui/ui.progress.js`
- `js/ui/ui.virtual.list.js`
- `js/ui/ui.scheduler.js`
- `js/ui/ui.menu.js`
- `js/ui/ui.dropdown.js`
- `js/ui/ui.dropup.js`
- `js/ui/ui.navbar.js`
- `js/ui/ui.sidebar.js`
- `js/ui/ui.breadcrumbs.js`
- `js/ui/ui.audio.player.js`
- `js/ui/ui.audio.audiograph.js`
- `js/ui/ui.audio.callSession.js`

Shared CSS:

- `css/ui/ui.tokens.css`
- `css/ui/ui.components.css`
- `css/ui/ui.modal.css`
- `css/ui/ui.dialog.css`
- `css/ui/ui.toast.css`
- `css/ui/ui.select.css`
- `css/ui/ui.toggle.css`
- `css/ui/ui.datepicker.css`
- `css/ui/ui.timeline.css`
- `css/ui/ui.timeline.scrubber.css`
- `css/ui/ui.command.palette.css`
- `css/ui/ui.tree.css`
- `css/ui/ui.kanban.css`
- `css/ui/ui.file.uploader.css`
- `css/ui/ui.tabs.css`
- `css/ui/ui.strips.css`
- `css/ui/ui.media.strip.css`
- `css/ui/ui.grid.css`
- `css/ui/ui.tree.grid.css`
- `css/ui/ui.progress.css`
- `css/ui/ui.virtual.list.css`
- `css/ui/ui.scheduler.css`
- `css/ui/ui.nav.css`
- `css/ui/ui.audio.css`

Rule: add generic behavior to `ui/*`; keep incident domain logic in `incident/*`.

## 9) Before Merging Any Refactor

Run this checklist:

1. All demo pages load and interact correctly:
   - `index.html`
   - `demo.team.assignments.html`
   - `demo.incident.types.html`
   - `demo.grid.html`
   - `demo.progress.html`
   - `demo.virtual.list.html`
   - `demo.scheduler.html`
   - `demo.timeline.html`
   - `demo.ui.html`
   - `demo.audio.html`
   - `demo.nav.html`
   - `demo.stepper.html`
   - `demo.splitter.html`
   - `demo.inspector.html`
   - `demo.empty.state.html`
   - `demo.skeleton.html`
2. No console errors in normal demo flow.
3. Required-option behavior still matches contract.
4. `getData()` output shape unchanged for touched helpers.
5. README + this playbook updated if API/behavior changed.

## 10) Versioning Guidance

- Patch (`x.y.Z`): CSS/internal cleanup, no contract changes.
- Minor (`x.Y.z`): new optional APIs/utilities/components.
- Major (`X.y.z`): contract or behavior-breaking changes.
- Keep `README.md` release notes as the canonical component-version history; avoid per-component ad-hoc version labels.
- If a change reshapes app integration expectations, treat it as contract-sensitive even if it is additive.

If changing callback signatures or removing methods, plan a major version.

## 11) New Utilities (Recent Additions)

### 11.0 Registry Loader (`ui.loader`)

- `js/ui/ui.loader.js` is now the preferred integration entry point for browser projects that want CSS + JS loading managed together.
- Preferred usage:
  - `await uiLoader.load("ui.modal")` to ensure styles are present
  - `const createModal = await uiLoader.get("ui.modal")` to resolve the exported factory
  - `const modal = await uiLoader.create("ui.modal", options)` when direct instantiation is preferred
- Keep registry keys stable once documented because app integrations may reference them directly.
- Loader behavior to preserve:
  - deduplicated stylesheet injection
  - dynamic import by registry key
  - export-aware resolution by registry key
  - grouped loading support
  - failure diagnostics for CSS/module loading
  - support for both `ui.*` and `incident.*` component namespaces
- Wrapper-style components may expose `chrome: false` to disable library-owned border/background/padding without changing behavior.
- Only add `chrome: false` when the component actually owns a distinct outer shell. Do not add no-op chrome flags to components whose visuals are entirely internal.
- Tree-style components may expose lazy child loading via `lazyLoadChildren(...)` plus explicit `loadChildren(...)` / `refreshChildren(...)` instance methods; treat these as part of the component contract once used by apps.
- Demo pages should prefer `uiLoader` as well, so working demos remain the reference implementation for project integrations.
- Registry changes should ship with a contract test update in `tests/registry.contract.mjs`.

### 11.0a Accessibility Baseline

- Wrapper/data primitives should expose `ariaLabel` when they render a user-visible region, panel, list, or inspector shell.
- Prefer low-risk semantic improvements first:
  - `role="region"` with `aria-label` for framed shells
  - `role="list"` / `role="listitem"` for simple virtualized list primitives
- For interactive overlays and menus, preserve and test:
  - title/label wiring (`aria-labelledby` or `aria-label`)
  - trigger state attributes (`aria-expanded`, `aria-controls`, `aria-haspopup`) where applicable
  - active descendant wiring for composite widgets where the trigger/input owns the active option state
  - focus restore after close
  - `Escape` close behavior where the component already behaves like an overlay/menu surface
- For navigation/tab primitives, preserve and test:
  - landmark labels on `nav` / navigation-like containers
  - `aria-current="page"` on active navigation/breadcrumb items
  - tab-to-panel linkage via `aria-controls` / `aria-labelledby`
- Do not add ARIA roles that conflict with the component's actual interaction model.
- Accessibility improvements that reshape keyboard behavior or focus handling should be documented as contract-sensitive changes.

### 11.1 Modal Foundation (`ui.modal`)

- `createModal(options)` is now the base shell for overlay/dialog rendering.
- `ui.dialog` helpers (`uiAlert`, `uiConfirm`, `uiPrompt`) are expected to compose over `ui.modal`, not duplicate modal/backdrop/focus logic.
- Required behaviors to preserve:
  - escape/backdrop close controls
  - focus trap and focus restore
  - body scroll lock while open

### 11.2 Progress UI (`ui.progress`)

- `createProgress(container, data, options)` provides generic progress renderers:
  - `linear`, `striped`, `gradient`, `segmented`, `steps`, `radial`, `ring`, `indeterminate`
- Keep this component domain-agnostic; incident/business state mapping remains in caller adapters.

### 11.3 Grid Virtualization (`ui.grid`)

- Virtualization is optional and controlled by options:
  - `enableVirtualization`
  - `virtualRowHeight`
  - `virtualOverscan`
  - `virtualThreshold`
- Preserve compatibility with:
  - selection modes
  - row click callbacks
  - column resizing
  - remote mode query events

### 11.4 Timeline + Scrubber (`ui.timeline`, `ui.timeline.scrubber`)

- `createTimeline(container, items, options)` supports vertical/horizontal orientation and grouped rendering.
- `createTimelineScrubber(container, options)` supports seek, range handles, and zoom levels.
- preserve labeling support (`ariaLabel`, `valueLabel`, `rangeStartLabel`, `rangeEndLabel`)
- preserve keyboard item activation on clickable timeline cards
- preserve keyboard adjustment behavior on scrubber range handles
- In demo/reference integrations:
  - scrubber range may filter visible timeline items
  - seek should keep active item highlight behavior stable
  - keyboard focus must remain visible on timeline cards and scrubber controls

### 11.5 Command Palette / Tree / Kanban

- `ui.command.palette`:
  - global quick actions with shortcut handling
  - preserve keyboard navigation and command filtering behavior
  - preserve async provider flow (`providers[]`) and loading behavior
  - preserve pinned/recent grouping and history hooks (`onHistoryChange`)
  - keep `historyStorageKey` behavior optional (no hard dependency on storage)
- `ui.tree`:
  - expandable/selectable/checkable hierarchy
  - preserve stable selection/check callbacks
  - preserve lazy-loading contract (`lazyLoadChildren`, `onLoadChildren`)
  - preserve virtualization settings behavior for large trees
- `ui.kanban`:
  - lane/card rendering with drag-drop card moves
  - preserve board labeling support (`ariaLabel`) and keyboard click activation
  - preserve lane-wide drop behavior and pointer-position insertion logic
  - preserve move callback payload shape (`card`, `fromLaneId`, `toLaneId`, `fromIndex`, `toIndex`, `lanes`)
- `ui.file.uploader`:
  - preserve region/dropzone labeling support (`ariaLabel`, `dropzoneAriaLabel`)
  - preserve legacy `onUpload(item, controls)` behavior
  - preserve chunk/resume hook contracts when `useChunkUpload` is enabled
  - keep state fields stable for progress + chunk metadata (`uploadedBytes`, `chunkIndex`, `totalChunks`)
- `ui.audio.player` / `ui.audio.callSession` / `ui.audio.audiograph`:
  - preserve transport/session labeling support (`ariaLabel`, `seekLabel`)
  - preserve mute semantics and per-role control behavior

## 12) Demo Ownership Split

- `demo.ui.html` is for general UI playground and should avoid heavy domain/data-grid scenarios.
- Grid-focused behavior belongs in `demo.grid.html`:
  - local
  - remote
  - large virtualized fixed-height list
- Timeline-focused behavior belongs in `demo.timeline.html`:
  - vertical/horizontal timeline
  - scrubber interaction (seek/range/zoom)
- Navigation-focused behavior belongs in `demo.nav.html`.
- Virtual-list-focused behavior belongs in `demo.virtual.list.html`.
- Scheduler/calendar-focused behavior belongs in `demo.scheduler.html`.
- Stepper behavior belongs in `demo.stepper.html`.
- Splitter behavior belongs in `demo.splitter.html`.
- Data inspector behavior belongs in `demo.inspector.html`.
- Empty-state behavior belongs in `demo.empty.state.html`.
- Skeleton behavior belongs in `demo.skeleton.html`.

When introducing a substantial UI module, prefer a dedicated demo page and link it from `index.html`.
