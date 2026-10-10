import { createPersonMesh, createPersonRenderer } from "./ui.map.location.person.renderer.js";

// MapLibre GL JS 4.6 only: terrain query and render matrices are center-relative.
export function createMapLocationPerson(options = {}) {
  const settings = { id: "helper-current-location-person", label: "Current location", sizePx: 34, ...options };
  if (!settings.maplibre?.MercatorCoordinate?.fromLngLat) throw new TypeError("Supply MapLibre 4.6 with MercatorCoordinate.");
  const version = String(settings.maplibre.getVersion?.() || settings.maplibre.version || "");
  if (!/^4\.6\./.test(version)) throw new TypeError("3D location person requires MapLibre GL JS 4.6.x.");
  const id = String(settings.id).trim();
  if (!id) throw new TypeError("A nonempty layer id is required.");
  let coordinate = validateCoordinate(settings.lngLat);
  let map = null, layer = null, renderer = null, destroyed = false, ownsLayer = false;
  let status = "waiting", error = null, attached = false, terrainOffsetMeters = 0, modelScale = 0;
  let offs = [], label = null;
  const mesh = createPersonMesh();
  const sizePx = Math.max(18, Math.min(64, Number(settings.sizePx) || 34));

  function getState() {
    return { id, status, error, attached, destroyed, lngLat: coordinate ? [...coordinate] : null,
      terrainOffsetMeters, modelScale, sizePx, hasResources: Boolean(renderer) };
  }
  function notify(next, failure = null) {
    if (status === next && error === failure) return;
    status = next; error = failure;
    if (label) label.hidden = next !== "rendered" || !coordinate;
    try { settings.onStateChange?.(getState()); } catch (callbackError) { console.error(callbackError); }
    if (failure) try { settings.onError?.({ error: failure, state: getState() }); } catch (callbackError) { console.error(callbackError); }
  }
  function fail(reason) {
    renderer?.dispose(); renderer = null;
    notify("error", String(reason?.message || reason));
  }
  function repaint() { if (!destroyed) map?.triggerRepaint?.(); }
  function disposeResources() { renderer?.dispose(); renderer = null; }
  function attach(styleReady = false) {
    if (destroyed || !map || status === "error" || (!styleReady && !map.isStyleLoaded())) return;
    if (map.getLayer(id)) {
      if (!attached) fail(new Error(`Layer id is already in use: ${id}`));
      return;
    }
    attached = false;
    const ownerMap = map;
    layer = {
      id, type: "custom", renderingMode: "3d",
      onAdd(owner, gl) {
        if (destroyed || owner !== map || layer !== this) return;
        try { disposeResources(); renderer = createPersonRenderer(gl, mesh); attached = true; notify("ready"); }
        catch (reason) { fail(reason); }
      },
      render(gl, matrix) {
        if (destroyed || ownerMap !== map || layer !== this || !renderer || !coordinate || status === "error" || status === "context-lost") return;
        try {
          const queried = map.queryTerrainElevation(coordinate);
          terrainOffsetMeters = queried == null ? 0 : Number(queried);
          if (!Number.isFinite(terrainOffsetMeters)) throw new Error("Terrain elevation is unavailable.");
          const anchor = settings.maplibre.MercatorCoordinate.fromLngLat(coordinate, terrainOffsetMeters);
          // Keep the copy nearest the current center while preserving exact longitude.
          const center = settings.maplibre.MercatorCoordinate.fromLngLat(map.getCenter(), 0);
          anchor.x += Math.round(center.x - anchor.x);
          const canvas = map.getCanvas();
          const width = canvas.clientWidth, height = canvas.clientHeight;
          const placement = getPersonPlacement(matrix, anchor, width, height, sizePx);
          if (!placement) return; // behind camera or zero-sized map
          modelScale = placement.scale;
          renderer.draw(placement.matrix);
          notify("rendered");
        } catch (reason) { fail(reason); }
      },
      onRemove() {
        if (ownerMap !== map || layer !== this) return;
        ownsLayer = false; attached = false; disposeResources();
        if (!destroyed && status !== "error") notify("waiting");
      },
    };
    try { ownsLayer = true; map.addLayer(layer, settings.beforeId); }
    catch (reason) { fail(reason); }
  }
  function detach(removeLayer = true) {
    offs.splice(0).forEach((off) => off());
    label?.remove(); label = null;
    if (removeLayer && ownsLayer && map?.getLayer(id)) map.removeLayer(id);
    ownsLayer = false; attached = false; disposeResources(); layer = null;
  }
  function setMap(next) {
    if (destroyed) return false;
    if (next === map) return true;
    if (next && !["on", "off", "addLayer", "removeLayer", "getLayer", "getCanvas", "getContainer", "getCenter", "isStyleLoaded", "queryTerrainElevation"].every((name) => typeof next[name] === "function")) {
      throw new TypeError("Supply a compatible MapLibre map.");
    }
    detach(); map = next || null; notify("waiting");
    if (!map) return true;
    const owner = map;
    const on = (name, handler) => { owner.on(name, handler); offs.push(() => owner.off(name, handler)); };
    on("idle", () => { if (owner === map) attach(); });
    on("style.load", () => {
      if (owner !== map || (ownsLayer && owner.getLayer(id))) return;
      ownsLayer = false; attached = false; disposeResources(); notify("waiting"); attach(true);
    });
    on("webglcontextlost", () => { renderer = null; notify("context-lost"); });
    on("webglcontextrestored", () => {
      if (owner !== map) return;
      disposeResources();
      // MapLibre may have recreated the custom-layer resources before this event.
      try { renderer = createPersonRenderer(owner.getCanvas().getContext("webgl2") || owner.getCanvas().getContext("webgl"), mesh); notify("ready"); repaint(); }
      catch (reason) { fail(reason); }
    });
    on("remove", () => { if (owner === map) { detach(false); map = null; notify("waiting"); } });
    const parent = settings.accessibilityParent || map.getContainer();
    label = parent.ownerDocument.createElement("span");
    label.className = "ui-map-location-person-label";
    label.hidden = true;
    label.setAttribute("role", "img"); label.setAttribute("aria-label", String(settings.label));
    parent.appendChild(label);
    attach(); repaint();
    return true;
  }
  function updateLngLat(next) {
    if (destroyed) return false;
    coordinate = validateCoordinate(next); notify(attached ? "ready" : "waiting"); repaint(); return true;
  }
  function retry() {
    if (destroyed || !map) return false;
    if (ownsLayer && map.getLayer(id)) map.removeLayer(id);
    attached = false; disposeResources(); notify("waiting"); attach(); repaint(); return true;
  }
  function destroy() {
    if (destroyed) return;
    destroyed = true; detach(); map = null; notify("destroyed");
  }
  const api = { setMap, updateLngLat, retry, destroy, getState };
  setMap(settings.map || null);
  return api;
}

