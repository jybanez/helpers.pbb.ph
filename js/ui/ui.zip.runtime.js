// Lazy local ZIP directory parser. No entry is inflated until extract is called.
export const ZIP_LIMITS=Object.freeze({archive:64*1024*1024,metadata:4*1024*1024,entries:2000,path:1024,entry:64*1024*1024,total:256*1024*1024});
const error=message=>{throw Error(`${message} Use a standard stored/deflated ZIP within the preview limits.`);};
const aborted=signal=>{if(signal?.aborted)throw new DOMException('Cancelled','AbortError');};
const crcTable=Uint32Array.from({length:256},(_,n)=>{for(let j=0;j<8;j++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
const crcStep=(crc,bytes)=>{for(const byte of bytes)crc=crcTable[(crc^byte)&255]^(crc>>>8);return crc;};
export function openZip(input) {
 if(!(input instanceof ArrayBuffer)||input.byteLength>ZIP_LIMITS.archive||input.byteLength<22)error('Invalid or oversized ZIP.');
 let bytes=new Uint8Array(input.slice(0)), view=new DataView(bytes.buffer), disposed=false;
 const range=(offset,size,end=bytes.length)=>{if(!Number.isSafeInteger(offset)||!Number.isSafeInteger(size)||offset<0||size<0||offset+size>end)error('ZIP record range is invalid.');};
 const u16=p=>{range(p,2);return view.getUint16(p,true);},u32=p=>{range(p,4);return view.getUint32(p,true);};
 let end=-1;
 for(let p=bytes.length-22;p>=Math.max(0,bytes.length-65557);p--)if(u32(p)===0x06054b50&&p+22+u16(p+20)===bytes.length){end=p;break;}
 if(end<0)error('ZIP directory is missing or truncated.');
 const count=u16(end+10), centralSize=u32(end+12), central=u32(end+16);
 if(u16(end+4)||u16(end+6)||u16(end+8)!==count||count===65535||centralSize===0xffffffff||central===0xffffffff)error('Split and ZIP64 archives are unsupported.');
 if(count>ZIP_LIMITS.entries||centralSize>ZIP_LIMITS.metadata)error('ZIP directory exceeds preview limits.');
 range(central,centralSize,end);if(central+centralSize!==end)error('Unexpected data after the ZIP directory.');
 let metadata=centralSize+u16(end+20), total=0, cursor=central;
 const entries=[],names=new Map(),prefixes=new Map(),spans=[];
 const extra=(p,n)=>{range(p,n);const stop=p+n;while(p<stop){if(p+4>stop)error('Malformed ZIP extra field.');const id=u16(p),size=u16(p+2);p+=4;if(p+size>stop)error('Malformed ZIP extra field.');if([1,0x7075,0x9901].includes(id))error('ZIP64, alternate Unicode paths and encryption are unsupported.');p+=size;}};
 for(let id=0;id<count;id++) {
  range(cursor,46,end);if(u32(cursor)!==0x02014b50)error('Invalid ZIP directory record.');
  const flags=u16(cursor+8),method=u16(cursor+10),crc=u32(cursor+16),compressedSize=u32(cursor+20),size=u32(cursor+24),n=u16(cursor+28),x=u16(cursor+30),comment=u16(cursor+32),offset=u32(cursor+42);
  if(u16(cursor+6)>20||u16(cursor+34)||size===0xffffffff||compressedSize===0xffffffff||offset===0xffffffff)error('ZIP64 or unsupported entry version.');
  if(flags&~0x080e || (method!==8&&(flags&6)))error('Encrypted or unsupported ZIP flags.');
  if(![0,8].includes(method))error('Unsupported ZIP compression method.');
  if(!n||n>ZIP_LIMITS.path)error('Entry name exceeds preview limits.');
  range(cursor,46+n+x+comment,end);extra(cursor+46+n,x);
  const raw=bytes.subarray(cursor+46,cursor+46+n);
  if(!(flags&0x800)&&raw.some(b=>b>127))error('Non-ASCII legacy filenames are unsupported; export UTF-8 names.');
  let path;try{path=new TextDecoder('utf-8',{fatal:true}).decode(raw);}catch{error('Invalid UTF-8 entry name.');}
  if(path!==path.normalize('NFC')||/[\\:\x00-\x1f\x7f-\x9f\u202a-\u202e\u2066-\u2069]/u.test(path)||path.startsWith('/'))error('Unsafe or ambiguous entry name.');
  const directory=path.endsWith('/'),parts=(directory?path.slice(0,-1):path).split('/');
  if(parts.length>32||parts.some(p=>!p||p==='.'||p==='..'||/[. ]$/.test(p)||/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(p)))error('Unsafe entry path.');
  const key=parts.join('/').toLowerCase();if(names.has(key))error('Duplicate or ambiguous entry paths.');names.set(key,directory);
  for(let depth=1;depth<=parts.length;depth++){const prefix=parts.slice(0,depth).join('/'),folded=prefix.toLowerCase();if(prefixes.has(folded)&&prefixes.get(folded)!==prefix)error('Ambiguous folder casing.');prefixes.set(folded,prefix);}
  const unixType=(u32(cursor+38)>>>16)&0xf000;
  if(unixType&&unixType!==(directory?0x4000:0x8000))error('Links and special entries are unsupported.');
  if(size>ZIP_LIMITS.entry||(total+=size)>ZIP_LIMITS.total)error('Declared expanded bytes exceed preview limits.');
  if((method===0&&size!==compressedSize)||(directory&&(size||compressedSize)))error('Inconsistent entry size.');
  range(offset,30,central);if(u32(offset)!==0x04034b50||u16(offset+6)!==flags||u16(offset+8)!==method||u16(offset+4)>20)error('Local ZIP header disagrees with directory.');
  const ln=u16(offset+26),lx=u16(offset+28),start=offset+30+ln+lx;
  range(offset,30+ln+lx,central);if(ln!==n||!raw.every((b,i)=>b===bytes[offset+30+i]))error('Local entry name disagrees with directory.');
  extra(offset+30+ln,lx);metadata+=30+ln+lx;if(metadata>ZIP_LIMITS.metadata)error('ZIP metadata exceeds preview limits.');
  const localValues=[u32(offset+14),u32(offset+18),u32(offset+22)],expected=[crc,compressedSize,size];
  if(localValues.some((v,i)=>v!==expected[i]&&(!(flags&8)||v!==0)))error('Local sizes or checksum disagree with directory.');
  range(start,compressedSize,central);let stop=start+compressedSize;
  if(flags&8){if(u32(stop)===0x08074b50)stop+=4;range(stop,12,central);if(u32(stop)!==crc||u32(stop+4)!==compressedSize||u32(stop+8)!==size)error('ZIP data descriptor disagrees with directory.');stop+=12;}
  spans.push([offset,stop]);entries.push({id:String(id),path,name:parts.at(-1),size,compressedSize,directory,method,crc,start});cursor+=46+n+x+comment;
 }
 if(cursor!==end)error('ZIP entry count disagrees with directory.');
 spans.sort((a,b)=>a[0]-b[0]);let next=0;for(const [start,stop] of spans){if(start!==next)error('Overlapping entries or unsupported extra archive data.');next=stop;}if(next!==central)error('Unaccounted archive data.');
 for(const [key] of names){const parts=key.split('/');while(parts.length>1){parts.pop();if(names.get(parts.join('/'))===false)error('File and folder paths conflict.');}}
 const describe=e=>({id:e.id,path:e.path,name:e.name,size:e.size,compressedSize:e.compressedSize,directory:e.directory});
 return {
  entries:entries.map(describe),
  dispose(){disposed=true;bytes=null;view=null;},
  async extract(id,{signal}={}) {
   aborted(signal);if(disposed)error('Archive is closed.');const entry=entries.find(e=>e.id===String(id));if(!entry||entry.directory)error('Select a file entry.');
   // Blob snapshots selected compressed bytes. Closing the archive can release its buffer.
   let stream=new Blob([bytes.subarray(entry.start,entry.start+entry.compressedSize)]).stream();
   if(entry.method===8){try{stream=stream.pipeThrough(new DecompressionStream('deflate-raw'));}catch{error('This browser cannot decode deflated ZIP entries.');}}
   const reader=stream.getReader(),chunks=[];let size=0,crc=0xffffffff;
   const cancel=()=>void reader.cancel().catch(()=>{});signal?.addEventListener('abort',cancel,{once:true});
   try {
    while(true){aborted(signal);if(disposed)throw new DOMException('Closed','AbortError');const result=await reader.read();aborted(signal);if(disposed)throw new DOMException('Closed','AbortError');if(result.done)break;
     size+=result.value.byteLength;if(size>entry.size||size>ZIP_LIMITS.entry)error('Actual expanded entry exceeds its declared size or preview limit.');
     crc=crcStep(crc,result.value);chunks.push(result.value);
    }
    if(size!==entry.size||((crc^0xffffffff)>>>0)!==entry.crc)error('Entry failed size or CRC integrity verification.');
    return new Blob(chunks,{type:'application/octet-stream'});
   } finally {signal?.removeEventListener('abort',cancel);await reader.cancel().catch(()=>{});reader.releaseLock();}
  }
 };
}
