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
  console.error("Dialog async regression test failed: no supported browser executable found.");
  process.exit(1);
}

const htmlPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "dialog.async.regression.html");
const htmlUrl = pathToFileURL(htmlPath).href;

try {
  const { stdout } = await execFileAsync(
    browserPath,
    [
      "--headless=new",
      "--disable-gpu",
      "--allow-file-access-from-files",
      "--virtual-time-budget=15000",
      "--dump-dom",
      htmlUrl,
    ],
    { timeout: 240000, maxBuffer: 1024 * 1024 * 8 }
  );
  if (!stdout.includes('data-status="passed"')) {
    console.error(stdout);
    throw new Error("Dialog async regression assertions did not pass.");
  }
  console.log("Dialog async regression test passed.");
} catch (error) {
  console.error("Dialog async regression test failed:", error.message);
  process.exit(1);
}
