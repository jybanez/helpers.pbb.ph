async page => {
 for(const width of [1200,375])for(const boundary of ['seam','polar']){
  await page.setViewportSize({width,height:1000});await page.reload();await page.waitForFunction(()=>window.__drawingReady);
  await page.locator('#map canvas').scrollIntoViewIfNeeded();
  await page.evaluate(boundary=>{const{map,adapter:a}=__drawing;map.jumpTo({center:boundary==='seam'?[179.5,0]:[0,84.8],zoom:4,bearing:0,pitch:0});a.setFeatures([{type:'Feature',id:0,properties:{retained:true,helperDrawingKind:'line'},geometry:{type:'LineString',coordinates:boundary==='seam'?[[179.5,-5],[179.5,5]]:[[-10,84.8],[10,84.8]]}}]);},boundary);
  const pos=coordinate=>page.evaluate(c=>{const{map}=__drawing,b=map.getCanvas().getBoundingClientRect(),p=map.project(c);return{x:b.x+p.x,y:b.y+p.y};},coordinate);
  // MapLibre increases constrained zoom near the pole; keep the grab point inside a mobile canvas.
  const coordinate=boundary==='seam'?[179.5,4]:[2,84.8];
  await page.waitForFunction(c=>{const{map,adapter:a}=__drawing;return map.isSourceLoaded(a.getState().sourceId)&&map.queryRenderedFeatures(map.project(c),{layers:a.getState().layerIds.slice(0,3)}).some(f=>f.properties.__helperId==='0');},coordinate);
  const selected=await pos(coordinate);await page.mouse.click(selected.x,selected.y);
  if(!await page.evaluate(()=>__drawing.adapter.getState().selectedFeatureId==='0'))throw Error('boundary selection '+JSON.stringify(await page.evaluate(({selected,boundary})=>{const{map,adapter:a}=__drawing;return{boundary,selected,width:innerWidth,box:map.getCanvas().getBoundingClientRect().toJSON(),element:document.elementFromPoint(selected.x,selected.y)?.outerHTML.slice(0,200),state:a.getState(),caps:a.getCapabilities()};},{selected,boundary})));
  await page.locator('#object-tools [data-object-mode="rotate"]').click();
  await page.evaluate(()=>{window.__boundaryBefore=JSON.stringify(__drawing.adapter.getFeatures());});
  const from=await pos(coordinate),to=await pos(boundary==='seam'?[179.8,0]:[0,84.9]);
  await page.mouse.move(from.x,from.y);await page.mouse.down();
  if(!await page.evaluate(()=>__drawing.adapter.getState().dragging))throw Error(boundary+' native boundary gesture');
  // A single invalid angular preview must reject the whole geometry, with no intermediate valid movement.
  await page.mouse.move(to.x,to.y);
  if(!await page.evaluate(()=>JSON.stringify(__drawing.adapter.getState().features)===__boundaryBefore&&JSON.stringify(__drawing.adapter.getFeatures())===__boundaryBefore))throw Error(boundary+' invalid preview atomic');
  await page.mouse.up();
  if(!await page.evaluate(()=>!__drawing.adapter.getState().dragging&&!__drawing.adapter.getCapabilities().actions.undo&&JSON.stringify(__drawing.adapter.getFeatures())===__boundaryBefore))throw Error(boundary+' rejected gesture no history');
 }
 return 'ROTATION_BOUNDARY_OK';
}
