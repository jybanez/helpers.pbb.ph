import { createUiLoader, DEFAULT_COMPONENT_REGISTRY } from "../js/ui/ui.loader.js";

const appendedHrefs = [];

globalThis.window = {
  __PBB_HELPER_STRICT_EMPTY_BUNDLE__: {},
};

globalThis.document = {
  head: {
    appendChild(node) {
      appendedHrefs.push(String(node?.href || ""));
    },
  },
  documentElement: {
    appendChild(node) {
      appendedHrefs.push(String(node?.href || ""));
    },
  },
  querySelector() {
    return null;
  },
  createElement(tagName) {
    return {
      tagName,
      dataset: {},
      addEventListener() {},
      set rel(value) {
        this._rel = value;
      },
      get rel() {
        return this._rel;
      },
      set href(value) {
        this._href = value;
      },
      get href() {
        return this._href;
      },
    };
  },
};

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function expectRejects(fn, pattern, message) {
  try {
    await fn();
  } catch (error) {
    const text = String(error?.message || error || "");
    assert(pattern.test(text), `${message}; got "${text}"`);
    return;
  }
  throw new Error(message);
}

const bundledLoader = createUiLoader(DEFAULT_COMPONENT_REGISTRY, {
  preferBundles: true,
  bundles: {
    ui: {
      prefixes: ["ui.", "incident."],
      js: "../../dist/helpers.ui.bundle.min.js",
      css: ["../../dist/helpers.ui.bundle.min.css"],
      globalName: "__PBB_HELPER_STRICT_EMPTY_BUNDLE__",
    },
  },
});

await bundledLoader.ensureStyles("incident.types");

assert(appendedHrefs.length === 1, "bundle-preferring incident styles should append one bundle stylesheet.");
assert(appendedHrefs[0].includes("/dist/helpers.ui.bundle.min.css"), "bundle-preferring incident styles should request the generated UI bundle CSS.");
assert(!appendedHrefs.some((href) => href.includes("/css/incident/")), "bundle-preferring incident styles must not request css/incident source files.");

await expectRejects(
  () => bundledLoader.get("incident.types", { css: false }),
  /bundle "ui" is missing module "\.\.\/incident\/incident\.[^"]+\.js"/,
  "bundle-preferring incident module loads should fail loudly instead of falling back to source when the bundle map is missing the module",
);

const noCssBundleLoader = createUiLoader(DEFAULT_COMPONENT_REGISTRY, {
  preferBundles: true,
  bundles: {
    ui: {
      prefixes: ["ui.", "incident."],
      js: "../../dist/helpers.ui.bundle.min.js",
      css: [],
      globalName: "__PBB_HELPER_STRICT_EMPTY_BUNDLE__",
    },
  },
});

await expectRejects(
  () => noCssBundleLoader.ensureStyles("incident.types"),
  /does not declare bundle CSS/,
  "bundle-preferring incident style loads should fail loudly when the selected bundle has no CSS URL",
);

console.log("UI loader strict bundle regression passed.");
