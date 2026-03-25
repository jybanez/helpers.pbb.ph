import path from "node:path";
import { fileURLToPath } from "node:url";

import { startStaticServer } from "../tests/_support/static-server.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const parentPort = 4173;
const childPort = 4174;
const host = "127.0.0.1";

const parentServer = await startStaticServer({ rootDir, host, port: parentPort });
const childServer = await startStaticServer({ rootDir, host, port: childPort });

const parentUrl = `${parentServer.origin}/demos/demo.workspace.bridge.cross.origin.html?childOrigin=${encodeURIComponent(childServer.origin)}`;

console.log("Workspace bridge cross-origin demo servers are running.");
console.log(`Parent origin: ${parentServer.origin}`);
console.log(`Child origin:  ${childServer.origin}`);
console.log(`Open this URL in a browser:\n${parentUrl}`);
console.log("Press Ctrl+C to stop both servers.");

function shutdown() {
  Promise.allSettled([parentServer.close(), childServer.close()]).finally(() => {
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
