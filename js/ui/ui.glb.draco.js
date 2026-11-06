import {BufferGeometry, BufferAttribute} from 'three';

// The standard DRACOLoader does not reject pending jobs on disposal, compare
// decoded counts with glTF accessors, or cap its WASM heap. This adapter supplies
// that missing boundary, retaining GLTFLoader's canonical materials/scene path.
let workers = 0;
export function createBoundedDraco(signal, track) {
  let worker, stopped = false, next = 0, timer;
  const pending = new Map(), manifests = new WeakMap(), cache = new WeakMap();
  const abort = () => dispose(new DOMException('Cancelled', 'AbortError'));
  signal.addEventListener('abort', abort, {once:true});
  function dispose(error = new Error('Draco decoder closed. Retry the preview.')) {
    if (stopped) return;
    stopped = true; clearTimeout(timer); signal.removeEventListener('abort', abort);
    if (worker) {worker.terminate(); worker = null; workers--;}
    for (const job of pending.values()) job.reject(error);
    pending.clear();
  }
  function start() {
    if (stopped || signal.aborted) throw new DOMException('Cancelled', 'AbortError');
    if (worker) return;
    if (workers >= 2) throw new Error('Two Draco previews are decoding. Close one or retry after it finishes.');
    const url = new URL('./draco-r187/worker.js', import.meta.url);
    if (url.origin !== location.origin) throw new Error('Draco assets must be served from the application origin.');
    worker = new Worker(url); workers++;
    // Bound the entire parse, including decoder initialization and queued jobs.
    timer = setTimeout(() => dispose(new Error('Draco decoding exceeded 60 seconds. Export a smaller model.')), 60000);
    worker.onerror = () => dispose(new Error('Draco decoder failed. Check local decoder assets and retry.'));
    worker.onmessage = ({data}) => {
      const job = pending.get(data.id); if (!job || stopped) return;
      pending.delete(data.id);
      if (data.error) {job.reject(new Error(data.error)); dispose(new Error(data.error)); return;}
      try {
        const geometry = track(new BufferGeometry());
        geometry.setIndex(new BufferAttribute(data.index,1));
        for (const a of data.attributes) geometry.setAttribute(a.name,new BufferAttribute(a.array,a.itemSize));
        job.resolve(geometry);
      } catch (error) {job.reject(error); dispose(error);}
    };
  }
  return {
    preload() {}, dispose,
    bind(buffer, definitions) {manifests.set(buffer,definitions);},
    decodeDracoFile(buffer, callback, ids, types, colorSpace, onError) {
      const key = JSON.stringify([ids,types]);
      let result = cache.get(buffer);
      if (result && result.key !== key) return Promise.reject(new Error('Conflicting Draco attribute mapping.')).catch(onError);
      if (!result) {
        const promise = new Promise((resolve,reject) => {
          try {
            start();
            const definitions = manifests.get(buffer);
            if (!definitions?.length) throw new Error('Missing Draco validation manifest.');
            const id = ++next;
            pending.set(id,{resolve,reject});
            // Definitions for shared bufferViews must agree; checked by worker.
            worker.postMessage({id,buffer,definitions,ids,types},[buffer]);
          } catch (error) {reject(error);dispose(error);}
        });
        result = {key,promise}; cache.set(buffer,result);
      }
      return result.promise.then(callback).catch(onError);
    }
  };
}
