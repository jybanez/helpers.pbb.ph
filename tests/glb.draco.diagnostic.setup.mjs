// Diagnostic only: never write to production sources or vendor artifacts.
// Retain 128 MiB geometry/native heap guards; relax only render-work admission
// to measure the authorized assembled scene that the candidate refuses.
import fs from 'node:fs';
import path from 'node:path';
import {build} from 'esbuild';
const dir='output/glb-draco';fs.mkdirSync(dir,{recursive:true});
const read=f=>fs.readFileSync(f,'utf8');
fs.writeFileSync(dir+'/diagnostic.data.js',read('js/ui/ui.glb.data.js').replaceAll('draws>1024','draws>2048').replaceAll('triangles>2000000','triangles>3000000'));
fs.writeFileSync(dir+'/diagnostic.draco.js',read('js/ui/ui.glb.draco.js').replace("'./draco-r187/worker.js'","'../../vendor/three/draco-r187/worker.js'"));
const runtime=read('js/ui/ui.glb.runtime.js').replace("'./ui.glb.data.js'","'../../output/glb-draco/diagnostic.data.js'").replace("'./ui.glb.draco.js'","'../../output/glb-draco/diagnostic.draco.js'").replaceAll('calls>1024','calls>2048').replaceAll('triangles>2000000','triangles>3000000');
await build({stdin:{contents:runtime,resolveDir:path.resolve('js/ui'),sourcefile:'diagnostic.runtime.js'},outfile:dir+'/runtime.js',bundle:true,format:'esm',platform:'browser',target:'es2020'});
fs.writeFileSync(dir+'/viewer.js',read('js/ui/ui.glb.viewer.js').replace("'./ui.modal.js'","'../../js/ui/ui.modal.js'").replace("'./ui.glb.data.js?v=0.21.329'","'./diagnostic.data.js'").replaceAll("'../../vendor/three/glb.runtime.js?v=0.21.329'","'./runtime.js'"));
let html=read('tests/glb.draco.regression.html').replace("const bytes=await (await fetch('../output/glb-draco/cube.glb')).arrayBuffer();","const bytes=privateBytes;");
let start=html.indexOf(' const rejected='),end=html.indexOf(' const viewer=',start);if(start<0||end<0)throw Error('Diagnostic template changed');html=html.slice(0,start)+html.slice(end);
html=html.replace("create=await loader.get('ui.glb.viewer')","create=(await import('../output/glb-draco/viewer.js')).createGlbViewer");
start=html.indexOf(" for(const fixture of ['count-mismatch'");end=html.indexOf(" document.body.dataset.status='pass'",start);if(start<0||end<0)throw Error('Diagnostic template changed');html=html.slice(0,start)+html.slice(end);
fs.writeFileSync(dir+'/diagnostic.html',html.replaceAll("'../output/","'../../output/").replaceAll("'../js/","'../../js/"));
