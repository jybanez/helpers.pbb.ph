# GLB viewer (0.21.330 candidate)

`ui.glb.viewer` exports `createGlbViewer(options)`, a complete fullscreen canonical
modal for self-contained glTF 2.0 binary files. Interaction follows the orbit,
pan and zoom conventions of https://gltf-viewer.donmccurdy.com/.

## Input and lifecycle

Preload the factory with `await uiLoader.get('ui.glb.viewer')`. Options:
- `source`: File/Blob or ArrayBuffer. Alternatively use `load({signal,context})`
  returning one of those types, synchronously or asynchronously.
- `context`: opaque application context forwarded to `load`.
- `title`, `maxBytes` (default 64 MiB), `onClose(meta)`, `open` (default false).

The application owns access, authorization, transport and bounded downloads. It
must honor the AbortSignal and check its own context before side effects. Helper
checks the Blob/ArrayBuffer size before parsing; this cannot bound a transport
callback's allocation. Do not pass untrusted URLs as executable module locations.

`open(patch?)` shows the fullscreen modal immediately, enters dismissible loading,
then starts the read and lazy renderer import. Duplicate openings do not reload.
`update(patch)` changes options; source/load/context/maxBytes changes cancel and
reload an open viewer. Supplying source clears load and vice versa. `reload()`
returns Promise<boolean>. `close()` aborts, disposes resources and leaves the
instance reusable; `destroy()` is terminal. Reopening reloads the current source.
`fit()` reframes the model from the current direction; `reset()` restores the
initial perspective. `getState()` exposes open/status/error/destroyed/view.
Statuses: idle, loading, ready, error, closed, destroyed. Errors remain visible
with Retry; controls needing a model stay disabled. `refs.viewport`, `notice`,
`retry` and `controls` supplement canonical modal refs.

## Controls and supported files

Drag/one-finger orbit; right-drag or modified drag pans; wheel/pinch zooms. Focus
canvas and use arrows to orbit, Shift+arrows to pan, + or - to zoom, Home to reset.
Labeled native buttons provide all operations. WebGL2 support is required.

Only GLB version 2, standard mesh geometry and embedded PNG/JPEG/WebP bufferView
textures are accepted. URI resources, including data URIs, are rejected before
rendering. Supported extensions: KHR_materials_specular, KHR_materials_unlit, KHR_texture_transform,
KHR_mesh_quantization, KHR_lights_punctual, KHR_draco_mesh_compression. Unsupported optional extensions are
removed from a detached copy before any loader handler runs, including features
known to Three but outside this supported subset. The viewer renders standard
glTF fallback data and shows a notice naming skipped features. Unsupported
`extensionsRequired` entries reject preview with their exact names.

For optional `KHR_materials_variants`, only each primitive's base/default material
is rendered; variant selection is not supported. Other optional compression/texture
features still need valid uncompressed geometry and embedded standard textures
as fallback. URI restrictions and geometry budgets apply to the original file,
including ignored extension payloads and alternate resources; this is not a way
to bypass validation. Original input bytes remain unchanged.
Cameras/animation playback are follow-up scope;
this version shows the default static scene using its own perspective camera.

Node `extras.pivot` is interpreted by the pinned loader as a private exporter
transform convention. The preview accepts only an array of exactly three finite
numbers for that convention. Descriptive strings and malformed pivot hints are
ignored in the loader's detached JSON before transforms are constructed; other
extras and the original GLB bytes remain unchanged. Finite numeric vectors retain
the loader's existing pivot reconstruction behavior.

Before importing the renderer, a separate fixed 128 MiB decoded geometry budget
checks all accessors (including unreferenced ones and zero-filled accessors without
bufferViews). Accounting includes copied bufferViews, twice each accessor's
float-width expanded size, sparse index/value storage, and the same accessor
reserve per primitive attribute/index/morph-target reference for conversion or
cloning. This conservative allocation estimate is independent of `maxBytes`;
raising the file cap does not raise it. It is not a cap on total browser/GPU
memory, decoded textures, or scene objects. Export smaller geometry on failure.
Counts, component types, strides, offsets and embedded bufferView ranges are
validated, as are sparse counts, index/value ranges and increasing in-range
indices. Small zero-initialized and sparse accessors remain supported.

## Dependency and deployment

Three.js 0.187.0 + GLTFLoader + OrbitControls (MIT) are pinned and built locally
with `node scripts/build.glb.runtime.mjs`. Commit the generated
`vendor/three/glb.runtime.js` and license with the source. Then rebuild main UI
with `npm run build:ui-bundle`. The renderer stays outside the main bundle and is
imported only after valid input is loaded. No third-party viewer, CDN, environment
map or remote decoder is contacted. Deploy vendor/three alongside js/css/dist preserving
the relative layout; a vendored main bundle needs ../vendor/three/glb.runtime.js.
CSP must allow same-origin scripts and blob images (embedded texture decoding).
Draco uses a same-origin worker; no remote model URL is used. All model-created texture URLs
are internal blob URLs; a loading manager additionally blocks non-blob resources.

Close/update abort reads, ignore stale imports/parses, disconnect controls and
resize observers, dispose geometries/materials/textures and ImageBitmaps, and
release the WebGL context. Parsing itself cannot be synchronously interrupted;
late parsed resources are disposed. Main UI adds only the modal wrapper/validator
and CSS. Rendering is on-demand rather than a permanent animation loop.

