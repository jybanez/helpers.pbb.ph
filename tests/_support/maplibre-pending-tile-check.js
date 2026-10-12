async (page) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  let pending = 0;
  await page.route('**/held-drawing-tile/**', route => { pending++; });
  for (const width of [1200, 375]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.reload(); await page.waitForFunction(() => window.__drawingReady);
    await page.evaluate(async () => {
      const { uiLoader } = await import('/js/ui/ui.loader.js');
      uiLoader.setPreferBundles(new URLSearchParams(location.search).has('bundle'));
      const createAdapter = await uiLoader.get('ui.map.drawing.maplibre');
      const container = document.createElement('div'); container.style.cssText = 'position:fixed;inset:0;z-index:9999'; document.body.append(container);
      const map = new maplibregl.Map({ container, center:[0,0], zoom:2, style:{ version:8, sources:{ base:{type:'raster',tiles:[location.origin+'/held-drawing-tile/{z}/{x}/{y}.png'],tileSize:256} }, layers:[{id:'base',type:'raster',source:'base'}] } });
      window.__pendingMap = map; window.__pendingContainer = container;
      await new Promise(resolve => map.once('style.load', resolve));
      // Invoke after the event has completed and a real base tile is requested.
      window.__pendingFactory = createAdapter;
    });
    await page.waitForFunction(() => __pendingMap.getStyle() && !__pendingMap.isStyleLoaded());
    await page.waitForTimeout(200);
    if (!pending) throw Error('No actual tile request held');
    const result = await page.evaluate(() => {
      const map=__pendingMap;
      const adapter=__pendingFactory(map,{idPrefix:'pending-check',features:[{type:'Feature',id:0,properties:{},geometry:{type:'Point',coordinates:[0,0]}}]});
      window.__pendingAdapter=adapter;
      return {pending:!map.isStyleLoaded(),source:!!map.getSource('pending-check-data'),layers:['fill','line','point','vertex'].every(name=>!!map.getLayer('pending-check-'+name)),id:adapter.getFeatures()[0].id};
    });
    if (!result.pending || !result.source || !result.layers || result.id!==0) throw Error('Pending-tile synchronous hydration failed: '+JSON.stringify(result));
    await page.waitForFunction(() => __pendingMap.queryRenderedFeatures({layers:['pending-check-point']}).some(f=>f.properties.__helperId==='0'));
    await page.evaluate(() => {
      const a=__pendingAdapter, map=__pendingMap;
      let rejected=false; try { __pendingFactory(map,{idPrefix:'pending-check'}); } catch(error) { rejected=/IDs already exist/.test(error.message); }
      if(!rejected) throw Error('Duplicate resource IDs not rejected');
      if(!a.beginEdit(0) || !a.updateFeature(0,{geometry:{type:'Point',coordinates:[1,1]}}) || !a.acceptEdit() || map.isStyleLoaded()) throw Error('Edit while tiles pending failed');
    });
    await page.waitForFunction(() => __pendingMap.queryRenderedFeatures({layers:['pending-check-point']}).some(f=>f.geometry.coordinates[0] > .9));
    await page.evaluate(() => {
      __pendingAdapter.destroy();
      if(__pendingMap.getSource('pending-check-data') || __pendingMap.getLayer('pending-check-point')) throw Error('Destroy leaked resources');
      __pendingMap.remove(); __pendingContainer.remove();
    });
    for(const lifecycle of ['ready','destroy','remove']) {
      let heldStyle;
      await page.route('**/held-drawing-style.json',route=>{heldStyle=route;});
      const before=await page.evaluate(lifecycle=>{
        const container=document.createElement('div');container.style.cssText='position:fixed;inset:0;z-index:9999';document.body.append(container);
        const map=new maplibregl.Map({container,style:location.origin+'/held-drawing-style.json',center:[0,0],zoom:2});
        const adapter=__pendingFactory(map,{idPrefix:'before-ready',features:[{type:'Feature',id:0,properties:{},geometry:{type:'Point',coordinates:[0,0]}}]});
        window.__early={map,adapter,container}; window.__earlyLoaded=false;map.once('style.load',()=>{window.__earlyLoaded=true;});
        if(lifecycle==='destroy') adapter.destroy();
        if(lifecycle==='remove') map.remove();
        return (!map.getStyle() || !map.getSource('before-ready-data')) && !adapter.getState().dragging;
      },lifecycle);
      if(!before) throw Error('Factory before style readiness acquired resources');
      if(lifecycle==='remove') {
        await page.evaluate(()=>{if(!__early.adapter.getState().destroyed) throw Error('Removal before readiness not disposed');__early.container.remove();});
      } else {
        for(let attempts=0;!heldStyle && attempts<100;attempts++) await page.waitForTimeout(10);
        if(!heldStyle) throw Error('Style request was not actually held');
        await heldStyle.fulfill({contentType:'application/json',body:JSON.stringify({version:8,sources:{},layers:[]})});
        await page.waitForFunction(()=>__earlyLoaded);
        await page.evaluate(lifecycle=>{
          const {map,adapter,container}=__early;
          if(lifecycle==='ready') {
            if(!map.getSource('before-ready-data') || !map.getLayer('before-ready-point') || adapter.getFeatures()[0].id!==0) throw Error('Deferred hydration missing');
            map.fire('style.load');map.fire('styledata');
            if(map.getStyle().layers.filter(l=>l.id==='before-ready-point').length!==1) throw Error('Repeated style events duplicated resources');
          } else if(map.getSource('before-ready-data') || !adapter.getState().destroyed) throw Error('Destroyed adapter rehydrated');
          adapter.destroy();map.remove();container.remove();
        },lifecycle);
      }
      await page.unroute('**/held-drawing-style.json');
    }
  }
  await page.unrouteAll({behavior:'ignoreErrors'});
  if(errors.length) throw Error(errors.join('; '));
  return 'PENDING_TILE_OK';
}
