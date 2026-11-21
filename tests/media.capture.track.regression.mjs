import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { startStaticServer } from './_support/static-server.mjs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const server = await startStaticServer({ rootDir: process.cwd(), port: 0 });
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] });
try {
  for (const bundle of [false, true]) {
    const page = await browser.newPage();
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    const load = async (kind, mode = 'normal') => {
      await page.goto(server.origin + '/tests/composer.recording.regression.html' + (bundle ? '?bundle' : ''));
      await page.waitForFunction(() => window.ready);
      await page.evaluate(({kind, mode}) => {
        window.hookEvents = []; window.getUserMediaCalls = 0;
        const acquireWithTracking = navigator.mediaDevices.getUserMedia;
        navigator.mediaDevices.getUserMedia = constraints => { getUserMediaCalls++; return acquireWithTracking(constraints); };
        window.captureController = new AbortController();
        composer.update({}, { attachmentOptions: { [kind === 'video' ? 'videos' : 'audios']: {
          ...(mode === 'limit' ? {maxDurationMs: 100} : {}),
          onRecordingStart({audioTrack, kind: actualKind}) {
            hookEvents.push({type:'start', kind:actualKind, sameTrack:tracks.includes(audioTrack), state:audioTrack.readyState});
            window.borrowedTrack = audioTrack;
            if (mode === 'throw-start') throw new Error('consumer start failure');
            if (mode === 'reentrant') composer.destroy();
            return ({reason}) => {
              hookEvents.push({type:'end', reason, state:audioTrack.readyState});
              if (mode === 'throw-cleanup') throw new Error('consumer cleanup failure');
            };
          },
        } } });
      }, {kind, mode});
      await page.getByRole('button', {name:kind === 'video' ? 'Attach Video' : 'Attach Audio', exact:true}).click();
      assert.deepEqual(await page.evaluate(() => hookEvents), []);
      await page.getByRole('button', {name:'Start recording', exact:true}).click();
    };
    const stop = async () => {
      await page.waitForTimeout(400);
      await page.getByRole('button', {name:'Stop recording', exact:true}).click();
      await page.getByRole('button', {name:'Attach recording', exact:true}).waitFor();
    };
    for (const kind of ['audio', 'video']) {
      await load(kind);
      assert.deepEqual(await page.evaluate(() => hookEvents), [{type:'start', kind, sameTrack:true, state:'live'}]);
      assert.equal(await page.evaluate(() => getUserMediaCalls), 1);
      await stop();
      assert.deepEqual(await page.evaluate(() => hookEvents[1]), {type:'end', reason:'stop', state:'live'});
      assert.equal(await page.evaluate(() => tracks.every(t => t.readyState === 'ended')), true);
      await page.getByRole('button', {name:'Record again', exact:true}).click();
      await page.waitForFunction(() => hookEvents.length === 3);
      assert.equal(await page.evaluate(() => getUserMediaCalls), 2);
      await stop();
      await page.getByRole('button', {name:'Attach recording', exact:true}).click();
      await page.waitForFunction(() => files.length === 1);
      assert.equal(await page.evaluate(() => hookEvents.length), 4);
      assert.equal(await page.evaluate(() => files[0].size > 0), true);
      for (const mode of ['cancel', 'dispose', 'limit', 'throw-start', 'throw-cleanup', 'reentrant', 'device']) {
        await load(kind, mode);
        if (mode === 'cancel' || mode === 'throw-cleanup') await page.getByRole('button', {name:'Close modal', exact:true}).click();
        if (mode === 'dispose') await page.evaluate(() => composer.destroy());
        if (mode === 'device') await page.evaluate(() => borrowedTrack.dispatchEvent(new Event('ended')));
        await page.waitForFunction(() => tracks.every(t => t.readyState === 'ended'));
        const events = await page.evaluate(() => hookEvents);
        assert.equal(events.length, mode === 'throw-start' ? 1 : 2, mode);
        if (events[1]) assert.equal(events[1].reason, ['limit', 'device'].includes(mode) ? 'error' : 'cancel', mode);
        assert.equal(await page.evaluate(() => files.length), 0);
      }
    }
    assert.deepEqual(errors, []);
    await page.close();
    console.log('Live recording track passed: ' + (bundle ? 'bundle' : 'source'));
  }
} finally { await browser.close(); await server.close(); }
