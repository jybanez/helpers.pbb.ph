import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {startStaticServer} from './_support/static-server.mjs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE?pathToFileURL(process.env.PLAYWRIGHT_MODULE).href:'playwright');
const server=await startStaticServer({rootDir:process.cwd(),port:0});
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
 for(const test of ['splitter.chrome','splitter.interaction','splitter.nested','splitter.theme']) for(const bundle of [false,true]) {
  if(['splitter.nested','splitter.theme'].includes(test)&&bundle) continue;
  const page=await browser.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(server.origin+`/tests/${test}.regression.html`+(bundle?'?bundle':''));
  await page.waitForFunction(()=>['pass','fail'].includes(document.body.dataset.status));
  assert.equal(await page.locator('body').getAttribute('data-status'),'pass',await page.locator('#results').innerText());
  assert.deepEqual(errors,[]);await page.close();console.log(`${test} ${bundle?'bundle':'source'} passed`);
 }
} finally {await browser.close();await server.close();}
