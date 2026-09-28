# Grouped reordering and inline editors

Candidate UI revision 0.21.211 adds `ui.reorder.groups`, `ui.inline.text`,
`ui.inline.select`, and `ui.inline.date`. Load the names with `uiLoader.loadMany`,
then obtain their factories with `uiLoader.get`. Source imports and the main UI
bundle provide the same API. See `demos/demo.planning.html` for a local save/failure demo.

The shared demo navigation's Planning section also links dedicated component pages:
`demo.reorder.groups.html`, `demo.inline.text.html`, `demo.inline.select.html`, and
`demo.inline.date.html`. Each includes an interactive example and API reference.

## Inline editors

`createInlineText(host, options)`, `createInlineSelect(host, options)`, and
`createInlineDate(host, options)` return `edit()`, `save()` (Promise<boolean>),
`cancel()`, `update(options)`, `getValue()`, `getState()`, and `destroy()`.

Common options: `label`, `value`, `placeholder`, `required`, `disabled`, `readOnly`,
`formatValue(value)`, synchronous `validate(value, {value: previousValue})` returning
an error string/false or empty/true, `onSave(value, {previousValue})`, and
`onStateChange(state)`. `getState()` includes state (`view`, `edit`, `saving`, `error`),
value, draft, error, active, disabled and readOnly. The root `data-state` also exposes
disabled/readonly. Use explicit Save/Cancel; blur does not submit.

Text supports `multiline`, `minLength`, `maxLength`. Enter saves single-line text;
Ctrl/Command+Enter saves multiline text. Select supports `items` using canonical
`{id,label,disabled}` entries and `searchable`. It composes `createSelect` in
single-selection mode. Date composes `createDatepicker` in single-date mode and
passes through `showTime`, `valueMode`, `min`, `max`, `disabledDates`, `locale`,
`placeholder`, and other canonical picker options. Defaults are `showTime:false`
and `valueMode:"wall-clock"`: save emits `YYYY-MM-DD` or null, with no time control.
With `showTime:true`, wall-clock output includes time without a zone. Instant mode
uses the canonical ISO instant output. In wall-clock mode `disabledDates` receives
a civil date string; in instant mode it receives a Date, matching the picker.

Validation runs before the save callback or busy state. Field errors use Helper's
canonical accessible error association. A rejected `onSave` keeps the draft and
committed value; an explicit subsequent Save is required. Resolve on confirmed
success; reject with a user-facing actionable error, or return false to reject.
No automatic retries occur. Escape cancels an edit (a picker/select first consumes
Escape to dismiss its own popup); a pending mutation cannot be cancelled/replayed.
Successful Save or Cancel restores focus to the view control.

`update` replaces context and exits editing; `destroy` disposes controls and portals.
Both invalidate late save responses, but do **not** cancel a server mutation.
Reconcile uncertain outcomes in the application before offering another save.
The UI keeps its old committed value until confirmation. If the app optimistically
updates another surface, it must retain and restore that surface's prior value on
a definite failure and reconcile before retry on an unknown outcome.

## Grouped reorder

```js
const board = createReorderGroups(host, [
  { id: "milestone-a", label: "Planning", items: [{ id: "task-1", label: "Scope" }] },
  { id: "milestone-b", label: "Release", items: [] },
], { renderItem, onReorder });
```

Group IDs must be unique; item IDs must be globally unique across groups. IDs are
normalized to strings. `renderItem(host,item,{groupId})` may return a cleanup function
or `{destroy()}`. Its DOM survives moves; the initial groupId is mount context, not
a live location. Use event payload/current state for current placement.

Options: `disabled`, `readOnly`, `emptyText`, `isItemLocked(item,group)`,
`renderItem`, `onReorder`. Groups/items may have `disabled:true`. API:
`getState()`, `update(groups?, options?)`, `setItemLocked(id,boolean)`, `cancel()`,
`destroy()`. `update` rebuilds content and invokes its cleanup hooks; use it for
authoritative refresh/rollback, not on every keystroke. Finish/reconcile active
edits before replacing rows. `setItemLocked` changes the item's disabled flag.

Only the handle initiates pointer/touch moves.
Pointer dragging displays an inert translucent copy while the original stays dimmed.
A row-height placeholder reserves the proposed destination. Drop, cancellation,
update, and destruction remove both previews. The slim borderless handle highlights
on hover, keyboard focus, or pickup, retaining a larger touch target.
Keyboard: Space/Enter picks up or drops; Up/Down changes insertion position; Left/Right moves to an enabled group,
including an empty group; Escape cancels. Feedback and a live announcement expose
the insertion target. Each item remains a list item with independent controls.
Inline editor `ui:inline-state` events and `data-inline-active` suspend dragging
for that row while editing, saving, or showing a save error. Custom editors can use
`setItemLocked`; reordering and editing are not otherwise coupled.

`onReorder` runs once after a changed drop with:
`{itemId,fromGroupId,fromIndex,toGroupId,toIndex,orderedIdsByGroup,previousGroups,groups}`.
Indices are zero-based, and toIndex is the final index **after removal** from the
source. `orderedIdsByGroup` contains complete order arrays for affected groups.
The UI applies the move immediately. Call `update` with the accepted data to lock
reordering during persistence; restore the previous authoritative data on a definite
failure. The component never sends requests or automatically rolls back server data.

Persist source/destination membership and **both** affected orders in one atomic
transaction with server authorization and optimistic concurrency/version checks.
Never send a sequence of independent row writes that can leave partial ordering.
Reconcile an uncertain response before retrying, and apply authoritative server
normalization using `update`. Keep app persistence out of renderer cleanup hooks.

## Verification

`tests/planning.regression.html` and `?bundle` exercise the same behavior against
source and distributable factories. Physical touch and other browser engines require
their own platform validation; emulated pointer events are not physical-device proof.
