# UI Navbar Grouped Mega Menu Proposal

## Summary

Extend the shared `ui.navbar` and `ui.menu` helpers with an accessible grouped mega-menu mode for operational applications that have more destinations than can fit safely in the primary navbar.

The enhancement should remain additive:

- existing navbar items without a menu continue to navigate directly
- existing flat `menuItems` continue to render as the current single-column menu
- grouped menu data opts into the new mega-menu presentation
- mobile navigation flattens the same groups into clearly labelled sections

PBB Library Cloud and Node are the first concrete consumers. The component should remain generic enough for other operational PBB applications.

## Why This Is Needed

PBB Library has a small set of public destinations and a much larger set of permission-controlled operational destinations.

Keeping every operational destination in the navbar causes:

- crowded and wrapping navigation
- inconsistent Cloud and Node layouts
- poor discoverability when labels must be shortened
- duplicated app-specific menu markup and styling
- difficult keyboard and narrow-screen behavior

The existing Helpers navbar supports only one flat `menuItems` array. It does not currently represent section headings with child links or render a multi-column grouped menu.

Library should not implement a private mega menu because navbar structure, focus handling, responsive behavior, placement, styling, and accessibility belong to Helpers.

## Recommended Component Direction

Keep `createNavbar(...)` as the integration point and extend a menu-backed navbar item with `menuGroups`.

Example:

```js
createNavbar(host, {}, {
  items: [
    { id: "home", label: "Home", icon: icons.home },
    { id: "collections", label: "Collections", icon: icons.collections },
    { id: "my-library", label: "My Library", icon: icons.history },
    {
      id: "operations",
      label: "Operations",
      icon: icons.operations,
      menuGroups: [
        {
          id: "overview",
          label: "Overview",
          items: [
            { id: "operations-overview", label: "Operations overview", href: "/admin" }
          ]
        },
        {
          id: "sources",
          label: "Sources",
          items: [
            { id: "source-systems", label: "Source systems", href: "/admin/sources" },
            { id: "connectors", label: "Connectors", href: "/admin/connectors" },
            { id: "import-jobs", label: "Import jobs", href: "/admin/import-jobs" }
          ]
        },
        {
          id: "releases",
          label: "Releases",
          items: [
            { id: "release-builds", label: "Builds", href: "/admin/releases/builds" },
            { id: "release-approvals", label: "Approvals", href: "/admin/releases/approvals" },
            { id: "published-releases", label: "Published releases", href: "/admin/releases" }
          ]
        }
      ],
      menuOptions: {
        mode: "mega",
        columns: "auto"
      }
    }
  ]
});
```

`menuItems` and `menuGroups` should be mutually exclusive for a single navbar item. If both are supplied, development-mode validation should report a clear contract error.

## Proposed Data Contract

### Menu Group

```js
{
  id: "sources",
  label: "Sources",
  description: "Optional short context",
  icon: optionalIconMarkup,
  items: [],
  hidden: false,
  disabled: false
}
```

### Group Item

Group items should preserve the useful current menu-item fields:

```js
{
  id: "connectors",
  label: "Connectors",
  description: "Optional short context",
  icon: optionalIconMarkup,
  href: "/admin/connectors",
  disabled: false,
  danger: false,
  className: "",
  metadata: {}
}
```

Navigation remains application-owned. Helpers should emit the selected navbar item, group, and child item rather than forcing `window.location`.

Recommended callback:

```js
onItemMenuSelect(navItem, menuItem, {
  group,
  source: "menu" // menu | keyboard | mobile-menu
});
```

This extends the existing callback metadata without breaking consumers that ignore the new `group` field.

## Presentation

### Desktop

The mega menu should:

- open below the navbar trigger
- use a bounded responsive width rather than full viewport width
- arrange groups into an automatic grid
- render each group label as a non-interactive heading
- render child destinations as standard menu actions
- avoid cascading hover fly-outs
- allow the menu body to scroll when viewport height is constrained
- preserve Helpers theme tokens, typography, spacing, icons, focus rings, and motion

Recommended initial sizing:

- minimum of one column
- maximum of three columns in V1
- automatic column reduction as available width decreases
- a configurable but bounded `maxWidth`

The exact layout should remain Helpers-owned rather than requiring consumers to supply CSS.

### Mobile And Narrow Screens

The existing navbar mobile menu should reuse the same group hierarchy:

- navbar item label becomes the top-level section heading
- every group label becomes a nested visual heading
- child destinations render below the group
- the result is one vertically scrollable menu, not nested fly-outs

