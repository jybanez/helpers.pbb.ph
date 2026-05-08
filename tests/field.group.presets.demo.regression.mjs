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
    required: ["Person Field Group Preset", "Complete name", "Gender", "Age", "Ana Reyes", "onChange(value, meta)", "getValue()"],
  },
  {
    file: "demo.field.group.preset.address.html",
    required: ["Address Field Group Preset", "Neighborhood", "Barangay", "Country", "Philippines", "country.default_value", "setValue(value)"],
  },
  {
    file: "demo.field.group.preset.missing-person.html",
    required: ["Missing Person Field Group Preset", "Missing Persons", "Last seen days", "Juan Dela Cruz", "repeatable", "Array of missing-person objects"],
  },
  {
    file: "demo.field.group.preset.evacuee.html",
    required: ["Evacuee Field Group Preset", "Evacuees", "Local citizen", "Medicine", "local_citizen.options", "Array of evacuee objects"],
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
