# UI Icons SITREP Expansion Proposal

## Summary

Expand the existing `ui.icons` registry with SITREP-oriented icon categories so PBB Hotline, PBB Support System, Relay-facing dashboards, and other SITREP-consuming apps can use the same official visual language for emergency operations, consolidation, maps, and data-quality cues.

This proposal keeps the existing `createIcon(...)` API. The requested change is registry coverage, not a new icon rendering contract.

## Context

Hotline now exports SITREP payloads that can be rendered by the framework-agnostic SITREP Viewer SDK and consumed by the SITREP Consolidator SDK. PBB Support System will use those payloads for:

- incoming SITREP intake and staging
- consolidated SITREP generation
- map-based incident/source visualization
- section-based SITREP reading
- resource and support deployment planning
- upstream Relay handoff

Support and other downstream apps need icons that are specific enough for operational scanning, but still shared enough to avoid app-local SVG drift.

## Goals

1. Keep one helper-owned icon registry and one visual style.
2. Add stable namespaced ids for SITREP, hazard, population, resource, route, team, map, and quality concepts.
3. Preserve `createIcon(name, options)` as the only rendering API needed by downstream apps.
4. Support dashboards, section tabs, cards, charts, maps, tables, and action/status labels.
5. Avoid one-off Hotline-only icon names when a broader PBB operational concept exists.

## Non-Goals

- Do not add a separate SITREP icon package.
- Do not introduce icon fonts or remote icon CDN loading.
- Do not add large illustrations or marketing artwork.
- Do not encode app-specific colors inside the SVG definitions. Icons should continue to inherit `currentColor`.

## Proposed Categories

The current registry already has useful categories such as `actions`, `assets`, `comms`, `data`, `navigation`, `people`, `places`, `status`, `time`, and `workflow`.

For SITREP and Support use, add these categories:

- `sitrep`
- `alert`
- `hazard`
- `population`
- `route`
- `resource`
- `team`
- `map`
- `quality`

If Helper prefers fewer top-level categories, `alert` can stay under `status`, and `map` can stay under `places`; however, separate categories will make the icon catalog easier to scan for operational apps.

## Requested Icons

### SITREP Core

| Icon ID | Purpose |
| --- | --- |
| `sitrep.report` | SITREP document/report |
| `sitrep.summary` | Executive summary |
| `sitrep.situation` | Situation section |
| `sitrep.gaps` | Gaps/constraints section |
| `sitrep.needs` | Needs/resources section |
| `sitrep.actions` | Actions/response posture |
| `sitrep.population` | Affected people section |
| `sitrep.damage` | Damage section |
| `sitrep.source` | Source/provenance |
| `sitrep.consolidated` | Consolidated SITREP |

### Alert And Severity

| Icon ID | Purpose |
| --- | --- |
| `alert.normal` | Normal alert level |
| `alert.elevated` | Elevated alert level |
| `alert.critical` | Critical alert level |
| `alert.watch` | Watch item |
| `alert.escalate` | Escalation needed |

### Incident And Hazard

| Icon ID | Purpose |
| --- | --- |
| `hazard.flood` | Flood |
| `hazard.fire` | Fire or building fire |
| `hazard.medical` | Medical emergency |
| `hazard.rescue` | Rescue or stranded person |
| `hazard.landslide` | Landslide |
| `hazard.infrastructure` | Infrastructure damage |
| `hazard.vehicle` | Vehicle incident |
| `hazard.public-safety` | Riot or public disturbance |
| `hazard.missing-person` | Missing person |
| `hazard.evacuation` | Evacuation needed |

### Population And Vulnerable Groups

| Icon ID | Purpose |
| --- | --- |
| `population.people-at-risk` | People at risk |
| `population.people-helped` | People helped |
| `population.family` | Affected family |
| `population.children` | Children |
| `population.senior` | Senior citizens |
| `population.pwd` | Persons with disability |
| `population.pregnant` | Pregnant person |
| `population.patient` | Patient or injured person |
| `population.displaced` | Displaced people |
| `population.shelter` | Shelter or evacuation center |

### Access And Routes

| Icon ID | Purpose |
| --- | --- |
| `route.clear` | Route clear/passable |
| `route.limited` | Limited access |
| `route.blocked` | Blocked route |
| `route.caution` | Passable with caution |
| `route.obstruction` | Obstruction or debris |
| `route.bridge` | Bridge or bridge approach |
| `route.road` | Road segment |

### Resources And Logistics

| Icon ID | Purpose |
| --- | --- |
| `resource.requested` | Resource requested |
| `resource.deployed` | Resource deployed |
| `resource.shortage` | Resource gap |
| `resource.medical-supplies` | Medical supplies |
| `resource.food-water` | Food and water supplies |
| `resource.rescue-equipment` | Rescue equipment |
| `resource.heavy-equipment` | Heavy equipment |
| `resource.sanitation` | Sanitation |
| `resource.shelter-supplies` | Shelter supplies |
| `resource.transport` | Transport/logistics |

### Teams And Response

| Icon ID | Purpose |
| --- | --- |
| `team.rescue` | Rescue team |
| `team.medical` | Medical team |
| `team.law-enforcement` | Law enforcement |
| `team.fire` | Fire response |
| `team.engineering` | Engineering or utilities |
| `team.social-services` | Welfare or social services |
| `team.public-safety` | Public safety or traffic |
| `team.assessment` | Assessment team |
| `team.command` | Command or coordination |

### Map And Geography

| Icon ID | Purpose |
| --- | --- |
| `map.boundary` | Administrative boundary |
| `map.cluster` | Incident cluster |
| `map.hotspot` | Hotspot |
| `map.source-hub` | Source hub |
| `map.target-hub` | Target/consolidating hub |
| `map.uplink` | Upstream Relay target |
| `map.coverage-area` | SITREP coverage area |

### Data Quality And Verification

| Icon ID | Purpose |
| --- | --- |
| `quality.verified` | Verified data |
| `quality.unverified` | Needs verification |
| `quality.partial` | Partial data |
| `quality.duplicate-risk` | Possible duplicate or overlap |
| `quality.stale` | Stale/superseded data |
| `quality.redacted` | Privacy redacted |

## Suggested Rollout

1. Add the category definitions and icons to `js/ui/ui.icons.catalog.js`.
2. Update `demos/demo.icons.html` so the new categories appear automatically.
3. Add or update icon regression coverage to assert:
   - all requested ids resolve through `getIconDefinition(...)`
   - all requested ids render through `createIcon(...)`
   - categories appear in `listIconCategories()`
   - icons inherit `currentColor`
4. Update `README.md` to mention the new operational/SITREP icon categories.
5. After Helper merges the icon expansion, downstream apps should refresh vendored Helper assets from the official Helpers repository.

## Open Design Notes

Some requested icons overlap existing broad icons:

- `places.map`, `places.pin`, and `places.route`
- `people.users`
- `assets.vehicle`
- `status.warning`, `status.success`, `status.error`, and `status.info`
- `workflow.requested`, `workflow.assigned`, `workflow.accepted`, `workflow.en-route`, `workflow.on-scene`, `workflow.completed`, and `workflow.cancelled`

It is acceptable for the new SITREP-specific ids to reuse or wrap the same underlying SVG geometry at first, as long as the names are stable and meaningful to SITREP consumers. This keeps downstream code expressive while allowing Helper to refine the drawings later without changing app code.

