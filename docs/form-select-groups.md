# Native form-select groups

Available in the 0.21.216 candidate. `createFormModal` fields with `type: "select"`
accept an ordered `options` array mixing standalone options and native groups:

```js
{
  type: "select", name: "deliverable_id", label: "Deliverable", value: "brief",
  options: [
    { label: "No deliverable", value: "" },
    { label: "Discovery", options: [
      { label: "Project brief", value: "brief" },
      { label: "Interviews", value: "interviews", disabled: true }
    ] },
    { label: "Delivery", disabled: true, options: [
      { label: "Release", value: "release" }
    ] },
    { label: "Other", value: "other" }
  ]
}
```

A group is an object with an `options` array. Its `label` becomes the native
`optgroup` label and `disabled: true` disables its choices. Option-level
`disabled` also maps to native behavior. Top-level entries and children retain
array order; group headings are not selectable values. Groups are one level deep,
as required by HTML: nested groups are ignored. Empty groups remain empty.

Existing strings, numbers and `{ label, value, disabled }` options work unchanged.
Values retain the existing string normalization. An explicit empty-string option
is suitable for an optional association. Required-field validation still rejects
an empty selected value before submission. Initial values and `setValues()` can
select values inside groups, including a disabled current value for display.
The browser prevents user selection of disabled choices; programmatic values are
not authorization, so the server must validate eligibility on submission.

Use this schema only for `type: "select"`. The custom `type: "ui.select"` and
other controls keep their existing schemas. The form-modal demo has a grouped
Deliverable example, including an unassigned option and disabled choices.
