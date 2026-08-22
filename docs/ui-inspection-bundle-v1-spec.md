# Helper Inspection Bundle V1

## Purpose

The optional inspection bundle provides policy-neutral Field Group starter schemas for inspection observations, equipment, infrastructure, environment, and measurements without adding inspection code to non-inspection pages.

Generated artifact:

```text
dist/helpers.inspection.bundle.min.js
```

The inspection bundle depends on the main Helper Field Group platform. It does not duplicate evidence, GPS, tenancy, compliance, publication, scoring, persistence, or operational workflow behavior.

## Loader contract

The following registry entries resolve through the optional inspection bundle when `preferBundles` is enabled:

```text
ui.inspection.core
ui.inspection.presets
ui.inspection.snapshot
```

The `inspection` loader group contains all three entries. The loader routes `ui.inspection.*` to `helpers.inspection.bundle.min.js` before the broader `ui.*` bundle prefix is considered.

```js
const loader = createUiLoader(DEFAULT_COMPONENT_REGISTRY, { preferBundles: true });
const inspection = await loader.get("ui.inspection.core");
const createFieldGroup = await loader.get("ui.field.group");

const preset = inspection.createInfrastructureInspectionFieldGroupPreset({
  fields: {
    defect_types: {
      options: [
        { value: "crack", label: "Crack" },
        { value: "corrosion", label: "Corrosion" }
      ]
    }
  }
});

createFieldGroup(container, {
  name: "infrastructure",
  ...preset
});
```

## Presets

| Preset id | Factory |
|---|---|
| `inspectionObservation` | `createInspectionObservationFieldGroupPreset` |
| `equipmentInspection` | `createEquipmentInspectionFieldGroupPreset` |
| `infrastructureInspection` | `createInfrastructureInspectionFieldGroupPreset` |
| `environmentInspection` | `createEnvironmentInspectionFieldGroupPreset` |
| `inspectionMeasurement` | `createInspectionMeasurementFieldGroupPreset` |

Each preset is repeatable, uses `_entry_key` identity, defaults to zero through 100 items, enables accessible reordering, and creates no browser-local history.

The following choice fields intentionally require application configuration and render an unconfigured state while empty:

- `finding_category`
- `defect_types`
- `observation_type`
- `measurement_unit`
- `unit`

Strict publication validation fails until enabled caller-supplied choice sets contain nonempty, unique, JSON-safe values.

## Snapshots

`resolveInspectionPresetSnapshot(presetId, overrides, expected)` returns a deep-cloned expanded schema with an append-only schema version and canonical SHA-256 digest:

```js
const snapshot = await inspection.resolveInspectionPresetSnapshot(
  "inspectionMeasurement",
  {
    fields: {
      unit: {
        options: [{ value: "celsius", label: "°C" }]
      }
    }
  }
);
```

Labels, options, conditions, validation rules, repeatability, and count behavior participate in the digest. Runtime `createEntryKey` functions are not serializable schema and are omitted from digest input. Passing an expected revision or digest produces `FIELD_GROUP_PRESET_SNAPSHOT_MISMATCH` when it does not match.

Applications that need immutable history store the expanded schema and digest in their own versioned domain model. Historical rendering must not resolve the current preset by name.

## Field Group platform additions

V1 adds reusable platform support for:

- JSON-safe schema validation and canonical SHA-256 digests;
- stable issue codes and paths;
- explicit unsupported-control rendering;
- stable repeatable-entry identity;
- item bounds and programmatic add/remove/move operations;
- keyboard-operable move controls and announcements;
- bounded JSON conditions using `all`, `any`, `not`, `eq`, `in`, `notIn`, `present`, and `notEmpty`;
- `clearWhenHidden`, defaulting to value preservation; and
- type, option-membership, string, numeric, count, and identity validation.

Existing compact object conditions and legacy first-row removal behavior remain available when the new bounds contract is not explicitly configured.

## Ownership boundary

Helper owns schema expansion, advisory validation, rendering, accessibility, and optional bundle delivery. Consuming applications own server validation, authorization, evidence, GPS, retention, synchronization, compliance meaning, thresholds, scoring, metrics, and publication.
