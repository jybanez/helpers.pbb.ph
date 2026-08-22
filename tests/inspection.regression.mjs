import {
  createEnvironmentInspectionFieldGroupPreset,
  createEquipmentInspectionFieldGroupPreset,
  createInfrastructureInspectionFieldGroupPreset,
  createInspectionMeasurementFieldGroupPreset,
  createInspectionObservationFieldGroupPreset,
  inspectionFieldGroupPresets,
  resolveInspectionPresetSnapshot,
  validateInspectionPresetForPublication,
} from "../js/ui/ui.inspection.js";
import {
  canonicalizeFieldGroupSchema,
  normalizeFieldGroupSchema,
  validateFieldGroupSchema,
} from "../js/ui/ui.field.group.schema.js";
import {
  parseFieldGroupValue,
  serializeFieldGroupValue,
  validateFieldGroup,
} from "../js/ui/ui.field.group.js";

const failures = [];
const factories = {
  inspectionObservation: createInspectionObservationFieldGroupPreset,
  equipmentInspection: createEquipmentInspectionFieldGroupPreset,
  infrastructureInspection: createInfrastructureInspectionFieldGroupPreset,
  environmentInspection: createEnvironmentInspectionFieldGroupPreset,
  inspectionMeasurement: createInspectionMeasurementFieldGroupPreset,
};

assert(Object.keys(inspectionFieldGroupPresets).join(",") === Object.keys(factories).join(","), "inspection registry should expose the five confirmed preset ids");

Object.entries(factories).forEach(([id, factory]) => {
  const preset = factory();
  assert(preset.repeatable === true, `${id} should be repeatable`);
  assert(preset.entryKey === "_entry_key", `${id} should use the shared entry identity key`);
  assert(preset.minItems === 0 && preset.maxItems === 100, `${id} should expose confirmed count bounds`);
  assert(preset.allowReorder === true, `${id} should enable accessible ordering`);
  assert(!flattenFields(preset.fields).some(hasStorageKey), `${id} must not enable browser-local history`);
});

const observation = createInspectionObservationFieldGroupPreset();
assert(field(observation, "inspection_result")?.options?.map((option) => option.value).join(",") === "pass,fail,not_inspected,not_applicable", "inspection result should use stable lowercase values");
assert(field(observation, "finding_category")?.requiresOptions === true && field(observation, "finding_category")?.options?.length === 0, "finding categories should be explicitly caller-configured");

const environment = createEnvironmentInspectionFieldGroupPreset({
  fields: {
    observation_type: { options: [{ value: "air", label: "Air" }] },
    measurement_unit: { options: [{ value: "ppm", label: "ppm" }] },
  },
});
assert(field(environment, "observation_type")?.options?.[0]?.value === "air", "keyed overrides should configure inspection choices");
assert(field(createEnvironmentInspectionFieldGroupPreset(), "observation_type")?.options?.length === 0, "keyed overrides must not mutate the base preset");
assert(field(createEnvironmentInspectionFieldGroupPreset(), "measured_value")?.min == null, "environment readings should not impose an implicit zero minimum");
assert(field(createEnvironmentInspectionFieldGroupPreset(), "measured_value")?.step === 0.001, "environment readings should explicitly support configured decimal precision");

const snapshotA = await resolveInspectionPresetSnapshot("environmentInspection");
const snapshotB = await resolveInspectionPresetSnapshot("environmentInspection", {});
assert(snapshotA.schema_digest === snapshotB.schema_digest, "equivalent expanded schemas should hash identically");
const derivedSnapshot = await resolveInspectionPresetSnapshot("environmentInspection", { label: "Environmental Observation" });
assert(snapshotA.schema_digest !== derivedSnapshot.schema_digest, "user-visible meaning changes should alter the digest");
await assertRejects(
  () => resolveInspectionPresetSnapshot("environmentInspection", {}, { schema_digest: "sha256:wrong" }),
  "FIELD_GROUP_PRESET_SNAPSHOT_MISMATCH",
  "snapshot digest mismatches should fail explicitly"
);

const unpublished = validateInspectionPresetForPublication("inspectionMeasurement");
assert(unpublished.status === false && unpublished.errors.some((issue) => issue.code === "FIELD_GROUP_OPTIONS_REQUIRED"), "publication validation should reject unconfigured required choices");
const publishable = validateInspectionPresetForPublication("inspectionMeasurement", {
  fields: { unit: { options: [{ value: "celsius", label: "°C" }] } },
});
assert(publishable.status === true, "publication validation should accept configured unique choices");
[
  ["inspectionObservation", { finding_category: [{ value: "damage", label: "Damage" }] }],
  ["equipmentInspection", {}],
  ["infrastructureInspection", { defect_types: [{ value: "crack", label: "Crack" }] }],
  ["environmentInspection", {
    observation_type: [{ value: "air", label: "Air" }],
    measurement_unit: [{ value: "ppm", label: "ppm" }],
  }],
  ["inspectionMeasurement", { unit: [{ value: "celsius", label: "°C" }] }],
].forEach(([presetId, choices]) => {
  const configuredFields = Object.keys(choices).reduce((output, key) => {
    output[key] = { options: choices[key] };
    return output;
  }, {});
  assert(validateInspectionPresetForPublication(presetId, { fields: configuredFields }).status === true, `${presetId} should pass publication validation when caller-owned choices are configured`);
});

