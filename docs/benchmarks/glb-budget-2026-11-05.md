# GLB preview budget benchmark — 2026-11-05

## Decision proposed for review

Keep the deployed **128 MiB geometry accounting limit unchanged**. A **144 MiB comparison admits the vessel and rendered successfully on this desktop**, but these measurements do not establish 144 MiB as a safe universal default. Submit this evidence/harness for review; there is no production-budget candidate in this PR and no cache revision or bundle change.

A defensible follow-up is a reservation model covering geometry, wireframe, decoded textures, input/parser copies and overlapping previews. Treat 144 MiB as a bounded desktop experiment until that model and actual low-memory hardware have been evaluated. Neither the existing 128 MiB estimate nor 144 MiB is a total browser/GPU memory limit.

## Environment and method

- Baseline: Helper `0.21.328`, commit `5188b3c05f04b4776382b09a277531bf2cdf1c8a`; pinned Three `0.187.0`.
- Windows, Intel Core i3-1115G4 (4 logical CPUs), approximately 19.8 GiB visible RAM and 8.0 GiB free when inspected. No dedicated low-memory device was available.
- Headless Chrome 156.0.8078.80 reported **ANGLE Intel UHD Graphics, D3D11**. This run used the hardware GPU, despite allowing SwiftShader fallback in launch arguments.
- Desktop: 1200×800, CPU rate 1. Comparison: 375×800, CDP CPU throttling rate 4, same physical GPU/RAM. **This is CPU throttling and a narrow viewport, not a constrained-memory/mobile-hardware test.**
- Benchmark-only validator copies differ in their constant/error label (128 versus 144). Instrumented source wrapper/runtime are generated under `output/`; deployed files are untouched. Original URI, sparse, malformed, accessor range and decoded-geometry checks run before rendering.
- Each rendered case opens/closes three times. First cycle samples eight orbit actions in each mode; timings include `gl.finish()` plus a requestAnimationFrame boundary. They are small-sample interaction timings, not sustained FPS or statistically reliable p95 measurements. Open times include module/shader warm-up and 50ms readiness polling.
- CDP `Runtime.getHeapUsage` samples JS heap and backing storage after explicit GC at the active checkpoint and after final destruction. GPU buffer figures sum actual `bufferData` byte sizes for live buffer objects; they exclude driver allocation granularity, render targets, framebuffer/MSAA, textures and compositor overhead. They are **uploaded buffer sizes, not measured VRAM**.
- Runtime instrumentation deduplicates geometry attribute backing ArrayBuffers. Texture figures use observed decoded dimensions ×4 bytes/pixel and a 4/3 full-mip GPU estimate; native decoder memory and driver texture memory are not exposed by these measurements.
- Diagnostic references to detached canvases/contexts are cleared before final GC. An initial exploratory run retained these references and exaggerated post-close backing storage; it is not used for the cleanup conclusion below.

## Inputs and accounting

Vessel: `TWB_Vessel_450_v008.glb`, 24,091,672 bytes; SHA-256 `bb1ac773041be0e869312444758cea4e5da989c4b6aadc6a27b64b3276caa4ef`. The supplied URL was downloaded with a 25,000,000-byte limit after the profile-bound file reader returned 404. Original asset is kept local and is not committed or republished. It contains one mesh/primitive, four accessors, four bufferViews, 463,274 position vertices, 2,779,656 triangle indices, and no images. It is a collapsed mesh rather than a many-node assembled-scene case.

Synthetic inputs are generated reproducibly. Shared32 has 32 distinct mesh definitions referencing the same accessors; distinct32 uses equivalent geometry with distinct views/accessors. Distinct96 is the over-budget control. Texture2048 embeds a highly compressible 2048-square RGBA PNG in the small textured-room fixture.

