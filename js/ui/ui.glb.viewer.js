import { createModal } from './ui.modal.js';
import { prepareGlb } from './ui.glb.data.js?v=0.21.327';

export function createGlbViewer(supplied = {}) {
  let options = {title:'3D model',maxBytes:64*1024*1024,...supplied};
  let controller, runtime, revision=0, destroyed=false, active=false, status='idle', error='';
  const root=document.createElement('section');root.className='ui-glb-viewer';
  const notice=document.createElement('p');notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');
  const host=document.createElement('div');host.className='ui-glb-viewport';
  const help=document.createElement('p');help.textContent='Drag to orbit. Right-drag to pan. Scroll or pinch to zoom. Focus the model: arrows orbit, Shift + arrows pan, + / - zoom, Home resets.';
  const retry=document.createElement('button');retry.type='button';retry.className='ui-button';retry.textContent='Retry loading model';retry.addEventListener('click',()=>void reload());
  const toolbar=document.createElement('div');toolbar.className='ui-glb-tools';toolbar.setAttribute('aria-label','Model view controls');
  const buttons=[];
  for (const [label,action] of [['Fit','fit'],['Reset','reset'],['Orbit left','orbitLeft'],['Orbit right','orbitRight'],['Orbit up','orbitUp'],['Orbit down','orbitDown'],['Pan left','panLeft'],['Pan right','panRight'],['Pan up','panUp'],['Pan down','panDown'],['Zoom in','zoomIn'],['Zoom out','zoomOut']]) {
    const button=document.createElement('button');button.type='button';button.className='ui-button ui-button-borderless';button.textContent=label;button.addEventListener('click',()=>{if(action==='fit')runtime?.fit();else if(action==='reset')runtime?.reset();else runtime?.action(action);});toolbar.append(button);buttons.push(button);
  }
  const wireframeButton=document.createElement('button');wireframeButton.type='button';wireframeButton.className='ui-button ui-button-borderless';wireframeButton.textContent='Wireframe';wireframeButton.setAttribute('aria-pressed','false');wireframeButton.addEventListener('click',()=>setWireframe(!runtime?.getState().wireframe));toolbar.prepend(wireframeButton);buttons.push(wireframeButton);
  root.append(notice,retry,host,help);
  const modal=createModal({title:options.title,content:root,footer:toolbar,size:'full',className:'ui-glb-modal',closeWhileBusy:true,escapeCloseWhileBusy:true,backdropCloseWhileBusy:true,
    onBeforeClose(){active=false;invalidate();status='closed';return true;},
    onClose(meta){setStatus('closed');options.onClose?.(meta);}});
  function invalidate(){revision++;controller?.abort();controller=null;runtime?.dispose();runtime=null;host.replaceChildren();wireframeButton.setAttribute('aria-pressed','false');}
  function setStatus(next,message=''){status=next;error=next==='error'?message:'';notice.textContent=message;notice.hidden=!message;notice.setAttribute('role',error?'alert':'status');retry.hidden=next!=='error';modal.setBusy(next==='loading',{message:'Loading 3D model...',cancelBusy:false});buttons.forEach(button=>button.disabled=next!=='ready');}
  function setWireframe(value){if(status!=='ready'||!runtime)return false;const enabled=runtime.setWireframe(value);wireframeButton.setAttribute('aria-pressed',String(enabled));return enabled;}
  function open(patch){if(destroyed)return false;if(patch)update(patch);if(active)return true;active=true;modal.open();void reload();return true;}
  function update(patch={}){if(destroyed)return false;options={...options,...patch};if(Object.hasOwn(patch,'source')&&!Object.hasOwn(patch,'load'))options.load=null;if(Object.hasOwn(patch,'load')&&!Object.hasOwn(patch,'source'))options.source=null;modal.update({title:options.title,ariaLabel:options.title});if(['source','load','context','maxBytes'].some(key=>Object.hasOwn(patch,key))){invalidate();if(active)void reload();}return true;}
  async function reload(){
    if(!active||destroyed)return false;invalidate();controller=new AbortController();const signal=controller.signal,token=revision,snapshot={...options};const current=()=>active&&!destroyed&&token===revision&&!signal.aborted;
    setStatus('loading','Loading 3D model...');
    try {
      if(!Number.isSafeInteger(snapshot.maxBytes)||snapshot.maxBytes<20)throw new Error('Set maxBytes to a positive file-size limit of at least 20 bytes.');
      if(snapshot.source!=null&&snapshot.load!=null)throw new Error('Choose either source or load for this preview.');
      let data=typeof snapshot.load==='function'?await snapshot.load({signal,context:snapshot.context}):snapshot.source;
      if(!current())return false;
      if(data instanceof Blob){if(data.size>snapshot.maxBytes)throw new Error('Model exceeds the preview size limit. Export a smaller GLB.');data=await data.arrayBuffer();}
      if(!current())return false;const prepared=prepareGlb(data,snapshot.maxBytes);
      // Resolve relative to this deployed module in source and main-bundle modes.
      const bundled=new URL(import.meta.url).pathname.endsWith('/helpers.ui.bundle.min.js');
      const url=new URL(bundled?'../vendor/three/glb.runtime.js?v=0.21.328':'../../vendor/three/glb.runtime.js?v=0.21.328',import.meta.url);
      const engine=await import(url.href);if(!current())return false;
      const mounted=await engine.mountGlb(host,prepared.bytes,signal);
      if(!current()){mounted.dispose();return false;}runtime=mounted;setStatus('ready',prepared.skippedExtensions.length ? `Showing standard fallback. Skipped optional features: ${prepared.skippedExtensions.join(', ')}.` : '');return true;
    }catch(cause){if(!current())return false;runtime?.dispose();runtime=null;host.replaceChildren();setStatus('error',`Unable to preview model. ${cause?.message||'Check the GLB file and retry.'}`);return false;}
  }
  function destroy(){if(destroyed)return;active=false;invalidate();destroyed=true;status='destroyed';modal.destroy();}
  const api={open,update,reload,close:meta=>modal.close(meta),destroy,setWireframe,fit:()=>runtime?.fit(),reset:()=>runtime?.reset(),getState:()=>({open:active,status,error,destroyed,view:runtime?.getState()||null}),refs:{...modal.refs,viewport:host,notice,retry,wireframeButton,controls:toolbar}};
  setStatus('idle');if(options.open)open();return api;
}
