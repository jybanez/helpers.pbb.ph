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
const vessel=fs.readFileSync('output/glb-budget-benchmark/vessel.glb');
if(vessel.length!==24091672||createHash('sha256').update(vessel).digest('hex')!=='bb1ac773041be0e869312444758cea4e5da989c4b6aadc6a27b64b3276caa4ef')throw Error('Expected authorized TWB vessel fixture; see benchmark report.');
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'helper-glb-budget-'));
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
let processHandle, server, socket;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
try {
 server=await startStaticServer({rootDir:root,port:0});
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
 const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++serial;const timer=setTimeout(()=>{pending.delete(id);reject(Error(`Timed out: ${method}`));},120000);pending.set(id,{resolve,reject,timer});socket.send(JSON.stringify({id,method,params}));});

 const results=[];const stats=async()=>({heap:await send('Runtime.getHeapUsage'),dom:await send('Memory.getDOMCounters')});
 const evaluate=async expression=>(await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true})).result;
 for(const mode of [{name:'desktop',width:1200,rate:1},{name:'cpu4-narrow',width:375,rate:4}]){
  await send('Emulation.setDeviceMetricsOverride',{width:mode.width,height:800,deviceScaleFactor:1,mobile:false});
  await send('Emulation.setCPUThrottlingRate',{rate:mode.rate});
  for(const test of [{name:'vessel',cap:128},{name:'vessel',cap:144},{name:'shared32',cap:128},{name:'distinct32',cap:128},{name:'distinct96-control',cap:144},{name:'texture2048',cap:128},{name:'vessel',cap:144,overlap:true}]){
   if(process.env.GLB_BENCH_OVERLAP_ONLY && !test.overlap)continue;
   await send('Page.navigate',{url:server.origin+'/tests/glb.budget.benchmark.html'});
   for(let i=0;i<100;i++){if((await evaluate('window.ready')).value)break;await wait(100);}
   await send('HeapProfiler.collectGarbage');const before=await stats();
   await evaluate('window.__result=null;window.__failure=null;runCase('+JSON.stringify(test)+').then(r=>window.__result=r).catch(e=>window.__failure=e.stack);void 0');
   let active,done;
   for(let i=0;i<1800;i++){
    await wait(100);const status=(await evaluate('({done:window.__result,error:window.__failure,checkpoint:window.__checkpoint})')).value;
    if(status?.error)throw Error(status.error);
    if(status?.checkpoint){await send('HeapProfiler.collectGarbage');active=await stats();await evaluate('window.__checkpoint=false');}
    if(status?.done){done=status.done;break;}
   }
   if(!done)throw Error('benchmark timeout');
   const rejects=(test.name==='vessel'&&test.cap===128)||test.name==='distinct96-control';
   if(Boolean(done.error)!==rejects)throw Error('Unexpected admission result: '+JSON.stringify(done));
   if(!rejects && (done.cycles.length!==3 || done.cycles.some(c=>c.closed.some(g=>g.buffers!==0||!g.lost))))throw Error('Cleanup regression');
   // Drop diagnostic references to detached canvases/contexts before cleanup sampling.
   await evaluate('window.__contexts=[];window.__models=[]');
   await send('HeapProfiler.collectGarbage');await wait(200);const after=await stats();
   results.push({mode,...done,before,active,after});fs.writeFileSync(process.env.GLB_BENCH_OVERLAP_ONLY?'output/glb-budget-benchmark/overlap-results.json':'output/glb-budget-benchmark/results.json',JSON.stringify({browser:await send('Browser.getVersion'),results},null,2));
   console.log(mode.name,test.name,test.cap,test.overlap?'overlap':'',done.error||'rendered');
  }
 }

} finally {
 // Graceful browser shutdown releases Windows profile locks before cleanup.
 if(socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({id:999999,method:'Browser.close'}));
 for(let i=0;processHandle && processHandle.exitCode === null && i<50;i++) await wait(100);
 socket?.close();if(processHandle?.exitCode === null) processHandle.kill();await server?.close();
 await wait(500);
 // Exact temporary directory created above; no user browser profile is touched.
 if(path.dirname(path.resolve(profile)) !== path.resolve(os.tmpdir()) || !path.basename(profile).startsWith('helper-glb-budget-'))throw Error('Unexpected temporary profile path');
 fs.rmSync(profile,{recursive:true,force:true,maxRetries:10,retryDelay:300});
}
