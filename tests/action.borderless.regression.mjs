import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import fs from 'node:fs/promises';
import {startStaticServer} from './_support/static-server.mjs';
const {chromium}=await import(pathToFileURL('C:/wamp64/www/bimoperks/node_modules/playwright/index.mjs'));
const server=await startStaticServer({rootDir:process.cwd(),port:0});
const browser=await chromium.launch({channel:'msedge',headless:true});
const style=node=>{const s=getComputedStyle(node);return {border:s.borderTopColor,width:node.getBoundingClientRect().width,height:node.getBoundingClientRect().height,background:s.backgroundColor,color:s.color,opacity:s.opacity,pointer:s.pointerEvents}};
const transparent=value=>value==='rgba(0, 0, 0, 0)'||value==='transparent';
await fs.mkdir('output/playwright/action-borderless',{recursive:true});
try{for(const bundle of [false,true]){
 const page=await browser.newPage({viewport:{width:1280,height:1000}});
 await page.goto(server.origin+'/tests/action.borderless.regression.html'+(bundle?'?bundle':''));
 await page.waitForFunction(()=>window.ready||window.failure);assert.equal(await page.evaluate(()=>window.failure),undefined);
 const scope=on=>page.evaluate(on=>document.body.classList.toggle('ui-actions-borderless',on),on);
 const controls=page.locator('input.ui-input,select.ui-input,textarea.ui-input,.sample,.hh-card');
 const outlines=await controls.evaluateAll(nodes=>nodes.map(n=>getComputedStyle(n).borderTopColor));
 const buttons=page.locator('button.ui-button,button.ui-navbar-item,button.hh-remove,button.ui-field-group-add,button.ui-field-group-remove');assert.ok(await buttons.count()>12,'complete action surfaces mounted');
 for(let i=0;i<await buttons.count();i++){
   const node=buttons.nth(i);if(!await node.isVisible())continue;
   await page.waitForTimeout(200);const before=await node.evaluate(style);await scope(true);await page.waitForTimeout(200);const after=await node.evaluate(style);
   assert.ok(transparent(after.border),await node.getAttribute('class'));delete before.border;delete after.border;assert.deepEqual(after,before,'only the action border changes');await scope(false);
 }
 const primary=page.getByRole('button',{name:'Primary',exact:true});
 for(const state of ['hover','active','disabled']){
   await scope(false);await primary.hover();if(state==='active')await page.mouse.down();if(state==='disabled')await primary.evaluate(n=>n.disabled=true);
   await page.waitForTimeout(200);const before=await primary.evaluate(style);await scope(true);await page.waitForTimeout(200);const after=await primary.evaluate(style);
   assert.ok(transparent(after.border),state);delete before.border;delete after.border;assert.deepEqual(after,before,state+' keeps semantic appearance and size');
   if(state==='active'){await page.mouse.move(0,0);await page.mouse.up()}if(state==='disabled')await primary.evaluate(n=>n.disabled=false);
 }
 assert.deepEqual(await controls.evaluateAll(nodes=>nodes.map(n=>getComputedStyle(n).borderTopColor)),outlines,'input/select/textarea/cards retain outlines');
 assert.ok(transparent((await page.locator('#custom').evaluate(style)).border),'explicit custom action marker');
 await primary.focus();await page.keyboard.press('Tab');assert.ok(await page.locator(':focus').evaluate(n=>{const s=getComputedStyle(n);return n.matches(':focus-visible')&&s.outlineStyle==='solid'&&s.outlineWidth==='2px'}),'keyboard focus ring');
 await page.locator('#custom').focus();assert.equal(await page.locator('#custom').evaluate(n=>getComputedStyle(n).outlineWidth),'2px','custom focus ring beats ordinary app override');
 await page.screenshot({path:`output/playwright/action-borderless/${bundle?'bundle':'source'}-components.png`,fullPage:true});
 for(const kind of ['confirm','alert','form']){
   await page.evaluate(kind=>{if(kind==='confirm')window.confirmDialog('Continue?',{variant:'warning'});if(kind==='alert')window.alertDialog('Correct the missing requirement.',{variant:'error'});if(kind==='form'){window.form=window.formModal({title:'Form',rows:[[{type:'input',name:'name',label:'Name',required:true}]],onSubmit(){return false}});window.form.open()}},kind);
   await page.locator('.ui-modal-root.is-mounted').waitFor();const actions=page.locator('.ui-modal-root button.ui-button');
   for(let i=0;i<await actions.count();i++){const a=actions.nth(i);if(await a.isVisible())assert.ok(transparent((await a.evaluate(style)).border),kind+' action')}
   await page.waitForTimeout(400);
   await page.screenshot({path:`output/playwright/action-borderless/${bundle?'bundle':'source'}-${kind}.png`});
   await page.keyboard.press('Escape');await page.locator('.ui-modal-root.is-mounted').waitFor({state:'detached'});
 }
 console.log('PASS action border-only '+(bundle?'bundle':'source'));await page.close();
}}finally{await browser.close();await server.close()}
