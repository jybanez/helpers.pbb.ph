import { fileURLToPath } from "node:url";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs";
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
  console.error("Elapsed time regression test failed: no supported browser executable found.");
  process.exit(1);
}

const testsDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testsDir, "..");
let server;

try {
  server = await startStaticServer({ rootDir: repoRoot, port: 0 });
  const htmlUrl = `${server.origin}/tests/elapsed.time.regression.html`;
  const { stdout } = await execFileAsync(
    browserPath,
    [
      "--headless=new",
      "--disable-gpu",
      "--virtual-time-budget=12000",
      "--dump-dom",
      htmlUrl,
    ],
    { timeout: 240000, maxBuffer: 1024 * 1024 * 4 },
  );

  if (!stdout.includes('data-status="pass"') || !stdout.includes("PASS")) {
    console.error(stdout);
    throw new Error("Elapsed time regression assertions did not pass.");
  }
  console.log("Elapsed time regression test passed.");
} catch (error) {
  console.error("Elapsed time regression test failed:", error.message);
  process.exit(1);
} finally {
  await server?.close();
}
