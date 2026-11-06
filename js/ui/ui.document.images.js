import {webpDimensions} from './ui.glb.webp.js';

export const DOCUMENT_IMAGE_LIMITS=Object.freeze({count:24,bytes:8*1024*1024,totalBytes:32*1024*1024,pixels:16*1024*1024,totalPixels:32*1024*1024,timeout:15000,totalTime:30000});
const invalid=()=>{throw Error('Use a valid PNG, JPEG or static WebP image within preview limits.');};
export async function readDocumentImageResponse(response,{signal}={}) {
  const type=response.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
  if(!response.ok||!['image/png','image/jpeg','image/webp'].includes(type)||Number(response.headers.get('content-length'))>DOCUMENT_IMAGE_LIMITS.bytes){await response.body?.cancel();invalid();}
  const reader=response.body?.getReader();if(!reader)throw Error('A bounded image response stream is required.');
  const abort=()=>{void reader.cancel().catch(()=>{});};signal?.addEventListener('abort',abort,{once:true});
  const chunks=[];let size=0;
  try{
    while(true){if(signal?.aborted)throw new DOMException('Cancelled','AbortError');const {done,value}=await reader.read();if(signal?.aborted)throw new DOMException('Cancelled','AbortError');if(done)break;size+=value.byteLength;if(size>DOCUMENT_IMAGE_LIMITS.bytes)invalid();chunks.push(value);}
    return new Blob(chunks,{type});
  }finally{signal?.removeEventListener('abort',abort);await reader.cancel().catch(()=>{});reader.releaseLock();}
}
export function documentImageDimensions(b,type) {
  const v=new DataView(b.buffer,b.byteOffset,b.byteLength);
  if(type==='image/webp')return webpDimensions(b);
  if(type==='image/png') {
    if(b.length<33 || [137,80,78,71,13,10,26,10].some((n,i)=>b[i]!==n) || v.getUint32(8)!==13 || String.fromCharCode(...b.subarray(12,16))!=='IHDR')return invalid();
    return {width:v.getUint32(16),height:v.getUint32(20)};
  }
  if(type==='image/jpeg' && b.length>4 && b[0]===255 && b[1]===216) {
    let o=2;
    while(o+4<=b.length){
      if(b[o++]!==255)return invalid();while(b[o]===255)o++;
      const marker=b[o++];if(marker===0xda||marker===0xd9)break;
      const n=v.getUint16(o);if(n<2||o+n>b.length)return invalid();
      if([0xc0,0xc1,0xc2].includes(marker)){if(n<8)return invalid();return {height:v.getUint16(o+3),width:v.getUint16(o+5)};}
      o+=n;
    }
  }
  return invalid();
}

// No fetch or URL interpretation here: only the host can approve and load bytes.
export function createDocumentImageScope(resolveImage,externalSignal,{dataUrls=false}={}) {
  const controller=new AbortController(),signal=controller.signal,urls=new Set();
  const deadline=Date.now()+DOCUMENT_IMAGE_LIMITS.totalTime;
  let count=0,totalBytes=0,totalPixels=0,cleanBytes=0;
  const dispose=()=>{controller.abort();for(const url of urls)URL.revokeObjectURL(url);urls.clear();externalSignal?.removeEventListener('abort',dispose);};
  if(externalSignal?.aborted)dispose();else externalSignal?.addEventListener('abort',dispose,{once:true});
  async function load(source,alt='') {
    if(signal.aborted)throw new DOMException('Cancelled','AbortError');
    if(Date.now()>=deadline)throw Error('Document image loading deadline exceeded.');
    if(typeof resolveImage!=='function'||typeof source!=='string'||!source||source.length>2048||++count>DOCUMENT_IMAGE_LIMITS.count)throw Error('Image is not approved or the image count limit was reached.');
    const job=new AbortController();const abort=()=>job.abort();signal.addEventListener('abort',abort,{once:true});
    const timer=setTimeout(abort,Math.min(DOCUMENT_IMAGE_LIMITS.timeout,Math.max(1,deadline-Date.now())));
    const bounded=promise=>new Promise((resolve,reject)=>{
      const stop=()=>reject(new DOMException('Image loading cancelled or timed out','AbortError'));
      job.signal.addEventListener('abort',stop,{once:true});
      Promise.resolve(promise).then(resolve,reject).finally(()=>job.signal.removeEventListener('abort',stop));
      if(job.signal.aborted)stop();
    });
    try {
      const blob=await bounded(Promise.resolve().then(()=>resolveImage(source,{signal:job.signal,alt})));
      if(!(blob instanceof Blob)||!['image/png','image/jpeg','image/webp'].includes(blob.type)||!blob.size||blob.size>DOCUMENT_IMAGE_LIMITS.bytes)invalid();
      totalBytes+=blob.size;if(totalBytes>DOCUMENT_IMAGE_LIMITS.totalBytes)throw Error('Document image byte limit exceeded.');
      const bytes=new Uint8Array(await bounded(blob.arrayBuffer())),d=documentImageDimensions(bytes,blob.type),pixels=d.width*d.height;
      totalPixels+=pixels;
      if(!d.width||!d.height||d.width>4096||d.height>4096||pixels>DOCUMENT_IMAGE_LIMITS.pixels||totalPixels>DOCUMENT_IMAGE_LIMITS.totalPixels)throw Error('Document image pixel limit exceeded.');
      // Native decode validates compressed data. Always close late decode results.
      const bitmap=await bounded(createImageBitmap(blob).then(value=>{if(job.signal.aborted){value.close();throw new DOMException('Cancelled','AbortError');}return value;}));
      try {
        if(bitmap.width!==d.width||bitmap.height!==d.height)invalid();
        // Re-encode a static raster, stripping metadata and source container content.
        const canvas=document.createElement('canvas');canvas.width=d.width;canvas.height=d.height;
        let clean;
        try{canvas.getContext('2d').drawImage(bitmap,0,0);clean=await bounded(new Promise(resolve=>canvas.toBlob(resolve,'image/png')));}
        finally{canvas.width=canvas.height=0;}
        if(!clean||clean.size>DOCUMENT_IMAGE_LIMITS.bytes||job.signal.aborted)invalid();
        cleanBytes+=clean.size;if(cleanBytes>DOCUMENT_IMAGE_LIMITS.totalBytes)throw Error('Document image output byte limit exceeded.');
        if(dataUrls)return await bounded(new Promise((resolve,reject)=>{
          const reader=new FileReader(),stop=()=>reader.abort(),done=()=>job.signal.removeEventListener('abort',stop);
          reader.onload=()=>{done();resolve(reader.result);};reader.onerror=()=>{done();reject(Error('Unable to prepare image.'));};reader.onabort=()=>{done();reject(new DOMException('Cancelled','AbortError'));};
          job.signal.addEventListener('abort',stop,{once:true});reader.readAsDataURL(clean);
        }));
        const url=URL.createObjectURL(clean);urls.add(url);return url;
      } finally {bitmap.close();}
    } finally {clearTimeout(timer);signal.removeEventListener('abort',abort);}
  }
  return {load,dispose,signal};
}
