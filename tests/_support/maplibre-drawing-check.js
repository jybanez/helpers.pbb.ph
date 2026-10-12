async (page) => {
  const assert = (condition, message) => { if (!condition) throw Error(message); };
  const read = () => page.evaluate(() => __drawing.adapter.getState());
  const count = n => page.waitForFunction(n => __drawing.adapter.getFeatures().length === n, n);
  const mode = name => page.locator(`#tools [data-mode="${name}"]`).click();
  const action = name => page.locator(`#tools [data-action="${name}"]`).click();
  const point = async (x, y) => { const b = await page.locator("#map canvas").boundingBox(); return { x: b.x + b.width * x, y: b.y + b.height * y }; };
  const click = async (x, y) => { const p = await point(x, y); await page.mouse.click(p.x, p.y); };
  const rendered = () => page.waitForFunction(() => __drawing.map.isStyleLoaded() && __drawing.map.getSource(__drawing.adapter.getState().sourceId)?.loaded()).catch(e => { throw Error(`style/source readiness: ${e.message}`); });
  for (const width of [1200, 375]) {
    await page.setViewportSize({ width, height: 1000 });
    if (width === 375) { await page.reload(); }
    await page.waitForFunction(() => window.__drawingReady);
    assert(await page.evaluate(() => maplibregl.getVersion() === "4.6.0" && __drawing.map.version === "4.6.0"), "pinned engine version");
    await page.evaluate(() => {
      window.__testRejectedJson = () => {
        const { adapter, tools, events, map } = __drawing;
        let getterReads = 0;
        const cycle = {}; cycle.self = cycle;
        const sparse = new Array(2); sparse[1] = 1;
        const extended = [1]; extended.extra = 2;
        const symbolKey = { ok: true }; symbolKey[Symbol("hidden")] = 1;
        const hidden = {}; Object.defineProperty(hidden, "lost", { value: 1 });
        const accessor = {}; Object.defineProperty(accessor, "computed", { enumerable: true, get() { getterReads++; return 1; } });
        const invalid = [NaN, Infinity, -Infinity, undefined, () => {}, Symbol("value"), 1n, { nested: [true, { rating: NaN }] }, { missing: undefined }, cycle, new Date(), new Map(), new Set(), new Number(1), new Uint8Array([1]), /x/, Object.create({ inherited: 1 }), sparse, extended, symbolKey, hidden, accessor, { toJSON() { return {}; } }];
        const snapshot = () => JSON.stringify({ state: adapter.getState(), caps: adapter.getCapabilities(), toolbar: tools.getState().features, mode: tools.getState().activeMode, selected: tools.getState().selectedFeatureId, events: events.length, pan: map.dragPan.isEnabled(), keyboard: map.keyboard.isEnabled() });
        const before = snapshot(); let rejected = 0;
        for (const value of invalid) {
          const feature = { type: "Feature", id: "bad-json", properties: { value }, geometry: { type: "Point", coordinates: [1, 2] } };
          for (const submit of [features => adapter.setFeatures(features), features => tools.setFeatures(features)]) {
            try { submit([feature]); } catch (error) { if (!(error instanceof TypeError)) throw error; rejected++; }
            if (snapshot() !== before) throw Error("Rejected JSON import changed model/selection/draft/history/gesture/navigation/events");
          }
        }
        const foreign = { type: "Feature", id: "foreign", properties: {}, geometry: { type: "Point", coordinates: [1, 2] }, unsupported: NaN };
        try { adapter.setFeatures([foreign]); } catch (_) { rejected++; }
        if (snapshot() !== before || getterReads !== 0 || rejected !== invalid.length * 2 + 1) throw Error(`JSON rejection coverage ${rejected}, getter reads ${getterReads}`);
        return rejected;
      };
    });
    await rendered();
    assert(await page.locator('#tools [data-mode="rectangle"]').isDisabled(), "rectangle must be unavailable");
    assert(await page.locator('#tools [data-mode="circle"]').isDisabled(), "circle must be unavailable");
    // Real pointer drawing and toolbar keyboard completion, not synthetic map events.
    await mode("point"); await click(.22, .3); await count(1);
    const initialPoint = (await read()).features[0];
    await mode("line"); await click(.46, .25); await click(.72, .4);
    await page.locator('#tools [data-action="finish"]').focus(); await page.keyboard.press("Enter"); await count(2);
    assert((await read()).features[1].geometry.type === "LineString", "line geometry");
    assert(await page.evaluate(() => __drawing.map.dragPan.isEnabled() && __drawing.map.keyboard.isEnabled()), "finish restores navigation");
    await mode("polygon"); await click(.3, .62); await click(.48, .82); await click(.73, .62); await action("finish"); await count(3);
    const polygon = (await read()).features[2].geometry.coordinates[0];
    assert(JSON.stringify(polygon[0]) === JSON.stringify(polygon.at(-1)), "closed polygon");
    await mode("line"); await click(.3, .4); await action("undo"); assert((await read()).draft.length === 0, "draft undo");
    await action("redo"); assert((await read()).draft.length === 1, "draft redo");
    assert(await page.evaluate(() => __testRejectedJson()) === 47, "invalid imports preserve draft/history");
    await page.locator("#map canvas").focus(); await page.keyboard.press("Escape");
    assert((await read()).draft.length === 0 && (await read()).mode === "select", "cancel discards only draft"); await count(3);
    await action("undo"); await count(2); await action("redo"); await count(3);
    await mode("polygon"); await click(.2, .5); await click(.4, .5); await click(.6, .5); await action("finish");
    assert((await read()).features.length === 3 && (await read()).draft.length === 3, "invalid polygon is rejected without losing draft");
    assert((await page.locator("#status").textContent()).includes("nonzero area"), "invalid draft feedback");
    await action("cancel");
    await rendered();
    // Hit-test and drag the existing waypoint; cancel must roll back previews.
    await click(.22, .3);
    await page.waitForFunction(id => __drawing.adapter.getState().selectedFeatureId === String(id), initialPoint.id);
    const start = await point(.22, .3), end = await point(.27, .4);
    await page.mouse.move(start.x, start.y); await page.mouse.down(); await page.mouse.move(end.x, end.y, { steps: 5 });
    assert(await page.evaluate(() => __testRejectedJson()) === 47, "invalid imports preserve active drag preview and locks");
    await page.keyboard.press("Escape"); await page.mouse.up();
    assert(JSON.stringify((await read()).features[0]) === JSON.stringify(initialPoint), "Escape cancels edit preview");
    await rendered();
    await page.mouse.move(start.x, start.y); await page.mouse.down(); await page.mouse.move(end.x, end.y, { steps: 5 }); await page.mouse.up();
    const edited = (await read()).features[0];
    assert(edited.id === initialPoint.id && JSON.stringify(edited.geometry) !== JSON.stringify(initialPoint.geometry), "drag commits same-ID edit");
    await page.locator("#map canvas").focus(); await page.keyboard.press("Control+z");
    assert(JSON.stringify((await read()).features[0]) === JSON.stringify(initialPoint), "keyboard undo edit");
    await page.keyboard.press("Control+Shift+z");
    assert(JSON.stringify((await read()).features[0]) === JSON.stringify(edited), "keyboard redo edit");
    await page.keyboard.press("Delete"); await count(2); await action("undo"); await count(3);
    // Deep-cloned imports, exact round trip (including numeric zero), atomic rejection.
    await page.locator("#import").click(); await count(3);
    const imported = await page.evaluate(() => {
      const { adapter, sample, tools } = __drawing;
      const roundTrip = JSON.stringify(adapter.getFeatures()) === JSON.stringify(sample);
      const result = adapter.getFeatures(); result[0].properties.nested.retained = false;
      const safe = sample[0].properties.nested.retained && adapter.getFeatures()[0].properties.nested.retained;
      let rejects = 0;
      for (const bad of [
        [{ ...sample[0], geometry: { type: "Point", coordinates: [Infinity, 10] } }],
        [{ ...sample[0], geometry: { type: "LineString", coordinates: [[1, 2]] } }],
        [{ ...sample[0], geometry: { type: "Polygon", coordinates: [[[1, 2], [2, 3], [3, 2]]] } }],
        [sample[0], { ...sample[0], id: "0" }],
        [{ ...sample[0], geometry: { type: "MultiPoint", coordinates: [[1, 2]] } }],
      ]) { try { adapter.setFeatures(bad); } catch (_) { rejects++; } }
      const toolbarBefore = JSON.stringify(tools.getState().features);
      try { tools.setFeatures([{ ...sample[0], geometry: { type: "Point", coordinates: [999, 10] } }]); } catch (_) { /* expected */ }
      return { roundTrip, safe, rejects, unchanged: JSON.stringify(adapter.getFeatures()) === JSON.stringify(sample), toolbarAtomic: toolbarBefore === JSON.stringify(tools.getState().features), toolbarZero: tools.getState().features[0].id === "0" };
    });
    assert(imported.roundTrip && imported.safe && imported.rejects === 5 && imported.unchanged && imported.toolbarAtomic && imported.toolbarZero, `import isolation and rejection ${JSON.stringify(imported)}`);
    assert(await page.evaluate(() => {
      const { adapter, tools, sample } = __drawing;
      const valid = structuredClone(sample);
      valid[0].properties.data = { text: "Unicode ✓", values: [null, true, false, 1.25, -0, { array: [] }], empty: {}, shared: { ok: true } };
      valid[0].properties.same = valid[0].properties.data.shared;
      tools.setFeatures(valid);
      const output = adapter.getFeatures();
      const retained = JSON.stringify(output) === JSON.stringify(valid) && Object.is(output[0].properties.data.values[4], -0);
      output[0].properties.data.shared.ok = false;
      const isolated = valid[0].properties.data.shared.ok && adapter.getFeatures()[0].properties.data.shared.ok;
      tools.setFeatures(sample);
      return retained && isolated;
    }), "valid nested JSON and negative zero round-trip without caller mutation");
    await page.locator("#reload").click(); await rendered();
    await page.evaluate(() => __drawing.map.setStyle(structuredClone(__drawing.style), { diff: false })); await rendered();
    assert((await read()).features.length === 3, "reload preserves model");
    const projected = await page.evaluate(() => { const p = __drawing.map.project(__drawing.sample[0].geometry.coordinates); return { x: p.x, y: p.y }; });
    const box = await page.locator("#map canvas").boundingBox();
    await page.mouse.click(box.x + projected.x, box.y + projected.y);
    await page.waitForFunction(() => __drawing.adapter.getState().selectedFeatureId === "0").catch(e => { throw Error(`post-reload zero-ID selection: ${e.message}`); });
    assert(await page.evaluate(() => __drawing.tools.getState().selectedFeatureId === "0"), "toolbar numeric-zero selection");
    // Line vertex edit is also real pointer input, with one committed update.
    const routePosition = await page.evaluate(() => { const p = __drawing.map.project(__drawing.sample[1].geometry.coordinates[0]); return { x: p.x, y: p.y }; });
    await page.mouse.click(box.x + routePosition.x, box.y + routePosition.y);
    await page.waitForFunction(() => __drawing.adapter.getState().selectedFeatureId === "route");
    await page.mouse.move(box.x + routePosition.x, box.y + routePosition.y); await page.mouse.down();
    await page.mouse.move(box.x + routePosition.x + 12, box.y + routePosition.y + 12, { steps: 4 }); await page.mouse.up();
    assert(JSON.stringify((await read()).features[1].geometry) !== JSON.stringify(await page.evaluate(() => __drawing.sample[1].geometry)), "line vertex edit");
    await rendered();
    // Edit polygon first vertex and retain closure; imported holes are supported too.
    const polygonPosition = await page.evaluate(() => { const p = __drawing.map.project(__drawing.sample[2].geometry.coordinates[0][0]); return { x: p.x, y: p.y }; });
    await page.mouse.click(box.x + polygonPosition.x, box.y + polygonPosition.y);
    await page.waitForFunction(() => __drawing.adapter.getState().selectedFeatureId === "area").catch(e => { throw Error(`polygon selection: ${e.message}`); });
    await page.mouse.move(box.x + polygonPosition.x, box.y + polygonPosition.y); await page.mouse.down();
    await page.mouse.move(box.x + polygonPosition.x + 15, box.y + polygonPosition.y - 15, { steps: 4 }); await page.mouse.up();
    const ring = (await read()).features[2].geometry.coordinates[0];
    assert(JSON.stringify(ring[0]) === JSON.stringify(ring.at(-1)), "edited polygon closure");
    // Listener errors do not bypass teardown/history or suppress other subscribers.
    assert(await page.evaluate(() => {
      const { adapter } = __drawing; let delivered = false;
      const off = adapter.on("delete", () => { throw Error("intentional observer failure"); });
      const off2 = adapter.on("delete", () => { delivered = true; });
      adapter.clear(); off(); off2(); adapter.undo(); return delivered && adapter.getFeatures().length === 3;
    }), "observer isolation");
    await page.screenshot({ path: `output/playwright/maplibre-drawing-${new URL(page.url()).searchParams.has("bundle") ? 'bundle' : 'source'}-${width}.png`, fullPage: true });
    // Preserve host-disabled navigation and remove only owned resources/subscriptions.
    await page.evaluate(() => __drawing.map.keyboard.disable()); await mode("line");
    await page.locator("#map canvas").focus(); await page.keyboard.press("Enter");
    assert((await read()).draft.length === 1, "keyboard creates center vertex");
    const beforeDestroy = await read(); await page.locator("#destroy").click();
    const teardown = await page.evaluate(state => {
      const { map, adapter, listenerBaseline } = __drawing;
      const before = JSON.stringify(adapter.getFeatures()); adapter.clear(); adapter.setFeatures([]); adapter.setMode("point");
      return { destroyed: adapter.getState().destroyed, sourceGone: !map.getSource(state.sourceId), layersGone: state.layerIds.every(id => !map.getLayer(id)), nav: map.dragPan.isEnabled() && !map.keyboard.isEnabled(), inert: before === JSON.stringify(adapter.getFeatures()), listeners: Object.entries(listenerBaseline).every(([name,n]) => (map._listeners?.[name]?.length || 0) === n) };
    }, beforeDestroy);
    assert(Object.values(teardown).every(Boolean), `teardown ${JSON.stringify(teardown)}`);
    await page.locator("#reload").click(); await page.waitForFunction(() => __drawing.map.isStyleLoaded());
    assert(await page.evaluate(id => !__drawing.map.getSource(id), beforeDestroy.sourceId), "no stale style callback");
    await page.locator("#recreate").click(); await rendered();
    assert(await page.evaluate(() => { const { map, adapter } = __drawing; map.remove(); return adapter.getState().destroyed; }), "map removal disposes adapter");
  }
  console.log("PASS actual MapLibre4.6.0 pointer/keyboard drawing/edit/history/import/style/teardown at1200/375");
}
