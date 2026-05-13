import {
  createAddressFieldGroupPreset,
  createCasualtyPatientFieldGroupPreset,
  createEvacueeFieldGroupPreset,
  createFamilyFieldGroupPreset,
  createInfrastructureDamageFieldGroupPreset,
  createMissingPersonFieldGroupPreset,
  createPersonFieldGroupPreset,
  createRoadAccessStatusFieldGroupPreset,
  createShelterDamageFieldGroupPreset,
  createVehicleInvolvedFieldGroupPreset,
  fieldGroupPresets,
} from "../js/ui/ui.field.group.presets.js";

const failures = [];

const person = fieldGroupPresets.person();
assert(person.label === "Person", "person preset should expose default label");
assert(fieldKeys(person).join(",") === "name,last_name,first_name,gender,age", "person preset should include computed name and split person fields");
assert(person.fields.length === 3 && Array.isArray(person.fields[1]) && Array.isArray(person.fields[2]), "person preset should place split names and gender/age in paired rows");
assert(flatFields(person.fields).find((field) => field.key === "name")?.hidden === true, "person complete name should be hidden");
assert(flatFields(person.fields).find((field) => field.key === "name")?.computed?.template === "{last_name}, {first_name}", "person complete name should be computed from split name fields");
assert(flatFields(person.fields).find((field) => field.key === "last_name")?.required === true, "person last name should be required");
assert(flatFields(person.fields).find((field) => field.key === "first_name")?.required === true, "person first name should be required");
assert(flatFields(person.fields).find((field) => field.key === "age")?.type === "number-stepper", "person age should use number-stepper");

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
assert(flatFields(missingPerson.fields).find((field) => field.key === "last_seen_days")?.type === "number-stepper", "missingPerson last_seen_days should use number-stepper");

const evacuee = fieldGroupPresets.evacuee();
assert(evacuee.repeatable === true, "evacuee preset should default to repeatable");
assert(fieldKeys(evacuee).join(",") === "name,last_name,first_name,gender,age,local_citizen,needs", "evacuee preset should extend split person fields with local_citizen and needs");
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
assert(fieldKeys(createMissingPersonFieldGroupPreset()).length === 7, "named missing person factory should return missing person preset");

const family = fieldGroupPresets.family();
assert(family.repeatable === true, "family preset should default to repeatable");
assert(fieldKeys(family).join(",") === "household_head,adult_count,children_count,member_count,displaced,address", "family preset should keep household fields simple by default");
assert(!fieldKeys(family).includes("barangay"), "family preset should not include barangay because hotline context already owns it");
assert(flatFields(family.fields).find((field) => field.key === "member_count")?.type === "number-stepper", "family count fields should use number-stepper");
assert(flatFields(family.fields).find((field) => field.key === "member_count")?.computed === "adult_count + children_count", "family member_count should be computed from adults and children");
assert(flatFields(family.fields).find((field) => field.key === "member_count")?.readonly === true, "family member_count should be readonly");
assert(flatFields(family.fields).find((field) => field.key === "member_count")?.hidden === true, "family member_count should stay in values but be hidden from operator UI");
assert(breakdownKeys(family, "adult_count").join(",") === "adult_male_count,adult_female_count,adult_senior_count,adult_pwd_count,adult_pregnant_count", "family adult_count should expose adult breakdown fields");
assert(breakdownKeys(family, "children_count").join(",") === "children_male_count,children_female_count,children_pwd_count", "family children_count should expose children breakdown fields");
assert(flatFields(flatFields(family.fields).find((field) => field.key === "adult_count")?.breakdown?.fields || []).length === 6, "family adult breakdown should preserve placeholder columns");
assert(flatFields(flatFields(family.fields).find((field) => field.key === "children_count")?.breakdown?.fields || []).length === 4, "family children breakdown should preserve placeholder columns");
assert(JSON.stringify(flatFields(family.fields).find((field) => field.key === "displaced")?.options) === JSON.stringify(["Yes", "No"]), "family displaced should use Yes/No options");
assert(family.sitrep.includes("affected_families"), "family preset should expose SITREP metadata");
assert(family.validations?.some((rule) => rule.type === "sum_eq" && rule.maxField === "adult_count"), "family preset should validate adult male/female subtotals exactly against adult count");
assert(family.validations?.some((rule) => rule.field === "adult_pregnant_count" && rule.maxField === "adult_female_count"), "family preset should validate pregnant adults against adult female count");
assert(family.validations?.some((rule) => rule.field === "children_pwd_count" && rule.maxField === "children_count"), "family preset should validate child PWD count against children count");

