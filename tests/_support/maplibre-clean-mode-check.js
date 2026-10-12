async (page) => {
  const check = (ok, message) => { if (!ok) throw Error(message); }, errors = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const width of [1200, 375]) {
    await page.setViewportSize({ width, height: 1000 }); await page.reload();
    await page.waitForFunction(() => window.__drawingReady);
    const mode = name => page.locator(`#tools [data-mode="${name}"]`).click();
    const click = async (x, y) => {
      await page.locator('#map canvas').scrollIntoViewIfNeeded();
      const b = await page.locator('#map canvas').boundingBox(); await page.mouse.click(b.x + b.width * x, b.y + b.height * y);
    };
    await page.evaluate(() => __drawing.adapter.setFeatures([]));
    await mode('point'); await click(.3, .3);
    await page.waitForFunction(() => __drawing.adapter.getFeatures().length === 1);
    await mode('select');
    await page.waitForFunction(() => { const map = __drawing.map, a = __drawing.adapter; return map.queryRenderedFeatures(map.project(a.getFeatures()[0].geometry.coordinates), { layers: a.getState().layerIds.slice(0, 3) }).some(f => f.properties.__helperKind === 'feature'); });
    await click(.3, .3); await page.locator('#edit-object').click();
    check(await page.evaluate(() => !!__drawing.adapter.getState().editSession && !__drawing.adapter.getCapabilities().actions.finish), 'Point auto-edit equivalent is clean');
    await mode('line'); await click(.2, .6); await click(.45, .7);
    await page.locator('#tools [data-action="finish"]').click();
    await page.waitForFunction(() => __drawing.adapter.getFeatures().length === 2);
    await page.locator('#edit-object').click();
    check(await page.evaluate(() => __drawing.adapter.getState().editSession && __drawing.adapter.getFeatures().find(f => String(f.id) === __drawing.adapter.getState().selectedFeatureId).geometry.type === 'LineString'), 'Finished line enters clean object edit');
    await page.locator('#tools').screenshot({ path: `output/playwright/clean-mode-transition-${new URL(page.url()).searchParams.has('bundle') ? 'bundle' : 'source'}-${width}.png` });
    await mode('polygon'); await click(.6, .3); await click(.8, .4); await click(.65, .65);
    await page.locator('#tools [data-action="finish"]').click();
    check(await page.evaluate(() => __drawing.adapter.getFeatures().map(f => f.geometry.type).join(',') === 'Point,LineString,Polygon'), 'Actual Point→Line→clean edit→Polygon flow');
    await page.evaluate(() => {
      const a = __drawing.adapter;
      const fixture = [{ type: 'Feature', id: 0, properties: { helperStyle: { fill: { r: 10, g: 20, b: 30, a: 0 } } }, geometry: { type: 'Point', coordinates: [123.8857, 10.3157] } }];
      a.setFeatures(fixture); a.updateFeature(0, { geometry: { type: 'Point', coordinates: [123.89, 10.3157] } }); a.undo();
      window.__modeBaseline = JSON.stringify(a.getFeatures()); window.__modeEvents = [];
      for (const name of ['statechange', 'editchange', 'modechange']) a.on(name, value => __modeEvents.push({ name, value, state: a.getState(), reentrant: a.setMode('polygon') }));
    });
    for (const target of ['pan', 'point', 'line', 'polygon']) {
      await page.evaluate(() => {
        const a = __drawing.adapter; a.setMode('select'); a.beginEdit(0); window.__modeToken = a.getState().editSession.id; __modeEvents.length = 0;
        if (!a.setMode('select') || a.getState().editSession.id !== __modeToken || __modeEvents.length) throw Error('Same Select must retain token/events');
      });
      await mode(target);
      check(await page.evaluate(target => {
        const a = __drawing.adapter, events = __modeEvents;
        return a.getMode() === target && !a.getState().editSession && a.getCapabilities().actions.redo && JSON.stringify(a.getFeatures()) === __modeBaseline && a.getFeatureStyle(0).fill.a === 0 &&
          a.updateFeature(0, { properties: {} }, { sessionId: __modeToken }) === false && a.acceptEdit(__modeToken) === false && a.rollbackEdit(__modeToken) === false &&
          events.some(e => e.name === 'editchange' && e.value === null) && events.some(e => e.name === 'modechange') && events.every(e => e.state.mode === target && !e.state.editSession && e.reentrant === false);
      }, target), `${target}: clean settlement preserves history/style and coherent read-only events`);
    }
    await page.evaluate(() => {
      const a = __drawing.adapter; a.setMode('select'); a.redo(); if (a.getFeatures()[0].geometry.coordinates[0] !== 123.89) throw Error('Global redo lost'); a.undo(); a.beginEdit(0);
      a.updateFeature(0, { geometry: { type: 'Point', coordinates: [123.887, 10.3157] } });
      const before = JSON.stringify(a.getState()); for (const mode of ['pan', 'point', 'line', 'polygon']) if (a.getCapabilities().modes.includes(mode) || a.setMode(mode) !== false || JSON.stringify(a.getState()) !== before) throw Error('Dirty mode transition protection');
      a.undo(); if (a.getState().editSession.dirty || !a.getCapabilities().modes.includes('point')) throw Error('Undo-to-clean mode availability');
    });
    for (const target of ['pan', 'point', 'line', 'polygon']) check(await page.locator(`#tools [data-mode="${target}"]`).isEnabled(), 'Toolbar re-enables clean modes');
    await page.locator('#map canvas').scrollIntoViewIfNeeded();
    await page.waitForFunction(() => {
      const map = __drawing.map, a = __drawing.adapter, p = map.project(a.getFeatures()[0].geometry.coordinates);
      return map.queryRenderedFeatures(p, { layers: a.getState().layerIds.slice(0, 3) }).some(f => f.properties.__helperId === '0');
    });
    const p = await page.evaluate(() => { const map = __drawing.map, b = map.getCanvas().getBoundingClientRect(), p = map.project(__drawing.adapter.getFeatures()[0].geometry.coordinates); return { x: b.x + p.x, y: b.y + p.y }; });
    await page.mouse.move(p.x, p.y); await page.mouse.down();
    check(await page.evaluate(() => {
      const a = __drawing.adapter, before = JSON.stringify(a.getState()); return a.getState().dragging && !a.getCapabilities().modes.includes('pan') && a.setMode('pan') === false && JSON.stringify(a.getState()) === before;
    }), 'Actual drag retains session and rejects mode settlement');
    await page.keyboard.press('Escape'); await page.mouse.up();
    check(await page.evaluate(() => {
      const { map, adapter: a } = __drawing; a.beginEdit(0); let later = 0;
      const off = a.on('statechange', state => { if (state.mode === 'line') map.remove(); }); a.on('editchange', () => later++); a.on('modechange', () => later++);
      const accepted = a.setMode('line'); off(); return accepted === false && a.getState().destroyed && !a.getState().editSession && JSON.stringify(a.getFeatures()) === __modeBaseline && later === 0;
    }), 'Removal during clean settlement stops later notifications and preserves authored data');
  }
  check(!errors.length, errors.join('; ')); return 'CLEAN_MODE_OK';
}
