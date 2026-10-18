import './generate.map.pin.perspective.runtime.mjs';
import fs from 'node:fs';
import crypto from 'node:crypto';
for (const name of ['color-picker','drawing-action-icons','map-layer-icon','maplibre-drawing','map-scale','map-ruler','map-pin','map-person-perspective']) {
  const path=`docs/${name}-runtime.json`, manifest=JSON.parse(fs.readFileSync(path));
  if(name==='map-person-perspective'){manifest.componentRevision='0.21.319';manifest.mainBundleRevision='0.21.319';}
  else manifest.mainUiBundleRevision='0.21.319';
  manifest.artifacts=manifest.artifacts.map(a=>({...a,sha256:crypto.createHash('sha256').update(fs.readFileSync(a.path,'utf8').replaceAll('\r\n','\n')).digest('hex')}));
  fs.writeFileSync(path,JSON.stringify(manifest,null,2)+'\n');
}
