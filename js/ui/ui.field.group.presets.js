const PERSON_FIELDS = [
  { key: "name", label: "Complete name", type: "text", required: true },
  [
    { key: "gender", label: "Gender", type: "select", options: ["Male", "Female"] },
    { key: "age", label: "Age", type: "number", min: 0, max: 120 },
  ],
];

const ADDRESS_FIELDS = [
  [
    { key: "neighborhood", label: "Neighborhood", type: "text" },
    { key: "barangay", label: "Barangay", type: "text" },
  ],
  [
    { key: "town", label: "Town", type: "text" },
    { key: "city", label: "City", type: "text" },
  ],
  [
    { key: "state", label: "State", type: "text" },
    { key: "country", label: "Country", type: "text", default_value: "Philippines" },
  ],
];

const MISSING_PERSON_FIELDS = [
  ...PERSON_FIELDS,
  [
    { key: "last_seen_days", label: "Last seen days", type: "number", min: 0 },
    { key: "last_seen_location", label: "Last seen location", type: "text" },
  ],
];

const EVACUEE_FIELDS = [
  ...PERSON_FIELDS,
  { key: "local_citizen", label: "Local citizen", type: "select", options: ["Yes", "No"] },
  { key: "needs", label: "Needs", type: "textarea" },
];

export const fieldGroupPresets = {
  person(overrides = {}) {
    return buildPreset({
      label: "Person",
      fields: PERSON_FIELDS,
    }, overrides);
  },

  address(overrides = {}) {
    return buildPreset({
      label: "Address",
      fields: ADDRESS_FIELDS,
    }, overrides);
  },

  missingPerson(overrides = {}) {
    return buildPreset({
      label: "Missing Person",
      repeatable: true,
      fields: MISSING_PERSON_FIELDS,
    }, overrides);
  },

  evacuee(overrides = {}) {
    return buildPreset({
      label: "Evacuee",
      repeatable: true,
      fields: EVACUEE_FIELDS,
    }, overrides);
  },
};

export function createPersonFieldGroupPreset(overrides = {}) {
  return fieldGroupPresets.person(overrides);
}

export function createAddressFieldGroupPreset(overrides = {}) {
  return fieldGroupPresets.address(overrides);
}

export function createMissingPersonFieldGroupPreset(overrides = {}) {
  return fieldGroupPresets.missingPerson(overrides);
}

export function createEvacueeFieldGroupPreset(overrides = {}) {
  return fieldGroupPresets.evacuee(overrides);
}

function buildPreset(base, overrides) {
  const normalizedOverrides = overrides && typeof overrides === "object" ? overrides : {};
  const fieldOverrides = normalizeFieldOverrides(normalizedOverrides.fields);
  const baseFields = applyFieldOverrides(cloneFields(base.fields), fieldOverrides);
  const extraFields = normalizeExtraFields(normalizedOverrides.extraFields);
  const fields = Array.isArray(normalizedOverrides.fields)
    ? cloneFields(normalizedOverrides.fields)
    : [...baseFields, ...extraFields];

  return {
    ...base,
    ...normalizedOverrides,
    fields,
  };
}

function cloneFields(fields) {
  return Array.isArray(fields)
    ? fields.map((field) => (Array.isArray(field) ? field.map(cloneField).filter(Boolean) : cloneField(field))).filter(Boolean)
    : [];
}

function cloneField(field) {
  return field && typeof field === "object" && !Array.isArray(field) ? { ...field } : null;
}

function applyFieldOverrides(fields, overrides) {
  return cloneFields(fields).map((field) => {
    if (Array.isArray(field)) {
      return field.map((child) => ({
        ...child,
        ...(overrides[getFieldKey(child)] || {}),
      }));
    }
    return {
      ...field,
      ...(overrides[getFieldKey(field)] || {}),
    };
  });
}

function normalizeFieldOverrides(fields) {
  if (!fields || typeof fields !== "object" || Array.isArray(fields)) {
    return {};
  }
  return Object.keys(fields).reduce((acc, key) => {
    const value = fields[key];
    if (value && typeof value === "object" && !Array.isArray(value)) {
      acc[key] = { ...value };
    }
    return acc;
  }, {});
}

function normalizeExtraFields(fields) {
  return cloneFields(fields);
}

function getFieldKey(field) {
  return String(field?.key ?? field?.field_key ?? field?.name ?? "");
}
