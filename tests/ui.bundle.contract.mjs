import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createUiLoader, DEFAULT_COMPONENT_REGISTRY } from "../js/ui/ui.loader.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bundleJsPath = path.join(repoRoot, "dist", "helpers.ui.bundle.min.js");
const bundleCssPath = path.join(repoRoot, "dist", "helpers.ui.bundle.min.css");

if (!fs.existsSync(bundleJsPath)) {
  throw new Error("Missing dist/helpers.ui.bundle.min.js");
}

if (!fs.existsSync(bundleCssPath)) {
  throw new Error("Missing dist/helpers.ui.bundle.min.css");
}

const loader = createUiLoader(DEFAULT_COMPONENT_REGISTRY, { preferBundles: true });
const icons = await loader.get("ui.icons", { css: false });
const createBusyOverlay = await loader.get("ui.busy.overlay", { css: false });
const createFormModal = await loader.get("ui.form.modal", { css: false });
const createPathPicker = await loader.get("ui.path.picker", { css: false });
const createDeviceSelector = await loader.get("ui.device.selector", { css: false });
const createMediaDeviceAdapter = await loader.get("ui.device.selector.media", { css: false });
const createStatCards = await loader.get("ui.stat.cards", { css: false });
const createMapLegend = await loader.get("ui.map.legend", { css: false });
const mapMarkers = await loader.get("ui.map.markers", { css: false });
const charts = await loader.get("ui.charts", { css: false });
const incidentTypes = await loader.get("incident.types", { css: false });
const diagnostics = loader.getDiagnostics();

if (typeof icons?.createIcon !== "function") {
  throw new Error("Bundle-backed ui.icons did not expose createIcon().");
}

if (typeof createFormModal !== "function") {
  throw new Error("Bundle-backed ui.form.modal did not resolve to a factory function.");
}

if (typeof createBusyOverlay !== "function") {
  throw new Error("Bundle-backed ui.busy.overlay did not resolve to a factory function.");
}

if (typeof createPathPicker !== "function") {
  throw new Error("Bundle-backed ui.path.picker did not resolve to a factory function.");
}

if (typeof createDeviceSelector !== "function") {
  throw new Error("Bundle-backed ui.device.selector did not resolve to a factory function.");
}

if (typeof createMediaDeviceAdapter !== "function") {
  throw new Error("Bundle-backed ui.device.selector.media did not resolve to a factory function.");
}

if (typeof createStatCards !== "function") {
  throw new Error("Bundle-backed ui.stat.cards did not resolve to a factory function.");
}

if (typeof createMapLegend !== "function") {
  throw new Error("Bundle-backed ui.map.legend did not resolve to a factory function.");
}

if (typeof mapMarkers?.createMapMarker !== "function") {
  throw new Error("Bundle-backed ui.map.markers did not expose createMapMarker().");
}

if (typeof mapMarkers?.createMapClusterMarker !== "function") {
  throw new Error("Bundle-backed ui.map.markers did not expose createMapClusterMarker().");
}

if (typeof mapMarkers?.getMapMarkerClass !== "function") {
  throw new Error("Bundle-backed ui.map.markers did not expose getMapMarkerClass().");
}

if (typeof charts?.createChart !== "function") {
  throw new Error("Bundle-backed ui.charts did not expose createChart().");
}

if (typeof charts?.createBarChart !== "function") {
  throw new Error("Bundle-backed ui.charts did not expose createBarChart().");
}

if (typeof charts?.createSparkline !== "function") {
  throw new Error("Bundle-backed ui.charts did not expose createSparkline().");
}

if (typeof incidentTypes !== "function") {
  throw new Error("Bundle-backed incident.types did not resolve to a factory function.");
}

if (!diagnostics.loadedBundles.includes("ui")) {
  throw new Error("Loader did not record the shared ui bundle as loaded.");
}

if (
  !diagnostics.loadedModules.includes("ui.icons") ||
  !diagnostics.loadedModules.includes("ui.busy.overlay") ||
  !diagnostics.loadedModules.includes("ui.form.modal") ||
  !diagnostics.loadedModules.includes("ui.path.picker") ||
  !diagnostics.loadedModules.includes("ui.device.selector") ||
  !diagnostics.loadedModules.includes("ui.device.selector.media") ||
  !diagnostics.loadedModules.includes("ui.stat.cards") ||
  !diagnostics.loadedModules.includes("ui.map.legend") ||
  !diagnostics.loadedModules.includes("ui.map.markers") ||
  !diagnostics.loadedModules.includes("ui.charts") ||
  !diagnostics.loadedModules.includes("incident.types")
) {
  throw new Error("Loader did not record bundle-backed module requests.");
}

console.log("UI bundle contract test passed.");
