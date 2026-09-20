# Toggle-group schema variants

Set `variant: 'segmented'` on a `ui.toggle.group` (or `toggle-group`) schema field.
The form forwards it to the canonical createToggleGroup component. Omitted/empty
variants preserve the pill default.

## Selected-state correction (0.21.193)

The segmented background reset and hover rule previously overrode tone-specific
pressed backgrounds. Those resets now apply only to unpressed buttons; scoped
pressed-tone selectors also beat the generic button hover rule. Neutral, success,
info, warning and danger retain their existing pressed palettes in normal, hover,
focus and disabled states. An inset keyboard focus outline stays inside the
segmented container. Pill selectors and behavior remain unchanged.

## Bundled application adoption

The updated user requirement supersedes the earlier direct-source voucher
adoption advice. Use the existing shared `journeyHelper()` loader with
`preferBundles: true`; resolve `await loader.get('ui.form.modal')` inside the
existing deferred voucher action. Remove that action's explicit form import.
Do not create a second loader or pre-import component modules.

Adopt this candidate's matched set, keeping the relative directory layout:
`js/ui/ui.loader.js`, `dist/helpers.ui.bundle.min.js`, and
`dist/helpers.ui.bundle.min.css`. Cache the loader with a new application URL
revision; it selects main JS/CSS revision0.21.193. Exact candidate SHA256 values
are in `docs/segmented-selection-assets.json`; published identities must be
rechecked after merge. These are candidate assets, not yet publication approval.
The loader has no static imports. The main bundle contains form schema, toggle
group/segmented forwarding and wall-clock datepicker implementations and their
internal dependencies. Existing source/bundle behavioral tests cover their APIs.
The loader's `data-ui-bundle="ui"` stylesheet prevents the form's automatic
source-style injection. Let loader.get load CSS before creating the form.

Normal successful bundle loading must request the loader and paired main bundle,
without requests for individual form/toggle/calendar/civil component modules.
Do not use `css:false` in application form resolution. Bundle errors propagate;
there is no automatic source fallback. An explicitly configured source mode is
a separate path and must not count as normal bundle success.

Read-only Bimo reference audit: shared loader consumers include common navbar;
account tabs, toast, dropdown, action modals, account/password presets, alerts
and confirms; settings modal; public-auth form; home login preset; users modal;
and users.business splitter/virtual list. Developer must run focused regressions
for these affected consumers when replacing the shared main bundle. Preserve
business wall-clock/legacy seconds, exact/unset toggle values, conditional
retention, validation-before-busy, retained commands and deferred authenticated
module loading. Minute precision is a separate pending API change.

Existing helperIcons() directly imports icons, and helperGrid() loads a separate
0.21.189 grid module after loading bundled grid CSS. A main-bundle refresh alone
does not eliminate those independent requests. Developer should inventory and
report them separately and assess any migration against the user's intended
scope; do not claim a page-wide zero-module-request result from voucher-only
network evidence. Retain historical assets/provenance until a reference audit
supports removal. Do not refresh game/inspection/H4/scanner artifacts.

Application acceptance requires an actual network trace, no duplicate component
instances/styles, focused shared-consumer regressions and fresh selected-state
Bimo390/1440 captures. No Bimo files were changed by Helper.

## Evidence

- tests/toggle.selection.regression.mjs: source/bundle at390/1440, all five tones,
  computed selected/unselected backgrounds, hovered states, keyboard focus,
  disabled selection, and comparison with default-pill tone colors.
- tests/form.toggle.regression.mjs: four segmented groups, two default-pill
  fields, wrapping/containment at320/390/1280, values/conditional restoration,
  required focus, busy-state selected distinction, disabled/readonly/destroy.
- Existing full form regression, bundle and registry contracts.
- Screenshots and computed results: output/playwright/toggle-selection/ and
  output/toggle-selection-results.json; form captures under
  output/playwright/form-toggle-variants/.

Application adoption and fresh Bimo selected-state390/1440 visual acceptance
remain separate; these are upstream synthetic browser checks, not device/AT QA.
