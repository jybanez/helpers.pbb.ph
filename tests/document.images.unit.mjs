import assert from 'node:assert/strict';
import {documentImageDimensions,readDocumentImageResponse,createDocumentImageScope,DOCUMENT_IMAGE_LIMITS} from '../js/ui/ui.document.images.js';
const png=new Uint8Array(33);png.set([137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82]);const v=new DataView(png.buffer);v.setUint32(16,16);v.setUint32(20,8);
assert.deepEqual(documentImageDimensions(png,'image/png'),{width:16,height:8});
assert.throws(()=>documentImageDimensions(new Uint8Array(4),'image/png'));
assert.throws(()=>documentImageDimensions(png,'image/svg+xml'));
const jpeg=new Uint8Array([255,216,255,192,0,8,8,0,8,0,16,0]);assert.deepEqual(documentImageDimensions(jpeg,'image/jpeg'),{width:16,height:8});
const good=await readDocumentImageResponse(new Response(png,{headers:{'content-type':'image/png'}}));assert.equal(good.size,33);
await assert.rejects(readDocumentImageResponse(new Response(png,{headers:{'content-type':'image/svg+xml'}})));
await assert.rejects(readDocumentImageResponse(new Response(png,{headers:{'content-type':'image/png','content-length':String(DOCUMENT_IMAGE_LIMITS.bytes+1)}})));
let cancelled=false;const stream=new ReadableStream({start(c){c.enqueue(new Uint8Array(DOCUMENT_IMAGE_LIMITS.bytes+1));},cancel(){cancelled=true;}});
await assert.rejects(readDocumentImageResponse(new Response(stream,{headers:{'content-type':'image/png'}})));assert(cancelled,'oversized stream cancelled');
const scope=createDocumentImageScope(()=>new Blob([png],{type:'image/png'}));v.setUint32(16,4097);await assert.rejects(scope.load('approved'),/pixel limit/);scope.dispose();
let received;const pending=createDocumentImageScope((ref,{signal})=>{received=signal;return new Promise(()=>{});});const result=pending.load('approved');await new Promise(r=>setTimeout(r,0));pending.dispose();await assert.rejects(result,/cancelled|timed out/i);assert(received.aborted,'pending host resolver cancelled');
const now=Date.now;let called=false;const expired=createDocumentImageScope(()=>{called=true;});Date.now=()=>now()+DOCUMENT_IMAGE_LIMITS.totalTime+1;try{await assert.rejects(expired.load('approved'),/deadline/);assert(!called);}finally{Date.now=now;expired.dispose();}
console.log('Document raster headers, MIME/stream size bounds, pixel bounds, resolver abort and total deadline passed.');
