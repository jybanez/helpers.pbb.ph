async (page) => {
  const assert = (condition, message) => { if (!condition) throw Error(message); };
  for (const width of [1440, 375]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.reload();
    await page.waitForFunction(() => window.__colorReady);
    await page.waitForSelector('.demo-workbench');
    assert(await page.locator('.demo-shell-nav a.is-active').filter({ hasText: 'Color Picker' }).count() === 1, "shared navigation active entry");
    assert(await page.locator('.demo-workbench__content #options').count() === 1 && await page.locator('.demo-workbench__content #methods').count() === 1, "generated reference panels");
    const result = await page.evaluate(() => {
      const assert = (condition, message) => { if (!condition) throw Error(message); };
      const { picker, combinations, create } = __colorDemo;
      assert(combinations.length === 8, "eight options");
      for (let mask = 0; mask < 8; mask++) {
        const p = combinations[mask];
        assert(p.element.querySelector('.ui-color-picker-alpha').hidden === !(mask & 4), "alpha visibility");
        const displays = p.element.querySelectorAll('.ui-color-picker-displays label');
        assert(displays[0].hidden === !(mask & 2) && displays[1].hidden === !(mask & 1), "display visibility");
        assert(p.getValue().a === 128 / 255, "initial alpha");
        p.setValue({ r: 1, g: 2, b: 3, a: .123456789 });
        p.input.value = '#aabbcc'; p.input.dispatchEvent(new Event('input', { bubbles: true }));
        assert(p.getValue().a === .123456789, "RGB edit preserves alpha in every combination");
        p.update({ showAlpha: !p.getState().showAlpha, showHex: !p.getState().showHex, showRgba: !p.getState().showRgba });
        assert(p.getValue().a === .123456789, "update preserves alpha");
        p.update({ showAlpha: Boolean(mask & 4), showRgba: Boolean(mask & 2), showHex: Boolean(mask & 1) });
      }
      picker.setValue({ r: 1, g: 2, b: 3, a: .123456789 });
      const original = JSON.stringify(picker.getValue()), dom = picker.element.innerHTML;
      for (const value of ['invalid', '#xxxxxx', { r: 300, g: 0, b: 0 }, { r: 0, g: 0, b: 0, a: -1 }]) {
        let threw = false;
        try { picker.update({ value, showAlpha: false, disabled: true }); } catch { threw = true; }
        assert(threw && JSON.stringify(picker.getValue()) === original && picker.element.innerHTML === dom, "invalid update atomic");
      }
      const copy = picker.getValue(); copy.a = 0; assert(picker.getValue().a === .123456789, "defensive value");
      const host = document.createElement('div'); document.body.append(host);
      const events = [], callbacks = [];
      host.addEventListener('ui:color:input', e => events.push(['input', e.detail.value.a]));
      host.addEventListener('ui:color:change', e => events.push(['change', e.detail.value.a]));
      const p = create(host, { name: 'color', onInput: d => callbacks.push(['input', d.value.a]), onChange: (d, api) => { callbacks.push(['change', d.value.a]); api.setValue('#ff000080', { emit: true }); } });
      p.setValue('#11223380'); assert(events.length === 0 && callbacks.length === 0, "silent set");
      p.update({ value: '#00000000' }); assert(events.length === 0, "silent update");
      p.alphaInput.value = '.5'; p.alphaInput.dispatchEvent(new Event('input', { bubbles: true }));
      p.alphaInput.dispatchEvent(new Event('change', { bubbles: true }));
      assert(events.length === 2 && callbacks.length === 2 && events[0][0] === 'input' && events[1][0] === 'change', "input/change and no callback recursion");
      p.update({ onChange: d => callbacks.push(['change', d.value.a]) });
      p.setValue('#00ff00', { emit: true }); p.setValue('#00ff00', { emit: true });
      assert(events.length === 3 && callbacks.length === 3, "programmatic change deduplicated");
      for (const option of ['busy', 'disabled', 'readonly']) {
        p.update({ [option]: true });
        assert(p.input.disabled && p.alphaInput.disabled, "unavailable controls");
        const saved = p.getRgba(); p.input.value = '#ffffff'; p.input.dispatchEvent(new Event('input'));
        assert(p.getRgba() === saved, "unavailable ignores late user events");
        p.update({ [option]: false }); assert(!p.input.disabled && !p.alphaInput.disabled, "reenabled");
      }
      assert(p.element.querySelector('input[type=hidden]').value === p.getRgba(), "native serialization");
      p.destroy(); p.destroy(); p.setValue('#ffffff'); assert(host.children.length === 0, "destroy idempotent"); host.remove();
      picker.setValue('#3399ff80');
      return { bundled: __colorDemo.bundled };
    });
    const alpha = page.locator('#primary input[type=range]');
    await alpha.focus(); const before = await alpha.inputValue(); await page.keyboard.press('ArrowLeft');
    assert(Number(await alpha.inputValue()) < Number(before), "keyboard opacity");
    assert(await page.locator('#primary input[type=color]').getAttribute('aria-label') === 'Color', "RGB accessible label");
    await alpha.click({ position: { x: 20, y: 8 } });
    assert(await page.evaluate(() => __colorDemo.picker.getValue().a < .5), "pointer opacity edit");
    for (const theme of ['dark', 'light']) {
      if (width <= 900) await page.getByRole('button', { name: 'Show demo navigation', exact: true }).click();
      await page.getByLabel('Demo theme', { exact: true }).selectOption(theme);
      if (width <= 900) await page.getByRole('button', { name: 'Hide demo navigation', exact: true }).click();
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "no horizontal overflow");
      await page.screenshot({ path: `output/playwright/color-picker-${result.bundled ? 'bundle' : 'source'}-${width}-${theme}.png` });
    }
    await page.click('#form');
    await page.waitForFunction(() => __colorDemo.form?.getState().open);
    await page.evaluate(() => {
      window.__colorSubmits = 0; window.__colorInvalids = [];
      __colorDemo.form.update({ onSubmit: () => { __colorSubmits++; return false; }, onInvalid: (report, context) => __colorInvalids.push({ report, busy: context.isBusy() }) });
      __colorDemo.form.setValues({ fill: { r: 11, g: 22, b: 33, a: 0 } });
    });
    await page.getByRole('button', { name: 'Save color', exact: true }).click();
    await page.waitForFunction(() => __colorInvalids.length === 1);
    assert(await page.evaluate(() => __colorSubmits === 0 && !__colorInvalids[0].busy && __colorDemo.form.getValues().fill.a === 0), "validate before busy and retain values");
    const color = page.locator('.ui-modal input[type=color]');
    assert(await color.getAttribute('aria-invalid') === 'true', "field accessible error");
    assert(await page.locator('.ui-modal input[type=range]').getAttribute('aria-invalid') === 'true', "opacity accessible error");
    assert(await page.locator('.ui-form-modal-field-error').innerText() === 'Fill color — choose opacity above zero.', "field actionable error");
    await page.waitForFunction(() => document.activeElement?.type === 'color');
    await page.screenshot({ path: `output/playwright/color-picker-form-${result.bundled ? 'bundle' : 'source'}-${width}.png`, fullPage: true });
    await page.evaluate(() => __colorDemo.form.setBusy(true));
    assert(await color.isDisabled() && await page.locator('.ui-modal input[type=range]').isDisabled(), "form busy disables both");
    await page.evaluate(() => { __colorDemo.form.setBusy(false); __colorDemo.form.setValues({ fill: '#ff000080' }); });
    assert(!await color.isDisabled() && !await page.locator('.ui-modal input[type=range]').isDisabled(), "form busy releases controls");
    assert(await color.getAttribute('aria-invalid') !== 'true', "stale error cleared");
    await page.getByRole('button', { name: 'Save color', exact: true }).click();
    await page.waitForFunction(() => __colorSubmits === 1);
    assert(await page.evaluate(() => __colorDemo.form.getValues().fill.a === 128 / 255 && !__colorDemo.form.isBusy()), "form values and completion clears busy");
    await page.evaluate(() => __colorDemo.form.destroy());
    await page.evaluate(() => {
      const assert = (condition, message) => { if (!condition) throw Error(message); };
      for (const option of ['disabled', 'readonly']) {
        const form = __colorDemo.createForm({ rows: [[{ type: 'color-picker', name: 'color', label: 'Color', value: '#12345680', [option]: true }]] });
        form.open(); form.setBusy(true); form.setBusy(false);
        const control = document.querySelector('.ui-modal input[type=color]');
        assert(control.disabled, 'schema state retained after busy');
        assert(form.getValues().color.a === 128 / 255, 'alias and form value');
        form.destroy();
      }
    });
  }
  return "PASS color picker";
}
