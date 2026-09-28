# Grouped reordering and inline editors

UI revision 0.21.211 introduced `ui.reorder.groups`, `ui.inline.text`,
`ui.inline.select`, and `ui.inline.date`. Load the names with `uiLoader.loadMany`,
then obtain their factories with `uiLoader.get`. Source imports and the main UI
bundle provide the same API. See `demos/demo.planning.html` for a local save/failure demo.

The shared demo navigation's Planning section also links dedicated component pages:
`demo.reorder.groups.html`, `demo.inline.text.html`, `demo.inline.select.html`, and
`demo.inline.date.html`. Each includes an interactive playground, live recipes with code, keyboard guidance,
setup instructions, lifecycle and persistence notes, and method/option references.
The overview composes the four helpers and includes an optional shared column header;
that header is page content rather than a reorder component option.

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
The UI applies the move immediately. In 0.21.213 use `setInteractionLocked(true)`
during persistence to retain mounted editors. Reconciliation with `update` rebuilds
content, so preserve or finish drafts before restoring authoritative data on failure. The component never sends requests or automatically rolls back server data.

Persist source/destination membership and **both** affected orders in one atomic
transaction with server authorization and optimistic concurrency/version checks.
Never send a sequence of independent row writes that can leave partial ordering.
Reconcile an uncertain response before retrying, and apply authoritative server
normalization using `update`. Keep app persistence out of renderer cleanup hooks.

## Verification

`tests/planning.regression.html` and `?bundle` exercise the same behavior against
source and distributable factories. Physical touch and other browser engines require
their own platform validation; emulated pointer events are not physical-device proof.


## Movable, editable groups (0.21.213)

Group movement is opt-in with `reorderGroups: true`. Omitted/false retains the
existing item-only behavior and plain group headings. The new callback
`onGroupReorder(change)` receives:

```js
{
  groupId, fromIndex, toIndex, // zero-based final index after removal
  orderedGroupIds,            // complete final order of every group
  previousGroups, groups      // shallow group/item snapshots
}
```

It fires once after a changed local drop, independently of `onReorder` for item
moves. Neither callback awaits promises or performs requests, rollback, retries,
or version checks. Item membership and item order are unchanged by a group move.
Group and item IDs may overlap; IDs must still be unique within their respective
namespaces. Disabled groups cannot be picked up or receive moved items. Moving
another group past a disabled group may change its index; disabled is a pickup
restriction, not a fixed-position constraint. `isGroupLocked(group)` supplies an
additional application pickup predicate, analogous to `isItemLocked(item,group)`.

Group handles use Space/Enter to pick up/drop, Up/Down for insertion position,
and Escape to cancel. Pointer moves use the same translucent clone and reserved
gap as item moves. Drop restores handle focus and announces the new position.
Groups containing an active inline editor (header or item) cannot be picked up.
Moving a different group preserves all existing DOM and drafts.

`renderGroupHeader(host, group, {groupId,index})` mounts arbitrary canonical
header components and returns a cleanup function or `{destroy()}`. Context is
initial mount context, not live group position. Return cleanup for every mounted
editor. This hook also works without enabling group dragging. The region/list
keeps its accessible group label; custom header content must provide meaningful
field labels and any desired heading semantics. `update()` rebuilds headers and
rows and calls their cleanup once; `destroy()` disposes both. Normal moves do not
remount either. Use current state/event payloads for current position.

```js
const board = createReorderGroups(host, groups, {
  reorderGroups: true,
  renderGroupHeader(slot, milestone) {
    const title = createInlineText(slot, {
      label: "Milestone title", value: milestone.label, required: true,
      onSave: value => saveMilestoneTitle(milestone.id, value),
    });
    return () => title.destroy();
  },
  onGroupReorder: change => { void persistOrder("groups", change); },
  onReorder: change => { void persistOrder("items", change); },
});
```

### Non-rebuilding pending lock

`board.setInteractionLocked(true)` cancels any active drag and makes the board
inert/busy, disabling both kinds of handles and suspending composed inline
Save/Cancel/edit APIs. `false` releases only this temporary lock; it never clears
board disabled/readOnly or group/item/predicate permission restrictions. The
value is exposed as `getState().interactionLocked`. Repeating the same value is
idempotent. Locking does not call renderer cleanup or replace header/row/editor
DOM. Text drafts, inline phase/errors and selected date/select drafts remain.
An open date/select popup is closed (its transient picker may be remounted) so
portaled choices cannot stay interactive. Closed popups do not reopen on unlock.
Focus returns to the prior connected control when the document body still holds
focus; the library does not take focus back from an outside control.

The lock does not abort a running request. Inline save already in progress may
complete while locked, but further saves are blocked. Arbitrary custom controls
with external portals or their own programmatic mutation methods must honor the
application's pending gate; inert only covers DOM descendants. Application-owned
server validation and authorization remain mandatory. `disabled`/`readOnly` in
`update()` retain their original behavior and do not automatically set nested
editor options; use the explicit interaction lock for pending operations.

### Reconciliation and failure

Use one authorized transactional mutation for complete group order, or for
item membership plus both affected item orders, with application-held versions.
Catch errors in the persistence workflow: rejected callback promises are not
handled by the board. Lock immediately before awaiting the request. On confirmed
success update the application's authoritative records; if server normalization
requires `board.update(...)`, first preserve or resolve unrelated drafts because
update remains a deliberate rebuild. On a definite failure display canonical
error feedback and restore prior authoritative records; on an uncertain result
keep writes gated and fetch/reconcile authoritative state before unlocking.
Never automatically replay the write.

The combined demo prevents any reorder while a field draft is active using
`isItemLocked` and `isGroupLocked`, then demonstrates async lock/unlock and safe
failure restoration. The dedicated Grouped Reorder guide separately demonstrates
that a pending lock preserves drafts in another group. More concurrent products
can retain their drafts keyed by stable IDs and restore them during reconciliation.
Persistence, versions, transactions and uncertain-outcome handling stay outside
Helper. The optional shared column header remains page-owned.
