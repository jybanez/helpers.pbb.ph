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
  console.error("Checkbox demo regression test failed: no supported browser executable found.");
  process.exit(1);
}

const htmlPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../demos/demo.checkbox.html");
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
  "Checkbox Demo",
  "Needs follow-up",
  "followup_required",
  "./demo.checkbox.html",
  "ui.checkbox.css",
];

const missing = required.filter((text) => !output.includes(text));
if (missing.length) {
  console.error("Checkbox demo regression test failed.");
  console.error(`Missing expected content: ${missing.join(", ")}`);
  console.error(output);
  process.exitCode = 1;
} else {
  console.log("Checkbox demo regression test passed.");
}
