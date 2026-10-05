import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {startStaticServer} from './_support/static-server.mjs';
// Use a local Playwright install, or point PLAYWRIGHT_MODULE at an existing installation.
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const server=await startStaticServer({rootDir:process.cwd(),port:0});
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']});
try {for(const bundle of [false,true]) {
 const page=await browser.newPage(); const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{
   window.captureContexts=[]; window.waveformSamples=0; window.waveformSignal=false;
   const NativeContext=window.AudioContext;
   window.AudioContext=class extends NativeContext { constructor(...args){super(...args);window.captureContexts.push(this);} };
   const read=AnalyserNode.prototype.getByteTimeDomainData;
   AnalyserNode.prototype.getByteTimeDomainData=function(data){read.call(this,data);window.waveformSamples++;if(data.some(n=>Math.abs(n-128)>1))window.waveformSignal=true;};
 });
 const load=async()=>{await page.goto(server.origin+'/tests/composer.recording.regression.html'+(bundle?'?bundle':''));await page.waitForFunction(()=>window.ready)};
 await load();
 await page.evaluate(()=>{composer.setValue('');composer.setAttachmentCount(1);});
 assert.equal(await page.locator('.ui-chat-composer-send').isDisabled(),true);
 await page.evaluate(()=>composer.update({}, {allowAttachmentOnly:true}));
 await page.locator('.ui-chat-composer-send').click();
 assert.equal(await page.evaluate(()=>sent),1);
 await page.evaluate(()=>{composer.setAttachmentCount(0);});
 assert.equal(await page.locator('.ui-chat-composer-send').isDisabled(),true);
 await load();
 await page.evaluate(()=>composer.update({}, {attachmentOptions:{files:{accept:'.pdf',multiple:false},audios:{audioGraphOptions:{className:'custom-microphone-graph',sensitivity:2}}}}));
 assert.equal(await page.locator('input[type=file]').getAttribute('accept'),'.pdf');
 assert.equal(await page.locator('input[type=file]').getAttribute('multiple'),null);
 await page.evaluate(()=>composer.update({}, {attachments:['audio','files','video','audio']}));
 assert.deepEqual(await page.locator('.ui-chat-composer-metadata button').allTextContents(),['Attach Audio','Attach file','Attach Video']);
 await page.evaluate(()=>composer.update({}, {attachments:['audio'],showAttachmentButton:false,attachmentAdapter:'none'}));
 assert.equal(await page.getByRole('button',{name:'Attach Audio',exact:true}).count(),1);
 assert.equal(await page.locator('input[type=file]').count(),0);
 await page.evaluate(()=>composer.update({}, {attachments:[]}));
 assert.equal(await page.locator('.ui-chat-composer-metadata button').count(),0);
 await load();
 await page.evaluate(()=>composer.update({}, {attachmentOptions:{files:{accept:'.pdf'},audios:{audioGraphOptions:{className:'custom-microphone-graph',sensitivity:2}}}}));
 for(const kind of ['audio','video']) {
   await page.getByRole('button',{name:kind==='video'?'Attach Video':'Attach Audio',exact:true}).click();
   await page.getByRole('button',{name:'Start recording',exact:true}).click();
   if(kind==='audio') {
     assert.equal(await page.locator('.custom-microphone-graph').count(),1);
     await page.getByRole('region',{name:'Microphone input waveform'}).waitFor();
     await page.waitForFunction(()=>waveformSamples>0 && waveformSignal);
   }
   await page.waitForTimeout(800);
   await page.getByRole('button',{name:'Stop recording',exact:true}).click();
   await page.getByRole('button',{name:'Attach recording',exact:true}).waitFor();
   assert.equal(await page.evaluate(()=>tracks.every(t=>t.readyState==='ended')),true);
   await page.waitForFunction(()=>captureContexts.every(context=>context.state==='closed'));
   {
     assert.equal(await page.locator('.ui-modal-header-actions').getByRole('button',{name:'Attach recording',exact:true}).count(),0);
     await page.getByRole('button',{name:'Record again',exact:true}).click();
     await page.getByRole('button',{name:'Stop recording',exact:true}).waitFor();
     assert.deepEqual(await page.evaluate(()=>[files.length,composer.getValue(),sent]),[kind==='audio'?0:1,'Existing draft',0]);
     await page.waitForTimeout(800);
     await page.getByRole('button',{name:'Stop recording',exact:true}).click();
     await page.getByRole('button',{name:'Attach recording',exact:true}).waitFor();
     assert.equal(await page.evaluate(()=>tracks.every(t=>t.readyState==='ended')),true);
   }
   await page.getByRole('button',{name:'Attach recording',exact:true}).click();
   await page.waitForFunction(n=>files.length===n,kind==='audio'?1:2);
   assert.equal(await page.evaluate(()=>files.at(-1).size>0),true);
   assert.equal(await page.evaluate(k=>files.at(-1).type.startsWith(k+'/'),kind),true);
   assert.deepEqual(await page.evaluate(()=>[composer.getValue(),sent]),['Existing draft',0]);
 }
 // Cancelling an active recording retains the existing two attachments and text.
 await page.getByRole('button',{name:'Attach Audio',exact:true}).click();
 await page.getByRole('button',{name:'Start recording',exact:true}).click();
 await page.getByRole('button',{name:'Close modal',exact:true}).click();
 await page.locator('.ui-modal-root').waitFor({state:'detached'});
 assert.deepEqual(await page.evaluate(()=>[files.length,composer.getValue(),tracks.every(t=>t.readyState==='ended')]),[2,'Existing draft',true]);
 // Denial is actionable and does not alter the draft.
 await page.evaluate(()=>{navigator.mediaDevices.getUserMedia=async()=>{throw new DOMException('Denied','NotAllowedError')}});
 await page.getByRole('button',{name:'Attach Video',exact:true}).click();
 await page.getByRole('alert').filter({hasText:'denied'}).waitFor();await page.getByRole('button',{name:'Close',exact:true}).click();await page.locator('.ui-modal-root').waitFor({state:'detached'});
 // Late permission after context disposal stops only the acquired tracks.
 await page.evaluate(()=>{navigator.mediaDevices.getUserMedia=()=>new Promise(resolve=>{window.releasePermission=async()=>{const s=await acquire({audio:true});window.lateTracks=s.getTracks();resolve(s)}})});
 await page.getByRole('button',{name:'Attach Audio',exact:true}).click();
 await page.waitForFunction(()=>!!window.releasePermission);
 await page.evaluate(()=>composer.destroy());await page.evaluate(()=>releasePermission());
 await page.waitForFunction(()=>lateTracks.every(t=>t.readyState==='ended'));
 assert.equal(await page.evaluate(()=>files.length),2);
 await load();
 // Limits never silently attach truncated media.
 await page.evaluate(()=>composer.update({}, {attachmentOptions:{audios:{maxBytes:1}}}));
 await page.getByRole('button',{name:'Attach Audio',exact:true}).click();await page.getByRole('button',{name:'Start recording',exact:true}).click();
 await page.getByRole('alert').filter({hasText:'size limit'}).waitFor();
 assert.deepEqual(await page.evaluate(()=>[files.length,tracks.every(t=>t.readyState==='ended')]),[0,true]);
 await page.getByRole('button',{name:'Close',exact:true}).click();await page.locator('.ui-modal-root').waitFor({state:'detached'});
 await page.evaluate(()=>composer.update({}, {attachmentOptions:{audios:{maxDurationMs:100}}}));
 await page.getByRole('button',{name:'Attach Audio',exact:true}).click();await page.getByRole('button',{name:'Start recording',exact:true}).click();
 await page.getByRole('alert').filter({hasText:'duration limit'}).waitFor();
 assert.equal(await page.evaluate(()=>files.length),0);
 assert.deepEqual(errors,[]);await page.close();console.log('Composer recording passed: '+(bundle?'bundle':'source'));
}}finally{await browser.close();await server.close()}
