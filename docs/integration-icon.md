# Add integration icon

Canonical key: **`actions.integration-add`**. Available with icon/main/game bundle
cache revision **0.21.208**. It belongs to the core catalog; no optional pack is needed.

The original Helper artwork combines a two-pin plug and cable with an adjacent plus
mark. Use it for creating an external-system integration or connection, alongside
the visible action label “Add integration”. It follows the existing 24×24 viewBox,
rounded stroke and `currentColor` conventions and supports 16px compact menus.

```js
const { createIcon } = await uiLoader.get("ui.icons");
label.prepend(createIcon("actions.integration-add", { size: 16 }));
```

Beside visible text, the icon is decorative (`aria-hidden="true"`) by default.
For a standalone meaningful image, pass `{ ariaLabel: "Add integration" }`.
An icon-only button still needs an accessible button label.

Refresh the loader, `ui.icons.js` and `ui.icons.catalog.js` for modular consumers,
or refresh the relevant generated bundle with cache key `0.21.208`. The game bundle
also includes the shared catalog and is regenerated. Package semantic version is
unchanged. See the compact previews and searchable catalog in
[the icon demo](../demos/demo.icons.html).
