// Rebuild selected, flat SVG artwork from unpacked upstream npm archives.
// node scripts/import.icon.packs.mjs <simple-icons/package> <icons-static-svg/package>
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
const [simple, lobe] = process.argv.slice(2);
if (!simple || !lobe) throw new Error("Pass both unpacked package directories.");
const metadata = JSON.parse(fs.readFileSync(path.join(simple, "data/simple-icons.json"), "utf8"));
const versions = [simple, lobe].map(dir => JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8")).version);
const provenance = [];
function readIcon(dir, slug, category, info) {
  const svg = fs.readFileSync(path.join(dir, "icons", `${slug}.svg`), "utf8");
  const tags = [...svg.matchAll(/<([a-zA-Z]+)\b/g)].map(m => m[1]);
  if (tags.some(tag => !["svg", "title", "path"].includes(tag))) throw new Error(`Review non-flat SVG: ${slug}`);
  const nodes = [...svg.matchAll(/<path\b([^>]*)>/g)].map(match => {
    const attrs = Object.fromEntries([...match[1].matchAll(/([\w-]+)="([^"]*)"/g)].map(m => [m[1], m[2]]));
    return { tag: "path", attrs: { fill: "currentColor", stroke: "none", "fill-rule": svg.includes('fill-rule="evenodd"') ? "evenodd" : "nonzero", ...attrs } };
  });
  provenance.push({ name: `${category}.${slug}`, package: category === "social" ? `simple-icons@${versions[0]}` : `@lobehub/icons-static-svg@${versions[1]}`, asset: `icons/${slug}.svg`, sha256: crypto.createHash("sha256").update(svg).digest("hex"), ...info });
  return { category, viewBox: svg.match(/viewBox="([^"]+)"/)[1], ...info, nodes };
}
const social = {};
for (const slug of ["facebook", "instagram", "youtube", "tiktok", "github", "whatsapp", "discord", "x", "reddit", "telegram"]) {
  const meta = metadata.find(item => item.slug === slug);
  social[`social.${slug}`] = readIcon(simple, slug, "social", { title: meta.title, brandColor: `#${meta.hex}`, source: meta.source, license: meta.license?.type || "See upstream brand guidelines", guidelines: meta.guidelines || meta.source });
}
const ai = {};
for (const slug of ["openai", "anthropic", "claude", "gemini", "deepseek", "ollama", "copilot", "mistral"]) {
  const color = { claude: "#D97757", deepseek: "#4D6BFE" }[slug];
  ai[`ai.${slug}`] = readIcon(lobe, slug, "ai", { title: slug === "openai" ? "OpenAI" : slug[0].toUpperCase() + slug.slice(1), source: `https://cdn.jsdelivr.net/npm/@lobehub/icons-static-svg@${versions[1]}/icons/${slug}.svg`, license: "MIT", ...(color ? { brandColor: color } : {}) });
}
ai["ai.generic"] = { category: "ai", viewBox: "0 0 24 24", title: "AI provider", nodes: [{ tag: "rect", attrs: { x: 4, y: 7, width: 16, height: 14, rx: 3 } }, { tag: "path", attrs: { d: "M12 3v4 M8 12h.01 M16 12h.01 M8 17h8" } }] };
for (const [name, pack] of [["social", social], ["ai", ai]]) {
  fs.writeFileSync(`js/ui/ui.icons.${name}.js`, `// Selected upstream artwork. See docs/icon-packs-sources.json and licenses/.\nexport const ${name.toUpperCase()}_ICONS = ${JSON.stringify(pack, null, 2)};\n`);
}
fs.writeFileSync("docs/icon-packs-sources.json", JSON.stringify(provenance, null, 2) + "\n");
console.log(`Imported ${Object.keys(social).length} social and ${Object.keys(ai).length} AI icons.`);
