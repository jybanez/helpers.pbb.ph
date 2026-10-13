async page => {
  const url = page.url(), kind = url.includes('bundle') ? 'bundle' : 'source', errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const setup = async p => {
    await p.waitForFunction(() => window.__rulerDemo && __rulerDemo.map.isStyleLoaded());
    await p.evaluate(async () => {
      const { map, ruler } = __rulerDemo; map.stop(); map.resize(); map.jumpTo({ center: [0, 0], zoom: 5, pitch: 50, bearing: 31 });
      await ruler.activate();
      window.__dragErrors = []; ruler.update({ onError: e => __dragErrors.push(e.message) });
      window.__storageBefore = JSON.stringify({ ...localStorage });
      map.addSource('live-drag', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      window.__rippleTimer = setInterval(() => { map.getSource('live-drag')?.setData({ type: 'FeatureCollection', features: [] }); map.triggerRepaint(); }, 50);
    });
    const box = await p.locator('.maplibregl-canvas').boundingBox();
    await p.mouse.click(box.x + box.width * .35, box.y + box.height * .4);
    await p.mouse.click(box.x + box.width * .65, box.y + box.height * .55);
    await visible(p);
  };
  let stage = 'setup';
  const visible = async p => { try { await p.waitForFunction(() => {
    const { map, ruler } = __rulerDemo, s = ruler.getState(), style = map.getStyle(); if (!s.end || !style) return false;
    const points = style.layers.find(l => l.id.startsWith('helper-ruler-') && l.id.endsWith('-points'))?.id;
    const line = style.layers.find(l => l.id.startsWith('helper-ruler-') && l.id.endsWith('-line'))?.id;
    if (!points || !line || !map.queryRenderedFeatures({ layers: [line] }).length) return false;
    return [s.start, s.end].every(c => { const q = map.project(c); return map.queryRenderedFeatures([[q.x - 8, q.y - 8], [q.x + 8, q.y + 8]], { layers: [points] }).length; });
  }, null, { timeout: 8000 }); } catch (error) { await p.screenshot({ path: `output/playwright/ruler-drag-${kind}-failure.png` }); throw Error(stage + ': ' + JSON.stringify(await p.evaluate(() => ({ state: __rulerDemo.ruler.getState(), errors: __dragErrors, style: __rulerDemo.map.getStyle() })))); } };
  const position = (p, endpoint) => p.evaluate(endpoint => { const { map, ruler } = __rulerDemo, q = map.project(ruler.getState()[endpoint]), b = map.getCanvas().getBoundingClientRect(); return { x: b.x + q.x, y: b.y + q.y }; }, endpoint);
  const check = async (p, endpoint, original, mid) => p.evaluate(({ endpoint, original, mid }) => {
    const { map, ruler } = __rulerDemo, s = ruler.getState();
    if (s.phase !== 'complete' || Boolean(s.dragging) !== mid || JSON.stringify(s[endpoint]) === JSON.stringify(original)) throw Error('drag state/continuous movement');
    const expected = new maplibregl.LngLat(...s.start).distanceTo(new maplibregl.LngLat(...s.end));
    if (Math.abs(expected - s.result.distanceMeters) > .0001) throw Error('native distance agreement');
    if (mid && map.dragPan.isEnabled()) throw Error('drag navigation lock');
    if (JSON.stringify({ ...localStorage }) !== __storageBefore) throw Error('measurement persisted');
  }, { endpoint, original, mid });
  await page.setViewportSize({ width: 1200, height: 900 }); await setup(page);
  await page.evaluate(() => { Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: () => new Promise(resolve => { window.__finishDragCopy = resolve; }) } }); });
  await page.getByRole('button', { name: 'Copy distance', exact: true }).click();
  for (const endpoint of ['start', 'end']) {
    stage = 'mouse ' + endpoint;
    const a = await position(page, endpoint), original = await page.evaluate(endpoint => __rulerDemo.ruler.getState()[endpoint], endpoint);
    await page.mouse.move(a.x, a.y); await page.mouse.down(); await page.mouse.move(a.x + 20, a.y + 15, { steps: 5 });
    await check(page, endpoint, original, true); await visible(page);
    if (endpoint === 'start') await page.evaluate(async () => { const { ruler } = __rulerDemo; if (ruler.getState().copying || !ruler.getElement().querySelector('[aria-label="Copy distance"]').disabled) throw Error('drag clipboard invalidation'); __finishDragCopy(); await Promise.resolve(); if (ruler.getState().copyStatus) throw Error('stale drag clipboard feedback'); });
    await page.mouse.move(a.x + 45, a.y + 25, { steps: 5 }); await page.mouse.up();
    await check(page, endpoint, original, false); await visible(page);
    if (!await page.evaluate(() => __rulerDemo.map.dragPan.isEnabled())) throw Error('restored dragPan');
    await page.locator('.map-wrap').screenshot({ path: `output/playwright/ruler-drag-${kind}-mouse-${endpoint}.png` });
  }
  // Off-handle native navigation changes camera without changing measurement.
  const prior = await page.evaluate(() => ({ center: __rulerDemo.map.getCenter().toArray(), start: __rulerDemo.ruler.getState().start }));
  const box = await page.locator('.maplibregl-canvas').boundingBox();
  await page.mouse.move(box.x + 40, box.y + 40); await page.mouse.down(); await page.mouse.move(box.x + 90, box.y + 65, { steps: 8 }); await page.mouse.up();
  await page.evaluate(prior => { const { map, ruler } = __rulerDemo; if (JSON.stringify(prior.center) === JSON.stringify(map.getCenter().toArray()) || JSON.stringify(prior.start) !== JSON.stringify(ruler.getState().start)) throw Error('outside navigation'); map.stop(); }, prior);
  // Cancellation and prior-disabled handlers; cancellation is injected, movement is native.
  for (const ending of ['cancel', 'reset', 'escape', 'style', 'outside']) {
    stage = 'termination ' + ending;
    await page.evaluate(() => { const { map } = __rulerDemo; map.dragRotate.disable(); map.scrollZoom.disable(); });
    const a = await position(page, 'start'), original = await page.evaluate(() => __rulerDemo.ruler.getState().start);
    await page.mouse.move(a.x, a.y); await page.mouse.down(); await page.mouse.move(a.x + 20, a.y + 10, { steps: 3 });
    await page.waitForFunction(() => __rulerDemo.ruler.getState().dragging === 'start');
    if (ending === 'cancel') await page.evaluate(() => { const c = __rulerDemo.map.getCanvas(); c.dispatchEvent(new PointerEvent('pointercancel', { pointerId: 1, bubbles: true })); });
    if (ending === 'reset') await page.evaluate(() => __rulerDemo.ruler.reset());
    if (ending === 'escape') await page.keyboard.press('Escape');
    if (ending === 'style') await page.evaluate(() => { const { map } = __rulerDemo; map.setStyle({ version: 8, sources: {}, layers: [] }, { diff: false }); });
    if (ending === 'outside') await page.mouse.move(box.x + box.width + 20, box.y + 100);
    await page.mouse.up();
    await page.waitForFunction(() => !__rulerDemo.ruler.getState().dragging);
    await page.evaluate(({ ending, original }) => { const { ruler, map } = __rulerDemo; if (!map.dragPan.isEnabled() || map.dragRotate.isEnabled() || map.scrollZoom.isEnabled()) throw Error('gesture restoration ' + ending); if (ending === 'cancel' && JSON.stringify(ruler.getState().start) !== JSON.stringify(original)) throw Error('cancel rollback'); }, { ending, original });
    if (['reset', 'escape'].includes(ending)) { await page.evaluate(async () => { const { map, ruler } = __rulerDemo; await ruler.activate(); map.getCanvas().dispatchEvent(new PointerEvent('pointerdown')); map.fire('click', { lngLat: map.unproject([160, 160]) }); map.fire('click', { lngLat: map.unproject([250, 240]) }); }); }
    if (ending !== 'outside') await visible(page);
  }
  await page.evaluate(() => { clearInterval(__rippleTimer); __rulerDemo.map.dragRotate.enable(); __rulerDemo.map.scrollZoom.enable(); });
  const context = await page.context().browser().newContext({ viewport: { width: 375, height: 900 }, hasTouch: true, isMobile: true });
  try {
    const mobile = await context.newPage(); mobile.on('pageerror', e => errors.push(e.message)); await mobile.goto(url); await setup(mobile);
    const cdp = await context.newCDPSession(mobile);
    for (const endpoint of ['start', 'end']) {
      stage = 'touch ' + endpoint;
      const a = await position(mobile, endpoint), original = await mobile.evaluate(endpoint => __rulerDemo.ruler.getState()[endpoint], endpoint);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: a.x + 12, y: a.y, id: 0 }] });
      for (let i = 1; i <= 4; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: a.x + 12 + i * 5, y: a.y + i * 4, id: 0 }] });
      await check(mobile, endpoint, original, true); await visible(mobile);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await check(mobile, endpoint, original, false); await visible(mobile);
      await mobile.locator('.map-wrap').screenshot({ path: `output/playwright/ruler-drag-${kind}-touch-${endpoint}.png` });
    }
    await mobile.evaluate(() => { clearInterval(__rippleTimer); if (__dragErrors.length) throw Error(__dragErrors.join(';')); });
  } finally { await context.close(); }
  // Native seam drag and removal during a captured drag.
  await page.evaluate(() => { const { map, ruler } = __rulerDemo; ruler.reset(); map.jumpTo({ center: [180, 0], zoom: 5, pitch: 0, bearing: 0 }); map.getCanvas().dispatchEvent(new PointerEvent('pointerdown')); map.fire('click', { lngLat: { lng: 179.5, lat: 0 } }); map.fire('click', { lngLat: { lng: -179.5, lat: 0 } }); });
  const seam = await position(page, 'start'); await page.mouse.move(seam.x, seam.y); await page.mouse.down(); await page.mouse.move(seam.x + 25, seam.y + 10, { steps: 5 }); await page.mouse.up();
  await page.evaluate(() => { const { ruler, map } = __rulerDemo, s = ruler.getState(); if (!s.end || s.result.distanceMeters > 200000) throw Error('seam drag'); const line = map.getSource(Object.keys(map.getStyle().sources).find(k => k.startsWith('helper-ruler-')))._data.features.find(f => f.geometry.type === 'LineString'); if (Math.abs(line.geometry.coordinates[1][0] - line.geometry.coordinates[0][0]) > 180) throw Error('seam unwrap'); });
  const a = await position(page, 'start'); await page.mouse.move(a.x, a.y); await page.mouse.down(); await page.mouse.move(a.x + 10, a.y + 5);
  await page.evaluate(() => { const { map, ruler } = __rulerDemo; map.remove(); if (!ruler.getState().destroyed || ruler.getState().dragging || !map.dragPan.isEnabled()) throw Error('removal cleanup'); if (__dragErrors.length) throw Error(__dragErrors.join(';')); }); await page.mouse.up();
  if (errors.length) throw Error(errors.join(';'));
  return 'MAP_RULER_DRAG_OK';
}
