import { uiLoader } from "../ui/ui.loader.js?v=0.21.211";

const kind = document.body.dataset.component;
const reorder = kind === "reorder.groups";
const name = `ui.${kind}`;
const title = { "inline.text": "Inline Text", "inline.select": "Inline Select", "inline.date": "Inline Date", "reorder.groups": "Grouped Reorder" }[kind];
const factoryName = { "inline.text": "createInlineText", "inline.select": "createInlineSelect", "inline.date": "createInlineDate", "reorder.groups": "createReorderGroups" }[kind];
window.demoMeta = {
  title,
  overview: reorder ? "Move individual items within and between groups using a drag handle or keyboard." : "Edit one value in place with validation, explicit save/cancel, and visible async save feedback.",
  useWhen: [reorder ? "Use for ordered tasks grouped into milestones, including empty groups." : "Use for a single field that can be saved independently."],
  avoidWhen: [reorder ? "Keep persistence and authorization in the application." : "Use a canonical form modal when several related fields must be validated and saved together."],
  description: "All saves in this demo are local simulations. See the Planning Overview for the combined components.",
  defaultSampleCode: reorder ? 'createReorderGroups(host, groups, { onReorder(change) {\n  // Persist affected group orders atomically.\n  console.log(change.orderedIdsByGroup);\n} });' : `${factoryName}(host, {\n  label: "${kind === "inline.date" ? "Target date" : "Value"}",\n  value: ${kind === "inline.date" ? '"2026-10-01",\n  showTime: false, valueMode: "wall-clock"' : kind === "inline.select" ? '"open",\n  items: [{ id: "open", label: "Open" }, { id: "done", label: "Done" }]' : '"Project title", required: true'},\n  async onSave(value) { await persist(value); }\n});`,
  constructor: [{ factory: factoryName, arguments: reorder ? "host, groups, options" : "host, options", returns: "Component instance" }],
  options: reorder ? [
    { option: "groups", default: "[]", description: "Groups with stable id, label and items. Item IDs must be globally unique." },
    { option: "disabled / readOnly", default: "false", description: "Block reordering." },
    { option: "renderItem", default: "label", description: "Mount custom content and return a cleanup function." },
  ] : [
    { option: "value / label", default: "null / Value", description: "Committed value and accessible field label." },
    { option: "required / validate", default: "optional", description: "Validate before entering saving state." },
    { option: "disabled / readOnly", default: "false", description: "Prevent editing." },
    ...(kind === "inline.date" ? [{ option: "showTime / valueMode", default: "false / wall-clock", description: "Date-only civil strings by default; optional date-time or instant mode." }, { option: "min / max / disabledDates / locale", default: "picker defaults", description: "Passed through to the canonical datepicker." }] : []),
    ...(kind === "inline.select" ? [{ option: "items / searchable", default: "[] / true", description: "Canonical select options with id, label and optional disabled state." }] : []),
  ],
  events: [{ event: reorder ? "onReorder" : "onSave", arguments: reorder ? "change" : "value, { previousValue }", returns: reorder ? "void; application persists" : "Promise; reject on save failure" }],
  methods: (reorder ? ["getState()", "update(groups, options)", "setItemLocked(id, locked)", "cancel()", "destroy()"] : ["edit()", "save()", "cancel()", "update(options)", "getValue()", "getState()", "destroy()"]).map(method => ({ method, arguments: "See signature", returns: "See component guide" })),
};
document.querySelector("h1").textContent = `${title} Demo`;
await uiLoader.load(name);
const create = await uiLoader.get(name);
const host = document.querySelector("#componentHost"), log = document.querySelector("#log");
const report = state => { log.textContent = JSON.stringify(state, null, 2); };
const readOnly = document.querySelector("#readonly"), disabled = document.querySelector("#disabled"), fail = document.querySelector("#fail");
let api;
if (reorder) {
  document.querySelector("#failureControl").hidden = true;
  api = create(host, [{ id: "plan", label: "Planning", items: [{ id: "scope", label: "Confirm scope" }, { id: "design", label: "Review design" }] }, { id: "release", label: "Release", items: [] }], { onReorder: report });
} else {
  const options = kind === "inline.text" ? { label: "Project title", value: "Website refresh", required: true, maxLength: 80 } : kind === "inline.select" ? { label: "Status", value: "open", required: true, items: [{ id: "open", label: "Open" }, { id: "active", label: "In progress" }, { id: "done", label: "Done" }, { id: "archived", label: "Archived (unavailable)", disabled: true }] } : { label: "Target date", value: "2026-10-01", showTime: false, valueMode: "wall-clock", min: "2026-09-01", max: "2026-12-31", locale: "en-US" };
  api = create(host, { ...options, onStateChange: report, async onSave() { await new Promise(resolve => setTimeout(resolve, 650)); if (fail.checked) { fail.checked = false; throw new Error("Demo save failed. Your draft is preserved; try again."); } } });
  if (kind === "inline.date") {
    const label = document.createElement("label"); const toggle = document.createElement("input"); toggle.type = "checkbox"; label.append(toggle, " Include time"); document.querySelector(".controls").append(label);
    toggle.addEventListener("change", () => api.update({ showTime: toggle.checked, value: toggle.checked ? "2026-10-01T09:00:00" : "2026-10-01" }));
  }
}
for (const control of [readOnly, disabled]) control.addEventListener("change", () => { const options = { readOnly: readOnly.checked, disabled: disabled.checked }; if (reorder) api.update(undefined, options); else api.update(options); });
await (await import("./demo.planning.guide.js?v=1")).mountGuide({ kind, create, api, factoryName });
await import("./demo.shell.js?v=0.21.211");
