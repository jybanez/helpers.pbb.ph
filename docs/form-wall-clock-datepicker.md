# Business-local form date/time values

Use the canonical schema field:

```js
{type: 'ui.datepicker', name: 'starts', label: 'Starts (America/New_York)',
 showTime: true, valueMode: 'wall-clock', required: true}
```

`datepicker` is an alias. Form schema uses single-date selection. The existing
standalone picker also supports its range mode with civil start/end values.
The application must supply the authorized business timezone in the label/help
and request context. This library does not resolve business-zone offsets or
validate DST gaps/folds; the server remains the authority. It must reject an
ambiguous/nonexistent business time while retaining input and asking for another
valid local time, rather than requesting the removed manual UTC-offset control.

## Precision and parsing

Wall-clock input accepts null/empty, YYYY-MM-DD, and YYYY-MM-DD[T or space]HH:mm
with optional :ss and optional fractional seconds of one through three digits.
Dates use Gregorian years0001–9999. Values containing an offset/Z, invalid dates,
24-hour overflow, Date objects, or precision beyond milliseconds throw an error;
they are never rounded, truncated, or interpreted using the browser timezone.
Normalize unsupported server data explicitly before adoption, rather than silently
dropping precision. A showTime output is YYYY-MM-DDTHH:mm:ss, with .SSS when
milliseconds are nonzero. Missing seconds normalize to00; fractional digits are
zero-padded to milliseconds without numerical loss. Date-only output is YYYY-MM-DD.
The time input exposes seconds/milliseconds. Calendar edits preserve selected
clock components. Programmatic changes and conditional rerenders preserve them too.

UTC Date objects are internal civil arithmetic carriers only, not instants in
the business timezone. Calendar creation receives dateBasis:'utc' for this path;
all calendar arithmetic and display use UTC components, including browser-zone
skipped calendar days. The default standalone calendar basis stays local, and
existing picker valueMode:'instant' remains the default ISO-instant behavior.
Recreate a picker to change valueMode. No implicit instant/civil conversion exists.
min/max retain the existing day-boundary behavior, not time-of-day constraints.
In wall-clock mode disabledDates receives a YYYY-MM-DD civil string.

## Lifecycle and adoption

Form get/set, initial values, visibleWhen hidden exclusion/restoration, required
errors/focus, disabled/readonly, busy and destroy route through the hosted picker.
Busy closes its portaled panel before disabling form controls. Destroy and a
conditional rerender during onChange prevent a callback from recreating a popup.
Existing reviewed toggle-group schema support is included in the same form entry.

Use explicit createFormModal at revision0.21.191 with complete relative dependency
closure. Revised modules: ui.form.modal.js, ui.datepicker.js, ui.calendar.js;
new module: ui.datepicker.civil.js. Preserve existing form dependencies, including
toggle group/button, modal, select/tree select, password, stepper, ui.dom/ui.events.
Styles include form-modal CSS (with reviewed toggle wrapping), calendar CSS,
datepicker CSS and existing form/toggle styles. Import URLs/cache revisions must
remain intact. Source form auto-loads these styles; the loader registry is updated.
Main bundle JS/CSS revision0.21.191 is regenerated; this is not authorization for
an unrelated Bimo bundle refresh. Existing preset entry pins are unchanged. Do
not replace the form with an app-local picker bridge or change global bundle policy.

## Verification

Source and bundle regression runs use UTC, America/New_York, Asia/Manila and
Pacific/Apia browser contexts. Cases include stored seconds/milliseconds, actual
time/calendar edits, DST gap/fold strings, Apia2011-12-30, conditional restoration,
toggle coexistence, busy/disabled, required focus, portal cleanup, invalid input
rejection and preservation of legacy instant values. Existing calendar/form
regressions and focused toggle suite are also required after integration.
390px screenshots and results are in output/playwright/wall-clock. A screenshot
shows a readable calendar/time panel inside the mobile viewport. These are browser
fixtures, not a claim of Bimo integration, physical-device or AT verification.

Complete static dependency/style paths and SHA256: docs/form-wall-clock-assets.json.
