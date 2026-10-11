import { startStaticServer } from "./_support/static-server.mjs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const run = promisify(execFile);
const server = await startStaticServer({ rootDir: process.cwd(), port: 0 });
const cli = command => run(process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", `npx --no-install @playwright/cli -s=maplibre-drawing-regression ${command}`], { timeout: 60000, maxBuffer: 2 ** 22 });
try {
  await cli(`open ${server.origin}/demos/demo.map.drawing.html`);
  for (const suffix of ["", "?bundle"]) {
    await cli(`goto ${server.origin}/demos/demo.map.drawing.html${suffix}`);
    const { stdout } = await cli("run-code --filename tests/_support/maplibre-drawing-check.js");
    if (!stdout.includes("PASS")) throw Error(stdout);
    console.log(`MapLibre drawing real pointer/keyboard regression passed (${suffix || "source"}).`);
    await cli(`goto ${server.origin}/demos/demo.map.drawing.html${suffix}`);
    const gate = await cli("run-code --filename tests/_support/maplibre-deletion-gate-check.js");
    if (!gate.stdout.includes("PASS")) throw Error(gate.stdout);
    console.log(`MapLibre deletion gate regression passed (${suffix || "source"}).`);
  }
} finally { try { await cli("close"); } finally { await server.close(); } }
