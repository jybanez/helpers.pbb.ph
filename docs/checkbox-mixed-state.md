# Complete checkbox mixed state

`createCheckbox` supports `indeterminate: true` for aggregate visibility when
independent children are only partly selected. The component sets native
`input.indeterminate`, `aria-checked="mixed"`, an `is-indeterminate` class and a
visible dash instead of a tick. No consumer DOM or ARIA patch is needed.

```js
const parent = createCheckbox(host, {
  label: "Transport",
  checked: false,
  indeterminate: true,
  onChange({ checked, indeterminate }) {
    // A native click or Space resolves mixed to a binary state first.
    setChildVisibility(checked);
  },
});
parent.update({ checked: allVisible, indeterminate: someVisible && !allVisible });
parent.setIndeterminate(true); // preserve checked/value; silent by default
parent.setIndeterminate(false, { emit: true });
parent.getIndeterminate();
```

`getState()` and change payloads include `indeterminate`. The default is false.
Mixed is a presentation state independent of `checked`; `getValue()`, configured
checked/unchecked values, native form submission and required validity still use
the binary checked flag. `setChecked` and `setValue` preserve mixed presentation;
clear it explicitly or use atomic `update({ checked, indeterminate })`.

User activation follows native checkbox semantics: an unchecked mixed checkbox
becomes checked, a checked mixed checkbox becomes unchecked, and both clear mixed
before the callback. Disabled and readonly activation preserve both flags and
emit no change. Label association, keyboard Space and focus indication remain
native. The component does not compute hierarchy, counts or subclass predicates;
applications derive those and use the supported `renderCell` API in tree grids.

Checkbox JS remains `0.21.283`; checkbox CSS and the main UI bundle now use
`0.21.284` for contained native input positioning. The complete checkbox root
provides its own containing block; its transparent input is explicitly bounded
to the 18px visible box with zero margin. Consumers need no positioning wrapper
for native label activation/focus. Existing application positioning fixes may
remain until independently verified safe to remove.
`docs/checkbox-mixed-runtime.json` records LF-normalized UTF-8 SHA256 hashes for
the loader, component and main bundle artifacts at the reviewed commit. Pair JS
and CSS from the same handoff; the dash needs the new stylesheet.

`tests/checkbox.position.regression.mjs` verifies real label clicks and Space in
canonical scrolling modal/tree cells using both source and bundle at 1200px and
375px. It checks input/box geometry, stable modal header and panel/body/grid
scroll, mixed/readonly/disabled semantics, native focus and teardown.
