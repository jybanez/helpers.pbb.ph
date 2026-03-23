# Changelog

All notable changes to `helpers.pbb.ph` are documented here.

## Versioning

- Current stable line: `v0.21.x`
- Latest documented release: `v0.21.12`
- Next planned line: `v0.22.x`

## Release Line Index

- `v0.21.x`: shared window manager, iframe host, and desktop-style workspace foundations
- `v0.20.x`: schema form modal helper and modal-form demos
- `v0.19.x`: hierarchy map, real Cebu hierarchy sample generator, hierarchy demo
- `v0.18.x`: media viewer, modal action consistency, tree-grid search, regression harnesses
- `v0.17.x`: accessibility hardening across interactive UI components and demos
- `v0.16.x`: loader, toggle primitives, tree grid, chrome-less support
- `v0.15.x`: virtual list, scheduler, uploader chunk/resume hooks
- `v0.14.x`: workflow/layout/data primitives and tree/command-palette expansion
- `v0.13.x`: uploader, timeline refinements, kanban
- `v0.12.x`: command palette and tree
- `v0.11.x`: timeline scrubber
- `v0.10.x`: timeline
- `v0.9.x`: datepicker and action modal
- `v0.8.x`: toast and select
- `v0.7.x`: modal foundation and progress
- `v0.6.x`: grid virtualization and dedicated grid demo
- `v0.5.x`: navigation/menu refinements
- `v0.4.x`: navigation/menu utility layer
- `v0.3.x`: grid baseline
- `v0.2.x`: audio UI layer
- `v0.1.x`: initial public prototype

## Release Notes
### v0.21.12

- Changed the shared `ui.modal` shell so long content scrolls only inside the modal body region instead of scrolling the entire panel.
- The modal header now stays fixed at the top of the shell and the footer stays fixed at the bottom while the body scrolls.
- Added browser regression coverage proving tall modal content keeps the header and footer stationary while the body scrolls.

### v0.21.11

- Extended `ui.navbar` so primary navigation items can now host shared menu dropdowns, not only right-side actions.
- Added item-level menu support through:
  - `items[].menuItems`
  - `items[].menuOptions`
  - `onItemMenuSelect(item, menuItem, meta)`
  - `onItemMenuOpenChange(item, open)`
- Kept backward compatibility:
  - plain `items[]` still use `onNavigate(item)`
  - existing `actions[].menuItems` behavior remains unchanged
- Updated `demos/demo.navbar.html` to demonstrate a Workspace-style primary-nav `Apps` menu alongside the existing right-side profile menu.
- Split the overloaded navigation documentation surface into focused demos:
  - `demos/demo.navbar.html`
  - `demos/demo.sidebar.html`
  - `demos/demo.breadcrumbs.html`
  - `demos/demo.dropdown.html`
  - `demos/demo.dropup.html`
- Repurposed `demos/demo.nav.html` into a lightweight navigation overview/router page instead of a five-helper catch-all.

### v0.21.10

- Reorganized the demo/catalog navigation so the window subsystem now lives under its own `Window` group instead of being mixed into generic `Utilities`.
- Split the former combined `Window` demo into:
  - `demos/demo.window.html` for the single managed window shell
  - `demos/demo.window.manager.html` for multi-window workspace and taskbar behavior
- Updated the demo catalog in `demos/index.html` so window-related pages are grouped as:
  - `Window`
  - `Window Manager`
  - `Iframe Host`
  - `Workspace Bridge`
- Updated public docs/spec references so `demo.window.manager.html` is treated as the manager/workspace reference page while `demo.window.html` remains the focused shell demo.

### v0.21.9

- Upgraded `ui.window` taskbar behavior to support both the original minimized-only recovery strip and a workspace-style all-open-window taskbar.
- Added manager options:
  - `taskbarMode`
  - `showTaskbarClose`
  - `taskbarItemOrder`
- Added manager method:
  - `getTaskbarWindows()`
- `taskbarMode: "auto"` now resolves to:
  - `"minimized-only"` for body-level managers
  - `"always"` for contained managers used as workspace surfaces
- In workspace-style taskbars:
  - all open windows now render taskbar items
  - active window items are highlighted
  - minimized window items remain visible with minimized state styling
  - clicking an open item focuses it
  - clicking a minimized item restores and focuses it
  - overflowing taskbar items now scroll horizontally instead of collapsing the item pills
- Updated contained window demos to use the workspace-style taskbar:
  - `demos/demo.window.manager.html`
  - `demos/demo.workspace.bridge.html`
- Expanded window browser regression coverage to explicitly verify:
  - minimized-only hidden taskbar behavior
  - always-on taskbar behavior
  - taskbar-based focus switching
  - minimized restore from the taskbar
  - maximized windows reserving visible taskbar height

### v0.21.8

- Added `ui.workspace.bridge` as an explicit trusted parent/child bridge for iframe-hosted apps that need parent-owned helper surfaces instead of local iframe overlays.
- Added parent-side host installation via:
  - `installWorkspaceUiBridgeHost(options)`
- Added child-side bridge access via:
  - `getWorkspaceUiBridge(options)`
  - `showWorkspaceActionModal(payload, options)`
