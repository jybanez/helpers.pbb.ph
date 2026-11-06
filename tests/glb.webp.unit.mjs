import assert from 'node:assert/strict';
import {webpDimensions,validateWebpTextures} from '../js/ui/ui.glb.webp.js';
import {prepareGlb,validateGlb} from '../js/ui/ui.glb.data.js';
import {glb} from './glb.data.regression.mjs';
function riff(type,payload){const b=Buffer.alloc(20+payload.length+(payload.length%2));b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WEBP',8);b.write(type,12);b.writeUInt32LE(payload.length,16);Buffer.from(payload).copy(b,20);return b;}
const lossy=riff('VP8 ',[0,0,0,0x9d,1,0x2a,2,0,3,0]);
const lossless=riff('VP8L',[0x2f,1,0x80,0,0]);
assert.deepEqual(webpDimensions(lossy),{width:2,height:3});
assert.deepEqual(webpDimensions(lossless),{width:2,height:3});
const extended=Buffer.concat([riff('VP8X',[0,0,0,0,1,0,0,2,0,0]),lossy.subarray(12)]);extended.writeUInt32LE(extended.length-8,4);
assert.deepEqual(webpDimensions(extended),{width:2,height:3});
for(const mutate of [b=>b.write('NOPE',0),b=>b.writeUInt32LE(999,4),b=>b.writeUInt32LE(999,16),b=>b[23]=0,b=>b.writeUInt16LE(4097,26)]){const b=Buffer.from(lossy);mutate(b);assert.throws(()=>webpDimensions(b),/WebP/);}
for(const mutate of [b=>b[20]=2,b=>b[24]=9,b=>b[21]=1]){const b=Buffer.from(extended);mutate(b);assert.throws(()=>webpDimensions(b),/WebP/);}
assert.throws(()=>webpDimensions(riff('ANIM',[0,0])),/animation/);
assert.throws(()=>webpDimensions(riff('VP8L',[0x2f,0,0,0,0xe0])),/VP8L/);
const json={asset:{version:'2.0'},extensionsUsed:['EXT_texture_webp'],extensionsRequired:['EXT_texture_webp'],buffers:[{byteLength:lossy.length}],bufferViews:[{buffer:0,byteLength:lossy.length}],images:[{bufferView:0,mimeType:'image/webp'}],textures:[{extensions:{EXT_texture_webp:{source:0}}}]};
assert.deepEqual(prepareGlb(glb(json,lossy)).skippedExtensions,[]);
const fallback=structuredClone(json);fallback.extensionsRequired=[];fallback.textures[0].source=0;validateGlb(glb(fallback,lossy));
for(const mutate of [j=>j.textures[0].extensions.EXT_texture_webp.source=-1,j=>j.textures[0].extensions.EXT_texture_webp.source=2,j=>j.images[0].mimeType='image/png',j=>j.images[0].bufferView=3,j=>j.extensionsUsed=[],j=>j.extensionsRequired=[],j=>j.images[0].uri='https://example.test/texture.webp']){const j=structuredClone(json);mutate(j);assert.throws(()=>validateGlb(glb(j,lossy)),/WebP|URI resources/);}
const large=Buffer.from(lossy);large.writeUInt16LE(4096,26);large.writeUInt16LE(4096,28);
assert.throws(()=>validateGlb(glb(json,large)),/128 MiB/);
console.log('WebP RIFF, VP8/VP8L/VP8X dimensions, malformed payloads, extension references and decoded budget passed.');
