import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const index = fs.readFileSync(path.join(root, "demos", "index.html"), "utf8");
const shell = fs.readFileSync(path.join(root, "js", "demo", "demo.shell.js"), "utf8");
const overview = fs.readFileSync(path.join(root, "demos", "demo.inspection.bundle.html"), "utf8");
const components = [
  { file: "demo.inspection.observation.html", label: "Inspection Observation", factory: "createInspectionObservationFieldGroupPreset" },
  { file: "demo.inspection.equipment.html", label: "Equipment Inspection", factory: "createEquipmentInspectionFieldGroupPreset" },
  { file: "demo.inspection.infrastructure.html", label: "Infrastructure Inspection", factory: "createInfrastructureInspectionFieldGroupPreset" },
  { file: "demo.inspection.environment.html", label: "Environment Inspection", factory: "createEnvironmentInspectionFieldGroupPreset" },
  { file: "demo.inspection.measurement.html", label: "Inspection Measurement", factory: "createInspectionMeasurementFieldGroupPreset" },
];

if (!overview.includes('class="demo-shell-sidebar"') || !overview.includes("window.demoMeta")) {
  throw new Error("Inspection bundle overview is missing the standard demo shell and reference metadata.");
}

for (const component of components) {
  const source = fs.readFileSync(path.join(root, "demos", component.file), "utf8");
  if (!source.includes('class="demo-shell-sidebar"')) throw new Error(`${component.label} is missing the shared demo shell.`);
  if (!source.includes("window.demoMeta")) throw new Error(`${component.label} is missing reference metadata.`);
  if (!source.includes("defaultSampleCode") && !source.includes("createInspectionDemoMeta")) throw new Error(`${component.label} is missing sample code metadata.`);
  if (!source.includes('<h2 class="ui-title">Demo Output</h2>')) throw new Error(`${component.label} is missing its Demo Output section.`);
  if (!source.includes(component.factory)) throw new Error(`${component.label} is missing its preset factory.`);
  if (!index.includes(`href="./${component.file}"`)) throw new Error(`Demo index is missing ${component.label}.`);
  if (!shell.includes(`href: "./${component.file}"`)) throw new Error(`Shared demo navigation is missing ${component.label}.`);
  if (!overview.includes(`href="./${component.file}"`)) throw new Error(`Inspection overview is missing ${component.label}.`);
}

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

try {
  for (const component of components) {
    const { stdout, stderr } = await promisify(execFile)(browserPath, [
      "--headless=new",
      "--disable-gpu",
      "--virtual-time-budget=5000",
      "--dump-dom",
      `http://127.0.0.1:${address.port}/demos/${component.file}`,
    ], { maxBuffer: 1024 * 1024 * 8 });
    const rendered = `${stdout}\n${stderr}`;
    const required = [
      'data-demo-status="ready"',
      'class="demo-shell-nav',
      'class="demo-workbench',
      'class="ui-field-group',
      "Demo Output",
      "Reference",
      "Constructor / Initialization",
      "Options",
      "Properties",
      "Events",
      "Methods",
      "Schema v1 · sha256:",
      component.factory,
    ];
    const missing = required.filter((value) => !rendered.includes(value));
    if (missing.length) throw new Error(`${component.label} browser demo is missing: ${missing.join(", ")}`);
  }
} finally {
  await new Promise((resolve) => server.close(resolve));
}

console.log(`Inspection demo regression checks passed (${components.length} standard component pages).`);