- Integrated delegated workspace fallback into shared helpers:
  - `createToastStack(...)` can delegate toast delivery to the parent workspace host when available
  - `uiAlert(...)`, `uiConfirm(...)`, and `uiPrompt(...)` can delegate dialog rendering to the parent workspace host when available
- Kept `createModal(...)` and `createFormModal(...)` local in V1 to avoid widening the bridge before the workspace contract is proven.
- Added dedicated demo and fixture coverage:
  - `demos/demo.workspace.bridge.html`
  - `samples/iframe/workspace-ui-bridge.fixture.html`
- Added dedicated browser regression coverage for:
  - bridge handshake
  - delegated toast rendering in the parent document
  - local fallback when no host is installed
  - `tests/workspace.bridge.regression.html`
  - `tests/workspace.bridge.regression.mjs`

### v0.21.7

- Added `ui.iframe.host` with `createIframeHost(options)` as a narrow shared iframe surface for embedded apps and local helper-owned fixtures.
- Helper-owned iframe host now standardizes:
  - iframe creation and lifecycle
  - loading state
  - deterministic error state for empty or invalid source
  - narrow source controls via `setSrc(...)`, `reload()`, and `update(...)`
- Added dedicated demo coverage:
  - `demos/demo.iframe.host.html`
  - shared navigation entry under `Utilities`
  - home catalog card on `demos/index.html`
- Added dedicated browser regression coverage:
  - `tests/iframe.host.regression.html`
  - `tests/iframe.host.regression.mjs`
- Fixed iframe-host status-surface visibility so helper-owned loading/error panels correctly honor hidden-state toggles instead of visually overriding ready iframe content.
- Updated the dedicated iframe-host demo to use a same-origin fixture file for deterministic browser behavior:
  - `samples/iframe/iframe-host.fixture.html`
- Added full-bleed `ui.window` composition for iframe-hosted content so embedded surfaces can occupy the full window body rather than inheriting generic padded content styling.

### v0.21.6

- Added `ui.icons` as a shared categorized SVG icon registry with:
  - `createIcon(name, options)`
  - `getIconDefinition(name)`
  - `listIcons()`
  - `listIconCategories()`
- Added the initial curated outline icon pack across:
  - `actions`
  - `navigation`
  - `status`
  - `media`
  - `data`
- Added dedicated demo/catalog coverage:
  - `demos/demo.icons.html`
  - shared navigation entry under `Utilities`
  - home catalog card on `demos/index.html`
- Added baseline regression coverage for registry integrity and SVG creation:
  - `tests/icons.regression.html`
  - `tests/icons.regression.mjs`

### v0.21.5

- Added `createAccountFormModal(options)` as a narrow account/profile wrapper over `createFormModal(...)` with helper-owned baseline rows for:
  - `Name`
  - `Email`
- Added `extraRows` support to the new account preset so projects can append instructions, warnings, and additional row content without forking the shared account structure.
- Added `createChangePasswordFormModal(options)` as a narrow password-change wrapper with helper-owned rows for:
  - `Current Password`
  - `New Password`
  - `Confirm Password`
- Added dedicated demo coverage for both new presets:
  - `demos/demo.form.modal.account.html`
  - `demos/demo.form.modal.change.password.html`
- Extended preset browser regression coverage to include:
  - account preset additive `extraRows`
  - account preset `extraActions` / `extraActionsPlacement`
  - change-password preset remapped fields
  - change-password preset successful native-submit close behavior
  - `tests/form.modal.presets.regression.html`
  - `tests/form.modal.presets.regression.mjs`

### v0.21.4

- Added additive `extraActions` support to `createFormModal(...)` so teams can extend the helper-owned footer without replacing the standard cancel/submit contract.
- Footer ordering is now:
  - extra actions in provided order
  - helper-owned `Cancel`
  - helper-owned `Submit`
- Added `extraActionsPlacement` to `createFormModal(...)` with:
  - `"end"` for the existing shared end cluster
  - `"start"` to visually split extra actions to the start side of the footer
- Extra footer actions now receive current form values plus helper-owned context in `onClick(values, ctx)` and default to non-closing behavior unless `closeOnClick: true` is explicitly provided.
- Added an HQ-style account footer-actions acceptance example to:
  - `demos/demo.form.modal.html`
- Added browser regression coverage for:
  - extra-action render order
  - callback execution
  - default non-closing behavior
  - busy-state disable behavior
  - `tests/form.modal.regression.html`
  - `tests/form.modal.regression.mjs`

### v0.21.3

- Added `ui.password` with `createPasswordField(container, options)` as a narrow reusable password-entry primitive:
  - shared show/hide toggle
  - standalone value/visibility API
  - disabled/readonly support
  - login/re-auth-aligned behavior
- Updated `ui.form.modal` password rows to compose over `ui.password` so login and re-auth now inherit the same password toggle behavior as standalone usage.
- Added dedicated demo coverage:
  - `demos/demo.password.html`
  - shared navigation entry under `Utilities`
  - home catalog card on `demos/index.html`
- Added dedicated browser regression coverage:
  - `tests/password.regression.html`
  - `tests/password.regression.mjs`
