// Static embedded WebP only. Bounds are checked before browser image decoding.
export const GLB_WEBP_LIMITS = Object.freeze({dimension:4096, bytes:128*1024*1024});
const fail = message => {throw new Error(`Invalid WebP texture: ${message}. Export smaller, static embedded textures.`);};
export function webpDimensions(bytes) {
  const v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  const tag=o=>String.fromCharCode(...bytes.subarray(o,o+4));
  const u24=o=>bytes[o]+bytes[o+1]*256+bytes[o+2]*65536;
  if(bytes.length<20 || tag(0)!=='RIFF' || tag(8)!=='WEBP' || v.getUint32(4,true)+8!==bytes.length)fail('RIFF header or length is invalid');
  let canvas, image, chunks=0;
  for(let o=12;o<bytes.length;) {
    if(o+8>bytes.length || ++chunks>1024)fail('chunk header is invalid');
    const type=tag(o),n=v.getUint32(o+4,true),p=o+8,end=p+n+(n%2);
    if(end>bytes.length || (n%2 && bytes[p+n]!==0))fail('chunk length or padding is invalid');
    if(type==='ANIM'||type==='ANMF')fail('animation is not supported');
    if(type==='VP8X') {
      if(o!==12 || n!==10 || canvas || bytes[p]&0xc3 || bytes[p+1] || bytes[p+2] || bytes[p+3])fail('extended header or animation flags are invalid');
      canvas={width:u24(p+4)+1,height:u24(p+7)+1};
    } else if(type==='VP8 ' || type==='VP8L') {
      if(image)fail('multiple image payloads are not supported');
      if(type==='VP8 ') {
        if(n<10 || bytes[p]&1 || bytes[p+3]!==0x9d || bytes[p+4]!==1 || bytes[p+5]!==0x2a)fail('VP8 keyframe header is invalid');
        image={width:v.getUint16(p+6,true)&0x3fff,height:v.getUint16(p+8,true)&0x3fff};
      } else {
        if(n<5 || bytes[p]!==0x2f || bytes[p+4]&0xe0)fail('VP8L header is invalid');
        const bits=v.getUint32(p+1,true);image={width:(bits&0x3fff)+1,height:((bits>>>14)&0x3fff)+1};
      }
    }
    o=end;
  }
  if(!image || (canvas&&(canvas.width!==image.width || canvas.height!==image.height)))fail('missing image or inconsistent canvas dimensions');
  if(!image.width || !image.height || image.width>GLB_WEBP_LIMITS.dimension || image.height>GLB_WEBP_LIMITS.dimension)fail('dimensions exceed the 4096 pixel preview limit');
  return image;
}

export function validateWebpTextures(json,buffer,binOffset) {
  const images=json.images??[],textures=json.textures??[],dimensions=new Map();
  if(!Array.isArray(images)||!Array.isArray(textures))fail('images and textures must be arrays');
  for(let i=0;i<images.length;i++) {
    const image=images[i];
    if(!image || !Number.isSafeInteger(image.bufferView) || image.bufferView<0 || !json.bufferViews?.[image.bufferView])fail('embedded image reference is invalid');
    if(image.mimeType!=='image/webp')continue;
    const view=json.bufferViews[image.bufferView];
    if(view.byteStride!==undefined)fail('image bufferView cannot be interleaved');
    dimensions.set(i,webpDimensions(new Uint8Array(buffer,binOffset+(view.byteOffset??0),view.byteLength)));
  }
  let reserved=0;
  const reserve=id=>{const d=dimensions.get(id);if(!d)return;
    // Decoded bitmap + GPU RGBA/mips + upload reserve, per texture definition.
    reserved+=d.width*d.height*12;
    if(reserved>GLB_WEBP_LIMITS.bytes)fail('decoded textures exceed the 128 MiB preview budget');
  };
  for(const texture of textures) {
    if(!texture || typeof texture!=='object')fail('texture definition is invalid');
    if(texture.source!==undefined && (!Number.isSafeInteger(texture.source)||texture.source<0||!images[texture.source]))fail('texture source is invalid');
    const ext=texture.extensions?.EXT_texture_webp;
    if(ext!==undefined) {
      if(!ext || !Number.isSafeInteger(ext.source) || ext.source<0 || !dimensions.has(ext.source))fail('EXT_texture_webp source must reference embedded image/webp');
      if(!json.extensionsUsed?.includes('EXT_texture_webp'))fail('EXT_texture_webp must be declared in extensionsUsed');
      if(texture.source===undefined&&!json.extensionsRequired?.includes('EXT_texture_webp'))fail('WebP without fallback must be required');
      reserve(ext.source);
    } else if(texture.source!==undefined)reserve(texture.source);
  }
  return {images:dimensions.size,reservedBytes:reserved};
}
