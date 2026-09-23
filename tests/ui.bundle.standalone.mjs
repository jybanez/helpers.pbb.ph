import assert from "node:assert/strict";
import { mkdtemp, copyFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { DEFAULT_COMPONENT_REGISTRY } from "../js/ui/ui.loader.js";
import { AI_ICONS as sourceIcons } from "../js/ui/ui.icons.ai.js";

// Only the production artifact exists here: source imports cannot accidentally pass.
const dir = await mkdtemp(path.join(tmpdir(), "helper-dist-only-"));
try {
  const file = path.join(dir, "helpers.ui.bundle.min.mjs");
  await copyFile(new URL("../dist/helpers.ui.bundle.min.js", import.meta.url), file);
  const { uiLoader, AI_ICONS, helperUiBundleModules } = await import(pathToFileURL(file));
  let count = 0;
  for (const [name, entry] of Object.entries(DEFAULT_COMPONENT_REGISTRY)) {
    if (!(name.startsWith("ui.") || name.startsWith("incident.")) || name.startsWith("ui.game.") || name.startsWith("ui.inspection.")) continue;
    const module = helperUiBundleModules[entry.js.replace(/\?.*$/, "")];
    assert.ok(module, name);
    assert.equal(await uiLoader.get(name, { css: false }), entry.export ? module[entry.export] : module, name);
    assert.equal(await uiLoader.load(name, { css: false, js: true }), module, name);
    count++;
  }
  assert.deepEqual(AI_ICONS, sourceIcons);
  assert.equal(await uiLoader.get("ui.icons.ai", { css: false }), AI_ICONS);
  assert.equal(uiLoader.has("ui.game.core"), false);
  await assert.rejects(uiLoader.get("ui.game.core"), /does not include/);
  await assert.rejects(uiLoader.get("toString"), /does not include/);
  const icons = await uiLoader.get("ui.icons", { css: false });
  icons.registerIconPack(AI_ICONS);
  assert.ok(icons.listIcons().includes("ai.openai"));
  assert.equal((await uiLoader.loadMany(["ui.stepper", "ui.form.modal.login"], { css: false })).length, 2);
  console.log(`Dist-only bundle: ${count} aliases and AI icon registration passed.`);
} finally {
  await rm(dir, { recursive: true, force: true });
}