- Updated public documentation and integration guidance in:
  - `README.md`
  - `docs/pbb-refactor-playbook.md`

### v0.21.2

- Hardened `ui.media.viewer` against several real integration and demo-surface issues:
  - fixed the single-item no-navigation layout bug where one image/video could render near-empty while repeated items worked
  - fixed tall-media fit behavior so `contain` and `cover` now diverge correctly on portrait/tall assets
  - fixed pan geometry so the viewer moves the rendered content box rather than a viewport-sized wrapper
  - fixed drag vibration by disabling transform easing during active pan
  - fixed wheel-zoom feel so zoom now stays anchored to the viewport center instead of appearing to drift/pan unpredictably
- Added a dedicated portrait/tall repro asset and focused repro actions in `demos/demo.media.viewer.html`
- Added dedicated browser regression coverage:
  - `tests/media.viewer.regression.html`
  - `tests/media.viewer.regression.mjs`

### v0.21.1

- Reworked `demos/demo.window.manager.html` so the page now proves `ui.window` through actual wrapper-style workspaces instead of a generic pane-only shell:
  - incident review workspace over `ui.window` + `ui.data.inspector`
  - media review workspace over `ui.window` + `ui.media.viewer` + `ui.data.inspector`
- Added the next bounded follow-on proposal for the subsystem:
  - `docs/ui-window-taskbar-improvement-proposal.md`
- Updated `docs/ui-window-proposal.md` to point future taskbar expansion at the dedicated follow-on proposal before any docking or snapping discussion.

### v0.21.0

- Added `ui.window` with `createWindowManager(options)` and managed `createWindow(options)` instances for desktop-style non-modal tools:
  - drag by title bar
  - edge/corner resize
  - active-window stacking
  - minimize/maximize/restore
  - manager-owned taskbar recovery
- Added dedicated documentation for the window subsystem:
  - `docs/ui-window-proposal.md`
  - `docs/ui-window-v1-spec.md`
  - `docs/ui-window-v1-checklist.md`
- Added dedicated demo coverage:
  - `demos/demo.window.html`
  - `demos/demo.window.manager.html`
  - shared navigation entry under `Utilities`
  - demo-catalog card on `demos/index.html`
- Added targeted browser regression coverage:
  - `tests/window.regression.html`
  - `tests/window.regression.mjs`

### v0.20.7

- Extended `ui.form.modal` for real acceptance-proof coverage of the approved improvement stage:
  - added narrow top-level `context` support for geodata-driven hub flows
  - exposed instance-level `applyApiErrors(response)`
  - mapped dotted backend keys such as `uplink_hub_ids.0` back onto the base field when possible
- Hardened `ui.form.modal` hidden-field layout behavior:
  - hidden-only rows no longer render empty visible grid rows
  - hidden fields now render in a dedicated non-visual form container while still participating in payload values
- Fixed `ui.select` overflow behavior in modals and other clipped containers:
  - menus now render in a floating body-level layer instead of inside the local overflow container
  - floating menu positioning now follows the trigger during scroll and resize
- Updated `demos/demo.form.modal.html` so the proof-oriented examples align to the real PBB HQ targets:
  - geodata `Hub Add`
  - `other` deployment `Hub Edit`
  - `Add Uplink`
- Expanded `tests/form.modal.regression.html` to cover:
  - narrow context-strip rendering
  - dotted backend error mapping to hosted `ui.select`
  - hidden-only row collapse behavior
  - body-level floating `ui.select` menus

### v0.20.6

- Split modal-form regression coverage into two targeted browser harnesses:
  - `tests/form.modal.regression.html` / `tests/form.modal.regression.mjs` for the base `createFormModal(...)` helper
  - `tests/form.modal.presets.regression.html` / `tests/form.modal.presets.regression.mjs` for preset-wrapper behavior
- Added `node tests/form.modal.presets.regression.mjs` to the documented validation commands
- This separation makes preset-wrapper failures easier to debug without mixing them with base helper validation/render regressions

### v0.20.5

- Expanded `tests/form.modal.regression.html` to cover the preset-wrapper layer:
  - `createLoginFormModal(...)`
  - `createReauthFormModal(...)`
  - `createStatusUpdateFormModal(...)`
  - `createReasonFormModal(...)`
- Added regression coverage for:
  - remapped field names
  - locked re-auth identifier behavior
  - app-supplied status/reason option flows
  - confirmation-phrase enforcement in the reason-required preset
- Improved `demo.form.modal.html` with compact payload previews so engineers can see the remapped output shape before opening each preset

### v0.20.4

- Expanded `js/ui/ui.form.modal.presets.js` with:
  - `createStatusUpdateFormModal(options)`
  - `createReasonFormModal(options)`
- Added loader keys:
  - `ui.form.modal.status`
  - `ui.form.modal.reason`
- Preset wrappers accept engineer-provided field-name mappings plus app-supplied option lists for:
  - status values
  - reason categories
- Expanded `demo.form.modal.html` with focused preset coverage for:
  - status update form
  - categorized reason-required form

### v0.20.3

- Added `js/ui/ui.form.modal.presets.js` with:
  - `createLoginFormModal(options)`
  - `createReauthFormModal(options)`
