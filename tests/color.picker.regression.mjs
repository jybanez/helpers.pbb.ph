import { startStaticServer } from "./_support/static-server.mjs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const run = promisify(execFile);
const server = await startStaticServer({ rootDir: process.cwd(), port: 0 });
const cli = command => run(process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", `npx --no-install @playwright/cli -s=color-picker-regression ${command}`], { timeout: 60000, maxBuffer: 2 ** 22 });
try {
  await cli(`open ${server.origin}/demos/demo.color.picker.html`);
  for (const suffix of ["", "?bundle"]) {
    await cli(`goto ${server.origin}/demos/demo.color.picker.html${suffix}`);
    const result = await cli("run-code --filename tests/_support/color-picker-check.js");
    if (!result.stdout.includes("PASS")) throw Error(result.stdout);
    console.log(`PASS color picker pointer/keyboard, options, atomic updates, events, form validation/busy/focus (${suffix || "source"}).`);
  }
} finally { try { await cli("close"); } finally { await server.close(); } }
