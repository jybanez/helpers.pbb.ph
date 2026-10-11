async (page) => {
  await page.waitForFunction(() => window.__iconReady);
  const result = await page.evaluate(() => {
    const icons = [...document.querySelectorAll('[data-icon="map.layer"]')];
    return icons.length === 8 && icons.every(icon => icon.getAttribute("stroke") === "currentColor" && icon.getAttribute("fill") === "none" && icon.getAttribute("viewBox") === "0 0 24 24" && icon.querySelectorAll("path").length === 3 && icon.getAttribute("aria-hidden") === "true") && ["dark", "light"].every(theme => {
      const group = [...document.querySelectorAll(`.${theme} svg`)];
      return JSON.stringify(group.map(svg => Number(svg.getAttribute("width")))) === "[16,20,24,32]" && group.every(svg => getComputedStyle(svg).color === getComputedStyle(svg.closest(".theme")).color);
    });
  });
  if (!result) throw Error("Icon size/color/theme contract failed");
  await page.setViewportSize({ width: 900, height: 800 });
  await page.screenshot({ path: `output/playwright/map-layer-icon-${new URL(page.url()).search ? 'bundle' : 'source'}.png`, fullPage: true });
  console.log("PASS dark/light16/20/24/32 currentColor preview");
}
