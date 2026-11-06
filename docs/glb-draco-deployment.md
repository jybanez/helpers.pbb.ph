# Syndicatum Draco candidate deployment contract

This is a review artifact, not authorization to merge or adopt. Apply only after
the decoder and separate work-policy candidates are accepted. PR197 contains the
decoder; the stacked policy candidate uses cache revision **0.21.330**.

Developer confirmed on 2026-11-06 (Syndicatum #14407) the public Helper root:
`https://syndicatum.wizaya.com/vendor/pbb-helper/`. All paths below are relative
to that root; do not flatten the two nested `vendor` directories.

## Assets

Refresh from one accepted commit, keeping the complete existing Helper tree.
Changed/new browser assets relative to deployed .328:

| Relative path | Required response type |
| --- | --- |
| `js/ui/ui.loader.js` | JavaScript |
| `js/ui/ui.glb.viewer.js` | JavaScript module |
| `js/ui/ui.glb.data.js` | JavaScript module |
| `js/ui/ui.glb.policy.js` | JavaScript module |
| `dist/helpers.ui.bundle.min.js` | JavaScript module |
| `vendor/three/glb.runtime.js` | JavaScript module |
| `vendor/three/draco-r187/worker.js` | JavaScript (classic worker) |
| `vendor/three/draco-r187/draco_wasm_wrapper.js` | JavaScript (classic script) |
| `vendor/three/draco-r187/draco_decoder.wasm` | `application/wasm` |

JavaScript MIME may be `text/javascript` or `application/javascript`; never serve
an HTML login/error/fallback body for an asset. Retain the MIT license and ship
`vendor/three/draco-r187/LICENSE.txt` (Apache-2.0). Existing main CSS and modal
dependencies remain necessary; a .330 main CSS request returns unchanged CSS.
Do not replace the bounded WASM with a CDN/upstream binary: its maximum-memory
patch is part of the candidate. Compare canonical Git-blob SHA256 hashes using
the [candidate asset manifest](benchmarks/glb-draco-policy-assets.json), including assets unchanged from PR197.

Exact decoder request URLs:

```text
https://syndicatum.wizaya.com/vendor/pbb-helper/vendor/three/draco-r187/worker.js
https://syndicatum.wizaya.com/vendor/pbb-helper/vendor/three/draco-r187/draco_wasm_wrapper.js
https://syndicatum.wizaya.com/vendor/pbb-helper/vendor/three/draco-r187/draco_decoder.wasm
```

The wrapper deliberately resolves its internal `draco_decoder_gltf.wasm` name
to the shipped `draco_decoder.wasm`; do not add a second unbounded decoder.
Application loader imports must request the new loader revision. The source
viewer requests data/runtime .330; the main bundle also requests runtime .330.
Publish all matching assets before switching the application's loader revision.

## CSP

Developer sampled the live project document and existing runtime as HTTP 200
with `Content-Security-Policy: frame-ancestors 'self'`. An independent public-root
HEAD check returned that same header. That policy does not restrict loading
scripts, workers or WASM. The new worker is **not deployed** and its eventual
response/header has not been verified. No live CSP relaxation is requested.

If a stricter policy is introduced, preserve the application's existing nonce/
hash policy and add only the capabilities required for this workflow:

- Document `worker-src 'self'` permits the dedicated same-origin worker.
- Document script policy permits same-origin Helper ES modules.
- Document `connect-src 'self' blob:` permits authorized same-origin model reads
  and GLTFLoader's fetch of internal embedded-texture blob URLs.
- Document `img-src 'self' blob:` permits internal blob image decoding where used.
- Worker response policy must allow `script-src 'self' 'wasm-unsafe-eval'` and
  `connect-src 'self'`. The classic worker imports the local wrapper and fetches
  local WASM. If the host applies document headers globally, ensure that policy
  also permits these operations on the worker response.

For example, the worker alone can use
`default-src 'none'; script-src 'self' 'wasm-unsafe-eval'; connect-src 'self'`.
Do not replace the application's complete CSP with this worker policy or add
broad `'unsafe-eval'`. Ordinary URL workers have their own response CSP; a parent
document policy does not prove the worker's compilation permission. No blob
worker or remote origin allowance is needed. Existing UI style requirements are
unchanged. Local CSP tests use a hash for the test module and existing inline
style allowance; these are harness details, not a requested application policy.

## Adoption smoke checks (after approval)

1. Verify every asset returns 200, expected MIME, and the accepted hash. Check the
   worker response's own CSP, not just the project document. No redirects to login
   HTML and no remote decoder fetches should occur.
2. Check source and bundled Helper loading. Open the authorized original scene:
   immediate dismissible loading modal, then a visible scene. Original SHA256:
   `a971be6d84a606e33f78bcb1ce39a4e75e56dabd0529a5dbb22507a8e5814fde`.
3. Exercise orbit, pan, zoom, Fit, Reset, and wireframe repeatedly on desktop and
   narrow layouts. Wireframe must preserve camera and restore original materials.
4. Close during decoding and replace the source during decoding; ensure no late
   canvas/error overwrites the new context. Reopen/close repeatedly and confirm
   worker termination and lost WebGL context on close.
5. Verify the 2,048-draw / 3M-triangle controls still reject excess work before
   decoding, and existing 128 MiB geometry/URI/required-extension controls remain.
6. Record actual lower-end-device results separately. CPU4/narrow emulation is
   not low-memory hardware or a total browser/GPU memory guarantee. No such real
   constrained device/tester is currently identified (#14407).

An adoption report must identify the exact accepted head, installed asset hashes,
live asset/header checks, and application smoke results. Until then production
adoption remains unverified.
