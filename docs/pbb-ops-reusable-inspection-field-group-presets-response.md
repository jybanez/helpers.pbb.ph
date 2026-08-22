# Helper Response: Reusable Inspection Field Group Presets

**Status:** Helper review response to the PBB Ops proposal dated 2026-08-22
**Scope:** Contract and delivery assessment only; this memo does not approve or implement a release

## Decision

Helper accepts the overall direction, with the following qualifications:

- Inspection presets may belong in Helper when they remain policy-neutral authoring and rendering starters.
- Evidence, GPS, tenancy, publication, compliance, scoring, metric definitions, and authoritative server validation remain application-owned.
- Frozen historical schemas must be fully expanded and stored by the consuming application. Historical rendering must not resolve a current mutable Helper preset.
- The platform work should land before the five proposed presets. Shipping presets first would encode workarounds for known identity, condition, validation, and schema-safety gaps.
- Existing emergency-response presets and `sitrep` metadata are compatibility contracts, not a precedent for new cross-product policy metadata.

## Naming and generic applicability

The proposed preset names are understandable and fit the existing camel-case registry style:

- `inspectionObservation`
- `equipmentInspection`
- `infrastructureInspection`
- `environmentInspection`
- `inspectionMeasurement`

Helper recommends exposing matching factories named `createInspectionObservationFieldGroupPreset`, `createEquipmentInspectionFieldGroupPreset`, and so on.

The field vocabularies are broadly reusable if the consuming application supplies sector-specific option sets. The following should not be hard-coded as Helper taxonomies:

- finding categories;
- defect types;
- observation types;
- measurement units;
- thresholds or regulatory meanings; and
- severity weighting or pass/fail aggregation.

The proposed status and condition choices are acceptable as starter defaults, not standards. Labels, options, requiredness, and conditional behavior affect user-visible meaning and must therefore participate in snapshot identity.

## Current Helper gaps confirmed by source review

The present `ui.field.group` implementation does not yet meet the requested contract:

1. Repeatable entries are index-based. Normalization rebuilds items from declared fields and drops undeclared properties, so an entry key cannot currently survive unless identity becomes an explicit platform concern.
2. Add is unbounded, the first rendered entry cannot be removed, and no reorder controls or programmatic reorder operation exist.
3. Conditions currently support an all-keys match with exact values, arrays, `in`, and `not`. There is no expression tree for `all`/`any`, `present`/`notEmpty`, or a field-level hidden-value policy.
4. Conditional `required_when` and `forbidden_when` validation rules already exist, but they use the same limited condition matcher and return messages without stable validation codes.
5. Validation currently covers required values, numeric parsing/min/max, and a small set of cross-field rules. It does not comprehensively check schema validity, value types, option membership, string limits, checkbox selection bounds, entry identity, or repeat counts.
6. Unknown control types silently render as text inputs. Unknown preset names and malformed JSON configuration also fail softly. Persisted or pinned schemas need explicit errors.
7. Preset cloning is shallow for nested objects and arrays. It is sufficient for many current overrides but is not an immutable expanded snapshot contract.
8. Some legacy presets enable combobox local-history storage. New inspection presets must not set `storageKey`, and schema-safe mode should be able to reject persistence configuration.

## Recommended platform contract

### 1. Strict JSON-safe schema normalization

Introduce one exported normalizer/validator used by rendering, hashing, and server-adapter tests. It should:

- allow only documented control types and schema keys;
- reject functions, symbols, prototype-pollution keys, excessive nesting, oversized option lists, and excessive repeat limits;
- deep-clone all accepted data;
- return stable issue codes and paths; and
- support an explicit compatibility mode for existing soft behavior while pinned schemas use strict mode.

Unknown types must fail in strict/programmatic use and render a clearly unsupported state in interactive compatibility use. They must not silently become text fields.

### 2. Versioned preset snapshots

Add a resolver that produces a deterministic, fully expanded, JSON-safe schema. Recommended shape:

```js
{
  preset_id: "infrastructureInspection",
  schema_version: 1,
  schema_digest: "sha256:...",
  schema: {
    repeatable: true,
    fields: [],
    validations: []
  }
}
```

Digest input should be canonical JSON after defaults and overrides are expanded. It must include every value-affecting, validation-affecting, conditional, repeatability, accessibility-label, option, and user-meaning field. Runtime callbacks must not be part of the schema. If digest calculation uses Web Crypto, the resolver may be asynchronous; published built-in revisions may alternatively ship with verified precomputed digests.

