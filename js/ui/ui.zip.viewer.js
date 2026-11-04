import {createModal} from './ui.modal.js';
import {createTree} from './ui.tree.js';

export function createZipViewer(supplied={}) {
 let options={title:'ZIP archive',...supplied},active=false,destroyed=false,revision=0,status='idle',error='',archive=null,tree=null,selected=null,controller=null,operation=null;
 const urls=new Map(),root=document.createElement('section');root.className='ui-zip-viewer';
 const notice=document.createElement('p');notice.setAttribute('aria-live','polite');
 const host=document.createElement('div');host.className='ui-zip-tree';
 const detail=document.createElement('p');detail.className='ui-zip-detail';
 const tools=document.createElement('div');tools.className='ui-zip-tools';
 const button=(label,fn)=>{const b=document.createElement('button');b.type='button';b.className='ui-button';b.textContent=label;b.onclick=fn;return b;};
 const previewButton=button('Preview selected',()=>void act('preview',selected));
 const downloadButton=button('Download selected',()=>void act('download',selected));
 const cancelButton=button('Cancel entry operation',()=>{operation?.abort();operation=null;setStatus('ready','Entry operation cancelled.');});
 const retry=button('Reload archive',()=>void reload());tools.append(previewButton,downloadButton,cancelButton);root.append(notice,retry,host,detail);
 const modal=createModal({title:options.title,content:root,footer:tools,size:'full',className:'ui-zip-modal',closeWhileBusy:true,escapeCloseWhileBusy:true,backdropCloseWhileBusy:true,
  onBeforeClose(){active=false;invalidate();status='closed';return true;},onClose(meta){if(!active)setStatus('closed');options.onClose?.(meta);}});
 function revoke(){for(const [url,timer] of urls){clearTimeout(timer);URL.revokeObjectURL(url);}urls.clear();}
 function invalidate(){revision++;controller?.abort();operation?.abort();controller=null;operation=null;archive?.dispose();archive=null;tree?.destroy();tree=null;selected=null;host.replaceChildren();detail.textContent='';revoke();}
 function canPreview(entry){try{return typeof options.onPreview==='function'&&(typeof options.canPreview!=='function'||options.canPreview({...entry})===true);}catch{return false;}}
 function focusSelected(){if(!active||destroyed)return false;const label=host.querySelector('.is-selected .ui-tree-label');label?.focus({preventScroll:true});return !!label;}
 function setStatus(next,message='') {status=next;error=next==='error'?message:'';notice.textContent=message;notice.hidden=!message;notice.setAttribute('role',error?'alert':'status');const busy=['loading','extracting'].includes(next);modal.setBusy(busy,{message:next==='loading'?'Loading archive...':'Reading selected entry...',cancelBusy:false});const entry=archive?.entries.find(e=>e.id===selected);previewButton.disabled=busy||!entry||entry.directory||!canPreview(entry);downloadButton.disabled=busy||!entry||entry.directory;cancelButton.hidden=next!=='extracting';retry.hidden=next!=='error';}
 function render(){
  const nodes=[],folders=new Map();
  for(const entry of archive.entries){let children=nodes;const parts=entry.path.replace(/\/$/,'').split('/');let path='';for(let i=0;i<parts.length;i++){path+=(path?'/':'')+parts[i];const directory=i<parts.length-1||entry.directory;
   if(directory){let node=folders.get(path);if(!node){node={id:`folder:${path}`,label:parts[i]+'/',children:[]};folders.set(path,node);children.push(node);}children=node.children;}
   else children.push({id:entry.id,label:`${parts[i]} — ${entry.size.toLocaleString()} bytes`});
  }}
  tree=createTree(host,nodes,{expandAll:true,onSelect(node){if(status==='extracting')return;selected=node.id;const entry=archive.entries.find(e=>e.id===selected);detail.textContent=entry?`${entry.path} · ${entry.size.toLocaleString()} bytes (${entry.compressedSize.toLocaleString()} compressed)`:'Folder';setStatus('ready');}});
 }
 function open(patch){if(destroyed)return false;if(patch)update(patch);if(active)return true;active=true;modal.open();void reload();return true;}
 function update(patch={}){if(destroyed)return false;options={...options,...patch};if(Object.hasOwn(patch,'source')&&!Object.hasOwn(patch,'load'))options.load=null;if(Object.hasOwn(patch,'load')&&!Object.hasOwn(patch,'source'))options.source=null;modal.update({title:options.title,ariaLabel:options.title});if(['source','load','context','onPreview','canPreview'].some(k=>Object.hasOwn(patch,k))){invalidate();if(active)void reload();}return true;}
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
   const engine=await import(url.href);if(!current())return false;archive=engine.openZip(data);render();setStatus('ready',`${archive.entries.length} entries. Select a file to preview or download.`);return true;
  }catch(cause){if(!current())return false;setStatus('error',`Unable to open archive. ${cause.message}`);return false;}
 }
 async function act(kind,id){
  if(!active||destroyed||!archive||status==='extracting')return false;
  const entry=archive.entries.find(e=>e.id===String(id));if(!entry||entry.directory||(kind==='preview'&&!canPreview(entry)))return false;
  selected=entry.id;tree?.setSelected(selected);operation?.abort();const own=new AbortController();operation=own;const token=revision,snapshot={...options},current=()=>active&&!destroyed&&revision===token&&operation===own&&!own.signal.aborted;
  setStatus('extracting',`Reading ${entry.path}...`);
  try {
   const blob=await archive.extract(entry.id,{signal:own.signal});if(!current())return false;
   if(kind==='preview'){focusSelected();await snapshot.onPreview({entry:{...entry},blob,signal:own.signal,context:snapshot.context,restoreFocus:()=>current()&&focusSelected()});}
   else {const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=entry.name;a.hidden=true;document.body.append(a);a.click();a.remove();urls.set(url,setTimeout(()=>{URL.revokeObjectURL(url);urls.delete(url);},30000));}
   if(!current())return false;setStatus('ready',`${entry.path} ${kind==='preview'?'sent to preview':'download requested'}.`);return true;
  }catch(cause){if(!current())return false;setStatus('error',`Unable to ${kind} entry. ${cause.message}`);return false;}
 }
 function destroy(){if(destroyed)return;active=false;invalidate();destroyed=true;status='destroyed';modal.destroy();}
 const api={open,update,reload,focusSelected,close:meta=>modal.close(meta),destroy,preview:id=>act('preview',id),download:id=>act('download',id),getState:()=>({open:active,status,error,destroyed,selectedId:selected,entries:archive?.entries.map(e=>({...e}))||[]}),refs:{...modal.refs,tree:host,notice,detail,previewButton,downloadButton,cancelButton,retry}};
 setStatus('idle');if(options.open)open();return api;
}
