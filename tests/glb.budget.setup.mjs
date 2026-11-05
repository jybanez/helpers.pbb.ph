import fs from 'node:fs';
import path from 'node:path';
import {build} from 'esbuild';
import {SphereGeometry} from 'three';
import {deflateSync} from 'node:zlib';
const dir='output/glb-budget-benchmark';fs.mkdirSync(dir,{recursive:true});
const encode=(json,bin)=>{const j=Buffer.from(JSON.stringify(json)),n=Math.ceil(j.length/4)*4,b=Buffer.alloc(28+n+bin.length);[0x46546c67,2,b.length,n,0x4e4f534a].forEach((v,i)=>b.writeUInt32LE(v,i*4));b.fill(32,20,20+n);j.copy(b,20);b.writeUInt32LE(bin.length,20+n);b.writeUInt32LE(0x004e4942,24+n);bin.copy(b,28+n);return b;};
const geometry=new SphereGeometry(1,96,64), baseArrays=[geometry.attributes.position.array,geometry.attributes.normal.array,geometry.attributes.uv.array,geometry.index.array];
for(const [label,count,distinct] of [['shared32',32,false],['distinct32',32,true],['distinct96-control',96,true],['distinct128-control',128,true]]){
 const json={asset:{version:'2.0'},scene:0,scenes:[{nodes:[]}],nodes:[],meshes:[],materials:[{pbrMetallicRoughness:{baseColorFactor:[0.3,0.7,0.8,1],metallicFactor:0,roughnessFactor:0.6}}],accessors:[],bufferViews:[],buffers:[]};const parts=[];let offset=0;
 for(let m=0;m<count;m++){
  const first=distinct?json.accessors.length:0;
  if(distinct||m===0)for(let i=0;i<4;i++){
   const array=baseArrays[i],bytes=Buffer.from(array.buffer,array.byteOffset,array.byteLength);json.bufferViews.push({buffer:0,byteOffset:offset,byteLength:bytes.length});parts.push(bytes);offset+=bytes.length;
   const padding=Buffer.alloc((-offset>>>0)%4);parts.push(padding);offset+=padding.length;
   json.accessors.push({bufferView:json.bufferViews.length-1,componentType:i===3?5123:5126,count:array.length/(i===3?1:i===2?2:3),type:i===3?'SCALAR':i===2?'VEC2':'VEC3',...(i===0?{min:[-1,-1,-1],max:[1,1,1]}:{})});
  }
  json.meshes.push({primitives:[{attributes:{POSITION:first,NORMAL:first+1,TEXCOORD_0:first+2},indices:first+3,material:0}]});json.nodes.push({mesh:m,translation:[(m%8)*2.5,Math.floor(m/8)*2.5,0]});json.scenes[0].nodes.push(m);
 }
 json.buffers=[{byteLength:offset}];fs.writeFileSync(`${dir}/${label}.glb`,encode(json,Buffer.concat(parts)));
}
// Embedded 2048-square PNG: tiny encoded data, substantial decoded texture.
const crc=bytes=>{let c=0xffffffff;for(const x of bytes){c^=x;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;};
const chunk=(type,data)=>{const t=Buffer.from(type),r=Buffer.alloc(data.length+12);r.writeUInt32BE(data.length);t.copy(r,4);data.copy(r,8);r.writeUInt32BE(crc(Buffer.concat([t,data])),r.length-4);return r;};
const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(2048,0);ihdr.writeUInt32BE(2048,4);ihdr[8]=8;ihdr[9]=6;
const scan=Buffer.alloc((2048*4+1)*2048,180);for(let y=0;y<2048;y++)scan[y*(2048*4+1)]=0;
const png=Buffer.concat([Buffer.from('89504e470d0a1a0a','hex'),chunk('IHDR',ihdr),chunk('IDAT',deflateSync(scan)),chunk('IEND',Buffer.alloc(0))]);
const fixture=fs.readFileSync('tests/fixtures/textured-room.glb'),json=JSON.parse(fixture.subarray(20,20+fixture.readUInt32LE(12))),bin=fixture.subarray(28+fixture.readUInt32LE(12));
const newbin=Buffer.concat([bin,png,Buffer.alloc((-png.length>>>0)%4)]);json.bufferViews[4]={buffer:0,byteOffset:bin.length,byteLength:png.length};json.buffers[0].byteLength=newbin.length;fs.writeFileSync(`${dir}/texture2048.glb`,encode(json,newbin));
const data=fs.readFileSync('js/ui/ui.glb.data.js','utf8');
for(const cap of [128,144]){
 fs.writeFileSync(`${dir}/data${cap}.js`,data.replace('= 128 * 1024 * 1024',`= ${cap} * 1024 * 1024`).replace('the 128 MiB',`the ${cap} MiB`));
 const wrapper=fs.readFileSync('js/ui/ui.glb.viewer.js','utf8').replace("'./ui.modal.js'","'/js/ui/ui.modal.js'").replace("'./ui.glb.data.js?v=0.21.327'",`'./data${cap}.js'`).replace(/const url=new URL\(bundled\?[^;]+;/,"const url=new URL('./runtime.js',import.meta.url);");fs.writeFileSync(`${dir}/viewer${cap}.js`,wrapper);
}
// Accounting-only copy executes the unchanged validation traversal without allocation cap.
fs.writeFileSync(`${dir}/estimate.mjs`,data.replace('= 128 * 1024 * 1024','= Number.MAX_SAFE_INTEGER').replace('allocated+=bytes;','allocated+=bytes;globalThis.__geometryEstimate=allocated;'));
let runtime=fs.readFileSync('js/ui/ui.glb.runtime.js','utf8');
runtime=runtime.replace('    model = gltf.scene;',`    model = gltf.scene;
    const geometries=new Set(),buffers=new Set(),textures=new Set(),images=new Set();let attributeBytes=0,decodedTextureBytes=0,mipTextureEstimate=0;
    for(const s of gltf.scenes)s.traverse(n=>{if(n.geometry&&!geometries.has(n.geometry)){geometries.add(n.geometry);for(const a of [...Object.values(n.geometry.attributes),n.geometry.index,...Object.values(n.geometry.morphAttributes).flat()].filter(Boolean)){const array=a.array||a.data?.array;if(array){attributeBytes+=array.byteLength;buffers.add(array.buffer);}}}for(const m of Array.isArray(n.material)?n.material:[n.material])if(m)for(const t of Object.values(m))if(t?.isTexture){textures.add(t);const im=t.source?.data;if(im&&!images.has(im)){images.add(im);const bytes=(im.width||0)*(im.height||0)*4;decodedTextureBytes+=bytes;mipTextureEstimate+=bytes*4/3;}}});
    globalThis.__models.push({geometries:geometries.size,attributeBytes,uniqueArrayBufferBytes:[...buffers].reduce((s,b)=>s+b.byteLength,0),textures:textures.size,decodedTextureBytes,mipTextureEstimate});`);
await build({stdin:{contents:runtime,resolveDir:path.resolve('js/ui'),sourcefile:'benchmark-runtime.js'},bundle:true,format:'esm',outfile:`${dir}/runtime.js`,minify:true});
console.log('Benchmark-only modules generated; deployed sources and budgets unchanged.');
