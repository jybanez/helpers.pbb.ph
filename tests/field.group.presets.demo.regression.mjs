import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs";

const execFileAsync = promisify(execFile);
const browserCandidates = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
];

const browserPath = browserCandidates.find((candidate) => {
  try {
    return candidate && fs.existsSync(candidate);
  } catch {
    return false;
  }
});

if (!browserPath) {
  console.error("Field group presets demo regression test failed: no supported browser executable found.");
  process.exit(1);
}

const demoDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../demos");
const pages = [
  {
    file: "demo.field.group.preset.person.html",
    required: ["Person Field Group Preset", "Last name / Family name", "First name", "Gender", "Age", "Reyes, Ana", "Metadata-only preset", "config_json.preset", "getValue()"],
  },
  {
    file: "demo.field.group.preset.address.html",
    required: ["Address Field Group Preset", "Neighborhood", "Barangay", "Country", "Philippines", "Metadata-only preset", "config_json.preset", "setValue(value)"],
  },
  {
    file: "demo.field.group.preset.missing-person.html",
    required: ["Missing Person Field Group Preset", "Missing Persons", "Last seen days", "Dela Cruz, Juan", "Metadata-only preset", "config_json.preset", "Array of missing-person objects"],
  },
  {
    file: "demo.field.group.preset.evacuee.html",
    required: ["Evacuee Field Group Preset", "Evacuees", "Local citizen", "Medicine", "Metadata-only preset", "config_json.preset", "Array of evacuee objects"],
  },
  {
    file: "demo.field.group.preset.family.html",
    required: ["Family Field Group Preset", "Families", "Household head", "Purok 3", "affected_families", "config_json.preset", "warnings"],
  },
  {
    file: "demo.field.group.preset.casualty-patient.html",
    required: ["Casualty / Patient Field Group Preset", "Patients", "Priority / triage color", "District Hospital", "transported_count", "config_json.preset"],
  },
  {
    file: "demo.field.group.preset.infrastructure-damage.html",
    required: ["Infrastructure Damage Field Group Preset", "Damaged Infrastructure", "Asset type", "North Creek Bridge", "impassable_roads_bridges", "config_json.preset"],
  },
  {
    file: "demo.field.group.preset.shelter-damage.html",
    required: ["Shelter Damage Field Group Preset", "Shelter Damage", "Structure type", "Apartment / Boarding House", "displaced_families", "config_json.preset"],
  },
  {
    file: "demo.field.group.preset.road-access-status.html",
    required: ["Road / Access Status Field Group Preset", "Road / Access Status", "Access", "Passable by vehicle type", "Coastal Road", "blocked_routes", "checkbox-group"],
  },
  {
    file: "demo.field.group.preset.vehicle-involved.html",
    required: ["Vehicle Involved Field Group Preset", "Vehicles Involved", "Vehicle type", "Plate number", "Passenger count", "Flammable / hazardous cargo", "Black", "vehicles_involved_count", "vehicleInvolved"],
  },
];

const failures = [];

for (const page of pages) {
  const htmlUrl = pathToFileURL(path.join(demoDir, page.file)).href;
  const { stdout, stderr } = await execFileAsync(browserPath, [
    "--headless=new",
    "--disable-gpu",
    "--allow-file-access-from-files",
    "--virtual-time-budget=3000",
    "--dump-dom",
    htmlUrl,
  ], { maxBuffer: 1024 * 1024 * 4 });

  const output = `${stdout}\n${stderr}`;
  const missing = page.required.filter((text) => !output.includes(text));
  if (missing.length) {
    failures.push(`${page.file}: missing ${missing.join(", ")}`);
  }
  if (page.file === "demo.field.group.preset.road-access-status.html") {
    if (output.includes('data-field-key="cleared"') || output.includes("cleared_routes")) {
      failures.push(`${page.file}: should not render cleared field or cleared_routes metadata`);
    }
    const outerLabelPattern = /data-field-key="passable_by_vehicle_type"[\s\S]*?<label class="ui-label">Passable by vehicle type<\/label>/;
    const ownedLabelPattern = /class="ui-label ui-checkbox-group-label">Passable by vehicle type<\/div>/;
    if (outerLabelPattern.test(output)) {
      failures.push(`${page.file}: rendered duplicate outer label for checkbox-group field`);
    }
    if (!ownedLabelPattern.test(output)) {
      failures.push(`${page.file}: missing checkbox-group owned label`);
    }
  }
  if (output.includes("No documented entries for this section.")) {
    failures.push(`${page.file}: contains empty reference panel copy`);
  }
}

if (failures.length) {
  console.error("Field group presets demo regression test failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log("Field group presets demo regression test passed.");
}
