import assert from 'node:assert/strict';import {pathToFileURL} from 'node:url';import path from 'node:path';import fs from 'node:fs/promises';
const {chromium}=await import(pathToFileURL('C:/wamp64/www/bimoperks/node_modules/playwright/index.mjs'));
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--allow-file-access-from-files']});const results=[];await fs.mkdir('output/playwright/form-alignment',{recursive:true});
try{for(const bundled of [false,true])for(const columns of [2,3])for(const width of [390,1440]){
 const page=await browser.newPage({viewport:{width,height:1100}});await page.goto(pathToFileURL(path.resolve('tests/form.alignment.regression.html')).href+`?columns=${columns}`+(bundled?'&bundled':''));await page.waitForFunction(()=>window.ready);await page.waitForTimeout(350);
 const measure=()=>page.evaluate(()=>{const box=name=>{const e=document.querySelector(`[name="${name}"]`),r=e.getBoundingClientRect(),f=e.closest('.ui-form-modal-field').getBoundingClientRect();return {y:r.y,h:r.height,fieldY:f.y,fieldBottom:f.bottom};};return Object.fromEntries(['baseline','rule','amount','notes','neighbor','stable',...(document.querySelector('[name="wrapped"]')?['wrapped']:[])].map(n=>[n,box(n)]));});
 const check=m=>{for(const n of ['amount','neighbor','stable',...(columns===3?['wrapped']:[])])assert.ok(Math.abs(m[n].h-m.baseline.h)<1,`${n} stretched: ${JSON.stringify(m)}`);assert.ok(m.notes.h>m.baseline.h);if(width===1440){assert.ok(Math.abs(m.rule.y-m.amount.y)<1);assert.ok(Math.abs(m.notes.fieldY-m.neighbor.fieldY)<1);if(columns===3)assert.ok(Math.abs(m.wrapped.fieldY-m.amount.fieldY)<1);}else assert.ok(m.amount.fieldY>=m.rule.fieldBottom);};
 const before=await measure();check(before);
 await page.evaluate(()=>form.setErrors({rule:'Commission rule needs a valid option. Choose the rule matching this offer; the amount uses that rule.'}));check(await measure());
 await page.screenshot({path:`output/playwright/form-alignment/${bundled?'bundle':'source'}-${columns}-${width}.png`,fullPage:true});
 await page.evaluate(()=>form.setValues({show:false}));assert.equal(await page.locator('[name="conditional"]').count(),0);check(await measure());
 await page.evaluate(()=>form.setValues({show:true}));assert.equal(await page.locator('[name="conditional"]').count(),1);check(await measure());
 assert.equal(await page.evaluate(()=>document.querySelector('.ui-modal-body').scrollWidth<=document.querySelector('.ui-modal-body').clientWidth),true);
 results.push({bundled,columns,width,pass:true,measurements:before});console.log('PASS alignment',bundled,columns,width);await page.close();
}await fs.writeFile('output/playwright/form-alignment/results.json',JSON.stringify(results,null,2)+'\n');}catch(e){console.error(e);throw e;}finally{await browser.close();}
