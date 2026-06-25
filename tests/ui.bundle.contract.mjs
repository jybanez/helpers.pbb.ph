import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createUiLoader, DEFAULT_COMPONENT_REGISTRY } from "../js/ui/ui.loader.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bundleJsPath = path.join(repoRoot, "dist", "helpers.ui.bundle.min.js");
const bundleCssPath = path.join(repoRoot, "dist", "helpers.ui.bundle.min.css");
const gameBundleJsPath = path.join(repoRoot, "dist", "helpers.game.bundle.min.js");
const gameBundleCssPath = path.join(repoRoot, "dist", "helpers.game.bundle.min.css");
const loaderSourcePath = path.join(repoRoot, "js", "ui", "ui.loader.js");

if (!fs.existsSync(bundleJsPath)) {
  throw new Error("Missing dist/helpers.ui.bundle.min.js");
}

if (!fs.existsSync(bundleCssPath)) {
  throw new Error("Missing dist/helpers.ui.bundle.min.css");
}

if (!fs.existsSync(gameBundleJsPath)) {
  throw new Error("Missing dist/helpers.game.bundle.min.js");
}

if (!fs.existsSync(gameBundleCssPath)) {
  throw new Error("Missing dist/helpers.game.bundle.min.css");
}

const loaderSource = fs.readFileSync(loaderSourcePath, "utf8");
if (
  !loaderSource.includes("helpers.ui.bundle.min.js?v=") ||
  !loaderSource.includes("helpers.ui.bundle.min.css?v=") ||
  !loaderSource.includes("helpers.game.bundle.min.js?v=") ||
  !loaderSource.includes("helpers.game.bundle.min.css?v=")
) {
  throw new Error("ui.loader.js must version-tag shared and game bundle JS/CSS URLs.");
}

const loader = createUiLoader(DEFAULT_COMPONENT_REGISTRY, { preferBundles: true });
const icons = await loader.get("ui.icons", { css: false });
const createDrawer = await loader.get("ui.drawer", { css: false });
const createBusyOverlay = await loader.get("ui.busy.overlay", { css: false });
const createFormModal = await loader.get("ui.form.modal", { css: false });
const createPathPicker = await loader.get("ui.path.picker", { css: false });
const createDeviceSelector = await loader.get("ui.device.selector", { css: false });
const createMediaDeviceAdapter = await loader.get("ui.device.selector.media", { css: false });
const createClock = await loader.get("ui.clock", { css: false });
const createHeartbeatStrip = await loader.get("ui.heartbeat.strip", { css: false });
const createStatCards = await loader.get("ui.stat.cards", { css: false });
const createMapLegend = await loader.get("ui.map.legend", { css: false });
const mapMarkers = await loader.get("ui.map.markers", { css: false });
const createMapDrawingTools = await loader.get("ui.map.drawing", { css: false });
const gameCore = await loader.get("ui.game.core", { css: false });
const gameObjects = await loader.get("ui.game.objects", { css: false });
const gameGrid = await loader.get("ui.game.grid", { css: false });
const gameAudio = await loader.get("ui.game.audio", { css: false });
const gameStateChrome = await loader.get("ui.game.state.chrome", { css: false });
const charts = await loader.get("ui.charts", { css: false });
const incidentTypes = await loader.get("incident.types", { css: false });
const diagnostics = loader.getDiagnostics();

if (typeof icons?.createIcon !== "function") {
  throw new Error("Bundle-backed ui.icons did not expose createIcon().");
}

if (typeof icons?.listIcons !== "function") {
  throw new Error("Bundle-backed ui.icons did not expose listIcons().");
}

const bundledIconNames = icons.listIcons();
[
  "actions.volume",
  "actions.volume-muted",
  "actions.sound-on",
  "actions.sound-off",
].forEach((iconName) => {
  if (!bundledIconNames.includes(iconName)) {
    throw new Error(`Bundle-backed ui.icons is missing ${iconName}.`);
  }
});