const casualtyPatient = fieldGroupPresets.casualtyPatient();
assert(fieldKeys(casualtyPatient).includes("triage_color"), "casualtyPatient preset should include triage color");
assert(fieldKeys(casualtyPatient).includes("destination_facility"), "casualtyPatient preset should include destination facility");
assert(flatFields(casualtyPatient.fields).find((field) => field.key === "consciousness")?.visibleWhen?.condition?.not === "Deceased", "casualtyPatient consciousness should hide for deceased patients");
assert(flatFields(casualtyPatient.fields).find((field) => field.key === "transported")?.visibleWhen?.condition?.not === "Deceased", "casualtyPatient transported should hide for deceased patients");
assert(casualtyPatient.sitrep.includes("transported_count"), "casualtyPatient preset should expose transported SITREP metadata");

const infrastructureDamage = fieldGroupPresets.infrastructureDamage();
assert(fieldKeys(infrastructureDamage).join(",") === "asset_type,name_location,damage_level,operational_status,estimated_affected_users", "infrastructureDamage preset should include asset damage fields");
assert(flatFields(infrastructureDamage.fields).find((field) => field.key === "asset_type")?.options.includes("Bridge"), "infrastructureDamage asset_type should include Bridge");
assert(flatFields(infrastructureDamage.fields).find((field) => field.key === "estimated_affected_users")?.type === "number-stepper", "infrastructureDamage estimated users should use number-stepper");

const shelterDamage = fieldGroupPresets.shelterDamage();
assert(fieldKeys(shelterDamage).join(",") === "structure_type,damage_level,families_affected,persons_affected,habitable", "shelterDamage preset should include shelter impact fields");
assert(flatFields(shelterDamage.fields).find((field) => field.key === "structure_type")?.options.includes("Apartment / Boarding House"), "shelterDamage structure_type should include the agreed narrow shelter types");
assert(flatFields(shelterDamage.fields).find((field) => field.key === "families_affected")?.type === "number-stepper", "shelterDamage affected counts should use number-stepper");

const roadAccessStatus = fieldGroupPresets.roadAccessStatus();
assert(fieldKeys(roadAccessStatus).join(",") === "route_location,status,obstruction_type,passable_by_vehicle_type,passability_warning", "roadAccessStatus preset should include access status fields");
assert(flatFields(roadAccessStatus.fields).find((field) => field.key === "status")?.label === "Access", "roadAccessStatus status key should render with Access label");
assert(flatFields(roadAccessStatus.fields).find((field) => field.key === "status")?.required === true, "roadAccessStatus access field should be required");
assert(flatFields(roadAccessStatus.fields).find((field) => field.key === "obstruction_type")?.required === true, "roadAccessStatus obstruction type should be required when visible");
assert(JSON.stringify(flatFields(roadAccessStatus.fields).find((field) => field.key === "obstruction_type")?.visibleWhen) === JSON.stringify({ status: ["Blocked", "Closed"] }), "roadAccessStatus obstruction type should show only when access is not passable");
assert(JSON.stringify(flatFields(roadAccessStatus.fields).find((field) => field.key === "passable_by_vehicle_type")?.visibleWhen) === JSON.stringify({ status: { not: "Closed" } }), "roadAccessStatus passable vehicle choices should hide when access is closed");
assert(flatFields(roadAccessStatus.fields).find((field) => field.key === "passability_warning")?.type === "notice", "roadAccessStatus should show a warning notice when access is closed");
assert(roadAccessStatus.validations?.some((rule) => rule.type === "required_when" && rule.field === "obstruction_type"), "roadAccessStatus preset should validate obstruction type for blocked/closed access");
assert(roadAccessStatus.validations?.some((rule) => rule.type === "empty_when" && rule.field === "passable_by_vehicle_type"), "roadAccessStatus preset should validate closed access passability conflicts");
assert(flatFields(roadAccessStatus.fields).find((field) => field.key === "passable_by_vehicle_type")?.type === "checkbox-group", "roadAccessStatus passable vehicle field should use checkbox-group");
assert(roadAccessStatus.sitrep.includes("blocked_routes"), "roadAccessStatus preset should expose blocked route SITREP metadata");
assert(!roadAccessStatus.sitrep.includes("cleared_routes"), "roadAccessStatus preset should not expose cleared route SITREP metadata");

