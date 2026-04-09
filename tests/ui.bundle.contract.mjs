import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createUiLoader, DEFAULT_COMPONENT_REGISTRY } from "../js/ui/ui.loader.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bundleJsPath = path.join(repoRoot, "dist", "helpers.ui.bundle.min.js");
const bundleCssPath = path.join(repoRoot, "dist", "helpers.ui.bundle.min.css");

if (!fs.existsSync(bundleJsPath)) {
  throw new Error("Missing dist/helpers.ui.bundle.min.js");
}

if (!fs.existsSync(bundleCssPath)) {
  throw new Error("Missing dist/helpers.ui.bundle.min.css");
}

const loader = createUiLoader(DEFAULT_COMPONENT_REGISTRY, { preferBundles: true });
const icons = await loader.get("ui.icons", { css: false });
const createFormModal = await loader.get("ui.form.modal", { css: false });
const diagnostics = loader.getDiagnostics();

if (typeof icons?.createIcon !== "function") {
  throw new Error("Bundle-backed ui.icons did not expose createIcon().");
}

if (typeof createFormModal !== "function") {
  throw new Error("Bundle-backed ui.form.modal did not resolve to a factory function.");
}

if (!diagnostics.loadedBundles.includes("ui")) {
  throw new Error("Loader did not record the shared ui bundle as loaded.");
}

if (!diagnostics.loadedModules.includes("ui.icons") || !diagnostics.loadedModules.includes("ui.form.modal")) {
  throw new Error("Loader did not record bundle-backed module requests.");
}

console.log("UI bundle contract test passed.");