- Added loader keys:
  - `ui.form.modal.login`
  - `ui.form.modal.reauth`
- Preset wrappers keep helper-owned structure while allowing engineer-provided field-name mappings for cross-project integration
- Expanded `demo.form.modal.html` with focused preset coverage for:
  - login wrapper with remapped field names
  - re-auth wrapper with locked identifier

### v0.20.2

- Migrated the former hand-built busy modal form example in `demo.ui.html` to `createFormModal(...)`
- Added `tests/form.modal.regression.html` and `tests/form.modal.regression.mjs` covering:
  - helper required validation
  - app-supplied field errors
  - form-level error rendering
  - truthy submit close-on-success behavior
- Added `node tests/form.modal.regression.mjs` to the documented validation commands

### v0.20.1

- Added `demo.form.modal.html` as a focused demo page for `createFormModal(...)`
- Added `Form Modal` to the shared demo navigation and `index.html`
- Migrated the legacy login modal example in `demo.ui.html` to use `createFormModal(...)` instead of a hand-built modal implementation

### v0.20.0

- Added `ui.form.modal` with `createFormModal(options)` as a schema-driven helper for short modal-bound forms built on `createActionModal(...)`
- Shipped the V1 row-based form contract:
  - one item in a row => full width
  - two items in a row => equal-width columns
  - more than two items => rejected or normalized conservatively
- Added helper-owned modal-form APIs for:
  - `getValues()`
  - `setValues(values)`
  - `setErrors(fieldErrors)`
  - `clearErrors()`
  - `setFormError(message)`
  - `clearFormError()`
- Reused helper-owned modal busy-state behavior for form submit flows instead of creating a second busy-overlay system
- Expanded `demo.ui.html` with a dedicated schema-form modal section covering:
  - login field-error flow
  - form-level error flow
  - successful async submit flow
  - two-column row layout

### v0.19.7

- Added `js/ui/ui.semantic.icons.js` so `ui.dialog` and `ui.toast` share one semantic status icon source instead of carrying duplicate inline SVG maps
- Expanded the `demo.ui.html` toast section with a comparison matrix and explicit examples for:
  - default semantic icons
  - `showVariantIcon: false`
  - `variantIcon` overrides

### v0.19.6

- Added default semantic status icons to `ui.toast` so `success`, `info`, `warn`, `error`, and `neutral` toasts share the same status language as `ui.dialog`
- Added toast icon control options:
  - `showVariantIcon`
  - `variantIcon`
- Added opt-in speech support to `ui.dialog` helpers:
  - `speak`
  - `speakText`
  - `voiceName`
  - `speakRate`
  - `speakPitch`
  - `speakVolume`
- Updated `demo.ui.html` to expose dialog voice selection and speech toggling alongside the existing toast speech controls

### v0.19.5

- Improved `demo.ui.html` dialog coverage with a compact comparison matrix so users can see the intended feature combination before opening each dialog:
  - variant
  - built-in status icon visibility
  - description support
  - default primary action emphasis

### v0.19.4

- Expanded `demo.ui.html` dialog coverage to show the current `ui.dialog` feature set more explicitly:
  - `success`
  - `info`
  - `warning`
  - `error`
  - `description`
  - built-in semantic status icons
  - `showVariantIcon: false` opt-out behavior

### v0.19.3

- Added `description` to `ui.dialog` helpers so alert/confirm/prompt flows can show a secondary guidance line below the primary message without forcing custom modal content
- Added shared description styling in `css/ui/ui.dialog.css`
- Updated `demo.ui.html` dialog examples to demonstrate title + message + description composition

### v0.19.2

- Added default semantic status icons to `ui.dialog` for non-`default` variants:
  - `success`
  - `info`
  - `warning`
  - `error`
- Added dialog icon control options:
  - `showVariantIcon`
  - `variantIcon`
- Kept the icon behavior at the dialog layer so `ui.modal` remains the neutral shell while `ui.dialog` owns semantic presentation

### v0.19.1

- Added semantic dialog variants to `ui.dialog`:
  - `default`
  - `success`
  - `info`
  - `warning`
  - `error`
- `uiAlert(...)`, `uiConfirm(...)`, and `uiPrompt(...)` now accept `variant` and apply dialog-level accent styling through `css/ui/ui.dialog.css`
- `uiConfirm(...)` and `uiPrompt(...)` now use safer default action emphasis for `warning` and `error` dialogs by promoting their primary action to the shared `danger` button variant unless the caller overrides it explicitly
- Updated `demo.ui.html` dialog examples to exercise semantic dialog variants directly:
  - alert => `info`
  - confirm => `warning`
  - prompt => `success`

### v0.19.0

- Added `ui.hierarchy.map` as a hierarchy-first visual explorer with:
  - primary tree rendering
  - external entity lane
  - overlay relationship links
  - search
  - zoom/pan
  - selection
  - chrome-less support
