async page => {
  const check=(v,m)=>{if(!v)throw Error(m);},errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const width of [1200,375]) for(const tilted of [false,true]) {
    await page.setViewportSize({width,height:1000});await page.reload();await page.waitForFunction(()=>window.__drawingReady);
    await page.locator('#map canvas').scrollIntoViewIfNeeded();
    const setup=async()=>page.evaluate(tilted=>{
      const{map,adapter:a}=__drawing;a.setMode('select');map.jumpTo({center:[123.8854,10.3157],zoom:12,bearing:tilted?31:0,pitch:tilted?40:0});
      const b=map.getCanvas().getBoundingClientRect(),ring=points=>points.map(([x,y])=>{const c=map.unproject([x*b.width,y*b.height]);return[c.lng,c.lat];});
      const geometry={type:'Polygon',foreign:{retained:true},coordinates:[ring([[.2,.25],[.8,.25],[.8,.8],[.2,.8],[.2,.25]]),ring([[.45,.45],[.45,.6],[.6,.6],[.6,.45],[.45,.45]])]};
      a.setFeatures([{type:'Feature',id:0,properties:{helperShape:{kind:'unknown',keep:true},helperStyle:{fill:{r:1,g:2,b:3,a:0}},foreign:'retained'},geometry}]);
      window.__polygonBase=a.getFeatures();return b.toJSON();
    },tilted);
    const pos=async(x,y)=>page.evaluate(([x,y])=>{const b=__drawing.map.getCanvas().getBoundingClientRect();return{x:b.x+b.width*x,y:b.y+b.height*y};},[x,y]);
    const ready=async p=>page.waitForFunction(({x,y})=>{const{map,adapter:a}=__drawing,b=map.getCanvas().getBoundingClientRect();return map.isSourceLoaded(a.getState().sourceId)&&map.queryRenderedFeatures([x-b.x,y-b.y],{layers:a.getState().layerIds.slice(0,3)}).some(f=>f.properties.__helperId==='0');},p);
    const select=async()=>{const p=await pos(.3,.5);await ready(p);await page.mouse.click(p.x,p.y);check(await page.evaluate(()=>__drawing.adapter.getState().selectedFeatureId==='0'),'selected numeric0');};
    for(const target of [[.3,.5],[.5,.25],[.45,.525],[.2,.25]]) {
      await setup();await select();const p=await pos(...target);await ready(p);await page.mouse.move(p.x,p.y);await page.mouse.down();
      check(await page.evaluate(()=>__drawing.adapter.getState().dragging&&!__drawing.adapter.getCapabilities().canPersist),'drag/canPersist');
      const center=await page.evaluate(()=>__drawing.map.getCenter().toArray());await page.mouse.move(p.x+18,p.y+12,{steps:4});
      check(await page.evaluate(()=>JSON.stringify(__drawing.adapter.getFeatures())===JSON.stringify(__polygonBase)||!!__drawing.adapter.getState().editSession||!location.search.includes('immediate')),'immediate excludes preview');
      await page.mouse.up();
      await page.evaluate(({center,vertex})=>{const{map,adapter:a}=__drawing,f=a.getFeatures()[0],base=__polygonBase[0];
        if(JSON.stringify(map.getCenter().toArray())!==JSON.stringify(center))throw Error('camera moved');
        if(JSON.stringify(f)===JSON.stringify(base))throw Error('geometry unchanged');
        if(JSON.stringify(f.properties)!==JSON.stringify(base.properties)||JSON.stringify(f.geometry.foreign)!==JSON.stringify(base.geometry.foreign))throw Error('metadata');
        if(!vertex){const d=f.geometry.coordinates[0][1].map((n,i)=>n-base.geometry.coordinates[0][1][i]);for(let r=0;r<2;r++)for(let i=0;i<f.geometry.coordinates[r].length;i++)for(let k=0;k<2;k++)if(Math.abs(f.geometry.coordinates[r][i][k]-base.geometry.coordinates[r][i][k]-d[k])>1e-10)throw Error('nonuniform rings');}
        else if(JSON.stringify(f.geometry.coordinates[1])!==JSON.stringify(base.geometry.coordinates[1]))throw Error('vertex moved hole');
        for(const ring of f.geometry.coordinates)if(JSON.stringify(ring[0])!==JSON.stringify(ring.at(-1)))throw Error('closure');
        const after=JSON.stringify(a.getFeatures());a.undo();if(JSON.stringify(a.getFeatures())!==JSON.stringify(__polygonBase))throw Error('undo');a.redo();if(JSON.stringify(a.getFeatures())!==after)throw Error('redo');
      },{center,vertex:target[0]===.2});
    }
    // Hole interior must pan; a topmost Point must not move the Polygon below it.
    for(const overlap of [false,true]) {
      await setup();await select();const p=await pos(.525,.525);
      if(overlap){await page.evaluate(()=>{const{map,adapter:a}=__drawing,b=map.getCanvas().getBoundingClientRect(),ll=map.unproject([b.width*.3,b.height*.5]);a.setFeatures([...a.getFeatures(),{type:'Feature',id:'top',properties:{},geometry:{type:'Point',coordinates:[ll.lng,ll.lat]}}]);});}
      const hit=overlap?await pos(.3,.5):p;
      if(overlap){ // Select Polygon at an uncovered location, then target the overlaid Point.
        const uncovered=await pos(.7,.65);await ready(uncovered);await page.mouse.click(uncovered.x,uncovered.y);await page.waitForFunction(()=>__drawing.map.queryRenderedFeatures(__drawing.map.project(__drawing.adapter.getFeatures()[1].geometry.coordinates),{layers:__drawing.adapter.getState().layerIds.slice(0,3)}).some(f=>f.properties.__helperId==='top'));
      }
      const before=await page.evaluate(()=>JSON.stringify(__drawing.adapter.getFeatures()));await page.mouse.move(hit.x,hit.y);await page.mouse.down();check(!await page.evaluate(()=>__drawing.adapter.getState().dragging),'hole/overlap nonhit');await page.mouse.move(hit.x+20,hit.y+15,{steps:3});await page.mouse.up();check(await page.evaluate(before=>JSON.stringify(__drawing.adapter.getFeatures())===before,before),'nonhit geometry preserved');
    }
    if(!new URL(page.url()).search.includes('immediate')) {
      await setup();await select();check(await page.evaluate(()=>__drawing.adapter.beginEdit()),'explicit session begins');
      const p=await pos(.3,.5);await page.mouse.move(p.x,p.y);await page.mouse.down();await page.mouse.move(p.x+12,p.y+8,{steps:3});await page.mouse.up();
      check(await page.evaluate(()=>__drawing.adapter.getState().editSession.dirty),'session dirty');
      await page.evaluate(()=>{const a=__drawing.adapter;a.rollbackEdit();if(JSON.stringify(a.getFeatures())!==JSON.stringify(__polygonBase))throw Error('session rollback');});
    }
    for(const end of ['Escape','pointercancel','lostpointercapture','mode','import','destroy']) {
      await setup();await select();const p=await pos(.3,.5);await page.mouse.move(p.x,p.y);await page.mouse.down();await page.mouse.move(p.x+15,p.y+10,{steps:3});
      if(end==='Escape')await page.keyboard.press('Escape');else await page.evaluate(end=>{const a=__drawing.adapter;if(end==='mode')a.setMode('pan');else if(end==='import')a.setFeatures(__polygonBase);else if(end==='destroy')a.destroy();else __drawing.map.getCanvas().dispatchEvent(new PointerEvent(end,{pointerId:1,bubbles:true}));},end);
      await page.mouse.up();check(await page.evaluate(()=>!__drawing.adapter.getState().dragging&&JSON.stringify(__drawing.adapter.getFeatures())===JSON.stringify(__polygonBase)),'cancel restore '+end);
      if(end==='destroy'){await page.reload();await page.waitForFunction(()=>window.__drawingReady);await page.locator('#map canvas').scrollIntoViewIfNeeded();}
    }
  }
  check(!errors.length,errors.join(';'));return 'POLYGON_DRAG_OK';
}
