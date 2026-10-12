async page=>{
 const check=(v,m)=>{if(!v)throw Error(m);};
 for(const width of [1200,375])for(const edge of ['seam','polar']){
  await page.setViewportSize({width,height:1000});await page.reload();await page.waitForFunction(()=>window.__drawingReady);await page.locator('#map canvas').scrollIntoViewIfNeeded();
  await page.evaluate(edge=>{const{map,adapter:a}=__drawing;map.jumpTo({center:edge==='seam'?[179.75,0]:[0,85.01],zoom:8});const ring=edge==='seam'?[[179.65,-.05],[179.85,-.05],[179.85,.05],[179.65,.05],[179.65,-.05]]:[[-.1,84.99],[.1,84.99],[.1,85.03],[-.1,85.03],[-.1,84.99]];a.setFeatures([{type:'Feature',id:0,properties:null,geometry:{type:'Polygon',coordinates:[ring]}}]);window.__base=JSON.stringify(a.getFeatures());},edge);
  const p=await page.evaluate(()=>{const{map}=__drawing,c=map.getCenter(),p=map.project(c),b=map.getCanvas().getBoundingClientRect();window.__p=[p.x,p.y];return{x:b.x+p.x,y:b.y+p.y};});
  const ready=()=>page.waitForFunction(()=>{const{map,adapter:a}=__drawing;return map.isSourceLoaded(a.getState().sourceId)&&map.queryRenderedFeatures(__p,{layers:a.getState().layerIds.slice(0,2)}).some(f=>f.properties.__helperId==='0');});
  const start=async()=>{await ready();await page.mouse.click(p.x,p.y);await page.mouse.move(p.x,p.y);await page.mouse.down();check(await page.evaluate(()=>__drawing.adapter.getState().dragging),'boundary starts');};
  const move=pixels=>page.mouse.move(p.x+(edge==='seam'?pixels:0),p.y-(edge==='polar'?pixels:0),{steps:1});
  await start();await move(4);const valid=await page.evaluate(()=>JSON.stringify(__drawing.adapter.getState().features));check(valid!==await page.evaluate(()=>__base),'valid move');await move(150);check(await page.evaluate(valid=>JSON.stringify(__drawing.adapter.getState().features)===valid,valid),'atomic last valid');await move(3);check(await page.evaluate(valid=>JSON.stringify(__drawing.adapter.getState().features)!==valid,valid),'recover valid');await move(150);await page.mouse.up();
  await page.evaluate(()=>{const a=__drawing.adapter;a.undo();if(JSON.stringify(a.getFeatures())!==__base)throw Error('boundary undo');a.setFeatures(a.getFeatures());});
  await start();await move(150);await page.mouse.up();check(await page.evaluate(()=>JSON.stringify(__drawing.adapter.getFeatures())===__base&&!__drawing.adapter.getCapabilities().actions.undo),'rejected no history');
  await start();await page.mouse.up();check(await page.evaluate(()=>JSON.stringify(__drawing.adapter.getFeatures())===__base&&!__drawing.adapter.getCapabilities().actions.undo),'no-op no history');
 }
 return 'POLYGON_BOUNDARY_OK';
}
