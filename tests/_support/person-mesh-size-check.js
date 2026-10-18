async page => {
  await page.bringToFront();
  await page.waitForFunction(()=>window.locationPersonDemo?.person.getState().status==='rendered');
  const result = await page.evaluate(async()=>{
    const {map:previousMap,person,center}=locationPersonDemo;
    const {uiLoader}=await import('/js/ui/ui.loader.js');
    const create=await uiLoader.get('ui.map.location.person');
    person.destroy(); previousMap.remove();
    const map=new maplibregl.Map({container:'map',center,zoom:15,maxPitch:85,antialias:true,preserveDrawingBuffer:true,style:{version:8,sources:{},layers:[{id:'background',type:'background',paint:{'background-color':'#000000'}}]}});
    await new Promise(resolve=>map.once('load',resolve));
    const fixed=create({map,maplibre:maplibregl,lngLat:center,scaleMode:'perspective',minSizePx:34,maxSizePx:34});
    const draw=()=>new Promise(resolve=>{let count=0;const f=()=>{if(++count===1){map.off('render',f);resolve();}else map.triggerRepaint();};map.on('render',f);map.triggerRepaint();});
    const results=[], cases=[]; for(const pitch of [0,45,85])for(const bearing of [0,31,85])for(const heading of [null,0,45,90])for(const zoom of [0,5,12,17,24])cases.push({pitch,bearing,heading,zoom}); for(const depth of [.3,.8])cases.push({pitch:60,bearing:31,heading:45,zoom:17,depth});
    try {
      for(const {pitch,bearing,heading,zoom,depth} of cases){
        map.jumpTo({center,zoom,pitch,bearing});fixed.updateLngLat(depth==null?center:map.unproject([map.getCanvas().clientWidth/2,map.getCanvas().clientHeight*depth]));fixed.updateHeading(heading);await draw();
        const canvas=map.getCanvas(),gl=canvas.getContext('webgl2')||canvas.getContext('webgl'),pixels=new Uint8Array(gl.drawingBufferWidth*gl.drawingBufferHeight*4);gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
        let left=Infinity,right=-1,top=Infinity,bottom=-1;
        for(let i=0;i<pixels.length;i+=4)if(pixels[i]>10||pixels[i+1]>10||pixels[i+2]>10){const index=i/4,x=index%gl.drawingBufferWidth,y=Math.floor(index/gl.drawingBufferWidth);left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
        const painted=Math.max((right-left+1)*canvas.clientWidth/gl.drawingBufferWidth,(bottom-top+1)*canvas.clientHeight/gl.drawingBufferHeight);
        const sample={pitch,bearing,heading,zoom,depth,reported:fixed.getState().projectedSizePx,painted};results.push(sample);
        if(Math.abs(painted-34)>2)throw Error('person mesh size '+JSON.stringify(sample));
      }
      return 'PERSON_MESH_SIZE_OK '+JSON.stringify(results);
    }finally{window.__meshFixed=fixed;window.__meshMap=map;}
  });
  try {
    for(const pitch of [0,45,85]) {
      await page.evaluate(async pitch=>{__meshMap.jumpTo({pitch,bearing:31,zoom:12});__meshFixed.updateHeading(45);await new Promise(resolve=>{__meshMap.once('render',resolve);__meshMap.triggerRepaint();});},pitch);
      await page.locator('#map').screenshot({path:`output/playwright/person-mesh-${page.url().includes('bundle')?'bundle':'source'}-${pitch}.png`});
    }
    return result;
  } finally {await page.evaluate(()=>{__meshFixed.destroy();__meshMap.remove();});}
}