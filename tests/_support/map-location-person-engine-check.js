async page => {
  await page.waitForFunction(() => document.body.dataset.status !== 'pending', null, { timeout: 30000 });
  if (await page.locator('body').getAttribute('data-status') !== 'pass') throw Error(await page.locator('#results').textContent());
  return await page.locator('#results').textContent();
}
