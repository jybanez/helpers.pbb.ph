import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import fs from 'node:fs/promises';
import {startStaticServer} from './_support/static-server.mjs';
const {chromium}=await import(pathToFileURL('C:/wamp64/www/bimoperks/node_modules/playwright/index.mjs'));
const a=await startStaticServer({rootDir:process.cwd(),host:'127.0.0.1',port:0});
const b=await startStaticServer({rootDir:process.cwd(),host:'127.0.0.1',port:0});
const browser=await chromium.launch({channel:'msedge',headless:true});
const intro='Please address the following issues before continuing:';
const items=['Voucher title — required','Expiry — choose a date after Starts','<img src=x onerror=alert(1)> — literal text'];
const results=[];await fs.mkdir('output/playwright/dialog-list',{recursive:true});
try{for(const bundled of [false,true])for(const width of [390,1440])for(const delegated of [false,true]){
 const page=await browser.newPage({viewport:{width,height:900}});page.setDefaultTimeout(15000);
 await page.goto(a.origin+'/tests/dialog.list.regression.html?'+(bundled?'bundled&':'')+(delegated?'host&childOrigin='+encodeURIComponent(b.origin):''));await page.waitForFunction(()=>window.ready);
 let caller=page;
 if(delegated){await page.evaluate(url=>{const f=document.createElement('iframe');f.src=url;f.style.width='100%';f.style.height='650px';document.body.append(f);},b.origin+'/tests/dialog.list.regression.html?'+(bundled?'bundled':''));caller=await page.waitForEvent('framenavigated',{predicate:f=>f.url().startsWith(b.origin)});await caller.waitForFunction(()=>window.ready);}
 await caller.locator('#launch').focus();
 await caller.evaluate(({intro,items,delegated})=>{window.done=false;showAlert(intro,{title:'Check your entries',variant:'error',draggable:true,items:[...items,'',null,{}],...(delegated?{renderTarget:'parent',workspaceBridge:true}:{renderTarget:'local',workspaceBridge:false})}).then(()=>done=true);},{intro,items,delegated});
 await page.getByRole('button',{name:'OK',exact:true}).waitFor();
 assert.deepEqual(await page.locator('.ui-dialog-list li').allTextContents(),items);
 assert.equal(await page.locator('.ui-dialog-message').textContent(),intro);
 assert.equal(await page.locator('.ui-dialog-list img').count(),0);
 assert.equal(await page.locator('.ui-dialog-body--compact').count(),0);
 assert.equal(await page.locator('.ui-dialog-list').evaluate(e=>e.scrollWidth<=e.clientWidth),true);
 if(delegated)assert.equal(await caller.locator('.ui-modal-root').count(),0);
 await page.waitForTimeout(400);await page.screenshot({path:`output/playwright/dialog-list/${bundled?'bundle':'source'}-${width}-${delegated?'bridge':'local'}.png`,fullPage:true});
 await page.getByRole('button',{name:'OK',exact:true}).click();await caller.waitForFunction(()=>done);await page.locator('.ui-modal-root').waitFor({state:'detached'});
 if(!delegated)assert.equal(await caller.locator('#launch').evaluate(e=>document.activeElement===e),true);
 await caller.evaluate(()=>{window.done=false;showAlert('Plain message',{description:'Existing description',items:[],renderTarget:'local',workspaceBridge:false}).then(()=>done=true);});
 await caller.getByRole('button',{name:'OK',exact:true}).waitFor();assert.equal(await caller.locator('.ui-dialog-list').count(),0);assert.equal(await caller.locator('.ui-dialog-description').textContent(),'Existing description');await caller.getByRole('button',{name:'OK',exact:true}).click();await caller.waitForFunction(()=>done);
 results.push({bundled,width,delegated,pass:true});console.log('PASS dialog list',bundled,width,delegated);await page.close();
}await fs.writeFile('output/playwright/dialog-list/results.json',JSON.stringify(results,null,2)+'\n');}finally{await browser.close();await Promise.all([a.close(),b.close()]);}
