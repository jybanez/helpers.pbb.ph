import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import fs from 'node:fs/promises';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE||'C:/wamp64/www/bimoperks/node_modules/playwright/index.mjs'));
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--allow-file-access-from-files']});
const results=[];await fs.mkdir('output/playwright/datepicker-minute',{recursive:true});
try{
for(const bundled of [false,true])for(const timezoneId of ['UTC','America/New_York'])for(const width of [390,1440]){
 const context=await browser.newContext({timezoneId,viewport:{width,height:1000}});const page=await context.newPage();page.setDefaultTimeout(12000);
 await page.goto(pathToFileURL(path.resolve('tests/form.datepicker.regression.html')).href+'?minute'+(bundled?'&bundled':''));await page.waitForFunction(()=>window.ready);
 const value=()=>page.evaluate(()=>form.getValues().starts);
 const open=async()=>{if(!await page.locator('.ui-datepicker-panel').count())await page.getByRole('button',{name:'Starts (business timezone)',exact:true}).click();};
 assert.equal(await value(),'2024-03-10T02:30:45.123');
 assert.ok((await page.locator('.ui-datepicker-value').first().innerText()).endsWith('02:30'));
 await open();let input=page.locator('.ui-datepicker-panel input[type=time]');assert.equal(await input.getAttribute('step'),'60');assert.equal(await input.inputValue(),'02:30');
 await page.getByRole('button',{name:'Next month',exact:true}).click();await page.getByRole('button',{name:'Previous month',exact:true}).click();assert.equal(await value(),'2024-03-10T02:30:45.123');
 // Selecting a different calendar day retains legacy seconds, including DST-gap civil time.
 await page.getByRole('button',{name:'Monday, March 11, 2024',exact:true}).click();assert.equal(await value(),'2024-03-11T02:30:45.123');
 await page.getByLabel('Scheduled',{exact:true}).uncheck();await page.getByLabel('Scheduled',{exact:true}).check();assert.equal(await value(),'2024-03-11T02:30:45.123');
 await page.evaluate(()=>form.setValues({starts:'2024-11-03T01:30:22.456'}));await open();assert.equal(await input.inputValue(),'01:30');
 await page.screenshot({path:`output/playwright/datepicker-minute/${bundled?'bundle':'source'}-${timezoneId.replaceAll('/','-')}-${width}.png`});
 // Real input editing replaces hidden legacy precision only when input emits a valid value.
 await input.fill('01:31');assert.equal(await value(),'2024-11-03T01:31:00');
 await page.evaluate(()=>form.setBusy(true));await page.evaluate(()=>form.setBusy(false));assert.equal(await value(),'2024-11-03T01:31:00');
 await page.evaluate(()=>form.setValues({starts:'2011-12-30T23:59:58'}));await open();await page.getByRole('button',{name:'Friday, December 30, 2011',exact:true}).click();assert.equal(await value(),'2011-12-30T23:59:58');
 await page.evaluate(()=>form.setValues({starts:null}));await open();await page.getByRole('button',{name:/^(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday),/}).first().click();assert.ok((await value()).endsWith(':00'));
 await page.evaluate(()=>form.destroy());
 const api=await page.evaluate(()=>{
  const host=document.createElement('div');document.body.append(host);
  const p=createPicker(host,{valueMode:'wall-clock',showTime:true,timePrecision:'minute',mode:'range',value:{start:'2024-01-01T10:11:12.123',end:'2024-01-02T13:14:15.456'}});
  const before=p.getValue();p.update({disabled:true});const after=p.getValue();p.destroy();
  let invalid=false;try{createPicker(host,{timePrecision:'bad'})}catch{invalid=true}host.remove();return {before,after,invalid};
 });assert.deepEqual(api.before,api.after);assert.ok(api.invalid);
 results.push({bundled,timezoneId,width,pass:true});console.log('PASS minute',bundled,timezoneId,width);await context.close();
}
await fs.writeFile('output/playwright/datepicker-minute/results.json',JSON.stringify(results,null,2)+'\n');
}catch(error){console.error(error);throw error;}finally{await browser.close();}
