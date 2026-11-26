import { startStaticServer } from "./_support/static-server.mjs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const run = promisify(execFile);
const browser = process.env.COMPOSER_TEST_BROWSER || "chrome";
if (!["chrome", "msedge"].includes(browser)) throw Error("COMPOSER_TEST_BROWSER must be chrome or msedge");
const server = await startStaticServer({ rootDir: process.cwd(), port: 0 });
const cli = command => run(process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", `npx --no-install @playwright/cli -s=composer-autogrow-regression ${command}`], { timeout: 60000, maxBuffer: 2 ** 22 });
try {
  await cli(`open ${server.origin}/tests/composer.autogrow.regression.html --browser ${browser}`);
  for (const suffix of ["", "?bundle"]) {
    await cli(`goto ${server.origin}/tests/composer.autogrow.regression.html${suffix}`);
    const { stdout } = await cli("run-code --filename tests/_support/composer-autogrow-check.js");
    if (!stdout.includes("PASS")) throw Error(stdout);
    console.log(`Composer auto-grow regression passed (${suffix || "source"}).`);
  }
} finally { try { await cli("close" ); } finally { await server.close(); } }
