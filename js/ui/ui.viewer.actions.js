import {createIcon} from './ui.icons.js';

// Shared viewer chrome; transport, canonical URLs and authorization stay with
// the host. Never derive a permanent URL from a blob or a ZIP entry.
export function createViewerHeaderActions() {
  const element=document.createElement('div');element.className='ui-viewer-header-actions';
  Object.assign(element.style,{display:'none',alignItems:'center',gap:'4px',flexShrink:'0',position:'relative'});
  let controller=new AbortController(),generation=0,buttons=[];
  function cancel(){generation++;controller.abort();controller=new AbortController();for(const {button,disabled} of buttons){button.disabled=disabled;button.removeAttribute('aria-busy');}}
  function update(source,context={}) {
    const actions=(typeof source==='function'?source(context):source)||[];
    if(!Array.isArray(actions))throw new TypeError('headerActions must be an array or a function returning an array.');
    const order=a=>a.id==='copy-url'?1:a.id==='download'?2:0;
    const normalized=actions.filter(a=>a&&a.hidden!==true&&typeof a.onClick==='function').map(a=>({...a,label:a.label||(a.id==='copy-url'?'Copy URL':a.id==='download'?'Download':'')})).sort((a,b)=>order(a)-order(b));
    if(normalized.some(a=>!a.label))throw new TypeError('Every header action needs an accessible label.');
    const focused=document.activeElement?.dataset?.viewerAction;
    cancel();buttons=[];element.replaceChildren();element.style.display=normalized.length?'flex':'none';
    const feedback=document.createElement('span');feedback.setAttribute('role','alert');feedback.hidden=true;
    Object.assign(feedback.style,{position:'absolute',right:'0',top:'100%',width:'min(240px,70vw)',padding:'8px',background:'var(--ui-bg, #0d1523)',color:'var(--ui-text, #d7e0f4)',zIndex:'2',overflowWrap:'anywhere'});
    for(const action of normalized){
      const button=document.createElement('button');button.type='button';button.className='ui-button ui-button-borderless ui-button-icon';button.dataset.viewerAction=String(action.id||action.label);button.title=action.label;button.setAttribute('aria-label',action.label);
      Object.assign(button.style,{width:'32px',height:'32px',minWidth:'32px',padding:'6px'});
      button.append(createIcon(action.icon||(action.id==='download'?'actions.download':'actions.copy')));
      button.disabled=Boolean(action.disabled);buttons.push({button,disabled:button.disabled});
      button.addEventListener('click',async event=>{
        if(button.disabled)return;const token=generation,signal=controller.signal;
        feedback.hidden=true;button.disabled=true;button.setAttribute('aria-busy','true');
        try{await action.onClick({...context,event,signal});}
        catch(error){if(token===generation&&!signal.aborted){feedback.textContent=`${action.label} failed. ${error?.message||'Try again.'}`;feedback.hidden=false;}}
        finally{if(token===generation&&!signal.aborted){button.disabled=Boolean(action.disabled);button.removeAttribute('aria-busy');}}
      });element.append(button);
    }
    element.append(feedback);
    if(focused)buttons.find(x=>x.button.dataset.viewerAction===focused&&!x.button.disabled)?.button.focus({preventScroll:true});
  }
  return {element,update,cancel,destroy(){cancel();element.remove();buttons=[];}};
}
