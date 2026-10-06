import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {startStaticServer} from './_support/static-server.mjs';

// Install Playwright locally or point PLAYWRIGHT_MODULE at an existing installation.
const {chromium} = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const server = await startStaticServer({rootDir:process.cwd(), port:0});
const browser = await chromium.launch({channel:'msedge', headless:true});
try {
  for (const bundle of [false, true]) {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(server.origin + '/tests/audio.chrome.regression.html' + (bundle ? '?bundle' : ''));
    await page.waitForFunction(() => window.ready);
    for (const kind of ['timeline', 'session']) {
      const result = await page.evaluate(async kind => {
        const host = document.querySelector('#host');
        // One-second silent WAV: a real playable source, no microphone access or remote request.
        const bytes = new ArrayBuffer(44 + 16000), view = new DataView(bytes);
        const text = (offset, value) => [...value].forEach((char, i) => view.setUint8(offset + i, char.charCodeAt(0)));
        text(0, 'RIFF'); view.setUint32(4, bytes.byteLength - 8, true); text(8, 'WAVE'); text(12, 'fmt ');
        view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
        view.setUint32(24, 8000, true); view.setUint32(28, 16000, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true);
        text(36, 'data'); view.setUint32(40, 16000, true);
        const url = URL.createObjectURL(new Blob([bytes], {type:'audio/wav'}));
        const ids = ['caller', 'operator'];
        const data = kind === 'timeline'
          ? {durationMs:1000, tracks:ids.map(id => ({id, label:id, segments:[{id, srcUrl:url, durationMs:1000}]}))}
          : {call_duration_seconds:1, media:ids.map(id => ({id, type:'audio', peer_role:id, peer_label:id, srcUrl:url, duration_seconds:1, created_at:'2026-10-06T00:00:00Z'}))};
        const compact = () => host.querySelector('.ui-audio-player').classList.contains('is-compact');
        const tracks = () => [...host.querySelectorAll('.ui-audio-session-track')].map(el => el.dataset.trackId).join(',');
        const mutes = () => host.querySelectorAll('.ui-audiograph-mute').length;
        const chromeless = () => host.querySelector('.ui-audio-session').classList.contains('is-chromeless') && getComputedStyle(host.querySelector('.ui-audio-session-player')).borderTopWidth === '0px';
        let api = factories[kind](host, data);
        await api.update(data);
        const defaultFull = !compact();
        api.destroy();
        api = factories[kind](host, data, {compact:true, chrome:false});
        const compactAtCreation = compact();
        await api.update(data);
        const retained = compact() && chromeless();
        const trackControls = tracks() === ids.join(',') && mutes() === 2;
        host.querySelector('.ui-audiograph-mute').click();
        const muted = (kind === 'timeline' ? api.getState().tracks : api.getState().roles)[0].muted;
        api.seek(500);
        const seekWorks = api.getState().currentMs === 500;
        const button = host.querySelector('.ui-audio-player-toggle');
        const range = host.querySelector('.ui-audio-player-seek');
        const time = host.querySelector('.ui-audio-player-time');
        const centers = [button, range, time].map(el => {const r = el.getBoundingClientRect(); return r.y + r.height / 2;});
        const singleRow = Math.max(...centers) - Math.min(...centers) < 2;
        const accessible = button.getAttribute('aria-label') === 'Play' && !!range.getAttribute('aria-label') && !button.disabled;
        await api.update(data, {compact:false});
        const restored = !compact() && chromeless() && mutes() === 2 && tracks() === ids.join(',');
        await api.update(data, {compact:true, chrome:true});
        const independent = compact() && !chromeless() && mutes() === 2;
        api.destroy(); URL.revokeObjectURL(url);
        return {defaultFull, compactAtCreation, retained, trackControls, muted, seekWorks, singleRow, accessible, restored, independent};
      }, kind);
      for (const [check, passed] of Object.entries(result)) assert.equal(passed, true, `${kind}: ${check}`);
    }
    assert.deepEqual(errors, []);
    await page.close();
    console.log(`Audio compact creation/update/retention/controls passed: ${bundle ? 'bundle' : 'source'}`);
  }
} finally {
  await browser.close();
  await server.close();
}
