import fs from 'node:fs';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const run=promisify(execFile),session=`drawing-object-offline-${process.pid}`;
const cli=command=>run(process.env.ComSpec||'cmd.exe',['/d','/s','/c',`npx --no-install @playwright/cli -s=${session} ${command}`],{timeout:60000,maxBuffer:2**22});
const paths=['/js/ui/ui.loader.js','/dist/helpers.ui.bundle.min.js','/dist/helpers.ui.bundle.min.css'];
const assets=Object.fromEntries(paths.map(p=>[p,fs.readFileSync('.'+p,'utf8')]));
const html=`<!doctype html><meta charset="utf-8"><div id="tools"></div><script type="module">
import {uiLoader} from '/js/ui/ui.loader.js';
uiLoader.setPreferBundles(true);
const create=await uiLoader.get('ui.map.drawing.object');
await uiLoader.get('ui.map.drawing.maplibre');
const listeners=new Set();let mode='move',rotation=true;
const adapter={getState:()=>({selectedFeatureId:'0'}),getMode:()=> 'select',getFeatures:()=>[{type:'Feature',id:0,properties:{},geometry:{type:'LineString',coordinates:[[1,1],[2,2]]}}],getObjectMode:()=>mode,setObjectMode(next){mode=next;for(const fn of [...listeners])fn();return true;},getCapabilities:()=>({objectModes:{move:true,rotate:rotation},objectRotationSupported:rotation,objectControlsVisible:true,actions:{fill:true,stroke:true,delete:true}}),on(name,fn){if(name==='statechange')listeners.add(fn);return()=>listeners.delete(fn);}};
window.__offline={tools:create(document.querySelector('#tools'),{adapter}),point(){mode='move';rotation=false;for(const fn of [...listeners])fn();},listeners};
</script>`;
const filename=`output/drawing-object-offline-${process.pid}.js`;
fs.mkdirSync('output',{recursive:true});
fs.writeFileSync(filename,`async page => {
const assets=${JSON.stringify(assets)},html=${JSON.stringify(html)},requests=[];
// A cold client receives only the three retained Helper assets. No real network is allowed.
await page.route('**/*',route=>{const p=new URL(route.request().url()).pathname;requests.push(p);if(p==='/offline')return route.fulfill({contentType:'text/html',body:html});if(Object.hasOwn(assets,p))return route.fulfill({contentType:p.endsWith('.css')?'text/css':'text/javascript',body:assets[p]});return route.abort();});
await page.goto('http://127.0.0.1:9/offline');
await page.waitForFunction(()=>window.__offline);
if(await page.locator('#tools button').count()!==5)throw Error('cold factory five controls');
if(!await page.evaluate(()=>__offline.tools.getState().selectedFeatureId==='0'&&__offline.tools.getState().featureCount===1))throw Error('already-selected initialization');
await page.evaluate(()=>__offline.tools.update({className:'consumer-class',disabled:true}));
if(!await page.locator('#tools button').evaluateAll(nodes=>nodes.length===5&&nodes.every(n=>n.disabled)))throw Error('supported disabled update');
await page.evaluate(()=>__offline.tools.update({disabled:false,busy:true}));
if(!await page.locator('#tools button').evaluateAll(nodes=>nodes.every(n=>n.disabled)))throw Error('supported busy update');
await page.evaluate(()=>__offline.tools.update({busy:false}));
if(!await page.locator('#tools .ui-map-drawing').evaluate(root=>root.classList.contains('consumer-class')&&root.classList.contains('ui-map-drawing-object-tools')))throw Error('update preserves canonical layout');
await page.locator('[data-object-mode="rotate"]').click();
if(await page.locator('[data-object-mode="rotate"]').getAttribute('aria-pressed')!=='true')throw Error('cold adapter toggle');
const size=await page.evaluate(()=>__offline.tools.getSize());
await page.evaluate(()=>__offline.point());
if(await page.locator('[data-object-mode]').count()!==0||await page.locator('#tools button').count()!==3)throw Error('cold implicit Move');
if(!await page.evaluate(size=>__offline.tools.getSize().height<size.height-20,size))throw Error('cold sizing');
await page.evaluate(()=>{__offline.tools.destroy();if(__offline.listeners.size)throw Error('cold teardown listeners');});
const helper=requests.filter(p=>p!=='/offline');if(helper.length!==3||${JSON.stringify(paths)}.some(p=>!helper.includes(p)))throw Error('offline extra requests '+JSON.stringify(requests));
return 'DRAWING_OBJECT_OFFLINE_OK';
}`);
try{
 await cli('open about:blank');const result=await cli(`run-code --filename ${filename}`);
 if(!result.stdout.includes('"DRAWING_OBJECT_OFFLINE_OK"'))throw Error(result.stdout);
 console.log('Cold blocked-network object factory: three retained Helper assets, toggle/visibility/size/teardown passed.');
}finally{await cli('close');}
