import { uiLoader } from '../ui/ui.loader.js?v=0.21.223';
import './demo.shell.js?v=0.21.223';
const format = document.body.dataset.format;
const createViewer = await uiLoader.get(`ui.${format}.viewer`);
const source = document.querySelector('#source');
const examples = {
  json: { normal: JSON.stringify({project:'Harbor', milestones:[{title:'Prototype',status:'complete'},{title:'Review',status:'open'}], budget:null},null,2), invalid:'{"project": "Harbor",}', large:JSON.stringify(Array.from({length:200},(_,i)=>({id:i,title:`Item ${i}`})),null,2) },
  markdown: { normal:'# Project brief\n\n## Deliverables\n- **Prototype** — complete\n- Review — scheduled\n\n| Phase | Owner |\n| --- | --- |\n| Design | Morgan |\n| Build | Riley |\n\n> Decisions should include evidence.\n\n```js\nviewer.open();\n```', invalid:'# Safe rendering\n<script>alert("never executed")</script>\n\n[Unsafe link](javascript:alert(1))\n\n![Remote image](https://example.org/image.png)', large:'# Long document\n\n'+Array.from({length:100},(_,i)=>`## Section ${i+1}\nA paragraph with **emphasis** and a [reference](https://example.org).`).join('\n\n') },
  csv: { normal:'Task,Owner,Status,Notes\nPrototype,Morgan,Complete,"Ready, including tests"\nReview,Riley,Open,"Line one\nLine two"\nRelease,Alex,Planned,"Says ""ship it"""', invalid:'Task,Owner\n"Unclosed field,Morgan', large:'ID,Title,Status\n'+Array.from({length:2000},(_,i)=>`${i},Item ${i},${i%2?'Open':'Done'}`).join('\n') },
};
let viewer, blobUrl;
const state = document.querySelector('#state');
function reset() { source.value = examples[format][document.querySelector('#example').value] || ''; }
function open(kind) {
  viewer?.destroy();
  if (blobUrl) URL.revokeObjectURL(blobUrl);
  blobUrl = null;
  const options = { title:`${format.toUpperCase()} project file`, fullscreen:document.querySelector('#full').checked,
    headers:document.querySelector('#headers')?.checked ?? true,
    onClose() { state.textContent='Viewer closed. The original content is unchanged.'; } };
  if (kind === 'blob') { blobUrl = URL.createObjectURL(new Blob([source.value],{type:'text/plain'})); options.url=blobUrl; }
  else if (kind === 'error') options.url='./file-viewer-missing-example.txt';
  else options.content=source.value;
  viewer = createViewer(options); viewer.open();
  state.textContent='Viewer opened. Try resizing, fullscreen, Escape and source links.';
}
document.querySelector('#example').addEventListener('change',reset);
for (const kind of ['preview','blob','error']) {
  const button = document.querySelector(`#${kind}`);
  button.addEventListener('click',()=>open(kind));
  button.disabled = false;
}
window.addEventListener('pagehide',()=>{viewer?.destroy(); if(blobUrl)URL.revokeObjectURL(blobUrl);});
reset();
