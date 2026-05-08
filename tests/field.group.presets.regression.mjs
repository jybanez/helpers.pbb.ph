import {
  createAddressFieldGroupPreset,
  createEvacueeFieldGroupPreset,
  createMissingPersonFieldGroupPreset,
  createPersonFieldGroupPreset,
  fieldGroupPresets,
} from "../js/ui/ui.field.group.presets.js";

const failures = [];

const person = fieldGroupPresets.person();
assert(person.label === "Person", "person preset should expose default label");
assert(fieldKeys(person).join(",") === "name,gender,age", "person preset should include base person fields");
assert(person.fields.length === 2 && Array.isArray(person.fields[1]), "person preset should place gender and age in one field row");
assert(flatFields(person.fields).find((field) => field.key === "name")?.required === true, "person name should be required");

const address = fieldGroupPresets.address();
assert(
  fieldKeys(address).join(",") === "neighborhood,barangay,town,city,state,country",
  "address preset should include the agreed address fields"
);
assert(address.fields.length === 3 && address.fields.every((row) => Array.isArray(row) && row.length === 2), "address preset should render as three two-column rows");
assert(flatFields(address.fields).find((field) => field.key === "country")?.default_value === "Philippines", "address country should default to Philippines");

const missingPerson = fieldGroupPresets.missingPerson({ label: "Missing Persons" });
assert(missingPerson.label === "Missing Persons", "missingPerson preset should accept label override");
assert(missingPerson.repeatable === true, "missingPerson preset should default to repeatable");
assert(fieldKeys(missingPerson).includes("last_seen_days"), "missingPerson preset should include last_seen_days");
assert(fieldKeys(missingPerson).includes("last_seen_location"), "missingPerson preset should include last_seen_location");

const evacuee = fieldGroupPresets.evacuee();
assert(evacuee.repeatable === true, "evacuee preset should default to repeatable");
assert(fieldKeys(evacuee).join(",") === "name,gender,age,local_citizen,needs", "evacuee preset should extend person with local_citizen and needs");
assert(
  JSON.stringify(flatFields(evacuee.fields).find((field) => field.key === "local_citizen")?.options) === JSON.stringify(["Yes", "No"]),
  "evacuee local_citizen should use Yes/No options"
);

const overridden = createEvacueeFieldGroupPreset({
  fields: {
    age: { max: 100 },
  },
  extraFields: [
    { key: "medical_note", label: "Medical note", type: "textarea" },
  ],
});
assert(flatFields(overridden.fields).find((field) => field.key === "age")?.max === 100, "field override should merge into matching preset field");
assert(fieldKeys(overridden).includes("medical_note"), "extraFields should append to preset fields");

const replaced = createPersonFieldGroupPreset({
  fields: [{ key: "alias", label: "Alias", type: "text" }],
});
assert(fieldKeys(replaced).join(",") === "alias", "array fields override should replace preset fields");
assert(fieldKeys(createAddressFieldGroupPreset()).length === 6, "named address factory should return address preset");
assert(fieldKeys(createMissingPersonFieldGroupPreset()).length === 5, "named missing person factory should return missing person preset");

if (failures.length) {
  console.error("Field group presets regression test failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log("Field group presets regression test passed.");
}

function fieldKeys(preset) {
  return flatFields(preset.fields).map((field) => field.key);
}

function flatFields(fields) {
  return fields.flatMap((field) => (Array.isArray(field) ? field : [field]));
}

function assert(condition, message) {
  if (!condition) {
    failures.push(message);
  }
}
