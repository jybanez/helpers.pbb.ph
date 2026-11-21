import {pathToFileURL} from 'node:url';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE?pathToFileURL(process.env.PLAYWRIGHT_MODULE).href:'playwright');
const root=path.resolve(process.env.SPEECH_TEST_OUTPUT||'output/playwright/media-speech');
await fs.mkdir(root,{recursive:true});
const origin=new URL(process.env.SPEECH_TEST_ORIGIN||'https://diary.wizaya.com').origin;
const fixturePath=process.env.SPEECH_TEST_WAV;
if(!fixturePath)throw new Error('Set SPEECH_TEST_WAV to a disposable PCM WAV fixture. No physical microphone is used.');
const fixture=await fs.readFile(fixturePath);
const setup=process.argv.includes('--setup');
const context=await chromium.launchPersistentContext(process.env.SPEECH_TEST_PROFILE||path.join(root,'isolated-chrome'),{
 channel:'chrome',headless:true,ignoreDefaultArgs:['--disable-component-update','--disable-background-networking'],
 args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream','--use-file-for-fake-audio-capture='+path.resolve(fixturePath),'--disable-quic',...(setup?[]:['--proxy-server=http://127.0.0.1:9','--proxy-bypass-list='+new URL(origin).hostname])],
});
const evidence={browser:context.browser().version(),os:os.release(),fixtureSha256:crypto.createHash('sha256').update(fixture).digest('hex'),fixtureBytes:fixture.length,runs:[]};
try {
 await context.grantPermissions(['camera','microphone'],{origin});
 const page=context.pages()[0];
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{
  window.qa={streams:[],runs:[]};
  const gum=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
  navigator.mediaDevices.getUserMedia=async(...args)=>{const s=await gum(...args);qa.streams.push(s);return s;};
  const Api=window.SpeechRecognition||window.webkitSpeechRecognition;
  const start=Api.prototype.start;
  Api.prototype.start=function(...args){
   const run={argumentCount:args.length,trackId:args[0]?.id,processLocally:this.processLocally,lang:this.lang,continuous:this.continuous,events:[]};
   qa.runs.push(run); const t=performance.now();
   for(const type of ['start','audiostart','soundstart','speechstart','speechend','soundend','result','nomatch','error','audioend','end'])this.addEventListener(type,e=>run.events.push({type,ms:Math.round(performance.now()-t),error:e.error,results:e.results?Array.from(e.results,r=>({final:r.isFinal,text:r[0]?.transcript})):undefined}));
   return start.apply(this,args);
  };
 });
 await page.goto(origin+'/test/transcription.html');
 await page.getByRole('button',{name:'Record audio',exact:true}).waitFor();
 if(setup){
  await page.getByRole('checkbox',{name:'Transcribe speech on this device (English, US)'}).check();
  const install=page.getByRole('button',{name:'Install English model'});
  if(await install.count() && await install.isEnabled())await install.click();
  await page.waitForFunction(()=>Array.from(document.querySelectorAll('[role=status]')).some(e=>/is ready/i.test(e.textContent)),{},{timeout:120000});
  evidence.ready=await page.evaluate(async()=>await(window.SpeechRecognition||window.webkitSpeechRecognition).available({langs:['en-US'],processLocally:true}));
  assert.equal(evidence.ready,'available');
  console.log('Local model ready. Rerun without --setup to test offline.');
 }else{
 evidence.ready=await page.evaluate(async()=>await(window.SpeechRecognition||window.webkitSpeechRecognition).available({langs:['en-US'],processLocally:true}));
 assert.equal(evidence.ready,'available');
 const probe=await context.newPage();
 try{await probe.goto('https://example.com',{timeout:5000});evidence.externalBlocked=false;}catch(e){evidence.externalBlocked=e.message.includes('ERR_PROXY_CONNECTION_FAILED');}await probe.close();
 assert.equal(evidence.externalBlocked,true);
 await context.setOffline(true);evidence.online=await page.evaluate(()=>navigator.onLine);assert.equal(evidence.online,false);
 for(const name of (process.argv.includes('--clean-only')?['clean-track']:['standalone-track','standalone-track-recorder','native-microphone'])){
  const run=await page.evaluate(async name=>{
   const Api=window.SpeechRecognition||window.webkitSpeechRecognition;
   const recognition=new Api();recognition.processLocally=true;recognition.lang='en-US';recognition.interimResults=true;recognition.continuous=true;recognition.maxAlternatives=1;
   let stream,recorder,audio,source,analyser,sampling;let peak=0,sampleCount=0,blobBytes=0;
   if(name!=='native-microphone'){
    stream=await navigator.mediaDevices.getUserMedia({audio:name==='clean-track'?{channelCount:1,echoCancellation:false,autoGainControl:false,noiseSuppression:false}:true});
    audio=new AudioContext();await audio.resume();source=audio.createMediaStreamSource(stream);analyser=audio.createAnalyser();source.connect(analyser);
    sampling=setInterval(()=>{const a=new Float32Array(analyser.fftSize);analyser.getFloatTimeDomainData(a);peak=Math.max(peak,...a.map(Math.abs));sampleCount++;},100);
    if(name.endsWith('-recorder')){recorder=new MediaRecorder(stream);recorder.ondataavailable=e=>blobBytes+=e.data.size;recorder.start(250);}
    recognition.start(stream.getAudioTracks()[0]);
   }else recognition.start();
   await new Promise(resolve=>setTimeout(resolve,22000));
   const beforeStop=structuredClone(qa.runs.at(-1));
   recognition.stop();
   if(recorder){await new Promise(resolve=>{recorder.onstop=resolve;recorder.stop();});}
   await new Promise(resolve=>setTimeout(resolve,2000));
   clearInterval(sampling);source?.disconnect();await audio?.close();stream?.getTracks().forEach(t=>t.stop());
   return {name,beforeStop,afterStop:qa.runs.at(-1),peak,sampleCount,blobBytes,tracks:stream?.getTracks().map(t=>({id:t.id,state:t.readyState,settings:t.getSettings()}))};
  },name);
  evidence.runs.push(run);console.log(JSON.stringify(run));
 }
 await page.getByRole('checkbox',{name:'Transcribe speech on this device (English, US)'}).check();
 for(const kind of (process.argv.includes('--clean-only')?[]:['audio','video'])){
  const startCount=await page.evaluate(()=>qa.streams.length);
  await page.getByRole('button',{name:'Record '+kind,exact:true}).click();
  const dialog=page.getByRole('dialog');await dialog.getByRole('button',{name:'Start recording',exact:true}).click();
  await page.waitForTimeout(22000);
  const beforeStop=await page.evaluate(()=>structuredClone(qa.runs.at(-1)));
  await dialog.getByRole('button',{name:'Stop recording',exact:true}).click();
  await dialog.getByRole('button',{name:'Attach recording',exact:true}).waitFor();
  await page.waitForTimeout(2000);
  const run=await page.evaluate(({kind,startCount,beforeStop})=>({name:'pbb-'+kind,beforeStop,afterStop:qa.runs.at(-1),captureCount:qa.streams.length-startCount,tracks:qa.streams.at(-1).getTracks().map(t=>({id:t.id,state:t.readyState,kind:t.kind}))}),{kind,startCount,beforeStop});
  evidence.runs.push(run);console.log(JSON.stringify(run));
  await dialog.getByRole('button',{name:'Close modal',exact:true}).click();
 }
 evidence.errors=errors;assert.deepEqual(errors,[]);
 }
}catch(e){evidence.error=e.stack;process.exitCode=1;console.error(e);}
finally{await fs.writeFile(path.join(root,setup?'setup-evidence.json':process.argv.includes('--clean-only')?'diagnostic-clean-evidence.json':'diagnostic-evidence.json'),JSON.stringify(evidence,null,2));await context.close();}
