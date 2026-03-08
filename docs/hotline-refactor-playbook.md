# Hotline Refactor Playbook

This guide is for engineers integrating this library into `hotline.pbb.ph` without breaking behavior.

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

## 5) Integration Pattern In hotline.pbb.ph

Use adapter functions between helper callbacks and backend APIs.

- Keep helpers UI-focused.
- Keep API payload mapping outside helpers.

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
- `js/ui/ui.tabs.js`
- `js/ui/ui.strips.js`
- `js/ui/ui.media.strip.js`
- `js/ui/ui.grid.js`
- `js/ui/ui.progress.js`
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
- `css/ui/ui.tabs.css`
- `css/ui/ui.strips.css`
- `css/ui/ui.media.strip.css`
- `css/ui/ui.grid.css`
- `css/ui/ui.progress.css`
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
   - `demo.ui.html`
   - `demo.audio.html`
   - `demo.nav.html`
2. No console errors in normal demo flow.
3. Required-option behavior still matches contract.
4. `getData()` output shape unchanged for touched helpers.
5. README + this playbook updated if API/behavior changed.

## 10) Versioning Guidance

- Patch (`x.y.Z`): CSS/internal cleanup, no contract changes.
- Minor (`x.Y.z`): new optional APIs/utilities/components.
- Major (`X.y.z`): contract or behavior-breaking changes.

If changing callback signatures or removing methods, plan a major version.

## 11) New Utilities (Recent Additions)

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

## 12) Demo Ownership Split

- `demo.ui.html` is for general UI playground and should avoid heavy domain/data-grid scenarios.
- Grid-focused behavior belongs in `demo.grid.html`:
  - local
  - remote
  - large virtualized fixed-height list
- Navigation-focused behavior belongs in `demo.nav.html`.

When introducing a substantial UI module, prefer a dedicated demo page and link it from `index.html`.
