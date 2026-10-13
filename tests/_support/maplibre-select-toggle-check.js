async page => {
    // Keep readiness failures reviewable without replaying input or changing assertions.
    const originalWait = page.waitForFunction.bind(page); let readinessStage = 0;
    page.waitForFunction = async (...args) => {
      const stage = ++readinessStage;
      try { return await originalWait(...args); }
      catch(error) {
        const diagnostic = await page.evaluate(() => {const {map,adapter:a}=window.__drawing||{},b=map?.getCanvas().getBoundingClientRect();return {width:innerWidth,url:location.search,box:b?{x:b.x,y:b.y,width:b.width,height:b.height}:null,state:a?.getState(),caps:a?.getCapabilities(),camera:map?{center:map.getCenter().toArray(),bearing:map.getBearing(),pitch:map.getPitch(),zoom:map.getZoom(),moving:map.isMoving(),loaded:map.loaded(),sourceLoaded:map.isSourceLoaded(a.getState().sourceId)}:null};});
        throw Error(`Select readiness stage ${stage}: ${error.message}; ${JSON.stringify({argument:args[1],diagnostic})}`);
      }
    };
  const check=(value,message)=>{if(!value)throw Error(message);};
  const select=()=>page.locator('#tools [data-mode="select"]');
  for(const width of [1200,375]) {
    await page.setViewportSize({width,height:1000});await page.reload();await page.waitForFunction(()=>window.__drawingReady);
    await page.locator('#map canvas').scrollIntoViewIfNeeded();
    check(await select().getAttribute('aria-pressed')==='true','starts selected');
    check(await page.locator('#tools [data-mode="pan"]').count()===0,'no Pan button');
    await page.evaluate(()=>{const{map,adapter:a}=__drawing;map.jumpTo({bearing:31,pitch:40});const b=map.getCanvas().getBoundingClientRect(),ring=ps=>ps.map(p=>{const c=map.unproject([p[0]*b.width,p[1]*b.height]);return[c.lng,c.lat];});a.setFeatures([{type:'Feature',id:0,properties:{retained:{yes:true}},geometry:{type:'Polygon',coordinates:[ring([[.2,.25],[.8,.25],[.8,.8],[.2,.8],[.2,.25]]),ring([[.45,.45],[.45,.6],[.6,.6],[.6,.45],[.45,.45]])]}}]);});
    const pos=async(x,y)=>page.evaluate(([x,y])=>{const b=__drawing.map.getCanvas().getBoundingClientRect();return{x:b.x+x*b.width,y:b.y+y*b.height};},[x,y]);
    await page.evaluate(()=>{const{map,adapter:a}=__drawing,b=map.getCanvas().getBoundingClientRect(),ll=map.unproject([b.width*.9,b.height*.7]);a.setFeatures([...a.getFeatures(),{type:'Feature',id:'other',properties:{},geometry:{type:'Point',coordinates:[ll.lng,ll.lat]}}]);});
    const p=await pos(.3,.5);
    await page.waitForFunction(({x,y})=>{const{map,adapter:a}=__drawing,b=map.getCanvas().getBoundingClientRect();return map.queryRenderedFeatures([x-b.x,y-b.y],{layers:a.getState().layerIds.slice(0,3)}).some(f=>f.properties.__helperId==='0');},p);
    await page.mouse.click(p.x,p.y);
    check(await page.evaluate(()=>__drawing.adapter.getState().selectedFeatureId==='0'),'numeric0 selected');
    await page.evaluate(()=>{const a=__drawing.adapter;window.__toggleHistoryBefore=a.getFeatures();if(!a.updateFeature(0,{style:{stroke:{r:9,g:8,b:7,a:1}}}))throw Error('completed history unit');window.__toggleHistoryAfter=a.getFeatures();});
    await select().focus();await page.keyboard.press('Space');
    check(await select().getAttribute('aria-pressed')==='false','keyboard off');
    check(await select().getAttribute('title')==='Turn selection on to edit objects','off title');
    await page.evaluate(()=>__drawing.tools.update({activeMode:'select'}));
    check(await select().getAttribute('aria-pressed')==='false','render uses actual adapter mode');
    check(await select().evaluate(el=>el===document.activeElement),'focus retained after toggle');
    const snapshot=await page.evaluate(()=>{const a=__drawing.adapter;return JSON.stringify({f:a.getFeatures(),s:a.getState().selectedFeatureId,c:a.getCapabilities().actions});});
    await page.waitForFunction(()=>{const{map,adapter:a}=__drawing;return !map.queryRenderedFeatures({layers:[a.getState().layerIds[3]]}).length;});
    for(const target of ['selected','other']) {
      await page.evaluate(()=>__drawing.map.stop());
      const q=target==='selected'?await pos(.3,.5):await page.evaluate(()=>{const{map,adapter:a}=__drawing,b=map.getCanvas().getBoundingClientRect(),p=map.project(a.getFeatures().find(f=>f.id==='other').geometry.coordinates);return{x:p.x+b.x,y:p.y+b.y};});
      await page.waitForFunction(({x,y,target})=>{const{map,adapter:a}=__drawing,b=map.getCanvas().getBoundingClientRect();return map.queryRenderedFeatures([x-b.x,y-b.y],{layers:a.getState().layerIds.slice(0,3)}).some(f=>f.properties.__helperId===(target==='selected'?'0':'other'));},{...q,target});
      const before=await page.evaluate(()=>__drawing.map.getCenter().toArray());
      await page.mouse.move(q.x,q.y);await page.mouse.down();await page.mouse.move(q.x+25,q.y+15,{steps:5});await page.mouse.up();
      check(await page.evaluate(before=>JSON.stringify(__drawing.map.getCenter().toArray())!==JSON.stringify(before),before),'native pan over '+target+' geometry');
    }
    await page.locator('#map canvas').focus();await page.keyboard.press('Delete');await page.keyboard.press('Control+z');
    const camera=await page.evaluate(()=>({zoom:__drawing.map.getZoom(),bearing:__drawing.map.getBearing(),pitch:__drawing.map.getPitch()}));
    const navigation=await pos(.5,.5);await page.mouse.move(navigation.x,navigation.y);await page.mouse.wheel(0,-160);
    await page.waitForFunction(zoom=>__drawing.map.getZoom()!==zoom,camera.zoom);
    await page.mouse.down({button:'right'});await page.mouse.move(navigation.x+40,navigation.y+30,{steps:6});await page.mouse.up({button:'right'});
    check(await page.evaluate(camera=>__drawing.map.getBearing()!==camera.bearing&&__drawing.map.getPitch()!==camera.pitch,camera),'native rotate and tilt');
    check(await page.evaluate(snapshot=>{const a=__drawing.adapter;return JSON.stringify({f:a.getFeatures(),s:a.getState().selectedFeatureId,c:a.getCapabilities().actions})===snapshot;},snapshot),'navigation geometry/selection/history unchanged');
    await page.evaluate(()=>{__drawing.map.stop();__drawing.map.jumpTo({center:[123.8854,10.3157],zoom:12,bearing:31,pitch:40});});
    // Finish the camera/render work from native navigation before switching to
    // keyboard activation. Keep one native Enter and the original assertion.
    await page.waitForFunction(()=>{const {map,adapter:a}=__drawing;return !map.isMoving()&&map.loaded()&&map.isSourceLoaded(a.getState().sourceId);});
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    await page.evaluate(()=>{
      window.__toggleEnterEvents=[];
      window.__toggleEnterObserver=event=>{
        const button=document.querySelector('#tools [data-mode="select"]');
        __toggleEnterEvents.push({type:event.type,key:event.key,targetMode:event.target?.dataset?.mode,targetConnected:event.target.isConnected,targetIsCurrent:event.target===button,defaultPrevented:event.defaultPrevented,focused:document.activeElement===button,disabled:button.disabled,pressed:button.getAttribute('aria-pressed'),mode:__drawing.adapter.getMode(),time:performance.now()});
      };
      for(const name of ['keydown','keypress','keyup','click'])document.addEventListener(name,__toggleEnterObserver);
    });
    await select().focus();await page.keyboard.press('Enter');
    const keyboard=await page.evaluate(()=>{
      for(const name of ['keydown','keypress','keyup','click'])document.removeEventListener(name,__toggleEnterObserver);
      const {map,adapter:a}=__drawing,button=document.querySelector('#tools [data-mode="select"]');
      return {width:innerWidth,query:location.search,focused:document.activeElement===button,disabled:button.disabled,pressed:button.getAttribute('aria-pressed'),state:a.getState(),capabilities:a.getCapabilities(),camera:{center:map.getCenter().toArray(),zoom:map.getZoom(),bearing:map.getBearing(),pitch:map.getPitch(),moving:map.isMoving(),loaded:map.loaded()},events:__toggleEnterEvents};
    });
    check(keyboard.pressed==='true','keyboard on '+JSON.stringify(keyboard));
    await page.evaluate(()=>{const a=__drawing.adapter;a.undo();if(JSON.stringify(a.getFeatures())!==JSON.stringify(__toggleHistoryBefore))throw Error('prior history retained');a.redo();if(JSON.stringify(a.getFeatures())!==JSON.stringify(__toggleHistoryAfter))throw Error('prior redo retained');});
    await page.waitForFunction(()=>__drawing.map.queryRenderedFeatures({layers:[__drawing.adapter.getState().layerIds[3]]}).length>0);
    const vertex=await page.evaluate(()=>{const{map,adapter:a}=__drawing,b=map.getCanvas().getBoundingClientRect(),p=map.project(a.getFeatures()[0].geometry.coordinates[0][0]);return{x:p.x+b.x,y:p.y+b.y};});
    const beforeDrag=await page.evaluate(()=>JSON.stringify(__drawing.adapter.getFeatures()));
    await page.locator('#map canvas').focus();
    const vertexReady=async()=>page.waitForFunction(({x,y})=>{const{map,adapter:a}=__drawing,b=map.getCanvas().getBoundingClientRect();return map.queryRenderedFeatures([x-b.x,y-b.y],{layers:[a.getState().layerIds[3]]}).length>0;},vertex);
    await vertexReady();
    await page.mouse.move(vertex.x,vertex.y);await page.mouse.down();await page.mouse.move(vertex.x+12,vertex.y+8,{steps:4});
    check(await page.evaluate(()=>__drawing.adapter.getState().dragging&&__drawing.adapter.setMode('pan')===false),'live drag rejects toggle');
    await page.keyboard.press('Escape');await page.mouse.up();
    check(await page.evaluate(before=>JSON.stringify(__drawing.adapter.getFeatures())===before,beforeDrag),'Escape restores live edit');
    await vertexReady();
    await page.mouse.move(vertex.x,vertex.y);await page.mouse.down();await page.mouse.move(vertex.x+12,vertex.y+8,{steps:4});await page.mouse.up();
    check(await page.evaluate(before=>JSON.stringify(__drawing.adapter.getFeatures())!==before,beforeDrag),'restored vertex editing');
    await page.evaluate(()=>__drawing.adapter.undo());
    // Live edit cannot silently abort on a mode request; explicit Cancel restores it.
    await page.evaluate(()=>{const a=__drawing.adapter;window.__toggleBefore=a.getFeatures();window.__toggleStyle=a.beginStyleChange();if(!__toggleStyle)throw Error('style begin');a.previewStyle({stroke:{r:1,g:2,b:3,a:1}},__toggleStyle);if(a.setMode('pan')!==false||__drawing.tools.setMode('pan')!==false||a.getMode()!=='select')throw Error('style transition rejection');a.cancel();if(JSON.stringify(a.getFeatures())!==JSON.stringify(__toggleBefore))throw Error('style cancel');});
    for(const mode of ['point','line','path','polygon','circle','rectangle']) {
      await page.evaluate(mode=>{const a=__drawing.adapter;a.setFeatures([]);if(!a.setMode(mode))throw Error('mode');},mode);
      const click=async(x,y)=>{const q=await pos(x,y);await page.mouse.click(q.x,q.y);};
      await click(.35,.4);
      if(mode!=='point') {
        const draft=await page.evaluate(()=>JSON.stringify(__drawing.adapter.getState().draft));
        check(await page.evaluate(()=>{const a=__drawing.adapter,before=JSON.stringify(a.getState());return a.setMode(a.getMode())===true&&JSON.stringify(a.getState())===before;}),'same-mode no-op');
        check(await page.evaluate(()=>__drawing.tools.setMode('pan')===false&&__drawing.adapter.setMode('select')===false),'draft rejects transition');
        check(await page.evaluate(draft=>JSON.stringify(__drawing.adapter.getState().draft)===draft,draft),'draft retained');
        check(await select().isDisabled(),'blocked Select truthful');
        check((await page.locator('#tools [role="status"]').textContent()).includes('Finish or cancel the drawing'),'visible pending reason');
        await click(.65,.6);
        if(mode==='polygon')await click(.35,.65);
        if(mode==='path'||mode==='polygon')await page.locator('#tools [data-action="finish"]').click();
      }
      check(await page.evaluate(()=>__drawing.adapter.getMode()==='select'&&__drawing.adapter.getFeatures().length===1),'completion Select '+mode);
      check(await select().getAttribute('aria-pressed')==='true','completion pressed '+mode);
      const completed=await page.evaluate(()=>JSON.stringify(__drawing.adapter.getFeatures()));
      await page.evaluate(mode=>__drawing.adapter.setMode(mode),mode);
      if(mode!=='point')await click(.35,.4);
      await page.locator('#tools [data-action="cancel"]').click();
      check(await page.evaluate(before=>__drawing.adapter.getMode()==='select'&&JSON.stringify(__drawing.adapter.getFeatures())===before,completed),'Cancel preserves completed layer '+mode);
      check(await select().getAttribute('aria-pressed')==='true','Cancel pressed '+mode);
    }
    await page.evaluate(()=>{const a=__drawing.adapter;a.setMode('path');const c=__drawing.map.getCenter();__drawing.map.fire('click',{lngLat:c,point:__drawing.map.project(c)});a.undo();let rejected=null;const off=a.on('moderejected',value=>{rejected=value;});if(a.setMode('pan')!==false||__drawing.tools.setMode('pan')!==false||!rejected?.reason.includes('Finish or cancel'))throw Error('redo draft transition/feedback');off();a.cancel();if(a.getMode()!=='select'||a.getState().draft.length)throw Error('explicit draft cancel');});
    await select().click();await page.locator('#reload').click();
    await page.waitForFunction(()=>__drawing.map.isStyleLoaded());
    check(await select().getAttribute('aria-pressed')==='false','style reload retains navigation');
    await page.locator('#destroy').click();await page.locator('#recreate').click();
    check(await select().getAttribute('aria-pressed')==='true','recreate starts selected');
  }
  return 'SELECT_TOGGLE_OK';
}
