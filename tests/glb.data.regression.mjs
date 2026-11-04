import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateGlb,prepareGlb} from '../js/ui/ui.glb.data.js';
export function glb(json, bin) {
 const encoded=new TextEncoder().encode(JSON.stringify(json)), size=Math.ceil(encoded.length/4)*4;
 const n=bin?Math.ceil(bin.length/4)*4:0, buffer=new ArrayBuffer(20+size+(bin?8+n:0)), view=new DataView(buffer);
 [0x46546c67,2,buffer.byteLength,size,0x4e4f534a].forEach((v,i)=>view.setUint32(i*4,v,true));
 new Uint8Array(buffer,20,size).fill(32);new Uint8Array(buffer,20,encoded.length).set(encoded);
 if(bin){view.setUint32(20+size,n,true);view.setUint32(24+size,0x004e4942,true);new Uint8Array(buffer,28+size,bin.length).set(bin);}
 return buffer;
}
const scene=count=>({asset:{version:'2.0'},accessors:[{componentType:5126,count,type:'VEC3'}],meshes:[{primitives:[{attributes:{POSITION:0}}]}],nodes:[{mesh:0}],scenes:[{nodes:[0]}],scene:0});
const malicious=glb(scene(1000000000));
fs.writeFileSync(new URL('./fixtures/oversized-accessor.glb',import.meta.url),new Uint8Array(malicious));
assert(malicious.byteLength<512);
assert.throws(()=>validateGlb(malicious),/128 MiB/);
validateGlb(glb(scene(3)));
for(const change of [{count:-1},{count:1.5},{count:Number.MAX_SAFE_INTEGER},{type:'BOGUS'},{componentType:123}]) {
 const json=scene(3);Object.assign(json.accessors[0],change);assert.throws(()=>validateGlb(glb(json)),/geometry/);
}
const aggregate=scene(1500000);aggregate.accessors.push({...aggregate.accessors[0]},{...aggregate.accessors[0]});
assert.throws(()=>validateGlb(glb(aggregate)),/128 MiB/);
const sparse=scene(3);sparse.buffers=[{byteLength:40}];sparse.bufferViews=[{buffer:0,byteOffset:0,byteLength:3},{buffer:0,byteOffset:4,byteLength:36}];
sparse.accessors[0].sparse={count:3,indices:{bufferView:0,componentType:5121},values:{bufferView:1}};
const bin=new Uint8Array(40);bin.set([0,1,2]);new Float32Array(bin.buffer,4).set([-1,0,0,1,0,0,0,1,0]);
validateGlb(glb(sparse,bin));
fs.writeFileSync(new URL('./fixtures/sparse-triangle.glb',import.meta.url),new Uint8Array(glb(sparse,bin)));
for(const modify of [j=>j.bufferViews[1].byteLength=37,j=>j.bufferViews[1].byteOffset=8,j=>j.accessors[0].sparse.count=4,j=>j.accessors[0].sparse.values.byteOffset=4,j=>j.accessors[0].sparse.indices.componentType=5126]) {
 const json=structuredClone(sparse);modify(json);assert.throws(()=>validateGlb(glb(json,bin)),/geometry/);
}
for(const indices of [[0,1,3],[0,0,2]]) {const bad=bin.slice();bad.set(indices);assert.throws(()=>validateGlb(glb(sparse,bad)),/sparse indices/);}
const backed=structuredClone(sparse);delete backed.accessors[0].sparse;backed.accessors[0].bufferView=1;validateGlb(glb(backed,bin));
backed.accessors[0].count=4;assert.throws(()=>validateGlb(glb(backed,bin)),/range/);
const specularFile=fs.readFileSync(new URL('./fixtures/specular-room.glb',import.meta.url));
const specular=validateGlb(specularFile.buffer.slice(specularFile.byteOffset,specularFile.byteOffset+specularFile.byteLength));
assert.deepEqual(specular.extensionsRequired,['KHR_materials_specular']);
assert.equal(specular.materials[0].extensions.KHR_materials_specular.specularTexture.index,0);
assert.equal(specular.images[0].mimeType,'image/png');
const specularOnly={asset:{version:'2.0'},extensionsRequired:['KHR_materials_specular'],materials:[{extensions:{KHR_materials_specular:{specularFactor:0.8}}}]};
validateGlb(glb(specularOnly));
specularOnly.materials[0].extensions.KHR_materials_specular.specularTexture={uri:'https://example.invalid/map.png'};
assert.throws(()=>validateGlb(glb(specularOnly)),/URI resources/);
specularOnly.extensionsRequired.push('KHR_materials_transmission');
delete specularOnly.materials[0].extensions.KHR_materials_specular.specularTexture;
assert.throws(()=>validateGlb(glb(specularOnly)),/Unsupported required extension/);
console.log('GLB geometry budget, ranges, accessor types, zero/sparse geometry and narrow specular support passed.');

