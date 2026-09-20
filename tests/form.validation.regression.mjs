import assert from 'node:assert/strict';import {pathToFileURL} from 'node:url';import path from 'node:path';import fs from 'node:fs/promises';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE||'C:/wamp64/www/bimoperks/node_modules/playwright/index.mjs'));
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--allow-file-access-from-files']});
const results=[];await fs.mkdir('output/playwright/form-validation',{recursive:true});
try{for(const bundled of [false,true])for(const width of [390,1440]){
 const page=await browser.newPage({viewport:{width,height:1100}});page.setDefaultTimeout(12000);
 await page.goto(pathToFileURL(path.resolve('tests/form.validation.regression.html')).href+(bundled?'?bundled':''));await page.waitForFunction(()=>window.ready);
 await page.getByRole('button',{name:'Submit',exact:true}).click();await page.waitForFunction(()=>invalids.length===1);
 assert.equal(await page.evaluate(()=>submits),0);assert.equal(await page.evaluate(()=>invalids[0].busy),false);
 const errors=await page.evaluate(()=>invalids[0].report.errors);for(const key of ['name','password','email','scope','date','avatar','confirm'])assert.ok(errors[key],key);
 assert.ok(!errors.optional&&!errors.hidden&&!errors.inactive);assert.match(errors.password,/Password.*8/);
 await page.getByRole('button',{name:'OK',exact:true}).click();await page.waitForFunction(()=>document.activeElement?.name==='name');
 const cues=await page.locator('[aria-invalid="true"]').evaluateAll(nodes=>nodes.map(e=>({tag:e.outerHTML,outline:getComputedStyle(e).outlineStyle,description:(e.getAttribute('aria-describedby')||'').split(' ').some(id=>document.getElementById(id)?.textContent?.trim())})));
 assert.ok(cues.length>=7);assert.ok(cues.every(c=>c.outline!=='none'&&c.description),JSON.stringify(cues));
 await page.screenshot({path:`output/playwright/form-validation/${bundled?'bundle':'source'}-${width}.png`,fullPage:true});
 await page.getByLabel('Full name',{exact:true}).fill('Jane');assert.equal(await page.getByLabel('Full name',{exact:true}).getAttribute('aria-invalid'),null);
 const corrected=await page.getByLabel('Full name',{exact:true}).evaluate(e=>({outline:getComputedStyle(e).outlineStyle,error:document.getElementById(e.getAttribute('aria-describedby'))?.textContent,hidden:document.getElementById(e.getAttribute('aria-describedby'))?.hidden}));assert.equal(corrected.outline,'none');assert.equal(corrected.error,'');assert.equal(corrected.hidden,true);
 await page.evaluate(()=>form.setValues({password:'long-secret',confirm:'different',email:'not-email',code:'abc',scope:'One',date:'2026-09-21'}));
 await page.getByRole('button',{name:'Submit',exact:true}).click();await page.waitForFunction(()=>invalids.length===2);
 const second=await page.evaluate(()=>invalids[1].report.errors);assert.match(second.confirm,/match/);assert.match(second.avatar,/Profile photo/);assert.match(second.email,/Email/);assert.match(second.code,/six digits/);assert.equal(await page.evaluate(()=>submits),0);
 await page.getByRole('button',{name:'OK',exact:true}).click();
 // Required avatar gets a selected file through its native chooser input.
 await page.locator('input[type=file]').setInputFiles({name:'photo.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a/dsAAAAASUVORK5CYII=','base64')});
 await page.evaluate(()=>form.setValues({confirm:'long-secret',email:'jane@example.com',code:'123456'}));
 await page.getByRole('button',{name:'Submit',exact:true}).click();await page.waitForFunction(()=>submits===1);assert.equal(await page.evaluate(()=>form.isBusy()),false);
 await page.evaluate(()=>{composite.setError('Choose a valid sale option.');form.destroy();});
 const compositeInput=page.getByLabel('Composite value');assert.equal(await compositeInput.getAttribute('aria-invalid'),'true');assert.ok((await compositeInput.getAttribute('aria-describedby')).includes('existing'));
 await compositeInput.fill('fixed');assert.equal(await compositeInput.getAttribute('aria-invalid'),null);
 await page.evaluate(()=>{composite.destroy();composite.destroy()});assert.equal(await compositeInput.getAttribute('aria-describedby'),'existing');assert.equal(await compositeInput.evaluate(e=>e.classList.contains('ui-field-error-target')),false);
 // An awaited invalid callback must not focus a replacement or corrected field.
 for(const replace of [true,false,'destroy']){
  await page.evaluate(()=>{window.pendingInvalid=false;window.late=createForm({title:'Late feedback',rows:[[{type:'input',name:'first',label:'First',required:true},{type:'input',name:'second',label:'Second'}]],onInvalid:()=>new Promise(resolve=>{window.pendingInvalid=true;window.releaseInvalid=resolve})});late.open();});
  await page.getByRole('button',{name:'Submit',exact:true}).click();await page.waitForFunction(()=>pendingInvalid);
  await page.evaluate(replace=>{if(replace==='destroy')late.destroy();else if(replace)late.update({title:'Replacement fields'});else late.setValues({first:'Corrected'});},replace);
  const focusTarget=replace==='destroy'?compositeInput:page.getByLabel('Second',{exact:true});
  await focusTarget.focus();await page.evaluate(()=>releaseInvalid());await page.waitForTimeout(100);
  assert.equal(await focusTarget.evaluate(e=>document.activeElement===e),true);
  await page.evaluate(()=>late.destroy());
 }
 // Required password checks exact emptiness; whitespace policy belongs to apps.
 for(const boundary of [{value:'',minLength:null,valid:false},{value:' ',minLength:null,valid:true},{value:' ',minLength:8,valid:false},{value:'        ',minLength:8,valid:true}]){
  await page.evaluate(b=>{window.passwordSubmits=0;window.passwordErrors=[];window.passwordForm=createForm({title:'Password boundary',rows:[[{type:'input',input:'password',name:'credential',label:'Credential',required:true,...(b.minLength==null?{}:{minLength:b.minLength})}]],initialValues:{credential:b.value},onInvalid:r=>passwordErrors.push(r),onSubmit:()=>{passwordSubmits++;return false}});passwordForm.open();},boundary);
  await page.getByRole('button',{name:'Submit',exact:true}).click();await page.waitForFunction(()=>passwordSubmits+passwordErrors.length===1);
  assert.equal(await page.evaluate(()=>passwordSubmits),boundary.valid?1:0,JSON.stringify(boundary));
  assert.equal(await page.evaluate(()=>passwordForm.getValues().credential),boundary.value);
  if(!boundary.valid)assert.match(await page.evaluate(()=>passwordErrors[0].errors.credential),boundary.value?/8/:/required/);
  await page.evaluate(()=>passwordForm.destroy());
 }
 results.push({bundled,width,pass:true});console.log('PASS validation',bundled,width);await page.close();
}await fs.writeFile('output/playwright/form-validation/results.json',JSON.stringify(results,null,2)+'\n');}catch(e){console.error(e);throw e}finally{await browser.close()}
