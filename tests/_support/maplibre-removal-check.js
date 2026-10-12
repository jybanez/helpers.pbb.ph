async (page) => {
  const errors = []; const onError = error => errors.push(error.message); page.on('pageerror', onError);
  const assert = (ok, text) => { if (!ok) throw Error(text); };
  for (const width of [1200, 375]) for (const scenario of ['mouseup', 'rollback', 'begin', 'accept', 'finish']) {
    await page.setViewportSize({ width, height: 1000 }); await page.reload(); await page.waitForFunction(() => window.__drawingReady);
    await page.evaluate(() => {
      const { adapter: a, sample } = __drawing; a.setFeatures(sample);
      a.updateFeature('route', { properties: { priorHistory: true } });
      window.__removalBaseline = JSON.stringify(a.getFeatures()); window.__afterRemoval = null;
    });
    if (scenario === 'begin') {
      const result = await page.evaluate(() => {
        const { adapter: a, map } = __drawing; a.on('select', () => map.remove());
        const result = a.beginEdit(0);
        return result === false && a.getState().destroyed && !a.getState().editSession && JSON.stringify(a.getFeatures()) === __removalBaseline;
      }); assert(result, 'begin removal does not resume publication or report success');
    } else if (scenario === 'accept' || scenario === 'finish') {
      const result = await page.evaluate(scenario => {
        const { adapter: a, map } = __drawing;
        if (scenario === 'accept') { a.beginEdit(0); a.updateFeature(0, { properties: { accepted: true } }); }
        else { a.setMode('line'); map.fire('click', { point: map.project([123.89, 10.33]), lngLat: { lng:123.89, lat:10.33 } }); map.fire('click', { point: map.project([123.9, 10.32]), lngLat: { lng:123.9, lat:10.32 } }); }
        let after;
        a.on(scenario === 'accept' ? 'statechange' : 'create', () => { map.remove(); after = JSON.stringify(a.getState()); });
        const result = scenario === 'accept' ? a.acceptEdit() : a.finish();
        // The acceptance/create completed before its publication; removal must
        // stop later selection/history work, not undo the already accepted unit.
        return result === false && a.getState().destroyed && after === JSON.stringify(a.getState());
      }, scenario); assert(result, `${scenario} removal stops continuation`);
    } else {
      await page.evaluate(() => __drawing.adapter.beginEdit(0)); await page.locator('#map canvas').scrollIntoViewIfNeeded();
      const start = await page.evaluate(() => { const { adapter:a, map } = __drawing; const b=map.getCanvas().getBoundingClientRect(), p=map.project(a.getFeatures()[0].geometry.coordinates); return {x:b.left+p.x,y:b.top+p.y}; });
      await page.mouse.move(start.x, start.y); await page.mouse.down(); await page.mouse.move(start.x+18, start.y+24, { steps:4 });
      assert(await page.evaluate(() => __drawing.adapter.getState().dragging), 'real removal drag active');
      await page.evaluate(() => {
        const {adapter:a,map}=__drawing;
        a.on('statechange', state => { if (!state.dragging && state.editSession) { map.remove(); window.__afterRemoval=JSON.stringify(a.getState()); } });
      });
      if (scenario === 'rollback') assert(await page.evaluate(() => __drawing.adapter.rollbackEdit() === false), 'removed rollback reports interrupted transition');
      await page.mouse.up();
      assert(await page.evaluate(() => {
        const {adapter:a,map}=__drawing; const state=a.getState();
        return state.destroyed && !state.dragging && !state.editSession && JSON.stringify(a.getFeatures())===__removalBaseline && JSON.stringify(state)===__afterRemoval && map.dragPan.isEnabled() && !a.getCapabilities().actions.undo && !a.getCapabilities().actions.redo;
      }), `${scenario} removal preserves original model and no stale history continuation`);
    }
  }
  page.off('pageerror', onError); assert(errors.length===0, `uncaught removal errors: ${errors.join('; ')}`);
  return 'REMOVAL_OK';
}
