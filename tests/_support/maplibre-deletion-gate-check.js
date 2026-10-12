async (page) => {
  const assert = (value, message) => { if (!value) throw Error(message); };
  const wait = async (predicate, label) => { try { await page.waitForFunction(predicate); } catch (error) { throw Error(label + ": " + error.message); } };
  for (const width of [1200, 375]) {
    await page.setViewportSize({ width, height: 1000 }); await page.reload();
    await wait(() => window.__drawingReady, 'demo ready');
    await page.evaluate(async () => {
      const { uiLoader } = await import(new URL('../js/ui/ui.loader.js', location.href).href);
      const create = await uiLoader.get('ui.map.drawing.maplibre'), createTools = await uiLoader.get('ui.map.drawing');
      const { map } = __drawing; __drawing.tools.destroy(); __drawing.adapter.destroy();
      window.__gate = { requests: [], errors: [], behavior: 'veto', deletes: 0, events: [], create, createTools };
      const adapter = create(map, { beforeDelete(request) {
        __gate.requests.push(request);
        if (__gate.behavior === 'allow') return true;
        if (__gate.behavior === 'undefined') return;
        if (__gate.behavior === 'error') throw Error('intentional deletion gate error');
        if (__gate.behavior === 'async') return Promise.resolve(true);
        if (__gate.behavior === 'async-error') return Promise.reject(Error('intentional async gate error'));
        if (__gate.behavior === 'recursive') {
          __gate.recursion = [adapter.deleteSelected(), adapter.clear(), request.confirm()];
        }
        return false;
      }, onError(error) { __gate.errors.push(error.message); } });
      const tools = createTools(document.querySelector('#tools'), { adapter, actions: ['delete', 'clear', 'undo', 'redo'], modes: ['select', 'point', 'line'] });
      adapter.on('delete', () => __gate.deletes++);
      for (const name of ['create','update','delete','select','measure','modechange']) adapter.on(name, () => __gate.events.push(name));
      __gate.adapter = adapter; __gate.tools = tools;
      __gate.fixture = [{ type:'Feature', id:0, properties:{ name:'Authored' }, geometry:{ type:'Point', coordinates:[map.getCenter().lng, map.getCenter().lat] } }];
      adapter.setFeatures(__gate.fixture);
    });
    const select = async () => {
      await wait(() => __drawing.map.getSource(__gate.adapter.getState().sourceId)?.loaded(), 'gate source loaded');
      await page.locator('#map canvas').scrollIntoViewIfNeeded();
      await wait(() => {
        const map = __drawing.map, a = __gate.adapter, p = map.project(a.getFeatures()[0].geometry.coordinates);
        return map.queryRenderedFeatures(p, { layers: a.getState().layerIds.slice(0, 3) }).some(f => f.properties.__helperId === '0');
      }, 'gate point rendered');
      const b = await page.locator('#map canvas').boundingBox(); await page.mouse.click(b.x+b.width/2,b.y+b.height/2);
      await wait(() => __gate.adapter.getState().selectedFeatureId === '0', 'gate point selected');
    };
    const snapshot = () => page.evaluate(() => JSON.stringify({ state:__gate.adapter.getState(), caps:__gate.adapter.getCapabilities(), deletes:__gate.deletes, events:__gate.events.length }));
    await select(); const initial = await snapshot();
    for (const action of ['delete','clear']) {
      await page.locator(`#tools [data-action="${action}"]`).click();
      assert(await snapshot() === initial, `${action} toolbar veto atomic`);
      assert(await page.evaluate(action => __gate.requests.at(-1).action === action && Object.isFrozen(__gate.requests.at(-1)) && Object.isFrozen(__gate.requests.at(-1).featureIds) && __gate.requests.at(-1).featureIds[0] === 0, action), 'immutable request retains numeric ID');
      await page.evaluate(() => __gate.requests.at(-1).cancel());
    }
    for (const key of ['Delete','Backspace']) {
      await page.locator('#map canvas').focus(); await page.keyboard.press(key);
      assert(await snapshot() === initial, `${key} veto atomic`);
      assert(await page.evaluate(() => __gate.requests.at(-1).action === 'delete'), 'keyboard shares deletion gate');
    }
    assert(await page.evaluate(() => { const r=__gate.requests.at(-1); return r.confirm() && !r.confirm() && __gate.adapter.getFeatures().length===0; }), 'explicit single-use confirmation bypasses hook');
    assert(await page.evaluate(() => !__gate.requests.at(-2).confirm()), 'duplicate pending request cannot replay deletion');
    await page.locator('#tools [data-action="undo"]').click(); assert(await page.evaluate(() => __gate.adapter.getFeatures().length===1), 'confirmed deletion retains undo');
    await select();
    assert(await page.evaluate(() => { const n=__gate.requests.length; __gate.behavior='recursive'; __gate.adapter.deleteSelected(); return __gate.requests.length===n+1 && __gate.recursion.every(v=>v===false) && __gate.adapter.getFeatures().length===1; }), 'recursive attempts denied');
    assert(await page.evaluate(() => { const r=__gate.requests.at(-1); return r.confirm() && __gate.adapter.getFeatures().length===0; }), 'recursive attempts do not replay or bypass pending request');
    await page.evaluate(() => { __gate.adapter.setFeatures(__gate.fixture); __gate.behavior='veto'; }); await select();
    const failedBefore = await snapshot();
    for (const kind of ['undefined','error','async','async-error']) {
      await page.evaluate(kind => { __gate.behavior=kind; __gate.adapter.deleteSelected(); },kind);
      assert(await page.evaluate(() => __gate.adapter.getFeatures().length===1), `${kind} fail closed`);
      assert(await snapshot() === failedBefore, `${kind} preserves model/history/events`);
    }
    assert(await page.evaluate(() => __gate.errors.includes('intentional deletion gate error')), 'gate error reported');
    await wait(() => __gate.errors.includes('intentional async gate error'), 'async error reported');
    assert(await page.evaluate(() => { const r=__gate.requests.at(-1); r.cancel(); return !r.confirm(); }), 'dismissal invalidates capability');
    // Identical re-import and a mode/draft change both invalidate old requests.
    assert(await page.evaluate(() => { __gate.behavior='veto'; __gate.adapter.deleteSelected(); const r=__gate.requests.at(-1); __gate.adapter.setFeatures(__gate.fixture); return !r.confirm() && __gate.adapter.getFeatures().length===1; }), 'same IDs after import are stale');
    await select();
    await page.evaluate(() => { __gate.adapter.deleteSelected(); __gate.pending = __gate.requests.at(-1); });
    const canvasBox = await page.locator('#map canvas').boundingBox();
    await page.mouse.click(canvasBox.x+canvasBox.width*.1,canvasBox.y+canvasBox.height*.1);
    assert(await page.evaluate(() => __gate.adapter.getState().selectedFeatureId===null && !__gate.pending.confirm()), 'changed selection cannot delete old target');
    await select();
    await page.evaluate(() => { __gate.adapter.deleteSelected(); __gate.pending = __gate.requests.at(-1); });
    const vertex = await page.locator('#map canvas').boundingBox();
    await page.mouse.move(vertex.x+vertex.width/2,vertex.y+vertex.height/2); await page.mouse.down();
    assert(await page.evaluate(() => !__gate.pending.confirm() && !__gate.adapter.deleteSelected()), 'real active gesture invalidates and blocks deletion');
    await page.keyboard.press('Escape'); await page.mouse.up();
    await select();
    assert(await page.evaluate(() => { __gate.adapter.clear(); const r=__gate.requests.at(-1); __gate.adapter.setMode('line'); return !r.confirm() && __gate.adapter.getFeatures().length===1; }), 'changed editing context is stale');
    await page.locator('#map canvas').focus(); await page.keyboard.press('Enter');
    const draft = await snapshot(); await page.locator('#tools [data-action="clear"]').click();
    assert(await snapshot() === draft, 'clear veto preserves draft/history/navigation');
    assert(await page.evaluate(() => { const r=__gate.requests.at(-1); return r.confirm() && __gate.adapter.getState().draft.length===0 && __gate.adapter.getFeatures().length===0; }), 'confirmed clear clears exact state');
    // History changes invalidate requests independently of selection/mode changes.
    assert(await page.evaluate(() => {
      __gate.adapter.undo(); __gate.adapter.clear(); const r=__gate.requests.at(-1);
      __gate.adapter.redo(); return !r.confirm() && __gate.adapter.getFeatures().length===0;
    }), 'redo invalidates pending clear');
    await page.evaluate(() => { __gate.adapter.cancel(); __gate.adapter.setFeatures(__gate.fixture); __gate.behavior='allow'; }); await select();
    await page.locator('#map canvas').focus(); await page.keyboard.press('Delete');
    assert(await page.evaluate(() => __gate.adapter.getFeatures().length===0), 'synchronous allow preserves immediate behavior');
    await page.evaluate(() => { __gate.adapter.setFeatures(__gate.fixture); __gate.behavior='veto'; }); await select();
    assert(await page.evaluate(() => { __gate.adapter.deleteSelected(); const r=__gate.requests.at(-1); __gate.tools.destroy(); __gate.adapter.destroy(); return !r.confirm(); }), 'destroy invalidates pending confirmation');
    // A consumer that supplies no hook retains immediate public/keyboard/toolbar deletion.
    await page.evaluate(() => {
      const adapter=__gate.create(__drawing.map, { features:__gate.fixture });
      __gate.adapter=adapter; __gate.tools=__gate.createTools(document.querySelector('#tools'), { adapter, actions:['delete','clear','undo','redo'], modes:['select'] });
    });
    await select(); await page.locator('#map canvas').focus(); await page.keyboard.press('Backspace');
    assert(await page.evaluate(() => __gate.adapter.getFeatures().length===0), 'no-hook keyboard is immediate');
    await page.evaluate(() => __gate.adapter.setFeatures(__gate.fixture));
    await page.locator('#tools [data-action="clear"]').click();
    assert(await page.evaluate(() => __gate.adapter.getFeatures().length===0), 'no-hook toolbar is immediate');
    assert(await page.evaluate(() => { __gate.adapter.setFeatures(__gate.fixture); return __gate.adapter.clear() && __gate.adapter.getFeatures().length===0; }), 'no-hook public clear is immediate');
    await page.evaluate(() => { __gate.tools.destroy(); __gate.adapter.destroy(); });
    // Complete canonical demo confirmation opens immediately, cancel is inert, confirm commits.
    await page.reload(); await wait(() => window.__drawingReady, 'demo ready');
    await page.locator('#import').click(); await page.locator('#confirm-delete').check();
    await page.locator('#tools [data-action="clear"]').click();
    await page.getByRole('dialog').waitFor();
    await page.locator('.ui-modal-root.is-open').waitFor();
    await page.evaluate(async () => {
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      await Promise.allSettled(document.querySelector('.ui-modal-root').getAnimations({ subtree:true }).map(animation => animation.finished));
    });
    await page.screenshot({ path:`output/playwright/maplibre-delete-confirm-${new URL(page.url()).searchParams.has("bundle") ? 'bundle' : 'source'}-${width}.png`, fullPage:true });
    assert(await page.evaluate(() => __drawing.adapter.getFeatures().length===3), 'modal opens before deletion');
    await page.getByRole('button', { name:'Cancel', exact:true }).click();
    await page.getByRole('dialog').waitFor({ state:'detached' });
    await wait(() => !__drawing.deletionPending, 'modal cancellation settled');
    assert(await page.evaluate(() => __drawing.adapter.getFeatures().length===3), 'modal cancellation preserves data');
    await page.locator('#tools [data-action="clear"]').click(); await page.getByRole('dialog').waitFor();
    await page.getByRole('dialog').getByRole('button', { name:'Clear', exact:true }).click();
    await wait(() => __drawing.adapter.getFeatures().length===0, 'modal clear committed');
    await page.screenshot({ path:`output/playwright/maplibre-delete-gate-${new URL(page.url()).searchParams.has("bundle") ? 'bundle' : 'source'}-${width}.png`, fullPage:true });
  }
  console.log('PASS canonical deletion gate toolbar/keyboard/modal at1200/375');
}
