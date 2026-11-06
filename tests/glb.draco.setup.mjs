import fs from 'node:fs/promises';
import draco3d from 'draco3d';
import {BoxGeometry,Mesh} from 'three';
import {DRACOExporter} from 'three/addons/exporters/DRACOExporter.js';
globalThis.DracoEncoderModule=draco3d.createEncoderModule;
const geometry=new BoxGeometry(2,2,2), compressed=await new DRACOExporter().parseAsync(new Mesh(geometry));
const json={asset:{version:'2.0'},extensionsUsed:['KHR_draco_mesh_compression'],extensionsRequired:['KHR_draco_mesh_compression'],buffers:[{byteLength:compressed.length}],bufferViews:[{buffer:0,byteLength:compressed.length}],accessors:[{componentType:5126,type:'VEC3',count:24,min:[-1,-1,-1],max:[1,1,1]},{componentType:5126,type:'VEC3',count:24},{componentType:5126,type:'VEC2',count:24},{componentType:5123,type:'SCALAR',count:36}],meshes:[{primitives:[{attributes:{POSITION:0,NORMAL:1,TEXCOORD_0:2},indices:3,extensions:{KHR_draco_mesh_compression:{bufferView:0,attributes:{POSITION:0,NORMAL:1,TEXCOORD_0:2}}}}]}],nodes:[{mesh:0}],scenes:[{nodes:[0]}],scene:0};
export function pack(json,bin){const text=Buffer.from(JSON.stringify(json)),n=Math.ceil(text.length/4)*4,m=Math.ceil(bin.length/4)*4,b=Buffer.alloc(28+n+m);[0x46546c67,2,b.length,n,0x4e4f534a].forEach((x,i)=>b.writeUInt32LE(x,i*4));b.fill(32,20,20+n);text.copy(b,20);b.writeUInt32LE(m,20+n);b.writeUInt32LE(0x004e4942,24+n);Buffer.from(bin).copy(b,28+n);return b;}
await fs.mkdir('output/glb-draco',{recursive:true});
await fs.writeFile('output/glb-draco/cube.glb',pack(json,compressed));
const bad=structuredClone(json);bad.accessors[0].count=bad.accessors[1].count=bad.accessors[2].count=23;
await fs.writeFile('output/glb-draco/count-mismatch.glb',pack(bad,compressed));
const invalid=compressed.slice();invalid.fill(0);
await fs.writeFile('output/glb-draco/invalid.glb',pack(json,invalid));
console.log('Generated synthetic Draco cube and rejection controls.');
