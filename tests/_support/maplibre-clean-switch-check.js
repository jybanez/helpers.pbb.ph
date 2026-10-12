async (page) => {
 const assert=(ok,msg)=>{if(!ok)throw Error(msg);},errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const width of [1200,375]) {
  await page.setViewportSize({width,height:1000});await page.reload();await page.waitForFunction(()=>window.__drawingReady);
  await page.evaluate(()=>{
   const {adapter:a,sample}=__drawing;const features=structuredClone(sample);features.push({type:'Feature',id:'other',properties:{},geometry:{type:'Point',coordinates:[123.895,10.3157]}});a.setFeatures(features);
   a.updateFeature('route',{properties:{prior:true}});a.undo();window.__switchBaseline=JSON.stringify(a.getFeatures());
   if(!a.beginEdit(0)||a.getCapabilities().actions.finish||a.getCapabilities().actions.cancel)throw Error('Clean capabilities not disabled');
   const token=a.getState().editSession.id;if(!a.beginEdit('route')||a.getState().editSession.id===token||a.getCapabilities().actions.fill||!a.getCapabilities().actions.stroke)throw Error('Clean programmatic switch/line style capabilities');
   const stable=JSON.stringify(a.getState());if(a.beginEdit('missing')!==false||stable!==JSON.stringify(a.getState()))throw Error('Invalid switch changed session');
   if(!a.beginEdit(0)||a.updateFeature(0,{properties:{stale:true}},{sessionId:token})!==false)throw Error('Zero switch/stale token');
   let reentrant=false;const off=a.on('select',()=>{reentrant=a.beginEdit(0)===false;});a.beginEdit('route');off();if(!reentrant)throw Error('Reentrant clean switch permitted');a.beginEdit(0);
  });
  await page.locator('#map canvas').scrollIntoViewIfNeeded();
  const location=async id=>page.evaluate(id=>{const {map,adapter:a}=__drawing,b=map.getCanvas().getBoundingClientRect(),p=map.project(a.getFeatures().find(f=>String(f.id)===String(id)).geometry.coordinates);return{x:b.left+p.x,y:b.top+p.y};},id);
  await page.waitForFunction(()=>{const {map,adapter:a}=__drawing,p=map.project(a.getFeatures().find(f=>f.id==='other').geometry.coordinates);return map.queryRenderedFeatures(p,{layers:a.getState().layerIds.slice(0,3)}).some(f=>f.properties.__helperId==='other');});
  const other=await location('other');await page.mouse.click(other.x,other.y);
  assert(await page.evaluate(()=>__drawing.adapter.getState().editSession?.featureId==='other'&&!__drawing.adapter.getState().editSession.dirty&&JSON.stringify(__drawing.adapter.getFeatures())===__switchBaseline),'Actual pointer clean switch');
  await page.evaluate(()=>{window.__sameToken=__drawing.adapter.getState().editSession.id;window.__sameEditEvents=0;window.__sameOff=__drawing.adapter.on('editchange',()=>window.__sameEditEvents++);});
  await page.mouse.click(other.x,other.y);
  assert(await page.evaluate(()=>{window.__sameOff();return __drawing.adapter.getState().editSession.id===__sameToken&&__sameEditEvents===0;}),'Actual same-object click does not replace session');
  await page.evaluate(()=>{
   const a=__drawing.adapter;window.__switchToken=a.getState().editSession.id;
   if(document.querySelector('#tools [data-action="finish"]').disabled!==true||document.querySelector('#tools [data-action="cancel"]').disabled!==true)throw Error('Complete toolbar clean controls');
   for(const action of ['fill','stroke'])if(!document.querySelector('#tools [data-action="'+action+'"] svg[data-icon="actions.'+action+'"]'))throw Error('Canonical style artwork missing');
   a.updateFeature('other',{style:{fill:{r:20,g:40,b:60,a:0},stroke:{r:70,g:80,b:90,a:1}}});
   if(!a.getCapabilities().actions.finish||!a.getCapabilities().actions.cancel||a.beginEdit(0)!==false)throw Error('Dirty switch protection');
  });
  const zero=await location(0);await page.mouse.click(zero.x,zero.y);
  assert(await page.evaluate(()=>__drawing.adapter.getState().editSession.id===__switchToken&&__drawing.adapter.getFeatureStyle('other').fill.a===0),'Dirty actual click protected alpha0');
  await page.locator('#tools [data-action="fill"]').click();assert(await page.evaluate(()=>document.activeElement.closest('#fill-color')),'Fill routes to canonical picker');
  await page.locator('#tools [data-action="stroke"]').click();assert(await page.evaluate(()=>document.activeElement.closest('#stroke-color')),'Stroke routes to canonical picker');
  for(const theme of ['dark','light']){await page.evaluate(theme=>{document.documentElement.dataset.theme=theme;document.body.dataset.theme=theme;document.querySelectorAll('main').forEach(n=>n.dataset.theme=theme);},theme);await page.locator('#tools').screenshot({path:'output/playwright/clean-edit-controls-'+(new URL(page.url()).searchParams.has('bundle')?'bundle':'source')+'-'+width+'-'+theme+'.png'});}
  await page.evaluate(()=>{
   const a=__drawing.adapter;a.undo();if(a.getState().editSession.dirty||a.getCapabilities().actions.finish||a.getCapabilities().actions.cancel||!a.beginEdit(0))throw Error('Undo-to-clean switching');
   a.rollbackEdit();if(JSON.stringify(a.getFeatures())!==__switchBaseline||!a.getCapabilities().actions.redo)throw Error('Global redo lost on clean switch');
   a.redo();if(!a.getFeatures().find(f=>f.id==='route').properties.prior)throw Error('Prior redo corrupted');a.undo();
   a.beginEdit('other');a.updateFeature('other',{properties:{accepted:true}});if(a.beginEdit(0)!==false||!a.finish())throw Error('Dirty explicit Finish');a.undo();if(JSON.stringify(a.getFeatures())!==__switchBaseline)throw Error('One global accepted history unit');a.redo();a.beginEdit(0);a.rollbackEdit();
  });
  // Disposal during a clean switch must not resume the new session.
  assert(await page.evaluate(()=>{const {adapter:a,map}=__drawing;a.beginEdit(0);a.on('select',()=>map.remove());return a.beginEdit('other')===false&&a.getState().destroyed&&!a.getState().editSession;}),'Clean switch removal boundary');
 }
 assert(!errors.length,errors.join('; '));return 'CLEAN_SWITCH_OK';
}
