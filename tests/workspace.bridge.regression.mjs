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
  console.error("Workspace bridge regression test failed: no supported browser executable found.");
  process.exit(1);
}

const htmlUrl = "http://localhost/hotline-helpers/tests/workspace.bridge.regression.html";

const { stdout, stderr } = await execFileAsync(browserPath, [
  "--headless=new",
  "--disable-gpu",
  "--virtual-time-budget=10000",
  "--dump-dom",
  htmlUrl,
], { maxBuffer: 1024 * 1024 * 4 });

const output = `${stdout}\n${stderr}`;
if (/data-status="pass"/.test(output) && /\bPASS\b/.test(output)) {
  console.log("Workspace bridge regression test passed.");
} else {
  console.error("Workspace bridge regression test failed.");
  console.error(output);
  process.exitCode = 1;
}
