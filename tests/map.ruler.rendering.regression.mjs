import { startStaticServer } from './_support/static-server.mjs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs';
const run = promisify(execFile), session = `ruler-render-${process.pid}`;
const server = await startStaticServer({ rootDir: process.cwd(), port: 0 });
const cli = command => run(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', `npx --no-install @playwright/cli -s=${session} ${command}`], { timeout: 120000, maxBuffer: 2 ** 22 });
fs.mkdirSync('output/playwright', { recursive: true });
try {
  await cli('open about:blank');
  for (const query of ['', '?bundle']) {
    await cli(`goto ${server.origin}/demos/demo.map.ruler.html${query}`);
    const result = await cli('run-code --filename tests/_support/map-ruler-rendering-check.js');
    if (!result.stdout.includes('"RULER_RENDERING_OK"')) throw Error(result.stdout);
    console.log(`Ruler rendered line and both endpoints with pending raster/terrain, diff/full style replacement passed ${query || 'source'}`);
  }
} finally { try { await cli('close'); } finally { await server.close(); } }