| Input | File MiB | Existing estimate MiB | Unique loaded attribute buffers MiB | Uploaded textured / after wireframe MiB | Admission |
|---|---:|---:|---:|---:|---|
| Vessel | 22.976 | 136.078 | 22.974 | 22.974 / 44.181 | 128 rejects; 144 renders |
| Shared32 | 0.267 | 22.097 | 0.262 | 0.262 / 0.400 | 128 renders |
| Distinct32 | 8.392 | 50.720 | 8.372 | 8.372 / 12.802 | 128 renders |
| Distinct96 control | 25.177 | 152.159 | not loaded | not loaded | 144 rejects |
| Texture2048 | 0.022 | 0.0245 | 0.0008 | 0.0008 / 0.00094 | 128 renders |

Shared32 produces one cached geometry; distinct32 produces 32. The old estimate is conservative for repeated accessor references, but this does **not** imply every omitted cost can be removed safely. Node reuse can multiply draw calls without multiplying geometry buffers. The texture case adds **16 MiB decoded RGBA and approximately 21.33 MiB mipmapped texture storage**, almost entirely outside the geometry accounting.

## Responsiveness and retained memory

| Case | Desktop opens ms (3 cycles) | Desktop orbit median / max ms | Desktop wireframe median / max ms | CPU4 narrow opens ms | CPU4 wireframe median / max ms |
|---|---|---|---|---|---|
| Vessel, 144 | 234 / 82 / 81 | 16.6 / 17.2 | 41.7 / 89.2 | 322 / 5376 / 131 | 39.9 / 173.1 |
| Shared32 | 199 / 55 / 60 | 16.6 / 18.4 | 18.1 / 21.1 | 177 / 3575 / 82 | 17.4 / 20.9 |
| Distinct32 | 180 / 108 / 72 | 16.2 / 17.1 | 19.4 / 34.8 | 216 / 90 / 118 | 16.9 / 40.0 |
| Texture2048 | 253 / 108 / 112 | 15.8 / 17.7 | 16.7 / 16.8 | 335 / 212 / 242 | 16.5 / 28.9 |

The multi-second throttled reopen outliers are retained in the evidence, not discarded. This harness cannot distinguish context/shader setup, GPU scheduling, GC, or other host contention as their cause. Wireframe on the vessel is materially slower than the textured view even though admission succeeds.

After wireframe was enabled then disabled, the vessel retained about **67.87 MiB JS backing storage** and **44.18 MiB uploaded geometry buffers**; active JS heap was about 2.42 MiB. Wireframe indices remain cached until geometry disposal. These categories omit peak transient parser copies and driver/native allocations and must not be advertised as total process memory.

Two overlapping vessel previews with **independent source ArrayBuffers** reached **135.03 MiB backing storage**, **88.36 MiB uploaded geometry buffers**, and about **2.58 MiB JS heap**. The second used wireframe; the first retained its cached wireframe indices after toggling off. Their combined current per-preview geometry estimates would be 272.16 MiB. The earlier shared-source overlap samples in the main JSON are labeled separately and use about 112.06 MiB backing storage; use `overlap-results.json` for independent-source conclusions.

All tested close cycles reported zero tracked geometry buffers and context loss. Four internal/default texture handles per context did not receive individual deleteTexture calls before context loss; this is not evidence of four live textures after context destruction. Final destruction plus removal of diagnostic references and forced GC reduced backing storage to **about 0.72 MiB** and JS heap to roughly **2.4–2.6 MiB**, which includes loaded modules/harness. This is encouraging cleanup evidence over three cycles, not proof of long-run leak freedom or synchronous OS/driver memory reclamation. DOM counters and raw snapshots are included in the data.

## Loader/accounting audit

Inspected the pinned local Three sources:

