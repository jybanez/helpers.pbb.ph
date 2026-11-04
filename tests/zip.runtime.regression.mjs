import assert from 'node:assert/strict';
import fs from 'node:fs';
import {openZip} from '../js/ui/ui.zip.runtime.js';
const read=name=>{const b=fs.readFileSync(new URL(`./fixtures/${name}`,import.meta.url));return b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength);};
const zip=openZip(read('preview.zip'));assert.equal(zip.entries.length,3);
assert.equal(await (await zip.extract('2')).text(),'Synthetic archive preview.\n');
const glb=await zip.extract('1');assert.equal(new DataView(await glb.arrayBuffer()).getUint32(0,true),0x46546c67);
for(const name of ['zip-traversal.zip','zip-duplicate.zip','zip-range.zip'])assert.throws(()=>openZip(read(name)),/ZIP|path/i);
await assert.rejects(openZip(read('zip-expansion.zip')).extract('0'),/expanded/);
await assert.rejects(openZip(read('zip-crc.zip')).extract('0'),/CRC/);
assert.equal(await (await openZip(read('zip-descriptor.zip')).extract('0')).text(),'Data descriptor');
const cancelled=new AbortController();cancelled.abort();await assert.rejects(zip.extract('1',{signal:cancelled.signal}),{name:'AbortError'});
const during=new AbortController(),work=zip.extract('1',{signal:during.signal});during.abort();await assert.rejects(work,{name:'AbortError'});
for(const [offset,value,width] of [[10,2001,2],[12,4194305,4]]){const b=read('preview.zip');const v=new DataView(b);const end=b.byteLength-22;width===2?v.setUint16(end+offset,value,true):v.setUint32(end+offset,value,true);assert.throws(()=>openZip(b));}
const huge=read('preview.zip'),hv=new DataView(huge),hb=new Uint8Array(huge);let central=0;for(let i=0;i<hb.length-4;i++)if(hv.getUint32(i,true)===0x02014b50){central=i;break;}hv.setUint32(central+24,67108865,true);assert.throws(()=>openZip(huge),/expanded/);
zip.dispose();await assert.rejects(zip.extract('1'),/closed/);
for(const change of [b=>new DataView(b).setUint16(6,1,true),b=>new DataView(b).setUint16(8,99,true),b=>new DataView(b).setUint32(18,0xfffffffe,true)]){const b=read('preview.zip');change(b);assert.throws(()=>openZip(b));}
console.log('ZIP runtime: stored/deflated/descriptor, nested GLB, traversal/duplicates/ranges, actual expansion, CRC and cancellation passed.');
