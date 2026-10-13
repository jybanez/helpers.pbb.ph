async page => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.waitForFunction(() => window.__rulerDemo && __rulerDemo.map.isStyleLoaded());
  const kind = new URL(page.url()).search.includes('bundle') ? 'bundle' : 'source';
  for (const width of [1200, 375]) {
    await page.setViewportSize({ width, height: 850 });
    for (const pitch of [0, 50]) {
      await page.evaluate(pitch => { const { map, ruler } = __rulerDemo; ruler.deactivate(); map.resize(); map.jumpTo({ center: [0, 0], zoom: 5, pitch, bearing: 31 }); }, pitch);
      await page.getByRole('button', { name: 'Measure straight-line distance', exact: true }).click();
      await page.waitForFunction(() => __rulerDemo.ruler.getState().active);
      const positions = await page.evaluate(() => { const { map } = __rulerDemo, box = map.getCanvas().getBoundingClientRect(); return [[0, 0], [1, 0]].map(p => { const q = map.project(p); return { x: box.x + q.x, y: box.y + q.y }; }); });
      await page.mouse.click(positions[0].x, positions[0].y);
      await page.mouse.move(positions[1].x, positions[1].y);
      if (!await page.evaluate(() => __rulerDemo.ruler.getState().result && !__rulerDemo.ruler.getState().result.fixed)) throw Error('native preview');
      await page.mouse.click(positions[1].x, positions[1].y);
      await page.evaluate(() => {
        const { ruler, map } = __rulerDemo, state = ruler.getState();
        const radians = value => value * Math.PI / 180;
        const [a, b] = [state.start, state.end];
        const haversine = Math.sin(radians(b[1] - a[1]) / 2) ** 2 + Math.cos(radians(a[1])) * Math.cos(radians(b[1])) * Math.sin(radians(b[0] - a[0]) / 2) ** 2;
        const expected = 2 * 6371008.8 * Math.asin(Math.sqrt(haversine));
        if (state.phase !== 'complete' || Math.abs(state.result.distanceMeters - expected) > .1 || Math.abs(expected - 111195.0802335329) > 2000 || state.result.text !== `${(expected / 1000).toFixed(2)} km`) throw Error('native screen-point geographic distance ' + JSON.stringify(state));
        if (map.doubleClickZoom.isEnabled()) throw Error('double click zoom not suppressed');
        const box = ruler.getElement().getBoundingClientRect(), host = map.getContainer().getBoundingClientRect();
        if (Math.abs((box.left + box.right) / 2 - (host.left + host.right) / 2) > 1 || box.left < host.left || box.right > host.right || box.bottom > host.bottom) throw Error('bottom center clearance ' + JSON.stringify({box:box.toJSON(),host:host.toJSON()}));
        if (document.querySelector('[data-control="ruler"]')?.getAttribute('aria-pressed') !== 'true') throw Error('pressed state');
      });
      await page.locator('.map-wrap').screenshot({ path: `output/playwright/map-ruler-${kind}-${width}-${pitch}.png` });
      // Real pointer drag retains navigation and must not replace the fixed pair.
      const prior = await page.evaluate(() => JSON.stringify(__rulerDemo.ruler.getState().start));
      await page.mouse.move(positions[0].x, positions[0].y); await page.mouse.down(); await page.mouse.move(positions[0].x + 50, positions[0].y + 30, { steps: 10 }); await page.mouse.up();
      if (await page.evaluate(() => JSON.stringify(__rulerDemo.ruler.getState().start)) !== prior) throw Error('drag registered endpoint');
      await page.getByRole('button', { name: 'Reset ruler', exact: true }).click();
      if (!await page.evaluate(() => __rulerDemo.ruler.getState().active && __rulerDemo.ruler.getState().phase === 'ready')) throw Error('reset ownership');
      await page.getByRole('button', { name: 'Exit ruler', exact: true }).click();
      if (!await page.evaluate(() => !__rulerDemo.ruler.getState().active && __rulerDemo.map.doubleClickZoom.isEnabled() && __rulerDemo.ruler.getSize().height === 0)) throw Error('exit restore');
    }
  }
  await page.evaluate(async () => {
    const { map, ruler, createRuler } = __rulerDemo;
    map.stop();
    const assert = (ok, label) => { if (!ok) throw Error(label); };
    const endpoint = (lng, lat) => { map.getCanvas().dispatchEvent(new PointerEvent('pointerdown')); map.fire('click', { lngLat: { lng, lat } }); };
    let resolve, signal, calls = 0;
    ruler.update({ beforeActivate: args => { signal = args.signal; calls++; return new Promise(r => { resolve = r; }); } });
    const one = ruler.activate(), two = ruler.activate(); assert(one === two, 'pending dedup');
    await Promise.resolve(); assert(calls === 1 && ruler.getState().pending && !ruler.getState().active, 'pending state');
    ruler.deactivate(); assert(signal.aborted, 'guard abort signal'); resolve(true); assert(await one === false && !ruler.getState().active, 'late approval cancellation');
    let nextResolve;
    ruler.update({ beforeActivate: () => new Promise(r => { nextResolve = r; }) });
    const superseded = ruler.activate(); await Promise.resolve(); ruler.update({ beforeActivate: () => true }); nextResolve(true);
    assert(await superseded === false && !ruler.getState().active, 'update cancels prior guard');
    const callsBefore = calls;
    ruler.update({ beforeActivate: () => { calls++; return true; }, onStateChange: state => { if (state.pending) ruler.deactivate(); } });
    const cancelled = ruler.activate(); assert(cancelled instanceof Promise && await cancelled === false && calls === callsBefore, 'synchronous context cancellation');
    ruler.update({ onStateChange: state => __rulerDemo.controls.setActionState('ruler', { pressed: state.active, disabled: state.pending || state.destroyed }) });
    ruler.update({ beforeActivate: () => false }); assert(await ruler.activate() === false, 'guard rejection');
    ruler.update({ beforeActivate: () => { throw Error('guard failed'); }, onError: () => {} }); assert(await ruler.activate() === false && !ruler.getState().pending, 'guard failure');
    ruler.update({ beforeActivate: () => true }); map.doubleClickZoom.disable(); await ruler.activate();
    endpoint(NaN, 0); endpoint(null, 0); endpoint(0, 91); assert(!ruler.getState().start, 'invalid endpoints');
    endpoint(0, 0); endpoint(0, 0); assert(ruler.getState().result.text === '0 m', 'zero distance');
    endpoint(179.5, 0); assert(ruler.getState().phase === 'preview', 'third click restart'); endpoint(-179.5, 0);
    assert(Math.abs(ruler.getState().result.distanceMeters - 111195.0802335329) < .1, 'seam distance');
    const sourceId = Object.keys(map.getStyle().sources).find(k => k.startsWith('helper-ruler-'));
    const coordinates = map.getSource(sourceId)._data.features.find(f => f.geometry.type === 'LineString').geometry.coordinates;
    assert(Math.abs(coordinates[1][0] - coordinates[0][0]) === 1, 'seam render unwrap');
    const snapshot = ruler.getState(); snapshot.start[0] = 0; assert(ruler.getState().start[0] === 179.5, 'snapshot alias');
    try { createRuler(document.createElement('div'), { map }); throw Error('duplicate allowed'); } catch (error) { assert(error.message !== 'duplicate allowed', 'duplicate controller'); }
    try { ruler.update({ map: {} }); throw Error('map change allowed'); } catch (error) { assert(error.message !== 'map change allowed', 'map update'); }
    ruler.deactivate(); assert(!map.doubleClickZoom.isEnabled(), 'original disabled zoom restore'); map.doubleClickZoom.enable();
    await ruler.activate(); endpoint(0, 0); endpoint(.001, 0); assert(ruler.getState().result.text === '111 m', 'metric metres');
    // Browser permission/OS clipboard is intentionally stubbed; outcomes and stale feedback are the contract tested.
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { window.__copied = text; } } });
  });
  await page.getByRole('button', { name: 'Copy distance', exact: true }).click();
  await page.waitForFunction(() => __rulerDemo.ruler.getState().copyStatus === 'Distance copied.');
  if (await page.evaluate(() => window.__copied) !== '111 m') throw Error('copy exact value');
  await page.evaluate(() => { Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw Error('denied'); } } }); });
  await page.getByRole('button', { name: 'Copy distance', exact: true }).click();
  await page.waitForFunction(() => __rulerDemo.ruler.getState().copyStatus.startsWith('Could not copy'));
  await page.evaluate(() => { Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined }); });
  await page.getByRole('button', { name: 'Copy distance', exact: true }).click();
  await page.waitForFunction(() => __rulerDemo.ruler.getState().copyStatus.startsWith('Could not copy') && !__rulerDemo.ruler.getState().copying);
  await page.evaluate(() => { window.__writeCalls = 0; Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: () => { window.__writeCalls++; return new Promise(r => { window.__resolveCopy = r; }); } } }); });
  await page.getByRole('button', { name: 'Copy distance', exact: true }).click();
  await page.evaluate(() => { const { ruler } = __rulerDemo; ruler.getElement().querySelector('[aria-label="Copy distance"]').click(); if (__writeCalls !== 1) throw Error('copy dedup'); ruler.reset(); __resolveCopy(); });
  await page.evaluate(async () => {
    await Promise.resolve(); const { ruler, map } = __rulerDemo;
    if (ruler.getState().copyStatus) throw Error('stale copy feedback');
    map.fire('click', { lngLat: { lng: 0, lat: 0 } }); map.fire('click', { lngLat: { lng: 1, lat: 0 } });
    await new Promise(resolve => { map.once('style.load', resolve); map.setStyle({ version: 8, sources: {}, layers: [] }, { diff: false }); });
    if (!Object.keys(map.getStyle().sources).some(k => k.startsWith('helper-ruler-'))) throw Error('style reload restore');
  });
  await page.locator('.maplibregl-canvas').focus(); await page.keyboard.press('Escape');
  if (await page.evaluate(() => __rulerDemo.ruler.getState().active)) throw Error('native Escape');
  await page.evaluate(async () => { const { ruler, map } = __rulerDemo; await ruler.activate(); ruler.destroy(); ruler.destroy(); if (ruler.getElement() || ruler.getSize().width || Object.keys(map.getStyle().sources).some(k => k.startsWith('helper-ruler-'))) throw Error('teardown'); const next = __rulerDemo.createRuler(document.querySelector('#result'), { map }); await next.activate(); map.remove(); if (!next.getState().destroyed) throw Error('map remove'); });
  // Fresh touch-enabled browser context, two native taps. No physical-device claim.
  const context = await page.context().browser().newContext({ viewport: { width: 375, height: 850 }, hasTouch: true, isMobile: true });
  try {
    const mobile = await context.newPage(); await mobile.goto(page.url()); await mobile.waitForFunction(() => window.__rulerDemo && __rulerDemo.map.isStyleLoaded());
    await mobile.getByRole('button', { name: 'Measure straight-line distance', exact: true }).tap();
    await mobile.waitForFunction(() => __rulerDemo.ruler.getState().active);
    const box = await mobile.locator('.maplibregl-canvas').boundingBox();
    await mobile.touchscreen.tap(box.x + 70, box.y + 150); await mobile.touchscreen.tap(box.x + 200, box.y + 200);
    if (!await mobile.evaluate(() => __rulerDemo.ruler.getState().result?.fixed)) throw Error('emulated two tap');
    await mobile.locator('.map-wrap').screenshot({ path: `output/playwright/map-ruler-${kind}-touch.png` });
  } finally { await context.close(); }
  if (errors.length) throw Error('page errors: ' + errors.join(';'));
  return 'MAP_RULER_OK';
}
