# Timeline presentation updates and navigation

`createTimeline` keeps application presentation state separate from item data.
Use these APIs for expandable cards, editors, and reply navigation without
changing a canonical `contentKey` just to force a redraw.

With `groupByDate: true`, virtual timelines retain the visible day's label at
the top of the viewport after its inline heading scrolls away. This overlay
updates across date boundaries, jumps, and expansion changes even when the
original heading is outside the rendered window. It does not change row heights
or intercept pointer events.

Grouped vertical timelines show only the time on each message. The full date
remains in the time element's `datetime` attribute and hover title. Ungrouped
and horizontal timelines retain the full date and time.

## Update card layout

```js
timeline.invalidateLayout(affectedIds, {
  mutate() {
    // Synchronous: the helper captures the viewport anchor before this runs.
    for (const id of affectedIds) collapsed.add(String(id));
  },
});
```

`affectedIds` may be one ID, an array, or `null` (all loaded items, the default).
The helper drops cached heights for those items, including offscreen items, and
calls the `update(item, context)` hook on their mounted custom content. The hook
must apply the new presentation state to its existing DOM. If the app directly
changes DOM, make those changes inside `mutate` too. Do not pass an async callback
or change the timeline's item collection inside it.

Virtual timelines preserve the first visible item and its pixel offset. If the
offset lies inside a body that was removed, the item's header is revealed.
Positions clamp at scroll boundaries. Ordinary nonvirtual timelines refresh
mounted custom content but do not take ownership of a page's scroll position.

Offscreen items are estimated until they mount; they cannot be measured while
unmounted. Supply a pure estimator using the same presentation state:

```js
estimateItemHeight(item, { startsGroup }) {
  return (collapsed.has(String(item.id)) ? 100 : 360) + (startsGroup ? 40 : 0);
}
```

The estimate is the entire virtual unit in CSS pixels, including its date
heading and padding. Invalid estimates fall back to the helper's heuristic.
Mounted measurements replace estimates. Late content resizes are observed and
use the previous viewport anchor.

Rows retained in the virtual window keep their DOM and focus during layout
updates. An app that hides a focused descendant must move focus to its card's
toggle inside the update hook before hiding the body. A focused row that leaves
the mounted window moves focus to the timeline viewport. Replacing item data
may rebuild standard row controls; custom content with a stable key is retained.
Toolbar focus is not moved by a layout update.

## Jump to a loaded item

```js
timeline.invalidateLayout(messageId, {
  mutate() { collapsed.delete(String(messageId)); },
});
const result = await timeline.scrollToItem(messageId, {
  align: "center", // "start" (default), "center", or "end"
  focus: true,     // default false; focuses the mounted article
});
if (!result.found && result.reason === "not-loaded") showNotLoadedNotice();
```

The helper mounts a virtual target, measures its content, then aligns it. It
never fetches a page. Layout changes and jumps do not invoke `onReachEnd`.
Successful results are `{ found: true, id: string }`; failures have `found: false`
and a `reason`:

| Reason | Meaning |
| --- | --- |
| `not-loaded` | ID is absent from the loaded item collection. |
| `filtered` | Loaded ID is excluded by `linkedRange`. |
| `cancelled` | A newer navigation, data/layout change, destruction, or user scroll superseded this jump. |
| `destroyed` | Called after destruction. |
| `not-mounted` | No matching article could be mounted. |

If the app filters data before passing it to Helper, it must distinguish its own
filtered records from records not yet fetched. A jump does not change filters or
expansion state. Content that loads later may resize; completion is not a promise
that remote images or asynchronous widgets have finished loading.

## Suggested collapse policy for Syndicatum

These are app-owned rules to implement alongside the Helper APIs:

- Apply bulk mode to all loaded filtered IDs and let later matching items inherit
  that mode. Clear affected per-item overrides; later individual toggles win.
- Skip active inline editors during bulk collapse and report the skipped count.
  Keep those cards explicitly expanded after save/cancel until another individual
  toggle or bulk action. Do not hide or discard an active draft.
- Move focus from a soon-to-be-hidden body control to the disclosure button;
  keep `aria-expanded`, `aria-controls`, and `hidden` synchronized.
- Keep filter/search lifecycle and saved expansion overrides in the application.
  Expand a reply target before awaiting `scrollToItem`; only an absent loaded ID
  should produce a not-loaded notice.
- Recompute plain-text previews when a message is edited, remove cached content
  when deleted, and leave read/acknowledgement behavior unchanged.

## Verification

Serve the repository and open `tests/timeline.layout.regression.html`; use
`?bundled=1` to exercise the generated UI bundle. Both must show PASS. Also run
with `?grouped=1` (or `?grouped=1&bundled=1`) to verify date boundaries during
expand/collapse, including divider spacing and connector breaks. Also run
the existing timeline and virtualization regression pages, plus the bundle and
registry contract tests.
