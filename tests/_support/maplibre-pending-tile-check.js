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
      const map=__pendingMap; let styleEvents=0; map.on('styledata',()=>styleEvents++);
      const adapter=__pendingFactory(map,{idPrefix:'pending-check',features:[{type:'Feature',id:0,properties:{},geometry:{type:'Point',coordinates:[0,0]}}]});
      window.__pendingAdapter=adapter;
      return {pending:!map.isStyleLoaded(),source:!!map.getSource('pending-check-data'),layers:['fill','line','point','vertex'].every(name=>!!map.getLayer('pending-check-'+name)),id:adapter.getFeatures()[0].id};
    });
    if (!result.pending || !result.source || !result.layers || result.id!==0) throw Error('Pending-tile synchronous hydration failed: '+JSON.stringify(result));
    await page.waitForFunction(() => __pendingMap.queryRenderedFeatures({layers:['pending-check-point']}).some(f=>f.properties.__helperId==='0'));
    await page.evaluate(() => { __pendingAdapter.destroy(); __pendingMap.remove(); __pendingContainer.remove(); });
  }
  await page.unrouteAll({behavior:'ignoreErrors'});
  if(errors.length) throw Error(errors.join('; '));
  return 'PENDING_TILE_OK';
}
