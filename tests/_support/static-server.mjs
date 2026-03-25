import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
};

export async function startStaticServer({ rootDir, host = "127.0.0.1", port }) {
  const resolvedRoot = path.resolve(rootDir);
  const server = http.createServer(async (req, res) => {
    try {
      const requestUrl = new URL(req.url || "/", `http://${host}:${port}`);
      const pathname = decodeURIComponent(requestUrl.pathname);
      const relativePath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
      const filePath = path.resolve(resolvedRoot, relativePath);

      if (!filePath.startsWith(resolvedRoot)) {
        res.writeHead(403, { "content-type": "text/plain; charset=utf-8" });
        res.end("Forbidden");
        return;
      }

      const stats = await fs.stat(filePath);
      const targetPath = stats.isDirectory() ? path.join(filePath, "index.html") : filePath;
      const body = await fs.readFile(targetPath);
      const contentType = MIME_TYPES[path.extname(targetPath).toLowerCase()] || "application/octet-stream";
      res.writeHead(200, {
        "content-type": contentType,
        "cache-control": "no-store",
      });
      res.end(body);
    } catch (error) {
      const status = error?.code === "ENOENT" ? 404 : 500;
      res.writeHead(status, { "content-type": "text/plain; charset=utf-8" });
      res.end(status === 404 ? "Not Found" : String(error?.message || error || "Server error"));
    }
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, resolve);
  });

  const address = server.address();
  const resolvedPort = typeof address === "object" && address ? address.port : port;

  return {
    host,
    port: resolvedPort,
    rootDir: resolvedRoot,
    origin: `http://${host}:${resolvedPort}`,
    async close() {
      await new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    },
  };
}
