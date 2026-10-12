import { uiLoader } from "../ui/ui.loader.js?v=0.21.301";
if (new URLSearchParams(location.search).has("bundle")) uiLoader.setPreferBundles(true);
const [createTools, createAdapter] = await Promise.all([uiLoader.get("ui.map.drawing"), uiLoader.get("ui.map.drawing.maplibre")]);
const createActionModal = await uiLoader.get("ui.action.modal");
const createColorPicker = await uiLoader.get("ui.color.picker");
const style = { version: 8, sources: {}, layers: [{ id: "background", type: "background", paint: { "background-color": "#20344a" } }] };
const map = new maplibregl.Map({ container: "map", style, center: [123.8854, 10.3157], zoom: 12, attributionControl: false });
const status = document.querySelector("#status"), log = document.querySelector("#log");
let adapter, tools;
let pendingDelete = null;
const fillPicker = createColorPicker(document.querySelector("#fill-color"), { label: "Fill", value: { r: 80, g: 184, b: 255, a: 0.22 } });
const strokePicker = createColorPicker(document.querySelector("#stroke-color"), { label: "Stroke", value: "#50b8ff" });
function cancelPendingDelete() { pendingDelete?.request.cancel(); pendingDelete?.modal.close(); pendingDelete = null; }
function beforeDelete(request) {
  if (!document.querySelector("#confirm-delete").checked) return true;
  if (pendingDelete) { request.cancel(); return false; }
  const owner = adapter;
  const pending = { request, modal: null }; pendingDelete = pending;
  const modal = createActionModal({
    title: request.action === "clear" ? "Clear drawings" : "Delete drawing", size: "sm", autoBusy: false,
    content: request.action === "clear" ? "Clear all drawings and the current draft?" : "Delete the selected drawing?",
    actions: [{ id: "cancel", label: "Cancel", onClick() { request.cancel(); } },
    { id: "confirm", label: request.action === "clear" ? "Clear" : "Delete", variant: "danger", onClick() {
      const changed = adapter === owner && request.confirm();
      if (!changed) status.textContent = "Drawing context changed. Nothing was deleted.";
    } }],
    onBeforeClose() { request.cancel(); return true; },
    onClose() { request.cancel(); if (pendingDelete === pending) pendingDelete = null; modal.destroy(); },
  });
  pending.modal = modal; modal.open();
  return false;
}
const events = [];
const sample = [
  { type: "Feature", id: 0, properties: { name: "Waypoint", nested: { retained: true } }, geometry: { type: "Point", coordinates: [123.875, 10.32] } },
  { type: "Feature", id: "route", properties: { name: "Route" }, geometry: { type: "LineString", coordinates: [[123.89, 10.33], [123.9, 10.32]] } },
  { type: "Feature", id: "area", properties: { name: "Area" }, geometry: { type: "Polygon", coordinates: [[[123.88, 10.30], [123.89, 10.30], [123.885, 10.31], [123.88, 10.30]]] } },
];
function updateStatus() { const state = adapter.getState(); status.textContent = state.destroyed ? "Adapter destroyed. Map navigation restored." : `${state.mode} · ${state.features.length} features · ${state.draft.length} draft vertices · selected ${state.selectedFeatureId ?? "none"}${state.editSession ? ` · object edit ${state.editSession.dirty ? "changed" : "unchanged"}` : ""}`;
  document.querySelector("#edit-object").disabled = state.destroyed || !!state.editSession || state.selectedFeatureId === null || state.mode !== "select" || state.dragging;
  document.querySelector("#apply-style").disabled = state.destroyed || !state.editSession || state.dragging;
}
function recreate() {
  cancelPendingDelete();
  tools?.destroy(); adapter?.destroy();
  adapter = createAdapter(map, { beforeDelete, onError(error) { status.textContent = error.message; } });
  tools = createTools(document.querySelector("#tools"), { adapter, orientation: "horizontal", placement: "external", labels: "always", actions: ["finish", "cancel", "fill", "stroke", "undo", "redo", "delete", "clear"], onAction(action) { if (["fill", "stroke"].includes(action)) document.querySelector(`#${action}-color input`)?.focus(); }, modes: ["select", "pan", "point", "line", "polygon", "rectangle", "circle"] });
  for (const name of ["create", "update", "delete", "select", "modechange", "measure"]) adapter.on(name, payload => {
    if (name !== "measure") { events.push({ name, payload }); log.textContent = JSON.stringify(events.slice(-4), null, 2); }
    updateStatus();
  });
  adapter.on("statechange", updateStatus);
  window.__drawing = { map, adapter, tools, events, sample, style, listenerBaseline, get deletionPending() { return !!pendingDelete; } };
  updateStatus();
}
const listenerBaseline = Object.fromEntries(["click", "style.load", "styledata", "remove"].map(name => [name, map._listeners?.[name]?.length || 0]));
map.once("load", () => { recreate(); window.__drawingReady = true; });
document.querySelector("#import").onclick = () => tools.setFeatures(sample);
document.querySelector("#export").onclick = () => { log.textContent = JSON.stringify({ type: "FeatureCollection", features: adapter.getFeatures() }, null, 2); };
document.querySelector("#reload").onclick = () => map.setStyle(structuredClone(style));
document.querySelector("#destroy").onclick = () => { cancelPendingDelete(); tools.destroy(); adapter.destroy(); updateStatus(); };
document.querySelector("#recreate").onclick = recreate;
document.querySelector("#edit-object").onclick = () => { if (adapter.beginEdit()) { const style = adapter.getFeatureStyle(); fillPicker.setValue(style.fill || { r: 80, g: 184, b: 255, a: .22 }); strokePicker.setValue(style.stroke || "#50b8ff"); } };
document.querySelector("#apply-style").onclick = () => { const state = adapter.getState(); adapter.updateFeature(state.selectedFeatureId, { style: { fill: fillPicker.getValue(), stroke: strokePicker.getValue() } }, { sessionId: state.editSession?.id }); };
window.addEventListener("pagehide", () => { cancelPendingDelete(); tools?.destroy(); adapter?.destroy(); map.remove(); }, { once: true });