const unsafe = validateFieldGroupSchema({ fields: [{ key: "x", type: "script-control" }] });
assert(unsafe.errors.some((issue) => issue.code === "FIELD_GROUP_CONTROL_UNSUPPORTED"), "strict schema validation should reject unknown controls");
assertThrows(
  () => normalizeFieldGroupSchema({ fields: [{ key: "x", type: "text", transform() {} }] }),
  "FIELD_GROUP_SCHEMA_EXECUTABLE_FORBIDDEN",
  "persisted schemas should reject executable callbacks"
);
assertThrows(
  () => normalizeFieldGroupSchema({ fields: [{ key: "x", type: "combobox", storageKey: "unsafe" }] }, { allowPersistence: false }),
  "FIELD_GROUP_BROWSER_PERSISTENCE_FORBIDDEN",
  "schema-safe mode should reject browser persistence"
);
assert(
  canonicalizeFieldGroupSchema({ label: "X", fields: [{ label: "Value", type: "text", key: "value" }] })
    === canonicalizeFieldGroupSchema({ fields: [{ key: "value", type: "text", label: "Value" }], label: "X" }),
  "canonical schema output should ignore object insertion order"
);
assert(
  !canonicalizeFieldGroupSchema({ fields: [{ key: "value", type: "text" }], createEntryKey() { return "runtime"; } }).includes("createEntryKey"),
  "runtime key factories should be excluded from canonical digest input"
);

let keyCounter = 0;
const runtimeGroup = {
  name: "rows",
  repeatable: true,
  entryKey: "_entry_key",
  preserveEntryKeys: true,
  createEntryKey: () => `row-${++keyCounter}`,
  minItems: 0,
  maxItems: 2,
  allowReorder: true,
  fields: [
    { key: "status", type: "select", options: [{ value: "ok", label: "OK" }, { value: "bad", label: "Bad" }] },
    { key: "finding", type: "textarea", visibleWhen: { field: "status", eq: "bad" } },
  ],
  validations: [{ type: "required_when", field: "finding", when: { any: [{ field: "status", eq: "bad" }] }, severity: "error" }],
};
const serialized = serializeFieldGroupValue(runtimeGroup, [{ status: "ok" }]);
const parsed = parseFieldGroupValue(runtimeGroup, serialized);
assert(parsed[0]?._entry_key === "row-1", "entry identity should survive serialize/parse");
const duplicateValidation = validateFieldGroup(runtimeGroup, [
  { _entry_key: "same", status: "ok" },
  { _entry_key: "same", status: "bad", finding: "" },
  { _entry_key: "third", status: "ok" },
]);
assert(duplicateValidation.errors.some((issue) => issue.code === "FIELD_GROUP_ENTRY_KEY_DUPLICATE"), "duplicate entry identities should produce a stable code");
assert(duplicateValidation.errors.some((issue) => issue.code === "FIELD_GROUP_MAX_ITEMS"), "repeat counts should produce a stable max-items code");
assert(duplicateValidation.errors.some((issue) => issue.code === "FIELD_GROUP_REQUIRED_WHEN"), "any-of conditional required rules should validate deterministically");
const membershipValidation = validateFieldGroup(runtimeGroup, [{ _entry_key: "one", status: "unknown" }]);
assert(membershipValidation.errors.some((issue) => issue.code === "FIELD_GROUP_OPTION_NOT_ALLOWED"), "select values should be checked against configured options");
const numericValidation = validateFieldGroup({
  name: "reading",
  fields: [{ key: "value", type: "number-stepper", min: -10, max: 10 }],
}, { value: 12.5 });
assert(numericValidation.errors.some((issue) => issue.code === "FIELD_GROUP_NUMBER_ABOVE_MAX"), "programmatic validation should report unclamped numeric bounds");

if (failures.length) {
  console.error("Inspection regression test failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log("Inspection regression test passed.");
}

function flattenFields(fields) {
  return (Array.isArray(fields) ? fields : []).flatMap((entry) => Array.isArray(entry) ? flattenFields(entry) : entry ? [entry] : []);
}

function field(preset, key) {
  return flattenFields(preset.fields).find((entry) => entry.key === key);
}

function hasStorageKey(entry) {
  return Boolean(entry?.storageKey || entry?.historyStorageKey || entry?.history_storage_key);
}

function assert(condition, message) {
  if (!condition) {
    failures.push(message);
  }
}

function assertThrows(callback, code, message) {
  try {
    callback();
    failures.push(message);
  } catch (error) {
    assert(error?.code === code || error?.issues?.some((issue) => issue.code === code), message);
  }
}

async function assertRejects(callback, code, message) {
  try {
    await callback();
    failures.push(message);
  } catch (error) {
    assert(error?.code === code || error?.issues?.some((issue) => issue.code === code), message);
  }
}
