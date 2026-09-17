# Native timeline disclosure

Available from timeline revision `0.21.8`, UI bundle `0.21.185`.
Disclosure is opt-in; existing timelines remain expanded and retain their normal headers.

```js
await uiLoader.load("ui.timeline");
const createTimeline = await uiLoader.get("ui.timeline");
const timeline = createTimeline(host, [{
  id: "message-42", // required stable, unique ID
  title: "Operator Maya", // sender
  subtitle: "Team Alpha", // addressed
  description: "Responder assigned. Location verified.",
  preview: "Responder assigned", // optional; defaults to description
  timestamp: "2026-03-09T08:30:00Z",
  collapsed: false, // optional initial override
}], {
  collapsible: true,
  defaultCollapsed: true,
  groupByDate: true,
  onCollapseChange({ ids, collapsed }) {
    console.log(ids, collapsed);
  },
});
timeline.setCollapsed("message-42", true);
timeline.isCollapsed("message-42"); // true
timeline.expandAll();
timeline.collapseAll();
```

## State and updates

- `setCollapsed(id, boolean)` returns whether state changed. Unknown IDs, disabled disclosure, and destroyed instances are no-ops.
- `isCollapsed(id)` returns false for unknown IDs or disabled disclosure.
- Bulk methods return changed IDs and cover all loaded items, including filtered and offscreen items. They do not fetch data or change the default for future items.
- `onCollapseChange` fires once per operation with changed IDs; no-op operations do not fire it.
- Helper retains state by string-normalized ID across `update`, prepend, append, filtering, and virtual remounts. Removed IDs lose their state. Explicit stable IDs are required, and duplicates are rejected.
- `item.collapsed` and `defaultCollapsed` initialize new IDs only. To change existing state, use the instance methods. To change the initial default for future items, use `update(undefined, { defaultCollapsed: true })`.
- `getState().items` exposes effective collapsed values while disclosure is enabled.

## Presentation and accessibility

The header is a native button with `aria-expanded` and a unique `aria-controls` target. Enter and Space toggle it. Toggling does not activate `onItemClick`; body actions remain independent. Focus inside a changed row returns to its header.

Collapsed desktop rows show sender, addressed, a single-line ellipsized preview, and timestamp. At container widths of 560px or less, sender/addressed/preview stack while the timestamp remains at the upper right. Expanded rows show addressed below sender. Date grouping continues to show time-only timestamps and the virtual floating date label.

## Custom content and application responsibilities

Supply participant names, addressees, plain-text previews, timestamps, and identity icons as item data. The application still owns permission checks, provider mapping, fetching, persistence, reply actions, and sanitization of rich message content. Header text is rendered as text, not HTML.

`mountItemContent(host, item, context)` remains the slot for rich bodies. Helper places it inside the controlled details area. Collapsing hides this area; it does **not** dispose the mounted component. Existing custom mounts are updated with the effective `item.collapsed` value. Pause media or expensive work in the update hook if needed. Virtual eviction, item removal, content-key replacement, and destruction still use the normal cleanup lifecycle. Mount callbacks may run while collapsed; avoid relying on visible dimensions then.

Helper invalidates row measurements and preserves virtual scroll anchoring during changes. If the anchor itself collapses, its header is revealed. Optional `estimateItemHeight(item, { startsGroup })` receives effective `item.collapsed`; return a full unit height including date headings and spacing. Mounted rows are measured. Custom body changes unrelated to disclosure still use `invalidateLayout`.

## Migrating a custom disclosure renderer

Remove app-owned expansion maps and custom header buttons. Map sender to `title`, addressed to `subtitle`, and summary to `preview`. Enable `collapsible`; wire bulk controls to the instance methods. Keep only body/action rendering in `mountItemContent`. Do not hide Helper's header with application CSS.
