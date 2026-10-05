import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {startStaticServer} from './_support/static-server.mjs';
const {chromium}=await import(pathToFileURL('C:/wamp64/www/bimoperks/node_modules/playwright/index.mjs'));
const server=await startStaticServer({rootDir:process.cwd(),port:0});
const browser=await chromium.launch({channel:'msedge',headless:true});
try{for(const bundle of [false,true]){
 const page=await browser.newPage();const warnings=[];
 page.on('console',m=>{if(/aria-hidden.*focus|focus.*aria-hidden/i.test(m.text()))warnings.push(m.text())});
 await page.goto(server.origin+'/tests/modal.focus.lifecycle.regression.html'+(bundle?'?bundle':''));await page.waitForFunction(()=>window.ready);
 // Observe exactly when aria-hidden is written, not just after animation.
 await page.evaluate(()=>{window.hiddenWithFocus=[];const set=Element.prototype.setAttribute;Element.prototype.setAttribute=function(name,value){if(name==='aria-hidden'&&String(value)==='true'&&this.matches('.ui-modal-root')&&this.contains(document.activeElement))hiddenWithFocus.push(document.activeElement.outerHTML);return set.call(this,name,value)}});
 for(const reason of ['close','escape','backdrop','api']){
   await page.locator('#opener').focus();await page.evaluate(()=>{window.modal=createModal({title:'Test',content:'Focus close button',closeOnBackdrop:true});modal.open()});
   await page.locator('.ui-modal-close').focus();
   if(reason==='close')await page.locator('.ui-modal-close').click();
   if(reason==='escape')await page.keyboard.press('Escape');
   if(reason==='backdrop')await page.locator('.ui-modal-backdrop').click({position:{x:2,y:2}});
   if(reason==='api')await page.evaluate(()=>modal.close());
   await page.waitForFunction(()=>modal.refs.root.getAttribute('aria-hidden')==='true');
   assert.equal(await page.evaluate(()=>document.activeElement.id),'opener',reason);
   assert.equal(await page.evaluate(()=>modal.refs.root.inert),true);
   await page.evaluate(()=>modal.refs.closeButton.focus());assert.equal(await page.evaluate(()=>modal.refs.root.contains(document.activeElement)),false,'closing subtree cannot regain focus');
   await page.locator('.ui-modal-root').waitFor({state:'detached'});await page.evaluate(()=>modal.destroy());
 }
 // Veto and busy dismissal must leave the live modal/focus intact.
 await page.evaluate(()=>{window.modal=createModal({content:'Guarded',onBeforeClose:()=>false});modal.open()});await page.locator('.ui-modal-close').focus();
 assert.equal(await page.evaluate(()=>modal.close()),false);assert.equal(await page.evaluate(()=>modal.refs.root.inert),false);
 await page.evaluate(()=>{modal.update({onBeforeClose:null});modal.setBusy(true)});await page.keyboard.press('Escape');await page.waitForTimeout(30);assert.equal(await page.evaluate(()=>modal.getState().open),true);
 await page.evaluate(()=>{modal.setBusy(false);modal.close()});await page.locator('.ui-modal-root').waitFor({state:'detached'});await page.evaluate(()=>modal.destroy());
 // Child restores to parent; closing a background sibling does not steal focus.
 await page.locator('#opener').focus();await page.evaluate(()=>{window.parentModal=createModal({content:'Parent'});parentModal.open()});await page.locator('.ui-modal-close').focus();
 await page.evaluate(()=>{window.childModal=createModal({content:'Child'});childModal.open()});await page.locator('.ui-modal-close').last().focus();
 await page.evaluate(()=>childModal.close());assert.equal(await page.evaluate(()=>parentModal.refs.root.contains(document.activeElement)),true);
 await page.waitForFunction(()=>!childModal.refs.root.isConnected);await page.evaluate(()=>{childModal.destroy();window.childModal=createModal({content:'Child again'});childModal.open()});await page.locator('.ui-modal-close').last().focus();
 await page.evaluate(()=>parentModal.close());assert.equal(await page.evaluate(()=>childModal.refs.root.contains(document.activeElement)),true);
 await page.waitForFunction(()=>!parentModal.refs.root.isConnected);assert.equal(await page.evaluate(()=>childModal.refs.root.contains(document.activeElement)),true,'animation completion cannot steal focus');
 await page.evaluate(()=>childModal.close());await page.locator('.ui-modal-root').waitFor({state:'detached'});await page.evaluate(()=>{childModal.destroy();parentModal.destroy()});
 // Invalid opener falls back outside; reopening removes inert.
 for(const invalid of ['disabled','removed','hidden']){
   await page.evaluate(()=>{window.temporary=document.createElement('button');document.body.append(temporary);temporary.focus();window.modal=createModal({content:'Fallback'});modal.open()});await page.locator('.ui-modal-close').focus();
   await page.evaluate(invalid=>{if(invalid==='removed')temporary.remove();else temporary[invalid]=true;modal.close()},invalid);
   assert.equal(await page.evaluate(()=>modal.refs.root.contains(document.activeElement)),false);
   await page.locator('.ui-modal-root').waitFor({state:'detached'});await page.evaluate(()=>modal.open());await page.locator('.ui-modal-close').focus();assert.equal(await page.evaluate(()=>modal.refs.root.inert),false);
   await page.evaluate(()=>modal.close());await page.locator('.ui-modal-root').waitFor({state:'detached'});await page.evaluate(()=>{modal.destroy();temporary.remove()});
 }
 // Confirmation still settles only after unmount although focus restores earlier.
 await page.locator('#opener').focus();await page.evaluate(()=>{window.done=false;confirmDialog('Confirm?',{onConfirm:()=>({close:true,value:false})}).then(value=>{window.done=true;window.result=value;window.mountedAtSettlement=!!document.querySelector('.ui-modal-root')})});
 await page.getByRole('button',{name:'Confirm',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.ui-modal-root.is-closing'));
 assert.equal(await page.evaluate(()=>done),false);await page.waitForFunction(()=>done);assert.equal(await page.evaluate(()=>result),false);assert.equal(await page.evaluate(()=>mountedAtSettlement),false);
 assert.deepEqual(await page.evaluate(()=>hiddenWithFocus),[]);assert.deepEqual(warnings,[]);
 console.log('PASS modal focus lifecycle '+(bundle?'bundle':'source'));await page.close();
}}finally{await browser.close();await server.close()}
