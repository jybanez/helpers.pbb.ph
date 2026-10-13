import {startStaticServer} from './_support/static-server.mjs';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import fs from 'node:fs';
const run=promisify(execFile),session=`map-scale-${process.pid}`;
const server=await startStaticServer({rootDir:process.cwd(),port:0});
const cli=command=>run(process.env.ComSpec||'cmd.exe',['/d','/s','/c',`npx --no-install @playwright/cli -s=${session} ${command}`],{timeout:120000,maxBuffer:2**22});
fs.mkdirSync('output/playwright',{recursive:true});
try {
 await cli('open about:blank');
 for(const query of ['', '?bundle']) {
  await cli(`goto ${server.origin}/demos/demo.map.scale.html${query}`);
  const result=await cli('run-code --filename tests/_support/map-scale-check.js');
  if(!result.stdout.includes('"MAP_SCALE_OK"'))throw Error(result.stdout);
  console.log(`Map scale native calculation/lifecycle/theme/placement passed ${query||'source'}`);
 }
}finally{try{await cli('close');}finally{await server.close();}}