Mobile should preserve the same selection callback and identify `source: "mobile-menu"`.

## Keyboard And Accessibility Requirements

The grouped menu should follow an accessible disclosure/menu pattern:

- trigger exposes `aria-haspopup`, `aria-expanded`, and `aria-controls`
- group labels are headings or labelled groups, not disabled fake buttons
- child actions remain keyboard reachable
- `ArrowDown` or `Enter` from the trigger opens and focuses the first enabled child
- arrow keys move through enabled children in deterministic DOM order
- `Home` and `End` move to the first and last enabled children
- `Escape` closes the menu and restores focus to the trigger
- `Tab` follows a documented behavior and must not trap focus unexpectedly
- outside click closes the menu
- disabled groups and items are skipped by keyboard movement
- visible focus must use Helpers focus styling
- screen readers should announce both group context and item label

The implementation should not depend on hover for access.

## Permission And Conditional Rendering

Applications remain responsible for authorization and should pass only destinations the current user may access.

Helpers should support presentation filtering:

- groups marked `hidden` are not rendered
- empty groups are omitted automatically
- a grouped navbar item with no visible child destinations is omitted or disabled according to an explicit option

Helpers must not perform role or permission checks itself.

## Recommended Instance Behavior

The current navbar instance API should remain:

- `update(data, options?)`
- `getState()`
- `destroy()`

Updates should:

- replace group/item definitions cleanly
- close an open menu if its trigger or all its destinations disappear
- recompute menu dimensions and placement
- preserve no stale event listeners or detached menu nodes

`getState()` should expose enough normalized data for regression testing without exposing internal DOM references.

## Backward Compatibility

This proposal must not change existing behavior for:

- direct navbar items
- flat `menuItems`
- action menus such as the user/avatar menu
- icon-only navbar actions
- current mobile layouts
- existing `onItemMenuSelect` consumers

Suggested routing:

- `menuItems` uses the existing `createMenu(...)` flat mode
- `menuGroups` uses a new grouped mode in `createMenu(...)`, or a narrowly focused `createMegaMenu(...)` internally

The public navbar contract is more important than the internal implementation split.

## PBB Library Target Navigation

### Cloud

Top-level navbar:

- Home
- Collections
- My Library
- Operations
- DB Settings icon-only action
- User/avatar action

Suggested Operations groups:

- Overview
- Sources
- Content
- Governance
- Releases
- Nodes
- Security

### Node

Top-level navbar:

- Home
- Collections
- My Library
- Administration
- DB Settings icon-only action
- User/avatar action

Suggested Administration groups:

- Overview
- Content and Search
- Storage
- Updates
- Integrations
- Access
- Diagnostics

Cloud and Node should consume the same Helpers contract and produce matching DOM and styling patterns. Their group contents may differ.

## V1 Scope

V1 should include:

- `menuGroups` on navbar items
- grouped multi-column desktop rendering
- flattened labelled mobile rendering
- keyboard navigation across child destinations
- group-aware selection metadata
- empty/hidden/disabled group handling
- viewport collision and height handling
- theme parity
- regression tests and a dedicated demo
- documentation with Cloud and Node-style examples

## Non-Goals

V1 should not include:

- arbitrary HTML supplied by applications
- unlimited recursive nesting
- hover-only cascading submenus
- role or permission evaluation
- route loading or SPA ownership
- drag-and-drop menu customization
- user-persisted navigation ordering
- application-specific Library styling

This is a two-level information hierarchy: navbar menu trigger, groups, and selectable destinations. It is not a general recursive tree-menu system.

## Validation Targets

- existing flat navbar and menu regression suites remain green
- grouped desktop menu renders the expected group and item structure
- selection returns navbar item, group, item, and source
- keyboard traversal skips headings and disabled entries
- `Escape` restores trigger focus
- outside click closes the menu
- height-constrained menu scrolls without escaping the viewport
- mobile rendering preserves group labels and child order
- empty groups do not leave visual gaps
- updates do not duplicate callbacks or leave stale menu DOM
- Cloud and Node example configurations render the same structure and styles

## Recommendation

Proceed with an additive `menuGroups` contract and a Helpers-owned grouped mega-menu presentation.

Prefer a responsive multi-column panel over cascading fly-out submenus. It is easier to scan, more reliable on touch devices, and provides one consistent contract for PBB Library Cloud, PBB Library Node, and future operational PBB applications.
