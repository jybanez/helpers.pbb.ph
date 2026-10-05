import assert from 'node:assert/strict';
import {startStaticServer} from './_support/static-server.mjs';
import {chromium} from 'file:///C:/wamp64/www/bimoperks/node_modules/playwright/index.mjs';
const server=await startStaticServer({rootDir:process.cwd(),port:0});
const browser=await chromium.launch({channel:'msedge',headless:true});
try { for(const bundle of [false,true]) {
 const page=await browser.newPage();await page.goto(server.origin+'/tests/audio.chrome.regression.html'+(bundle?'?bundle':''));await page.waitForFunction(()=>window.ready);
 for(const kind of ['timeline','session']) {
 const result=await page.evaluate(async kind=>{
 const host=document.querySelector('#host');
 const data=kind==='timeline'?{tracks:[{id:'caller',label:'Caller',segments:[{id:'pending',processing:true,processingLabel:'Preparing audio',durationMs:1000}]}]}:{media:[{id:'pending',type:'audio',processing:true,processingLabel:'Preparing audio',peer_role:'caller',created_at:'2026-10-05T00:00:00Z',metadata:{processing:true,track_kind:'audio'}}]};
 const api=factories[kind](host,data,{});await new Promise(r=>setTimeout(r,100));
 const root=host.querySelector('.ui-audio-session');const defaultBorder=getComputedStyle(root).borderTopWidth;const initialMuteCount=host.querySelectorAll('.ui-audiograph-mute').length;
 await api.update(data,{chrome:false});
 const wrappers=[root,host.querySelector('.ui-audio-session-player'),host.querySelector('.ui-audiograph')];
 const stripped=wrappers.every(n=>getComputedStyle(n).borderTopWidth==='0px'&&getComputedStyle(n).paddingTop==='0px'&&getComputedStyle(n).backgroundColor==='rgba(0, 0, 0, 0)');
 const controls=!!host.querySelector('.ui-audio-player-toggle')&&!!host.querySelector('.ui-audio-player-seek')&&host.querySelectorAll('.ui-audiograph-mute').length===initialMuteCount;
 const feedback=host.textContent.includes('Preparing audio');
 const canvas=host.querySelector('canvas');const initialCanvas=getComputedStyle(canvas).backgroundImage;
 await api.update(data,{transparentBackground:true});const independent=root.classList.contains('is-chromeless')&&getComputedStyle(host.querySelector('canvas')).backgroundImage==='none';
 await api.update(data);const retained=root.classList.contains('is-chromeless');
 await api.update(data,{chrome:true});const restored=getComputedStyle(root).borderTopWidth===defaultBorder&&!root.classList.contains('is-chromeless');
 api.destroy();return {defaultBorder,stripped,controls,feedback,initialCanvas,independent,retained,restored};
 },kind);
 assert.notEqual(result.defaultBorder,'0px');for(const key of ['stripped','controls','feedback','independent','retained','restored'])assert.equal(result[key],true,`${kind} ${key}`);assert.notEqual(result.initialCanvas,'none');
 }
 await page.close();console.log('Audio chrome passed: '+(bundle?'bundle':'source'));
}}finally{await browser.close();await server.close();}