const variants={asset:{version:'2.0'},extensionsUsed:['KHR_materials_variants'],extensions:{KHR_materials_variants:{variants:[{name:'Alternate'}]}}};
validateGlb(glb(variants));
assert.throws(()=>validateGlb(glb({...variants,extensionsRequired:['KHR_materials_variants']})),/Unsupported required extensions: KHR_materials_variants/);
validateGlb(glb({...variants,extensionsUsed:['KHR_unknown']}));
variants.extensions.KHR_materials_variants.uri='https://example.invalid/alternate';
assert.throws(()=>validateGlb(glb(variants)),/URI resources/);
delete variants.extensions.KHR_materials_variants.uri;
assert.throws(()=>validateGlb(glb({...scene(1000000000),...variants})),/128 MiB/);
console.log('Optional variants accepted; required variants, URIs and oversized geometry rejected.');

const optional={asset:{version:'2.0'},extensionsUsed:['EXT_invented','KHR_materials_transmission'],extensions:{EXT_invented:{note:'ignored'}},materials:[{extensions:{KHR_materials_transmission:{transmissionFactor:1},KHR_materials_specular:{specularFactor:0.5}}}]};
const original=glb(optional), originalCopy=new Uint8Array(original).slice(), prepared=prepareGlb(original);
const clean=validateGlb(prepared.bytes);
assert.deepEqual(prepared.skippedExtensions,['EXT_invented','KHR_materials_transmission']);
assert.deepEqual(clean.extensions,{});assert.deepEqual(clean.extensionsUsed,[]);
assert.deepEqual(Object.keys(clean.materials[0].extensions),['KHR_materials_specular']);
assert.deepEqual(new Uint8Array(original),originalCopy);
assert.throws(()=>prepareGlb(glb({...optional,extensionsRequired:['EXT_invented','KHR_materials_transmission']})),/EXT_invented, KHR_materials_transmission/);
console.log('Unknown and Three-known optional handlers isolated; required names reported; supported payloads and original bytes preserved.');

const fixture=fs.readFileSync(new URL('./fixtures/extensions-optional.glb',import.meta.url));
const input=fixture.buffer.slice(fixture.byteOffset,fixture.byteOffset+fixture.byteLength);
const output=prepareGlb(input).bytes;
const binaryTail=bytes=>new Uint8Array(bytes,20+new DataView(bytes).getUint32(12,true));
assert.deepEqual(binaryTail(output),binaryTail(input),'embedded binary chunk stays byte-for-byte intact');
assert.throws(()=>prepareGlb(input,100),/size limit/);
const nested=structuredClone(optional);nested.extensions.EXT_invented.uri='https://example.invalid/blocked';
assert.throws(()=>prepareGlb(glb(nested)),/URI resources/);
assert.throws(()=>prepareGlb(glb({...scene(1000000000),...optional})),/128 MiB/);
