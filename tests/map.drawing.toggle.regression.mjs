import {startStaticServer} from './_support/static-server.mjs';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const run=promisify(execFile),session=`select-toggle-${process.pid}`,server=await startStaticServer({rootDir:process.cwd(),port:0});
const cli=command=>run(process.env.ComSpec||'cmd.exe',['/d','/s','/c',`npx --no-install @playwright/cli -s=${session} ${command}`],{timeout:120000,maxBuffer:2**22});
try {
  await cli(`open ${server.origin}/demos/demo.map.drawing.html?toggle`);
  for(const suffix of ['?toggle','?bundle=toggle']) {
    await cli(`goto ${server.origin}/demos/demo.map.drawing.html${suffix}`);
    const result=await cli('run-code --filename tests/_support/maplibre-select-toggle-check.js');
    if(!result.stdout.includes('"SELECT_TOGGLE_OK"'))throw Error(result.stdout);
    console.log(`Select toggle pointer/keyboard/navigation/draft lifecycle passed ${suffix}`);
  }
} finally {try {await cli('close');}finally {await server.close();}}
