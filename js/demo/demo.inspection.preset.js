const config = window.inspectionPresetDemo || {};
await window.__demoLoaderReady;

const loader = window.__inspectionDemoLoader;
const inspection = await loader.get("ui.inspection.core");
const createFieldGroup = await loader.get("ui.field.group");
const factory = inspection?.[config.factory];
const host = document.getElementById("presetHost");
const log = document.getElementById("presetLog");
const snapshot = document.getElementById("presetSnapshot");

if (typeof factory !== "function" || !host) {
  throw new Error("Inspection preset demo requires a valid factory and host.");
}

const preset = factory(config.overrides || {});
const group = createFieldGroup(host, {
  name: config.name,
  ...preset,
  value: config.initialValue,
  onChange(value, meta) {
    writeLog("changed", { value, validation: meta.validation });
  },
});

const schemaSnapshot = await inspection.resolveInspectionPresetSnapshot(config.presetId, config.overrides || {});
const publication = inspection.validateInspectionPresetForPublication(config.presetId, config.overrides || {});
snapshot.textContent = `Schema v${schemaSnapshot.schema_version} · ${schemaSnapshot.schema_digest} · publication ${publication.status ? "ready" : "blocked"}`;

document.getElementById("sampleBtn")?.addEventListener("click", () => {
  group.setValue(config.sampleValue);
  writeLog("sample set", group.getValue());
});
document.getElementById("clearBtn")?.addEventListener("click", () => {
  group.setValue([]);
  writeLog("cleared", group.getValue());
});
document.getElementById("validateBtn")?.addEventListener("click", () => writeLog("validation", group.validate()));
document.getElementById("snapshotBtn")?.addEventListener("click", () => writeLog("snapshot", {
  value: group.getValue(),
  schema_version: schemaSnapshot.schema_version,
  schema_digest: schemaSnapshot.schema_digest,
  publication,
}));

writeLog("initial", group.getValue());
document.body.dataset.demoStatus = "ready";

function writeLog(label, payload) {
  if (!log) return;
  const line = `[${new Date().toISOString()}] ${label}\n${JSON.stringify(payload, null, 2)}\n`;
  log.textContent = log.textContent.startsWith("No ") ? line : `${line}\n${log.textContent}`;
}
