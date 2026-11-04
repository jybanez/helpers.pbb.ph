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
  const allowed = new Set(['KHR_materials_specular','KHR_materials_unlit','KHR_texture_transform','KHR_mesh_quantization','KHR_lights_punctual']);
  // Optional variant mappings are metadata only; the loader renders the base material.
  const optionalMetadata = new Set(['KHR_materials_variants']);
  const visit = value => {
    if (!value || typeof value !== 'object') return;
    if (value.extensions) for (const name of Object.keys(value.extensions)) if (!allowed.has(name) && !optionalMetadata.has(name)) throw new Error(`Unsupported extension ${name}. Export an uncompressed standard GLB.`);
    for (const [name, child] of Object.entries(value)) {
      if (name === 'uri') throw new Error('External and URI resources are not allowed. Embed all buffers and textures in the GLB.');
      if (name !== 'extras') visit(child);
    }
  };
  visit(json);
  for (const name of json.extensionsRequired || []) if (!allowed.has(name)) throw new Error(`Unsupported required extension ${name}. Export a GLB with supported default materials.`);
  for (const name of json.extensionsUsed || []) if (!allowed.has(name) && !optionalMetadata.has(name)) throw new Error(`Unsupported extension ${name}. Export an uncompressed standard GLB.`);
  if ((json.buffers || []).length > 1 || (json.buffers?.[0]?.byteLength || 0) > binLength) throw new Error('Missing embedded model buffer.');
  validateGeometry(json, buffer, binOffset, binLength);
  for (const image of json.images || []) if (!Number.isInteger(image.bufferView) || !['image/png','image/jpeg','image/webp'].includes(image.mimeType)) throw new Error('Textures must be embedded PNG, JPEG or WebP images.');
  return json;
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
