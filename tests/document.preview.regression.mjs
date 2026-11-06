// Use real frames: dump-dom virtual time can finish before resize/navigation frames.
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {startStaticServer} from './_support/static-server.mjs';
const chrome=['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(p=>fs.existsSync(p));
if(!chrome)throw Error('Chrome or Edge required');
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'helper-glb-viewer-'));
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
let processHandle, server, socket;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
try {
 let hits=0;const fixtures={'/forbidden':{get body(){hits++;return 'forbidden';}},'/probe-count':{get body(){return JSON.stringify({hits});},headers:{'content-type':'application/json'}}};server=await startStaticServer({rootDir:root,port:0,fixtures});
 processHandle=spawn(chrome,['--headless=new','--enable-unsafe-swiftshader','--no-first-run','--force-prefers-reduced-motion',`--user-data-dir=${profile}`,'--remote-debugging-port=0','about:blank'],{windowsHide:true,stdio:'ignore'});
 const portFile=path.join(profile,'DevToolsActivePort');
 let port;
 for(let i=0;i<100;i++) {
  try {port=fs.readFileSync(portFile,'utf8').split('\n')[0].trim();if(/^\d+$/.test(port))break;} catch(error) {if(!['ENOENT','EBUSY','EPERM'].includes(error.code))throw error;}
  await wait(100);
 }
 if(!/^\d+$/.test(port||''))throw Error('Chrome did not publish its debugging port');
 const targets=await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
 socket=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});});
 let serial=0;const pending=new Map();
 socket.addEventListener('message',e=>{const msg=JSON.parse(e.data);if(pending.has(msg.id)){const {resolve,reject,timer}=pending.get(msg.id);clearTimeout(timer);pending.delete(msg.id);msg.error?reject(Error(msg.error.message)):resolve(msg.result);}});
 const send=(method,params={},sessionId)=>new Promise((resolve,reject)=>{const id=++serial;const timer=setTimeout(()=>{pending.delete(id);reject(Error(`Timed out: ${method}`));},15000);pending.set(id,{resolve,reject,timer});socket.send(JSON.stringify({id,method,params,sessionId}));});
 for(const fixture of ['document.preview.regression.html']) for(const suffix of ['', '?bundle', '?mobile', '?bundle&mobile']) {
  await send('Emulation.setDeviceMetricsOverride',{width:suffix.includes('mobile')?375:1200,height:800,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url:`${server.origin}/tests/${fixture}${suffix}`});
  let state;
  for(let i=0;i<600;i++) {
   await wait(100);
   const result=await send('Runtime.evaluate',{expression:'({status:document.body?.dataset.status,results:document.querySelector("#results")?.textContent})',returnByValue:true});
   state=result.result.value;
   if(state?.status==='keyboard'){
    await send('Page.enable');
    const tree=await send('Page.getFrameTree');const child=tree.frameTree.childFrames?.[0]?.frame.id;
    let frameSession,contextId;
    if(child){contextId=(await send('Page.createIsolatedWorld',{frameId:child,worldName:'test-inspection'})).executionContextId;}
    else {const info=await send('Target.getTargets');const target=info.targetInfos.find(t=>t.type==='iframe');if(!target)throw Error('No opaque iframe target');frameSession=(await send('Target.attachToTarget',{targetId:target.targetId,flatten:true})).sessionId;}
    const decoded=await send('Runtime.evaluate',{contextId,expression:'({html:document.documentElement.outerHTML,images:[...document.images].map(i=>({complete:i.complete,width:i.naturalWidth,src:i.src}))})',returnByValue:true},frameSession);
    if(decoded.result.value?.images?.length!==1||decoded.result.value.images[0].width!==8)throw Error('Approved sandbox raster did not decode '+JSON.stringify(decoded));
    await send('Runtime.evaluate',{expression:'document.querySelector(".ui-html-document").focus()'});
    await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
    await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
    await wait(50);await send('Runtime.evaluate',{expression:'window.resumeKeyboard()'});
   }
   if(['pass','fail','failed'].includes(state?.status))break;
  }
  if(state?.status!=='pass')throw Error(JSON.stringify(state));
  const shot=await send('Page.captureScreenshot',{format:'png'});fs.mkdirSync(path.join(root,'output/glb-viewer'),{recursive:true});fs.writeFileSync(path.join(root,`output/glb-viewer/${suffix.includes('bundle')?'bundle':'source'}-${suffix.includes('mobile')?'mobile':'desktop'}.png`),Buffer.from(shot.data,'base64'));
  console.log(`${fixture} passed (${suffix||'source'}).`);
 }
} finally {
 // Graceful browser shutdown releases Windows profile locks before cleanup.
 if(socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({id:999999,method:'Browser.close'}));
 for(let i=0;processHandle && processHandle.exitCode === null && i<50;i++) await wait(100);
 socket?.close();if(processHandle?.exitCode === null) processHandle.kill();await server?.close();
 await wait(500);
 // Exact temporary directory created above; no user browser profile is touched.
 if(path.dirname(path.resolve(profile)) !== path.resolve(os.tmpdir()) || !path.basename(profile).startsWith('helper-glb-viewer-'))throw Error('Unexpected temporary profile path');
 fs.rmSync(profile,{recursive:true,force:true,maxRetries:10,retryDelay:300});
}
