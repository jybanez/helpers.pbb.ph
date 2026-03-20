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
  console.error("Password-field regression test failed: no supported browser executable found.");
  process.exit(1);
}

const htmlPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "password.regression.html");
const htmlUrl = pathToFileURL(htmlPath).href;

const { stdout, stderr } = await execFileAsync(browserPath, [
  "--headless=new",
  "--disable-gpu",
  "--allow-file-access-from-files",
  "--virtual-time-budget=5000",
  "--dump-dom",
  htmlUrl,
], { maxBuffer: 1024 * 1024 * 4 });

const output = `${stdout}\n${stderr}`;
if (/data-status="pass"/.test(output) && /\bPASS\b/.test(output)) {
  console.log("Password field regression test passed.");
} else {
  console.error("Password field regression test failed.");
  console.error(output);
  process.exitCode = 1;
}