const vehicleInvolved = fieldGroupPresets.vehicleInvolved();
assert(vehicleInvolved.repeatable === true, "vehicleInvolved preset should default to repeatable");
assert(fieldKeys(vehicleInvolved).join(",") === "vehicle_type,plate_number,color,damage_level", "vehicleInvolved preset should keep bystander vehicle fields lean");
assert(flatFields(vehicleInvolved.fields).find((field) => field.key === "vehicle_type")?.options.includes("Motorcycle"), "vehicleInvolved vehicle_type should include Motorcycle");
assert(flatFields(vehicleInvolved.fields).find((field) => field.key === "vehicle_type")?.options.includes("SUV"), "vehicleInvolved vehicle_type should include SUV");
assert(flatFields(vehicleInvolved.fields).find((field) => field.key === "vehicle_type")?.options.includes("Pick-up"), "vehicleInvolved vehicle_type should include Pick-up");
assert(flatFields(vehicleInvolved.fields).find((field) => field.key === "vehicle_type")?.options.includes("Heavy Equipment"), "vehicleInvolved vehicle_type should include Heavy Equipment");
assert(flatFields(vehicleInvolved.fields).find((field) => field.key === "color")?.type === "select", "vehicleInvolved color should use a select");
assert(flatFields(vehicleInvolved.fields).find((field) => field.key === "color")?.options.includes("Unknown"), "vehicleInvolved color should allow Unknown");
assert(flatFields(vehicleInvolved.fields).find((field) => field.key === "damage_level")?.options.includes("Unknown"), "vehicleInvolved damage_level should allow Unknown");
assert(vehicleInvolved.sitrep.includes("vehicles_involved_count"), "vehicleInvolved preset should expose vehicles involved SITREP metadata");

assert(fieldKeys(createFamilyFieldGroupPreset()).length === 6, "named family factory should return family preset");
assert(fieldKeys(createCasualtyPatientFieldGroupPreset()).length === 11, "named casualty/patient factory should return casualtyPatient preset");
assert(fieldKeys(createInfrastructureDamageFieldGroupPreset()).length === 5, "named infrastructure damage factory should return infrastructureDamage preset");
assert(fieldKeys(createShelterDamageFieldGroupPreset()).length === 5, "named shelter damage factory should return shelterDamage preset");
assert(fieldKeys(createRoadAccessStatusFieldGroupPreset()).length === 5, "named road access status factory should return roadAccessStatus preset");
assert(fieldKeys(createVehicleInvolvedFieldGroupPreset()).length === 4, "named vehicle involved factory should return vehicleInvolved preset");

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

function breakdownKeys(preset, key) {
  const field = flatFields(preset.fields).find((item) => item.key === key);
  return flatFields(field?.breakdown?.fields || []).filter(Boolean).map((item) => item.key);
}

function assert(condition, message) {
  if (!condition) {
    failures.push(message);
  }
}
