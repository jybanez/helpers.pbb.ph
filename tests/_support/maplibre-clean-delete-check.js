async (page) => {
  const check = (ok, message) => { if (!ok) throw Error(message); }, errors = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const width of [1200, 375]) {
    await page.setViewportSize({ width, height: 1000 }); await page.reload();
    await page.waitForFunction(() => window.__drawingReady);
    await page.evaluate(async () => {
      const { uiLoader } = await import(new URL('../js/ui/ui.loader.js?v=0.21.299', location.href).href);
      if (new URL(location.href).searchParams.has('bundle')) uiLoader.setPreferBundles(true);
      const create = await uiLoader.get('ui.map.drawing.maplibre'), tools = await uiLoader.get('ui.map.drawing');
      const { map } = __drawing; __drawing.tools.destroy(); __drawing.adapter.destroy();
      const fixture = [
        { type: 'Feature', id: 0, properties: { helperStyle: { fill: { r: 10, g: 20, b: 30, a: 0 } } }, geometry: { type: 'Point', coordinates: [123.8857, 10.3157] } },
        { type: 'Feature', id: 'other', properties: {}, geometry: { type: 'Point', coordinates: [123.895, 10.3157] } },
      ];
      const requests = [], events = []; let recursive;
      const a = create(map, { features: fixture, beforeDelete(request) {
        requests.push(request); recursive = [a.deleteSelected(), a.clear(), request.confirm()]; return false;
      } });
      const t = tools(document.querySelector('#tools'), { adapter: a, actions: ['delete', 'finish', 'cancel', 'undo', 'redo', 'clear'] });
      a.on('select', value => events.push({ name: 'select', value, state: a.getState(), reentrant: a.beginEdit('other') }));
      a.on('editchange', value => events.push({ name: 'edit', value }));
      a.updateFeature('other', { properties: { prior: true } }); a.undo(); a.beginEdit(0);
      window.__cleanDelete = { a, t, create, requests, events, fixture, baseline: JSON.stringify(a.getFeatures()), get recursive() { return recursive; } };
    });
    const verify = async (fn, message) => check(await page.evaluate(fn), message);
    await verify(() => {
      const { a, events } = __cleanDelete, token = a.getState().editSession.id, count = events.length;
      return a.getCapabilities().actions.delete && !a.getCapabilities().actions.clear && !a.getCapabilities().actions.finish && !a.getCapabilities().actions.cancel && a.beginEdit(0) && a.getState().editSession.id === token && events.length === count;
    }, 'Clean Delete and same-object idempotence');
    await page.locator('#tools [data-action="delete"]').click();
    await verify(() => {
      const { a, requests, recursive, baseline } = __cleanDelete, request = requests.at(-1);
      const before = JSON.stringify(a.getState());
      return request.featureIds[0] === 0 && recursive.every(v => v === false) && request.cancel() && !request.confirm() && JSON.stringify(a.getState()) === before && JSON.stringify(a.getFeatures()) === baseline;
    }, 'Cancelled numeric-zero request retains clean session/model; recursive bypass blocked');
    await verify(() => {
      const { a, requests, baseline } = __cleanDelete; a.rollbackEdit(); const redo = a.getCapabilities().actions.redo; a.beginEdit(0);
      a.deleteSelected(); const request = requests.at(-1); a.beginEdit('other');
      const event = __cleanDelete.events.filter(e => e.name === 'select').at(-1);
      return redo && !request.confirm() && JSON.stringify(a.getFeatures()) === baseline && event.state.editSession.featureId === 'other' && event.state.selectedFeatureId === 'other' && event.reentrant === false;
    }, 'Cancellation preserves global redo; switch invalidates request with coherent read-only selection');
    await page.evaluate(() => { const { a, requests } = __cleanDelete; a.beginEdit(0); a.deleteSelected(); __cleanDelete.pending = requests.at(-1); });
    await page.locator('#map canvas').scrollIntoViewIfNeeded();
    await page.waitForFunction(() => __drawing.map.getSource(__cleanDelete.a.getState().sourceId)?.loaded());
    const point = await page.evaluate(() => { const map = __drawing.map, b = map.getCanvas().getBoundingClientRect(), p = map.project(__cleanDelete.fixture[0].geometry.coordinates); return { x: b.left + p.x, y: b.top + p.y }; });
    await page.mouse.move(point.x, point.y); await page.mouse.down();
    await verify(() => {
      const { a, requests, pending } = __cleanDelete, count = requests.length;
      return a.getState().dragging && a.beginEdit('other') === false && !a.getCapabilities().actions.delete && !a.deleteSelected() && requests.length === count && !pending.confirm();
    }, 'Actual drag disables Delete and invalidates pending confirmation');
    await page.keyboard.press('Escape'); await page.mouse.up();
    await verify(() => {
      const { a, requests } = __cleanDelete; a.beginEdit(0); a.deleteSelected(); const pending = requests.at(-1);
      a.updateFeature(0, { properties: { changed: true } }); const count = requests.length;
      const blocked = !a.getCapabilities().actions.delete && !a.deleteSelected() && !a.clear() && requests.length === count && !pending.confirm();
      a.undo(); return blocked && !a.getState().editSession.dirty && a.getCapabilities().actions.delete && a.getFeatureStyle(0).fill.a === 0;
    }, 'Dirty Delete never opens gate; Undo-to-clean preserves alpha zero');
    await page.locator('#tools [data-action="delete"]').click();
    await verify(() => {
      const { a, requests, baseline } = __cleanDelete, request = requests.at(-1);
      if (!request.confirm() || request.confirm() || a.getState().editSession || a.getState().selectedFeatureId !== null || a.getFeatures().length !== 1) return false;
      a.undo(); if (JSON.stringify(a.getFeatures()) !== baseline || a.getFeatureStyle(0).fill.a !== 0) return false;
      a.undo(); if (JSON.stringify(a.getFeatures()) !== baseline) return false;
      a.redo(); return a.getFeatures().length === 1;
    }, 'Confirmed clean deletion closes session and creates exactly one global undo unit');
    await verify(() => {
      const { a, requests } = __cleanDelete; a.undo(); a.beginEdit(0); a.deleteSelected(); const pending = requests.at(-1); a.destroy(); return !pending.confirm();
    }, 'Destruction invalidates clean-session request');
    await verify(() => {
      const { create, fixture } = __cleanDelete; const a = create(__drawing.map, { features: fixture }); __cleanDelete.a = a;
      a.beginEdit(0); if (!a.deleteSelected() || a.getState().editSession || a.getFeatures().length !== 1) return false;
      a.undo(); a.beginEdit(0); let late = 0; a.on('delete', () => __drawing.map.remove()); a.on('editchange', () => late++); a.deleteSelected();
      return a.getState().destroyed && !a.getState().editSession && a.getFeatures().length === 1 && late === 0;
    }, 'Legacy no-hook deletion stays immediate; removal during confirmed publication cannot resume edit');
  }
  check(!errors.length, errors.join('; ')); return 'CLEAN_DELETE_OK';
}
