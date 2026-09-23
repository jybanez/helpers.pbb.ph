# Production UI without source modules

Ship `helpers.ui.bundle.min.js` and `helpers.ui.bundle.min.css` together. Starting with cache revision `0.21.202`, the ES module exports a bundle-native `uiLoader` and the complete `AI_ICONS` pack:

```js
import { uiLoader, AI_ICONS } from "./vendor/pbb-helper/dist/helpers.ui.bundle.min.js?v=0.21.202";

await uiLoader.loadMany(["ui.action.modal", "ui.form.modal.login", "ui.stepper"]);
const createActionModal = await uiLoader.get("ui.action.modal");
const createLoginFormModal = await uiLoader.get("ui.form.modal.login");
const icons = await uiLoader.get("ui.icons");
icons.registerIconPack(AI_ICONS);
```

Use the appropriate relative URL for the importing application module. Remove imports of `js/ui/ui.loader.js` and `js/ui/ui.icons.ai.js`, and remove `setPreferBundles(true)` calls: this accessor always uses its embedded modules and never falls back to source. AI icons are included but registered explicitly, preserving application control of the icon catalog. `get("ui.icons.ai")` also returns the pack.

Supported methods: `has`, `resolve`, `ensureStyles`, `load`, `loadMany`, `get`, and `create`. `get` resolves the canonical registry export (a factory or module namespace); `load` returns registry metadata unless `{ js: true }` requests the module namespace. `create` invokes a resolved factory. This is a fixed production registry, not a replacement for the source loader's custom registration, groups, diagnostics, or configuration APIs.

By default, loading/getting a component waits for one stylesheet adjacent to the imported bundle, carrying the bundle URL's query string. Concurrent loads share the stylesheet request. CSS failure rejects the request and permits a retry; there is no source fallback. `{ css: false }` is supported when the application already loads the bundled CSS. `{ parent }` selects the stylesheet container; `{ recursive: false }` skips registry dependency traversal. No `js/**` or `css/**` files are fetched by this accessor.

The main bundle covers general `ui.*` and `incident.*` aliases, including dialog/form aliases. Game and inspection components remain in their separate optional bundles; requesting those or unknown names through this accessor rejects explicitly. Components that intentionally use external services/assets still require their normal application configuration.

Existing `helperUiBundleModules`, default module-map export, and `window.__PBB_HELPER_UI_BUNDLE__` remain compatible with the source loader. See `examples/bundle-only.html` for a minimal interactive example.
