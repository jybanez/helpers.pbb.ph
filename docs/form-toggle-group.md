# Form schema toggle groups

Use type `ui.toggle.group` (alias `toggle-group`) with `name`, `label`,
`options: [{value: "false", label: "Not transferable"}, {value: "true", label: "Transferable"}]`.
Options also accept string entries. Values are strings or null; single selection
allows deselection, so an unset draft never silently picks its first option.
Set `required: true` to require a choice on submit. Unknown programmatic values
clear the selection. `items` is an alias for `options` using the same value/label schema.

`initialValues`, `setValues`, `getValues`, onChange, visibleWhen, hidden-field
exclusion and restoration use the existing form store. Readonly/disabled fields
remain inert; per-option disabled is supported. Required errors attach to the
stable group host and focus its first enabled button. Busy state is reapplied
after programmatic updates/renders. Public destroy now destroys hosted field
instances as well as the modal. Change events fired by controls being removed
are ignored during render, avoiding stale conditional values overwriting setValues.

Vocabulary examples: transferable false/true; ambassador_mode and portal_mode
all_active/selected; terms_mode inherit/supplement/override. Conditional checkbox
and textarea rows remain normal schema fields. Toggle-group field styles allow
long labels to wrap inside a mobile dialog.

## Adoption

Source entry js/ui/ui.form.modal.js and css/ui/ui.form.modal.css revision0.21.190
must travel together. New imports: ui.toggle.group.js -> ui.toggle.button.js;
both use existing ui.dom.js/ui.events.js. Add css/ui/ui.toggle.css. Preserve all
existing form imports/dependencies and relative paths, including modal, stepper,
password, select and tree select. Direct form import auto-loads styles; loader
registry includes toggle CSS. Main bundle JS/CSS revision0.21.190 also includes
this change, but Bimo should assess a narrow source adoption, not a broad refresh.
Existing form presets retain their existing import pin; use the explicit revised
createFormModal entry for this schema capability. No datepicker support is implied.

## Validation

Run node tests/form.toggle.regression.mjs for source/bundle at320/390/1280 and
existing full form regression. Covers unset drafts, initial/set/get string values,
required focus, changes/conditional fields, hidden exclusion/restoration, busy
updates, readonly/disabled, long-label width and stale-handler cleanup on destroy.
Initial regression exposed a blur/change-during-render issue; render guard fixes
it. Actual application adoption and physical mobile/AT remain separate checks.
