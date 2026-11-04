import {build} from 'esbuild';
import {mkdir,copyFile,writeFile} from 'node:fs/promises';
await mkdir('vendor/three',{recursive:true});
await build({entryPoints:['js/ui/ui.glb.runtime.js'],outfile:'vendor/three/glb.runtime.js',bundle:true,format:'esm',platform:'browser',target:'es2020',minify:true,charset:'utf8',legalComments:'eof'});
await copyFile('node_modules/three/LICENSE','vendor/three/LICENSE.txt');
await writeFile('vendor/three/README.md','Three.js 0.187.0 (MIT), bundled locally with GLTFLoader and OrbitControls. Source: https://github.com/mrdoob/three.js/tree/r187\nRebuild: node scripts/build.glb.runtime.mjs after npm ci. No remote rendering service or decoder is used.\n');
