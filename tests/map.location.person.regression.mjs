import { startStaticServer } from './_support/static-server.mjs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs';
const browser = ['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(fs.existsSync);
if(!browser)throw Error('No Chromium executable');
const run=promisify(execFile), server=await startStaticServer({rootDir:process.cwd(),port:0});
try {
 for(const page of ['map.location.person.regression.html','map.location.person.regression.html?bundle']) {
  const {stdout}=await run(browser,['--headless=new','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--virtual-time-budget=15000','--dump-dom',`${server.origin}/tests/${page}`],{timeout:60000,maxBuffer:2**22});
  if(!stdout.includes('data-status="pass"'))throw Error(stdout.match(/<pre id="results">([\s\S]*?)<\/pre>/)?.[1]||stdout);
  console.log(`3D location rendered regression passed (${page}).`);
 }
 // Real terrain workers need wall-clock scheduling rather than Chromium virtual time.
 const cli=async(command)=>run(process.env.ComSpec || 'cmd.exe',['/d','/s','/c',`npx --no-install @playwright/cli -s=location-person-regression ${command}`],{timeout:60000,maxBuffer:2**22});
 try {
  await cli(`open ${server.origin}/tests/map.location.person.engine.html`);
  for(const suffix of ['', '?bundle']) {
   await cli(`goto ${server.origin}/tests/map.location.person.engine.html${suffix}`);
   const {stdout}=await cli('run-code --filename tests/_support/map-location-person-engine-check.js');
   if(!stdout.includes('PASS'))throw Error(stdout);
   console.log(`Real-engine regression passed (${suffix || 'source'}).`);
  }
 } finally {await cli('close');}
} finally {await server.close();}
