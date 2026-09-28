export function mountGuide({ kind, create, api, factoryName, createText }) {
  const reorder = kind === "reorder.groups";
  const page = document.querySelector("main.page");
  const el = (tag, text, className) => { const node = document.createElement(tag); if (text) node.textContent = text; if (className) node.className = className; return node; };
  const section = title => { const node = el("section", null, "panel"); const content = el("div", null, "developer-guide"); node.append(el("h2", title), content); page.append(node); return content; };
  const list = (host, entries) => { const ul = el("ul"); for (const entry of entries) ul.append(el("li", entry)); host.append(ul); };
  const sample = (host, code) => { const details = el("details"); details.append(el("summary", "Example code")); const pre = el("pre"); pre.append(el("code", code)); details.append(pre); host.append(details); };
  const intro = section("Try the complete workflow");
  list(intro, reorder ? [
    "Drag a handle within a group, then into the empty Release group. A translucent preview follows the pointer and a gap marks the destination.",
    "Focus a handle: Space or Enter picks up/drops, Up/Down changes position, Left/Right changes group, and Escape cancels.",
    "Toggle Read-only or Disabled above. Inspect the event below after a completed move; unchanged drops do not emit onReorder."
  ] : [
    "Click the value to edit. The check saves; X or Escape cancels. Clicking outside never submits.",
    "Enable Fail next save, change a value, then save. The simulated rejection preserves the draft; correct it or explicitly save again.",
    kind === "inline.text" ? "Clear the required title and save to see validation before the request. Enter saves single-line text; Ctrl/Command+Enter saves multiline text." : "Select or date popups consume Escape first to close their popup; press Escape again to cancel the edit.",
    "Watch view → edit → saving → view after success, or error after validation/rejection. Read-only and Disabled prevent new edits."
  ]);
  const methods = el("div", null, "controls");
  for (const [label, action] of [["Inspect state", () => api.getState()], [reorder ? "Cancel move" : "Start editing", () => reorder ? api.cancel() : api.edit()]]) {
    const button = el("button", label); button.type = "button"; button.onclick = () => { document.querySelector("#log").textContent = JSON.stringify(action(), null, 2); }; methods.append(button);
  }
  intro.append(methods);
  const setup = section("Load and create");
  const code = `import { uiLoader } from "../js/ui/ui.loader.js";\n\nawait uiLoader.load("ui.${kind}");\nconst ${factoryName} = await uiLoader.get("ui.${kind}");\n\n${window.demoMeta.defaultSampleCode}\n\n// Dispose when this view is unmounted.\n// instance.destroy();`;
  const pre = el("pre"); pre.append(el("code", code)); setup.append(pre, el("p", "The host is a DOM element. persist() in the snippet represents your application request; these live examples use local simulations only."));
  const variants = {
    "inline.text": [
      ["Multiline notes", "Save with Ctrl/Command+Enter. A newline alone stays in the draft.", { label: "Notes", value: "Confirm scope\nReview acceptance criteria", multiline: true, maxLength: 240 }],
      ["Custom validation", "Try a short code or lowercase characters; use three uppercase letters, such as WEB.", { label: "Project code", value: "WEB", required: true, validate: value => /^[A-Z]{3}$/.test(value) ? "" : "Project code — use exactly three uppercase letters." }, '{ label: "Project code", value: "WEB", required: true,\n  validate: value => /^[A-Z]{3}$/.test(value)\n    ? "" : "Project code — use exactly three uppercase letters." }'],
      ["Optional empty value", "An unset field can remain empty. The placeholder names the action.", { label: "Reference", value: "", placeholder: "Add reference" }]
    ],
    "inline.select": [
      ["Searchable choices", "Open the editor, search for a team, and save. Stored values are IDs, not display labels.", { label: "Owner team", value: "design", searchable: true, items: [{ id: "design", label: "Design" }, { id: "engineering", label: "Engineering" }, { id: "support", label: "Support" }] }],
      ["Small fixed list", "Search can be disabled when there are only a few options.", { label: "Priority", value: "normal", searchable: false, items: [{ id: "low", label: "Low" }, { id: "normal", label: "Normal" }, { id: "urgent", label: "Urgent" }] }],
      ["Required selection", "Start empty, then save without a choice to see validation. Disabled options cannot be selected.", { label: "Release channel", value: null, required: true, items: [{ id: "stable", label: "Stable" }, { id: "preview", label: "Preview" }, { id: "legacy", label: "Legacy (unavailable)", disabled: true }] }]
    ],
    "inline.date": [
      ["Optional target date", "Starts unset. Date-only wall-clock values are civil dates without timezone conversion.", { label: "Target date", value: null, showTime: false, valueMode: "wall-clock" }],
      ["Bounded schedule", "Choose a date in October 2026; dates outside the range are unavailable.", { label: "October target", value: "2026-10-15", min: "2026-10-01", max: "2026-10-31", showTime: false, valueMode: "wall-clock" }],
      ["Local date and time", "This wall-clock value has no timezone. Use instant mode for a moment shared across timezones.", { label: "Local appointment", value: "2026-10-01T09:00:00", showTime: true, valueMode: "wall-clock" }]
    ]
  };
  const gallery = section("Live recipes");
  const instances = [];
  if (!reorder) for (const [heading, description, options, customCode] of variants[kind]) {
    const card = el("article", null, "recipe"); card.append(el("h3", heading), el("p", description)); const host = el("div"); const output = el("pre", "No save yet.", "log"); output.setAttribute("aria-live", "polite"); card.append(host, output); gallery.append(card);
    instances.push(create(host, { ...options, async onSave(value, { previousValue }) { await new Promise(resolve => setTimeout(resolve, 350)); output.textContent = JSON.stringify({ previousValue, value }, null, 2); } }));
    sample(card, `${factoryName}(host, ${customCode || JSON.stringify(options, null, 2)});`);
  } else {
    const groups = [{ id: "backlog", label: "Backlog", items: [{ id: "editable", label: "Movable work" }, { id: "locked", label: "Locked work", disabled: true }] }, { id: "ready", label: "Ready", items: [] }];
    const host = el("div"), output = el("pre", "Move an item to inspect the full event.", "log");
    gallery.append(el("p", "This board demonstrates an item lock and an empty destination. The lock control uses setItemLocked without rebuilding row content."), host, output);
    const board = create(host, groups, { emptyText: "Move ready work here", onReorder: change => { output.textContent = JSON.stringify(change, null, 2); } }); instances.push(board);
    const label = el("label"), toggle = el("input"); toggle.type = "checkbox"; toggle.checked = true; toggle.onchange = () => board.setItemLocked("locked", toggle.checked); label.append(toggle, " Lock second item"); gallery.append(label);
    sample(gallery, `const board = createReorderGroups(host, ${JSON.stringify(groups, null, 2)}, {\n  emptyText: "Move ready work here",\n  onReorder(change) { console.log(change); }\n});\nboard.setItemLocked("locked", false);`);
  }
  if (reorder) {
    const recipe = section("Editable milestones and group ordering");
    recipe.append(el("p", "Move a milestone using its header grip, or edit its title. A group containing an active editor cannot be moved. The simulated request locks the board for 900ms without rebuilding any editors."));
    const target = el("div"), events = el("pre", "No group moves yet.", "log");
    let board;
    const saveOrder = async change => {
      board.setInteractionLocked(true); events.textContent = "Saving order...";
      await new Promise(resolve => setTimeout(resolve, 900));
      board.setInteractionLocked(false); events.textContent = JSON.stringify(change, null, 2);
    };
    board = create(target, [
      { id: "discover", label: "Discovery", items: [{ id: "interview", label: "Interview users" }] },
      { id: "ship", label: "Delivery", items: [{ id: "publish", label: "Publish release" }] }
    ], {
      reorderGroups: true,
      renderGroupHeader(host, group) {
        const editor = createText(host, { label: "Milestone title", value: group.label, onSave: value => { board.setGroupLabel(group.id, value); } });
        return () => editor.destroy();
      }, onGroupReorder: saveOrder, onReorder: saveOrder
    });
    instances.push(board);
    const lock = el("button", "Simulate pending request (900ms)"); lock.type = "button";
    lock.onclick = async () => { if (board.getState().interactionLocked) return; lock.disabled = true; board.setInteractionLocked(true); await new Promise(resolve => setTimeout(resolve, 900)); board.setInteractionLocked(false); lock.disabled = false; };
    const controls = el("div", null, "controls"); controls.append(lock);
    recipe.append(controls, target, events);
    sample(recipe, `const board = createReorderGroups(host, groups, {
  reorderGroups: true,
  renderGroupHeader(host, group, { groupId, index }) {
    const editor = createInlineText(host, {
      label: "Milestone title", value: group.label,
      async onSave(value) {
        await saveMilestoneTitle(group.id, value);
        board.setGroupLabel(group.id, value);
      }
    });
    return () => editor.destroy();
  },
  onGroupReorder(change) {
    // Application: persist change.orderedGroupIds with versions atomically.
    console.log(change.groupId, change.fromIndex, change.toIndex);
  }
});
board.setInteractionLocked(true); // preserves drafts and permission flags
board.setInteractionLocked(false);`);
  }
  const integration = section("Application integration");
  list(integration, reorder ? [
    "IDs: group IDs must be unique; item IDs must be globally unique across every group. IDs normalize to strings.",
    "onReorder fires after the local move with itemId, source/destination IDs and zero-based indices, previousGroups, groups, and orderedIdsByGroup. toIndex is the final index after source removal.",
    "Persist membership and both affected order arrays atomically with server authorization and version checks. Lock during the request with setInteractionLocked(true); unlock only after confirmation or reconciliation.",
    "On confirmed success, update with authoritative server data. On definite failure, restore previousGroups. Reconcile an uncertain outcome before allowing another write; no automatic retry is provided.",
    "renderItem(host, item, { groupId }) can return a cleanup function or { destroy() }. DOM survives moves; groupId is initial mount context. update() rebuilds rows and runs cleanup.",
    "Rows with active inline editors cannot be dragged; groups containing active editors cannot be moved. Custom editors should use isItemLocked/isGroupLocked. Finish or preserve drafts before update(), which still rebuilds the whole board."
  ] : [
    "validate(value, { value: previousValue }) is synchronous: return an error string or false to reject; return true or an empty value to accept. Server validation belongs in onSave.",
    "onSave(value, { previousValue }) may return a Promise. Resolve only on confirmed success; reject with an actionable message or return false on failure. The old committed value remains until success.",
    "During saving, controls are busy and Save/Cancel are disabled. Failures preserve the draft and require an explicit retry; the component never retries automatically.",
    "update(options) replaces context and exits editing. destroy() removes the component and its popup controls. Both ignore stale completions but cannot undo an already-sent server mutation.",
    "Keep authorization and version/conflict handling on the server. Reconcile uncertain network outcomes before enabling another save. Use a form modal when multiple fields must save as one transaction.",
    "Keep label meaningful even when visible column headers are hidden. formatValue(value) changes display only; getValue() returns the committed value."
  ]);
  const meta = window.demoMeta;
  meta.methods = (reorder ? [
    ["setGroupLabel(id, label)", "group ID, string", "boolean; refresh group state and accessible labels without remounting custom content"], ["setInteractionLocked(locked)", "boolean", "Suspend board interaction without rebuilding editors or clearing permission flags"], ["getState()", "none", "{ groups, dragging, interactionLocked }; groups is a snapshot"], ["update(groups?, options?)", "replacement groups and/or options", "Rebuild rows; cancels active move and invokes cleanup"], ["setItemLocked(id, locked)", "item ID, boolean", "Update item disabled flag without rebuilding"], ["cancel()", "none", "Cancel current move"], ["destroy()", "none", "Dispose rows, previews and listeners"]
  ] : [
    ["edit()", "none", "boolean: whether editing started"], ["save()", "none", "Promise<boolean>: confirmed save or false"], ["cancel()", "none", "boolean: false while saving or inactive"], ["update(options)", "partial options", "Exit editing and replace supplied options/value"], ["getValue()", "none", "Committed value (not draft)"], ["getState()", "none", "{ state, value, draft, error, active, disabled, readOnly }"], ["destroy()", "none", "Dispose editor and popup controls"]
  ]).map(([method, args, returns]) => ({ method, arguments: args, returns }));
  meta.options.push(...(reorder ? [
    ["reorderGroups", "false", "Opt in to group handles; existing item moves remain available."], ["renderGroupHeader(host, group, context)", "plain heading", "Mount header controls; context has groupId and initial index. Return cleanup function or { destroy() }."], ["isGroupLocked(group)", "unset", "Return true to prevent group pickup."], ["emptyText", "Drop an item here", "Text for an empty group."], ["isItemLocked(item, group)", "unset", "Return true to prevent pickup."], ["groups/items disabled", "false", "Disable a group or individual item."]
  ] : [
    ["placeholder", "Not set", "Display for an empty value."], ["formatValue(value)", "built-in formatting", "Custom display text; does not change stored value."], ["onStateChange(state)", "unset", "Observe editing, saving and error states."],
    ...(kind === "inline.text" ? [["multiline", "false", "Use a textarea; Ctrl/Command+Enter saves."], ["minLength / maxLength", "unset", "Length validation before saving."]] : [])
  ]).map(([option, value, description]) => ({ option, default: value, description })));
  meta.propertiesText = reorder ? "Use getState() to inspect groups and the current insertion target. Do not mutate the returned snapshot to update the component." : "Use getState() for the full lifecycle snapshot. value is committed; draft is the current edit. The root emits bubbling ui:inline-state events for editor/reorder coordination.";
  if (reorder) meta.events.push({ event: "onGroupReorder", arguments: "{ groupId, fromIndex, toIndex, orderedGroupIds, previousGroups, groups }", returns: "Notification after local move; application owns persistence and rollback" });
  if (!reorder) meta.events.push({ event: "onStateChange", arguments: "state snapshot", returns: "void; observation only" });

}
