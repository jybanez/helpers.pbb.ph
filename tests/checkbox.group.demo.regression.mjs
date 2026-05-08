import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs";

const execFileAsync = promisify(execFile);
const browserCandidates = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
];

const browserPath = browserCandidates.find((candidate) => {
  try {
    return candidate && fs.existsSync(candidate);
  } catch {
    return false;
  }
});

if (!browserPath) {
  console.error("Checkbox group demo regression test failed: no supported browser executable found.");
  process.exit(1);
}

const htmlPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../demos/demo.checkbox.group.html");
const htmlUrl = pathToFileURL(htmlPath).href;

const { stdout, stderr } = await execFileAsync(browserPath, [
  "--headless=new",
  "--disable-gpu",
  "--allow-file-access-from-files",
  "--virtual-time-budget=3000",
  "--dump-dom",
  htmlUrl,
], { maxBuffer: 1024 * 1024 * 4 });

const output = `${stdout}\n${stderr}`;
const required = [
  "Checkbox Group Demo",
  "Immediate needs",
  "checkbox.group.initial",
  "./demo.checkbox.group.html",
  "ui.checkbox.group.css",
];

const missing = required.filter((text) => !output.includes(text));
if (missing.length) {
  console.error("Checkbox group demo regression test failed.");
  console.error(`Missing expected content: ${missing.join(", ")}`);
  console.error(output);
  process.exitCode = 1;
} else {
  console.log("Checkbox group demo regression test passed.");
}
