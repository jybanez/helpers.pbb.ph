import { uiLoader } from "../ui/ui.loader.js";
if (new URLSearchParams(location.search).has("bundle")) uiLoader.setPreferBundles(true);
const [createTools, createAdapter] = await Promise.all([uiLoader.get("ui.map.drawing"), uiLoader.get("ui.map.drawing.maplibre")]);
const style = { version: 8, sources: {}, layers: [{ id: "background", type: "background", paint: { "background-color": "#20344a" } }] };
const map = new maplibregl.Map({ container: "map", style, center: [123.8854, 10.3157], zoom: 12, attributionControl: false });
const status = document.querySelector("#status"), log = document.querySelector("#log");
let adapter, tools;
const events = [];
const sample = [
  { type: "Feature", id: 0, properties: { name: "Waypoint", nested: { retained: true } }, geometry: { type: "Point", coordinates: [123.875, 10.32] } },
  { type: "Feature", id: "route", properties: { name: "Route" }, geometry: { type: "LineString", coordinates: [[123.89, 10.33], [123.9, 10.32]] } },
  { type: "Feature", id: "area", properties: { name: "Area" }, geometry: { type: "Polygon", coordinates: [[[123.88, 10.30], [123.89, 10.30], [123.885, 10.31], [123.88, 10.30]]] } },
];
function updateStatus() { const state = adapter.getState(); status.textContent = state.destroyed ? "Adapter destroyed. Map navigation restored." : `${state.mode} · ${state.features.length} features · ${state.draft.length} draft vertices · selected ${state.selectedFeatureId ?? "none"}`; }
function recreate() {
  tools?.destroy(); adapter?.destroy();
  adapter = createAdapter(map, { onError(error) { status.textContent = error.message; } });
  tools = createTools(document.querySelector("#tools"), { adapter, orientation: "horizontal", placement: "external", labels: "always", modes: ["select", "pan", "point", "line", "polygon", "rectangle", "circle"] });
  for (const name of ["create", "update", "delete", "select", "modechange", "measure"]) adapter.on(name, payload => {
    if (name !== "measure") { events.push({ name, payload }); log.textContent = JSON.stringify(events.slice(-4), null, 2); }
    updateStatus();
  });
  window.__drawing = { map, adapter, tools, events, sample, style, listenerBaseline };
  updateStatus();
}
const listenerBaseline = Object.fromEntries(["click", "style.load", "styledata", "remove"].map(name => [name, map._listeners?.[name]?.length || 0]));
map.once("load", () => { recreate(); window.__drawingReady = true; });
document.querySelector("#import").onclick = () => tools.setFeatures(sample);
document.querySelector("#export").onclick = () => { log.textContent = JSON.stringify({ type: "FeatureCollection", features: adapter.getFeatures() }, null, 2); };
document.querySelector("#reload").onclick = () => map.setStyle(structuredClone(style));
document.querySelector("#destroy").onclick = () => { tools.destroy(); adapter.destroy(); updateStatus(); };
document.querySelector("#recreate").onclick = recreate;
window.addEventListener("pagehide", () => { tools?.destroy(); adapter?.destroy(); map.remove(); }, { once: true });
