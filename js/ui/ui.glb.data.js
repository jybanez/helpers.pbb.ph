import {GLB_DRACO_WORK_LIMITS} from './ui.glb.policy.js';
import {validateWebpTextures} from './ui.glb.webp.js';
const SUPPORTED_EXTENSIONS = new Set(['EXT_texture_webp','KHR_draco_mesh_compression','KHR_materials_specular','KHR_materials_unlit','KHR_texture_transform','KHR_mesh_quantization','KHR_lights_punctual']);

// Validate the container before handing any bytes to the rendering dependency.
export function validateGlb(buffer, maxBytes = 64 * 1024 * 1024) {
  if (!(buffer instanceof ArrayBuffer)) throw new TypeError('Choose a GLB file or return a Blob/ArrayBuffer from load.');
  if (buffer.byteLength > maxBytes) throw new RangeError('Model exceeds the preview size limit. Export a smaller GLB.');
  if (buffer.byteLength < 20) throw new Error('Invalid GLB header. Export a glTF 2.0 binary (.glb) file.');
  const view = new DataView(buffer);
  if (view.getUint32(0,true) !== 0x46546c67 || view.getUint32(4,true) !== 2 || view.getUint32(8,true) !== buffer.byteLength) throw new Error('Expected a complete glTF 2.0 binary (.glb) file.');
  let json, binLength = 0, binOffset = 0, chunks = 0;
  for (let offset = 12; offset < buffer.byteLength;) {
    if (offset + 8 > buffer.byteLength) throw new Error('Truncated GLB chunk. Export the file again.');
    const size = view.getUint32(offset,true), type = view.getUint32(offset+4,true);
    if (size % 4 || offset + 8 + size > buffer.byteLength) throw new Error('Invalid GLB chunk length.');
    if (chunks === 0 && type !== 0x4e4f534a) throw new Error('GLB must start with a JSON chunk.');
    if (type === 0x4e4f534a) {
      if (json) throw new Error('Duplicate GLB JSON chunk.');
      json = JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(new Uint8Array(buffer,offset+8,size)));
    } else if (type === 0x004e4942 && chunks === 1) {binLength = size; binOffset = offset + 8;}
    else throw new Error('Unsupported GLB chunk. Export a standard self-contained GLB.');
    offset += size + 8; chunks++;
  }
  if (json?.asset?.version !== '2.0') throw new Error('Only glTF 2.0 models are supported.');
  const unsupportedRequired = (json.extensionsRequired || []).filter(name => !SUPPORTED_EXTENSIONS.has(name));
  if (unsupportedRequired.length) throw new Error(`Unsupported required extensions: ${[...new Set(unsupportedRequired)].join(', ')}. Export a GLB with supported standard fallback data.`);
  const visit = value => {
    if (!value || typeof value !== 'object') return;
    for (const [name, child] of Object.entries(value)) {
      if (name === 'uri') throw new Error('External and URI resources are not allowed. Embed all buffers and textures in the GLB.');
      if (name !== 'extras') visit(child);
    }
  };
  visit(json);
  if ((json.buffers || []).length > 1 || (json.buffers?.[0]?.byteLength || 0) > binLength) throw new Error('Missing embedded model buffer.');
  validateGeometry(json, buffer, binOffset, binLength);
  validateWebpTextures(json,buffer,binOffset);
  dracoManifest(json);
  for (const image of json.images || []) if (!Number.isInteger(image.bufferView) || !['image/png','image/jpeg','image/webp'].includes(image.mimeType)) throw new Error('Textures must be embedded PNG, JPEG or WebP images.');
  return json;
}

