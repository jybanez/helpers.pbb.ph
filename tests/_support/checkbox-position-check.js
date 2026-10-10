async (page) => {
 await page.waitForFunction(()=>window.fixtureReady);
 for(const width of [1200,375]) {
  await page.setViewportSize({width,height:715});
  const label=page.locator('.ui-checkbox').filter({hasText:'Visible 10'});
  await label.scrollIntoViewIfNeeded();
  await page.evaluate(()=>checkboxes[10].update({checked:false,indeterminate:true,readonly:false,disabled:false}));
  const measure=()=>page.evaluate(()=>{
   const input=checkboxes[10].refs.input.getBoundingClientRect(),box=checkboxes[10].refs.box.getBoundingClientRect();
   const panel=document.querySelector('.ui-modal'),body=document.querySelector('.ui-modal-body'),grid=document.querySelector('.scroll-grid');
   return {input:{x:input.x,y:input.y,width:input.width,height:input.height},box:{x:box.x,y:box.y},scroll:[panel.scrollTop,body.scrollTop,grid.scrollTop,window.scrollY],height:panel.scrollHeight,header:document.querySelector('.ui-modal-header').getBoundingClientRect().top};
  });
  const before=await measure();
  if(Math.abs(before.input.x-before.box.x)>1||Math.abs(before.input.y-before.box.y)>1||before.input.width!==18||before.input.height!==18)throw Error('native input not contained '+JSON.stringify(before));
  const stable=async stage=>{
   const after=await measure();
   if(JSON.stringify(after.scroll)!==JSON.stringify(before.scroll)||Math.abs(after.header-before.header)>1||after.height!==before.height)throw Error(stage+' scroll jump '+JSON.stringify({before,after}));
  };
  await label.click(); await stable('real label click');
  if(!await page.evaluate(()=>checkboxes[10].getChecked()&&!checkboxes[10].getIndeterminate()))throw Error('mixed activation');
  const input=page.getByRole('checkbox',{name:'Visible 10',exact:true});
  await input.focus(); await stable('native focus'); await input.press('Space'); await stable('Space');
  await page.evaluate(()=>checkboxes[10].update({readonly:true,indeterminate:true}));
  await label.click(); await stable('readonly label'); await input.focus(); await input.press('Space'); await stable('readonly Space');
  if(!await page.evaluate(()=>checkboxes[10].refs.input.indeterminate))throw Error('readonly mixed lost');
  await page.evaluate(()=>checkboxes[10].update({readonly:false,disabled:true}));
  await label.click({force:true}); await stable('disabled label');
  if(!await page.evaluate(()=>checkboxes[10].refs.input.indeterminate))throw Error('disabled mixed lost');
  await page.evaluate(()=>checkboxes[10].update({disabled:false}));
  await page.screenshot({path:`output/playwright/checkbox-position-${page.url().includes('bundle')?'bundle':'source'}-${width}.png`,fullPage:true});
  console.log('PASS '+width+' '+JSON.stringify(before));
 }
 await page.evaluate(()=>{checkboxes.forEach(c=>c.destroy());grid.destroy();modal.destroy();});
 if(await page.locator('.ui-modal-root,.ui-checkbox').count())throw Error('teardown remnants');
}
