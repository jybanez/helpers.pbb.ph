import assert from 'node:assert/strict';import {pathToFileURL} from 'node:url';import path from 'node:path';import fs from 'node:fs/promises';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE||'C:/wamp64/www/bimoperks/node_modules/playwright/index.mjs'));
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--allow-file-access-from-files']});const results=[];
try{for(const bundled of [false,true])for(const width of [390,1440])for(const field of ['Starts (business timezone)','Expires']){
 const page=await browser.newPage({viewport:{width,height:1000}});page.setDefaultTimeout(12000);
 await page.goto(pathToFileURL(path.resolve('tests/form.datepicker.regression.html')).href+'?minute'+(bundled?'&bundled':''));await page.waitForFunction(()=>window.ready);
 await page.evaluate(()=>{form.setValues({ends:'2024-03-10T12:30:22'});window.closes=[];form.update({onClose:info=>closes.push(info)});});
 const trigger=page.getByRole('button',{name:field,exact:true});await trigger.click();
 await page.getByRole('button',{name:'Tuesday, March 12, 2024',exact:true}).click();
 const before=await page.evaluate(()=>form.getValues());assert.equal(await page.locator('.ui-datepicker-panel').count(),1);
 // Foreground alert owns Escape; background picker/form must survive.
 await page.evaluate(()=>{window.alertDone=false;showAlert('Keep the underlying schedule.',{title:'Foreground error',draggable:true,allowEscClose:false,renderTarget:'local',workspaceBridge:false}).then(()=>alertDone=true);});
 await page.getByRole('button',{name:'OK',exact:true}).waitFor();await page.keyboard.press('Escape');await page.waitForTimeout(100);
 assert.equal(await page.evaluate(()=>alertDone),false);assert.equal(await page.locator('.ui-datepicker-panel').count(),1);assert.ok(await trigger.isVisible());
 await page.getByRole('button',{name:'OK',exact:true}).click();await page.waitForFunction(()=>alertDone);
 assert.deepEqual(await page.evaluate(()=>form.getValues()),before);
 await page.evaluate(()=>{window.alertDone=false;showAlert('Dismiss this alert only.',{title:'Dismissible error',draggable:true,allowEscClose:true,renderTarget:'local',workspaceBridge:false}).then(()=>alertDone=true);});
 await page.getByRole('button',{name:'OK',exact:true}).waitFor();await page.keyboard.press('Escape');await page.waitForFunction(()=>alertDone);
 assert.equal(await page.locator('.ui-datepicker-panel').count(),1);assert.ok(await trigger.isVisible());

 await page.keyboard.press('Escape');assert.equal(await page.locator('.ui-datepicker-panel').count(),0);assert.ok(await trigger.isVisible());
 assert.equal(await trigger.evaluate(e=>document.activeElement===e),true);assert.deepEqual(await page.evaluate(()=>form.getValues()),before);assert.equal(await page.evaluate(()=>closes.length),0);
 // Second Escape must still follow the modal's existing close guard.
 await page.evaluate(()=>form.update({onBeforeClose:()=>false}));
 await page.keyboard.press('Escape');await page.waitForTimeout(100);assert.ok(await trigger.isVisible());
 await page.evaluate(()=>form.update({onBeforeClose:null}));await page.keyboard.press('Escape');await page.waitForFunction(()=>!form.getState().open);
 await page.waitForFunction(()=>closes.length===1);await page.evaluate(()=>form.destroy());
 results.push({bundled,width,field,pass:true});console.log('PASS Escape',bundled,width,field);await page.close();
}await fs.writeFile('output/datepicker-escape-results.json',JSON.stringify(results,null,2)+'\n');}catch(e){console.error(e);throw e}finally{await browser.close()}
