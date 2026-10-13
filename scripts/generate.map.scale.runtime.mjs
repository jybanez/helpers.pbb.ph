import fs from 'node:fs';
import crypto from 'node:crypto';
const sha256=p=>crypto.createHash('sha256').update(fs.readFileSync(p,'utf8').replaceAll('\r\n','\n')).digest('hex');
// Refresh shared runtime provenance without changing unrelated component revisions.
for(const path of ['docs/color-picker-runtime.json','docs/map-layer-icon-runtime.json','docs/maplibre-drawing-runtime.json','docs/drawing-action-icons-runtime.json']) {
 const m=JSON.parse(fs.readFileSync(path,'utf8'));m.mainUiBundleRevision='0.21.310';
 m.artifacts=m.artifacts.map(a=>({...a,sha256:sha256(a.path)}));fs.writeFileSync(path,JSON.stringify(m,null,2)+'\n');
}
const paths=['js/ui/ui.map.scale.js','css/ui/ui.map.scale.css','js/ui/ui.loader.js','dist/helpers.ui.bundle.min.js','dist/helpers.ui.bundle.min.css','demos/demo.map.scale.html','js/demo/demo.map.scale.js','docs/map-scale.md','vendor/maplibre/maplibre-gl.js','vendor/maplibre/maplibre-gl.css'];
fs.writeFileSync('docs/map-scale-runtime.json',JSON.stringify({component:'ui.map.scale',factory:'createMapScale',componentRevision:'0.21.310',mainUiBundleRevision:'0.21.310',mapEngineVersion:'4.6.0',mapEngineOwnership:'Existing app prerequisite; not bundled by Helper',algorithm:'SHA256 of UTF-8 text normalized CRLF to LF',artifacts:paths.map(path=>({path,sha256:sha256(path)}))},null,2)+'\n');