function validateCoordinate(value) {
  if (value == null) return null;
  const lng = Number(Array.isArray(value) ? value[0] : value.lng), lat = Number(Array.isArray(value) ? value[1] : value.lat);
  if (!Number.isFinite(lng) || !Number.isFinite(lat) || Math.abs(lng) > 180 || Math.abs(lat) > 85.05112878) {
    throw new TypeError("Location must be finite longitude/latitude within Mercator bounds.");
  }
  return [lng, lat];
}

export function getPersonPlacement(matrix, anchor, width, height, sizePx) {
  if (!matrix || matrix.length !== 16 || !Array.from(matrix).every(Number.isFinite)) throw new Error("Invalid MapLibre render matrix.");
  if (!(width > 0 && height > 0)) return null;
  const clip = (x, y, z) => [0, 1, 2, 3].map((row) => matrix[row] * x + matrix[row + 4] * y + matrix[row + 8] * z + matrix[row + 12]);
  const origin = clip(anchor.x, anchor.y, anchor.z);
  if (origin[3] <= 0) return null;
  const pixel = (p) => [p[0] / p[3] * width / 2, p[1] / p[3] * height / 2];
  const p = pixel(origin), delta = 1e-7;
  const x = pixel(clip(anchor.x + delta, anchor.y, anchor.z)), y = pixel(clip(anchor.x, anchor.y + delta, anchor.z));
  const density = Math.hypot(x[0] - p[0], x[1] - p[1], y[0] - p[0], y[1] - p[1]) / delta;
  if (!(density > 0 && Number.isFinite(density))) throw new Error("Invalid projected scale.");
  const scale = sizePx / density; // scale adaptation only; perspective remains map-owned
  const combined = new Float32Array(16);
  for (let row = 0; row < 4; row++) {
    combined[row] = matrix[row] * scale;
    combined[row + 4] = -matrix[row + 4] * scale;
    combined[row + 8] = matrix[row + 8] * scale;
    combined[row + 12] = origin[row];
  }
  return { matrix: combined, scale };
}
