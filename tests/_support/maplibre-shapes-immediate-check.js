async (page) => {
  const check = (ok, message) => { if (!ok) throw Error(message); }, errors = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const width of [1200, 375]) {
    await page.setViewportSize({ width, height: 1000 }); await page.reload(); await page.waitForFunction(() => window.__drawingReady);
    await page.locator('#map canvas').scrollIntoViewIfNeeded();
    const pos = async (x, y) => { const b = await page.locator('#map canvas').boundingBox(); return { x: b.x + b.width * x, y: b.y + b.height * y }; };
    const click = async (x, y) => { const p = await pos(x, y); await page.mouse.click(p.x, p.y); };
    const mode = name => page.locator(`#tools [data-mode="${name}"]`).click();
    await page.evaluate(() => { __drawing.map.jumpTo({ bearing: 31, pitch: 40 }); __drawing.adapter.setFeatures([]); });
    for (const kind of ['circle', 'rectangle']) {
      await mode(kind); await click(.35, .45); const p = await pos(.65, .65); await page.mouse.move(p.x, p.y);
      check(await page.evaluate(() => { const a = __drawing.adapter, s = a.getState(); return s.preview && s.draft.length === 1 && !a.getCapabilities().canPersist && __drawing.map.getSource(s.sourceId)._data.features.some(f => f.geometry.type === 'Polygon' && f.properties.__helperKind === 'draft'); }), `${kind}: live preview outside persistence`);
      await click(.65, .65);
      check(await page.evaluate(kind => { const a = __drawing.adapter; return a.getMode() === 'select' && a.getDrawingKind() === kind && !a.getState().editSession && a.getCapabilities().canPersist && !document.querySelector('#tools [data-action="finish"]') && !document.querySelector('#tools [data-action="cancel"]'); }, kind), `${kind}: second click completes without object checkpoint`);
      await page.locator('#map').screenshot({path:`output/playwright/shape-${kind}-${new URL(page.url()).searchParams.has('bundle')?'bundle':'source'}-${width}.png`});
      await page.evaluate(() => { const a = __drawing.adapter; window.__shapeBefore = JSON.stringify(a.getFeatures()); a.undo(); a.redo(); if (JSON.stringify(a.getFeatures()) !== __shapeBefore) throw Error('shape redo'); });
      const target = async handle => page.evaluate(handle => {
        const { map, adapter:a } = __drawing, f = a.getFeatures().at(-1), shape = f.properties.helperShape, b = map.getCanvas().getBoundingClientRect();
        const c = handle ? f.geometry.coordinates[0][0] : shape.kind === 'circle' ? shape.center : shape.bounds[0].map((n, i) => (n + shape.bounds[1][i]) / 2), p = map.project(c);
        return { x: b.x + p.x, y: b.y + p.y, id: String(f.id), coordinate: c };
      }, handle);
      const waitForTarget = async (handle, expected) => {
        // Undo/redo updates the model before MapLibre's worker has rendered it.
        // A stale translated corner may hit the overlapping Circle instead.
        await page.waitForFunction(({handle,expected}) => {
          const {map,adapter:a}=__drawing,s=a.getState(),f=a.getFeatures().find(f=>String(f.id)===expected.id);
          if(!f||!map.isSourceLoaded(s.sourceId)||s.selectedFeatureId!==expected.id)return false;
          const shape=f.properties.helperShape,c=handle?f.geometry.coordinates[0][0]:shape.kind==='circle'?shape.center:shape.bounds[0].map((n,i)=>(n+shape.bounds[1][i])/2);
          if(JSON.stringify(c)!==JSON.stringify(expected.coordinate))return false;
          const p=map.project(expected.coordinate);
          const hit=map.queryRenderedFeatures([[p.x-6,p.y-6],[p.x+6,p.y+6]],{layers:s.layerIds.slice(0,3)}).find(h=>h.properties.__helperKind==='feature');
          if(hit?.properties.__helperId!==String(f.id))return false;
          return !handle||map.queryRenderedFeatures({layers:[s.layerIds[3]]}).some(h=>{const q=map.project(h.geometry.coordinates);return Math.hypot(q.x-p.x,q.y-p.y)<1;});
        },{handle,expected});
      };
      const drag = async (handle, release = true) => {
        const p = await target(handle); await waitForTarget(handle,p);
        await page.mouse.move(p.x,p.y); await page.mouse.down();
        const state=await page.evaluate(()=>{const{map,adapter:a}=__drawing,s=a.getState();return{dragging:s.dragging,selected:s.selectedFeatureId,mode:s.mode,camera:{center:map.getCenter().toArray(),zoom:map.getZoom(),bearing:map.getBearing(),pitch:map.getPitch()}};});
        check(state.dragging, `${kind}: actual ${handle ? 'handle' : 'body'} gesture (width ${width}, ${new URL(page.url()).search}, ${JSON.stringify(state)})`);
        await page.mouse.move(p.x+12,p.y-10,{steps:4}); if (release) await page.mouse.up();
      };
      await page.waitForFunction(() => { const {map,adapter:a}=__drawing,f=a.getFeatures().at(-1),shape=f.properties.helperShape,c=shape.kind==='circle'?shape.center:shape.bounds[0].map((n,i)=>(n+shape.bounds[1][i])/2),p=map.project(c);return map.queryRenderedFeatures([[p.x-6,p.y-6],[p.x+6,p.y+6]],{layers:a.getState().layerIds.slice(0,2)}).some(hit=>hit.properties.__helperId===String(f.id)); });
      const body = await target(false); await page.mouse.click(body.x, body.y); await drag(false);
      check(await page.evaluate(() => { const a=__drawing.adapter, before=JSON.parse(__shapeBefore).at(-1), after=a.getFeatures().at(-1); return JSON.stringify(before.geometry)!==JSON.stringify(after.geometry) && (after.properties.helperShape.kind!=='circle' || before.properties.helperShape.radiusMeters===after.properties.helperShape.radiusMeters) && !a.getCapabilities().actions.finish; }), `${kind}: whole-shape move retains shape contract`);
      await page.evaluate(() => { const a=__drawing.adapter; a.undo(); if(JSON.stringify(a.getFeatures())!==__shapeBefore)throw Error('whole move one undo'); });
      await drag(true); check(await page.evaluate(() => JSON.stringify(__drawing.adapter.getFeatures())!==__shapeBefore), `${kind}: resize`);
      await page.evaluate(() => { __drawing.adapter.undo(); if(JSON.stringify(__drawing.adapter.getFeatures())!==__shapeBefore)throw Error('resize one undo'); });
      await page.locator('#map canvas').focus(); await drag(false,false); await page.keyboard.press('Escape'); await page.mouse.up();
      check(await page.evaluate(() => JSON.stringify(__drawing.adapter.getFeatures())===__shapeBefore && !__drawing.adapter.getState().dragging), `${kind}: cancellation keeps earlier draft changes`);
      await page.evaluate(() => { const a=__drawing.adapter, f=a.getFeatures(); a.setFeatures(f); if(JSON.stringify(a.getFeatures())!==JSON.stringify(f) || !['circle','rectangle'].includes(a.getDrawingKind(f.at(-1).id)))throw Error('export/reimport'); });
    }
    await page.evaluate(() => {
      const a=__drawing.adapter, f=a.getFeatures().at(-1); f.id=0; f.geometry.importedData={retained:true}; f.properties.helperStyle={fill:{r:0,g:0,b:0,a:0}}; a.setFeatures([f]);
      window.__styleBase=JSON.stringify(a.getFeatures());
    });
    await page.waitForFunction(()=>{const {adapter:a,map}=__drawing,f=a.getFeatures()[0],shape=f.properties.helperShape,c=shape.kind==='circle'?shape.center:shape.bounds[0].map((n,i)=>(n+shape.bounds[1][i])/2),p=map.project(c);return map.queryRenderedFeatures([[p.x-6,p.y-6],[p.x+6,p.y+6]],{layers:a.getState().layerIds.slice(0,2)}).some(f=>f.properties.__helperId==='0');});
    const selectedPosition=await page.evaluate(()=>{const{map,adapter:a}=__drawing,s=a.getFeatures()[0].properties.helperShape,c=s.kind==='circle'?s.center:s.bounds[0].map((n,i)=>(n+s.bounds[1][i])/2),p=map.project(c),b=map.getCanvas().getBoundingClientRect();return{x:b.x+p.x,y:b.y+p.y};});
    await page.mouse.click(selectedPosition.x,selectedPosition.y);
    const resizeImported=await page.evaluate(()=>{const{map,adapter:a}=__drawing,p=map.project(a.getFeatures()[0].geometry.coordinates[0][0]),b=map.getCanvas().getBoundingClientRect();return{x:b.x+p.x,y:b.y+p.y};});
    await page.mouse.move(resizeImported.x,resizeImported.y);await page.mouse.down();await page.mouse.move(resizeImported.x+10,resizeImported.y-8,{steps:3});await page.mouse.up();
    check(await page.evaluate(()=>__drawing.adapter.getFeatures()[0].geometry.importedData.retained),'Shape resize preserves foreign geometry JSON members');
    await page.evaluate(()=>{__drawing.adapter.undo();if(JSON.stringify(__drawing.adapter.getFeatures())!==__styleBase)throw Error('imported shape resize one undo');});
    await page.evaluate(() => {
      const a=__drawing.adapter; if(a.getState().selectedFeatureId!=='0') throw Error('numeric zero selection');
      let updates=0;const updateOff=a.on('update',()=>updates++);
      const token=a.beginStyleChange(); if(!token)throw Error('style token');
      const reentry=[];const off=a.on('statechange',()=>reentry.push(a.setMode('pan'),a.settleStyleChange({commit:true}),a.destroy()));
      for(let r=1;r<10;r++)a.previewStyle({fill:{r,g:0,b:0,a:0}},token);off();
      if(updates!==0||!reentry.every(v=>v===false)||a.getCapabilities().canPersist||JSON.stringify(a.getFeatures())!==__styleBase)throw Error('preview/reentry/persistence');
      a.finishStyleChange(token);if(updates!==1)throw Error('one committed style event');updateOff();const after=JSON.stringify(a.getFeatures());a.undo();if(JSON.stringify(a.getFeatures())!==__styleBase)throw Error('coalesced style undo');a.redo();if(JSON.stringify(a.getFeatures())!==after)throw Error('style redo');
      const noop=a.beginStyleChange();a.previewStyle(a.getFeatureStyle(),noop);a.finishStyleChange(noop);a.undo();if(JSON.stringify(a.getFeatures())!==__styleBase)throw Error('no-op history');a.redo();
      const start=()=>{const t=a.beginStyleChange();a.previewStyle({fill:{r:200,g:0,b:0,a:1}},t);return t;};
      let t=start();a.setMode('pan');if(a.previewStyle({},t)!==false||a.getMode()!=='pan')throw Error('mode cancellation/stale');a.setMode('select');
      t=start();a.undo();if(JSON.stringify(a.getFeatures())!==after||a.getState().styleChange)throw Error('undo cancels only preview');
      t=start();a.settleStyleChange();if(JSON.stringify(a.getFeatures())!==after)throw Error('dismiss cancellation');
      t=start();a.settleStyleChange({commit:true});if(!a.getCapabilities().canPersist)throw Error('save settlement');a.undo();
      t=start();try{a.setFeatures([{bad:true}]);}catch(_){}if(!a.getState().styleChange)throw Error('invalid import atomic');a.setFeatures(a.getFeatures());if(a.finishStyleChange(t)!==false||JSON.stringify(a.getFeatures())!==after)throw Error('external context stale');
      const legacy=a.getFeatures()[0];legacy.properties.helperShape.radiusMeters=-1;legacy.properties.helperShape.kind='circle';legacy.properties.helperShape.center=[0,0];a.setFeatures([legacy]);if(a.getDrawingKind(0)!=='polygon'||JSON.stringify(a.getFeatures())!==JSON.stringify([legacy]))throw Error('mismatched metadata preservation');
    });
    await mode('circle'); await page.locator('#map canvas').focus(); await page.keyboard.press('Enter');
    await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowDown'); await page.waitForTimeout(350); await page.keyboard.press('Enter');
    check(await page.evaluate(() => __drawing.adapter.getDrawingKind()==='circle' && !__drawing.adapter.getState().draft.length), 'keyboard two-point circle');
    await page.evaluate(()=>{window.__nativeBefore=JSON.stringify(__drawing.adapter.getFeatures());});
    const alpha=page.locator('#fill-color input[type="range"]');await alpha.scrollIntoViewIfNeeded();const range=await alpha.boundingBox();
    await page.mouse.move(range.x+range.width*.22,range.y+range.height/2);await page.mouse.down();await page.mouse.move(range.x+range.width*.65,range.y+range.height/2,{steps:8});
    check(await page.evaluate(()=>__drawing.adapter.getState().styleChange && JSON.stringify(__drawing.adapter.getFeatures())===__nativeBefore),'Native alpha previews are excluded from committed export');await page.mouse.up();
    check(await page.evaluate(()=>!__drawing.adapter.getState().styleChange && JSON.stringify(__drawing.adapter.getFeatures())!==__nativeBefore),'Native alpha release completes');
    await page.evaluate(()=>{const a=__drawing.adapter;a.undo();if(JSON.stringify(a.getFeatures())!==__nativeBefore)throw Error('native alpha one undo');a.redo();});
    await page.evaluate(()=>{const{map,adapter:a}=__drawing,b=map.getCanvas().getBoundingClientRect(),coordinate=(x,y)=>{const p=map.unproject([b.width*x,b.height*y]);return[p.lng,p.lat];};a.setFeatures([{type:'Feature',id:0,properties:{helperStyle:{fill:{r:0,g:0,b:0,a:0}}},geometry:{type:'Point',coordinates:coordinate(.2,.5)}},{type:'Feature',id:'other',properties:{},geometry:{type:'Point',coordinates:coordinate(.8,.5)}}]);});
    await page.locator('#map canvas').scrollIntoViewIfNeeded();
    await page.waitForFunction(()=>{const{map,adapter:a}=__drawing;return a.getFeatures().every(f=>{const p=map.project(f.geometry.coordinates);return map.queryRenderedFeatures([[p.x-6,p.y-6],[p.x+6,p.y+6]],{layers:a.getState().layerIds.slice(0,3)}).some(hit=>hit.properties.__helperId===String(f.id));});});
    const objectPoint=async id=>page.evaluate(id=>{const{map,adapter:a}=__drawing,f=a.getFeatures().find(f=>String(f.id)===String(id)),p=map.project(f.geometry.coordinates),b=map.getCanvas().getBoundingClientRect();return{x:b.x+p.x,y:b.y+p.y};},id);
    let object=await objectPoint(0);await page.mouse.click(object.x,object.y);
    await page.evaluate(()=>{const a=__drawing.adapter;a.updateFeature(0,{style:{fill:{r:1,g:0,b:0,a:0}}});window.__selectionBefore=JSON.stringify(a.getFeatures());window.__cancelledStyle=a.beginStyleChange();a.previewStyle({fill:{r:255,g:0,b:0,a:1}},__cancelledStyle);});
    object=await objectPoint('other');await page.mouse.click(object.x,object.y);
    check(await page.evaluate(()=>{const a=__drawing.adapter;return a.getState().selectedFeatureId==='other' && JSON.stringify(a.getFeatures())===__selectionBefore && !a.getState().styleChange && a.finishStyleChange(__cancelledStyle)===false && a.previewStyle({fill:{r:2,g:0,b:0,a:1}},__cancelledStyle)===false;}),'Actual object switch cancels preview, preserves completed draft and rejects late change');
    check(await page.locator('#tools [data-action="fill"]').isEnabled(),'Point Fill available');
    await mode('pan');check(await page.evaluate(()=>JSON.stringify(__drawing.adapter.getFeatures())===__selectionBefore),'Completed edits survive tool transition');await mode('select');
    await page.evaluate(()=>{const a=__drawing.adapter;const f=a.getFeatures()[0];f.geometry={type:'LineString',coordinates:[f.geometry.coordinates,a.getFeatures()[1].geometry.coordinates]};f.properties.helperDrawingKind='line';a.setFeatures([f]);});
    await page.waitForFunction(()=>{const{map,adapter:a}=__drawing,c=a.getFeatures()[0].geometry.coordinates,p=map.project(c[0]),q=map.project(c[1]);return map.queryRenderedFeatures([[(p.x+q.x)/2-5,(p.y+q.y)/2-5],[(p.x+q.x)/2+5,(p.y+q.y)/2+5]],{layers:a.getState().layerIds.slice(0,2)}).some(f=>f.properties.__helperId==='0');});
    const segment=await page.evaluate(()=>{const{map,adapter:a}=__drawing,c=a.getFeatures()[0].geometry.coordinates,p=map.project(c[0]),q=map.project(c[1]),b=map.getCanvas().getBoundingClientRect();return{x:b.x+(p.x+q.x)/2,y:b.y+(p.y+q.y)/2};});await page.mouse.click(segment.x,segment.y);
    check(await page.locator('#tools [data-action="fill"]').count()===0 && await page.locator('#tools [data-action="stroke"]').isEnabled(),'Line Fill hidden, Stroke available');
    await page.evaluate(()=>{const a=__drawing.adapter,f=a.getFeatures()[0];f.properties.helperDrawingKind='path';a.setFeatures([f]);});
    check(await page.locator('#tools [data-action="fill"]').count()===0,'Path Fill hidden');
    await mode('path');check(await page.locator('#tools [data-action="finish"]').isDisabled() && await page.locator('#tools [data-action="cancel"]').isEnabled(),'Construction Finish remains visible disabled until sufficient vertices');await mode('select');
    await page.locator('#tools').screenshot({path:`output/playwright/shapes-immediate-${new URL(page.url()).searchParams.has('bundle')?'bundle':'source'}-${width}.png`});
    await page.evaluate(() => {const a=__drawing.adapter;window.__removeBefore=JSON.stringify(a.getFeatures());const t=a.beginStyleChange();a.previewStyle({fill:{r:1,g:2,b:3,a:.3}},t);__drawing.map.remove();if(!a.getState().destroyed||a.getState().styleChange||JSON.stringify(a.getFeatures())!==__removeBefore||a.finishStyleChange(t)!==false)throw Error('remove preview cleanup');});
  }
  check(!errors.length,errors.join('; '));return 'SHAPES_IMMEDIATE_OK';
}
