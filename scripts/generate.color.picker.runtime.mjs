import fs from "node:fs";
import crypto from "node:crypto";
const paths = ["js/ui/ui.color.picker.js", "css/ui/ui.color.picker.css", "js/ui/ui.form.modal.js", "js/ui/ui.loader.js", "dist/helpers.ui.bundle.min.js", "dist/helpers.ui.bundle.min.css", "demos/demo.color.picker.html", "js/demo/demo.color.picker.js", "js/demo/demo.shell.js", "css/demo/demo.shell.css", "docs/color-picker.md"];
const sha256 = path => crypto.createHash("sha256").update(fs.readFileSync(path, "utf8").replaceAll("\r\n", "\n")).digest("hex");
fs.writeFileSync("docs/color-picker-runtime.json", JSON.stringify({
  component: "ui.color.picker", factory: "createColorPicker", helperPackage: "0.21.83",
  componentRevision: "0.21.294", formModalRevision: "0.21.294", mainUiBundleRevision: "0.21.306",
  demoRevision: "0.21.294",
  scope: "Shared runtime hashes refreshed; optional game JavaScript includes canonical icon catalog changes, inspection unchanged. Source dependencies use existing canonical components.",
  algorithm: "SHA256 of UTF-8 text normalized CRLF to LF",
  artifacts: paths.map(path => ({ path, sha256: sha256(path) })),
}, null, 2) + "\n");
// Existing scoped map manifests track the same loader/main bundle. Refresh those
// shared hashes without claiming new drawing/icon source revisions.
for (const path of ["docs/maplibre-drawing-runtime.json", "docs/map-layer-icon-runtime.json"]) {
  const manifest = JSON.parse(fs.readFileSync(path, "utf8"));
  manifest.mainUiBundleRevision = "0.21.306";
  if (manifest.icon === "map.layer") manifest.iconsAndGameRevision = "0.21.303";
  if (manifest.component === "ui.map.drawing.maplibre") manifest.adapterJsRevision = "0.21.306";
  if (manifest.component === "ui.map.drawing.maplibre") manifest.coreJsRevision = "0.21.303";
  if (manifest.component === "ui.map.drawing.maplibre") manifest.cssRevision = "0.21.297";
  if (manifest.component === "ui.map.drawing.maplibre" && !manifest.artifacts.some(a => a.path === "js/ui/ui.map.drawing.shapes.js")) manifest.artifacts.push({path:"js/ui/ui.map.drawing.shapes.js"});
  manifest.artifacts = manifest.artifacts.map(artifact => ({ ...artifact, sha256: sha256(artifact.path) }));
  fs.writeFileSync(path, JSON.stringify(manifest, null, 2) + "\n");
}
console.log("Updated color picker and shared map runtime provenance.");

const drawingIconPaths = ["css/ui/ui.map.drawing.css", "js/ui/ui.icons.catalog.js", "js/ui/ui.icons.js", "js/ui/ui.map.drawing.js", "js/ui/ui.loader.js", "dist/helpers.ui.bundle.min.js", "dist/helpers.ui.bundle.min.css", "dist/helpers.game.bundle.min.js", "demos/demo.map.drawing.html", "js/demo/demo.map.drawing.js", "docs/drawing-action-icons.md"];
fs.writeFileSync("docs/drawing-action-icons-runtime.json", JSON.stringify({ icons:["map.select","map.pan","map.path","actions.fill","actions.stroke","actions.undo","actions.redo","actions.clear"], component:"ui.map.drawing", iconsRevision:"0.21.303", coreJsRevision:"0.21.303", mainUiBundleRevision:"0.21.306", gameBundleRevision:"0.21.303", algorithm:"SHA256 of UTF-8 text normalized CRLF to LF", artifacts:drawingIconPaths.map(path=>({path,sha256:sha256(path)})) },null,2)+"\n");
