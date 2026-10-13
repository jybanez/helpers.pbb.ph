async page => {
  const kind = page.url().includes('bundle') ? 'bundle' : 'source', errors = [];
  page.on('pageerror', e => errors.push(e.message));
  let stage = 'boot';
  try {
  await page.setViewportSize({ width: 1200, height: 1100 });
  await page.waitForFunction(() => window.__drawingReady);
  await page.evaluate(() => { window.__pinMapErrors = []; __drawing.map.on('error', e => __pinMapErrors.push(e.error?.message || String(e))); });
  await page.evaluate(() => { window.__pinStorage = JSON.stringify({ ...localStorage }); __drawing.adapter.setFeatures([]); __drawing.map.jumpTo({ center: [0, 0], zoom: 5, pitch: 0, bearing: 0 }); });
  await page.getByRole('button', { name: 'Pin', exact: true }).click();
  await page.locator('.maplibregl-canvas').scrollIntoViewIfNeeded();
  const canvas = await page.locator('.maplibregl-canvas').boundingBox();
  await page.mouse.click(canvas.x + canvas.width / 2, canvas.y + canvas.height / 2);
  await page.waitForFunction(() => __drawing.adapter.getPinBounds().length === 1);
  await page.evaluate(() => { const f = __drawing.adapter.getFeatures()[0]; if (f.geometry.type !== 'Point' || f.properties.helperDrawingKind !== 'pin') throw Error('pin metadata'); window.__pinId = f.id; window.__pinAnchor = f.geometry.coordinates; });
  await page.getByRole('button', { name: 'Select', exact: true }).click();
  let handle = await page.evaluate(() => { const b = __drawing.adapter.getPinBounds()[0], c = __drawing.map.getCanvas().getBoundingClientRect(); return { x: c.x + (b.left + b.right) / 2, y: c.y + (b.top + b.bottom) / 2 }; });
  await page.mouse.click(handle.x, handle.y);
  await page.evaluate(() => { if (__drawing.adapter.getState().selectedFeatureId !== __pinId) throw Error('pin selection'); });
  await page.locator('#fill-color input[type="color"]').fill('#dc2846');
  await page.getByRole('slider', { name: 'Fill opacity', exact: true }).focus(); await page.keyboard.press('End');
  await page.waitForFunction(() => __drawing.adapter.getFeatures()[0].properties.helperStyle?.fill?.r === 220);
  await page.locator('.maplibregl-canvas').scrollIntoViewIfNeeded();
  handle = await page.evaluate(() => { const b = __drawing.adapter.getPinBounds()[0], c = __drawing.map.getCanvas().getBoundingClientRect(); return { x: c.x + (b.left + b.right) / 2, y: c.y + (b.top + b.bottom) / 2 }; });
  await page.mouse.move(handle.x, handle.y); await page.mouse.down(); await page.mouse.move(handle.x + 30, handle.y + 20, { steps: 8 });
  await page.waitForFunction(() => __drawing.adapter.getState().dragging && __drawing.adapter.getPinBounds().length === 1);
  await page.evaluate(() => { if (JSON.stringify(__drawing.adapter.getState().features[0].geometry.coordinates) === JSON.stringify(__pinAnchor)) throw Error('continuous pin movement'); });
  await page.mouse.up();
  await page.evaluate(() => { const a = __drawing.adapter; if (a.getState().dragging || JSON.stringify(a.getFeatures()[0].geometry.coordinates) === JSON.stringify(__pinAnchor)) throw Error('native pin drag'); a.undo(); if (JSON.stringify(a.getFeatures()[0].geometry.coordinates) !== JSON.stringify(__pinAnchor)) throw Error('pin undo'); a.redo(); });
  for (const [zoom, pitch, bearing] of [[5, 0, 0], [12, 50, 31], [8, 60, 85], [8, 80, 150]]) {
    await page.evaluate(({ zoom, pitch, bearing }) => { const { map, adapter } = __drawing; map.jumpTo({ center: adapter.getFeatures()[0].geometry.coordinates, zoom, pitch, bearing }); }, { zoom, pitch, bearing });
    await page.waitForFunction(() => { const b = __drawing.adapter.getPinBounds()[0], p = __drawing.map.project(__drawing.adapter.getFeatures()[0].geometry.coordinates); return b && Math.abs(b.bottom - b.top - 32) < .5 && Math.hypot(b.tip.x - p.x, b.tip.y - p.y) < .5; });
    await page.locator('.maplibregl-canvas').screenshot({ path: `output/playwright/pin-${kind}-${zoom}-${pitch}-${bearing}.png` });
  }
  await page.evaluate(async () => {
    const { adapter, map } = __drawing;
    const pin = adapter.getFeatures()[0]; pin.id = 0; pin.properties.ownerMetadata = { keep: true };
    adapter.setFeatures([pin, { type: 'Feature', id: 'plain', properties: {}, geometry: { type: 'Point', coordinates: [pin.geometry.coordinates[0] + 5, pin.geometry.coordinates[1]] } }]);
    adapter.setMode('select'); map.fire('click', { point: map.project(pin.geometry.coordinates), lngLat: map.getCenter() });
    const loader = await import('/js/ui/ui.loader.js?v=0.21.315'); if (location.search.includes('bundle')) loader.uiLoader.setPreferBundles(true);
    const create = await loader.uiLoader.get('ui.map.pin'); window.__readonlyPin = create(map, { id: 'readonly-pin-test', features: [pin] });
    const saved = adapter.getFeatures(); adapter.setFeatures(saved); if (saved[0].id !== 0 || !saved[0].properties.ownerMetadata.keep || saved[1].properties.helperDrawingKind) throw Error('zero id/roundtrip/plain distinction');
    map.setStyle({ version: 8, sources: {}, layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#20344a' } }] }, { diff: false });
  });
  await page.waitForFunction(() => __drawing.adapter.getPinBounds()[0]?.featureId === '0' && __readonlyPin.getBounds().length === 1);
  const zero = await page.evaluate(() => { const b = __drawing.adapter.getPinBounds()[0], c = __drawing.map.getCanvas().getBoundingClientRect(); return { x: c.x + (b.left + b.right) / 2, y: c.y + (b.top + b.bottom) / 2 }; });
  await page.mouse.click(zero.x, zero.y);
  await page.evaluate(() => { if (__drawing.adapter.getState().selectedFeatureId !== '0') throw Error('native numeric-zero pin selection'); });
  await page.evaluate(() => { const features = __drawing.adapter.getFeatures(); __readonlyPin.update(features, { visible: false }); __readonlyPin.update(features); if (__readonlyPin.getBounds().length || __readonlyPin.hitTest({ x: 0, y: 0 }, 9999)) throw Error('readonly visibility'); __readonlyPin.destroy(); __readonlyPin.destroy(); if (__drawing.map.getLayer('readonly-pin-test')) throw Error('readonly teardown'); });
  await page.evaluate(() => { const a = __drawing.adapter; a.setMode('select'); const token = a.beginStyleChange(0); if (!token) throw Error('zero pin color transaction'); const original = JSON.stringify(a.getFeatures()); a.previewStyle({ fill: { r: 0, g: 255, b: 0, a: 1 } }, token); a.cancelStyleChange(token); if (JSON.stringify(a.getFeatures()) !== original) throw Error('pin color rollback'); });
  await page.locator('#confirm-delete').uncheck();
  await page.locator('#object-tools [aria-label="Delete selected drawing"]').click();
  await page.evaluate(() => { const a = __drawing.adapter; if (a.getFeatures().some(f => f.id === 0)) throw Error('zero pin delete'); a.undo(); if (!a.getFeatures().some(f => f.id === 0 && f.properties.ownerMetadata.keep)) throw Error('zero pin restore'); a.setMode('select'); });
  await page.locator('.maplibregl-canvas').scrollIntoViewIfNeeded(); await page.waitForFunction(() => __drawing.adapter.getPinBounds().length === 1);
  const cancelHandle = await page.evaluate(() => { const b = __drawing.adapter.getPinBounds()[0], c = __drawing.map.getCanvas().getBoundingClientRect(); window.__cancelPin = structuredClone(__drawing.adapter.getState().features); __drawing.map.scrollZoom.disable(); return { x: c.x + (b.left + b.right) / 2, y: c.y + (b.top + b.bottom) / 2 }; });
  await page.mouse.click(cancelHandle.x, cancelHandle.y); await page.mouse.move(cancelHandle.x, cancelHandle.y); await page.mouse.down(); await page.mouse.move(cancelHandle.x + 16, cancelHandle.y + 10, { steps: 4 });
  await page.evaluate(() => { const { map, adapter } = __drawing; if (!adapter.getState().dragging) throw Error('pin cancellation capture'); map.getCanvas().dispatchEvent(new PointerEvent('pointercancel', { pointerId: 1, bubbles: true })); if (adapter.getState().dragging || JSON.stringify(adapter.getState().features) !== JSON.stringify(__cancelPin) || !map.dragPan.isEnabled() || map.scrollZoom.isEnabled()) throw Error('pin rollback/restoration'); map.scrollZoom.enable(); }); await page.mouse.up();
  await page.mouse.move(cancelHandle.x, cancelHandle.y); await page.mouse.down(); await page.mouse.move(cancelHandle.x + 18, cancelHandle.y + 12, { steps: 4 });
  await page.evaluate(() => __drawing.map.setStyle({ version: 8, sources: {}, layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#20344a' } }] }, { diff: false }));
  await page.mouse.up(); await page.waitForFunction(() => !__drawing.adapter.getState().dragging && __drawing.adapter.getPinBounds().length === 1);
  await page.evaluate(() => { if (JSON.stringify(__drawing.adapter.getState().features) !== JSON.stringify(__cancelPin) || !__drawing.map.dragPan.isEnabled()) throw Error('style drag rollback'); });
  const navigation = await page.locator('.maplibregl-canvas').boundingBox(), centerBefore = await page.evaluate(() => __drawing.map.getCenter().toArray());
  await page.mouse.move(navigation.x + 40, navigation.y + 40); await page.mouse.down(); await page.mouse.move(navigation.x + 85, navigation.y + 65, { steps: 8 }); await page.mouse.up();
  await page.evaluate(centerBefore => { const { map, adapter } = __drawing; map.stop(); if (JSON.stringify(map.getCenter().toArray()) === JSON.stringify(centerBefore) || JSON.stringify(adapter.getState().features) !== JSON.stringify(__cancelPin)) throw Error('off-target pin navigation'); }, centerBefore);
  stage = 'terrain elevation';
  // Real DEM requests with a generated constant 120m tile, not a mocked elevation API.
  const dem = await page.evaluate(() => { const c = document.createElement('canvas'); c.width = c.height = 256; const ctx = c.getContext('2d'); ctx.fillStyle = 'rgb(1,139,80)'; ctx.fillRect(0, 0, 256, 256); return c.toDataURL().split(',')[1]; });
  let demRequests = 0;
  await page.route('**/pin-terrain/**', route => { demRequests++; return route.fulfill({ body: Buffer.from(dem, 'base64'), contentType: 'image/png' }); });
  await page.locator('.maplibregl-canvas').scrollIntoViewIfNeeded();
  await page.evaluate(() => { const { map } = __drawing; map.addSource('pin-terrain', { type: 'raster-dem', tiles: [location.origin + '/pin-terrain/{z}/{x}/{y}.png'], tileSize: 256, encoding: 'mapbox' }); map.addSource('pin-ground', { type: 'raster', tiles: [location.origin + '/pin-terrain/{z}/{x}/{y}.png'], tileSize: 256 }); map.addLayer({ id: 'pin-ground', type: 'raster', source: 'pin-ground' }, map.getStyle().layers.find(l => l.id.startsWith('helper-drawing-'))?.id); map.setTerrain({ source: 'pin-terrain', exaggeration: 1.6 }); });
  await page.waitForFunction(() => __drawing.map.isSourceLoaded('pin-terrain') && __drawing.map.getCameraTargetElevation() > 150);
  await page.evaluate(() => { const element = document.createElement('div'); element.style.cssText = 'width:1px;height:1px;opacity:0;pointer-events:none'; window.__pinTipReference = new maplibregl.Marker({ element, anchor: 'center' }).setLngLat(__drawing.adapter.getFeatures()[0].geometry.coordinates).addTo(__drawing.map); });
  await page.waitForFunction(() => { const b = __drawing.adapter.getPinBounds()[0], reference = __pinTipReference.getElement().getBoundingClientRect(), c = __drawing.map.getCanvas().getBoundingClientRect(); return b && Math.hypot(b.tip.x - (reference.x + .5 - c.x), b.tip.y - (reference.y + .5 - c.y)) < 2; });
  await page.evaluate(() => __pinTipReference.remove());
  stage = 'terrain bounds';
  await page.waitForFunction(() => { const b = __drawing.adapter.getPinBounds()[0]; return b && Math.abs(b.bottom - b.top - 32) < .5; });
  await page.locator('.maplibregl-canvas').screenshot({ path: `output/playwright/pin-${kind}-terrain.png` });
  await page.evaluate(() => { const { map } = __drawing; map.setTerrain(null); const style = map.getStyle(); style.layers = style.layers.filter(l => !l.id.startsWith('helper-drawing-')); for (const id of Object.keys(style.sources)) if (id.startsWith('helper-drawing-')) delete style.sources[id]; map.setStyle(style); });
  stage = 'diff restoration';
  await page.waitForFunction(() => __drawing.adapter.getPinBounds().length === 1);
  const context = await page.context().browser().newContext({ viewport: { width: 375, height: 950 }, hasTouch: true, isMobile: true });
  try {
    const mobile = await context.newPage(); mobile.on('pageerror', e => errors.push(e.message)); await mobile.goto(page.url()); await mobile.waitForFunction(() => window.__drawingReady);
    await mobile.evaluate(() => { __drawing.adapter.setFeatures([]); __drawing.map.jumpTo({ center: [0, 0], zoom: 6, pitch: 50, bearing: 31 }); });
    await mobile.getByRole('button', { name: 'Pin', exact: true }).tap(); await mobile.locator('.maplibregl-canvas').scrollIntoViewIfNeeded();
    const c = await mobile.locator('.maplibregl-canvas').boundingBox(); await mobile.touchscreen.tap(c.x + c.width / 2, c.y + c.height / 2);
    await mobile.waitForFunction(() => __drawing.adapter.getPinBounds().length === 1);
    await mobile.getByRole('button', { name: 'Select', exact: true }).tap();
    let h = await mobile.evaluate(() => { const b = __drawing.adapter.getPinBounds()[0], c = __drawing.map.getCanvas().getBoundingClientRect(); return { x: c.x + (b.left + b.right) / 2, y: c.y + (b.top + b.bottom) / 2 }; });
    await mobile.touchscreen.tap(h.x, h.y);
    await mobile.locator('#fill-color input[type="color"]').fill('#12ab34'); await mobile.getByRole('slider', { name: 'Fill opacity', exact: true }).focus(); await mobile.keyboard.press('End');
    await mobile.waitForFunction(() => __drawing.adapter.getFeatures()[0].properties.helperStyle?.fill?.g === 171);
    await mobile.locator('.maplibregl-canvas').scrollIntoViewIfNeeded(); h = await mobile.evaluate(() => { const b = __drawing.adapter.getPinBounds()[0], c = __drawing.map.getCanvas().getBoundingClientRect(); return { x: c.x + (b.left + b.right) / 2, y: c.y + (b.top + b.bottom) / 2 }; });
    const before = await mobile.evaluate(() => __drawing.adapter.getFeatures()[0].geometry.coordinates);
    const cdp = await context.newCDPSession(mobile);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: h.x + 8, y: h.y, id: 0 }] });
    for (let i = 1; i <= 5; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: h.x + 8 + i * 4, y: h.y + i * 3, id: 0 }] });
    await mobile.evaluate(before => { const s = __drawing.adapter.getState(); if (!s.dragging || JSON.stringify(before) === JSON.stringify(s.features[0].geometry.coordinates)) throw Error('touch continuous movement'); }, before);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await mobile.evaluate(before => { const a = __drawing.adapter; if (a.getState().dragging || JSON.stringify(before) === JSON.stringify(a.getFeatures()[0].geometry.coordinates)) throw Error('touch pin move'); if (!__drawing.map.dragPan.isEnabled()) throw Error('touch gesture restore'); }, before);
    await mobile.locator('.maplibregl-canvas').screenshot({ path: `output/playwright/pin-${kind}-touch.png` });
  } finally { await context.close(); }
  const mapErrors = await page.evaluate(() => __pinMapErrors); if (errors.length || mapErrors.length) throw Error([...errors, ...mapErrors].join(';'));
  await page.evaluate(() => { if (JSON.stringify({ ...localStorage }) !== __pinStorage) throw Error('pin storage mutation'); });
  if (kind === 'bundle') {
    const assets = await page.evaluate(() => performance.getEntriesByType('resource').map(r => new URL(r.name).pathname).filter(p => ['/js/ui/', '/css/ui/', '/dist/'].some(prefix => p.startsWith(prefix))));
    if (assets.length !== 3 || assets.some(p => !['/js/ui/ui.loader.js', '/dist/helpers.ui.bundle.min.js', '/dist/helpers.ui.bundle.min.css'].includes(p))) throw Error('pin modular fallback ' + JSON.stringify(assets));
  }
  return 'MAP_PIN_OK';
  } catch (error) {
    await page.screenshot({ path: `output/playwright/pin-${kind}-failure-${Date.now()}.png` });
    throw Error(stage + ': ' + error.message + ' ' + JSON.stringify(await page.evaluate(() => ({ bounds: __drawing?.adapter.getPinBounds(), state: __drawing?.adapter.getState(), terrain: __drawing.map.getTerrain(), sourceLoaded: __drawing.map.getSource('pin-terrain') ? __drawing.map.isSourceLoaded('pin-terrain') : null, elevation: __drawing?.map.queryTerrainElevation(__drawing.adapter.getFeatures()[0]?.geometry.coordinates), errors: window.__pinMapErrors }))));
  }
}
