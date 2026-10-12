async page => {
  const check=(value,message)=>{if(!value)throw Error(message);};
  for(const width of [1200,375]) {
    await page.setViewportSize({width,height:1000});await page.reload();await page.waitForFunction(()=>window.__drawingReady);
    for(const edge of ['seam','polar']) for(const kind of ['circle','rectangle']) {
      await page.locator('#map canvas').scrollIntoViewIfNeeded();
      await page.evaluate(edge=>{const {adapter:a,map}=__drawing;a.setMode('select');a.setFeatures([]);map.jumpTo({center:edge==='seam'?[179.75,0]:[0,85.01],zoom:8,bearing:0,pitch:0});},edge);
      await page.locator(`#tools [data-mode="${kind}"]`).click();
      const points=edge==='seam'?(kind==='circle'?[[179.75,0],[179.85,0]]:[[179.65,-.05],[179.85,.05]]):(kind==='circle'?[[0,85.01],[0,84.985]]:[[-.1,84.99],[.1,85.03]]);
      for(const coordinate of points){const p=await page.evaluate(c=>{const p=__drawing.map.project(c),b=__drawing.map.getCanvas().getBoundingClientRect();return{x:b.x+p.x,y:b.y+p.y};},coordinate);await page.mouse.click(p.x,p.y);}
      check(await page.evaluate(kind=>__drawing.adapter.getDrawingKind()===kind,kind),`${edge} ${kind}: construction`);
      await page.waitForFunction(()=>{const{map,adapter:a}=__drawing,s=a.getFeatures()[0].properties.helperShape,c=s.kind==='circle'?s.center:s.bounds[0].map((n,i)=>(n+s.bounds[1][i])/2),p=map.project(c);return map.queryRenderedFeatures([[p.x-3,p.y-3],[p.x+3,p.y+3]],{layers:a.getState().layerIds.slice(0,2)}).some(f=>f.properties.__helperId===a.getState().selectedFeatureId);});
      const p=await page.evaluate(()=>{const{map,adapter:a}=__drawing;window.__boundaryBase=JSON.stringify(a.getFeatures());const s=a.getFeatures()[0].properties.helperShape,c=s.kind==='circle'?s.center:s.bounds[0].map((n,i)=>(n+s.bounds[1][i])/2),p=map.project(c),b=map.getCanvas().getBoundingClientRect();return{x:b.x+p.x,y:b.y+p.y};});
      await page.mouse.move(p.x,p.y);await page.mouse.down();check(await page.evaluate(()=>__drawing.adapter.getState().dragging),'shape body begins');
      const move=async pixels=>page.mouse.move(p.x+(edge==='seam'?pixels:0),p.y-(edge==='polar'?pixels:0),{steps:1});
      await move(4);if(kind==='circle')check(await page.evaluate(()=>__drawing.adapter.getState().features[0].properties.helperShape.radiusMeters===JSON.parse(__boundaryBase)[0].properties.helperShape.radiusMeters),'whole-circle movement preserves radius');const valid=await page.evaluate(()=>JSON.stringify(__drawing.adapter.getState().features));check(valid!==await page.evaluate(()=>__boundaryBase),'small valid movement');
      await move(150);check(await page.evaluate(valid=>JSON.stringify(__drawing.adapter.getState().features)===valid,valid),'rejected candidate retains last valid preview atomically');
      check(await page.evaluate(()=>JSON.stringify(__drawing.adapter.getFeatures())===__boundaryBase),'gesture preview excluded from committed export');await page.mouse.up();
      await page.evaluate(valid=>{const a=__drawing.adapter;if(JSON.stringify(a.getFeatures())!==valid)throw Error('release retains last valid');a.undo();if(JSON.stringify(a.getFeatures())!==__boundaryBase)throw Error('one undo restores metadata and geometry');a.setFeatures(a.getFeatures());},valid);
      await page.mouse.move(p.x,p.y);await page.mouse.down();await move(150);await page.mouse.up();
      check(await page.evaluate(()=>JSON.stringify(__drawing.adapter.getFeatures())===__boundaryBase&&!__drawing.adapter.getCapabilities().actions.undo),'wholly rejected movement creates no history');
    }
  }
  return 'SHAPE_BOUNDARY_OK';
}
