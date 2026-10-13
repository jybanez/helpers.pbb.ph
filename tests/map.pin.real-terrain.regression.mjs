import { startStaticServer } from './_support/static-server.mjs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs';
const run = promisify(execFile), session = `map-pin-real-${process.pid}`;
const server = await startStaticServer({ rootDir: process.cwd(), port: 0 });
const cli = command => run(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', `npx --no-install @playwright/cli -s=${session} ${command}`], { timeout: 120000, maxBuffer: 2 ** 22 });
fs.mkdirSync('output/playwright', { recursive: true });
try {
  await cli('open about:blank');
  for (const query of ['?immediate', '?bundle=immediate']) {
    await cli(`goto ${server.origin}/demos/demo.map.drawing.html${query}`);
    const result = await cli('run-code --filename tests/_support/map-pin-real-terrain-check.js');
    if (!result.stdout.includes('PIN_REAL_TERRAIN_OK')) throw Error(result.stdout);
    console.log(result.stdout.split('### Ran')[0]);
  }
} catch (error) { fs.writeFileSync(`output/map-pin-failure-${Date.now()}.log`, error.stdout || String(error)); throw error; }
finally { try { await cli('close'); } finally { await server.close(); } }
