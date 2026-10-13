import fs from 'node:fs';
import crypto from 'node:crypto';
const sha256=p=>crypto.createHash('sha256').update(fs.readFileSync(p,'utf8').replaceAll('\r\n','\n')).digest('hex');
for(const name of ['color-picker','map-layer-icon','maplibre-drawing','drawing-action-icons','map-scale']) {
 const path=`docs/${name}-runtime.json`,m=JSON.parse(fs.readFileSync(path,'utf8'));
 m.mainUiBundleRevision='0.21.311';
 if(name==='maplibre-drawing'||name==='drawing-action-icons')m.cssRevision='0.21.311';
 m.artifacts=m.artifacts.map(a=>({...a,sha256:sha256(a.path)}));fs.writeFileSync(path,JSON.stringify(m,null,2)+'\n');
}
