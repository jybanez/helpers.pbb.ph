// Use real frames: dump-dom virtual time can finish before resize/navigation frames.
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
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
 const cspSmoke=process.env.GLB_DRACO_CSP==='1',fixtures={};
 const workerPath='/vendor/three/draco-r187/worker.js';
 if(cspSmoke){
  const body=fs.readFileSync('tests/glb.draco.csp.html','utf8'),hash=createHash('sha256').update(body.match(/<script type="module">([\s\S]*?)<\/script>/)[1]).digest('base64');
  fixtures['/tests/glb.draco.csp.html']={body,headers:{'content-type':'text/html','content-security-policy':`default-src 'self'; script-src 'self' 'sha256-${hash}' 'wasm-unsafe-eval'; worker-src 'self'; connect-src 'self' blob:; img-src 'self' blob:; style-src 'self' 'unsafe-inline'`}};
  fixtures[workerPath]={body:fs.readFileSync('vendor/three/draco-r187/worker.js'),headers:{'content-type':'text/javascript'}};
  fixtures['/vendor/three/draco-r187/draco_decoder.wasm']={body:fs.readFileSync('vendor/three/draco-r187/draco_decoder.wasm'),headers:{'content-type':'application/wasm'}};
 }
 server=await startStaticServer({rootDir:root,port:0,fixtures});
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
 const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++serial;const timer=setTimeout(()=>{pending.delete(id);reject(Error(`Timed out: ${method}`));},15000);pending.set(id,{resolve,reject,timer});socket.send(JSON.stringify({id,method,params}));});
 for(const fixture of [cspSmoke?'glb.draco.csp.html':'glb.draco.regression.html']) for(const suffix of cspSmoke?['','?deny']:['', '?bundle', '?mobile', '?bundle&mobile']) {
  if(cspSmoke)fixtures[workerPath].headers['content-security-policy']=`default-src 'none'; script-src 'self' ${suffix.includes('deny')?'':"'wasm-unsafe-eval'"}; connect-src 'self'`;
  await send('Emulation.setDeviceMetricsOverride',{width:suffix.includes('mobile')?375:1200,height:800,deviceScaleFactor:1,mobile:false});
  await send('Emulation.setCPUThrottlingRate',{rate:suffix.includes('mobile')?4:1});
  await send('Page.navigate',{url:`${server.origin}/tests/${fixture}${suffix}`});
  let state;
  for(let i=0;i<3000;i++) {
   await wait(100);
   const result=await send('Runtime.evaluate',{expression:'({status:document.body?.dataset.status,results:document.querySelector("#results")?.textContent})',returnByValue:true});
   state=result.result.value;
   if(['pass','fail','failed'].includes(state?.status))break;
  }
  if(state?.status!=='pass')throw Error(JSON.stringify(state));
  const shot=await send('Page.captureScreenshot',{format:'png'});fs.mkdirSync(path.join(root,'output/glb-viewer'),{recursive:true});fs.writeFileSync(path.join(root,`output/glb-viewer/${suffix.includes('bundle')?'bundle':'source'}-${suffix.includes('mobile')?'mobile':'desktop'}.png`),Buffer.from(shot.data,'base64'));
  fs.writeFileSync(path.join(root,cspSmoke?`output/draco-csp-${suffix.includes('deny')?'denied':'allowed'}.json`:`output/draco-${suffix.includes('bundle')?'bundle':'source'}-${suffix.includes('mobile')?'cpu4':'desktop'}.json`),state.results);
  console.log(`${fixture} passed (${suffix||'source'}).`);
 }
} finally {
 // Graceful browser shutdown releases Windows profile locks before cleanup.
 if(socket?.readyState === WebSocket.OPEN) await new Promise(resolve=>{
  const timer=setTimeout(resolve,15000);
  socket.addEventListener('close',()=>{clearTimeout(timer);resolve()},{once:true});
  socket.send(JSON.stringify({id:999999,method:'Browser.close'}));
 });
 for(let i=0;processHandle && processHandle.exitCode === null && i<150;i++) await wait(100);
 socket?.close();if(processHandle?.exitCode === null) processHandle.kill();await server?.close();
 await wait(500);
 // Exact temporary directory created above; no user browser profile is touched.
 if(path.dirname(path.resolve(profile)) !== path.resolve(os.tmpdir()) || !path.basename(profile).startsWith('helper-glb-viewer-'))throw Error('Unexpected temporary profile path');
 await fs.promises.rm(profile,{recursive:true,force:true,maxRetries:20,retryDelay:500});
}
