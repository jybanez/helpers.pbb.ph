import { fileURLToPath } from "node:url";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs";
import { startStaticServer } from "./_support/static-server.mjs";

const execFileAsync = promisify(execFile);
const browserPath = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
].find((candidate) => fs.existsSync(candidate));

if (!browserPath) throw new Error("Popover regression requires Chrome or Edge.");

const testsDir = path.dirname(fileURLToPath(import.meta.url));
let server;
try {
  server = await startStaticServer({ rootDir: path.resolve(testsDir, ".."), port: 0 });
  const { stdout } = await execFileAsync(browserPath, [
    "--headless=new",
    "--disable-gpu",
    "--virtual-time-budget=8000",
    "--dump-dom",
    `${server.origin}/tests/popover.regression.html`,
  ], { timeout: 120000, maxBuffer: 1024 * 1024 * 6 });
  if (!stdout.includes('data-status="pass"') || !stdout.includes("PASS")) {
    console.error(stdout);
    throw new Error("Popover browser assertions did not pass.");
  }
  console.log("Popover regression test passed.");
} finally {
  await server?.close();
}
