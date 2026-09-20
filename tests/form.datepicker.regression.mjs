import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import fs from 'node:fs/promises';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE||'C:/wamp64/www/bimoperks/node_modules/playwright/index.mjs'));
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--allow-file-access-from-files']});
const report=[];
await fs.mkdir('output/playwright/wall-clock',{recursive:true});
try{
for(const bundled of [false,true])for(const timezoneId of ['UTC','America/New_York','Asia/Manila','Pacific/Apia']){
 const context=await browser.newContext({timezoneId,viewport:{width:390,height:844}});
 const page=await context.newPage();page.setDefaultTimeout(12000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.resolve('tests/form.datepicker.regression.html')).href+(bundled?'?bundled':''));await page.waitForFunction(()=>window.ready);
 assert.equal(await page.evaluate(()=>form.getValues().starts),'2024-03-10T02:30:45.123');
 await page.getByRole('button',{name:'Starts (business timezone)',exact:true}).click();
 const time=page.locator('.ui-datepicker-panel input[type=time]');assert.equal(await time.inputValue(),'02:30:45.123');
 await time.fill('02:31:46.789');assert.equal(await page.evaluate(()=>form.getValues().starts),'2024-03-10T02:31:46.789');
 await page.getByRole('button',{name:'Monday, March 11, 2024',exact:true}).click();assert.equal(await page.evaluate(()=>form.getValues().starts),'2024-03-11T02:31:46.789');
 await page.evaluate(()=>form.setValues({starts:'2011-12-30T23:59:58'}));
 assert.equal(await page.evaluate(()=>form.getValues().starts),'2011-12-30T23:59:58');
 // Samoa's skipped browser-local day must remain selectable as a civil date.
 await page.getByRole('button',{name:'Friday, December 30, 2011',exact:true}).click();
 assert.equal(await page.evaluate(()=>form.getValues().starts),'2011-12-30T23:59:58');
 await page.evaluate(()=>form.setBusy(true));assert.equal(await page.locator('.ui-datepicker-panel').count(),0);
 assert.ok(await page.getByRole('button',{name:'Starts (business timezone)',exact:true}).isDisabled());
 await page.evaluate(()=>{form.setValues({starts:'2024-11-03T01:30:22'});form.setBusy(false);});
 assert.ok(await page.getByRole('button',{name:'Disabled',exact:true}).isDisabled());assert.ok(await page.getByRole('button',{name:'Read only',exact:true}).isDisabled());
 await page.getByLabel('Scheduled',{exact:true}).uncheck();assert.equal(await page.evaluate(()=>Object.hasOwn(form.getValues(),'starts')),false);
 await page.getByLabel('Scheduled',{exact:true}).check();assert.equal(await page.evaluate(()=>form.getValues().starts),'2024-11-03T01:30:22');
 await page.evaluate(()=>form.setValues({starts:null}));await page.getByRole('button',{name:'Submit',exact:true}).click();
 await page.waitForFunction(()=>document.activeElement?.getAttribute('aria-label')==='Starts (business timezone)');
 await page.evaluate(()=>form.setValues({starts:'2024-02-29T12:34'}));assert.equal(await page.evaluate(()=>form.getValues().starts),'2024-02-29T12:34:00');
 const invalid=await page.evaluate(()=>['2024-02-30T12:00','2024-01-01T24:00','2024-01-01T12:00Z','2024-01-01T12:00:00.1234'].map(v=>{try{parseCivil(v);return false}catch{return true}}));assert.deepEqual(invalid,[true,true,true,true]);
 await page.getByRole('button',{name:'Starts (business timezone)',exact:true}).click();
 if(timezoneId==='America/New_York')await page.screenshot({path:`output/playwright/wall-clock/${bundled?'bundle':'source'}-390.png`});
 const stale=await page.getByRole('button',{name:'Thursday, February 29, 2024',exact:true}).elementHandle();
 await page.evaluate(()=>{window.before=changes.length;form.destroy();form.destroy();});await stale.evaluate(e=>e.click());
 assert.equal(await page.locator('.ui-datepicker-panel,.ui-modal-root').count(),0);assert.equal(await page.evaluate(()=>changes.length===before),true);
 // Existing instant mode still returns the same instant; disabled update preserves selected value.
 const instant=await page.evaluate(()=>{const host=document.createElement('div');document.body.append(host);const picker=createPicker(host,{value:'2024-03-10T07:30:22.123Z',showTime:true});const value=picker.getValue();picker.setDisabled(true);const after=picker.getValue();picker.destroy();host.remove();return {value,after};});
 assert.deepEqual(instant,{value:'2024-03-10T07:30:22.123Z',after:'2024-03-10T07:30:22.123Z'});assert.deepEqual(errors,[]);
 report.push({bundled,timezoneId,pass:true});console.log('PASS',bundled,timezoneId);await context.close();
}
for(const file of ['calendar.regression.html','form.modal.regression.html']){
 const context=await browser.newContext();const page=await context.newPage();await page.goto(pathToFileURL(path.resolve('tests',file)).href);await page.waitForSelector('body[data-status="pass"]',{timeout:30000});console.log('PASS existing',file);await context.close();
}
await fs.writeFile('output/playwright/wall-clock/results.json',JSON.stringify(report,null,2)+'\n');
}catch(e){console.error(e);throw e;}finally{await browser.close();}
