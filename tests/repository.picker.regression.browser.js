const output = document.querySelector('#results');
const assert = (ok,text) => {if(!ok) throw Error(text); output.textContent += `PASS ${text}\n`;};
const tick = (ms=20) => new Promise(resolve=>setTimeout(resolve,ms));
const {uiLoader} = await import(location.search.includes('bundle') ? '../dist/helpers.ui.bundle.min.js' : '../js/ui/ui.loader.js');
let picker, composer;
const escape = () => document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));
const folder = id => ({folder:{id,name:id || 'Root'}, breadcrumbs:id ? [{id:null,name:'Root'},{id,name:id}] : [{id:null,name:'Root'}],
  folders:id ? [] : [{id:'other',name:'Other'}],files:[{id:id || 'root-file',name:id ? 'Other file' : '<script>safe</script>'}],permissions:{canUpload:true}});
try {
  const createPicker = await uiLoader.get('ui.repository.picker');
  const createComposer = await uiLoader.get('ui.chat.composer');
  let resolveRead, aborted=false, reads=0;
  picker=createPicker({loadFolder:({signal})=>{reads++;signal.addEventListener('abort',()=>aborted=true); return new Promise(resolve=>resolveRead=resolve);}});
  const cancelled=picker.pick(); picker.open();
  assert(picker.getState().open && picker.getState().status==='loading' && !picker.refs.closeButton.disabled,'immediate dismissible loading');
  assert(reads===1,'duplicate open does not reload');
  assert(picker.refs.retry.disabled && picker.refs.upload.hidden && picker.refs.confirm.disabled,'loading header and attach controls unavailable');
  await picker.close(); resolveRead(folder(null)); await tick(350);
  assert((await cancelled).length===0 && aborted && picker.getState().selection.length===0,'dismissal aborts and ignores late load'); picker.destroy();
  picker=createPicker({loadFolder:async({folderId})=>folder(folderId),onUpload:async(files,context)=>{
    assert(files[0] instanceof File && context.folderId==='other','upload receives native File and current folder');
    return [{id:'uploaded',name:files[0].name}];
  }});
  const result=picker.pick(); await tick();
  assert(!picker.refs.list.querySelector('script'),'names rendered as text');
  assert(!picker.refs.list.querySelector('input') && picker.refs.list.firstElementChild.querySelector('[data-kind=folder]'),'folder-first rows without checkboxes');
  assert(picker.refs.list.querySelector('[data-kind=folder] [data-icon="files.folder"]') && picker.refs.list.querySelector('[data-kind=file] [data-icon="files.unknown"]'),'canonical folder and fallback file icons');
  picker.refs.list.querySelector('[data-kind=file]').click();
  assert(picker.refs.list.querySelector('[data-kind=file]').getAttribute('aria-pressed')==='true' && picker.refs.list.querySelector('.is-selected'),'row highlight and accessible toggle state');
  assert(!picker.refs.list.querySelector('[data-kind=file] .ui-repository-picker-selected-icon').hasAttribute('hidden'),'selected checkmark is visible');
  picker.refs.list.querySelector('[data-kind=file]').click();
  assert(picker.refs.list.querySelector('[data-kind=file]').getAttribute('aria-pressed')==='false' && picker.refs.list.querySelector('[data-kind=file] .ui-repository-picker-selected-icon').hasAttribute('hidden'),'row click toggles off and hides checkmark');
  picker.refs.list.querySelector('[data-kind=file]').click();
  picker.refs.list.querySelector('button').click(); await tick();
  picker.refs.list.querySelector('[data-kind=file]').click();
  assert(picker.getState().selection.length===2,'selection persists across folders');
  assert(!picker.refs.body.querySelector('.ui-repository-picker-tools, .ui-repository-picker-selection') && !picker.refs.panel.textContent.includes('Clear selection'),'no body action row or selection summary');
  for (const [node,label,icon] of [[picker.refs.retry,'Reload folder','actions.refresh'],[picker.refs.upload,'Upload files','data.upload']]) {
    assert(picker.refs.headerActions.contains(node) && !picker.refs.body.contains(node) && node.textContent==='' && node.getAttribute('aria-label')===label && node.title===label && node.querySelector(`[data-icon="${icon}"]`),'accessible icon-only header action: '+label);
    assert(getComputedStyle(node).borderTopWidth==='0px','borderless header action: '+label);
  }
  picker.refs.list.querySelector('[data-kind=file]').focus(); escape(); await tick();
  assert(picker.getState().open && !picker.getState().selection.length && picker.refs.confirm.disabled && document.activeElement.dataset.kind==='file','first ready Escape clears cross-folder selection and preserves row focus');
  await picker.navigate(null); picker.refs.list.querySelector('[data-kind=file]').click();
  await picker.navigate('other'); picker.refs.list.querySelector('[data-kind=file]').click();
  assert(picker.refs.breadcrumbs.querySelector('button')?.textContent==='Root' && picker.refs.breadcrumbs.querySelector('[aria-current=page]')?.textContent==='other','canonical ancestor and current breadcrumbs');
  picker.refs.breadcrumbs.querySelector('button').click(); await tick();
  assert(picker.getState().folderId===null,'ancestor breadcrumb navigates');
  await picker.navigate('other');
  await picker.uploadFiles([new File(['hi'],'new.txt')]);
  assert(picker.refs.list.textContent.includes('new.txt'),'uploaded canonical records appear for selection');
  picker.refs.list.querySelector('[data-id="string:uploaded"]').click(); picker.refs.confirm.click(); await tick(350);
  assert((await result).length===3,'confirmation returns cross-folder canonical files');
  picker.update({loadFolder:async({folderId})=>({...folder(folderId),permissions:{showUpload:true,canUpload:false}})});
  picker.open(); await tick(); assert(!picker.refs.upload.hidden && picker.refs.upload.disabled,'upload permission can show disabled control');
  assert(await picker.uploadFiles([new File(['x'],'x')])===false,'upload callback protected by presentation permission');
  picker.update({loadFolder:async({folderId})=>({...folder(folderId),permissions:{showUpload:false,canUpload:false}})}); await tick();
  assert(picker.refs.upload.hidden && picker.refs.upload.disabled,'upload permission can hide header control');
  let resolveStale;
  picker.update({context:'old',loadFolder:()=>new Promise(resolve=>resolveStale=resolve)});
  picker.update({context:'new',folderId:'new',loadFolder:async({folderId})=>folder(folderId)}); await tick();
  resolveStale(folder('other')); await tick();
  assert(picker.getState().folderId==='new' && picker.getState().selection.length===0,'context switch clears selection and ignores stale read');
  let attempts=0;
  picker.update({onUpload:async()=>{attempts++;throw Error('Connection lost');}}); await tick();
  await picker.uploadFiles([new File(['x'],'x')]);
  assert(picker.getState().status==='upload-error' && !picker.refs.cancel.disabled && picker.refs.upload.disabled,'uncertain upload stays dismissible without replay');
  await picker.reload(); assert(attempts===1,'reload does not replay upload');
  picker.update({loadFolder:async()=>{throw Error('Access denied');}}); await tick();
  assert(picker.getState().status==='error' && !picker.refs.retry.disabled && picker.refs.confirm.disabled,'read failure has actionable retry with selection disabled');
  picker.destroy();
  picker=createPicker({loadFolder:async()=>({...folder(null),folders:[{id:'z',name:'Zulu'},{id:'a',name:'Alpha'}],files:[{id:'pdf',name:'Z.pdf'},{id:'csv',name:'A.csv'},{id:'json',name:'B.json'}]})});
  picker.open(); await tick();
  assert([...picker.refs.list.querySelectorAll('.ui-repository-picker-name')].map(node=>node.textContent).join('|')==='Alpha|Zulu|A.csv|B.json|Z.pdf','folder-first ordering sorts names within each group');
  assert(['files.csv','files.json','files.pdf'].every(name=>picker.refs.list.querySelector(`[data-icon="${name}"]`)),'file type icons use canonical resolver');
  assert([...picker.refs.list.querySelectorAll('[data-kind=file]')].every(node=>node.tagName==='BUTTON' && node.type==='button'),'file rows retain native Enter/Space button semantics');
  picker.destroy();
  let resolveUpload, uploadAborted=false;
  picker=createPicker({multiple:false,loadFolder:async({folderId})=>folder(folderId),onUpload:(_files,{signal})=>{
    signal.addEventListener('abort',()=>uploadAborted=true); return new Promise(resolve=>resolveUpload=resolve);
  }});
  const external=new AbortController(), pending=picker.pick({signal:external.signal}); await tick();
  picker.refs.list.querySelector('[data-kind=file]').click(); await picker.navigate('other'); picker.refs.list.querySelector('[data-kind=file]').click();
  assert(picker.getState().selection.length===1 && picker.getState().selection[0].id==='other','single mode replaces prior cross-folder selection');
  escape(); await tick(); assert(picker.getState().open && picker.getState().selection.length===0 && picker.refs.confirm.disabled,'Escape clears single selection without closing');
  const uploadPending=picker.uploadFiles([new File(['x'],'late.txt')]); external.abort();
  resolveUpload([{id:'late',name:'late.txt'}]); await uploadPending; await tick(350);
  assert(uploadAborted && (await pending).length===0 && !picker.getState().open && !picker.refs.list.textContent.includes('late.txt'),'external cancellation ignores late upload results');
  picker.destroy();
  for (const action of ['escape','closeButton','cancel']) {
    picker=createPicker({loadFolder:async({folderId})=>folder(folderId)});
    const completion=picker.pick(); await tick(); picker.refs.list.querySelector('[data-kind=file]').click();
    if (action==='escape') {
      picker.refs.confirm.focus(); escape(); await tick();
      assert(picker.getState().open && !picker.refs.confirm.contains(document.activeElement),'Escape moves focus off newly disabled Attach');
      escape();
    } else picker.refs[action].click();
    await tick(350); assert(!picker.getState().open && (await completion).length===0,action+' dismisses with expected selection behavior'); picker.destroy();
  }
  let completeBusy, busyAborted=false;
  picker=createPicker({loadFolder:({folderId,signal})=>folderId===null ? folder(null) : new Promise(resolve=>{
    completeBusy=resolve; signal.addEventListener('abort',()=>busyAborted=true);
  })});
  const busyCompletion=picker.pick(); await tick(); picker.refs.list.querySelector('[data-kind=file]').click();
  const busyRead=picker.navigate('other'); escape(); await tick(); completeBusy(folder('other')); await busyRead; await tick(350);
  assert(busyAborted && !picker.getState().open && (await busyCompletion).length===0,'busy Escape dismisses immediately despite retained selection and ignores late read'); picker.destroy();
  const host=document.querySelector('#composer'); let legacy=0, unified=[];
  composer=createComposer(host,{}, {onFilesSelected:files=>legacy+=files.length,onAttachmentsSelected:(records,meta)=>unified.push({records,meta})});
  const paste=new Event('paste',{bubbles:true,cancelable:true}); Object.defineProperty(paste,'clipboardData',{value:{files:[new File(['a'],'a.txt')]}}); host.firstChild.dispatchEvent(paste);
  assert(legacy===1 && unified[0].meta.kind==='native' && unified[0].meta.source==='paste','legacy native paste and unified callback both work');
  let resolveCustom, customCalls=0, customAbort=false;
  composer.update({}, {attachmentAdapter:{mode:'custom',open:({signal})=>{customCalls++; signal.addEventListener('abort',()=>customAbort=true);return new Promise(resolve=>resolveCustom=resolve);}}});
  host.querySelector('.ui-chat-composer-attach').click(); host.querySelector('.ui-chat-composer-attach').click();
  assert(customCalls===1 && !host.querySelector('input[type=file]'),'custom picker replaces native input and prevents duplicate opens');
  resolveCustom([{id:1,name:'Canonical'}]); await tick();
  assert(legacy===1 && unified[1].meta.kind==='repository','repository attachment reaches unified callback only');
  host.querySelector('.ui-chat-composer-attach').click(); composer.update({}, {attachmentAdapter:'none'}); resolveCustom([{id:2,name:'stale'}]); await tick();
  assert(customAbort && unified.length===2 && !host.querySelector('.ui-chat-composer-attach'),'none and context update cancel stale adapter results');
  host.firstChild.dispatchEvent(paste); assert(legacy===1,'none does not intercept native attachments');
  composer.update({}, {attachmentAdapter:{mode:'custom',open:async()=>{throw Error('Picker unavailable');}}});
  host.querySelector('.ui-chat-composer-attach').click(); await tick();
  assert(host.querySelector('[role=alert]')?.textContent.includes('Picker unavailable') && !host.querySelector('.ui-chat-composer-attach').disabled,'custom rejection is visible and recoverable');
  composer.destroy(); document.body.dataset.status='pass';
} catch(error) {output.textContent+=`FAIL ${error.stack}`;document.body.dataset.status='fail';}
finally {picker?.destroy();composer?.destroy();}