- Added `demo.hierarchy.map.html` wired to a real Cebu hierarchy sample and synthetic foundation support overlays
- Added `scripts/generate.hierarchy.sample.ps1` to regenerate the demo hierarchy from local MySQL data in `pbb_hq_ph`
- Added `samples/samplehierarchy_cebu.json` containing:
  - Philippines
  - Region VII
  - Cebu
  - Cebu City
  - Mandaue City
  - Lapu-Lapu City (Opon)
  - all actual barangays under those cities
  - five synthetic foundations and overlay support links for stress testing

### v0.18.16

- Added a browser-rendered modal busy-state regression harness:
  - `tests/modal.busy.regression.html`
  - `tests/modal.busy.regression.mjs`
- The harness protects the shared `ui.modal` contract against regressions where `setBusy(...)` could visually dismiss an open modal by dropping runtime state classes during `update(...)`
- Documented `node tests/modal.busy.regression.mjs` as part of the supported repo validation commands

### v0.18.14

- Added `.ui-form-error` to `ui.components.css` as the shared inline form/auth error primitive
- Updated the login-failure modal flow in `demo.ui.html` to use `.ui-form-error` instead of inline error styling
- Documented form feedback primitives in `README.md` so async modal/login flows can reuse shared error presentation instead of app-local styles

### v0.18.13

- Added modal-level busy-state support to `createModal(...)`:
  - `busy`
  - `busyMessage`
  - `closeWhileBusy`
  - `backdropCloseWhileBusy`
  - `escapeCloseWhileBusy`
  - `setBusy(isBusy, { message? })`
  - `isBusy()`
- Busy state now applies a helper-owned overlay, sets `aria-busy`, disables interactive controls, and prevents duplicate modal interaction while active
- Added helper-managed `autoBusy` support to `createActionModal(...)` for promise-returning action handlers
- Updated `demo.ui.html` to show:
  - explicit busy-state control via `setBusy(...)`
  - automatic busy handling for async action-modal save flows
- Expanded the modal documentation in `README.md` so busy-state handling is part of the public shared contract

### v0.18.12

- Updated `demo.grid.html` to use the same shared dense action-cell pattern as `demo.tree.grid.html`
- Standardized flat-grid demo actions on:
  - `ui-button`
  - `ui-button-icon`
  - `ui-button-borderless`
  - `ui-button-danger`
- This keeps `ui.grid` and `ui.tree.grid` aligned on the recommended cell-action implementation instead of letting each demo invent a different button/icon pattern

### v0.18.11

- Formalized the `ui.toggle.button` / `ui.toggle.group` contract in `README.md`
- Documented the actual callback payloads emitted by the current implementation instead of abstract proposal signatures:
  - button `onChange({ id, pressed, button, event })`
  - group `onChange({ items, changedItem, changedIndex, group, value })`
- Expanded the public toggle documentation to cover:
  - variants
  - tones
  - sizing
  - group modes
  - returned instance APIs
  - accessibility rules
- Treated the README toggle section as the formal contract surface for consuming apps

### v0.18.10

- Added shared dense-cell action primitives in `ui.components.css`:
  - `.ui-cell-actions`
  - `.ui-cell-action`
- Updated `demo.tree.grid.html` to demonstrate the recommended action-cell pattern using:
  - `ui-button`
  - `ui-button-icon`
  - `ui-button-borderless`
  - `ui-button-danger`
- Documented tree-grid/list/grid cell actions as shared styling contracts instead of leaving consuming apps to create raw unstyled buttons inside cells

### v0.18.9

- Added shared button-style variants in `ui.components.css`:
  - `.ui-button-borderless`
  - `.ui-button-quiet`
  - `.ui-button-link`
  - `.ui-button-icon`
- Normalized `.ui-button` to `inline-flex` so text/icon layouts stay consistent across shared UI components
- Updated `demo.ui.html` with a visible button-variants section so engineers can inspect the styling contract directly
- Updated `README.md` to document the expanded shared button-style surface

### v0.18.8

- Added a browser-rendered regression harness for `ui.tree.grid`:
  - `tests/tree.grid.regression.html`
  - `tests/tree.grid.regression.mjs`
- The harness validates:
  - initial render
  - tree-aware search
  - ancestor-path preservation
  - empty-search state
  - `clearSearch()` recovery
  - multi-match highlighting
- Documented `node tests/tree.grid.regression.mjs` as part of the repo validation commands

### v0.18.7

- Added built-in tree-aware search to `ui.tree.grid`:
  - `searchTerm`
  - `searchFields`
  - `autoExpandMatches`
  - `highlightMatches`
  - `emptySearchText`
  - `setSearchTerm(term)`
  - `clearSearch()`
- `ui.tree.grid.getState()` now includes `search: { active, term, matchCount, visibleCount }`
- Search keeps ancestor paths visible for descendant matches and feeds virtualization from the filtered visible-row list
- Match highlighting now marks all occurrences within rendered tree-grid cell text, not just the first occurrence
- Updated `demo.tree.grid.html` with live search controls for the standard and virtualized tree-grid demos

### v0.18.6

- Extended `ui.dialog` convenience helpers to preserve the same declarative modal-action icon contract:
  - `uiAlert(...)` now accepts `headerActions` plus `okIcon*` options
  - `uiConfirm(...)` now accepts `headerActions` plus `cancelIcon*` / `confirmIcon*` options
  - `uiPrompt(...)` now accepts `headerActions` plus `cancelIcon*` / `submitIcon*` options