Run `node tests/glb.viewer.regression.mjs` for source/bundle desktop/mobile
browser WebGL rendering, lifecycle and input tests. The synthetic textured
fixture is reproducible with `python scripts/generate.glb.fixture.py` and has no
external asset license. See `demos/demo.glb.viewer.html` for interactive use.
Run `node tests/glb.data.regression.mjs` for allocation/range validation and to
regenerate the tiny oversized-accessor and valid sparse-triangle fixtures. The
browser suite verifies malicious input rejection before renderer loading and
renders the valid sparse fixture.
`node tests/glb.metadata.regression.mjs` verifies malformed pivot filtering and
finite-vector preservation. Synthetic parent-child string/numeric pivot fixtures
are rendered in all four browser modes and compared with exporter-container bounds.

### Wireframe mode

The accessible **Wireframe** button toggles `aria-pressed` and switches mesh
materials in place, preserving camera, target and controls. Textured/material view
is the default. Toggle off restores every original material's wireframe flag,
including material arrays and shared materials; materials and textures are never
replaced. Lines/points are unchanged. `viewer.setWireframe(true|false)` applies
only when ready and returns the resulting enabled state (false when unavailable).
`viewer.getState().view.wireframe` reports the current mode. Fit/Reset retain the
mode; close/reopen, reload, or a new source resets to the model's original view.
Each viewer owns its mode independently. Loading/error states disable the toggle.

## Bounded Draco decoding (candidate, not approved for adoption)

Draco indexed triangle meshes use locally pinned glTF decoder assets from Three
r187 under `vendor/three/draco-r187/`. Deploy this complete directory, including
worker.js, draco_wasm_wrapper.js, draco_decoder.wasm and the Apache-2.0 license.
CSP must permit same-origin workers/scripts/connect requests and WebAssembly
compilation (for strict policies, `wasm-unsafe-eval`). No JS decoder fallback or
CDN is used. Decoder construction is lazy after existing preflight validation.

The 128 MiB geometry accounting is unchanged. Additional Draco-only guards are
2,048 draws, 3,000,000 expanded scene triangles, 4,096 expanded nodes, depth 64,
and 1,024 compressed bufferViews. Both declared and loaded scene work are checked.
Decoded point/index/component counts must match accessors before JS output arrays
are copied; output is capped at 128 MiB across jobs. Decoder native WASM memory
has a separately enforced 128 MiB maximum; the reproducible build checks the
upstream binary hash before lowering its memory maximum. This is not a total
browser/GPU/texture memory guarantee. A valid scene can still exceed these limits.

One serial worker per parsing viewer, at most two concurrently per loaded runtime
module/realm, and a 60-second initialization/queue deadline. Third overlapping
decode gets an actionable retry error. Workers terminate on success, failure,
cancellation or source change; pending decode promises reject on cancellation.
Mesh output joins canonical resource disposal before renderer creation. The
original input remains owned by the caller; only detached parser bufferViews
transfer to workers. Standard uncompressed scenes retain their existing path.

Draco point clouds, triangle strips, sparse compressed attributes and non-indexed
compressed primitives are outside this initial candidate. No format or admission
claim is made for the separately isolated PR196 allocation prototype.

Tests: `node tests/glb.draco.setup.mjs`, `node tests/glb.draco.unit.mjs`, then
`node tests/glb.draco.regression.mjs`. The browser suite requires the authorized
private scene at `output/draco-assembled-private.glb` (not redistributed); its
SHA256 is checked. The reproducible cube uses dev-only draco3d 1.5.7. For the initial diagnostic see [historical decoder evidence](benchmarks/glb-draco-2026-11-06.md).
The separate .330 policy candidate now admits that scene in canonical mode; see
[policy evidence](benchmarks/glb-draco-policy-2026-11-06.md) and the exact
[Syndicatum deployment contract](glb-draco-deployment.md).

## Embedded WebP textures (.332 candidate)

`EXT_texture_webp` is supported through the pinned Three r187 loader's existing
handler. Only embedded `image/webp` bufferViews are admitted. Required and optional
extension references are checked before loading; URI resources remain forbidden.
RIFF lengths/chunk bounds, VP8/VP8L headers, VP8X canvas consistency, dimensions
and static-image structure are validated before native decoding. Animation is
rejected. Native decode failure is surfaced as an error rather than silently
displaying an untextured material. Successful and late-arriving bitmaps use the
existing disposal path on close, source change and failure.

New WebP limits: 4,096 pixels per dimension and 128 MiB aggregate reservation at
12 bytes per pixel per WebP texture definition (bitmap, GPU/mip storage and upload
reserve). This is a conservative admission estimate, not a browser-wide memory
guarantee; PNG/JPEG and other existing budgets are unchanged. Geometry, Draco
worker/output, hierarchy and render-work limits are unchanged. Small compressed
files can still exceed these independent decoded-resource limits.

Deploy `js/ui/ui.glb.webp.js` with the updated GLB data/viewer modules, loader,
UI JS bundle and `vendor/three/glb.runtime.js`. Decoder binaries are unchanged.
The candidate is not published until reviewed.

Tests: `node tests/glb.webp.unit.mjs` and `node tests/glb.webp.regression.mjs`.
Set `GLB_WEBP_PRIVATE=1` to additionally assert the exact authorized v013 geometry
rejection using `output/glb-v013-private.glb`; private bytes are not distributed.
See [v013 admission evidence](benchmarks/glb-webp-2026-11-07.md).

Format references: [WebP container specification](https://developers.google.com/speed/webp/docs/riff_container)
and [EXT_texture_webp](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Vendor/EXT_texture_webp).
