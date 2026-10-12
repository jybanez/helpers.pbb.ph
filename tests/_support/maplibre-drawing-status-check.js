async page => {
  // Navigate inside the browser so Windows shell quoting cannot alter '&compact'.
  await page.goto(page.url() + '&compact');
  const check = (value, message) => { if (!value) throw Error(message); };
  const select = () => page.locator('#tools [data-mode="select"]');
  const status = () => page.locator('#tools .ui-map-drawing-status');
  for (const width of [1200, 375]) {
    await page.setViewportSize({width, height: 1000});
    await page.reload(); await page.waitForFunction(() => window.__drawingReady);
    await page.locator('#map canvas').scrollIntoViewIfNeeded();
    check(await page.evaluate(() => !__drawing.tools.getState().options.showModeTransitionStatus), 'suppressed at initialization');
    check(await status().count() === 0, 'no initial status');
    await page.evaluate(async () => {
      const {uiLoader} = await import('/js/ui/ui.loader.js?v=0.21.308');
      const createTools = await uiLoader.get('ui.map.drawing');
      const host = document.createElement('div'); document.body.appendChild(host);
      const defaults = createTools(host, {adapter: __drawing.adapter, selectToggle: true});
      if (defaults.getState().options.showModeTransitionStatus !== true) throw Error('default compatibility');
      defaults.destroy(); host.remove();
      const {map, adapter:a} = __drawing; map.jumpTo({bearing:31,pitch:40});
      const b = map.getCanvas().getBoundingClientRect(), ring = [[.2,.3],[.55,.3],[.55,.7],[.2,.7],[.2,.3]].map(([x,y]) => {const p=map.unproject([x*b.width,y*b.height]);return [p.lng,p.lat];});
      a.setFeatures([{type:'Feature',id:0,properties:{retained:{yes:true}},geometry:{type:'Polygon',coordinates:[ring]}}]);
    });
    const p = await page.evaluate(() => {const {map,adapter:a}=__drawing,b=map.getCanvas().getBoundingClientRect(),p=map.project(a.getFeatures()[0].geometry.coordinates[0][0]);return{x:b.x+p.x,y:b.y+p.y};});
    await page.waitForFunction(({x,y}) => {const {map,adapter:a}=__drawing,b=map.getCanvas().getBoundingClientRect();return map.queryRenderedFeatures([x-b.x,y-b.y],{layers:a.getState().layerIds.slice(0,3)}).some(f=>f.properties.__helperId==='0');},p);
    await page.mouse.click(p.x,p.y);
    await page.evaluate(() => {const a=__drawing.adapter;window.__statusBefore=a.getFeatures();a.updateFeature(0,{style:{stroke:{r:9,g:8,b:7,a:1}}});window.__statusAfter=a.getFeatures();});
    const pending = async label => {
      const before = await page.evaluate(() => JSON.stringify(__drawing.adapter.getState()));
      const box = await page.locator('#tools .ui-map-drawing').boundingBox();
      check(await status().count() === 0, label + ' suppressed');
      check(await page.evaluate(() => __drawing.adapter.setMode('pan') === false && __drawing.tools.setMode('pan') === false), label + ' rejection');
      check(await page.evaluate(before => JSON.stringify(__drawing.adapter.getState()) === before, before), label + ' state retained');
      check(await select().isDisabled(), label + ' disabled Select');
      const pressed = await select().getAttribute('aria-pressed');
      await page.evaluate(() => __drawing.tools.update({showModeTransitionStatus:true}));
      check(await status().count() === 1 && (await status().textContent()).length > 0, label + ' default status restored');
      await page.evaluate(() => __drawing.tools.update({showModeTransitionStatus:false}));
      const after = await page.locator('#tools .ui-map-drawing').boundingBox();
      check(await status().count() === 0 && Math.abs(box.width-after.width)<1 && Math.abs(box.height-after.height)<1, label + ' compact dimensions restored');
      check(await select().getAttribute('aria-pressed') === pressed, label + ' mode truth');
      check(await page.evaluate(before => JSON.stringify(__drawing.adapter.getState()) === before, before), label + ' presentation does not mutate pending state');
      if (label === 'draft') await page.screenshot({path:`output/playwright/drawing-status-pending-${page.url().includes('bundle=')?'bundle':'source'}-${width}.png`,fullPage:true});
    };
    // A real handle gesture stays active while presentation updates occur.
    await page.waitForFunction(({x,y}) => {const {map,adapter:a}=__drawing,b=map.getCanvas().getBoundingClientRect();return map.queryRenderedFeatures([x-b.x,y-b.y],{layers:[a.getState().layerIds[3]]}).length;},p);
    await page.mouse.move(p.x,p.y); await page.mouse.down(); await page.mouse.move(p.x+10,p.y+8,{steps:4});
    check(await page.evaluate(() => __drawing.adapter.getState().dragging), 'native active drag');
    await pending('drag');
    await page.locator('#map canvas').focus(); await page.keyboard.press('Escape'); await page.mouse.up();
    check(await page.evaluate(() => JSON.stringify(__drawing.adapter.getFeatures()) === JSON.stringify(__statusAfter)), 'drag cancellation baseline');
    await page.evaluate(() => {const a=__drawing.adapter;const token=a.beginStyleChange();if(!token)throw Error('style begin');a.previewStyle({stroke:{r:1,g:2,b:3,a:1}},token);});
    await pending('style'); await page.locator('#tools [data-action="cancel"]').click();
    check(await page.evaluate(() => !__drawing.adapter.getState().styleChange && JSON.stringify(__drawing.adapter.getFeatures()) === JSON.stringify(__statusAfter)), 'style cancellation baseline');
    await page.evaluate(() => __drawing.adapter.setMode('path'));
    const draftPoint=await page.evaluate(() => {const b=__drawing.map.getCanvas().getBoundingClientRect();return{x:b.x+b.width*.35,y:b.y+b.height*.45};});
    await page.mouse.click(draftPoint.x,draftPoint.y); await pending('draft');
    await page.evaluate(() => __drawing.adapter.undo());
    check(await page.evaluate(() => __drawing.adapter.getState().draft.length === 0 && __drawing.adapter.getCapabilities().actions.redo), 'redo-only draft setup');
    await pending('redo-only draft');
    await page.locator('#tools [data-action="cancel"]').click();
    check(await page.evaluate(() => __drawing.adapter.getMode() === 'select' && JSON.stringify(__drawing.adapter.getFeatures()) === JSON.stringify(__statusAfter)), 'draft Cancel preserves earlier history');
    await select().focus(); await page.keyboard.press('Space');
    await page.evaluate(() => __drawing.tools.update({showModeTransitionStatus:true}));
    check(await select().evaluate(el => el === document.activeElement) && await select().getAttribute('aria-pressed') === 'false', 'update retains keyboard focus/mode');
    await page.evaluate(() => __drawing.tools.update({showModeTransitionStatus:false}));
    await page.keyboard.press('Enter');
    check(await select().getAttribute('aria-pressed') === 'true', 'keyboard restores Select');
    await page.evaluate(() => {const a=__drawing.adapter;a.undo();if(JSON.stringify(a.getFeatures())!==JSON.stringify(__statusBefore))throw Error('earlier undo retained');a.redo();if(JSON.stringify(a.getFeatures())!==JSON.stringify(__statusAfter))throw Error('earlier redo retained');});
    await page.evaluate(() => __drawing.tools.update({measurement:{label:'Independent measurement'}}));
    check(await page.locator('#tools .ui-map-drawing-measurement').textContent() === 'Independent measurement', 'measurement unaffected');
    await page.evaluate(() => __drawing.tools.update({measurement:null}));
    await page.screenshot({path:`output/playwright/drawing-status-${page.url().includes('bundle=')?'bundle':'source'}-${width}.png`});
  }
  return 'DRAWING_STATUS_OK';
}
