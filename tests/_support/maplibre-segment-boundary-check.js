async (page) => {
  const check = (ok, message) => { if (!ok) throw Error(message); };
  for (const width of [1200, 375]) {
    await page.setViewportSize({ width, height: 1000 }); await page.reload(); await page.waitForFunction(() => window.__drawingReady);
    await page.locator('#map canvas').scrollIntoViewIfNeeded();
    for (const boundary of ['longitude', 'latitude']) {
      await page.evaluate(boundary => {
        const { map, adapter: a } = __drawing;
        const coordinates = boundary === 'longitude' ? [[179.1, 0], [179.8, 0]] : [[-10, 84.9], [10, 84.9]];
        map.jumpTo({ center: boundary === 'longitude' ? [179.45, 0] : [0, 84.9], zoom: boundary === 'longitude' ? 8 : 4, pitch: 0, bearing: 0 });
        a.setFeatures([{ type: 'Feature', id: 0, properties: { helperStyle: { stroke: { r: 0, g: 0, b: 0, a: 0 } } }, geometry: { type: 'LineString', coordinates } }]);
        window.__boundaryOriginal = JSON.stringify(a.getFeatures()); a.beginEdit(0);
      }, boundary);
      const position = coordinate => page.evaluate(coordinate => { const m = __drawing.map, b = m.getCanvas().getBoundingClientRect(), p = m.project(coordinate); return { x: b.x + p.x, y: b.y + p.y }; }, coordinate);
      const start = await position(boundary === 'longitude' ? [179.45, 0] : [0, 84.9]);
      await page.locator('#map canvas').focus(); // Escape is intentionally scoped to the focused map canvas.
      await page.mouse.move(start.x, start.y); await page.mouse.down();
      check(await page.evaluate(() => __drawing.adapter.getState().dragging), `${boundary} segment hit`);
      const valid = await position(boundary === 'longitude' ? [179.5, 0] : [0, 85.03]);
      await page.mouse.move(valid.x, valid.y, { steps: 3 });
      const lastValid = await page.evaluate(() => JSON.stringify(__drawing.adapter.getFeatures()));
      check(lastValid !== await page.evaluate(() => __boundaryOriginal), `${boundary} valid preview moves`);
      const invalid = await position(boundary === 'longitude' ? [179.8, 0] : [0, 85.1]);
      await page.mouse.move(invalid.x, invalid.y, { steps: 1 });
      check(await page.evaluate(expected => JSON.stringify(__drawing.adapter.getFeatures()) === expected, lastValid), `${boundary} invalid candidate rejects atomically and retains last valid preview`);
      if (boundary === 'longitude') {
        const outside = await position([180.2, 0]); await page.mouse.move(outside.x, outside.y);
        check(await page.evaluate(expected => JSON.stringify(__drawing.adapter.getFeatures()) === expected, lastValid), 'World-copy/unwrapped pointer cannot wrap or corrupt geometry');
      }
      await page.keyboard.press('Escape'); await page.mouse.up();
      check(await page.evaluate(() => JSON.stringify(__drawing.adapter.getFeatures()) === __boundaryOriginal && !__drawing.adapter.getState().dragging && !__drawing.adapter.getState().editSession && __drawing.map.dragPan.isEnabled()), `${boundary} cancellation restores exact original data/navigation`);
    }
    await page.evaluate(() => {
      const a = __drawing.adapter, f = { type: 'Feature', id: 0, properties: {}, geometry: { type: 'LineString', coordinates: [[0, 86], [10, 86]] } };
      a.setFeatures([f]); if (JSON.stringify(a.getFeatures()) !== JSON.stringify([f]) || a.getDrawingKind(0) !== 'path') throw Error('Out-of-Mercator legacy import must remain unchanged');
    });

  }
  return 'SEGMENT_BOUNDARY_OK';
}
