# Timeline item menus

Revision `0.21.205` adds optional header menus using the canonical Helper dropdown.

```js
const timeline = createTimeline(host, [{
  id: "message-42",
  title: "Jonathan",
  timestamp: "2026-09-25T12:00:00Z",
  contextMenu: {
    ariaLabel: "Message actions",
    items: [
      { id: "create-task", label: "Create task", icon: "actions.add" },
      { id: "ack", label: "Acknowledge", disabled: false },
      { id: "delete", label: "Delete", variant: "danger" },
    ],
  },
}], {
  collapsible: true,
  onContextMenuAction(action, item, context) {
    // Dispatch the application-owned action; apply server authorization there.
    console.log(action.id, item.id, context.index);
  },
});
```

Supply unique stable action IDs and labels. `icon` is a Helper icon name; `iconHtml` may supply trusted application-owned markup instead. `disabled`, `hidden`, and `danger` (or `variant: "danger"`) are supported. Missing, empty, or entirely hidden menu items produce no trigger. Existing inline `item.actions`/`onActionClick` behavior is unchanged.

The trigger is a sibling of the disclosure button beside the timestamp. It stays available when the item is collapsed, opens a right-aligned dropdown with viewport collision handling, and has a native button plus menu ARIA semantics. Enter/Space activates the button, ArrowDown/ArrowUp opens the menu, and the canonical menu handles navigation, selection, Escape, outside dismissal, and focus return.

The callback receives the original declared action, the normalized timeline item, and the current item context (`index`, `total`, `timeline`, `options`, `visibleItems`) plus `trigger` and the native menu selection metadata in `context.menu`. Helper does not infer authorization, perform application mutations, or retry actions. The application must supply the currently authorized menu and update the item when that changes.

Menus belong to rendered rows, independently of cached custom-content hosts. Replacement or virtualization eviction closes and destroys the old popup/listeners; the next rendered row gets the current definition. An open menu is not promised to survive a row replacement. Retained virtual rows keep their menu instance. Timeline destruction synchronously removes all owned popups. No client reattachment is needed.

Use `uiLoader.get("ui.timeline")` for modular dependency styles or the production dist-only loader. When importing the component directly, include `ui.nav.css` for dropdown styling in addition to timeline/base styles. Refresh both production dist files together and use `?v=0.21.205` after adopting this release.

Browser regression: `tests/timeline.menu.regression.html` covers expanded/collapsed access, keyboard selection/Escape/focus, alignment, disabled/danger actions, empty state, item updates, append/prepend, cached-content reuse, virtual eviction, and destruction.
