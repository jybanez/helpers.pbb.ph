import {startStaticServer} from './_support/static-server.mjs';
import {execFile} from 'node:child_process';import {promisify} from 'node:util';
const run=promisify(execFile),server=await startStaticServer({rootDir:process.cwd(),port:0});
const cli=command=>run(process.env.ComSpec||'cmd.exe',['/d','/s','/c',`npx --no-install @playwright/cli -s=drawing-action-icons ${command}`],{timeout:60000,maxBuffer:2**22});
try {await cli(`open ${server.origin}/demos/demo.map.drawing.html`);for(const suffix of ['', '?bundle']) {await cli(`goto ${server.origin}/demos/demo.map.drawing.html${suffix}`);const r=await cli('run-code --filename tests/_support/drawing-action-icons-check.js');if(!r.stdout.includes('### Result\n"DRAWING_ICONS_OK"'))throw Error(r.stdout);console.log(`Drawing action icons passed (${suffix||'source'}).`);
await cli(`goto ${server.origin}/demos/demo.map.drawing.html${suffix}`);
const pending=await cli('run-code --filename tests/_support/maplibre-pending-tile-check.js');
if(!pending.stdout.includes('### Result\n"PENDING_TILE_OK"'))throw Error(pending.stdout);
console.log(`Combined pending-tile lifecycle passed (${suffix||'source'}).`);}}
finally{try{await cli('close');}finally{await server.close();}}
