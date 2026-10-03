const output = document.querySelector('#results');
const { uiLoader } = await import(location.search.includes('bundle') ? '../dist/helpers.ui.bundle.min.js' : '../js/ui/ui.loader.js');
const assert = (value, message) => { if (!value) throw new Error(message); output.textContent += `PASS ${message}\n`; };
const tick = () => new Promise(resolve => setTimeout(resolve, 30));
const nativeFetch = window.fetch;
let view;
try {
  const json = await uiLoader.get('ui.json.viewer');
  const markdown = await uiLoader.get('ui.markdown.viewer');
  const csv = await uiLoader.get('ui.csv.viewer');
  document.querySelector('#opener').focus();
  view = json({content:'{"safe":"<img src=x onerror=alert(1)>"}'}); view.open();
  assert(view.getState().status === 'ready' && !view.refs.content.querySelector('img'), 'JSON uses safe Inspector');
  view.update({content:'null'}); assert(view.refs.content.textContent === 'null', 'JSON null remains a value');
  view.update({content:'{'}); assert(view.getState().status === 'parse-error', 'JSON parse error is visible');
  view.update({content:' '}); assert(view.getState().status === 'empty','empty JSON');
  view.destroy(); assert(document.activeElement.id === 'opener','destroy restores focus');
  view = markdown({content:'# Heading\n<script>alert(1)</script>\n[unsafe](javascript:alert(1))'}); view.open();
  assert(view.refs.content.querySelector('h1') && !view.refs.content.querySelector('script,a[href^="javascript:"]'), 'Markdown canonical policy');
  view.destroy();
  view = csv({content:'Name,Count\nZulu,2\nAlpha,1'}); view.open();
  assert(view.getState().rowCount === 2 && view.refs.content.querySelector('table'), 'CSV composes Grid');
  view.refs.content.querySelector('th').click();
  assert(view.refs.content.querySelector('tbody tr').textContent.includes('Alpha'), 'CSV sorting works');
  view.update({content:'Name\n' + Array.from({length:150},(_,i)=>`row ${i}`).join('\n')});
  assert(view.refs.content.querySelectorAll('tbody tr').length <= 50,'CSV DOM bounded by pagination');
  view.update({content:'a,b\n1'}); assert(view.getState().status === 'parse-error','CSV ragged rows rejected');
  view.destroy();
  let resolveOld, aborted = false, reads = 0;
  window.fetch = (_url, {signal}) => { reads++; signal.addEventListener('abort',()=>aborted=true); return new Promise(resolve=>resolveOld=resolve); };
  view = json({url:'/delayed.json'}); view.open();
  assert(view.getState().open && view.getState().status === 'loading' && !view.refs.closeButton.disabled,'immediate cancellable loading');
  view.open(); // duplicate open must not issue a second fetch
  assert(reads === 1 && view.refs.panel.contains(document.activeElement), 'duplicate open avoids reads and focus stays inside');
  view.update({content:'{"new":true}'});
  resolveOld(new Response('{"old":true}')); await tick();
  assert(aborted && view.refs.content.textContent.includes('new') && !view.refs.content.textContent.includes('old'),'source switch ignores late response');
  view.destroy();
  window.fetch = async()=>new Response('denied',{status:403});
  view = json({url:'/forbidden.json'}); view.open(); await tick();
  assert(view.getState().status === 'fetch-error' && !view.refs.retry.hidden,'fetch error exposes Retry');
  window.fetch = async()=>new Response('{"retried":true}'); await view.reload();
  assert(view.getState().status === 'ready','Retry can recover');
  window.fetch = (_url,{signal}) => { signal.addEventListener('abort',()=>aborted=true); return new Promise(resolve=>resolveOld=resolve); };
  aborted=false; view.update({url:'/delayed.json'}); await view.close(); resolveOld(new Response('{}')); await tick();
  assert(aborted && !view.getState().open,'close aborts and ignores late results');
  view.destroy();
  view = json({content:'{}'}); view.open(); view.update({fullscreen:true});
  assert(view.refs.panel.classList.contains('is-size-full'),'canonical fullscreen');
  assert(view.refs.panel.getBoundingClientRect().width <= innerWidth,'dialog fits viewport');
  view.destroy(); assert(view.open() === false,'destroy is terminal');
  window.fetch = nativeFetch;
  if (new URLSearchParams(location.search).has('attachments')) {
    const pageUrl = location.href;
    for (const [factory, extension, marker] of [
      [json, 'json', 'downloaded JSON'],
      [markdown, 'md', 'Downloaded Markdown'],
      [csv, 'csv', 'Downloaded CSV'],
    ]) {
      const url = `/attachments/viewer.${extension}`;
      const response = await nativeFetch(url);
      assert(response.ok && response.headers.get('content-disposition')?.startsWith('attachment;') &&
        response.headers.get('content-type') === 'application/octet-stream', `${extension} real HTTP attachment fixture`);
      await response.arrayBuffer();
      view = factory({url, open:false});
      view.open();
      assert(view.getState().open && view.getState().status === 'loading', `${extension} opens before attachment fetch completes`);
      for (let attempt = 0; attempt < 100 && view.getState().status === 'loading'; attempt++) await tick();
      assert(view.getState().status === 'ready' && view.refs.content.textContent.includes(marker), `${extension} renders attachment URL response`);
      if (extension === 'csv') assert(view.refs.content.textContent.includes('0012'), 'attachment CSV preserves string values');
      assert(location.href === pageUrl, `${extension} attachment preview keeps page navigation unchanged`);
      view.destroy();
    }
  }
  document.body.dataset.status = 'pass';
} catch(error) { output.textContent += `FAIL ${error.stack}`; document.body.dataset.status='fail'; }
finally { window.fetch = nativeFetch; view?.destroy(); }
