import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {startStaticServer} from './_support/static-server.mjs';
const {chromium}=await import(pathToFileURL('C:/wamp64/www/bimoperks/node_modules/playwright/index.mjs'));
const server=await startStaticServer({rootDir:process.cwd(),host:'127.0.0.1',port:0});
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
  for(const bundled of [false,true]) {
    const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(server.origin+'/tests/modal.ids.regression.html'+(bundled?'?bundled':''));
    await page.waitForFunction(()=>window.ready);
    for(const name of ['Create Voucher','Voucher design preview','Independent module preview'])
      assert.equal(await page.getByRole('dialog',{name,exact:true}).count(),1,name);
    const ids=await page.locator('[role="dialog"]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('aria-labelledby')));
    assert.equal(new Set(ids).size,3);
    for(const id of ids) assert.equal(await page.locator(`[id="${id}"]`).count(),1);
    await page.evaluate(()=>{third.destroy();preview.destroy();});
    assert.equal(await page.getByRole('dialog',{name:'Create Voucher',exact:true}).count(),1);
    assert.equal(await page.locator('[name="title"]').inputValue(),'Keep me');
    await page.evaluate(()=>form.destroy());assert.equal(await page.locator('[role="dialog"]').count(),0);
    assert.deepEqual(errors,[]);console.log('PASS unique nested dialog names',bundled?'bundle + module':'multiple module URLs');await page.close();
  }
} finally {await browser.close();await server.close();}
