async (page) => {
  await page.waitForFunction(() => window.__drawingReady);
  const paths = await page.evaluate(() => performance.getEntriesByType('resource').map(r => new URL(r.name).pathname).filter(p => ['/js/ui/', '/css/ui/', '/dist/'].some(prefix => p.startsWith(prefix))));
  const expected = ['/js/ui/ui.loader.js', '/dist/helpers.ui.bundle.min.js', '/dist/helpers.ui.bundle.min.css'];
  if (paths.length !== 3 || expected.some(p => !paths.includes(p))) throw Error(`Expected exactly three Helper assets without modular fallback: ${JSON.stringify(paths)}`);
  return 'BUNDLE_ASSETS_OK';
}
