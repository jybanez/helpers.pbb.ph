# Color picker

Load `ui.color.picker` through `uiLoader.get()` and call `createColorPicker(host, options)`.
The complete component combines a native RGB color input, an opacity range, a
checkerboard alpha preview, four read-only R/G/B/A fields and a HEX field.
Each visible RGBA/HEX display has a shared copy-icon button. RGBA copies the
complete `rgba(r, g, b, a)` string; HEX copies the complete `#RRGGBBAA` string.
Copy uses the browser Clipboard API, confirms success only after the write
resolves, and shows the full value for manual copying if access is denied or
unavailable. Buttons work with keyboard activation, never submit a parent form,
and disable during a pending copy or busy state. Destroy ignores late feedback. Existing date,
path and repository pickers do not handle colors; the form modal had no color
schema field. This adds that field to the canonical form rather than requiring
custom generic-modal wiring. No application layer/storage behavior is included.

```js
const create = await uiLoader.get("ui.color.picker");
const picker = create(host, {
  label: "Stroke color", value: "#3399ff80",
  showAlpha: true, showRgba: false, showHex: true,
  onChange({ value, hex, rgba }, instance) { /* apply value */ },
});
picker.update({ showAlpha: false }); // preserves alpha
picker.setValue({ r: 51, g: 153, b: 255, a: 0.35 }); // silent
```

Defaults: opaque black, label `Color`, all three optional controls/displays on,
disabled/busy/readonly off. `showAlpha`, `showRgba`, `showHex` are independent;
all eight combinations work. `label`, `ariaLabel`, `id`, and `name` configure
accessible identity and native-form serialization. Labels must describe the
color's purpose. Busy sets `aria-busy` and disables color/opacity changes;
disabled and readonly also prevent changes. Their displays remain copyable;
busy disables copy actions until cleared.

Accepted values: `#RGB`, `#RGBA`, `#RRGGBB`, `#RRGGBBAA` (case-insensitive), comma
`rgb(r, g, b)` or `rgba(r, g, b, a)`, or `{ r, g, b, a }`. RGB channels are numeric
integers 0–255; alpha is numeric 0–1, defaulting to 1 when omitted from an object.
Named colors, HSL, percentage channels and other CSS expressions are rejected.
Invalid values throw `TypeError` before changing value, options or DOM. No clamping.

Canonical value is a defensive-copy RGBA object with straight, unpremultiplied
alpha. Hidden controls/displays and RGB edits preserve exact canonical alpha.
The opacity slider has step 0.001; imported alpha retains finer precision until
the user changes opacity. Its visual percentage is rounded for readability.
`getHex()` always returns lowercase `#RRGGBBAA`: trailing alpha is rounded to the
nearest byte only for this representation. Reading/displaying HEX never changes
canonical precision. `getRgba()` returns comma RGBA with canonical alpha.

Methods: `getValue()`, `getHex()`, `getRgba()`, `getState()`, `setValue(value,
{ emit: false })`, `update(options)`, `setDisabled(bool)`, `setBusy(bool)`,
`focus()`, and idempotent `destroy()`. `update` preserves value when omitted and
is silent. `setValue(..., { emit: true })` sends one change only if value changed.
Calls after destruction do not mutate the removed component.

Native user `input` and `change` events invoke `onInput`/`onChange` respectively
and dispatch bubbling `ui:color:input`/`ui:color:change` on the host. Payload/detail
is `{ value, hex, rgba, event }`, with frozen color snapshots; programmatic events
have `event: null`. Native events may bubble too; subscribe to the namespaced
events for one component-level notification. Callbacks can silently update values.
Explicit emission inside a notification is suppressed to prevent feedback recursion.
The instance is passed as the second callback argument. `element`, `input` and
`alphaInput` expose supported DOM targets for labeling and error associations.

For a plain native form, `name` submits the RGBA string through a hidden input
(omitted when disabled/busy). For canonical form workflows:

```js
const createForm = await uiLoader.get("ui.form.modal");
const form = createForm({
  title: "Color settings",
  rows: [[{ type: "ui.color.picker", name: "fill", label: "Fill color",
    value: "#3399ff80", showAlpha: true, showRgba: true, showHex: false }]],
  validate: values => values.fill.a === 0
    ? { fill: "Fill color — choose opacity above zero." } : {},
  onSubmit(values) { /* values.fill is RGBA; authorization remains server-side */ },
});
form.open();
```

`color-picker` is an alias. An omitted field value defaults to opaque black;
this component always represents a color, not an optional empty selection.
Form get/set values, visibility, readonly/disabled, busy, focus, field errors and
validation-before-submission use the canonical form APIs. Do not encode required
user selection with an empty color; use a separate explicit enable/choice field.
For asynchronously loaded settings, open the canonical modal immediately, mark
busy, then request/populate data, clearing busy after completion. Cancellation,
authorization and uncertain mutation outcomes remain the workflow's responsibility.

Demo: `demos/demo.color.picker.html` and `?bundle`. Chromium desktop/mobile-width
automation checks keyboard slider/focus, labels, form constraints, option/value
behavior and light/dark layout. The OS-native RGB dialog, physical touch devices,
Safari and assistive technologies require separate human acceptance.
