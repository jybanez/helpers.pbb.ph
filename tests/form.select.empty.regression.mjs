import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
const {chromium}=await import(pathToFileURL('C:/wamp64/www/bimoperks/node_modules/playwright/index.mjs'));
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--allow-file-access-from-files']});
try {
 for (const bundled of [false,true]) {
  const page=await browser.newPage();
  await page.goto(pathToFileURL(path.resolve('tests/form.validation.regression.html')).href+(bundled?'?bundled':''));
  await page.waitForFunction(()=>window.ready);
  await page.evaluate(()=>{
   form.destroy();window.submitted=[];window.invalid=[];
   window.form=createForm({title:'Select values',columns:3,rows:[[
    {type:'select',name:'optional',label:'Optional',options:[{value:'',label:'Choose…'},{value:'fixed',label:'Fixed'}]},
    {type:'select',name:'required',label:'Required',required:true,options:[{value:'',label:'Choose…'},{value:'fixed',label:'Fixed'}]},
    {type:'select',name:'fallback',label:'Fallback',options:[{label:'Label only'},{value:0,label:'Zero'},{value:false,label:'False'}]}
   ]],onInvalid:report=>invalid.push(report),onSubmit:values=>{submitted.push(values);return false;}});form.open();
  });
  assert.equal(await page.getByLabel('Optional',{exact:true}).inputValue(),'');
  assert.equal(await page.getByLabel('Required',{exact:true}).inputValue(),'');
  assert.deepEqual(await page.getByLabel('Fallback',{exact:true}).locator('option').evaluateAll(options=>options.map(o=>o.value)),['Label only','0','false']);
  await page.getByRole('button',{name:'Submit',exact:true}).click();
  await page.waitForFunction(()=>invalid.length===1);
  assert.equal(await page.evaluate(()=>submitted.length),0);
  assert.equal(await page.evaluate(()=>Boolean(invalid[0].errors.required)),true);
  assert.equal(await page.evaluate(()=>Boolean(invalid[0].errors.optional)),false);
  await page.getByLabel('Required',{exact:true}).selectOption('fixed');
  await page.getByRole('button',{name:'Submit',exact:true}).click();
  await page.waitForFunction(()=>submitted.length===1);
  assert.equal(await page.evaluate(()=>submitted[0].optional),'');
  assert.equal(await page.evaluate(()=>submitted[0].required),'fixed');
  await page.getByLabel('Optional',{exact:true}).selectOption('fixed');
  await page.getByLabel('Optional',{exact:true}).selectOption('');
  assert.equal(await page.evaluate(()=>form.getValues().optional),'');
  await page.evaluate(()=>form.destroy());await page.close();console.log('PASS empty select',bundled?'bundle':'source');
 }
} finally {await browser.close();}
