import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {startStaticServer} from './_support/static-server.mjs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE?pathToFileURL(process.env.PLAYWRIGHT_MODULE).href:'playwright');
const server=await startStaticServer({rootDir:process.cwd(),port:0});
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
 for(const bundle of [false,true]) {
  const page=await browser.newPage({viewport:{width:600,height:800},isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(server.origin+'/tests/media.viewer.pinch.regression.html'+(bundle?'?bundle':''));
  await page.waitForFunction(()=>window.viewer&&document.querySelector('img')?.naturalWidth>0);
  const failures=await page.evaluate(async()=>{
   const failures=[],a=(ok,msg)=>{if(!ok)failures.push(msg);},near=(x,y)=>Math.abs(x-y)<.1;
   const vp=()=>document.querySelector('.ui-media-viewer-viewport');
   const point=(type,id,x,y,target=vp(),pointerType='touch')=>{
    const e=new PointerEvent(type,{pointerId:id,pointerType,clientX:x,clientY:y,button:0,bubbles:true,cancelable:true});target.dispatchEvent(e);return e;
   };
   const center=()=>{const r=vp().getBoundingClientRect();return {x:r.left+vp().clientLeft+vp().clientWidth/2,y:r.top+vp().clientTop+vp().clientHeight/2};};
   let c=center();
   const start=()=>{c=center();point('pointerdown',1,c.x-50,c.y);point('pointerdown',2,c.x+50,c.y);};
   const end=()=>{point('pointerup',1,0,0,window);point('pointerup',2,0,0,window);};
   a(getComputedStyle(vp()).touchAction==='none','media surface suppresses browser pinch');
   a(getComputedStyle(document.body).touchAction==='auto','page zoom stays available');
   a(getComputedStyle(document.querySelector('.ui-media-viewer-toolbar')).touchAction==='auto','toolbar outside suppression');
   start();point('pointermove',2,c.x+150,c.y,window);
   a(near(viewer.getState().zoom,2),'pinch grows from minimum');
   a(near(viewer.getState().panX,50),'moving midpoint anchors content');
   point('pointerup',2,0,0,window);const before=viewer.getState();
   point('pointermove',1,c.x-40,c.y,window);a(near(viewer.getState().panX,before.panX+10),'pinch to pan has no jump');end();
   viewer.resetView();start();point('pointermove',2,c.x+1000,c.y,window);a(viewer.getState().zoom===3,'max bound');
   point('pointermove',2,c.x-49,c.y,window);a(viewer.getState().zoom===1,'min bound');end();
   start();point('pointercancel',1,0,0,window);point('pointermove',2,c.x+200,c.y,window);a(viewer.getState().zoom===1,'cancel clears all');
   start();point('lostpointercapture',1,0,0);point('pointermove',2,c.x+200,c.y,window);a(viewer.getState().zoom===1,'capture loss clears all');
   for(const action of [()=>{viewer.close();viewer.open();},()=>viewer.setIndex(1),()=>viewer.update({zoomStep:.25}),()=>viewer.resetView(),()=>viewer.setFit('cover')]) {
    start();action();const z=viewer.getState().zoom;point('pointermove',2,c.x+200,c.y,window);a(viewer.getState().zoom===z,'lifecycle ignores stale pointer');
   }
   viewer.setFit('contain');viewer.zoomIn();const z=viewer.getState().zoom;
   vp().dispatchEvent(new WheelEvent('wheel',{deltaY:-1,cancelable:true,bubbles:true}));a(viewer.getState().zoom>z,'wheel preserved');
   document.dispatchEvent(new KeyboardEvent('keydown',{key:'+',bubbles:true,cancelable:true}));a(viewer.getState().zoom>z+.25,'keyboard preserved');
   c=center();point('pointerdown',9,c.x,c.y,vp(),'mouse');point('pointermove',9,c.x+10,c.y,window,'mouse');a(viewer.getState().panX>0,'mouse pan preserved');point('pointerup',9,0,0,window,'mouse');
   viewer.update({pinchZoom:false,panWhenZoomed:false});a(getComputedStyle(vp()).touchAction==='auto','pinch opt-out');start();point('pointermove',2,c.x+200,c.y,window);a(viewer.getState().zoom===1,'disabled pinch does nothing');end();
   viewer.update({pinchZoom:false,panWhenZoomed:true});viewer.zoomIn();const disabledZoom=viewer.getState().zoom;
   start();point('pointermove',2,c.x+200,c.y,window);a(viewer.getState().zoom===disabledZoom,'disabled pinch stays disabled when panning');end();
   viewer.update({pinchZoom:true,panWhenZoomed:false});start();point('pointermove',2,c.x+150,c.y,window);a(viewer.getState().zoom===2,'pinch independent from pan option');end();
   viewer.update({panWhenZoomed:true,items:[{type:'video',src:'data:video/webm;base64,'}]});
   const video=document.querySelector('video'),canvas=document.createElement('canvas');canvas.width=800;canvas.height=800;
   const stream=canvas.captureStream(10);video.srcObject=stream;canvas.getContext("2d").fillRect(0,0,800,800);
   await Promise.race([video.play(),new Promise((_,reject)=>setTimeout(()=>reject(new Error("video playback timeout")),5000))]);
   await new Promise(r=>setTimeout(r,100));
   c=center();const first=point('pointerdown',1,c.x-50,c.y,video);a(!first.defaultPrevented,'single video touch not consumed');
   point('pointerup',1,0,0,window);
   point('pointerdown',1,c.x-50,c.y,video);point('pointerdown',2,c.x+50,c.y,video);point('pointermove',2,c.x+150,c.y,window);
   a(viewer.getState().zoom===2,'inline video pinches');
   a(video.controls&&document.querySelector('.ui-media-viewer-pan-surface').hidden,'video controls not overlaid');end();
   const key=new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true,cancelable:true});video.dispatchEvent(key);a(!key.defaultPrevented,'video keyboard controls not intercepted');
   stream.getTracks().forEach(t=>t.stop());start();viewer.destroy();point('pointermove',2,c.x+200,c.y,window);a(!document.querySelector('.ui-media-viewer-shell'),'destroy detaches');
   window.viewer=makeViewer();return failures;
  });
  assert.deepEqual(failures,[]);
  await page.waitForFunction(()=>document.querySelector('img')?.naturalWidth>0);
  const client=await page.context().newCDPSession(page);
  const box=await page.locator('.ui-media-viewer-viewport').boundingBox();
  const x=box.x+box.width/2,y=box.y+box.height/2;
  const touches=d=>[{x:x-d,y,id:1},{x:x+d,y,id:2}];
  await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:touches(40)});
  for(const d of [50,60,70,80]) await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:touches(d)});
  await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  assert.ok(await page.evaluate(()=>viewer.getState().zoom)>1.8,'browser touch pinches media');
  assert.equal(await page.evaluate(()=>visualViewport.scale),1,'browser touch does not zoom page inside viewport');
  await page.evaluate(async()=>{
   viewer.update({items:[{type:'video',src:'data:video/webm;base64,'}]});
   const canvas=document.createElement('canvas');canvas.width=800;canvas.height=800;
   window.testStream=canvas.captureStream(10);const video=document.querySelector('video');video.srcObject=testStream;
   canvas.getContext('2d').fillRect(0,0,800,800);
   await Promise.race([video.play(),new Promise((_,reject)=>setTimeout(()=>reject(new Error('video timeout')),5000))]);
  });
  await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:touches(40)});
  for(const d of [50,60,70,80]) await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:touches(d)});
  await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  assert.ok(await page.evaluate(()=>viewer.getState().zoom)>1.8,'browser touch pinches inline video');
  assert.equal(await page.evaluate(()=>visualViewport.scale),1,'inline video gesture stays within viewer');
  await page.evaluate(()=>testStream.getTracks().forEach(t=>t.stop()));
  assert.deepEqual(errors,[]);
  if(!bundle) {
   await page.setViewportSize({width:1280,height:900});
   await page.goto(server.origin+'/tests/media.viewer.regression.html');
   await page.waitForFunction(()=>['pass','fail'].includes(document.body.dataset.status));
   assert.equal(await page.locator('body').getAttribute('data-status'),'pass',await page.locator('#results').innerText());
  }
  await page.close();console.log(`Media pinch pointer/lifecycle/video and browser touch passed: ${bundle?'bundle':'source'}`);
 }
}finally{await browser.close();await server.close();}
