# Isolated GLB allocation-budget prototype

**Experimental review artifact, not a release or an adoption candidate.** No file under `js/`, `css/` or `dist/` changes. The deployed Helper .328 viewer keeps its 128 MiB behavior. This experiment generates a wrapper and validator copy only under `output/` and uses the existing canonical modal and renderer.

## Proposed bounds (not hardware-certified)

| Resource | Proposed experiment bound |
|---|---:|
| Per-preview conservative reservation | 256 MiB |
| Aggregate reservation in one browser realm | 384 MiB |
| Simultaneous reserved previews | 2 |
| Triangles per preview / aggregate | 2,000,000 / 2,000,000 |
| Draws per preview | 256 (at most 512 across two previews) |
| Expanded node visits / depth | 2048 / 64 |
| Total primitive definitions / accessor or view definitions | 2048 / 16384 |
| Image / texture / material definitions | 64 / 128 / 512 |
| Decoded pixels / maximum image edge | 16,777,216 / 4096 |
| Input / JSON chunk | 64 MiB / 4 MiB |

These values are **proposals for testing**, not measured safe universal caps. The 256 MiB bound admits the measured vessel with explicit conservative reservations; 384 MiB blocks two such reservations. A fixed 32 MiB allowance for renderer/framebuffer/driver overhead is included but is not a proof of a peak-memory upper bound. Device pixel ratio, framebuffer dimensions, native decoders and driver allocations require better accounting before adoption. The realm-local pool does not coordinate independent tabs or workers.

## Accounting

`budget.mjs` returns named categories; estimates remain immutable. Admission uses:

- Three times input bytes for original/binary-body/possible prepared-GLB copies, plus eight times JSON bytes for parse/string working space. These are conservative heuristics; measured transient allocation coverage is still needed.
- Each bufferView definition once, matching cached loader slices. Distinct definitions are not merged merely because byte ranges or contents match.
- Unique accessor GPU reserve at float-width expansion or interleaved stride, whichever is larger. This deliberately counts unused definitions and may overestimate interleaved sharing.
- Two expanded CPU copies for sparse or absent-bufferView accessors. Full original range/sparse checks remain mandatory.
- Two additional attribute/index copies per **identical primitive definition**, covering conversion/clone CPU+GPU work. Deduplication requires exact primitive metadata with the same accessor indices, reflecting the pinned loader's primitive cache. Different material/metadata definitions remain separate conservatively.
- Worst-case wireframe indices, CPU plus GPU: six per triangle, 32-bit at 65535 position vertices or more, otherwise 16-bit. Reservation remains held after turning wireframe off, matching runtime caching.
- Two RGBA copies per decoded image plus a full 4/3 mip estimate per texture definition. PNG dimensions are checked before renderer/decode invocation. Image definitions are counted separately even when they reference the same bytes.
- A 32 MiB per-context overhead allowance.

Render work walks scene roots and counts each expanded instance, including shared nodes/geometry, with cycle/depth checks. Deduplicated geometry memory does not remove instance draw/triangle cost. All scene definitions are included conservatively.

## Validation and compatibility boundaries

The injected validator is copied from the current production validator; only its obsolete geometry-accounting threshold is lifted for the isolated experiment. The new estimator runs before it and then delegates full GLB/container, URI, bufferView, accessor, sparse and required-extension validation before mounting. Arithmetic uses safe-integer checks. Unsupported optional extension stripping remains the original `prepareGlb` behavior.

This first prototype **fails closed** for skins, animations, morph targets, non-triangle primitives, non-PNG textures and PNG bit depths other than 8. Those paths need verified allocation models; this is deliberately narrower than the canonical viewer, not a compatible replacement. Missing required fallback attributes fail. PNG headers are read before decode, but post-decode dimension reconciliation and accurate native image working-space accounting remain adoption blockers. The original validator is not upgraded into a complete glTF schema validator by this work.

## Reservation lifecycle

Acquisition checks allocation, render work and context bounds atomically before incrementing the shared pool. Rejections do not consume a reservation. Release is idempotent.

The generated wrapper attaches a lease to an initializing load. Closing aborts the load but **keeps its lease until the asynchronous import/mount settles**; a late read does not acquire a lease. On successful mount the lease transfers to the runtime disposal wrapper. Failure/cancellation releases through `finally`; close/reload/destroy release through runtime disposal. A superseding context cannot reuse a pending decoder's reservation prematurely. Driver reclamation may still be asynchronous after `dispose`/context loss; this pool is an estimate of ownership, not an OS memory monitor.

## Results on the benchmark desktop

Original vessel hash: `bb1ac773041be0e869312444758cea4e5da989c4b6aadc6a27b64b3276caa4ef`. Asset stays local and is not committed.

| Fixture | Reservation MiB | Prototype outcome |
|---|---:|---|
| Vessel | 251.15 | Rendered; second vessel denied by aggregate reservation |
| Shared32 | 34.37 | Rendered; two independent previews allowed |
| Distinct32 | 106.33 | Rendered |
| Distinct96 | 254.99 | Rendered under new accounting |
| Texture2048 | 85.43 | Rendered; includes decoder/mip reservation |
| Distinct128 | above 256 | Rejected before mounting |

Distinct96 was an over-144-MiB control under the old accounting. Its admission here is an **intentional policy difference**, not a claim that its old result was invalid. Distinct128 is the new allocation-overflow control. Repeated-instance render work and aggregate triangles also have independent rejection tests.

Browser checks passed at desktop 1200×800 and 375×800 with CPU4 throttling on the same Intel UHD D3D11 GPU. Three open/wireframe/close cycles passed for each admitted fixture, with reservations zero after close and WebGL context loss. Tests also cover large overlap denial, small overlap admission, immediate cancellation while loading, late read, failed renderer initialization, and preservation of the first preview's reservation when another is denied. Node tests cover exact wireframe reservation, shared versus distinct accounting, valid/invalid sparse data, malformed references, URI denial, unknown required extensions, oversized counts, texture dimensions/aggregate pixels, cyclic graphs, context/triangle limits and repeated release.

**No genuinely constrained-memory hardware was available. CPU throttling is not that evidence.** The prior benchmark report records memory measurements and timing outliers. This prototype run tests admission/lifecycle behavior, not a new calibrated peak-memory or sustained-performance claim. Raw estimates and browser timings are attached alongside this README. Original production data/pivot/wireframe regressions also passed.

## Reproduce

1. Install repository dependencies and obtain the authorized vessel file as described in `docs/benchmarks/glb-budget-2026-11-05.md`.
2. `node experiments/glb-budget/setup.mjs`
3. `node experiments/glb-budget/regression.mjs`
4. `node experiments/glb-budget/browser.mjs`

The setup regenerates synthetic fixtures and isolated wrapper/validator files under `output/`. No deployed bundle rebuild or revision change is needed. The browser runner uses the installed Chrome/Edge and a temporary profile; it never touches a user's browser profile.

Before any adoption: review the exact candidate, model remaining supported glTF/image paths, verify image dimensions after decode, quantify framebuffer/driver/transient reserves, exercise long-run cancellation/overlap, and test actual constrained hardware. Keep deployed 128 MiB unchanged until a separate reviewed integration decision.