- Updated `demo.ui.html` dialog examples to exercise header actions and icon-capable buttons for alert, confirm, and prompt flows

### v0.18.5

- Added action-button icon support for `createActionModal(...)` header and footer actions:
  - `icon`
  - `iconPosition`
  - `iconOnly`
  - `ariaLabel`
- Updated `demo.ui.html` action-modal example to show icon and icon-only actions

### v0.18.4

- Added declarative `headerActions[]` support to `createActionModal(...)`
- Added `setHeaderActions(actions[])` to the action-modal helper
- Header and footer action objects now use the same contract in `createActionModal(...)`
- Updated `demo.ui.html` action-modal example to show declarative header actions

### v0.18.3

- Added `headerActions` slot support to `createModal(...)`
- Added `setHeaderActions(...)` modal instance method
- Updated `demo.ui.html` modal example to show header actions in use

### v0.18.2

- Expanded `ui.media.strip` viewer pass-through options:
  - `viewerAriaLabel`
  - `showViewerHeader`
  - `showViewerCounter`
  - `showViewerClose`
  - `showViewerPrevNext`
  - `showViewerToolbar`
- Updated `demo.ui.html` media-strip section to exercise shared viewer options directly from the strip launcher

### v0.18.1

- Refactored `ui.media.strip` to delegate full-view behavior to `ui.media.viewer`
- `ui.media.strip` now loads `ui.media.viewer` through the loader dependency graph
- Preserved strip launcher APIs:
  - `openByIndex(index)`
  - `openById(id)`
  - `update(nextItems, nextOptions?)`
  - `getState()`
- Added strip-side pass-through options for shared viewer behavior:
  - `viewerFit`
  - `showViewerFooter`
  - `showViewerAudiograph`

### v0.18.0

- Added `ui.media.viewer`:
  - standalone image/video modal viewer
  - fixed-size dialog shell
  - transform-based zoom/pan
  - fit modes (`contain`, `cover`, `original`)
  - gallery navigation (`prev`, `next`, `setIndex`)
  - optional video audiograph via `ui.audio.audiograph`
- Added `css/ui/ui.media.viewer.css`
- Added `demo.media.viewer.html`
- Added loader registry/group support:
  - `ui.media.viewer`
  - included in `media` group
- Added `ui.media.viewer` API and usage documentation
- Added dedicated demo link from `index.html`

### v0.17.8

- Completed the focused demo audit for timeline interactions
- `css/ui/ui.timeline.css`
  - added visible keyboard focus treatment for timeline items
- `css/ui/ui.timeline.scrubber.css`
  - added visible keyboard focus treatment for the scrubber rail, thumb, handles, and zoom controls
- `demo.timeline.html`
  - added explicit keyboard guidance for timeline/scrubber interaction
  - event log is now keyboard-focusable and labeled

### v0.17.7

- Continued the accessibility pass on timeline-focused utilities
- `ui.timeline`
  - added `ariaLabel`
  - timeline roots now expose region semantics
  - timeline lists expose list semantics
  - clickable timeline items are now keyboard-activatable with `Enter` / `Space`
- `ui.timeline.scrubber`
  - added `ariaLabel`, `valueLabel`, `rangeStartLabel`, and `rangeEndLabel`
  - scrubber root now exposes region semantics
  - main seek rail now exposes accessible value text
  - range handles now expose slider semantics with keyboard adjustment support
- `demo.timeline.html`
  - now passes explicit accessibility labels to both timeline instances and the scrubber demo

### v0.17.6

- Continued the accessibility pass on heavy interactive components
- `ui.file.uploader`
  - added `ariaLabel` and `dropzoneAriaLabel`
  - uploader root now exposes region semantics
  - dropzone is keyboard-activatable and behaves as an explicit button target
  - upload queue exposes list semantics and a polite live status channel
- `ui.audio.player`
  - added `ariaLabel` and `seekLabel`
  - play/pause button now exposes `aria-pressed`
  - seek slider now exposes `aria-valuetext`
- `ui.audio.audiograph`
  - root now exposes labeled region semantics
  - mute button now exposes `aria-pressed`
- `ui.audio.callSession`
  - added `ariaLabel`
  - session root and track list now expose region/list semantics
- `demo.audio.html`
  - now passes an explicit `ariaLabel` to the audio session demo

### v0.17.5

- Audited `ui.kanban` drag behavior and accessibility
- `ui.kanban`
  - added `ariaLabel` support on the board root
  - lane roots are now labeled regions and card stacks expose list semantics
  - cards can now trigger click handlers via `Enter` / `Space`
  - drag-and-drop now treats the entire lane as a valid drop surface
  - insertion index is resolved from pointer position, making cross-lane and between-card drops less fragile
- `demo.ui.html`
  - now passes an explicit `ariaLabel` to the kanban demo

### v0.17.4

- Performed a focused accessibility audit on demo pages that exercise the updated primitives
- `demo.ui.html`
  - now passes explicit `ariaLabel` values to select, datepicker, and command-palette demos
