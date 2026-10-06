import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {startStaticServer} from './_support/static-server.mjs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE?pathToFileURL(process.env.PLAYWRIGHT_MODULE).href:'playwright');
const server=await startStaticServer({rootDir:process.cwd(),port:0});
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
 for(const bundle of [false,true]) {
  const page=await browser.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(server.origin+'/tests/incident.chrome.regression.html'+(bundle?'?bundle':''));
  await page.waitForFunction(()=>document.body.dataset.status!=='pending');
  assert.equal(await page.locator('#results').innerText(),'PASS');assert.deepEqual(errors,[]);
  await page.close();console.log(`Incident chrome defaults/nesting/update/validation/busy passed: ${bundle?'bundle':'source'}`);
 }
} finally {await browser.close();await server.close();}
