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
  if(test==='splitter.interaction') for(const orientation of ['horizontal','vertical']) {
   await page.evaluate(orientation=>window.splitterFixture.update({orientation}),orientation);
   await page.keyboard.press('Tab');
   const divider=page.locator('#fixture > .ui-splitter > .ui-splitter-divider');
   assert.equal(await divider.evaluate(el=>document.activeElement===el&&el.matches(':focus-visible')),true,'keyboard focus is visible');
   assert.deepEqual(await divider.evaluate(el=>{const s=getComputedStyle(el);return [s.outlineStyle,s.outlineWidth];}),['solid','2px'],'retained focus outline');
   const before=await page.evaluate(()=>window.splitterFixture.getState().ratio);
   await page.keyboard.press(orientation==='horizontal'?'ArrowRight':'ArrowDown');
   assert.ok(await page.evaluate(()=>window.splitterFixture.getState().ratio)>before,'focused keyboard resize');
  }
  assert.deepEqual(errors,[]);await page.close();console.log(`${test} ${bundle?'bundle':'source'} passed`);
 }
} finally {await browser.close();await server.close();}
