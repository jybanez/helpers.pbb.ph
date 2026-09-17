import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import jsQR from './vendor/h4/jsQR.cjs';
import {execFileSync} from 'node:child_process';
const {chromium} = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.join(root,'output/playwright/h4');await fs.mkdir(out,{recursive:true});
const acceptedLoader=execFileSync('git',['show','0c36e28755505afb022b2ffd1adea61c571c77fa:js/ui/ui.loader.js'],{cwd:root,encoding:'utf8'});
console.log('H4: launching Edge');
const browser=await chromium.launch({channel:'msedge',headless:true,timeout:20000});
const report={browser:browser.version(),scope:'Synthetic fixtures; desktop Edge with emulated viewport widths, not real mobile/AT or Bimo voucher acceptance',cases:[]};
const decode = ({data,width,height},expected)=>{
 const result=jsQR(Uint8ClampedArray.from(typeof data==='string'?Buffer.from(data,'base64'):data),width,height);
 assert.ok(result,'independent decoder finds QR');assert.equal(result.data,expected);
};
try {
 for (const delivery of ['module','bundle']) for (const width of [320,360,1024]) {
  console.log(`H4: ${delivery} ${width}`);
  const page=await browser.newPage({viewport:{width,height:768},acceptDownloads:true});
  const requests=[];const pageErrors=[];page.on('pageerror',e=>pageErrors.push(e.message));
  await page.route('**/*',async route=>{
   const u=new URL(route.request().url());requests.push(u.href);
   if(u.origin==='https://asset.test')return route.fulfill({contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64')});
   if(u.origin!=='https://h4.test')throw new Error('Unexpected runtime network request');
   if(u.pathname==='/js/ui/ui.loader.js')return route.fulfill({contentType:'text/javascript',body:acceptedLoader});
   if(u.pathname==='/')return route.fulfill({contentType:'text/html',body:`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><button id="download">Save prepared PNG</button><main></main><script type="module">
import * as h4 from '${delivery==='bundle'?'/dist/helpers.h4.min.js':'/js/media/qr-png.js'}';
import {createUiLoader,DEFAULT_COMPONENT_REGISTRY} from '/js/ui/ui.loader.js';
window.h4=h4;window.loader=createUiLoader({...DEFAULT_COMPONENT_REGISTRY,...h4.H4_COMPONENT_REGISTRY},{preferBundles:true});
window.pixels=c=>{const data=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let binary='';for(let i=0;i<data.length;i+=8192)binary+=String.fromCharCode(...data.subarray(i,i+8192));return {data:btoa(binary),width:c.width,height:c.height};};
window.exporter=h4.createCanvasPngExporter();
document.querySelector('#download').onclick=()=>{window.downloadResult=exporter.download(window.png,{filename:'../CON:<secret>?.png'});};
window.ready=true;</script>`});
   const target=path.resolve(root,'.'+decodeURIComponent(u.pathname));assert.ok(target.startsWith(root+path.sep));
   try{return route.fulfill({body:await fs.readFile(target),contentType:target.endsWith('.html')?'text/html':target.endsWith('.css')?'text/css':'text/javascript'});}catch{return route.fulfill({status:404,body:''});}
  });
  await page.goto('https://h4.test/');
  try { await page.waitForFunction(()=>window.ready,{},{timeout:10000}); }
  catch(error) { throw new Error(`Fixture failed: ${pageErrors.join('; ')}; ${error.message}`); }
  assert.equal(await page.evaluate(async()=>await loader.get('media.qr')===h4.createQr && await loader.get('media.png')===h4.createCanvasPngExporter),true);
  const networkBaseline=requests.length;
  const checks=[];
  const payloads=['BP:CLAIM:SYNTHETIC-1234','BP:CLAIM:Ñ café 日本語 😀'];
  if(width===320)payloads.push('A'.repeat(2048));
  for(const payload of payloads) {
   console.log(`H4: decoding ${payload.length} synthetic characters`);
   const rendered=await page.evaluate(text=>{
    window.qr?.destroy();window.qr=h4.createQr({text,scale:4,parent:document.querySelector('main')});
    return pixels(qr.canvas);
   },payload);decode(rendered,payload);
  }
  checks.push(width===320?'ASCII/UTF-8/2048-byte maximum decode equality':'ASCII/UTF-8 decode equality');
  const payload='BP:CLAIM:SYNTHETIC-COMPOSED';
  const composed=await page.evaluate(async text=>{
   qr.update({text});window.composed=document.createElement('canvas');composed.width=600;composed.height=500;
   const ctx=composed.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,600,500);ctx.fillStyle='#000';ctx.font='24px sans-serif';ctx.fillText('Synthetic voucher — QA only',20,32);ctx.drawImage(qr.canvas,40,70);
   window.png=await exporter.export(composed);const bitmap=await createImageBitmap(png);const verify=document.createElement('canvas');verify.width=bitmap.width;verify.height=bitmap.height;verify.getContext('2d').drawImage(bitmap,0,0);bitmap.close();
   return pixels(verify);
  },payload);decode(composed,payload);checks.push('composed PNG Blob decode equality');console.log('H4: composed Blob decoded');
  const downloadWait=page.waitForEvent('download');await page.locator('#download').click();const download=await downloadWait;
  const saved=path.join(out,`${delivery}-${width}.png`);await download.saveAs(saved);assert.equal(await download.failure(),null);
  const bytes=await fs.readFile(saved);assert.equal(bytes.subarray(1,4).toString(),'PNG');
  const savedDecoded=await page.evaluate(async base64=>{
   const blob=new Blob([Uint8Array.from(atob(base64),x=>x.charCodeAt(0))],{type:'image/png'});const image=await createImageBitmap(blob);const c=document.createElement('canvas');c.width=image.width;c.height=image.height;c.getContext('2d').drawImage(image,0,0);image.close();return pixels(c);
  },bytes.toString('base64'));decode(savedDecoded,payload);
  assert.ok(!/[\\/:<>?]/.test(download.suggestedFilename()));checks.push('user-click initiated and actual saved PNG independently decoded; filename sanitized');console.log('H4: saved PNG decoded');
  const codes=await page.evaluate(async()=>{
   const out=[];const sync=fn=>{try{fn();out.push('NO_ERROR');}catch(e){out.push(e.code);}};
   for(const patch of [{text:''},{text:'\uD800'},{text:'A'.repeat(2049)},{text:'😀'.repeat(513)},{text:'A',scale:1.5},{text:'A',quietZone:3},{text:'A'.repeat(40),maxVersion:1}]){sync(()=>qr.update(patch));if(qr.canvas.width!==0)throw Error('Stale pixels after invalid update');}
   qr.update({text:'BP:CLAIM:UPDATED',scale:1,quietZone:4,maxVersion:40});
   const ctx=qr.canvas.getContext('2d'),p=ctx.getImageData(0,0,4,4).data;if(!p.every(x=>x===255))throw Error('Quiet zone');
   qr.update({scale:2,quietZone:8});
   const s=qr.getState();if(s.dimension!==(s.modules+16)*2)throw Error('Integer modules');
   qr.destroy();qr.destroy();sync(()=>qr.update({text:'Later'}));
   const reject=async fn=>{try{await fn();out.push('NO_ERROR');}catch(e){out.push(e.code);}};
   await reject(()=>exporter.export(null));
   await reject(()=>exporter.export({width:1,height:1,toBlob:cb=>cb(null)}));
   await reject(()=>exporter.export({width:1,height:1,toBlob:()=>{throw Error('Failure');}}));
   const appCanvas=document.createElement('canvas');appCanvas.width=2;appCanvas.height=2;
   let release;const first=exporter.export({width:1,height:1,toBlob:cb=>release=cb}).catch(e=>e.code);
   await exporter.export(appCanvas);out.push(await first);release(new Blob(['late'],{type:'image/png'}));
   let late;const pending=exporter.export({width:1,height:1,toBlob:cb=>late=cb}).catch(e=>e.code);exporter.destroy();out.push(await pending);late(null);
   await reject(()=>exporter.export(appCanvas));
   if(appCanvas.width!==2||appCanvas.height!==2)throw Error('App canvas mutated');
   return out;
  });
  assert.deepEqual(codes,['INPUT','INPUT','CAPACITY','CAPACITY','DIMENSION','DIMENSION','CAPACITY','DISPOSED','CANVAS','EXPORT','EXPORT','STALE','DISPOSED','DISPOSED']);checks.push('invalid input/capacity/dimensions/null/failure/update/dispose/stale results; app canvas preserved');
  assert.equal(requests.length,networkBaseline,'QR/export caused no network requests');
  const cleanup=await page.evaluate(async()=>{
   const oldCreate=URL.createObjectURL,oldRevoke=URL.revokeObjectURL;window.created=[];window.revoked=[];
   URL.createObjectURL=function(...args){const url=oldCreate.apply(this,args);created.push(url);return url;};URL.revokeObjectURL=function(url){revoked.push(url);return oldRevoke.call(this,url);};
   window.exporter=h4.createCanvasPngExporter();return true;
  });assert.ok(cleanup);
  const another=page.waitForEvent('download');await page.locator('#download').click();const second=await another;await second.saveAs(path.join(out,`${delivery}-${width}-repeat.png`));
  assert.equal(await page.evaluate(()=>{exporter.cancel();exporter.destroy();return created.length===1&&revoked.length===1&&!document.querySelector('a[download]');}),true);checks.push('re-download saved; object URL and temporary anchor cleanup');
  const taint=await page.evaluate(async()=>{
   const image=new Image();image.src='https://asset.test/pixel.png';await image.decode();const c=document.createElement('canvas');c.width=c.height=1;c.getContext('2d').drawImage(image,0,0);const e=h4.createCanvasPngExporter();try{await e.export(c);return 'NO_ERROR';}catch(err){return err.code;}finally{e.destroy();}
  });assert.equal(taint,'TAINTED');checks.push('actual cross-origin tainted Canvas rejected');
  if(delivery==='bundle') {
   await page.goto('https://h4.test/demos/demo.h4.html');await page.locator('#generate').click();await page.waitForFunction(()=>!document.querySelector('#save').disabled,{},{timeout:10000});
   await page.screenshot({path:path.join(out,`demo-${width}.png`),fullPage:true});checks.push('demo generated and screenshot captured');
  }
  assert.deepEqual(pageErrors,[]);report.cases.push({delivery,width,checks,savedBytes:bytes.length});await page.close();
 }
 await fs.writeFile(path.join(out,'results.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}catch(error){console.error(error);throw error;}finally{await browser.close();}
