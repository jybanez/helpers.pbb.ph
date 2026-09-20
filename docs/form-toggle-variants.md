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

For narrow form adoption, replace css/ui/ui.toggle.css and js/ui/ui.form.modal.js
(the latter only changes its automatic CSS URL). Use explicit form import
?v=0.21.193 with the existing complete 0.21.191 graph and segmented schema options.
Do not substitute an app-local CSS patch. Previous form JS and toggle CSS hashes
are superseded. Loader registry toggle CSS URLs and main bundle revision are
0.21.193; generated main JS/CSS are paired. Datepicker, calendar, civil and other
form dependencies are unchanged. Global/preset upgrades are not required.

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
