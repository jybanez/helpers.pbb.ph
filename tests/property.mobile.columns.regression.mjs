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

if (!browserPath) throw new Error("Property mobile columns regression requires Chrome or Edge.");

const testsDir = path.dirname(fileURLToPath(import.meta.url));
let server;
try {
  server = await startStaticServer({ rootDir: path.resolve(testsDir, ".."), port: 0 });
  fs.mkdirSync(path.resolve(testsDir, "../output/playwright/property-mobile-columns"), { recursive: true });
  for (const width of [320, 360, 375, 1280]) {
  for (const suffix of ["", "?bundle"]) {
  const { stdout } = await execFileAsync(browserPath, [
    "--headless=new",
    "--disable-gpu",
    `--window-size=${width},1600`,
    `--screenshot=${path.resolve(testsDir, "../output/playwright/property-mobile-columns", `${width}-${suffix ? "bundle" : "source"}.png`)}`,
    "--virtual-time-budget=8000",
    "--dump-dom",
    `${server.origin}/tests/property.mobile.columns.viewport.html?width=${width}${suffix ? '&bundle' : ''}`,
  ], { timeout: 120000, maxBuffer: 1024 * 1024 * 6 });
  if (!stdout.includes('data-status="pass"') || !stdout.includes("PASS")) {
    console.error(stdout);
    throw new Error("Property mobile columns browser assertions did not pass.");
  }
  console.log(`Property mobile columns passed (${width}px, ${suffix || "source"}).`);
  }
  }
} finally {
  await server?.close();
}
