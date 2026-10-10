# Menu opening focus

`createMenu(trigger, items, options)` retains ordinary menu defaults: opening
focuses the first enabled item; navigation/selection and return-to-trigger work
as before. For live search suggestions, set `focusOnOpen:false` in options or
override it per opening with `menu.open({focusOnOpen:false})`. The opening does
not activate or focus an item. Hover may highlight a result without moving focus
from the textbox; textbox Space, Enter, arrows, Home/End and Escape remain owned
by the application. The menu handles keyboard navigation only when the event
originates inside it in this mode.

```js
const menu = createMenu(resultsButton, [], { focusOnOpen: false, onSelect });
searchInput.addEventListener('input', () => {
  menu.update(localResults(searchInput.value));
  menu.open(); // input keeps focus; subsequent live updates also keep it
});
searchInput.addEventListener('keydown', event => {
  if (event.key === 'ArrowDown') {
    menu.open();
    if (menu.focusFirst()) event.preventDefault();
  }
});
resultsButton.addEventListener('keydown', event => {
  if (event.key === 'ArrowDown') {
    menu.open();
    if (menu.focusFirst()) event.preventDefault();
  }
});
```

`focusFirst()` deliberately focuses the first enabled item in flat, grouped or
mega menus. It returns `true` on success, `false` when closed, destroyed, empty
or all disabled. It does not open the menu or select a result. Once entered,
existing navigation, Escape and Enter/Space selection apply. To use ordinary
opening for a deliberate action: `menu.close(); menu.open({focusOnOpen:true})`.
Calling `open` on an already open menu remains a no-op; use `focusFirst()` for
entry without reopening. `getState().focusOnOpen` reports the current opening
policy. Future openings use the configured option unless overridden per call.

Closing an unentered preserving menu leaves external focus alone. Escape/selection
after entry can return focus to the trigger. Outside dismissal preserves the newly
focused external control. `destroy()` removes listeners/popup and is terminal.
Closed-menu item updates are rendered before reopening. Application-specific
search queries, textbox Escape and mobile entry controls remain application-owned.
This API remains a menu with `menuitem` actions; it does not claim combobox/listbox
semantics or automatically wire input key handling.

Demo: `demos/demo.menu.focus.html` (also `?bundle`). Regression:
`node tests/menu.focus.regression.mjs`, exercising source and bundled APIs.
Menu JS/main UI bundle cache revision: `0.21.280`.
