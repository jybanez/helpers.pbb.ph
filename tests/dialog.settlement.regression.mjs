import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { startStaticServer } from './_support/static-server.mjs';
const browser=['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(p=>fs.existsSync(p));
if(!browser)throw Error('Chrome or Edge required');
const server=await startStaticServer({rootDir:fileURLToPath(new URL('../',import.meta.url)),port:0});
try{
 for(const mode of ['', '?bundle']){
  const {stdout}=await promisify(execFile)(browser,['--headless=new','--disable-gpu','--virtual-time-budget=15000','--dump-dom',server.origin+'/tests/dialog.settlement.regression.html'+mode],{timeout:120000,maxBuffer:4000000});
  if(!stdout.includes('data-status="pass"'))throw Error(stdout);
  console.log('Dialog settlement passed: '+(mode||'source'));
 }
}finally{await server.close()}