// Additional bounds apply only to Draco scenes; retain the existing path for
// uncompressed models. Accessor geometry accounting above remains unchanged.
export function dracoManifest(json) {
  const definitions = new Map(), size = {SCALAR:1,VEC2:2,VEC3:3,VEC4:4};
  const fail = message => {throw new Error(`Invalid Draco model: ${message}. Export a smaller, valid GLB.`);};
  for (const mesh of json.meshes || []) for (const p of mesh.primitives || []) {
    const d = p.extensions?.KHR_draco_mesh_compression; if (!d) continue;
    if ((p.mode ?? 4)!==4 || !Number.isSafeInteger(d.bufferView) || !json.bufferViews?.[d.bufferView] || !d.attributes || typeof d.attributes!=='object') fail('expected embedded triangle data');
    const position=json.accessors?.[p.attributes?.POSITION], index=json.accessors?.[p.indices];
    if (!position || position.type!=='VEC3' || !index || index.type!=='SCALAR' || ![5121,5123,5125].includes(index.componentType) || index.count%3) fail('indexed triangle accessors are required');
    const attributes={};
    for (const [semantic,id] of Object.entries(d.attributes)) {
      const a=json.accessors?.[p.attributes?.[semantic]];
      if (!Number.isSafeInteger(id) || id<0 || Object.hasOwn(attributes,id) || !a || !size[a.type] || a.count!==position.count || a.sparse) fail('compressed attribute mapping is invalid');
      attributes[id]={size:size[a.type],count:a.count};
    }
    if (!Object.hasOwn(d.attributes,'POSITION') || index.sparse) fail('compressed position and indices are required');
    const entry={points:position.count,indices:index.count,indexType:index.componentType,attributes};
    const entries=definitions.get(d.bufferView) || [];entries.push(entry);definitions.set(d.bufferView,entries);
  }
  if (!definitions.size) return definitions;
  if (definitions.size>1024 || (json.nodes?.length??0)>4096) fail('scene exceeds the decoder workload limit');
  let draws=0,triangles=0,nodes=0;
  const visit=(id,ancestors)=>{
    if (!Number.isSafeInteger(id) || !json.nodes?.[id] || ancestors.has(id) || ancestors.size>=64 || ++nodes>4096) fail('scene hierarchy exceeds the preview limit');
    const node=json.nodes[id], next=new Set(ancestors);next.add(id);
    if (node.mesh!==undefined) {
      const mesh=json.meshes?.[node.mesh];if(!mesh)fail('missing mesh');
      for(const p of mesh.primitives || []) {
        const material=json.materials?.[p.material],passes=material?.doubleSided&&material.alphaMode==='BLEND'?2:1;
        draws+=passes;triangles+=passes*(json.accessors?.[p.indices]?.count??json.accessors?.[p.attributes?.POSITION]?.count??0)/3;
      }
    }
    if (draws>GLB_DRACO_WORK_LIMITS.draws || triangles>GLB_DRACO_WORK_LIMITS.triangles) fail('scene exceeds 2048 draw calls or 3000000 triangles');
    for(const child of node.children||[])visit(child,next);
  };
  for(const scene of json.scenes||[])for(const id of scene.nodes||[])visit(id,new Set());
  return definitions;
}

