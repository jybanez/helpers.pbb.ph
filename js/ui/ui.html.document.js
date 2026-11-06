import {createDocumentImageScope} from './ui.document.images.js';

const allowed=new Set('p div span section article header footer main h1 h2 h3 h4 h5 h6 br hr strong b em i u s small sub sup pre code blockquote ul ol li table thead tbody tfoot tr th td caption figure figcaption img'.split(' '));
const discard=new Set('script style link meta base iframe frame frameset object embed form input button textarea select option svg math template audio video source picture canvas noscript'.split(' '));
const lengths=/^(?:0|\d{1,4}(?:\.\d{1,2})?(?:px|em|rem|%))(?:\s+(?:0|\d{1,4}(?:\.\d{1,2})?(?:px|em|rem|%))){0,3}$/;
const colors=/^(?:#[a-f\d]{3,8}|black|white|gray|red|green|blue|transparent|inherit)$/i;
const keywords={display:/^(block|inline|inline-block|flex|grid|none)$/, 'flex-direction':/^(row|column)$/, 'flex-wrap':/^(wrap|nowrap)$/, 'justify-content':/^(start|end|center|space-between|space-around)$/, 'align-items':/^(start|end|center|stretch)$/, 'text-align':/^(left|right|center|justify)$/, 'font-weight':/^(normal|bold|[1-9]00)$/, 'font-style':/^(normal|italic)$/, 'white-space':/^(normal|pre|pre-wrap)$/, 'object-fit':/^(contain|cover)$/};
function copyStyle(source,target) {
  for(const declaration of String(source||'').slice(0,2048).split(';')){
    const pair=declaration.split(':');if(pair.length!==2)continue;
    const name=pair[0].trim().toLowerCase(),value=pair[1].trim().toLowerCase();
    const rule=keywords[name] || (['width','height','max-width','max-height','padding','margin','gap','font-size','border-radius'].includes(name)?lengths:null) || (['color','background-color','border-color'].includes(name)?colors:null);
    if(rule?.test(value))target.style.setProperty(name,value);
    if(name==='grid-template-columns'&&/^[1-4]fr(?: [1-4]fr){0,3}$/.test(value))target.style.setProperty(name,value);
  }
}
const policy="default-src 'none'; script-src 'none'; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; font-src 'none'; media-src 'none'; object-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none'";
const shell=body=>`<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${policy}"><meta name="referrer" content="no-referrer"><style>body{font:16px/1.5 system-ui,sans-serif;margin:16px;color:#172033;background:white;overflow-wrap:anywhere}*{box-sizing:border-box;max-width:100%}img{height:auto;max-width:100%}figure{margin:1em 0}figcaption{font-size:.9em;color:#526079}table{border-collapse:collapse}td,th{padding:.4em;border:1px solid #ccd3df}pre{white-space:pre-wrap}a{color:inherit}</style></head><body>${body}</body></html>`;

export function createHtmlDocumentView(host,{html,resolveImage,signal,title='HTML document',onExitFocus}={}) {
  const doc=host.ownerDocument,scope=createDocumentImageScope(resolveImage,signal,{dataUrls:true});
  const frame=doc.createElement('iframe');frame.className='ui-html-document';frame.title=title;
  frame.setAttribute('sandbox','');frame.referrerPolicy='no-referrer';
  frame.tabIndex=0;
  // Events inside an opaque frame cannot bubble to the parent modal. A parent
  // focus stop catches forward Tab when leaving the passive document.
  const exit=doc.createElement('span');exit.tabIndex=0;exit.className='ui-html-document-focus-exit';exit.setAttribute('aria-label','Return to viewer controls');
  exit.addEventListener('focus',()=>onExitFocus?.());
  const template=doc.createElement('template');template.innerHTML=html; // Inert: never attach original nodes.
  const output=doc.createElement('div'),images=[];let nodes=0,destroyed=false;
  const copy=(node,parent,depth)=>{
    if(++nodes>10000||depth>64)throw Error('Document structure exceeds the preview limit.');
    if(node.nodeType===3){parent.append(doc.createTextNode(node.textContent));return;}
    if(node.nodeType!==1)return;
    const tag=node.localName;
    if(node.namespaceURI!=='http://www.w3.org/1999/xhtml'||discard.has(tag))return;
    const target=doc.createElement(allowed.has(tag)?tag:'span');copyStyle(node.getAttribute('style'),target);
    if(tag==='img'){
      const alt=node.getAttribute('alt')||'Image unavailable';target.alt=alt;
      for(const key of ['width','height'])if(/^\d{1,4}$/.test(node.getAttribute(key)||''))target.setAttribute(key,node.getAttribute(key));
      const placeholder=doc.createElement('span');placeholder.textContent=alt;parent.append(placeholder);
      if(images.length<24)images.push({source:node.getAttribute('src')||'',alt,target,placeholder});return;
    }
    if(['td','th'].includes(tag))for(const key of ['colspan','rowspan'])if(/^[1-9]\d?$/.test(node.getAttribute(key)||''))target.setAttribute(key,node.getAttribute(key));
    parent.append(target);for(const child of node.childNodes)copy(child,target,depth+1);
  };
  try{for(const child of template.content.childNodes)copy(child,output,0);}catch(e){scope.dispose();throw e;}
  frame.srcdoc=shell('<p>Loading document images…</p>');host.append(frame,exit);
  let failedImages=0;
  const ready=(async()=>{
    for(const item of images){
      if(scope.signal.aborted)return;
      try{item.target.src=await scope.load(item.source,item.alt);if(!scope.signal.aborted)item.placeholder.replaceWith(item.target);}
      catch{failedImages++;item.placeholder.textContent=`${item.alt} (image unavailable)`;}
    }
    if(destroyed||scope.signal.aborted)return;
    frame.srcdoc=shell(output.innerHTML);
  })();
  const cancel=()=>{scope.dispose();frame.srcdoc=shell('');output.replaceChildren();images.length=0;};
  return {ready,getState:()=>({failedImages}),cancel,destroy(){destroyed=true;frame.remove();exit.remove();cancel();}};
}
