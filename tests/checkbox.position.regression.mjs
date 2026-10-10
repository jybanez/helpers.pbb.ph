import { startStaticServer } from './_support/static-server.mjs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const run = promisify(execFile);
const server = await startStaticServer({ rootDir: process.cwd(), port: 0 });
const cli = command => run(process.env.ComSpec || 'cmd.exe', ['/d','/s','/c',
  `npx --no-install @playwright/cli -s=checkbox-position-regression ${command}`], { timeout: 60000, maxBuffer: 2**22 });
try {
  await cli(`open ${server.origin}/tests/checkbox.position.regression.html`);
  for (const suffix of ['', '?bundle']) {
    await cli(`goto ${server.origin}/tests/checkbox.position.regression.html${suffix}`);
    const { stdout } = await cli('run-code --filename tests/_support/checkbox-position-check.js');
    if (!stdout.includes('PASS')) throw Error(stdout);
    console.log(`Checkbox scroll/placement regression passed (${suffix || 'source'}).`);
  }
} finally {
  try { await cli('close'); } finally { await server.close(); }
}
