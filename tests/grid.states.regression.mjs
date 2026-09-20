import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE||'C:/wamp64/www/bimoperks/node_modules/playwright/index.mjs'));
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--allow-file-access-from-files']});
const report=[];
await fs.mkdir('output/playwright/grid-states',{recursive:true});
try{
 for(const bundled of [false,true])for(const width of [320,390,1280]){
  const page=await browser.newPage({viewport:{width,height:900}});page.setDefaultTimeout(12000);console.log('START '+bundled+' '+width);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.resolve('tests/grid.states.regression.html')).href+(bundled?'?bundled':''));await page.waitForFunction(()=>window.ready);
  const checkState=async()=>{
   await page.waitForFunction(()=>parseFloat(document.querySelector('.ui-grid-state-message')?.style.width||getComputedStyle(document.querySelector('.ui-grid-state-message')).width)>0);
   await page.waitForTimeout(60);
   const bounds=await page.evaluate(()=>{const wrap=document.querySelector('.ui-grid-table-wrap'),m=document.querySelector('.ui-grid-state-message');const a=wrap.getBoundingClientRect(),b=m.getBoundingClientRect();return {left:b.left-a.left,right:b.right-a.left,viewport:wrap.clientWidth,wrap:m.scrollWidth<=m.clientWidth+1,headers:document.querySelectorAll('thead th').length,colspan:m.parentElement.colSpan,role:m.getAttribute('role')};});
   assert.ok(bounds.left>=-1&&bounds.right<=bounds.viewport+3,JSON.stringify(bounds));assert.ok(bounds.wrap);assert.equal(bounds.headers,3);assert.equal(bounds.colspan,3);assert.equal(bounds.role,'status');
  };
  await checkState();console.log("initial state pass");
  // Legacy bare-text markup shares the document with the new source/bundle grid.
  // Appended after primary host so existing geometry/column selectors stay scoped.
  const coexistence=await page.evaluate(()=>{
   const host=document.createElement('div');host.id='legacy-state-fixture';
   host.innerHTML='<div class="ui-grid"><table class="ui-grid-table"><tbody><tr><td class="ui-grid-state-cell" colspan="3">Legacy empty state</td></tr></tbody></table></div>';
   document.body.append(host);
   const padding=e=>['Top','Right','Bottom','Left'].map(side=>getComputedStyle(e)['padding'+side]);
   return {legacy:padding(host.querySelector('td')),wrapped:padding(document.querySelector('#host .ui-grid-state-cell')),message:padding(document.querySelector('#host .ui-grid-state-message'))};
  });
  assert.deepEqual(coexistence,{legacy:Array(4).fill('14px'),wrapped:Array(4).fill('0px'),message:Array(4).fill('14px')});
  await page.locator('#legacy-state-fixture').evaluate(e=>e.remove());

  await page.screenshot({path:`output/playwright/grid-states/${bundled?'bundle':'source'}-${width}.png`});
  console.log("screenshot done");await page.evaluate(()=>grid.setRows(rows));
  const before=await page.locator('col').first().evaluate(e=>parseFloat(e.style.width));
  const handle=page.locator('.ui-grid-resize-handle').first();await handle.scrollIntoViewIfNeeded();const box=await handle.boundingBox();
  await page.mouse.move(box.x+1,box.y+8);await page.mouse.down();await page.mouse.move(box.x+1-55,box.y+8,{steps:4});await page.mouse.up();
  console.log("resize done");assert.ok(await page.locator('col').first().evaluate(e=>parseFloat(e.style.width))<before);
  await page.locator('tbody button').click();assert.equal(await page.evaluate(()=>clicks),1);
  await page.evaluate(()=>{const wrap=document.querySelector('.ui-grid-table-wrap');wrap.scrollLeft=wrap.scrollWidth;});
  const scroll=await page.locator('.ui-grid-table-wrap').evaluate(e=>e.scrollLeft);if(width<600)assert.ok(scroll>0);
  await page.evaluate(()=>grid.setRows([]));await checkState();
  // State remains readable when the user scrolls the preserved wide headers too.
  await page.evaluate(()=>{const wrap=document.querySelector('.ui-grid-table-wrap');wrap.scrollLeft=wrap.scrollWidth;});await checkState();
  await page.evaluate(()=>grid.update([],{emptyText:'A very long empty message '+ 'LongUnbrokenText'.repeat(25)}));await checkState();
  await page.evaluate(()=>grid.update(rows,{loading:true}));await checkState();assert.equal(await page.locator('[role=status]').innerText(),'Loading...');
  await page.evaluate(()=>grid.update([],{loading:false,errorText:'Unable to load websites. '+ 'Please try again. '.repeat(12)}));await checkState();
  await page.setViewportSize({width:width===320?390:320,height:900});await checkState();
  await page.evaluate(()=>grid.update(rows,{errorText:'',loading:false}));assert.equal(await page.locator('.ui-grid-state-message').count(),0);
  await page.locator('tbody button').click();assert.equal(await page.evaluate(()=>clicks),2);
  await page.evaluate(()=>grid.destroy());assert.equal(await page.locator('#host').innerHTML(),'');assert.deepEqual(errors,[]);
  report.push({bundled,width,pass:true,checks:'legacy/new state CSS coexistence,empty,scrolled transition,state scrolling,long text,loading,error,viewport resize,column resize,action reachability,semantics,destroy'});console.log('PASS '+JSON.stringify(report.at(-1)));await page.close();
 }
 // Existing full grid behavior suite, source mode.
 const legacy=await browser.newPage();await legacy.goto(pathToFileURL(path.resolve('tests/grid.regression.html')).href);await legacy.waitForSelector('body[data-status="pass"]');console.log('Existing grid regression PASS');await legacy.close();
 await fs.writeFile('output/playwright/grid-states/results.json',JSON.stringify(report,null,2)+'\n');
}finally{await browser.close();}
