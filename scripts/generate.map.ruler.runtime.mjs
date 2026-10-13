import fs from 'node:fs';
import crypto from 'node:crypto';
const sha256 = path => crypto.createHash('sha256').update(fs.readFileSync(path, 'utf8').replaceAll('\r\n', '\n')).digest('hex');
for (const name of ['color-picker', 'map-layer-icon', 'maplibre-drawing', 'drawing-action-icons', 'map-scale']) {
  const path = `docs/${name}-runtime.json`, manifest = JSON.parse(fs.readFileSync(path, 'utf8'));
  manifest.mainUiBundleRevision = '0.21.313';
  if (Object.hasOwn(manifest, 'iconsRevision')) manifest.iconsRevision = '0.21.312';
  if (Object.hasOwn(manifest, 'iconsAndGameRevision')) manifest.iconsAndGameRevision = '0.21.312';
  if (Object.hasOwn(manifest, 'gameBundleRevision')) manifest.gameBundleRevision = '0.21.312';
  manifest.artifacts = manifest.artifacts.map(a => ({ ...a, sha256: sha256(a.path) }));
  fs.writeFileSync(path, JSON.stringify(manifest, null, 2) + '\n');
}
const paths = ['js/ui/ui.map.ruler.js', 'css/ui/ui.map.ruler.css', 'js/ui/ui.map.controls.js', 'js/ui/ui.icons.js', 'js/ui/ui.icons.catalog.js', 'js/ui/ui.loader.js', 'dist/helpers.ui.bundle.min.js', 'dist/helpers.ui.bundle.min.css', 'dist/helpers.game.bundle.min.js', 'demos/demo.map.ruler.html', 'js/demo/demo.map.ruler.js', 'docs/map-ruler.md', 'vendor/maplibre/maplibre-gl.js', 'vendor/maplibre/maplibre-gl.css'];
fs.writeFileSync('docs/map-ruler-runtime.json', JSON.stringify({ component: 'ui.map.ruler', factory: 'createMapRuler', icon: 'map.ruler', componentRevision: '0.21.313', cssRevision: '0.21.312', mainUiBundleRevision: '0.21.313', iconsAndGameRevision: '0.21.312', mapEngineVersion: '4.6.0', mapEngineOwnership: 'Existing app prerequisite; not bundled by Helper', algorithm: 'SHA256 of UTF-8 text normalized CRLF to LF', artifacts: paths.map(path => ({ path, sha256: sha256(path) })) }, null, 2) + '\n');