Overrides create a derived snapshot and digest. A derived snapshot should retain `base_preset_id` and `base_schema_version` for provenance, but must not claim equality with the base preset.

Revision/digest mismatch must return or throw a stable explicit error such as `FIELD_GROUP_PRESET_SNAPSHOT_MISMATCH`.

### 3. Stable repeatable-entry identity

Identity should be an opt-in Field Group runtime/data contract, not an executable function embedded in a persisted schema. Recommended options:

```js
{
  entryKey: "_entry_key",
  preserveEntryKeys: true,
  createEntryKey: runtimeKeyFactory
}
```

`createEntryKey` is a trusted runtime option and must be excluded from serialized preset snapshots. When no factory is supplied, Helper may use `crypto.randomUUID()` where available. Caller-supplied keys must survive normalization, `getValue`, `setValue`, `update`, serialization, parsing, and reordering. Duplicate and missing keys require stable validation codes.

### 4. Bounds and accessible reordering

Add `minItems`, `maxItems`, `allowRemove`, and `allowReorder`, enforced by the UI and exported validator. Empty repeatable groups must render zero data entries when `minItems` is zero; the present visual placeholder must not silently become stored data. Remove availability should depend on bounds, not index. Reordering should expose keyboard-operable move controls, preserve focus and entry keys, announce the result, and provide a programmatic move operation.

### 5. Bounded declarative conditions

Use a JSON expression tree shared by visibility and validation, for example:

```js
{ any: [
  { field: "condition", in: ["Poor", "Critical"] },
  { field: "serviceability", in: ["Restricted", "Unserviceable"] }
] }
```

The minimum operator set should be `all`, `any`, `not`, `eq`, `in`, `notIn`, `present`, and `notEmpty`. Depth and node counts must be bounded. Existing object conditions should remain readable as compatibility shorthand.

Conditional required and forbidden behavior should stay in validation rules so visibility and validity remain separate concerns. `clearWhenHidden` should default to `false`, be explicit per field, and run deterministically when a visibility transition occurs.

### 6. Deterministic validation

Return stable issues shaped like:

```js
{
  code: "FIELD_GROUP_OPTION_NOT_ALLOWED",
  path: "inspection.0.condition",
  severity: "error",
  message: "Condition must be one of the configured options."
}
```

The first platform release should cover schema/control support, object/array/scalar/boolean/number types, required values, option membership, string length/pattern, checkbox selection bounds, numeric bounds and cross-field min/max, repeat counts, and entry identity. Applications still repeat authoritative validation on the server.

### 7. Opaque extensions and persistence

JSON-compatible, consumer-namespaced `extensions` may be preserved without interpretation. Helper should enforce universal safety rules, including prototype-pollution protection and size/depth limits, but should not maintain a list of product-policy namespaces such as `spectus.*` or `sitrep.*`; each application should reject namespaces that are invalid for its own contract.

New shared presets must not enable browser persistence. A later persistence adapter may be runtime-only and explicitly supplied by the consumer. It must not be implied by preset resolution or included as executable behavior in stored schemas.

## Delivery recommendation

Proceed in three additive releases:

1. **Schema safety and snapshots:** strict schema normalization, deep cloning, deterministic canonicalization/digests, explicit mismatch errors, stable validation issue shape, and unknown-control failure behavior.
2. **Repeatable and conditional platform:** stable identity, bounds, reorder controls/API, bounded condition expressions, hidden-value policy, and expanded deterministic validation.
3. **Inspection preset pack:** the five reviewed presets, no browser storage, caller-supplied taxonomies/units, responsive demos, accessibility regression coverage, loader/source/bundle parity, and release revision updates.

Before Release 3, Ops should confirm final option labels and which fields intentionally ship with empty caller-supplied choices. Spectus can then pin the released snapshot, diff it before adoption, and freeze the expanded schema in its own versioned template and canonical content hash.

## Review outcome

The proposal is accepted as a sound upstream direction, not yet as an implementation-ready contract. Helper should first define and test the platform primitives above, then review the exact preset schemas against that frozen contract. No evidence, GPS, tenant, metric, compliance, or publication behavior should enter the Helper preset layer.
