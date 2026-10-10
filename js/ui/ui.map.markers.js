import { createElement } from "./ui.dom.js";
import { createIcon } from "./ui.icons.js?v=0.21.86";

const ALLOWED_TYPES = new Set(["incident", "source-hub", "target-hub", "hotspot", "route", "boundary-centroid"]);
const ALLOWED_SHAPES = new Set(["pin", "dot", "hub", "cluster", "hotspot", "route"]);
const ALLOWED_TONES = new Set(["neutral", "info", "success", "warning", "danger", "critical"]);
const ALLOWED_SIZES = new Set(["sm", "md", "lg"]);

const DEFAULT_MARKER = {
  id: "",
  type: "incident",
  tone: "neutral",
  icon: "",
  label: "",
  count: "",
  selected: false,
  active: false,
  muted: false,
  size: "md",
  pulse: false,
  shape: "",
  color: "",
  meta: {},
};

const DEFAULT_CLUSTER = {
  count: 0,
  tone: "neutral",
  label: "",
  size: "md",
  selected: false,
  active: false,
  color: "",
};

export function createMapMarker(options = {}) {
  const marker = normalizeMarker(options);
  const root = createMarkerRoot(marker, false);
  const visual = createMarkerVisual(root);
  visual.appendChild(createShape(marker));
  if (marker.count !== "") {
    visual.appendChild(createCount(marker.count));
  }
  return root;
}

export function createMapClusterMarker(options = {}) {
  const cluster = normalizeCluster(options);
  const marker = {
    ...DEFAULT_MARKER,
    id: "cluster",
    type: "hotspot",
    shape: "cluster",
    tone: cluster.tone,
    label: cluster.label || `${cluster.count} markers`,
    count: cluster.count,
    selected: cluster.selected,
    active: cluster.active,
    size: cluster.size,
    color: cluster.color,
  };
  const root = createMarkerRoot(marker, true);
  const visual = createMarkerVisual(root);
  visual.appendChild(createShape(marker));
  visual.appendChild(createCount(cluster.count));
  return root;
}

function createMarkerVisual(root) {
  const visual = createElement("span", { className: "ui-map-marker-visual", attrs: { "aria-hidden": "true" } });
  root.appendChild(visual);
  let active = null;
  let destroyed = false;

  function settle(run, status) {
    if (run.settled) return;
    run.settled = true;
    if (active === run) active = null;
    // Remove the effect rather than committing transforms to inline style.
    run.animation.cancel();
    run.resolve({ status });
  }

  function cancelDrop() {
    if (!active) return false;
    settle(active, "cancelled");
    return true;
  }

  root.animateDrop = (options = {}) => {
    if (destroyed) return Promise.resolve({ status: "destroyed" });
    const duration = boundedNumber(options.duration, 650, 100, 3000);
    const distance = boundedNumber(options.distance, 80, 0, 500);
    const bounce = boundedNumber(options.bounce, 8, 0, 40);
    cancelDrop();
    const reduced = root.ownerDocument.defaultView?.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if ((reduced && options.essential !== true) || typeof visual.animate !== "function") {
      return Promise.resolve({ status: "skipped" });
    }
    let resolve;
    const finished = new Promise((done) => { resolve = done; });
    const animation = visual.animate([
      { transform: `translateY(${-distance}px)`, offset: 0, easing: "cubic-bezier(.45,0,.8,.6)" },
      { transform: "translateY(0px)", offset: .6, easing: "ease-out" },
      { transform: `translateY(${-bounce}px)`, offset: .76, easing: "ease-in" },
      { transform: "translateY(0px)", offset: .9, easing: "ease-out" },
      { transform: `translateY(${-bounce * .25}px)`, offset: .95, easing: "ease-in" },
      { transform: "translateY(0px)", offset: 1 },
    ], { duration, fill: "both" });
    const run = { animation, resolve, settled: false };
    active = run;
    animation.finished.then(() => {
      if (active === run) settle(run, "completed");
    }, () => {
      if (active === run) settle(run, "cancelled");
    });
    return finished;
  };
  root.cancelDrop = cancelDrop;
  root.destroy = () => {
    if (destroyed) return;
    destroyed = true;
    if (active) settle(active, "destroyed");
  };
  return visual;
}

function boundedNumber(value, fallback, min, max) {
  const number = value == null ? fallback : Number(value);
  return Number.isFinite(number) ? Math.max(min, Math.min(max, number)) : fallback;
}

export function getMapMarkerClass(options = {}) {
  const marker = normalizeMarker(options);
  return buildClassName(marker, false);
}

