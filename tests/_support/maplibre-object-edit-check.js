async (page) => {
  const assert = (condition, message) => { if (!condition) throw Error(message); };
  for (const width of [1200, 375]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.reload(); await page.waitForFunction(() => window.__drawingReady);
    await page.locator('#import').click();
    const result = await page.evaluate(() => {
      const { adapter: a, sample, map } = __drawing;
      const check = (ok, text) => { if (!ok) throw Error(text); };
      const same = (x, y) => JSON.stringify(x) === JSON.stringify(y);
      const original = a.getFeatures();
      let callbacks = 0, callbackSafe = true;
      const offs = ['select', 'update', 'statechange', 'editchange', 'measure'].map(name => a.on(name, () => {
        callbacks++;
        const before = JSON.stringify(a.getState());
        const attempts = [() => a.beginEdit('route'), () => a.acceptEdit(), () => a.rollbackEdit(), () => a.finish(), () => a.cancel(), () => a.updateFeature('route', { properties: { reentrant: true } }), () => a.setMode('point'), () => a.setFeatures(sample), () => a.undo(), () => a.redo(), () => a.deleteSelected(), () => a.clear(), () => a.destroy(), () => a.destroy(true)];
        for (const run of attempts) {
          try { callbackSafe &&= run() === false && JSON.stringify(a.getState()) === before; }
          catch (_) { callbackSafe = false; }
        }
      }));
      check(a.beginEdit(0), 'begin reentrant numeric zero'); a.updateFeature(0, { properties: { preview: true } }); a.rollbackEdit();
      offs.forEach(off => off());
      check(callbackSafe && callbacks > 5 && same(a.getFeatures(), original), 'reentrant rollback preserves original context');
      check(a.beginEdit(0), 'begin numeric zero');
      const sessionId = a.getState().editSession.id;
      check(a.getState().selectedFeatureId === '0' && same(a.getState().anchor, sample[0].geometry.coordinates), 'selection and geographic anchor');
      const fill = { r: 13, g: 124, b: 250, a: .123456789 }, stroke = { r: 250, g: 30, b: 70, a: 0 };
      check(a.updateFeature(0, { geometry: { type: 'Point', coordinates: [123.879, 10.319] }, properties: { name: 'Edited', nested: { keep: true } }, style: { fill, stroke } }, { sessionId }), 'atomic edit');
      check(a.getState().editSession.dirty && a.getFeatures()[0].id === 0, 'dirty numeric ID');
      const state = JSON.stringify(a.getState());
      for (const patch of [{ style: { fill: { ...fill, a: 2 } } }, { properties: { bad: NaN } }, { geometry: { type: 'Point', coordinates: [300, 0] } }, { style: { unsupported: fill } }, { style: { fill: { ...fill, r: 1.5 } } }]) {
        let threw = false; try { a.updateFeature(0, patch); } catch (error) { threw = error instanceof TypeError; }
        check(threw && JSON.stringify(a.getState()) === state, 'invalid update atomicity');
      }
      check(a.setMode('point') === false && a.setFeatures(sample) === false && a.beginEdit('route') === false && a.updateFeature('route', { properties: {} }) === false && !a.deleteSelected() && !a.clear(), 'session context lock');
      a.undo(); check(same(a.getFeatures(), original), 'local undo'); a.redo(); check(a.getState().editSession.dirty, 'local redo');
      const escaped = a.getFeatureStyle(0); escaped.fill.a = 1; check(a.getFeatureStyle(0).fill.a === fill.a, 'defensive style');
      check(a.rollbackEdit(sessionId) && same(a.getFeatures(), original), 'rollback geometry properties styles');
      check(!a.getCapabilities().actions.undo, 'rollback leaves original empty history');
      // Preserve a pre-existing redo stack across a cancelled session and no-op accept.
      a.updateFeature('route', { properties: { name: 'prior' } }); a.undo();
      check(a.getCapabilities().actions.redo && a.beginEdit(0), 'pre-existing redo');
      a.updateFeature(0, { style: { fill } }); a.cancel();
      check(a.getCapabilities().actions.redo && same(a.getFeatures(), original), 'cancel preserves redo');
      a.beginEdit(0); a.finish(); check(a.getCapabilities().actions.redo, 'no-op accept preserves redo');
      a.redo(); check(a.getFeatures()[1].properties.name === 'prior', 'restored prior redo');
      a.beginEdit(0); const active = a.getState().editSession.id;
      check(!a.updateFeature(0, { style: { fill } }, { sessionId }) && !a.acceptEdit(sessionId) && !a.rollbackEdit(sessionId), 'stale session IDs');
      a.updateFeature(0, { style: { fill, stroke } });
      a.updateFeature(0, { geometry: { type: 'Point', coordinates: [123.88, 10.32] } });
      const accepted = a.getFeatures(); a.acceptEdit(active); a.undo();
      check(same(a.getFeatures()[0], original[0]) && a.getFeatures()[1].properties.name === 'prior', 'accepted session one global undo unit');
      a.redo(); check(same(a.getFeatures(), accepted), 'accepted geometry and style global redo');
      const paint = map.getSource(a.getState().sourceId)._data.features.find(f => f.properties.__helperId === '0').properties;
      check(paint.__helperfillOpacity === fill.a && paint.__helperstrokeOpacity === 0 && paint.__helperfillColor === 'rgb(13,124,250)', 'precise render data');
      check(map.getPaintProperty(a.getState().layerIds[2], 'circle-stroke-opacity') !== undefined, 'point stroke paint');
      const exported = JSON.parse(JSON.stringify(a.getFeatures())); a.setFeatures(exported); check(same(a.getFeatures(), exported), 'style JSON storage round trip');
      a.updateFeature(0, { style: null }); check(same(a.getFeatureStyle(0), {}), 'remove style restores defaults');
      a.setFeatures(sample); a.beginEdit(0);
      return { sessionId: a.getState().editSession.id };
    });
    // Real pointer drag inside a session, then Cancel through complete toolbar.
    const pos = await page.evaluate(() => {
      const { adapter, map } = __drawing; const canvas = map.getCanvas().getBoundingClientRect(); const p = map.project(adapter.getFeatures()[0].geometry.coordinates);
      return { x: canvas.left + p.x, y: canvas.top + p.y };
    });
    await page.mouse.move(pos.x, pos.y); await page.mouse.down(); await page.mouse.move(pos.x + 20, pos.y + 25, { steps: 5 });
    assert(await page.evaluate(() => __drawing.adapter.getState().dragging && !__drawing.adapter.acceptEdit() && !__drawing.adapter.updateFeature(0, { properties: {} })), 'active drag blocks finish and edits');
    assert(await page.evaluate(() => {
      const { adapter: a, sample } = __drawing; const id = a.getState().editSession.id;
      let rejects = 0, safe = true; const off = a.on('statechange', state => {
        if (state.dragging || !state.editSession) return;
        const before = JSON.stringify(a.getState());
        try { safe &&= a.acceptEdit(id) === false && a.rollbackEdit(id) === false && a.destroy(true) === false && a.setMode('point') === false && JSON.stringify(a.getState()) === before; }
        catch (_) { safe = false; }
        rejects++;
      });
      const result = a.rollbackEdit(id); off();
      return result && safe && rejects > 0 && JSON.stringify(a.getFeatures()) === JSON.stringify(sample) && !a.getState().dragging && !a.getState().editSession && !a.getCapabilities().actions.undo;
    }), 'rollback during active drag preserves original geometry and history');
    await page.mouse.up();
    assert(await page.evaluate(() => JSON.stringify(__drawing.adapter.getFeatures()) === JSON.stringify(__drawing.sample) && !__drawing.adapter.getState().editSession), 'late mouseup cannot resurrect active-drag rollback');
    await page.evaluate(() => __drawing.adapter.beginEdit(0));
    await page.mouse.move(pos.x, pos.y); await page.mouse.down(); await page.mouse.move(pos.x + 20, pos.y + 25, { steps: 5 }); await page.mouse.up();
    assert(await page.evaluate(() => __drawing.adapter.getState().editSession.dirty), 'real session vertex drag dirty');
    await page.locator('#tools [data-action="cancel"]').click();
    assert(await page.evaluate(() => JSON.stringify(__drawing.adapter.getFeatures()) === JSON.stringify(__drawing.sample) && !__drawing.adapter.getState().editSession), 'complete toolbar rollback');
    await page.locator('#edit-object').click(); await page.locator('#apply-style').click();
    await page.locator('#tools [data-action="finish"]').click();
    assert(await page.evaluate(() => !!__drawing.adapter.getFeatures()[0].properties.helperStyle && !__drawing.adapter.getState().editSession), 'complete color picker and finish');
    await page.locator('#confirm-delete').check(); await page.locator('#tools [data-action="delete"]').click();
    await page.evaluate(() => __drawing.adapter.beginEdit(0));
    await page.getByRole('dialog').getByRole('button', { name: 'Delete', exact: true }).click();
    assert(await page.evaluate(() => __drawing.adapter.getFeatures().length === 3 && !!__drawing.adapter.getState().editSession), 'begin session invalidates pending delete');
    await page.evaluate(() => __drawing.adapter.rollbackEdit()); await page.locator('#confirm-delete').uncheck();
    await page.evaluate(() => {
      const { adapter: a, map, style } = __drawing;
      const fill = { r: 255, g: 40, b: 100, a: .4 }, stroke = { r: 40, g: 255, b: 150, a: .8 };
      a.updateFeature('area', { style: { fill, stroke } }); a.updateFeature('route', { style: { stroke } });
      const original = JSON.stringify(a.getFeatures());
      a.beginEdit('area'); const shape = a.getFeatures().find(f => f.id === 'area');
      shape.geometry.coordinates[0][0][0] += .001; shape.geometry.coordinates[0][3] = [...shape.geometry.coordinates[0][0]];
      a.updateFeature('area', { geometry: shape.geometry, style: { fill: { ...fill, a: 0 } } }); a.rollbackEdit();
      if (JSON.stringify(a.getFeatures()) !== original) throw Error('polygon geometry/style rollback');
      window.__editExpected = original; map.setStyle(structuredClone(style));
    });
    await page.waitForFunction(() => { const { map, adapter } = __drawing; return map.isStyleLoaded() && map.getSource(adapter.getState().sourceId)?.loaded(); });
    assert(await page.evaluate(() => JSON.stringify(__drawing.adapter.getFeatures()) === __editExpected && !!__drawing.map.getPaintProperty(__drawing.adapter.getState().layerIds[0], 'fill-opacity')), 'styled line/polygon rehydrate unchanged');
    await page.screenshot({ path: `output/playwright/maplibre-object-edit-${new URL(page.url()).search ? 'bundle' : 'source'}-${width}.png`, fullPage: true });
    for (const attempt of ['rollback', 'accept', 'destroy', 'context']) {
      await page.evaluate(attempt => {
        const { adapter: a, sample } = __drawing;
        a.setFeatures(sample); a.updateFeature('route', { properties: { priorHistory: true } });
        window.__dragBaseline = JSON.stringify(a.getFeatures());
        a.beginEdit(0); window.__dragReentrant = { attempt, rejected: 0, safe: true };
      }, attempt);
      await page.locator('#map canvas').scrollIntoViewIfNeeded();
      const start = await page.evaluate(() => {
        const { adapter, map } = __drawing; const b = map.getCanvas().getBoundingClientRect(); const p = map.project(adapter.getFeatures()[0].geometry.coordinates);
        return { x: b.left + p.x, y: b.top + p.y };
      });
      await page.mouse.move(start.x, start.y); await page.mouse.down(); await page.mouse.move(start.x + 16, start.y + 20, { steps: 4 });
      assert(await page.evaluate(() => __drawing.adapter.getState().dragging), 'supplemental drag active');
      // Arm immediately before real mouseup, matching the independent review repro.
      await page.evaluate(() => {
        const { adapter: a, sample } = __drawing;
        window.__dragOff = a.on('statechange', state => {
          if (state.dragging || !state.editSession) return;
          const before = JSON.stringify(a.getState());
          const result = __dragReentrant.attempt === 'rollback' ? a.rollbackEdit(state.editSession.id)
            : __dragReentrant.attempt === 'accept' ? a.acceptEdit(state.editSession.id)
            : __dragReentrant.attempt === 'destroy' ? a.destroy()
            : a.setFeatures(sample);
          __dragReentrant.safe &&= result === false && JSON.stringify(a.getState()) === before;
          __dragReentrant.rejected++;
        });
      });
      await page.mouse.up();
      assert(await page.evaluate(() => { __dragOff(); return __dragReentrant.safe && __dragReentrant.rejected > 0 && !!__drawing.adapter.getState().editSession && !__drawing.adapter.getState().dragging; }), `callback ${attempt} rejects without stale continuation`);
      const check = await page.evaluate(attempt => {
        const { adapter: a, map, sample } = __drawing;
        if (attempt === 'accept') {
          const edited = JSON.stringify(a.getFeatures()); a.acceptEdit(); a.undo();
          const original = JSON.stringify(a.getFeatures()) === __dragBaseline;
          a.redo(); const replay = JSON.stringify(a.getFeatures()) === edited;
          a.undo(); a.undo(); return original && replay && JSON.stringify(a.getFeatures()) === JSON.stringify(sample);
        }
        if (attempt === 'destroy') { a.destroy(); return JSON.stringify(a.getFeatures()) === __dragBaseline && map.dragPan.isEnabled() && !a.getState().dragging; }
        a.rollbackEdit(); const original = JSON.stringify(a.getFeatures()) === __dragBaseline;
        a.undo(); const history = JSON.stringify(a.getFeatures()) === JSON.stringify(sample);
        a.redo(); return original && history && JSON.stringify(a.getFeatures()) === __dragBaseline;
      }, attempt);
      assert(check, `${attempt} after notification preserves original history and geometry`);
      if (attempt === 'destroy') await page.locator('#recreate').click();
    }
    await page.evaluate(() => __drawing.adapter.beginEdit(0));
    await page.locator('#map canvas').focus(); await page.keyboard.press('Escape');
    assert(await page.evaluate(() => !__drawing.adapter.getState().editSession), 'keyboard rollback');
    await page.evaluate(() => { const { adapter: a } = __drawing; a.beginEdit(0); a.updateFeature(0, { properties: { preview: true } }); a.destroy(); });
    assert(await page.evaluate(() => !__drawing.adapter.getFeatures()[0].properties.preview && __drawing.map.dragPan.isEnabled()), 'destroy discards preview and restores navigation');
  }
  return 'OBJECT_EDIT_OK';
}
