# Timeline pagination loading (0.21.222)

The complete Timeline renders its own loading presentation. Applications own the request, error message and explicit retry; no application overlay is needed.

```js
timeline.update(undefined, { isLoading: true, loadingText: "Loading older messages…" });
try {
  const page = await fetchOlderMessages();
  timeline.append(page.items);
  timeline.update(undefined, { isLoading: false, hasMore: page.hasMore });
} catch (error) {
  timeline.update(undefined, { isLoading: false });
  showRetry(error, () => timeline.resetReachEnd());
}
```

Guard against late responses after disposal or project/context changes in the application. Do not automatically retry an unsuccessful request. Clear loading on both success and failure. `hasMore: false` suppresses future end callbacks; it does not override an explicitly true `isLoading`.

- `isLoading` defaults to false. True displays a text indicator **after the loaded items**, or instead of the empty-state message when no items are visible.
- `loadingText` defaults to `Loading timeline items…`. Supply a localized, non-empty label. It is inserted as text, never HTML. Long visual labels are ellipsized; the screen-reader status receives the complete label.
- The region exposes `aria-busy`. A separate polite, atomic `role="status"` sibling is outside that busy region so loading announcements are not deferred until loading finishes. No focus is moved and existing controls remain usable.
- A 36px pagination-end slot remains reserved while idle. This intentionally keeps scroll bounds stable when loading is cleared at the bottom; there is no animation or reduced-motion dependency. In virtual mode it follows the bottom spacer, outside the measured item window.
- `update(undefined, { isLoading, hasMore, loadingText })` changes only pagination state. It retains row DOM, custom mounts, unsaved values, focus and scroll position without a render pass. Pass a collection when replacing item data; other presentation options still use the normal rendering path.
- Loading/hasMore toggles do not reset the reached-boundary latch. A new last item can trigger a new request; an explicit `resetReachEnd()` enables retry. Loading or `hasMore: false` suppresses callbacks. Existing `onReachEnd` behavior remains **virtual-vertical only**; static/horizontal consumers trigger their own pagination and can use the same loading presentation.
- `destroy()` removes both the timeline and its status node. Later `update()` calls do nothing.

Try the **Show pagination loading** control in [the Timeline demo](../demos/demo.timeline.html). Run `node tests/timeline.loading.regression.mjs` for modular/bundled loading, accessibility attributes, retained mounts/focus/scroll, boundary latch, empty and horizontal behavior.
