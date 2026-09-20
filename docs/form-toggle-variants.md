# Toggle-group schema variants

Set `variant: 'segmented'` on a `ui.toggle.group` (or `toggle-group`) schema field.
The form forwards it to the existing canonical createToggleGroup component.
Omitted/empty variants keep the existing `pill` default. Selection, values,
conditions, validation, lifecycle and datepicker behavior are unchanged.

Adopt js/ui/ui.form.modal.js?v=0.21.192 together with the existing0.21.191
complete form dependency/style graph. This follow-up changes only the form JS;
calendar, picker, civil module, toggle modules and all CSS bytes are unchanged.
The0.21.191 publication manifest still identifies those unchanged dependencies,
but its old form JS hash is superseded by this delivery. Main UI bundle JS is
rebuilt with loader revision0.21.192; paired CSS content is unchanged. No broad
Bimo upgrade, local CSS bridge or global loader change is required.

Source and bundled toggle regression checks all four segmented groups, two
unchanged default-pill fields, long-label wrapping/containment at320/390 and
desktop1280, and existing value/conditional/busy/disabled/destroy semantics.
Screenshots: output/playwright/form-toggle-variants/. Existing full form regression,
bundle and registry contracts are required. Application adoption and physical
mobile/AT verification remain outside this upstream test scope.

Form JS SHA256: 75b86edd08bba954f7cb9bca6ec3ee13cbbe4020b549fb000609ae57ba5dd8ac
