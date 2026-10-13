import fs from 'node:fs';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const run=promisify(execFile),session=`map-scale-offline-${process.pid}`;
const cli=command=>run(process.env.ComSpec||'cmd.exe',['/d','/s','/c',`npx --no-install @playwright/cli -s=${session} ${command}`],{timeout:120000,maxBuffer:2**22});
const helper=['/js/ui/ui.loader.js','/dist/helpers.ui.bundle.min.js','/dist/helpers.ui.bundle.min.css'];
const prerequisites=['/vendor/maplibre/maplibre-gl.js','/vendor/maplibre/maplibre-gl.css'];
const assets=Object.fromEntries([...helper,...prerequisites].map(p=>[p,fs.readFileSync('.'+p,'utf8')]));
const html=`<!doctype html><link rel="stylesheet" href="/vendor/maplibre/maplibre-gl.css"><div id="map" style="width:320px;height:400px"></div><script src="/vendor/maplibre/maplibre-gl.js"></script><script type="module">
import {uiLoader} from '/js/ui/ui.loader.js';uiLoader.setPreferBundles(true);
const create=await uiLoader.get('ui.map.scale');
const map=new maplibregl.Map({container:'map',attributionControl:false,zoom:12,center:[123,10],style:{version:8,sources:{},layers:[{id:'background',type:'background',paint:{'background-color':'#20344a'}}]}});
window.__offline={map,scale:create({map})};</script>`;
const filename=`output/map-scale-offline-${process.pid}.js`;
fs.mkdirSync('output',{recursive:true});
fs.writeFileSync(filename,`async page=>{
const assets=${JSON.stringify(assets)},html=${JSON.stringify(html)},requests=[];
await page.route('**/*',route=>{const p=new URL(route.request().url()).pathname;requests.push(p);if(p==='/offline')return route.fulfill({contentType:'text/html',body:html});if(Object.hasOwn(assets,p))return route.fulfill({contentType:p.endsWith('.css')?'text/css':'text/javascript',body:assets[p]});return route.abort();});
await page.goto('http://127.0.0.1:9/offline');await page.waitForFunction(()=>window.__offline);
await page.evaluate(()=>{const {map,scale}=__offline;const before=scale.getElement().textContent;map.jumpTo({zoom:5});if(scale.getElement().textContent===before||!scale.getElement().textContent.includes('km'))throw Error('offline native scale update');scale.destroy();map.remove();});
const actual=requests.filter(p=>p!=='/offline'&&!p.startsWith('/vendor/'));if(actual.length!==3||${JSON.stringify(helper)}.some(p=>!actual.includes(p)))throw Error('extra Helper request '+JSON.stringify(requests));
return 'MAP_SCALE_OFFLINE_OK';}`);
try{await cli('open about:blank');const r=await cli(`run-code --filename ${filename}`);if(!r.stdout.includes('"MAP_SCALE_OFFLINE_OK"'))throw Error(r.stdout);console.log('Cold blocked-network native scale: exactly three retained Helper assets plus existing local MapLibre engine/CSS; update and teardown passed.');}finally{await cli('close');}
