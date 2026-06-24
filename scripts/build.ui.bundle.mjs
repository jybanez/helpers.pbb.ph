import path from "node:path";
import { pathToFileURL } from "node:url";
import { mkdir } from "node:fs/promises";
import esbuild from "esbuild";

const repoRoot = process.cwd();
const loaderUrl = pathToFileURL(path.join(repoRoot, "js", "ui", "ui.loader.js")).href;
const { DEFAULT_COMPONENT_REGISTRY } = await import(loaderUrl);

await mkdir(path.join(repoRoot, "dist"), { recursive: true });

await buildBundle({
  entries: Object.entries(DEFAULT_COMPONENT_REGISTRY)
    .filter(([name, entry]) => (name.startsWith("ui.") || name.startsWith("incident.")) && !name.startsWith("ui.game.") && entry?.js),
  fileBaseName: "helpers.ui.bundle.min",
  globalName: "__PBB_HELPER_UI_BUNDLE__",
  namedExport: "helperUiBundleModules",
  sourceFile: "scripts/build.ui.bundle.entry.js",
});

await buildBundle({
  entries: Object.entries(DEFAULT_COMPONENT_REGISTRY)
    .filter(([name, entry]) => name.startsWith("ui.game.") && entry?.js),
  fileBaseName: "helpers.game.bundle.min",
  globalName: "__PBB_HELPER_GAME_BUNDLE__",
  namedExport: "helperGameBundleModules",
  sourceFile: "scripts/build.game.bundle.entry.js",
});

console.log("Built dist/helpers.ui.bundle.min.js/css and dist/helpers.game.bundle.min.js/css");

async function buildBundle({ entries, fileBaseName, globalName, namedExport, sourceFile }) {
  const jsModuleKeys = unique(entries.map(([, entry]) => stripQuery(entry.js)));
  const cssAssetKeys = unique(entries.flatMap(([, entry]) => {
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
  window.${globalName} = modules;
}

export default modules;
export const ${namedExport} = modules;
${namedExport === "helperUiBundleModules" ? "" : "export const helperUiBundleModules = modules;"}
`;

  await esbuild.build({
    stdin: {
      contents: entrySource,
      resolveDir: repoRoot,
      sourcefile: sourceFile,
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
    outfile: path.join(repoRoot, "dist", `${fileBaseName}.js`),
  });
}

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
