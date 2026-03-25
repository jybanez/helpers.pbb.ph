import { execFile } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { startStaticServer } from "./_support/static-server.mjs";

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
  console.error("Workspace bridge cross-origin regression test failed: no supported browser executable found.");
  process.exit(1);
}

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const host = "127.0.0.1";
const parentServer = await startStaticServer({ rootDir, host, port: 0 });
const childServer = await startStaticServer({ rootDir, host, port: 0 });

try {
  const htmlUrl = `${parentServer.origin}/tests/workspace.bridge.cross.origin.regression.html?childOrigin=${encodeURIComponent(childServer.origin)}`;
  const { stdout, stderr } = await execFileAsync(browserPath, [
    "--headless=new",
    "--disable-gpu",
    "--virtual-time-budget=18000",
    "--dump-dom",
    htmlUrl,
  ], { maxBuffer: 1024 * 1024 * 6 });

  const output = `${stdout}\n${stderr}`;
  if (/data-status="pass"/.test(output) && /\bPASS\b/.test(output)) {
    console.log("Workspace bridge cross-origin regression test passed.");
  } else {
    console.error("Workspace bridge cross-origin regression test failed.");
    console.error(output);
    process.exitCode = 1;
  }
} finally {
  await Promise.allSettled([parentServer.close(), childServer.close()]);
}
