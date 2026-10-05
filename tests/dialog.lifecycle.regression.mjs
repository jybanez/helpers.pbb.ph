import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {startStaticServer} from './_support/static-server.mjs';
const {chromium}=await import(pathToFileURL('C:/wamp64/www/bimoperks/node_modules/playwright/index.mjs'));
const server=await startStaticServer({rootDir:process.cwd(),port:0});
const browser=await chromium.launch({channel:'msedge',headless:true});
try { for(const bundle of [false,true]) {
  const page=await browser.newPage(); const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(server.origin+'/tests/dialog.lifecycle.regression.html'+(bundle?'?bundle':''));
  await page.waitForFunction(()=>window.ready);
  // A cancelled context must not open or delegate an alert, even without a handler.
  assert.deepEqual(await page.evaluate(async()=>{
    const c=new AbortController(); c.abort(); let calls=0;
    const result=await alertDialog('Never open',{signal:c.signal,onClose:()=>calls++});
    return [result,calls,document.querySelectorAll('.ui-modal-root').length];
  }),[false,1,0]);
  // Signal-only alerts are cancellable without an async handler. Listener cleanup
  // prevents a later abort from touching a closed dialog or notifying twice.
  await page.evaluate(()=>{
    window.controller=new AbortController();window.result=null;window.closes=[];window.listeners=0;
    const signal=controller.signal;const add=signal.addEventListener.bind(signal);const remove=signal.removeEventListener.bind(signal);
    signal.addEventListener=(...args)=>{if(args[0]==='abort')listeners++;return add(...args)};
    signal.removeEventListener=(...args)=>{if(args[0]==='abort')listeners--;return remove(...args)};
    alertDialog('Signal only',{signal,onClose:meta=>closes.push(meta.reason)}).then(v=>result=v);
  });
  await page.getByText('Signal only',{exact:true}).waitFor();
  await page.evaluate(()=>controller.abort());await page.waitForFunction(()=>result===false);
  assert.deepEqual(await page.evaluate(()=>[listeners,closes]),[0,['abort']]);
  // Cancellation before the handler microtask must prevent invocation entirely.
  await page.evaluate(()=>{
    window.controller=new AbortController();window.calls=0;window.result=null;
    alertDialog('Cancel immediately',{signal:controller.signal,onAcknowledge:()=>calls++}).then(v=>result=v);
    document.querySelector('.ui-modal-footer button').click();controller.abort();
  });
  await page.waitForFunction(()=>result===false);assert.equal(await page.evaluate(()=>calls),0);
  // Idle dismissal invalidates lifetime; close observation happens only after unmount.
  for(const dismissal of ['escape','close','backdrop']) {
    await page.evaluate(()=>{
      window.closes=[];window.result=null;
      alertDialog('Dismiss',{showCloseButton:true,allowBackdropClose:true,onClose:meta=>closes.push([meta.reason,meta.signal.aborted,!!document.querySelector('.ui-modal-root')])}).then(v=>result=v);
    });
    await page.locator('.ui-modal-root.is-open').waitFor();
    if(dismissal==='escape') await page.keyboard.press('Escape');
    if(dismissal==='close') await page.locator('.ui-modal-close').click();
    if(dismissal==='backdrop') await page.locator('.ui-modal-backdrop').click({position:{x:2,y:2}});
    await page.waitForFunction(()=>closes.length===1);
    assert.deepEqual(await page.evaluate(()=>[result,closes[0][1],closes[0][2]]),[true,true,false]);
  }
  // Aborting an in-flight action settles without waiting for it; stale success/error
  // cannot affect the replacement dialog or run guarded caller side effects.
  for(const outcome of ['success','error']) {
    await page.evaluate(()=>{
      window.controller=new AbortController();window.closes=[];window.result=null;window.effects=0;window.ctx=null;
      window.deferred=new Promise((resolve,reject)=>{window.finish=resolve;window.fail=reject});
      alertDialog('Old context',{signal:controller.signal,showCloseButton:true,allowBackdropClose:true,
        onClose:meta=>closes.push([meta.reason,!!document.querySelector('.ui-modal-root')]),
        onAcknowledge:async(value,context)=>{window.ctx=context;await deferred;if(context.isActive()&&!context.signal.aborted)effects++;}
      }).then(v=>result=v);
    });
    await page.getByRole('button',{name:'OK',exact:true}).click();
    await page.waitForFunction(()=>!!ctx);
    await page.keyboard.press('Escape');
    await page.locator('.ui-modal-backdrop').click({position:{x:2,y:2}});
    assert.equal(await page.locator('.ui-modal-close').isDisabled(),true);
    assert.equal(await page.evaluate(()=>ctx.isActive()),true,'ordinary busy dismissal blocked');
    await page.evaluate(()=>controller.abort());
    assert.equal(await page.evaluate(()=>ctx.isActive()),false,'invalidated immediately');
    await page.waitForFunction(()=>result===false);
    assert.deepEqual(await page.evaluate(()=>closes),[['abort',false]]);
    await page.evaluate(()=>{window.replacement=alertDialog('New context',{onClose:()=>{}})});
    await page.getByText('New context',{exact:true}).waitFor();
    await page.evaluate(outcome=>outcome==='success'?finish():fail(Error('Stale error')),outcome);
    await page.waitForTimeout(30);
    assert.equal(await page.evaluate(()=>effects),0);
    assert.equal(await page.locator('.ui-dialog-error:not([hidden])').count(),0);
    assert.equal(await page.getByText('New context',{exact:true}).count(),1);
    await page.getByRole('button',{name:'OK',exact:true}).click();
    await page.locator('.ui-modal-root').waitFor({state:'detached'});
  }
  // Active failures stay inline and can be retried, without invalidating lifetime.
  await page.evaluate(()=>{
    window.attempts=0;window.result=null;window.closedCount=0;
    alertDialog('Retry',{onClose:()=>closedCount++,onAcknowledge:(_v,ctx)=>{window.ctx=ctx;if(++attempts===1)throw Error('Read-back failed');}}).then(v=>result=v);
  });
  await page.getByRole('button',{name:'OK',exact:true}).click();
  await page.getByRole('alert').filter({hasText:'Read-back failed'}).waitFor();
  assert.equal(await page.evaluate(()=>ctx.isActive()),true);
  await page.getByRole('button',{name:'OK',exact:true}).click();
  await page.waitForFunction(()=>result===true);
  assert.deepEqual(await page.evaluate(()=>[attempts,closedCount,ctx.signal.aborted,!!document.querySelector('.ui-modal-root')]),[2,1,true,false]);
  assert.deepEqual(errors,[]); await page.close();
  console.log('Alert lifecycle passed: '+(bundle?'bundle':'source'));
} } finally { await browser.close(); await server.close(); }
