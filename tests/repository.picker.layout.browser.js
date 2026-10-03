const output = document.querySelector('#results');
const assert = (ok,text) => {if(!ok) throw Error(text); output.textContent += `PASS ${text}\n`;};
const tick = () => new Promise(resolve=>setTimeout(resolve,250));
const bundled = new URL(import.meta.url).searchParams.has('bundle');
const {uiLoader} = await import(bundled ? '../dist/helpers.ui.bundle.min.js' : '../js/ui/ui.loader.js');
let picker;
const listing = count => ({folder:{id:null,name:'Files'},breadcrumbs:[{id:null,name:'Files'}],folders:[],
  files:Array.from({length:count},(_,i)=>({id:i,name:`Document ${i+1}.pdf`})),permissions:{canUpload:true}});
try {
  const createPicker=await uiLoader.get('ui.repository.picker');
  picker=createPicker({loadFolder:async()=>listing(6),onUpload:async()=>[]}); picker.open(); await tick();
  const {list,body,panel,header,footer}=picker.refs;
  const mobile=innerWidth<=640;
  assert(innerHeight===667 && (innerWidth===375 || innerWidth===1024),'exact layout fixture viewport');
  if(mobile) {
    assert(getComputedStyle(list).maxHeight==='none' && getComputedStyle(list).overflowY==='visible','mobile list delegates scrolling to modal body');
    assert(list.scrollHeight<=list.clientHeight+1 && body.scrollHeight<=body.clientHeight+1,'six mobile rows fit without vertical overflow');
    assert(body.scrollWidth<=body.clientWidth && list.scrollWidth<=list.clientWidth,'no horizontal overflow');
    assert(getComputedStyle(body).scrollbarGutter==='auto' && getComputedStyle(list).scrollbarGutter==='auto','short content reserves no scrollbar gutter');
  } else assert(getComputedStyle(list).maxHeight!=='none' && getComputedStyle(list).overflowY==='auto','desktop list cap preserved');
  picker.update({loadFolder:async()=>listing(40)}); await tick();
  const beforeHeader=header.getBoundingClientRect().top, beforeFooter=footer.getBoundingClientRect().top;
  const scroller=mobile?body:list;
  assert(scroller.scrollHeight>scroller.clientHeight,'long folder overflows the intended region');
  if(mobile) assert(list.scrollHeight<=list.clientHeight+1 && panel.scrollHeight<=panel.clientHeight+1,'long mobile folder has only one scroll owner');
  scroller.scrollTop=scroller.scrollHeight; await tick();
  assert(scroller.scrollTop>0 && Math.abs(header.getBoundingClientRect().top-beforeHeader)<1 && Math.abs(footer.getBoundingClientRect().top-beforeFooter)<1,'scrolling leaves header/footer fixed');
  assert(footer.getBoundingClientRect().bottom<=innerHeight+1 && list.lastElementChild.getBoundingClientRect().bottom<=footer.getBoundingClientRect().top+1,'last row and footer reachable');
  picker.destroy();
  const host=document.createElement('div'); host.style.width='100%'; document.body.append(host);
  const createComposer=await uiLoader.get('ui.chat.composer');
  const composer=createComposer(host,{}, {attachmentPlacement:'helper',attachmentLabel:'Attach files',helperText:'Enter sends. Shift+Enter adds a new line. '+ 'long-helper-text'.repeat(12)});
  const action=composer.refs.attach, metadata=composer.refs.metadata;
  assert(getComputedStyle(action).borderTopWidth==='0px' && getComputedStyle(action).fontSize===getComputedStyle(composer.refs.helper).fontSize,'helper action borderless with helper typography');
  assert(action.getBoundingClientRect().height>=36 && metadata.getBoundingClientRect().top>=composer.refs.input.getBoundingClientRect().bottom,'helper action has touch target below input');
  assert(host.scrollWidth<=host.clientWidth && metadata.scrollWidth<=metadata.clientWidth,'helper row wraps long text without horizontal overflow');
  assert(action.querySelector('[data-icon="actions.attach"]') && action.textContent==='Attach files','responsive helper row keeps icon and visible label');
  if(!mobile) assert(composer.refs.helper.getBoundingClientRect().left>action.getBoundingClientRect().right,'wide helper text sits beside attachment');
  composer.destroy(); host.remove();
  document.body.dataset.status='pass';
} catch(error) {output.textContent+=`FAIL ${error.stack}`;document.body.dataset.status='fail';}
finally {picker?.destroy();}
