import { startStaticServer } from "./_support/static-server.mjs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const run = promisify(execFile);
const server = await startStaticServer({ rootDir: process.cwd(), port: 0 });
const cli = command => run(process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", `npx --no-install @playwright/cli -s=map-layer-icon-regression ${command}`], { timeout: 60000, maxBuffer: 2 ** 22 });
try {
  await cli(`open ${server.origin}/tests/icons.regression.html`);
  for (const suffix of ["", "?bundled"]) {
    await cli(`goto ${server.origin}/tests/icons.regression.html${suffix}`);
    const { stdout } = await cli("run-code --filename tests/_support/icons-completion-check.js");
    if (!stdout.includes("PASS")) throw Error(stdout);
    console.log(`Icon catalog regression passed (${suffix || "source"}).`);
    await cli(`goto ${server.origin}/demos/demo.map.layer.icon.html${suffix ? '?bundle' : ''}`);
    const evidence = await cli("run-code --filename tests/_support/map-layer-icon-preview-check.js");
    if (!evidence.stdout.includes("PASS")) throw Error(evidence.stdout);
    console.log(`Map layer dark/light16/20/24/32 preview passed (${suffix || "source"}).`);
  }
} finally { try { await cli("close"); } finally { await server.close(); } }
