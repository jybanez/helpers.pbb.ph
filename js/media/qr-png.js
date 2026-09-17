import { qrcodegen } from '../../vendor/h4/qrcodegen.js';

export const H4_VERSION = '1.0.0';
export const H4_COMPONENT_REGISTRY = Object.freeze({
  'media.qr': { js: import.meta.url, css: [], deps: [], export: 'createQr' },
  'media.png': { js: import.meta.url, css: [], deps: [], export: 'createCanvasPngExporter' },
});

export class H4Error extends Error {
  constructor(code) { super(`H4: ${code}`); this.name = 'H4Error'; this.code = code; }
}
const fail = (code) => { throw new H4Error(code); };
const integer = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;

function encode(options) {
  const {text, scale, quietZone, maxVersion} = options;
  if (typeof text !== 'string' || !text.length) fail('INPUT');
  // Reject malformed UTF-16 rather than silently replacing an opaque payload.
  for (let i = 0; i < text.length; i++) {
    const n = text.charCodeAt(i);
    if (n >= 0xD800 && n <= 0xDBFF) {
      const next = text.charCodeAt(++i);
      if (!(next >= 0xDC00 && next <= 0xDFFF)) fail('INPUT');
    } else if (n >= 0xDC00 && n <= 0xDFFF) fail('INPUT');
  }
  if (!integer(scale, 1, 32) || !integer(quietZone, 4, 32) || !integer(maxVersion, 1, 40)) fail('DIMENSION');
  if (text.length > 2048) fail('CAPACITY');
  const bytes = new TextEncoder().encode(text);
  if (bytes.length > 2048) fail('CAPACITY');
  let qr;
  try {
    qr = qrcodegen.QrCode.encodeSegments([
      qrcodegen.QrSegment.makeEci(26), qrcodegen.QrSegment.makeBytes(bytes),
    ], qrcodegen.QrCode.Ecc.MEDIUM, 1, maxVersion, -1, false);
  } catch { fail('CAPACITY'); }
  const dimension = (qr.size + 2 * quietZone) * scale;
  if (dimension > 4096) fail('DIMENSION');
  return { qr, dimension, byteLength: bytes.length };
}

/** Owns only its generated canvas. Never fetches, logs, or interprets text. */
export function createQr(options = {}) {
  const doc = options.parent?.ownerDocument || options.document || globalThis.document;
  if (!doc?.createElement) fail('UNSUPPORTED');
  const canvas = doc.createElement('canvas');
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'QR code');
  let current = {scale: 4, quietZone: 4, maxVersion: 40, ...options};
  let disposed = false;
  let state = null;
  function clear() { canvas.width = 0; canvas.height = 0; state = null; }
  function update(patch = {}) {
    if (disposed) fail('DISPOSED');
    try {
      const next = {...current, ...patch};
      const {qr, dimension, byteLength} = encode(next);
      canvas.width = canvas.height = dimension;
      const ctx = canvas.getContext('2d');
      if (!ctx) fail('UNSUPPORTED');
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, dimension, dimension);
      ctx.fillStyle = '#000';
      for (let y = 0; y < qr.size; y++) for (let x = 0; x < qr.size; x++) {
        if (qr.getModule(x, y)) ctx.fillRect((x + next.quietZone) * next.scale, (y + next.quietZone) * next.scale, next.scale, next.scale);
      }
      current = next;
      state = {version: qr.version, modules: qr.size, dimension, byteLength, scale: next.scale, quietZone: next.quietZone};
    } catch (error) { clear(); current.text = ''; throw error instanceof H4Error ? error : new H4Error('RENDER'); }
  }
  update();
  options.parent?.appendChild(canvas);
  return {
    canvas, update,
    getState: () => state ? {...state} : null,
    destroy() { if (disposed) return; disposed = true; clear(); canvas.remove(); current = null; },
  };
}

function pngFilename(input) {
  let name = String(input || 'image').replace(/[^a-zA-Z0-9._ -]/g, '_').replace(/^\.+/, '').slice(0, 100);
  name = name.replace(/\.png$/i, '').replace(/[. ]+$/, '') || 'image';
  if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(name)) name = `image_${name}`;
  return `${name}.png`;
}

/** Does not load assets or modify the supplied app-owned canvas. */
export function createCanvasPngExporter({document: doc = globalThis.document} = {}) {
  let disposed = false;
  let revision = 0;
  let pending = null;
  const urls = new Map();
  const release = (url) => {
    clearTimeout(urls.get(url)); urls.delete(url); doc.defaultView.URL.revokeObjectURL(url);
  };
  function invalidate(code = 'STALE') {
    revision++;
    if (pending) { clearTimeout(pending.timer); pending.reject(new H4Error(code)); pending = null; }
  }
  return {
    export(canvas) {
      if (disposed) return Promise.reject(new H4Error('DISPOSED'));
      invalidate();
      const epoch = revision;
      return new Promise((resolve, reject) => {
        if (!canvas || typeof canvas.toBlob !== 'function' || !integer(canvas.width, 1, 4096) || !integer(canvas.height, 1, 4096)) { reject(new H4Error('CANVAS')); return; }
        const finish = (blob, code) => {
          if (disposed || epoch !== revision) return;
          clearTimeout(pending?.timer); pending = null;
          if (code) reject(new H4Error(code));
          else if (!blob || blob.type !== 'image/png' || !blob.size) reject(new H4Error('EXPORT'));
          else resolve(blob);
        };
        pending = {reject, timer: setTimeout(() => finish(null, 'EXPORT_TIMEOUT'), 30000)};
        try { canvas.toBlob(blob => finish(blob), 'image/png'); }
        catch (error) { finish(null, error?.name === 'SecurityError' ? 'TAINTED' : 'EXPORT'); }
      });
    },
    download(blob, {filename = 'image.png'} = {}) {
      if (disposed) fail('DISPOSED');
      const win = doc?.defaultView;
      if (!win?.URL?.createObjectURL || !doc?.body) fail('UNSUPPORTED');
      if (win.navigator.userActivation && !win.navigator.userActivation.isActive) fail('USER_ACTIVATION');
      if (!(blob instanceof win.Blob) || blob.type !== 'image/png' || !blob.size) fail('EXPORT');
      const anchor = doc.createElement('a');
      let url;
      try {
        url = win.URL.createObjectURL(blob);
        anchor.href = url; anchor.download = pngFilename(filename); anchor.hidden = true;
        doc.body.appendChild(anchor);
        urls.set(url, setTimeout(() => release(url), 30000));
        anchor.click();
        return {initiated: true, filename: anchor.download};
      } catch { if (url) release(url); fail('DOWNLOAD'); }
      finally { anchor.remove(); }
    },
    cancel() { invalidate(); for (const url of [...urls.keys()]) release(url); },
    destroy() { if (disposed) return; disposed = true; invalidate('DISPOSED'); for (const url of [...urls.keys()]) release(url); },
  };
}
