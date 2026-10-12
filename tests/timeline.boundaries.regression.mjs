// Use real frames: dump-dom virtual time can finish before resize/navigation frames.
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {startStaticServer} from './_support/static-server.mjs';
const chrome=['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(p=>fs.existsSync(p));
if(!chrome)throw Error('Chrome or Edge required');
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'helper-timeline-boundaries-'));
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
let processHandle, server, socket;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
try {
 server=await startStaticServer({rootDir:root,port:0});
 processHandle=spawn(chrome,['--headless=new','--disable-gpu','--no-first-run','--force-prefers-reduced-motion',`--user-data-dir=${profile}`,'--remote-debugging-port=0','about:blank'],{windowsHide:true,stdio:'ignore'});
 const portFile=path.join(profile,'DevToolsActivePort');
 for(let i=0;!fs.existsSync(portFile)&&i<100;i++)await wait(100);
 const port=fs.readFileSync(portFile,'utf8').split('\n')[0];
 const targets=await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
 socket=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});});
 let serial=0;const pending=new Map();
 socket.addEventListener('message',e=>{const msg=JSON.parse(e.data);if(pending.has(msg.id)){const {resolve,reject,timer}=pending.get(msg.id);clearTimeout(timer);pending.delete(msg.id);msg.error?reject(Error(msg.error.message)):resolve(msg.result);}});
 const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++serial;const timer=setTimeout(()=>{pending.delete(id);reject(Error(`Timed out: ${method}`));},15000);pending.set(id,{resolve,reject,timer});socket.send(JSON.stringify({id,method,params}));});
 for(const fixture of ['timeline.boundaries.regression.html','timeline.virtualization.regression.html','timeline.layout.regression.html']) for(const suffix of ['', '?bundle']) {
  await send('Page.navigate',{url:`${server.origin}/tests/${fixture}${suffix}`});
  let state;
  for(let i=0;i<200;i++) {
   await wait(100);
   const result=await send('Runtime.evaluate',{expression:'({status:document.body?.dataset.status,results:document.querySelector("#results")?.textContent})',returnByValue:true});
   state=result.result.value;
   if(['pass','fail','failed'].includes(state?.status))break;
  }
  if(state?.status!=='pass')throw Error(JSON.stringify(state));
  console.log(`${fixture} passed (${suffix||'source'}).`);
 }
} finally {
 socket?.close();processHandle?.kill();await server?.close();
 await wait(500);
 // Exact temporary directory created above; no user browser profile is touched.
 if(path.dirname(path.resolve(profile)) !== path.resolve(os.tmpdir()) || !path.basename(profile).startsWith('helper-timeline-boundaries-'))throw Error('Unexpected temporary profile path');
 fs.rmSync(profile,{recursive:true,force:true,maxRetries:5,retryDelay:200});
}