- `GLTFLoader.getDependency` caches by dependency type/index. `loadBufferView` slices each requested view once; ordinary accessors use typed-array views of those cached bytes. Shared references do not inherently allocate a fresh copy per primitive.
- Missing-view accessors allocate zero arrays; sparse accessors backed by a view copy the base typed array before applying sparse values. Interleaved views are cached; conversions, morph targets and geometry cloning need explicit treatment rather than blanket deduplication.
- `loadGeometries` caches primitives by their attribute/index definitions; repeated nodes can clone scene objects while sharing geometry/material references. Distinct views do allocate separately, even if their contents are equal.
- `WebGLGeometries.updateWireframeAttribute` allocates six indices per triangle, using 32-bit elements when position count is at least 65535, otherwise 16-bit. These have CPU arrays and uploaded GPU buffers. The vessel adds 22,237,248 bytes (21.21 MiB) of wireframe index upload, matching the measured delta. They remain cached when toggled off and are removed on geometry disposal.
- GLB binary-body slicing, original input storage and optional-extension reserialization can create transient whole-buffer copies. Native image decode, GPU mipmaps and render targets are additional costs. Each independent preview owns a separate renderer/context and resource cache.

## Proposed strategy and review gate

1. Keep current 128 MiB admission and every validation rule in deployed builds. The 144 MiB comparison is successful for this vessel on the tested desktop, not a sufficient universal-cap justification.
2. Prototype an allocation-aware reservation with separate categories: original/temporary GLB bytes, unique bufferView copies, zero/sparse/conversion arrays, unique GPU attributes/index storage, worst-case wireframe CPU+GPU indices, and decoded/mipmapped textures. Keep all accessor/structural validation, including unused definitions; do not confuse deduplicated allocation accounting with permission to accept malformed references.
3. Bound image dimensions and aggregate decoded pixels **before decode**. Confirm dimensions after decode. A geometry-only threshold cannot prevent texture pressure, as the small texture fixture demonstrates.
4. Track aggregate reservations across active previews and release them on cancellation, failure and destruction. Queue/deny overlap that exceeds the reviewed aggregate allowance rather than applying an independent per-preview limit indefinitely. Peak parser/transient allocations and driver headroom must be reserved too.
5. Add separate structural/render-work bounds for nodes, primitives, morph targets and draw calls: shared geometry can be cheap in bytes yet expensive to render. Preserve uncertain-outcome/cancellation behavior and reject unsupported required extensions as today.
6. Before selecting a larger deployed cap or an aggregate numeric cap, run the same inputs on genuinely low-memory hardware, a lower-end GPU and software WebGL; extend to repeated lifecycle runs and texture-heavy overlap. The current evidence does not establish a defensible universal aggregate number. A reviewed desktop-only 144 MiB trial is a reasonable next experiment, with rollback and overlap/texture restrictions, rather than silently replacing the deployed default.

## Reproduction and evidence

1. Install repository dependencies. Place the authorized vessel file at `output/glb-budget-benchmark/vessel.glb`; verify the SHA above. The harness never downloads or redistributes it.
2. `node tests/glb.budget.setup.mjs` generates only local benchmark modules and synthetic fixtures.
3. `node tests/glb.budget.validation.mjs` runs malformed/sparse/resource regression against the isolated 144 MiB validator. The aggregate over-budget fixture is adjusted from 1.5m to 1.7m positions so it remains over the comparison cap; other cases are unchanged.
4. `node tests/glb.budget.benchmark.mjs` runs desktop and CPU4 narrow cases. Set `GLB_BENCH_OVERLAP_ONLY=1` to repeat only independent-source overlap and write `overlap-results.json`. Results are written under the same output directory.
5. Raw reviewed-run snapshots: [main results](glb-budget-2026-11-05-results.json), [independent-source overlap](glb-budget-2026-11-05-overlap.json). The main recorded run used shared input bytes for overlap; the current harness uses independent bytes. Timing results are machine/load-specific.

Original 128 MiB data, pivot and wireframe regressions passed; isolated 144 MiB validation passed. The first comparison-test invocation failed only because its assertion still expected the literal 128 MiB message; it was corrected to the comparison label and the above-cap aggregate control. No production modules, bundle outputs or release revisions changed; bundle rebuild is not required for this tests/report-only PR.
