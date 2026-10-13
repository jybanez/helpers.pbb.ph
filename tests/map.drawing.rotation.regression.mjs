import {startStaticServer} from './_support/static-server.mjs';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const run=promisify(execFile),session=`drawing-rotation-${process.pid}`;
const server=await startStaticServer({rootDir:process.cwd(),port:0});
const cli=command=>run(process.env.ComSpec||'cmd.exe',['/d','/s','/c',`npx --no-install @playwright/cli -s=${session} ${command}`],{timeout:120000,maxBuffer:2**22});
try {
 await cli(`open ${server.origin}/demos/demo.map.drawing.html?toggle`);
 for(const query of ['?toggle','?bundle=toggle']){
  if(!process.argv.includes('--boundary-only')){
  await cli(`goto ${server.origin}/demos/demo.map.drawing.html${query}`);
  const result=await cli('run-code --filename tests/_support/maplibre-drawing-rotation-check.js');
  if(!result.stdout.includes('"DRAWING_ROTATION_OK"'))throw Error(result.stdout);
  console.log(`Native object rotation, controls, history and cancellation passed ${query}`);
  await cli(`goto ${server.origin}/demos/demo.map.drawing.html${query}`);
  const generic=await cli('run-code --filename tests/_support/maplibre-generic-rotation-check.js');
  if(!generic.stdout.includes('"GENERIC_ROTATION_OK"'))throw Error(generic.stdout);
  console.log(`Native Line/Path/holes rotation, metadata, history and cancellation passed ${query}`);
  }
  await cli(`goto ${server.origin}/demos/demo.map.drawing.html${query}`);
  const boundary=await cli('run-code --filename tests/_support/maplibre-rotation-boundary-check.js');
  if(!boundary.stdout.includes('"ROTATION_BOUNDARY_OK"'))throw Error(boundary.stdout);
  console.log(`Native seam/polar rotation rejection without partial edits/history passed ${query}`);
 }
}finally{try{await cli('close');}finally{await server.close();}}
