# UI Property Viewer V1 Spec

## Summary

`ui.property.viewer` is the shared helper for read-only inspector-style property panels.

It mirrors the section/property data shape used by `ui.property.editor` where practical, but renders values as non-editable display rows.

## Use This When

- an app needs a compact details panel
- the user can inspect properties but should not edit them in-place
- the app already has property descriptors and wants a shared read-only renderer
- table/detail drawers need stable label/value/action rows

## Do Not Use This When

- values should be edited continuously; use `ui.property.editor`
- the workflow needs submit/validation semantics; use `ui.form.modal`
- the app needs tree expansion or arbitrary JSON browsing; use `ui.inspector`

## Factory

```js
const viewer = createPropertyViewer(container, data, options);
```

## Data Shape

```js
{
  selectionLabel: "Practitioner Account",
  sections: [{
    id: "profile",
    title: "Profile",
    description: "Read-only account metadata.",
    properties: [{
      id: "role",
      label: "Role",
      kind: "select",
      value: "doctor",
      options: [{ value: "doctor", label: "Doctor" }],
      copyable: true
    }]
  }]
}
```

## Supported Property Kinds

- `display`
- `text`
- `textarea`
- `number`
- `checkbox`
- `toggle`
- `select`
- `ui.select`
- `password`
- `color`
- `color-select`
- `tags`
- `badges`
- `action`
- `divider`

All non-action kinds render read-only value presentation. Password values are masked by default.

## Options

- `className`
- `showSelectionLabel`
- `selectionLabelPlaceholder`
- `labelWidth`
- `dense`
- `showSectionDescriptions`
- `showPropertyHelp`
- `emptyValue`
- `mixedLabel`
- `trueLabel`
- `falseLabel`
- `maskPasswords`
- `showPasswordToggle` defaults to `true` and shows an icon-only reveal/hide action for password rows
- `showPasswordLabel`
- `hidePasswordLabel`
- `showCopyButtons` defaults to `false` and acts as the viewer-level default for rows without `copyable`
- `copyLabel` supplies the default copy icon button accessible label/title
- `onCopy(payload, meta)`
- `onAction(property, action, meta)`
- `formatValue(property, meta)`

## Property Copy Controls

Copy is primarily controlled per property:

- `copyable: true` shows the icon-only copy action for that row
- `copyable: false` suppresses copy for that row, even when `showCopyButtons` is enabled
- omitted `copyable` inherits the viewer-level `showCopyButtons` default
- password properties never inherit the viewer-level default and require explicit `copyable: true`
- `copyValue` overrides the copied/emitted value when display text is not the desired clipboard value
- `copyLabel` overrides the accessible label/title for that row

Use per-property copy for public identifiers, names, URLs, IDs, and record keys. Keep secrets and sensitive tokens `copyable: false`.

## Sensitive Values

Use `kind: "password"` for passwords, tokens, secrets, or other sensitive values that should be masked in read-only views.

- password rows are masked by default when `maskPasswords` is not `false`
- password rows render an icon-only show/hide action by default
- focus remains on the show/hide action after its state changes
- set `revealable: false` on a password property when the value must never be exposed in the viewer
- set `showPasswordToggle: false` on the viewer to suppress reveal controls for all password rows

## Tones

Property rows accept `neutral`, `success`, `info`, `warning`, and `danger`. Each tone applies a theme-aware text color to the displayed property value.

## Methods

- `update(data?, options?)`
- `setSections(sections)`
- `setSelectionLabel(label)`
- `getState()`
- `destroy()`

## Ownership

Helper owns:

- section chrome
- label/value row layout
- read-only value formatting defaults
- option-label resolution
- optional copy icon and action button surfaces
- theme-aware styling

Apps own:

- data descriptors
- permission rules
- custom format rules
- action side effects
- copy persistence or audit behavior
