// Validate the container before handing any bytes to the rendering dependency.
export function validateGlb(buffer, maxBytes = 64 * 1024 * 1024) {
  if (!(buffer instanceof ArrayBuffer)) throw new TypeError('Choose a GLB file or return a Blob/ArrayBuffer from load.');
  if (buffer.byteLength > maxBytes) throw new RangeError('Model exceeds the preview size limit. Export a smaller GLB.');
  if (buffer.byteLength < 20) throw new Error('Invalid GLB header. Export a glTF 2.0 binary (.glb) file.');
  const view = new DataView(buffer);
  if (view.getUint32(0,true) !== 0x46546c67 || view.getUint32(4,true) !== 2 || view.getUint32(8,true) !== buffer.byteLength) throw new Error('Expected a complete glTF 2.0 binary (.glb) file.');
  let json, binLength = 0, chunks = 0;
  for (let offset = 12; offset < buffer.byteLength;) {
    if (offset + 8 > buffer.byteLength) throw new Error('Truncated GLB chunk. Export the file again.');
    const size = view.getUint32(offset,true), type = view.getUint32(offset+4,true);
    if (size % 4 || offset + 8 + size > buffer.byteLength) throw new Error('Invalid GLB chunk length.');
    if (chunks === 0 && type !== 0x4e4f534a) throw new Error('GLB must start with a JSON chunk.');
    if (type === 0x4e4f534a) {
      if (json) throw new Error('Duplicate GLB JSON chunk.');
      json = JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(new Uint8Array(buffer,offset+8,size)));
    } else if (type === 0x004e4942 && chunks === 1) binLength = size;
    else throw new Error('Unsupported GLB chunk. Export a standard self-contained GLB.');
    offset += size + 8; chunks++;
  }
  if (json?.asset?.version !== '2.0') throw new Error('Only glTF 2.0 models are supported.');
  const allowed = new Set(['KHR_materials_unlit','KHR_texture_transform','KHR_mesh_quantization','KHR_lights_punctual']);
  const visit = value => {
    if (!value || typeof value !== 'object') return;
    if (value.extensions) for (const name of Object.keys(value.extensions)) if (!allowed.has(name)) throw new Error(`Unsupported extension ${name}. Export an uncompressed standard GLB.`);
    for (const [name, child] of Object.entries(value)) {
      if (name === 'uri') throw new Error('External and URI resources are not allowed. Embed all buffers and textures in the GLB.');
      if (name !== 'extras') visit(child);
    }
  };
  visit(json);
  for (const name of [...(json.extensionsRequired || []), ...(json.extensionsUsed || [])]) if (!allowed.has(name)) throw new Error(`Unsupported extension ${name}. Export an uncompressed standard GLB.`);
  if ((json.buffers || []).length > 1 || (json.buffers?.[0]?.byteLength || 0) > binLength) throw new Error('Missing embedded model buffer.');
  for (const image of json.images || []) if (!Number.isInteger(image.bufferView) || !['image/png','image/jpeg','image/webp'].includes(image.mimeType)) throw new Error('Textures must be embedded PNG, JPEG or WebP images.');
  return json;
}
