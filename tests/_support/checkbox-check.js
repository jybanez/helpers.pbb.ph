async (page) => {
  await page.waitForFunction(() => document.body.dataset.status !== 'pending');
  const result = await page.locator('#results').textContent();
  if (result !== 'PASS') throw Error(result);
  await page.evaluate(async () => {
    const module = await import(location.search ? '/dist/helpers.ui.bundle.min.js' : '/js/ui/ui.checkbox.js');
    const createCheckbox = location.search ? await module.uiLoader.get('ui.checkbox') : module.createCheckbox;
    const host = document.body.appendChild(document.createElement('div'));
    window.keyboardCheckbox = createCheckbox(host, { label: 'Keyboard mixed', indeterminate: true });
    window.keyboardChanges = [];
    window.keyboardCheckbox.update({ onChange: ({ checked, indeterminate }) => window.keyboardChanges.push({ checked, indeterminate }) });
  });
  const input = page.getByRole('checkbox', { name: 'Keyboard mixed' });
  await input.focus();
  await input.press('Space');
  const first = await page.evaluate(() => ({ checked: keyboardCheckbox.getChecked(), mixed: keyboardCheckbox.getIndeterminate(), focused: document.activeElement === keyboardCheckbox.refs.input, events: keyboardChanges.length }));
  if (!first.checked || first.mixed || !first.focused || first.events !== 1) throw Error(JSON.stringify(first));
  await page.evaluate(() => keyboardCheckbox.update({ readonly: true, indeterminate: true }));
  await input.focus();
  await input.press('Space');
  const readonly = await page.evaluate(() => ({ checked: keyboardCheckbox.refs.input.checked, mixed: keyboardCheckbox.refs.input.indeterminate, events: keyboardChanges.length }));
  if (!readonly.checked || !readonly.mixed || readonly.events !== 1) throw Error(JSON.stringify(readonly));
  console.log('PASS: state, dash, binary values, readonly/disabled, Space and focus');
}
