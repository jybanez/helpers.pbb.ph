import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const demo = fs.readFileSync(path.join(root, "demos", "demo.inspection.bundle.html"), "utf8");
const index = fs.readFileSync(path.join(root, "demos", "index.html"), "utf8");

const components = [
  ["inspection-observation", "Inspection Observation", "createInspectionObservationFieldGroupPreset"],
  ["equipment-inspection", "Equipment Inspection", "createEquipmentInspectionFieldGroupPreset"],
  ["infrastructure-inspection", "Infrastructure Inspection", "createInfrastructureInspectionFieldGroupPreset"],
  ["environment-inspection", "Environment Inspection", "createEnvironmentInspectionFieldGroupPreset"],
  ["inspection-measurement", "Inspection Measurement", "createInspectionMeasurementFieldGroupPreset"],
];

for (const [id, label, factory] of components) {
  if (!demo.includes(`id="${id}"`)) throw new Error(`Inspection demo is missing the ${label} section.`);
  if (!demo.includes(`id="${id}-host"`)) throw new Error(`Inspection demo is missing the ${label} render host.`);
  if (!demo.includes(factory)) throw new Error(`Inspection demo is missing the ${factory} factory.`);
  if (!index.includes(`demo.inspection.bundle.html#${id}`)) throw new Error(`Demo index is missing the ${label} card.`);
}

if (!demo.includes('loader.get("ui.inspection.core")')) throw new Error("Inspection demo must load the optional inspection component route.");
if (!demo.includes('document.body.dataset.demoStatus = "ready"')) throw new Error("Inspection demo must expose its ready state for browser checks.");

const browserCandidates = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
];
const browserPath = browserCandidates.find((candidate) => fs.existsSync(candidate));
if (!browserPath) throw new Error("Inspection demo regression requires Chrome or Edge.");

const server = http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url || "/", "http://localhost").pathname);
  const filename = path.resolve(root, `.${pathname}`);
  if (!filename.startsWith(`${root}${path.sep}`) || !fs.existsSync(filename) || !fs.statSync(filename).isFile()) {
    response.writeHead(404).end("Not found");
    return;
  }
  const contentType = filename.endsWith(".js") ? "text/javascript"
    : filename.endsWith(".css") ? "text/css"
      : filename.endsWith(".html") ? "text/html"
        : "application/octet-stream";
  response.writeHead(200, { "Content-Type": contentType });
  fs.createReadStream(filename).pipe(response);
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const address = server.address();
let stdout;
let stderr;
try {
  ({ stdout, stderr } = await promisify(execFile)(browserPath, [
    "--headless=new",
    "--disable-gpu",
    "--virtual-time-budget=5000",
    "--dump-dom",
    `http://127.0.0.1:${address.port}/demos/demo.inspection.bundle.html`,
  ], { maxBuffer: 1024 * 1024 * 8 }));
} finally {
  await new Promise((resolve) => server.close(resolve));
}
const rendered = `${stdout}\n${stderr}`;

if (!rendered.includes('data-demo-status="ready"')) {
  const status = rendered.match(/data-demo-status="[^"]+"(?: data-demo-error="[^"]+")?/)?.[0] || "no runtime status reported";
  throw new Error(`Inspection demo did not reach its ready state in the browser (${status}).`);
}
if ((rendered.match(/class="ui-field-group/g) || []).length < components.length) {
  throw new Error("Inspection demo did not render all five Field Group components.");
}
if ((rendered.match(/Schema v1 · sha256:/g) || []).length < components.length) {
  throw new Error("Inspection demo did not resolve all five schema snapshots.");
}

console.log(`Inspection demo regression checks passed (${components.length} rendered presets).`);
