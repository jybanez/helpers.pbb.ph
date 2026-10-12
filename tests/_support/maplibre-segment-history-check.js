async (page) => {
  const check = (ok, message) => { if (!ok) throw Error(message); };
  for (const width of [1200, 375]) {
    await page.setViewportSize({ width, height: 1000 }); await page.reload(); await page.waitForFunction(() => window.__drawingReady);
    await page.locator('#map canvas').scrollIntoViewIfNeeded();
    check(await page.locator('#tools [data-mode="path"] svg').count() === 1, 'Canonical Path icon');
    for (const kind of ['line', 'path']) {
      await page.evaluate(kind => {
        const { map, adapter: a } = __drawing; map.jumpTo({ bearing: -47, pitch: 50 }); map.doubleClickZoom.disable();
        const b = map.getCanvas().getBoundingClientRect(), points = (kind === 'line' ? [[.2, .4], [.8, .6]] : [[.2, .4], [.5, .65], [.8, .4]]).map(([x, y]) => { const p = map.unproject([b.width * x, b.height * y]); return [p.lng, p.lat]; });
        a.setFeatures([{ type: 'Feature', id: 0, properties: { helperDrawingKind: kind, helperStyle: { stroke: { r: 0, g: 0, b: 0, a: 0 } } }, geometry: { type: 'LineString', coordinates: points } }]);
        window.__segmentBefore = JSON.stringify(a.getFeatures()); a.beginEdit(0); window.__segmentToken = a.getState().editSession.id;
        window.__segmentReentry = [];
        window.__segmentOff = a.on('statechange', state => { if (state.dragging) __segmentReentry.push(a.setMode('path'), a.updateFeature(0, { properties: {} }, { sessionId: __segmentToken }), a.acceptEdit(__segmentToken), a.destroy()); });
      }, kind);
      const p = await page.evaluate(kind => {
        const { map, adapter: a } = __drawing, c = a.getFeatures()[0].geometry.coordinates, b = map.getCanvas().getBoundingClientRect(), n = kind === 'path' ? 1 : 0, p = map.project(c[n]), q = map.project(c[n + 1]);
        return { x: b.x + (p.x + q.x) / 2, y: b.y + (p.y + q.y) / 2 };
      }, kind);
      await page.mouse.move(p.x, p.y); await page.mouse.down(); await page.mouse.move(p.x + 16, p.y + 14, { steps: 4 }); await page.mouse.up();
      check(await page.evaluate(() => { const a = __drawing.adapter; __segmentOff(); return __segmentReentry.length > 0 && __segmentReentry.every(v => v === false) && a.getState().editSession.dirty && !__drawing.map.doubleClickZoom.isEnabled(); }), `${kind}: segment gesture rejects callback reentry and preserves disabled navigation`);
      check(await page.evaluate(() => {
        const a = __drawing.adapter; a.acceptEdit(__segmentToken); const after = JSON.stringify(a.getFeatures()); a.undo();
        const reverted = JSON.stringify(a.getFeatures()) === __segmentBefore; a.redo();
        return reverted && JSON.stringify(a.getFeatures()) === after && a.updateFeature(0, { properties: {} }, { sessionId: __segmentToken }) === false && a.rollbackEdit(__segmentToken) === false;
      }), `${kind}: accepted gesture is one global undo unit and stale token is rejected`);
    }
  }
  return 'SEGMENT_HISTORY_OK';
}
