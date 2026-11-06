import {createViewerHeaderActions} from './ui.viewer.actions.js';
import {createModal} from './ui.modal.js';
import {createGrid} from './ui.grid.js';
import {createIcon} from './ui.icons.js';

export function createZipViewer(supplied={}) {
 let options={title:'ZIP archive',...supplied},active=false,destroyed=false,revision=0,status='idle',error='',archive=null,grid=null,selected=null,controller=null,operation=null;
 const urls=new Map(),root=document.createElement('section');root.className='ui-zip-viewer';
 const notice=document.createElement('p');notice.setAttribute('aria-live','polite');
 const host=document.createElement('div');host.className='ui-zip-grid';
 const detail=document.createElement('p');detail.className='ui-zip-detail';
 const tools=document.createElement('div');tools.className='ui-zip-tools';
 const button=(label,fn)=>{const b=document.createElement('button');b.type='button';b.className='ui-button';b.textContent=label;b.onclick=fn;return b;};
 const cancelButton=button('Cancel entry operation',()=>{operation?.abort();operation=null;setStatus('ready','Entry operation cancelled.');});
 const retry=button('Reload archive',()=>void reload());tools.append(cancelButton);root.append(notice,retry,host,detail);
 const headerActions=createViewerHeaderActions();
 headerActions.update(options.headerActions,{context:options.context});
 const modal=createModal({title:options.title,content:root,headerActions:headerActions.element,headerActionsWhileBusy:true,footer:tools,size:'full',className:'ui-zip-modal',closeWhileBusy:true,escapeCloseWhileBusy:true,backdropCloseWhileBusy:true,
  onBeforeClose(){active=false;invalidate();status='closed';return true;},onClose(meta){if(!active)setStatus('closed');options.onClose?.(meta);}});
 function revoke(){for(const [url,timer] of urls){clearTimeout(timer);URL.revokeObjectURL(url);}urls.clear();}
 function invalidate(){headerActions.cancel();revision++;controller?.abort();operation?.abort();controller=null;operation=null;archive?.dispose();archive=null;grid?.destroy();grid=null;selected=null;host.replaceChildren();detail.textContent='';revoke();}
 function canPreview(entry){try{return typeof options.onPreview==='function'&&(typeof options.canPreview!=='function'||options.canPreview({...entry})===true);}catch{return false;}}
 function focusSelected(){if(!active||destroyed)return false;const label=[...host.querySelectorAll('[data-zip-preview]')].find(node=>node.dataset.zipPreview===selected);label?.focus({preventScroll:true});return !!label;}
 function setStatus(next,message='') {status=next;error=next==='error'?message:'';notice.textContent=message;notice.hidden=!message;notice.setAttribute('role',error?'alert':'status');const busy=['loading','extracting'].includes(next);modal.setBusy(busy,{message:next==='loading'?'Loading archive...':'Reading selected entry...',cancelBusy:false});host.querySelectorAll('[data-zip-preview]').forEach(node=>node.setAttribute('aria-disabled',String(busy)));host.querySelectorAll('[data-zip-download]').forEach(node=>node.disabled=busy);cancelButton.hidden=next!=='extracting';retry.hidden=next!=='error';}
 function sizeLabel(bytes){const units=['B','KB','MB','GB'];let unit=0;while(bytes>=1024&&unit<units.length-1){bytes/=1024;unit++;}return `${unit?Number(bytes.toFixed(1)):bytes} ${units[unit]}`;}
 function render(){
  const rows=archive.entries.filter(entry=>!entry.directory).map(entry=>({...entry,folder:entry.path.includes('/')?entry.path.slice(0,entry.path.lastIndexOf('/')):'(root)'}));
  grid=createGrid(host,rows,{enableSort:false,enableSearch:false,enablePagination:false,emptyText:'No files in this archive.',columns:[
   {key:'name',label:'Filename',width:'36%',renderCell:({row})=>{if(!canPreview(row)){const label=document.createElement('span');label.textContent=row.name;return label;}const name=button(row.name,()=>void act('preview',row.id));name.className='ui-button ui-button-borderless ui-zip-filename';name.dataset.zipPreview=row.id;name.title=`Preview ${row.path}`;return name;}},
   {key:'folder',label:'Folder',width:'30%'},
   {key:'size',label:'Size',width:'16%',renderCell:({value})=>sizeLabel(value)},
   {key:'actions',label:'Actions',width:'18%',renderCell:({row})=>{const download=button('',()=>void act('download',row.id));download.className='ui-button ui-button-borderless';download.dataset.zipDownload=row.id;download.setAttribute('aria-label',`Download ${row.path}`);download.title=`Download ${row.path}`;download.append(createIcon('actions.download'));return download;}}
  ]});
 }
 function open(patch){if(destroyed)return false;if(patch)update(patch);if(active)return true;active=true;modal.open();void reload();return true;}
 function update(patch={}){if(destroyed)return false;options={...options,...patch};if(Object.hasOwn(patch,'source')&&!Object.hasOwn(patch,'load'))options.load=null;if(Object.hasOwn(patch,'load')&&!Object.hasOwn(patch,'source'))options.source=null;headerActions.update(options.headerActions,{context:options.context});modal.update({title:options.title,ariaLabel:options.title});if(['source','load','context','onPreview','canPreview'].some(k=>Object.hasOwn(patch,k))){invalidate();if(active)void reload();}return true;}
 async function reload(){
  if(!active||destroyed)return false;invalidate();controller=new AbortController();const signal=controller.signal,token=revision,snapshot={...options},current=()=>active&&!destroyed&&revision===token&&!signal.aborted;
  setStatus('loading','Loading archive directory...');
  try {
   if(snapshot.source!=null&&snapshot.load!=null)throw Error('Choose either source or load.');
   let data=typeof snapshot.load==='function'?await snapshot.load({signal,context:snapshot.context}):snapshot.source;if(!current())return false;
   if(data instanceof Blob){if(data.size>64*1024*1024)throw Error('Archive exceeds the 64 MiB limit.');data=await data.arrayBuffer();}
   if(!current())return false;if(!(data instanceof ArrayBuffer)||data.byteLength>64*1024*1024)throw Error('Choose a ZIP Blob or ArrayBuffer no larger than 64 MiB.');
   const bundled=new URL(import.meta.url).pathname.endsWith('/helpers.ui.bundle.min.js');
   const url=new URL(bundled?'../js/ui/ui.zip.runtime.js?v=0.21.324':'./ui.zip.runtime.js?v=0.21.324',import.meta.url);
   const engine=await import(url.href);if(!current())return false;archive=engine.openZip(data);render();setStatus('ready',`${archive.entries.length} entries. Open a filename to preview or use its download action.`);return true;
  }catch(cause){if(!current())return false;setStatus('error',`Unable to open archive. ${cause.message}`);return false;}
 }
 async function act(kind,id){
  if(!active||destroyed||!archive||status==='extracting')return false;
  const entry=archive.entries.find(e=>e.id===String(id));if(!entry||entry.directory||(kind==='preview'&&!canPreview(entry)))return false;
  selected=entry.id;operation?.abort();const own=new AbortController();operation=own;const token=revision,snapshot={...options},current=()=>active&&!destroyed&&revision===token&&operation===own&&!own.signal.aborted;
  setStatus('extracting',`Reading ${entry.path}...`);
  try {
   const blob=await archive.extract(entry.id,{signal:own.signal});if(!current())return false;
   if(kind==='preview'){focusSelected();await snapshot.onPreview({entry:{...entry},blob,signal:own.signal,context:snapshot.context,restoreFocus:()=>current()&&focusSelected()});}
   else {const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=entry.name;a.hidden=true;document.body.append(a);a.click();a.remove();urls.set(url,setTimeout(()=>{URL.revokeObjectURL(url);urls.delete(url);},30000));}
   if(!current())return false;setStatus('ready',`${entry.path} ${kind==='preview'?'sent to preview':'download requested'}.`);return true;
  }catch(cause){if(!current())return false;setStatus('error',`Unable to ${kind} entry. ${cause.message}`);return false;}
 }
 function destroy(){if(destroyed)return;active=false;invalidate();destroyed=true;status='destroyed';headerActions.destroy();modal.destroy();}
 const api={open,update,reload,focusSelected,close:meta=>modal.close(meta),destroy,preview:id=>act('preview',id),download:id=>act('download',id),getState:()=>({open:active,status,error,destroyed,selectedId:selected,entries:archive?.entries.map(e=>({...e}))||[]}),refs:{...modal.refs,grid:host,notice,detail,cancelButton,retry}};
 setStatus('idle');if(options.open)open();return api;
}

