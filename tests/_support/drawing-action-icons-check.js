async (page) => {
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const width of [1200,375]) {
  await page.setViewportSize({width,height:1000});await page.reload();await page.waitForFunction(()=>window.__drawingReady);
  await page.evaluate(async()=>{
   const {uiLoader}=await import('/js/ui/ui.loader.js');uiLoader.setPreferBundles(new URLSearchParams(location.search).has('bundle'));
   const icons=await uiLoader.get('ui.icons');
   for(const name of ['actions.undo','actions.redo','actions.clear']) {
    const svg=icons.createIcon(name);if(svg.getAttribute('viewBox')!=='0 0 24 24'||svg.getAttribute('stroke')!=='currentColor'||!svg.querySelector('path'))throw Error('Invalid catalog '+name);
   }
   if(JSON.stringify(icons.getIconDefinition('actions.clear').nodes)===JSON.stringify(icons.getIconDefinition('actions.delete').nodes))throw Error('Clear duplicates Delete');
   const {adapter:a,sample,tools}=__drawing;a.setFeatures(sample);a.updateFeature(0,{properties:{iconCheck:true}});a.beginEdit(0);a.rollbackEdit();
   for(const action of ['undo','redo','clear']) {
    const button=document.querySelector('#tools [data-action="'+action+'"]');if(!button.querySelector('svg[data-icon="actions.'+action+'"]')||!button.title||!button.getAttribute('aria-label')||button.querySelector('svg').getAttribute('aria-hidden')!=='true')throw Error('Missing accessible canonical artwork '+action);
   }
   tools.update({disabled:true});if([...document.querySelectorAll('#tools [data-action]')].some(b=>!b.disabled||b.getAttribute('aria-disabled')!=='true'))throw Error('Disabled actions changed');tools.update({disabled:false});
  });
  await page.locator('#tools [data-action="undo"]').focus();await page.keyboard.press('Space');
  if(await page.evaluate(()=>!!__drawing.adapter.getFeatures()[0].properties.iconCheck))throw Error('Keyboard Undo failed');
  await page.locator('#tools [data-action="redo"]').focus();await page.keyboard.press('Enter');
  if(!await page.evaluate(()=>__drawing.adapter.getFeatures()[0].properties.iconCheck))throw Error('Keyboard Redo failed');
  for(const theme of ['dark','light']) {
   await page.evaluate(theme=>{document.documentElement.dataset.theme=theme;document.body.dataset.theme=theme;document.querySelectorAll('main').forEach(n=>n.dataset.theme=theme);},theme);
   await page.locator('#tools').screenshot({path:'output/playwright/drawing-action-icons-'+(new URL(page.url()).searchParams.has('bundle')?'bundle':'source')+'-'+width+'-'+theme+'.png'});
  }
  await page.locator('#tools [data-action="clear"]').click();if(await page.evaluate(()=>__drawing.adapter.getFeatures().length))throw Error('Clear failed');
 }
 if(errors.length)throw Error(errors.join('; '));return 'DRAWING_ICONS_OK';
}