- `demo.nav.html`
  - now passes explicit `ariaLabel` values to navbar, sidebar, and breadcrumbs demos
  - added an accessible label for the breadcrumb-input control

### v0.17.3

- Continued the accessibility hardening pass on navigation and tab primitives
- `ui.tabs`
  - now wires tabs and tabpanel together with `id`, `aria-controls`, and `aria-labelledby`
- `ui.navbar`
  - added `ariaLabel` support for the navigation landmark
  - active navigation items now expose `aria-current="page"`
- `ui.sidebar`
  - added `ariaLabel` support for the navigation landmark
  - active items now expose `aria-current="page"`
- `ui.breadcrumbs`
  - current crumb now exposes `aria-current="page"`

### v0.17.2

- Continued the accessibility hardening pass on selection/launcher/date primitives
- `ui.select`
  - added `ariaLabel` support
  - synchronizes trigger/listbox wiring with `aria-controls`
  - exposes active option state via `aria-activedescendant`
- `ui.command.palette`
  - added `ariaLabel` support
  - added `Home` / `End` keyboard navigation
  - restores focus to the previously focused element on close
- `ui.datepicker`
  - added `ariaLabel` support
  - synchronizes trigger/panel wiring with `aria-controls`
  - restores focus after outside-click or `Escape` close

### v0.17.1

- Continued the accessibility hardening pass on interactive primitives
- `ui.modal`
  - added `ariaLabel` fallback when no visible title is present
  - binds `aria-labelledby` to the rendered modal title when available
- `ui.drawer`
  - now exposes dialog semantics (`role="dialog"`, `aria-modal="true"`)
  - restores focus to the previously focused element on close
  - supports `Escape`-to-close consistently
- `ui.menu`
  - now synchronizes trigger accessibility state (`aria-haspopup`, `aria-expanded`, `aria-controls`)
  - added `ariaLabel` support for the menu surface
  - added keyboard `Home` / `End` navigation
  - restores focus to the trigger after close

### v0.17.0

- Started the dedicated accessibility hardening line with low-risk ARIA baseline improvements on wrapper/data primitives
- Added `ariaLabel` support to:
  - `ui.virtual.list`
  - `ui.scheduler`
  - `ui.empty.state`
  - `ui.data.inspector`
- Added explicit landmark/list semantics where applicable:
  - `ui.virtual.list` now exposes labeled list/listitem semantics
  - `ui.scheduler`, `ui.empty.state`, and `ui.data.inspector` now expose labeled region semantics

### v0.16.12

- Added a public `Chrome-less Components` support matrix to the README
- Documented the rule that `chrome: false` is only exposed by components with a real library-managed outer shell

### v0.16.11

- Expanded `demo.scheduler.html` with side-by-side scheduler rendering:
  - framed scheduler
  - chrome-less scheduler inside a host-owned shell

### v0.16.10

- Added `chrome: false` support to `ui.scheduler`
- Clarified the shared contract: only components with a real library-owned outer shell should expose `chrome: false`; components without distinct wrapper chrome should not add no-op chrome flags

### v0.16.9

- Added `chrome: false` support to `ui.empty.state`
- Expanded `demo.empty.state.html` with:
  - framed empty-state rendering
  - chrome-less empty-state rendering inside host-owned layout

### v0.16.8

- Added `chrome: false` support to additional wrapper-style data components:
  - `ui.virtual.list`
  - `ui.data.inspector`
- Kept `ui.timeline` unchanged because it does not currently own a distinct outer chrome shell; no-op chrome flags are avoided unless the component has actual wrapper styling to disable

### v0.16.7

- Fixed `ui.tree.grid` lazy hierarchy rendering so rows with `hasChildren: true` are treated as expandable before their children are loaded
- Added loading/error visual state to tree-grid disclosure controls during async child loading
- Expanded `demo.tree.grid.html` with:
  - a lazy-loaded tree-grid section
  - `chrome: false` rendering example
  - explicit `refreshChildren(...)` and `setExpanded(...)` exercise paths

### v0.16.6

- Added `chrome: false` presentation support for wrapper-style data components:
  - `ui.grid`
  - `ui.tree`
  - `ui.tree.grid`
- Added explicit lazy child loading APIs:
  - `ui.tree.loadChildren(nodeId)`
  - `ui.tree.refreshChildren(nodeId)`
  - `ui.tree.grid.loadChildren(rowId)`
  - `ui.tree.grid.refreshChildren(rowId)`
- Added lazy child loading support to `ui.tree.grid` using the same `lazyLoadChildren(row, state)` / `onLoadChildren(...)` pattern used by `ui.tree`

### v0.16.5

- Added optional fixed-row-height virtualization to `ui.tree.grid`
  - virtualization operates on the flattened visible rows after expand/collapse state is applied
  - intended for large hierarchical datasets with stable row heights
- Updated `demo.tree.grid.html` with a large virtualized tree-grid section

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

### v0.16.1

- Converted all `demo*.html` pages to use `uiLoader` instead of manual component stylesheet tags and direct component module imports
- Standardized demo boot flow:
  - head bootstrap uses `window.__demoLoaderReady = uiLoader.loadMany([...])`
  - page scripts await loader readiness and import modules via `uiLoader.import(...)`
