async page => {
  await page.waitForFunction(()=>window.__scaleDemo);
  for(const width of [1200,375]) {
    await page.setViewportSize({width,height:800});
    await page.evaluate(()=>__scaleDemo.map.resize());
    for(const pitch of [0,50]) {
      await page.evaluate(pitch=>__scaleDemo.map.jumpTo({center:[123.8854,10.3157],zoom:12,pitch,bearing:31}),pitch);
      await page.evaluate(()=>{
        const {map,scale,create}=__scaleDemo,el=scale.getElement();
        if(!/\d.*(?:m|km)/.test(el.textContent)||!el.getAttribute('aria-label').includes('halfway'))throw Error('distance/accessibility');
        const before=el.textContent;map.jumpTo({zoom:5});if(el.textContent===before||!el.textContent.includes('km'))throw Error('zoom kilometres');
        map.jumpTo({zoom:18});if(!/\d.*\bm\b/.test(el.textContent))throw Error('zoom metres');
        const equator=el.textContent;map.jumpTo({center:[123,65]});if(el.textContent===equator)throw Error('latitude refresh');
        map.jumpTo({center:[123.8854,10.3157],zoom:12});
        const box=el.getBoundingClientRect(),container=map.getContainer().getBoundingClientRect();
        if(box.left<container.left||box.bottom>container.bottom||box.width>102||box.width<=0)throw Error('lower-left bounds');
        try{create({map});throw Error('duplicate allowed');}catch(e){if(e.message==='duplicate allowed')throw e;}
        const y=box.bottom;scale.update({offset:64});if(Math.abs(el.getBoundingClientRect().bottom-(y-64))>1)throw Error('overlay clearance');
        try{scale.update({offset:-1});throw Error('invalid allowed');}catch(e){if(e.message==='invalid allowed')throw e;}
        if(el.style.getPropertyValue('--ui-map-scale-offset')!=='64px')throw Error('invalid mutated');
        scale.update({offset:0});
      });
      let darkColor;
      for(const theme of ['dark','light']) {
        await page.evaluate(theme=>document.querySelector('#map').setAttribute('data-theme',theme),theme);
        const colors=await page.locator('.ui-map-scale').evaluate(el=>({color:getComputedStyle(el).color,bg:getComputedStyle(el).backgroundColor}));
        if(colors.color===colors.bg)throw Error('theme contrast');
        if(theme==='dark')darkColor=colors.color;else if(colors.color===darkColor)throw Error('light theme not applied');
        await page.screenshot({path:`output/playwright/map-scale-${new URL(page.url()).search.includes('bundle')?'bundle':'source'}-${width}-${pitch}-${theme}.png`});
      }
    }
  }
  await page.evaluate(()=>{
    const {map,scale,create}=__scaleDemo,original=map.unproject.bind(map);let calls=0;
    map.unproject=(...args)=>{calls++;return original(...args);};map.fire('resize');if(calls<2)throw Error('resize did not refresh native scale');
    scale.destroy();scale.destroy();calls=0;map.fire('move');map.fire('resize');if(calls!==0||document.querySelector('.ui-map-scale')||scale.getSize().height!==0)throw Error('teardown listeners/DOM');
    const next=create({map});map.remove();if(next.getElement()!==null)throw Error('map removal cleanup');next.destroy();
  });
  return 'MAP_SCALE_OK';
}
