import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import fs from 'node:fs/promises';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE||'C:/wamp64/www/bimoperks/node_modules/playwright/index.mjs'));
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--allow-file-access-from-files']});
const results=[];
const style=b=>b.evaluate(e=>{const s=getComputedStyle(e);return {background:s.backgroundColor,color:s.color,outline:s.outlineStyle,opacity:s.opacity};});
try{
 await fs.mkdir('output/playwright/toggle-selection',{recursive:true});
 for(const bundled of [false,true])for(const width of [390,1440]){
  const page=await browser.newPage({viewport:{width,height:1100}});
  await page.goto(pathToFileURL(path.resolve('tests/toggle.selection.regression.html')).href+(bundled?'?bundled':''));await page.waitForFunction(()=>window.ready);
  for(const tone of ['neutral','success','info','warning','danger']){
   const group=page.locator('#'+tone+'-segmented');const selected=group.locator('button').first();const other=group.locator('button').last();
   const normal=await style(selected);const unselected=await style(other);
   assert.notEqual(normal.background,unselected.background,tone+' normal');assert.notEqual(normal.background,'rgba(0, 0, 0, 0)');
   const pill=await style(page.locator('#'+tone+'-pill button').first());assert.equal(normal.background,pill.background);assert.equal(normal.color,pill.color);
   await selected.hover();assert.equal((await style(selected)).background,normal.background,tone+' pressed hover');
   if(tone==='neutral')await group.screenshot({path:`output/playwright/toggle-selection/${bundled?'bundle':'source'}-${width}-hover.png`});
   await other.hover();assert.notEqual((await style(other)).background,normal.background,tone+' unpressed hover');
   await page.mouse.move(0,0);await page.keyboard.press('Tab');await selected.focus();
   assert.equal(await selected.evaluate(e=>e.matches(':focus-visible')),true);assert.equal((await style(selected)).outline,'solid');assert.equal((await style(selected)).background,normal.background);
   if(tone==='neutral')await group.screenshot({path:`output/playwright/toggle-selection/${bundled?'bundle':'source'}-${width}-focus.png`});
   await page.evaluate(t=>groups[t+'-segmented'].update({disabled:true}),tone);
   assert.ok(await selected.isDisabled());assert.equal((await style(selected)).background,normal.background);assert.notEqual((await style(selected)).background,(await style(other)).background);
   if(tone==='neutral')await group.screenshot({path:`output/playwright/toggle-selection/${bundled?'bundle':'source'}-${width}-disabled.png`});
   results.push({bundled,width,tone,normal,unselected,disabled:await style(selected)});
   await page.evaluate(t=>groups[t+'-segmented'].update({disabled:false}),tone);
  }
  await page.screenshot({path:`output/playwright/toggle-selection/${bundled?'bundle':'source'}-${width}.png`,fullPage:true});
  await page.close();console.log('PASS selection states',bundled,width);
 }
 await fs.writeFile('output/toggle-selection-results.json',JSON.stringify(results,null,2)+'\n');
}finally{await browser.close();}