function createMarkerRoot(marker, cluster) {
  const root = createElement("span", {
    className: buildClassName(marker, cluster),
    attrs: {
      role: "img",
      "aria-label": buildLabel(marker, cluster),
      title: buildLabel(marker, cluster),
    },
    dataset: {
      id: marker.id,
      markerId: marker.id,
      type: marker.type,
      tone: marker.tone,
      shape: marker.shape,
      size: marker.size,
      selected: marker.selected ? "true" : "false",
      active: marker.active ? "true" : "false",
      muted: marker.muted ? "true" : "false",
      pulse: marker.pulse ? "true" : "false",
      count: marker.count,
    },
  });
  if (marker.color) {
    root.style.setProperty("--ui-map-marker-color", marker.color);
  }
  root.__uiMapMarker = {
    id: marker.id,
    type: marker.type,
    tone: marker.tone,
    shape: marker.shape,
    size: marker.size,
    meta: { ...marker.meta },
  };
  return root;
}

function createShape(marker) {
  const shape = createElement("span", {
    className: `ui-map-marker-shape ui-map-marker-shape--${marker.shape}`,
    attrs: { "aria-hidden": "true" },
  });
  if (marker.icon) {
    const iconWrap = createElement("span", { className: "ui-map-marker-icon" });
    try {
      iconWrap.appendChild(createIcon(marker.icon, { size: iconSize(marker.size) }));
      shape.appendChild(iconWrap);
    } catch (_error) {
      // Shape alone is a valid marker if an app supplies an unknown icon id.
    }
  }
  return shape;
}

function createCount(count) {
  return createElement("span", {
    className: "ui-map-marker-count",
    text: count,
    attrs: { "aria-hidden": "true" },
  });
}

function normalizeMarker(input = {}) {
  const next = { ...DEFAULT_MARKER, ...(input || {}) };
  const type = normalizeType(next.type);
  const shape = normalizeShape(next.shape || defaultShapeForType(type));
  return {
    ...next,
    id: String(next.id || ""),
    type,
    tone: normalizeTone(next.tone),
    icon: String(next.icon || ""),
    label: String(next.label || ""),
    count: next.count === null || next.count === undefined || next.count === "" ? "" : String(next.count),
    selected: next.selected === true,
    active: next.active === true,
    muted: next.muted === true,
    size: normalizeSize(next.size),
    pulse: next.pulse === true,
    shape,
    color: String(next.color || ""),
    meta: next.meta && typeof next.meta === "object" ? { ...next.meta } : {},
  };
}

function normalizeCluster(input = {}) {
  const next = { ...DEFAULT_CLUSTER, ...(input || {}) };
  return {
    ...next,
    count: next.count === null || next.count === undefined || next.count === "" ? 0 : String(next.count),
    tone: normalizeTone(next.tone),
    label: String(next.label || ""),
    size: normalizeSize(next.size),
    selected: next.selected === true,
    active: next.active === true,
    color: String(next.color || ""),
  };
}

function normalizeType(value) {
  const type = String(value || "incident").toLowerCase();
  return ALLOWED_TYPES.has(type) ? type : "incident";
}

function normalizeShape(value) {
  const shape = String(value || "pin").toLowerCase();
  return ALLOWED_SHAPES.has(shape) ? shape : "pin";
}

function normalizeTone(value) {
  const tone = String(value || "neutral").toLowerCase();
  return ALLOWED_TONES.has(tone) ? tone : "neutral";
}

function normalizeSize(value) {
  const size = String(value || "md").toLowerCase();
  return ALLOWED_SIZES.has(size) ? size : "md";
}

function defaultShapeForType(type) {
  if (type === "source-hub" || type === "target-hub" || type === "boundary-centroid") {
    return "hub";
  }
  if (type === "hotspot") {
    return "hotspot";
  }
  if (type === "route") {
    return "route";
  }
  return "pin";
}

function buildClassName(marker, cluster) {
  return [
    "ui-map-marker",
    cluster ? "ui-map-marker--cluster" : "",
    `ui-map-marker--${marker.type}`,
    `ui-map-marker--${marker.shape}`,
    `ui-map-marker--${marker.tone}`,
    `ui-map-marker--${marker.size}`,
    marker.selected ? "is-selected" : "",
    marker.active ? "is-active" : "",
    marker.muted ? "is-muted" : "",
    marker.pulse ? "is-pulsing" : "",
  ].filter(Boolean).join(" ");
}

function buildLabel(marker, cluster) {
  if (marker.label) {
    return marker.label;
  }
  if (cluster) {
    return `${marker.count || 0} markers`;
  }
  const type = marker.type.replace(/-/g, " ");
  const count = marker.count !== "" ? `, count ${marker.count}` : "";
  return `${type} marker${count}`;
}

function iconSize(size) {
  if (size === "lg") {
    return 18;
  }
  if (size === "sm") {
    return 12;
  }
  return 14;
}
