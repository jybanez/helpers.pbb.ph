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

if (!browserPath) throw new Error("File viewer regression requires Chrome or Edge.");

const testsDir = path.dirname(fileURLToPath(import.meta.url));
let server;
try {
  const fixtures = Object.fromEntries([
    ['json', '{"attachmentMarker":"downloaded JSON"}'],
    ['md', '# Downloaded Markdown'],
    ['csv', 'Name,Code\nDownloaded CSV,0012'],
  ].map(([extension, body]) => [`/attachments/viewer.${extension}`, {
    body,
    headers: {
      'content-type': 'application/octet-stream',
      'content-disposition': `attachment; filename="viewer.${extension}"`,
      'x-content-type-options': 'nosniff',
    },
  }]));
  server = await startStaticServer({ rootDir: path.resolve(testsDir, ".."), port: 0, fixtures });
  for (const page of ["file.viewer.regression.html"]) for (const suffix of ["?attachments", "?bundle&attachments"]) {
  const { stdout } = await execFileAsync(browserPath, [
    "--headless=new",
    "--disable-gpu",
    "--virtual-time-budget=8000",
    "--dump-dom",
    `${server.origin}/tests/${page}${suffix}`,
  ], { timeout: 120000, maxBuffer: 1024 * 1024 * 6 });
  if (!stdout.includes('data-status="pass"') || !stdout.includes("PASS")) {
    console.error(stdout);
    throw new Error("File viewer browser assertions did not pass.");
  }
  console.log(`File viewer passed ${page} (${suffix || "source"}).`);
  }
} finally {
  await server?.close();
}
