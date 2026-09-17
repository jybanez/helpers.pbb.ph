# H4 1.0.0: offline QR and PNG mechanics

This optional package implements Syndicatum 2411/2409. It does not replace the
accepted H2 loader or main UI bundle. No Bimo source, token issuance, authorization,
voucher composition, asset loading, analytics or commercial state is included.
All demo/test payloads are synthetic. Do not log or put real payloads in URLs.

## Minimal adoption

Copy `dist/helpers.h4.min.js` from the reviewed immutable commit to your local
vendor directory. It is self-contained ESM with the encoder's MIT notice. Import
it under an immutable/versioned URL. No network QR service, CDN, stylesheet,
decoder, extra dependency or main-bundle upgrade is needed.

```js
import {createQr, createCanvasPngExporter, H4_COMPONENT_REGISTRY}
  from '/helper/dist/helpers.h4.min.js?v=1.0.0';
// Optional: merge H4_COMPONENT_REGISTRY into the existing createUiLoader registry.
// media.qr -> createQr; media.png -> createCanvasPngExporter.
// Entries resolve to the same imported module URL, including its query string.
const qr = createQr({text: authorizedOpaqueText, scale: 4, quietZone: 4});
context.drawImage(qr.canvas, x, y); // integer coordinates; don't stretch the QR
const exporter = createCanvasPngExporter();
const blob = await exporter.export(completedAppCanvas);
// Separate, explicit user activation after generation:
saveButton.onclick = () => exporter.download(blob, {filename: 'voucher.png'});
// On replacement/disposal:
qr.destroy();
exporter.destroy();
```

The optional registry extension uses `media.*` keys to stay outside the main
`ui.*`/`incident.*` bundle. It works with existing loader bundle preference.
Source module: `js/media/qr-png.js`; generated encoder module:
`vendor/h4/qrcodegen.js`; build command: `node scripts/build.h4.mjs`.
Dependency source, license and byte hashes were committed before implementation:
[dependencies.md](dependencies.md). QA decoder is never shipped to clients.

## QR handle

`createQr({text, scale=4, quietZone=4, maxVersion=40, parent?, document?})` returns
`{canvas, update(patch), getState(), destroy()}`. `parent` optionally receives the
owned canvas; otherwise it is detached for composition. Updates are synchronous
and replace the pixels only after validation. Failed updates clear stale pixels
and retained payload; destroy clears/removes only the owned QR canvas, is
idempotent, and rejects further updates. Metadata omits payload text.

Input is nonempty, well-formed Unicode, encoded as exact UTF-8 bytes with ECI 26;
no trimming, case folding, token parsing or normalization. Maximum 2048 bytes.
QR Model 2, fixed M error correction, automatic smallest version up to
`maxVersion` (integer 1–40), deterministic automatic mask, no ECC boosting.
`scale` is integer pixels/module 1–32; `quietZone` is integer modules 4–32.
Total bitmap size must not exceed 4096 pixels. The bitmap is opaque black/white.
Do not rescale it or cover its quiet zone in the app's composition. Pixel scale 1
is supported mechanically, not a claim of physical scanner reliability.

The canvas is labelled generically "QR code" without disclosing token text.
Bimo supplies accessible surrounding explanation and any authorized textual code.
Its layout must reserve the returned dimensions or request a smaller integer
scale; a fixed voucher must not silently crop, stretch or truncate a QR.

## Completed-canvas export/download

`createCanvasPngExporter({document?})` returns `{export, download, cancel, destroy}`.
`export(canvas): Promise<Blob>` accepts dimensions 1–4096 on each axis and calls
the browser's PNG encoder. It never modifies or destroys the app canvas.
Prepare assets/fonts and validate your own layout before calling. It cannot
detect an omitted or failed asset already absent from an otherwise valid canvas.
Missing-asset readiness is Bimo's responsibility; an origin-tainted canvas is
reported as `TAINTED` with no workaround or remote fallback.

A new export, cancel or destroy invalidates/rejects any outstanding export.
Late callbacks cannot resolve a stale result. A 30-second encoder timeout rejects
without claiming success. Once a Blob is returned, the app owns it and must drop
its reference on replacement/logout/disposal; the helper cannot revoke a Blob
already delivered to caller code.

`download(blob,{filename})` must run from a fresh user gesture when browser user
activation is exposed. It accepts nonempty `image/png` Blobs, sanitizes filenames,
uses a temporary hidden anchor and object URL, removes the anchor immediately,
and revokes the URL after 30 seconds or on cancel/destroy. It returns
`{initiated:true, filename}`, not proof of a saved file. User cancellation,
browser download policies and sandbox permissions remain browser/app concerns.
Do not immediately dispose after initiation if the browser still needs the URL.
Saved-file verification in QA is distinct from this runtime initiation result.

`H4Error.code`: INPUT, CAPACITY, DIMENSION, UNSUPPORTED, RENDER, DISPOSED,
CANVAS, EXPORT, TAINTED, EXPORT_TIMEOUT, STALE, USER_ACTIVATION, DOWNLOAD.
Messages are fixed codes and never include payload, canvas content or filenames.
No raw upstream exception is exposed. UI callers should provide their own safe,
actionable error copy; the demo uses only synthetic input and generic codes.

## Verification and limits

`tests/h4.regression.mjs` uses independently vendored jsQR on rendered pixels,
decoded PNG Blob pixels and actual saved PNG bytes. The synthetic composed
voucher is not Bimo's final layout. Final real voucher readability/decode/save/
re-download and unchanged claim/wallet/capacity state remain Developer evidence.
No actual mobile device, AT, Safari, Firefox or universal download support is
claimed by desktop Edge viewport runs. Stage7 acceptance remains Reviewer-owned;
Stage8 is not part of this package.
