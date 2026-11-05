import fs from 'node:fs';
await import('../../tests/glb.budget.setup.mjs');
const dir='output/glb-allocation-prototype';fs.mkdirSync(dir,{recursive:true});
const data=fs.readFileSync('js/ui/ui.glb.data.js','utf8').replace('= 128 * 1024 * 1024','= Number.MAX_SAFE_INTEGER');
fs.writeFileSync(dir+'/data.js',data);
let wrapper=fs.readFileSync('js/ui/ui.glb.viewer.js','utf8').replace(/\r\n/g,'\n').replace("import { prepareGlb } from './ui.glb.data.js?v=0.21.327';", "import { prepareGlb, validateGlb } from './data.js';\nimport { prototypePool } from '/experiments/glb-budget/budget.mjs';");
wrapper=wrapper.replace("'./ui.modal.js'","'/js/ui/ui.modal.js'").replace('    try {\n', '    let lease;\n    try {\n').replace('const prepared=prepareGlb(data,snapshot.maxBytes);','lease=prototypePool.acquire(data,validateGlb);const prepared=prepareGlb(data,snapshot.maxBytes);');
wrapper=wrapper.replace('runtime=mounted;setStatus', 'const held=lease;lease=null;runtime={...mounted,dispose(){try{mounted.dispose();}finally{held.release();}}};setStatus');
wrapper=wrapper.replace("return false;}\n  }\n  function destroy", "return false;}finally{lease?.release();}\n  }\n  function destroy");
// Keep lease until pending import/mount settles after cancellation; never release
// while an aborted decoder may still be holding allocations.
wrapper=wrapper.replace(/const url=new URL\(bundled\?[^;]+;/,"const url=new URL('/vendor/three/glb.runtime.js?v=0.21.328',import.meta.url);");
if(!wrapper.includes('finally{lease?.release();}')||!wrapper.includes('prototypePool.acquire'))throw Error('Wrapper changed: inspect prototype injection');
fs.writeFileSync(dir+'/viewer.js',wrapper);
console.log('Isolated allocation prototype generated; production sources untouched.');