// Independent of compressed/file size. Include copied bufferViews, expanded
// accessor storage and per-primitive conversion/clone reserves before importing Three.
export const GLB_GEOMETRY_BUDGET = 128 * 1024 * 1024;
function validateGeometry(json, buffer, binOffset, binLength) {
  const fail = message => {throw new Error(`Invalid model geometry: ${message}. Export a smaller, valid GLB.`);};
  const integer = (value, minimum = 0) => Number.isSafeInteger(value) && value >= minimum;
  const list = name => {const value=json[name] ?? [];if(!Array.isArray(value))fail(`${name} must be an array`);return value;};
  const buffers=list('buffers'), views=list('bufferViews'), accessors=list('accessors');
  const length=buffers[0]?.byteLength ?? 0;
  if(!integer(length) || length>binLength)fail('embedded buffer length is invalid');
  let allocated=0;
  const reserve = bytes => {if(!integer(bytes) || bytes>GLB_GEOMETRY_BUDGET-allocated)fail('decoded geometry exceeds the 128 MiB preview budget');allocated+=bytes;};
  const getView = index => {if(!integer(index)||!views[index])fail('bufferView reference is invalid');return views[index];};
  for(const v of views) {
    if(!v || v.buffer!==0 || !buffers.length || !integer(v.byteOffset??0) || !integer(v.byteLength,1) || (v.byteOffset??0)+v.byteLength>length)fail('bufferView range exceeds embedded bytes');
    if(v.byteStride!==undefined && (!integer(v.byteStride,4)||v.byteStride>252||v.byteStride%4))fail('bufferView stride is invalid');
    reserve(v.byteLength);
  }
  const components={5120:1,5121:1,5122:2,5123:2,5125:4,5126:4};
  const sizes={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16};
  const range=(v,offset,count,element,stride,alignment)=>{
    if(!integer(offset)||offset%alignment||((v.byteOffset??0)+offset)%alignment||stride<element||stride%alignment||offset+(count-1)*stride+element>v.byteLength)fail('accessor range or alignment is invalid');
  };
  const costs=accessors.map(a=>{
    if(!a || !integer(a.count,1) || !Object.hasOwn(components,a.componentType) || !Object.hasOwn(sizes,a.type))fail('accessor count, type or component type is invalid');
    const width=components[a.componentType], items=sizes[a.type];
    const matrix=a.type.startsWith('MAT')?Number(a.type.slice(3)):0;
    const element=matrix?matrix*Math.ceil(matrix*width/4)*4:items*width;
    // Reserve float-width expansion plus a writable copy even for omitted views.
    const cost=a.count*Math.max(element,items*4)*2;
    reserve(cost);
    if(a.bufferView!==undefined){const v=getView(a.bufferView);range(v,a.byteOffset??0,a.count,element,v.byteStride??element,width);}
    else if((a.byteOffset??0)!==0)fail('an accessor without a bufferView cannot have an offset');
    if(a.sparse!==undefined){
      const s=a.sparse;
      if(!s || !integer(s.count,1)||s.count>a.count || !s.indices || !s.values || ![5121,5123,5125].includes(s.indices.componentType))fail('sparse accessor is invalid');
      const iv=getView(s.indices.bufferView), vv=getView(s.values.bufferView), iw=components[s.indices.componentType];
      if(iv.byteStride!==undefined||vv.byteStride!==undefined)fail('sparse views cannot be interleaved');
      range(iv,s.indices.byteOffset??0,s.count,iw,iw,iw);range(vv,s.values.byteOffset??0,s.count,element,element,width);
      reserve(s.count*(iw+Math.max(element,items*4)));
      const data=new DataView(buffer,binOffset+(iv.byteOffset??0)+(s.indices.byteOffset??0),s.count*iw);
      let previous=-1;
      for(let i=0;i<s.count;i++){const index=iw===1?data.getUint8(i):iw===2?data.getUint16(i*2,true):data.getUint32(i*4,true);if(index<=previous||index>=a.count)fail('sparse indices must increase and stay within accessor count');previous=index;}
    }
    return cost;
  });
  const reference=index=>{if(!integer(index)||costs[index]===undefined)fail('primitive accessor reference is invalid');reserve(costs[index]);};
  for(const mesh of list('meshes')) for(const primitive of mesh.primitives??[]) {
    for(const index of Object.values(primitive.attributes??{}))reference(index);
    if(primitive.indices!==undefined)reference(primitive.indices);
    for(const target of primitive.targets??[])for(const index of Object.values(target))reference(index);
  }
}

// Validate original standard data and resources before discarding optional features.
// Rebuild a detached GLB so no unsupported payload can reach any loader handler.
export function prepareGlb(buffer, maxBytes) {
  const json = validateGlb(buffer, maxBytes);
  const skipped = new Set((json.extensionsUsed || []).filter(name => !SUPPORTED_EXTENSIONS.has(name)));
  const strip = value => {
    if (!value || typeof value !== 'object') return;
    if (value.extensions) for (const name of Object.keys(value.extensions)) {
      if (!SUPPORTED_EXTENSIONS.has(name)) {skipped.add(name);delete value.extensions[name];}
    }
    for (const [name, child] of Object.entries(value)) if (name !== 'extras') strip(child);
  };
  strip(json);
  if (!skipped.size) return {bytes:buffer,skippedExtensions:[]};
  if (json.extensionsUsed) json.extensionsUsed=json.extensionsUsed.filter(name=>SUPPORTED_EXTENSIONS.has(name));
  const encoded=new TextEncoder().encode(JSON.stringify(json)), padded=Math.ceil(encoded.length/4)*4;
  const source=new DataView(buffer), tailOffset=20+source.getUint32(12,true);
  const bytes=new ArrayBuffer(20+padded+buffer.byteLength-tailOffset), view=new DataView(bytes);
  [0x46546c67,2,bytes.byteLength,padded,0x4e4f534a].forEach((v,i)=>view.setUint32(i*4,v,true));
  new Uint8Array(bytes,20,padded).fill(32);new Uint8Array(bytes,20,encoded.length).set(encoded);
  new Uint8Array(bytes,20+padded).set(new Uint8Array(buffer,tailOffset));
  return {bytes,skippedExtensions:[...skipped].sort()};
}
