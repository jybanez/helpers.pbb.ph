---
name: helpers-ui-bundle-maintenance
description: Use when working in `C:\wamp64\www\hotline-helpers` and a change may affect the generated UI bundle in `dist/`. This skill defines when `npm run build:ui-bundle` must be rerun, what to verify afterward, and how to keep bundled artifacts aligned with the modular source.
---

# Helpers UI Bundle Maintenance

This skill is for the `hotline-helpers` repo after the additive minified UI bundle was introduced.

The source tree remains the source of truth. The files in `dist/` are generated release artifacts:

- `dist/helpers.ui.bundle.min.js`
- `dist/helpers.ui.bundle.min.css`

Do not edit those files by hand. Regenerate them from source.

## When To Use This Skill

Use this skill when you are:

- changing any bundled `ui.*` or `incident.*` JavaScript module
- changing any bundled `ui.*` or `incident.*` stylesheet
- adding, removing, or moving a `ui.*` or `incident.*` registry entry in `js/ui/ui.loader.js`
- changing bundle generation in `scripts/build.ui.bundle.mjs`
- changing loader bundle wiring such as `preferBundles`, bundle paths, or bundle diagnostics
- preparing a helper release or vendor refresh where teams may consume the generated bundle

Do not use this skill for:

- docs-only changes
- demo-only changes that do not touch bundled source or loader wiring
- changes outside bundled `ui.*` / `incident.*` source

## Current Bundle Contract

The current bundle behavior in `C:\wamp64\www\hotline-helpers` is:

- build command: `npm run build:ui-bundle`
- builder: `scripts/build.ui.bundle.mjs`
- registry source: `js/ui/ui.loader.js`
- main UI bundle scope: non-game `DEFAULT_COMPONENT_REGISTRY` entries whose names start with `ui.` or `incident.`
- game bundle scope: `DEFAULT_COMPONENT_REGISTRY` entries whose names start with `ui.game.`
- outputs:
  - `dist/helpers.ui.bundle.min.js`
  - `dist/helpers.ui.bundle.min.css`
  - `dist/helpers.game.bundle.min.js`
  - `dist/helpers.game.bundle.min.css`

The bundle is additive. Modular source loading remains the default path.

Apps opt in through either:

- `createUiLoader(DEFAULT_COMPONENT_REGISTRY, { preferBundles: true })`
- `uiLoader.setPreferBundles(true)`

With bundle preference enabled, `ui.game.*` resolves through the optional game bundle before the broader `ui` bundle. Keep game helpers out of the main UI bundle so non-game pages do not carry growing game code.

## Rebuild Rules

Rebuild the generated bundle whenever any of the following change:

1. Any JavaScript file referenced by a bundled `ui.*` or `incident.*` registry entry.
2. Any CSS file referenced by a bundled `ui.*` or `incident.*` registry entry.
3. The export shape of a bundled module.
4. Any `DEFAULT_COMPONENT_REGISTRY` path, export, or CSS dependency for `ui.*` or `incident.*`.
5. The bundle builder script in `scripts/build.ui.bundle.mjs`.
6. Bundle loader behavior in `js/ui/ui.loader.js`.

You usually do not need to rebuild when only these change:

- `README.md`
- `CHANGELOG.md`
- tests only
- demo-only content that does not change bundled source or loader behavior
- non-bundled files outside `ui.*` / `incident.*`

## Required Workflow

When the change falls inside bundle scope:

1. Make the source change in modular files first.
2. Rebuild with `npm run build:ui-bundle`.
3. Commit regenerated `dist/helpers.ui.bundle.min.js`, `dist/helpers.ui.bundle.min.css`, `dist/helpers.game.bundle.min.js`, and `dist/helpers.game.bundle.min.css` when the build changes them.
4. Run the bundle contract test and the targeted regression tests for the changed helper.
5. If the change affects how teams consume the loader or bundle, update docs and demo coverage.

## Minimum Verification

Run these after rebuilding:

```powershell
npm run build:ui-bundle
node tests/ui.bundle.contract.mjs
node tests/registry.contract.mjs
```

Then run the focused regressions for the helpers you changed. Examples:

```powershell
node tests/form.modal.regression.mjs
node tests/icons.regression.mjs
node tests/device.primer.regression.mjs
```

## Practical Checks

Before deciding whether to rebuild, inspect the likely impact:

```powershell
rg -n "preferBundles|helpers\\.ui\\.bundle|DEFAULT_COMPONENT_REGISTRY|ui\\.|incident\\." js/ui/ui.loader.js scripts/build.ui.bundle.mjs
rg --files js/ui css/ui js/incident css/incident
```

If the change is inside bundled `ui.*` or `incident.*` source, prefer rebuilding rather than trying to reason around it.

## Output Expectations

When this skill is used, state clearly:

- whether the change is inside current bundle scope
- whether `npm run build:ui-bundle` was rerun
- which verification commands were executed
- whether `dist/` artifacts changed

If the bundle was not rebuilt, explain why that was safe.