if (typeof createDrawer !== "function") {
  throw new Error("Bundle-backed ui.drawer did not resolve to a factory function.");
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

if (typeof createClock !== "function") {
  throw new Error("Bundle-backed ui.clock did not resolve to a factory function.");
}

if (typeof createHeartbeatStrip !== "function") {
  throw new Error("Bundle-backed ui.heartbeat.strip did not resolve to a factory function.");
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

if (typeof createMapDrawingTools !== "function") {
  throw new Error("Bundle-backed ui.map.drawing did not resolve to a factory function.");
}

if (typeof gameCore?.createGameSession !== "function") {
  throw new Error("Bundle-backed ui.game.core did not expose createGameSession().");
}

if (typeof gameCore?.createCanvasLayer !== "function") {
  throw new Error("Bundle-backed ui.game.core did not expose createCanvasLayer().");
}

if (typeof gameCore?.createGameLoop !== "function") {
  throw new Error("Bundle-backed ui.game.core did not expose createGameLoop().");
}

if (typeof gameCore?.createGameActionButton !== "function") {
  throw new Error("Bundle-backed ui.game.core did not expose createGameActionButton().");
}

if (typeof gameCore?.createGameActionButtonGroup !== "function") {
  throw new Error("Bundle-backed ui.game.core did not expose createGameActionButtonGroup().");
}

if (typeof gameCore?.createTouchControlPad !== "function") {
  throw new Error("Bundle-backed ui.game.core did not expose createTouchControlPad().");
}

if (typeof gameCore?.createVirtualJoystick !== "function") {
  throw new Error("Bundle-backed ui.game.core did not expose createVirtualJoystick().");
}

if (typeof gameObjects?.createGameObject !== "function") {
  throw new Error("Bundle-backed ui.game.objects did not expose createGameObject().");
}

if (typeof gameObjects?.createGameObjectLayer !== "function") {
  throw new Error("Bundle-backed ui.game.objects did not expose createGameObjectLayer().");
}

if (typeof gameObjects?.createPointerInputRouter !== "function") {
  throw new Error("Bundle-backed ui.game.objects did not expose createPointerInputRouter().");
}

if (typeof gameObjects?.createFlipCard !== "function") {
  throw new Error("Bundle-backed ui.game.objects did not expose createFlipCard().");
}

if (typeof gameObjects?.createTetromino !== "function") {
  throw new Error("Bundle-backed ui.game.objects did not expose createTetromino().");
}

if (typeof gameGrid?.createGridMaze !== "function") {
  throw new Error("Bundle-backed ui.game.grid did not expose createGridMaze().");
}

if (typeof gameGrid?.createGridMover !== "function") {
  throw new Error("Bundle-backed ui.game.grid did not expose createGridMover().");
}

if (typeof gameGrid.createGridMover()?.moveTowardCell !== "function") {
  throw new Error("Bundle-backed ui.game.grid createGridMover() did not expose moveTowardCell().");
}

if (typeof gameGrid?.createGridPathfinder !== "function") {
  throw new Error("Bundle-backed ui.game.grid did not expose createGridPathfinder().");
}

if (typeof gameAudio?.createGameAudio !== "function") {
  throw new Error("Bundle-backed ui.game.audio did not expose createGameAudio().");
}

if (typeof gameAudio?.createStarterGameSounds !== "function") {
  throw new Error("Bundle-backed ui.game.audio did not expose createStarterGameSounds().");
}

if (typeof gameStateChrome?.createGameStateChrome !== "function") {
  throw new Error("Bundle-backed ui.game.state.chrome did not expose createGameStateChrome().");
}

if (!Array.isArray(gameStateChrome?.GAME_SESSION_STATES) || !gameStateChrome.GAME_SESSION_STATES.includes("playing")) {
  throw new Error("Bundle-backed ui.game.state.chrome did not expose GAME_SESSION_STATES.");
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

if (!diagnostics.loadedBundles.includes("game")) {
  throw new Error("Loader did not record the optional game bundle as loaded.");
}

if (
  !diagnostics.loadedModules.includes("ui.icons") ||
  !diagnostics.loadedModules.includes("ui.drawer") ||
  !diagnostics.loadedModules.includes("ui.busy.overlay") ||
  !diagnostics.loadedModules.includes("ui.form.modal") ||
  !diagnostics.loadedModules.includes("ui.path.picker") ||
  !diagnostics.loadedModules.includes("ui.device.selector") ||
  !diagnostics.loadedModules.includes("ui.device.selector.media") ||
  !diagnostics.loadedModules.includes("ui.clock") ||
  !diagnostics.loadedModules.includes("ui.heartbeat.strip") ||
  !diagnostics.loadedModules.includes("ui.stat.cards") ||
  !diagnostics.loadedModules.includes("ui.map.legend") ||
  !diagnostics.loadedModules.includes("ui.map.markers") ||
  !diagnostics.loadedModules.includes("ui.map.drawing") ||
  !diagnostics.loadedModules.includes("ui.game.core") ||
  !diagnostics.loadedModules.includes("ui.game.objects") ||
  !diagnostics.loadedModules.includes("ui.game.grid") ||
  !diagnostics.loadedModules.includes("ui.game.audio") ||
  !diagnostics.loadedModules.includes("ui.game.state.chrome") ||
  !diagnostics.loadedModules.includes("ui.charts") ||
  !diagnostics.loadedModules.includes("incident.types")
) {
  throw new Error("Loader did not record bundle-backed module requests.");
}

console.log("UI bundle contract test passed.");
