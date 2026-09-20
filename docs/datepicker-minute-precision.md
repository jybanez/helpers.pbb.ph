# Minute-only time editing (0.21.194)

Use `showTime: true, valueMode: 'wall-clock', timePrecision: 'minute'` on a
`ui.datepicker` / `datepicker` form field (Starts and Expires). The standalone
picker supports the same option in single and range modes. The default `auto`
preserves existing behavior; unsupported values throw TypeError.

Minute mode renders HH:mm in the wall-clock trigger and native time input,
with step60. Browser locale may render the time as hours/minutes plus AM/PM.
Seconds and milliseconds are retained internally when values are supplied via
initial values, setValue/setValues or update. Opening, calendar navigation,
calendar day selection and unrelated form changes do not truncate stored times.
An explicit valid native time edit replaces that endpoint's seconds/milliseconds
with zero. New empty selections also have zero seconds. Serialization remains
YYYY-MM-DDTHH:mm:ss (or .SSS for retained nonzero legacy milliseconds); this is
not a new transport format. Hiding seconds never converts business time through
the browser zone. The server still validates business-zone DST gaps/folds.

Applications with whole-second backend limits must retain their existing
validation of legacy fractions. Do not silently normalize untouched values.
Instant-mode consumers retain their default behavior; opt-in minute editing
also preserves hidden legacy precision until time is edited.

## Adoption and evidence

Use the shared preferBundles loader with the matched0.21.194 loader/mainJS/mainCSS
set, preserving existing deferred initialization. Resolve ui.form.modal through
loader.get and set the schema option. Do not reintroduce explicit source imports
or app-local time-input patches. Retain prior asset provenance. Follow the
shared-consumer/network checks in form-toggle-variants.md; segmented fix remains
included. No Bimo changes are made by this Helper PR.

Tests: datepicker.minute.regression.mjs covers source/bundle, UTC/New_York,
390/1440, stored precision, navigation/day edits, setValues, conditional rerender,
native time edits, busy and range update preservation. Existing wall-clock suite
covers defaults across four browser zones and instant compatibility, plus calendar
and full-form regressions. Screenshots/results: output/playwright/datepicker-minute/.
No physical-device or AT verification is claimed.
