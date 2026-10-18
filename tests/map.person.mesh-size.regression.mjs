import { startStaticServer } from './_support/static-server.mjs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs';
const run = promisify(execFile), session = `person-mesh-${process.pid}`;
const server = await startStaticServer({ rootDir: process.cwd(), port: 0 });
const cli = command => run(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', `npx --no-install @playwright/cli -s=${session} ${command}`], { timeout: 120000, maxBuffer: 2 ** 22 });
fs.mkdirSync('output/playwright', { recursive: true });
try {
  await cli('open about:blank');
  for (const query of ['', '?bundle']) {
    await cli(`goto ${server.origin}/demos/demo.map.location.person.html${query}`);
    const result = await cli('run-code --filename tests/_support/person-mesh-size-check.js');
    if (!result.stdout.includes('PERSON_MESH_SIZE_OK')) throw Error(result.stdout);
    fs.writeFileSync(`output/person-mesh-${query ? 'bundle' : 'source'}.log`,result.stdout); console.log(`Person mesh pixels passed ${query || 'source'}`);
  }
} catch (error) { fs.writeFileSync(`output/person-mesh-failure-${Date.now()}.log`, error.stdout || String(error)); throw error; }
finally { try { await cli('close'); } finally { await server.close(); } }
