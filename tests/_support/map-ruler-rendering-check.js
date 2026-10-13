async page => {
  await page.waitForFunction(() => window.__rulerDemo && __rulerDemo.map.isStyleLoaded());
  const errors = [], pending = [];
  await page.evaluate(() => { window.__rulerRenderErrors = []; __rulerDemo.ruler.update({ onError: error => __rulerRenderErrors.push(error.message) }); });
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/pending-ruler-tile/**', route => { pending.push(route); });
  const kind = new URL(page.url()).search.includes('bundle') ? 'bundle' : 'source';
  const visible = async (phase, screenshot) => {
    await page.waitForFunction(phase => {
      const { map, ruler } = __rulerDemo, state = ruler.getState(), target = state.end || state.preview;
      const style = map.getStyle(); if (!style) return false;
      const ids = style.layers.filter(layer => layer.id.startsWith('helper-ruler-')).map(layer => layer.id);
      const line = ids.find(id => id.endsWith('-line')), points = ids.find(id => id.endsWith('-points'));
      if (state.phase !== phase || !line || !points || !target || !map.queryRenderedFeatures({ layers: [line] }).length) return false;
      return [state.start, target].every(coordinate => {
        const p = map.project(coordinate);
        return map.queryRenderedFeatures([[p.x - 8, p.y - 8], [p.x + 8, p.y + 8]], { layers: [points] }).length > 0;
      });
    }, phase);
    if (screenshot) await page.locator('.map-wrap').screenshot({ path: `output/playwright/ruler-render-${kind}-${screenshot}.png` });
  };
  try {
    for (const width of [1200, 375]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.evaluate(() => {
        const { map, ruler } = __rulerDemo; ruler.deactivate(); map.stop(); map.resize();
        if (!window.__rulerRepaint) { window.__rulerRepaint = () => map.triggerRepaint(); map.on('render', __rulerRepaint); }
        map.jumpTo({ center: [123.8854, 10.3157], zoom: 12, pitch: 50, bearing: 31 });
        if (!map.getSource('pending-raster')) {
          map.addSource('pending-raster', { type: 'raster', tiles: [location.origin + '/pending-ruler-tile/raster/{z}/{x}/{y}.png'], tileSize: 256 });
          map.addLayer({ id: 'pending-raster', type: 'raster', source: 'pending-raster' });
        }
        if (!map.getSource('pending-dem')) map.addSource('pending-dem', { type: 'raster-dem', tiles: [location.origin + '/pending-ruler-tile/dem/{z}/{x}/{y}.png'], tileSize: 256, encoding: 'mapbox' });
        map.setTerrain({ source: 'pending-dem', exaggeration: 1 });
      });
      await page.waitForFunction(() => !__rulerDemo.map.isStyleLoaded());
      await page.getByRole('button', { name: 'Measure straight-line distance', exact: true }).click();
      await page.waitForFunction(() => __rulerDemo.ruler.getState().active);
      await page.locator('.maplibregl-canvas').scrollIntoViewIfNeeded();
      const box = await page.locator('.maplibregl-canvas').boundingBox();
      const a = { x: box.x + box.width * .4, y: box.y + box.height * .4 }, b = { x: box.x + box.width * .6, y: box.y + box.height * .6 };
      await page.mouse.click(a.x, a.y); await page.mouse.move(b.x, b.y);
      await visible('preview', `${width}-preview`);
      await page.mouse.click(b.x, b.y); await visible('complete', `${width}-fixed`);
      if (await page.evaluate(() => __rulerDemo.map.isStyleLoaded())) throw Error('pending tile guard was not exercised');
      // Incremental replacement removes runtime resources without style.load.
      await page.evaluate(() => {
        const { map } = __rulerDemo, style = map.getStyle();
        style.layers = style.layers.filter(layer => !layer.id.startsWith('helper-ruler-'));
        for (const id of Object.keys(style.sources)) if (id.startsWith('helper-ruler-')) delete style.sources[id];
        map.setStyle(style);
      });
      await visible('complete', `${width}-diff-restored`);
      // Full replacement also retains the measurement while tiles remain held.
      await page.evaluate(() => {
        const { map } = __rulerDemo, style = map.getStyle();
        style.layers = style.layers.filter(layer => !layer.id.startsWith('helper-ruler-'));
        for (const id of Object.keys(style.sources)) if (id.startsWith('helper-ruler-')) delete style.sources[id];
        map.setStyle(style, { diff: false });
      });
      await visible('complete', `${width}-full-restored`);
      await page.evaluate(async () => {
        const { map } = __rulerDemo; let writes = 0;
        const id = Object.keys(map.getStyle().sources).find(id => id.startsWith('helper-ruler-')), source = map.getSource(id), original = source.setData;
        source.setData = function(...args) { writes++; return original.apply(this, args); };
        for (let i = 0; i < 100; i++) map.fire('styledata');
        await Promise.resolve(); source.setData = original;
        if (writes !== 0 || map.getStyle().layers.filter(layer => layer.id.startsWith('helper-ruler-')).length !== 2) throw Error('styledata feedback loop/duplicate layers');
      });
      await page.evaluate(() => { __rulerDemo.map.setTerrain(null); __rulerDemo.map.jumpTo({ pitch: 0, bearing: 0 }); });
      await visible('complete');
      await page.evaluate(() => { __rulerDemo.map.setTerrain({ source: 'pending-dem', exaggeration: 1 }); __rulerDemo.map.jumpTo({ pitch: 50, bearing: 31 }); });
      await visible('complete');
      await page.getByRole('button', { name: 'Exit ruler', exact: true }).click();
      await page.evaluate(() => {
        const { map } = __rulerDemo;
        if (Object.keys(map.getStyle().sources).some(id => id.startsWith('helper-ruler-'))) throw Error('ruler resources survived exit');
      });
    }
    const renderErrors = await page.evaluate(() => __rulerRenderErrors);
    if (pending.length === 0 || errors.length || renderErrors.length) throw Error(JSON.stringify({ pending: pending.length, errors, renderErrors }));
    // A missing style must permit cancellation/teardown and later installation.
    await page.evaluate(async () => {
      const host = document.createElement('div'); host.style.cssText = 'width:320px;height:320px'; document.body.appendChild(host);
      const result = document.createElement('div'); document.body.appendChild(result);
      const map = new maplibregl.Map({ container: host, style: null, attributionControl: false });
      const ruler = __rulerDemo.createRuler(result, { map });
      await ruler.activate(); ruler.deactivate(); await ruler.activate();
      await new Promise(resolve => { map.once('style.load', resolve); map.setStyle({ version: 8, sources: {}, layers: [] }); });
      if (!Object.keys(map.getStyle().sources).some(id => id.startsWith('helper-ruler-'))) throw Error('late style install');
      const layerIds = map.getStyle().layers.map(layer => layer.id);
      if (layerIds.length !== 2 || new Set(layerIds).size !== 2) throw Error('duplicate resources');
      ruler.destroy(); map.remove(); host.remove(); result.remove();
    });
    const desktopPage = page;
    const context = await page.context().browser().newContext({ viewport: { width: 375, height: 1000 }, hasTouch: true, isMobile: true });
    try {
      page = await context.newPage(); await page.route('**/pending-ruler-tile/**', route => { pending.push(route); });
      await page.goto(desktopPage.url()); await page.waitForFunction(() => window.__rulerDemo && __rulerDemo.map.isStyleLoaded());
      await page.evaluate(() => {
        const { map } = __rulerDemo;
        map.addSource('touch-pending-dem', { type: 'raster-dem', tiles: [location.origin + '/pending-ruler-tile/touch-dem/{z}/{x}/{y}.png'], tileSize: 256 });
        map.setTerrain({ source: 'touch-pending-dem', exaggeration: 1 }); map.jumpTo({ pitch: 50, bearing: 31 });
      });
      await page.getByRole('button', { name: 'Measure straight-line distance', exact: true }).tap();
      await page.waitForFunction(() => __rulerDemo.ruler.getState().active);
      await page.locator('.maplibregl-canvas').scrollIntoViewIfNeeded();
      const box = await page.locator('.maplibregl-canvas').boundingBox();
      await page.touchscreen.tap(box.x + box.width * .4, box.y + box.height * .4);
      await page.touchscreen.tap(box.x + box.width * .6, box.y + box.height * .6);
      await visible('complete', 'touch-pending');
      if (await page.evaluate(() => __rulerDemo.map.isStyleLoaded())) throw Error('touch pending tiles not exercised');
    } finally { await context.close(); page = desktopPage; }
    if (errors.length) throw Error(errors.join(';'));
    await page.evaluate(() => { __rulerDemo.map.off('render', __rulerRepaint); __rulerDemo.ruler.destroy(); __rulerDemo.map.remove(); });
    return 'RULER_RENDERING_OK';
  } finally { for (const route of pending) { try { await route.abort(); } catch {} } await page.unroute('**/pending-ruler-tile/**'); }
}
