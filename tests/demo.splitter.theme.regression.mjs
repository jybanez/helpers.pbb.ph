import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const demoPath = path.join(rootDir, "demos", "demo.splitter.html");
const source = fs.readFileSync(demoPath, "utf8");

const forbiddenHostPatterns = [
  /#hostHorizontal,\s*#hostVertical,\s*#hostMultiColumn\s*\{[^}]*background:\s*#0b1220/i,
  /#hostHorizontal,\s*#hostVertical,\s*#hostMultiColumn\s*\{[^}]*border:\s*1px solid #2b3750/i,
  /\.multi-column-fixed,\s*[\s\S]*?\.multi-column-pane\s*\{[^}]*background:\s*rgba\(13,\s*21,\s*35/i,
  /\.multi-column-fixed,\s*[\s\S]*?\.multi-column-pane\s*\{[^}]*border:\s*1px solid #2b3750/i,
];

const requiredTokens = [
  "--demo-surface-bg",
  "--demo-border",
  "--demo-code-bg",
  "--demo-code-text",
];

const failures = [];

for (const pattern of forbiddenHostPatterns) {
  if (pattern.test(source)) {
    failures.push(`Splitter demo still contains hardcoded dark host styling: ${pattern}`);
  }
}

for (const token of requiredTokens) {
  if (!source.includes(token)) {
    failures.push(`Splitter demo should use ${token}.`);
  }
}

if (failures.length) {
  console.error("Splitter demo theme regression failed.");
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Splitter demo theme regression passed.");
