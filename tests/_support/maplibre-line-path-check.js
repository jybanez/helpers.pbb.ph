async (page) => {
  const check = (ok, message) => { if (!ok) throw Error(message); }, errors = [];
  page.on('pageerror', e => errors.push(e.message));
  for (const width of [1200, 375]) {
    await page.setViewportSize({ width, height: 1000 }); await page.reload();
    await page.waitForFunction(() => window.__drawingReady);
    await page.locator('#map canvas').scrollIntoViewIfNeeded();
    const mode = name => page.locator(`#tools [data-mode="${name}"]`).click();
    const pos = async (x, y) => { const b = await page.locator('#map canvas').boundingBox(); return { x: b.x + b.width * x, y: b.y + b.height * y }; };
    const click = async (x, y) => { const p = await pos(x, y); await page.mouse.click(p.x, p.y); };
    await page.evaluate(() => { __drawing.adapter.setFeatures([]); __drawing.map.jumpTo({ bearing: 33, pitch: 45 }); });
    await mode('line'); await click(.2, .3);
    const preview = await pos(.75, .55); await page.mouse.move(preview.x, preview.y);
    check(await page.evaluate(() => {
      const a = __drawing.adapter, data = __drawing.map.getSource(a.getState().sourceId)._data;
      return a.getState().draft.length === 1 && a.getState().preview && !a.getFeatures().length && data.features.some(f => f.geometry.type === 'LineString' && f.geometry.coordinates.length === 2);
    }), 'Line live preview must remain outside committed model/history');
    await click(.75, .55);
    check(await page.evaluate(() => { const a = __drawing.adapter; return a.getMode() === 'select' && a.getFeatures().length === 1 && a.getFeatures()[0].geometry.coordinates.length === 2 && a.getDrawingKind() === 'line' && __drawing.map.doubleClickZoom.isEnabled(); }), 'Second Line click auto-completes exactly two vertices and restores navigation');
    await page.evaluate(() => { const a = __drawing.adapter; a.undo(); if (a.getFeatures().length) throw Error('Line one undo'); a.redo(); if (a.getFeatures().length !== 1) throw Error('Line redo'); });
    await mode('path'); await click(.2, .65); await click(.45, .8);
    const end = await pos(.8, .65); const zoom = await page.evaluate(() => __drawing.map.getZoom());
    await page.mouse.dblclick(end.x, end.y);
    check(await page.evaluate(zoom => { const a = __drawing.adapter, f = a.getFeatures()[1]; return a.getMode() === 'select' && f?.geometry.coordinates.length === 3 && f.properties.helperDrawingKind === 'path' && a.getDrawingKind(f.id) === 'path' && __drawing.map.getZoom() === zoom; }, zoom), 'Double-click Path completes without duplicate endpoint or zoom');
    await mode('path'); await click(.15, .15); await click(.35, .2); await page.locator('#tools [data-action="finish"]').click();
    check(await page.evaluate(() => __drawing.adapter.getFeatures()[2].geometry.coordinates.length === 2), 'Two-point Path Finish');
    await mode('line'); await click(.4, .4); await page.keyboard.press('Escape');
    check(await page.evaluate(() => !__drawing.adapter.getState().draft.length && !__drawing.adapter.getState().preview && __drawing.adapter.getFeatures().length === 3), 'Escape clears preview and draft without commit');
    // Imported metadata-free legacy path is preserved byte-for-byte, including ID 0 and alpha 0.
    await page.evaluate(() => {
      const { map, adapter: a } = __drawing, b = map.getCanvas().getBoundingClientRect();
      const coordinates = [[.2, .4], [.5, .55], [.8, .4]].map(([x, y]) => { const ll = map.unproject([b.width * x, b.height * y]); return [ll.lng, ll.lat]; });
      const f = { type: 'Feature', id: 0, properties: { helperStyle: { stroke: { r: 0, g: 0, b: 0, a: 0 } } }, geometry: { type: 'LineString', coordinates } };
      a.setFeatures([f]); window.__lineOriginal = JSON.stringify([f]); if (JSON.stringify(a.getFeatures()) !== __lineOriginal || a.getDrawingKind(0) !== 'path') throw Error('Legacy import migration'); a.beginEdit(0);
    });
    const target = async vertex => page.evaluate(vertex => {
      const { map, adapter: a } = __drawing, c = a.getFeatures()[0].geometry.coordinates, b = map.getCanvas().getBoundingClientRect();
      const p = vertex ? map.project(c[0]) : (() => { const p = map.project(c[0]), q = map.project(c[1]); return { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 }; })();
      return { x: b.x + p.x, y: b.y + p.y };
    }, vertex);
    const drag = async (vertex, release = true) => { const p = await target(vertex); await page.mouse.move(p.x, p.y); await page.mouse.down(); check(await page.evaluate(() => __drawing.adapter.getState().dragging), 'Actual segment/vertex starts gesture'); await page.mouse.move(p.x + 18, p.y - 15, { steps: 5 }); if (release) await page.mouse.up(); };
    await drag(false);
    check(await page.evaluate(() => {
      const a = __drawing.adapter, before = JSON.parse(__lineOriginal)[0].geometry.coordinates, after = a.getFeatures()[0].geometry.coordinates, delta = after[0].map((v, i) => v - before[0][i]);
      return a.getState().editSession.dirty && a.getFeatureStyle(0).stroke.a === 0 && after.every((c, n) => c.every((v, i) => Math.abs(v - before[n][i] - delta[i]) < 1e-10)) && a.getCapabilities().actions.finish && a.getCapabilities().actions.cancel;
    }), 'Segment translates every vertex with identical delta under transformed camera');
    await page.evaluate(() => { const a = __drawing.adapter; a.undo(); if (JSON.stringify(a.getFeatures()) !== __lineOriginal || a.getState().editSession.dirty) throw Error('Gesture must be one local undo'); a.redo(); a.rollbackEdit(); a.beginEdit(0); });
    await drag(true);
    check(await page.evaluate(() => { const before = JSON.parse(__lineOriginal)[0].geometry.coordinates, after = __drawing.adapter.getFeatures()[0].geometry.coordinates; return JSON.stringify(before[0]) !== JSON.stringify(after[0]) && JSON.stringify(before.slice(1)) === JSON.stringify(after.slice(1)); }), 'Vertex handle wins over overlapping segment and reshapes only one vertex');
    await page.evaluate(() => { __drawing.adapter.rollbackEdit(); __drawing.adapter.beginEdit(0); });
    await drag(false, false); await page.keyboard.press('Escape'); await page.mouse.up();
    check(await page.evaluate(() => { const a = __drawing.adapter; return !a.getState().dragging && !a.getState().editSession && JSON.stringify(a.getFeatures()) === __lineOriginal && __drawing.map.dragPan.isEnabled() && __drawing.map.touchZoomRotate.isEnabled(); }), 'Cancel mid-segment drag restores model/session/navigation');
    await page.evaluate(() => __drawing.adapter.beginEdit(0)); await drag(false, false);
    await page.evaluate(() => __drawing.map.getCanvas().dispatchEvent(new PointerEvent('pointercancel', { pointerId: 1 })));
    await page.mouse.up();
    check(await page.evaluate(() => !__drawing.adapter.getState().dragging && !__drawing.adapter.getState().editSession.dirty && JSON.stringify(__drawing.adapter.getFeatures()) === __lineOriginal), 'Pointer cancellation rolls back gesture but retains clean session');
    await page.locator('#tools').screenshot({ path: `output/playwright/line-path-${new URL(page.url()).searchParams.has('bundle') ? 'bundle' : 'source'}-${width}.png` });
    await drag(false, false);
    await page.evaluate(() => __drawing.map.remove()); await page.mouse.up();
    check(await page.evaluate(() => { const a = __drawing.adapter; return a.getState().destroyed && !a.getState().dragging && !a.getState().editSession && JSON.stringify(a.getFeatures()) === __lineOriginal && a.setMode('path') === undefined; }), 'Actual map removal mid-drag restores original data and destroys ownership');
  }
  check(!errors.length, errors.join('; ')); return 'LINE_PATH_OK';
}
