import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const port = 3187;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
};

const server = createServer(async (req, res) => {
  try {
    const requestPath = (req.url || "/").split("?")[0];
    const relativePath = requestPath === "/" ? "/tests/number.stepper.regression.html" : requestPath;
    const filePath = path.join(rootDir, relativePath);
    const data = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "content-type": mimeTypes[ext] || "application/octet-stream" });
    res.end(data);
  } catch (_error) {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
});

let browser;

try {
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, resolve);
  });

  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${port}/tests/number.stepper.regression.html`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.body.dataset.status && document.body.dataset.status !== "pending");
  const status = await page.getAttribute("body", "data-status");
  const output = await page.textContent("#results");
  if (status !== "pass") {
    throw new Error(output || "Number stepper regression failed.");
  }
  console.log(output.trim());
} finally {
  await browser?.close();
  server.close();
}