- Demos now serve as the canonical reference for loader-based integration across the library

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

### v0.15.2

- Added file-uploader chunk/resume hooks (roadmap v0.15 progress):
  - `useChunkUpload`, `chunkSize`
  - `onGetResumeState`, `onCreateUploadSession`
  - `onUploadChunk`, `onPersistResumeState`
  - `onFinalizeUpload`, `onClearResumeState`
- Updated `demo.ui.html` uploader demo to exercise chunk upload + localStorage resume-state flow

### v0.15.1

- Added scheduler/calendar primitive (roadmap v0.15 progress):
  - `ui.scheduler.js`
  - `ui.scheduler.css`
  - month/week views with event and slot callbacks
- Added dedicated `demo.scheduler.html`
- Linked new demo from `index.html`

### v0.15.0

- Added virtual list primitive (roadmap v0.15 progress):
  - `ui.virtual.list.js`
  - `ui.virtual.list.css`
  - windowed rendering with configurable `height`, `rowHeight`, and `overscan`
  - API: `update`, `setItems`, `scrollToIndex`, `getState`, `destroy`
- Added dedicated `demo.virtual.list.html`
- Linked new demo from `index.html`

### v0.14.2

- Expanded tree capabilities (roadmap v0.14 progress):
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

### v0.14.1

- Expanded command-palette capabilities (roadmap v0.14 progress):
  - async command providers (`providers[]`)
  - grouped sections rendering
  - pinned/recent command groups
  - history persistence (`historyStorageKey`)
  - history change hook (`onHistoryChange`)
- Updated `demo.ui.html` command palette demo to exercise provider + pinned/recent behavior

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

### v0.13.3

- Hardened timeline scrubber interactions (roadmap v0.13 progress):
  - improved pointer interaction stability (`preventDefault` + propagation control on drag gestures)
  - keyboard seek controls on scrubber rail:
    - `ArrowLeft/ArrowRight`, `Home/End`, `PageUp/PageDown`
    - configurable `seekStepMs` and `seekStepMsFast` (Shift)
  - wheel-to-horizontal-scroll handling in zoomed scrubber viewport
  - `preventPageScrollOnInteract` option (default `true`)

### v0.13.2

- Expanded kanban capabilities (roadmap v0.13 progress):
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

### v0.13.1

- Improved timeline behavior (roadmap v0.13 progress):
  - added component-level linked range filtering in `ui.timeline`:
    - `options.linkedRange = { startMs, endMs, anchorMs? }`
    - `setLinkedRange(range|null)`
    - `getState().visibleItems`
  - updated `demo.timeline.html` to use timeline API linked-range filtering (not demo-only external filtering)

### v0.13.0

- Added file uploader utility:
  - `ui.file.uploader.js`
  - `ui.file.uploader.css`
  - drag/drop queue, validation, progress, retry/cancel/remove, upload adapter hook
- Improved timeline demo integration:
  - scrubber range now filters visible timeline items
  - seek highlight operates on filtered result set
- Polished UX:
  - fixed-height, scrollable event logs across demo pages
  - global themed scrollbar styling in `ui.tokens.css`

### v0.12.0

- Added command palette utility:
  - `ui.command.palette.js`
  - `ui.command.palette.css`
  - shortcut-driven quick actions (`Ctrl/Cmd + K`)
- Added tree utility:
  - `ui.tree.js`
  - `ui.tree.css`
  - expandable/selectable/checkable hierarchy

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

### v0.10.0

- Added timeline utility:
  - `ui.timeline.js`
  - `ui.timeline.css`
  - supports `vertical` and `horizontal` orientations
  - supports optional vertical date grouping and item/action callbacks
- Updated `demo.ui.html`:
  - new Timeline section with vertical + horizontal examples

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

### v0.6.0

- Improved grid capabilities:
  - added optional row virtualization:
    - `enableVirtualization`
    - `virtualRowHeight`
    - `virtualOverscan`
    - `virtualThreshold`
  - large-list rendering stability fixes (virtual windowing + row-event cleanup)
  - retained column-resize support in virtualized mode
- Restructured demos:
  - added dedicated `demo.grid.html` with:
    - local grid
    - remote grid
    - large virtualized fixed-height grid
  - removed grid section from `demo.ui.html`

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

### v0.4.0

- Added navigation/menu utility layer:
  - `ui.menu`, `ui.dropdown`, `ui.dropup`
  - `ui.navbar`, `ui.sidebar`, `ui.breadcrumbs`
- Added `ui.nav.css` styles
- Added `demo.nav.html` for interactive navigation demos

### v0.3.0

- Added `ui.grid` component with local/remote modes
- Added optional sorting/search/pagination capabilities (especially for remote data)
- Added row selection (`single`/`multi`) and query/state APIs
- Added grid demo section in `demo.ui.html`

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

### v0.1.0

- Initial public prototype published
- Incident helper set (`teams.assignments`, `types`, details editor/viewer)
- Shared UI utility layer (`ui.dom`, `ui.events`, `ui.drawer`, `ui.search`, `ui.dialog`, `ui.tabs`, `ui.strips`)
- Demo pages published via GitHub Pages



