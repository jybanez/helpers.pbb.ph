# GLB viewer (0.21.326)

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
KHR_mesh_quantization, KHR_lights_punctual. Other extensions (including Draco,
Meshopt and KTX2) produce an export-guidance error; export uncompressed geometry
and embedded standard textures. Cameras/animation playback are follow-up scope;
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
map or decoder is contacted. Deploy vendor/three alongside js/css/dist preserving
the relative layout; a vendored main bundle needs ../vendor/three/glb.runtime.js.
CSP must allow same-origin scripts and blob images (embedded texture decoding).
No rendering worker or remote model URL is used. All model-created texture URLs
are internal blob URLs; a loading manager additionally blocks non-blob resources.

Close/update abort reads, ignore stale imports/parses, disconnect controls and
resize observers, dispose geometries/materials/textures and ImageBitmaps, and
release the WebGL context. Parsing itself cannot be synchronously interrupted;
late parsed resources are disposed. Main UI adds only the modal wrapper/validator
and CSS. Rendering is on-demand rather than a permanent animation loop.

Run `node tests/glb.viewer.regression.mjs` for source/bundle desktop/mobile
software-WebGL rendering, lifecycle and input tests. The synthetic textured
fixture is reproducible with `python scripts/generate.glb.fixture.py` and has no
external asset license. See `demos/demo.glb.viewer.html` for interactive use.
Run `node tests/glb.data.regression.mjs` for allocation/range validation and to
regenerate the tiny oversized-accessor and valid sparse-triangle fixtures. The
browser suite verifies malicious input rejection before renderer loading and
renders the valid sparse fixture.
`node tests/glb.metadata.regression.mjs` verifies malformed pivot filtering and
finite-vector preservation. Synthetic parent-child string/numeric pivot fixtures
are rendered in all four browser modes and compared with exporter-container bounds.
