async page => {
 const check=(v,m)=>{if(!v)throw Error(m);};
 for(const width of [1200,375])for(const kind of ['line','path','holes']){
  await page.setViewportSize({width,height:1000});await page.reload();await page.waitForFunction(()=>window.__drawingReady);
  await page.locator('#map canvas').scrollIntoViewIfNeeded();
  await page.evaluate(kind=>{
   const{map,adapter:a}=__drawing;map.jumpTo({bearing:31,pitch:40});const b=map.getCanvas().getBoundingClientRect();
   const p=(x,y)=>{const v=map.unproject([b.width*x,b.height*y]);return[v.lng,v.lat];};
   const ring=[p(.25,.3),p(.6,.3),p(.6,.65),p(.25,.65),p(.25,.3)];
   const hole=[p(.35,.4),p(.35,.5),p(.45,.5),p(.45,.4),p(.35,.4)];
   const coords=kind==='holes'?[ring,hole]:kind==='line'?[ring[0],ring[1]]:[ring[0],ring[1],ring[2]];
   a.setFeatures([{type:'Feature',id:0,foreign:{keep:true},properties:{helperDrawingKind:kind==='holes'?'polygon':kind,helperShape:{foreign:'unknown'},helperStyle:{stroke:{r:12,g:34,b:56,a:.8}}},geometry:{type:kind==='holes'?'Polygon':'LineString',coordinates:coords}}]);
  },kind);
  const start=()=>page.evaluate(()=>{const {map,adapter:a}=__drawing,b=map.getCanvas().getBoundingClientRect(),f=a.getFeatures()[0],coords=f.geometry.type==='Polygon'?f.geometry.coordinates[0]:f.geometry.coordinates,p=map.project(coords[0].map((n,i)=>(n+coords[1][i])/2));return{x:b.x+p.x,y:b.y+p.y};});
  await page.waitForFunction(()=>{const{map,adapter:a}=__drawing;return map.loaded()&&map.isSourceLoaded(a.getState().sourceId);});
  const p=await start();await page.mouse.click(p.x,p.y);await page.locator('#object-tools [data-object-mode="rotate"]').click();
  await page.evaluate(()=>{window.__genericBefore=__drawing.adapter.getFeatures();});
  const q=await start();await page.mouse.move(q.x,q.y);await page.mouse.down();await page.mouse.move(q.x+30,q.y+20,{steps:6});
  check(await page.evaluate(()=>__drawing.adapter.getState().dragging),`${kind} native Rotate`);await page.mouse.up();
  await page.evaluate(kind=>{
   const a=__drawing.adapter,f=a.getFeatures()[0],before=__genericBefore[0];
   if(JSON.stringify(f.geometry)===JSON.stringify(before.geometry))throw Error(kind+' geometry changed');
   if(kind!=='holes'&&a.getDrawingKind()!==kind)throw Error(kind+' semantic kind retained');
   if(JSON.stringify(f.properties)!==JSON.stringify(before.properties)||JSON.stringify(f.foreign)!==JSON.stringify(before.foreign)||f.id!==0)throw Error(kind+' metadata preserved');
   if(kind==='holes'&&(f.geometry.coordinates.length!==2||f.geometry.coordinates.some(r=>JSON.stringify(r[0])!==JSON.stringify(r.at(-1)))))throw Error('holes/closure preserved');
   window.__genericAfter=a.getFeatures();a.undo();if(JSON.stringify(a.getFeatures())!==JSON.stringify(__genericBefore)||a.getCapabilities().actions.undo)throw Error(kind+' one undo');a.redo();if(JSON.stringify(a.getFeatures())!==JSON.stringify(__genericAfter))throw Error(kind+' exact redo');
  },kind);
  // Synthetic cancellation is classified separately from actual native dragging.
  const r=await start();await page.waitForFunction(()=>__drawing.map.isSourceLoaded(__drawing.adapter.getState().sourceId));
  await page.mouse.move(r.x,r.y);await page.mouse.down();await page.mouse.move(r.x+10,r.y+7,{steps:3});
  check(await page.evaluate(()=>__drawing.adapter.getState().dragging),`${kind} cancellation native drag`);
  await page.evaluate(()=>__drawing.map.getCanvas().dispatchEvent(new PointerEvent('pointercancel',{bubbles:true,pointerId:1})));await page.mouse.up();
  check(await page.evaluate(()=>!__drawing.adapter.getState().dragging&&JSON.stringify(__drawing.adapter.getFeatures())===JSON.stringify(__genericAfter)),`${kind} pointercancel exact baseline`);
  const lost=await start();await page.waitForFunction(()=>__drawing.map.isSourceLoaded(__drawing.adapter.getState().sourceId));
  await page.mouse.move(lost.x,lost.y);await page.mouse.down();await page.mouse.move(lost.x+9,lost.y+6,{steps:3});
  check(await page.evaluate(()=>__drawing.adapter.getState().dragging),`${kind} lost-capture native drag`);
  await page.evaluate(()=>__drawing.map.getCanvas().dispatchEvent(new PointerEvent('lostpointercapture',{bubbles:true,pointerId:1})));await page.mouse.up();
  check(await page.evaluate(()=>!__drawing.adapter.getState().dragging&&JSON.stringify(__drawing.adapter.getFeatures())===JSON.stringify(__genericAfter)),`${kind} lostpointercapture exact baseline`);
  await page.evaluate(()=>{const a=__drawing.adapter;let rejected=false;try{a.setFeatures([{type:'Feature',id:'altitude',properties:{},geometry:{type:'Point',coordinates:[1,1,3]}}]);}catch(_){rejected=true;}if(!rejected||JSON.stringify(a.getFeatures())!==JSON.stringify(__genericAfter))throw Error('strict 2D rejection atomic');});
 }
 return 'GENERIC_ROTATION_OK';
}
