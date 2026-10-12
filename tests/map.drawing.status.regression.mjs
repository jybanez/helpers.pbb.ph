import { startStaticServer } from './_support/static-server.mjs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const run = promisify(execFile), session = `drawing-status-${process.pid}`;
const server = await startStaticServer({rootDir: process.cwd(), port: 0});
const cli = command => run(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', `npx --no-install @playwright/cli -s=${session} ${command}`], {timeout: 120000, maxBuffer: 2 ** 22});
try {
  await cli(`open ${server.origin}/demos/demo.map.drawing.html?toggle`);
  for (const suffix of ['?toggle', '?bundle=toggle']) {
    await cli(`goto ${server.origin}/demos/demo.map.drawing.html${suffix}`);
    const result = await cli('run-code --filename tests/_support/maplibre-drawing-status-check.js');
    if (!result.stdout.includes('"DRAWING_STATUS_OK"')) throw Error(result.stdout);
    console.log(`Drawing status presentation and protected pending states passed ${suffix}`);
  }
} finally { try { await cli('close'); } finally { await server.close(); } }
