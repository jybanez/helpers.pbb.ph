import path from "node:path";
import { pathToFileURL } from "node:url";
import { mkdir } from "node:fs/promises";
import esbuild from "esbuild";

const repoRoot = process.cwd();
const loaderUrl = pathToFileURL(path.join(repoRoot, "js", "ui", "ui.loader.js")).href;
const { DEFAULT_COMPONENT_REGISTRY } = await import(loaderUrl);

const uiEntries = Object.entries(DEFAULT_COMPONENT_REGISTRY)
  .filter(([name, entry]) => name.startsWith("ui.") && entry?.js);

const jsModuleKeys = unique(uiEntries.map(([, entry]) => stripQuery(entry.js)));
const cssAssetKeys = unique(uiEntries.flatMap(([, entry]) => {
  const list = Array.isArray(entry?.css) ? entry.css : [];
  return list.map((value) => stripQuery(value));
}));

const jsImports = jsModuleKeys.map((key, index) => `import * as m${index} from "${toRepoImportPath(key)}";`);
const cssImports = cssAssetKeys.map((key) => `import "${toRepoImportPath(key)}";`);
const moduleMapLines = jsModuleKeys.map((key, index) => `  ${JSON.stringify(key)}: m${index},`);

const entrySource = `${jsImports.join("\n")}
${cssImports.join("\n")}

const modules = {
${moduleMapLines.join("\n")}
};

if (typeof window !== "undefined") {
  window.__PBB_HELPER_UI_BUNDLE__ = modules;
}

export default modules;
export const helperUiBundleModules = modules;
`;

await mkdir(path.join(repoRoot, "dist"), { recursive: true });

await esbuild.build({
  stdin: {
    contents: entrySource,
    resolveDir: repoRoot,
    sourcefile: "scripts/build.ui.bundle.entry.js",
    loader: "js",
  },
  bundle: true,
  format: "esm",
  platform: "browser",
  target: ["es2020"],
  minify: true,
  treeShaking: true,
  charset: "utf8",
  logLevel: "info",
  outfile: path.join(repoRoot, "dist", "helpers.ui.bundle.min.js"),
});

console.log("Built dist/helpers.ui.bundle.min.js and dist/helpers.ui.bundle.min.css");

function stripQuery(value) {
  return String(value || "").replace(/\?.*$/, "");
}

function toRepoImportPath(value) {
  if (value.startsWith("./")) {
    return `./js/ui/${value.slice(2)}`;
  }
  if (value.startsWith("../")) {
    return `./js/${value.slice(3)}`;
  }
  if (value.startsWith("../../")) {
    return `./${value.slice(6)}`;
  }
  return value;
}

function unique(list) {
  return Array.from(new Set((Array.isArray(list) ? list : []).filter(Boolean)));
}
