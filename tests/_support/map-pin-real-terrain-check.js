async page => {
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.setViewportSize({width:1200,height:1100});
  await page.waitForFunction(() => window.__drawingReady);
  await page.evaluate(() => {
    const {map,adapter} = __drawing, coordinate = [123.88621598482132,10.315162060901429];
    window.__realTerrainErrors=[]; map.on('error',e=>__realTerrainErrors.push(e.error?.message||String(e)));
    adapter.setFeatures([{type:'Feature',id:0,properties:{helperDrawingKind:'pin'},geometry:{type:'Point',coordinates:[...coordinate,37]}}]);
    map.jumpTo({center:coordinate,zoom:17,pitch:50,bearing:85});
    map.addSource('real-terrain',{type:'raster-dem',tiles:['https://mapserver.pbb.ph/tiles/terrain/{z}/{x}/{y}.png'],tileSize:256,encoding:'mapbox',maxzoom:14});
    map.addSource('real-ground',{type:'raster',tiles:['https://mapserver.pbb.ph/tiles/terrain/{z}/{x}/{y}.png'],tileSize:256,maxzoom:14});
    map.addLayer({id:'real-ground',type:'raster',source:'real-ground'},map.getStyle().layers.find(l=>l.id.startsWith('helper-drawing-'))?.id);
    map.setTerrain({source:'real-terrain',exaggeration:1.6});
    const element=document.createElement('div');element.style.cssText='width:1px;height:1px;pointer-events:none';
    window.__realReference=new maplibregl.Marker({element,anchor:'center',subpixelPositioning:true}).setLngLat(coordinate).addTo(map);
  });
  try {
    await page.waitForFunction(()=>__drawing.map.isSourceLoaded('real-terrain')&&__drawing.map.getCameraTargetElevation()>1,{},{timeout:60000});
    await page.evaluate(()=>new Promise(resolve=>{let n=0;const tick=()=>{if(++n===20){__drawing.map.off('render',tick);resolve();}else __drawing.map.triggerRepaint();};__drawing.map.on('render',tick);__drawing.map.triggerRepaint();}));
    const result=await page.evaluate(()=>{const {map,adapter}=__drawing,b=adapter.getPinBounds()[0],r=__realReference.getElement().getBoundingClientRect(),c=map.getCanvas().getBoundingClientRect(),p=map.project(adapter.getFeatures()[0].geometry.coordinates);return {tip:b?.tip,reference:{x:r.x+.5-c.x,y:r.y+.5-c.y},project:p,elevation:map.getCameraTargetElevation(),relative:map.queryTerrainElevation(adapter.getFeatures()[0].geometry.coordinates),sourceLoaded:map.isSourceLoaded('real-terrain')};});
    await page.locator('.maplibregl-canvas').screenshot({path:`output/playwright/pin-real-terrain-${page.url().includes('bundle')?'bundle':'source'}.png`});
    if(!result.tip||Math.hypot(result.tip.x-result.reference.x,result.tip.y-result.reference.y)>2)throw Error(JSON.stringify(result));
    for (const transition of ['camera','terrain-off','terrain-on','full-style','diff-style']) {
      await page.evaluate(transition=>{const {map}=__drawing;if(transition==='camera')map.jumpTo({zoom:16,pitch:60,bearing:31});else if(transition==='terrain-off')map.setTerrain(null);else if(transition==='terrain-on')map.setTerrain({source:'real-terrain',exaggeration:1.6});else map.setStyle(map.getStyle(),{diff:transition==='diff-style'});},transition);
      await page.waitForFunction(()=>__drawing.adapter.getPinBounds().length===1);
      await page.evaluate(()=>new Promise(resolve=>{let n=0;const tick=()=>{if(++n===20){__drawing.map.off('render',tick);resolve();}else __drawing.map.triggerRepaint();};__drawing.map.on('render',tick);__drawing.map.triggerRepaint();}));
      const check=await page.evaluate(()=>{const {map,adapter}=__drawing,b=adapter.getPinBounds()[0],r=__realReference.getElement().getBoundingClientRect(),c=map.getCanvas().getBoundingClientRect();return {delta:Math.hypot(b.tip.x-(r.x+.5-c.x),b.tip.y-(r.y+.5-c.y)),height:b.bottom-b.top};});
      if(check.delta>2||Math.abs(check.height-32)>.5)throw Error(transition+': '+JSON.stringify(check));
    }
    result.terrainErrors=await page.evaluate(()=>__realTerrainErrors);
    if(errors.length)throw Error(errors.join(';'));
    return 'PIN_REAL_TERRAIN_OK '+JSON.stringify(result);
  } finally {await page.evaluate(()=>__realReference.remove());}
}
