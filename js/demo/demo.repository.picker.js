import {uiLoader} from '../ui/ui.loader.js?v=0.21.229';
import './demo.shell.js?v=0.21.229';
const createPicker = await uiLoader.get('ui.repository.picker');
const createComposer = await uiLoader.get('ui.chat.composer');
const scenario = document.querySelector('#scenario');
const data = new Map([[null,[{id:'brief',name:'Project brief.md'},{id:'metrics',name:'Metrics.csv'},{id:'config',name:'Settings.json'},{id:'unknown',name:'Unrecognized file.bin'}]],['design',[{id:'mockup',name:'Mobile mockup.png'},{id:'locked',name:'Restricted draft.pdf',selectable:false}]]]);
for (const [mode,count] of [['six',6],['long',40]]) data.set(mode,Array.from({length:count},(_,i)=>({id:`${mode}-${i}`,name:`Document ${String(i+1).padStart(2,'0')}.pdf`})));
const dataKey = folderId => ['six','long'].includes(scenario.value) ? scenario.value : folderId;
const delay = ms => new Promise(resolve=>setTimeout(resolve,ms));
let serial=0;
const picker = createPicker({
  loadFolder:async({folderId,signal})=>{
    const mode=scenario.value; await delay(mode==='slow'?3000:250); if(signal.aborted) throw Error('Cancelled');
    if(mode==='error') throw Error('Demo access failure. Close and choose another scenario.');
    return {folder:{id:folderId,name:folderId || 'Project files'},breadcrumbs:folderId ? [{id:null,name:'Project files'},{id:folderId,name:'Design'}] : [{id:null,name:'Project files'}],
      folders:folderId || ['empty','six','long'].includes(mode)?[]:[{id:'design',name:'Design'}],files:mode==='empty'?[]:data.get(dataKey(folderId)),permissions:{showUpload:mode!=='hidden',canUpload:mode!=='denied'}};
  },
  onUpload:async(files,{folderId,signal})=>{
    await delay(700); if(signal.aborted) throw Error('Cancelled');
    if(scenario.value==='upload-error') throw Error('Demo network failure.');
    const records=files.map(file=>({id:`upload-${++serial}`,name:file.name,size:file.size})); data.get(dataKey(folderId)).push(...records); return records;
  },
});
function configure() {picker.update({folderId:null,multiple:!document.querySelector('#single').checked});}
document.querySelector('#open').disabled=false;
document.querySelector('#open').onclick=async()=>{configure();const files=await picker.pick();document.querySelector('#result').textContent=JSON.stringify(files,null,2);};
const composer=createComposer(document.querySelector('#composer'),{}, {
  attachmentAdapter:{mode:'custom',open:({signal})=>{configure();return picker.pick({signal});}},
  onAttachmentsSelected:(records,meta)=>{document.querySelector('#attachments').textContent=JSON.stringify({kind:meta.kind,source:meta.source,files:records.map(file=>file.name)},null,2);},
  onSend:({text})=>{document.querySelector('#attachments').textContent=`Demo message: ${text}`;composer.clear();},
});
document.querySelector('#mode').onchange=event=>composer.update({}, {attachmentAdapter:event.target.value==='custom'?{mode:'custom',open:({signal})=>{configure();return picker.pick({signal});}}:event.target.value});
