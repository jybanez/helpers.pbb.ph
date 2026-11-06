import {build} from 'esbuild';
import {mkdir,copyFile,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
await mkdir('vendor/three',{recursive:true});
await build({entryPoints:['js/ui/ui.glb.runtime.js'],outfile:'vendor/three/glb.runtime.js',bundle:true,format:'esm',platform:'browser',target:'es2020',minify:true,charset:'utf8',legalComments:'eof'});
await copyFile('node_modules/three/LICENSE','vendor/three/LICENSE.txt');
const source='node_modules/three/examples/jsm/libs/draco/gltf/', target='vendor/three/draco-r187/';
await mkdir(target,{recursive:true});
const wasm=await readFile(source+'draco_decoder.wasm');
if(createHash('sha256').update(wasm).digest('hex')!=='a680d927bed9cb864ddbd63521868891af2bfbe755092761b4837487618df8ac')throw Error('Review new Draco binary before applying memory bound.');
// Pinned WASM memory section at byte 619: one memory, minimum 256 pages,
// maximum 32768 pages. Lower only maximum to 2048 pages (128 MiB), retaining
// the 3-byte unsigned LEB encoding so section offsets and code stay unchanged.
if(wasm.subarray(619,626).toString('hex')!=='01018002808002')throw Error('Unexpected Draco memory section');
wasm.set([0x80,0x90,0x00],623);
await WebAssembly.compile(wasm);
await writeFile(target+'draco_decoder.wasm',wasm);
await copyFile(source+'draco_wasm_wrapper.js',target+'draco_wasm_wrapper.js');
await copyFile('js/ui/ui.glb.draco.worker.js',target+'worker.js');
await writeFile('vendor/three/README.md','Three.js 0.187.0 (MIT), bundled locally with GLTFLoader and OrbitControls. Source: https://github.com/mrdoob/three.js/tree/r187\nRebuild: node scripts/build.glb.runtime.mjs after npm ci.\nDraco glTF WASM/wrapper from the pinned Three r187 package (Apache-2.0). Source: https://github.com/google/draco . The build lowers only the WASM memory maximum to 128 MiB; source hash and memory section are verified before patching. Decoder assets are lazy, same-origin, and local; no CDN or remote rendering service. See draco-r187/LICENSE.txt.\n');
