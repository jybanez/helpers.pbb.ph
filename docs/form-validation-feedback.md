# Canonical validation feedback (0.21.197)

Form submissions validate before busy/onSubmit. Visible active fields participate;
hidden conditional fields, disabled and readonly fields are excluded. Optional
empty fields remain optional. Required messages include the user-facing label.
Use schema minLength/maxLength/min/max/step/pattern for applicable native controls,
including password. Programmatically supplied text/password values also receive
length validation. Required passwords use exact emptiness, preserving nonempty
whitespace credentials; any additional password policy belongs in app validate.
Supply validationMessage for concrete domain-specific guidance,
especially pairing-code patterns. Backend validation remains mandatory.

```js
const createForm = await loader.get('ui.form.modal');
const alert = await loader.get('ui.dialog.alert');
const form = createForm({
  rows: [[{type:'input', input:'password', name:'password',
    label:'Password', required:true, minLength:8}]],
  validate(values, context) { // synchronous, no requests or busy transitions
    return values.confirm && values.confirm !== values.password
      ? {confirm:'Confirm password must match Password.'} : {};
  },
  async onInvalid({errors, firstInvalidField, values}, context) {
    // Build concise user-facing issues in schema order; deduplicate by field.
    const items = buildValidationSummary(errors);
    await alert('Please address the following issues before continuing:', {
      title:'Check your entries', variant:'error', draggable:true, items,
      renderTarget:'local', workspaceBridge:false
    });
  },
  onSubmit: async (values, context) => { /* valid submission */ }
});
```

The callback is opt-in: Helper does not impose an alert on other consumers.
Applications requiring an alert must await it in onInvalid. Underlying first-field
focus is restored after the callback settles, not while an alert is open. Repeated
submit is ignored while onInvalid is pending. Keep callbacks free of mutations.
After await, focus restoration requires the same field instance, a connected
invalid target and an open/current form; replacement or corrected fields are not
refocused. No callbacks are fired by the read-only form.validate() inspection method.

Synchronous validate does not replace asynchronous file/decode validation. Keep
those checks in the existing guarded asynchronous path with manageBusyOnSubmit:false;
capture values/context before awaiting, reject stale/dismissed results, validate
before busy/submission requests and preserve uncertain-command protections.

Custom validate returns a field-error map merged with built-in errors before busy.
Only currently rendered, active schema fields can receive those errors. Dotted
keys resolve to their supported base field. Use setErrors for server/custom field
maps, setFormError for a form-wide error. Neither setter triggers onInvalid.
Existing custom onSubmit validation must keep manageBusyOnSubmit:false and show
its own required alert; prefer validate for synchronous field checks. Optional
save-draft/actions must declare their applicable rules rather than mark all fields
required. Extra action callbacks retain their explicit application-owned flow.

Errors have a visible invalid outline/border, aria-invalid and associated text.
Correction events or setValues clear stale field errors; subsequent submission
validates again. Error messages are plain text. The narrow invalid CSS rule uses
!important to outrank the existing modal input reset's eight :not selectors.

## Existing composite controls

Use existing schema fields + setErrors when possible. For an approved composite
outside the schema, load ui.field.error and decorate its existing accessible input,
trigger or group. The adapter does not render a replacement control or submit form.

```js
const createFieldError = await loader.get('ui.field.error');
const feedback = createFieldError(existingContainer, {
  target: existingFocusableControl,
  validate: () => currentSelectionIsValid() ? '' : 'Choose a sale option.'
});
feedback.setError('Choose a sale option.');
feedback.focus();
// on composite API value changes that do not emit input/change:
feedback.clear();
// on disposal, before replacing the control:
feedback.destroy();
```

Adapter input/change events revalidate an existing error when validate is supplied,
otherwise clear it. validate is synchronous and returns a message or empty string.
Destroy restores original aria-describedby/aria-invalid/class state and removes
only its generated message/listeners. Recreate the adapter if the control replaces
its target DOM. Use one adapter per target; the application still prevents busy
and requests until its composite/domain validation passes.

## Adoption and verification

Use the shared preferBundles path and matched0.21.197 loader/mainJS/mainCSS.
New ui.field.error export is a factory. Modular users need the new module/CSS as
well as revised form/loader. No Bimo application files changed here. Preserve
minute precision, segmented choices, backend validation and retained-command rules.

Source/bundle390/1440 tests cover required/password/email/pattern/custom errors,
optional/hidden/disabled semantics, associated visible cues, draggable alert and
focus return, zero invalid submit callbacks, correction and valid submit, adapter
cleanup. Existing toggle/full-form regressions and bundle/registry contracts run.
Screenshots/results: output/playwright/form-validation/. No device/AT claim.

Combined candidate includes foreground-modal keyboard ownership and picker Escape/outside-click isolation. Matched candidate assets: docs/form-overlay-assets.json.

## Empty select options (0.21.198)

An explicit option `{value: '', label: 'Choose…'}` retains its empty value.
Optional fields submit an empty string; required fields report the required-field
error before submission. Labels are fallback values only when value is null or
omitted. Numeric zero and boolean false retain their string representations.
Applications continue to validate allowed enums and map empty draft values to
their API contract. This fix does not make optional draft fields required.

Regression: `node tests/form.select.empty.regression.mjs` (source and bundle).
Adopt matched 0.21.198 loader/main JS/main CSS after review and publication.

For canonical structured summary rendering and the application-owned summary mapping contract, see [dialog-lists.md](dialog-lists.md). `buildValidationSummary` in the example is an application function, not a Helper export.
