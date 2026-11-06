# Separately reviewable Draco work-policy candidate

This policy is stacked on PR197 decoder head
`47107c178fb16e8bc0fb68568ba8fdb301f65dc5`. It is not merged or approved for
production adoption. PR197 remains unchanged and independently reviewable.
Candidate cache revision: **0.21.330**. PR196 remains isolated.

## Policy and original scene

The single shared policy constant admits at most **2,048 draws and 3,000,000
triangles** across expanded scenes. Both preflight and loaded-scene checks use
it; transparent double-sided passes count toward the budget. Other guards stay
unchanged: 128 MiB geometry accounting, 128 MiB decoder native heap maximum,
128 MiB aggregate decoded output, two concurrent decoding workers per runtime
realm, serial jobs per worker, 60-second queue deadline, 4,096 expanded nodes,
depth 64, 1,024 compressed bufferViews, input/resource validation and cleanup.

The original private scene SHA256 is
`a971be6d84a606e33f78bcb1ce39a4e75e56dabd0529a5dbb22507a8e5814fde`.
It is neither changed nor redistributed. It has 2,094,698 instance triangles and
1,458 primitive draws; accounting for the transparent two-pass material gives
**2,094,890 triangles / 1,459 draws**. This fits the proposed bounds without
raising any decoded-memory limit. No per-file exception or allowlist is used.
The new limits leave roughly 43% triangle and 40% draw headroom above this scene;
they are a bounded policy proposal, not a universal device-safety guarantee.

## Canonical tests

The full private scene runs through the actual source and main-bundle viewer,
without the earlier diagnostic override. Each of the four modes uses ten
open/render/wireframe/close cycles and a first-cycle sustained control window of
at least 60 seconds. The sustained sequence alternates orbit, pan, zoom, Fit and
Reset, toggles wireframe every ten operations, calls `gl.finish()`, then pauses
200 ms. It checks finite camera state, live context and zero decoder workers
after parsing throughout. Closing checks lost contexts and zero tracked workers.
Each mode also closes during decode and changes source during decode, checking
no late canvas and successful replacement. These are lifecycle assertions, not
native-memory leak-freedom measurements.

Admission controls reject 2,049 draws, a declared 3,001,000-triangle scene, and
1,025 double-sided transparent instances (2,050 draws), before worker creation.
The triangle control intentionally lies about compressed counts and must be
rejected by declared-work admission before decoding. Unit tests include exactly
2,048 draws and exactly 3M triangles, plus one step over. Corrupt compressed
bytes/count mismatch, cyclic graphs, actual native memory growth past 128 MiB,
third-worker overlap, abort and deadline settlement remain covered.

Existing uncompressed browser, geometry/sparse/URI/extension, pivot, wireframe,
registry and bundle checks are also retained. Runtime and main UI JS bundle
were rebuilt; unchanged CSS/game/inspection artifacts were restored.

## Environment and interpretation

Windows Chrome, Intel UHD D3D11 hardware WebGL; desktop 1200×800 and narrow
375×800 with CDP CPU throttling rate 4. CPU4 is not proof of worker throttling,
low-memory hardware or mobile GPU capability. Developer confirms no genuine
constrained device/tester identified (#14407). That coverage remains unavailable.

Timings below include GPU completion and are observations from this run. They
are not FPS guarantees. The first source-desktop run overlapped a separate CSP
smoke browser briefly, so its wall times may reflect host contention. Raw samples
are retained; no outliers are discarded. Neither browser/native memory peaks nor
VRAM allocation were measured. The initial CSP smoke and the 40-cycle run passed all viewer assertions, but
both exited with Windows EBUSY during temporary test-profile deletion. The
harness now waits for the browser socket to close, allows a longer graceful
shutdown interval, and retries deletion asynchronously. The CSP allow/deny run
was repeated successfully; the full 40-cycle interaction run was not repeated
solely for this harness cleanup change. Automatic approval review blocked a
separate cleanup of the two old profile directories, so those are left in place.

## Deployment and reproduction

See [Syndicatum deployment contract](../glb-draco-deployment.md) for exact public
worker/wrapper/WASM URLs, MIME types, CSP and adoption smoke checks, and
[asset hashes](glb-draco-policy-assets.json) for the complete changed/new runtime
asset set against the .328 baseline. Live worker deployment is unverified.

Run `node scripts/build.glb.runtime.mjs`, `npm run build:ui-bundle`,
`node tests/glb.draco.setup.mjs`, `node tests/glb.draco.unit.mjs`, then
`node tests/glb.draco.regression.mjs` with the authorized private fixture in the
location documented by PR197. For the separate strict-CSP allow/deny smoke run,
set `GLB_DRACO_CSP=1` and run the same browser runner; unset it afterward. The
positive worker policy allows only same-origin scripts/connect plus WASM
compilation. The negative worker policy omits WASM permission and must produce
a visible error with no worker/canvas left behind.

No merge or adoption is authorized by these results; both decoder and policy
review, followed by application-specific installed/live smoke checks, are required.

## Recorded interaction samples

| Mode | Open-to-ready range (s) | Sustained actions | Median / observed p95 / maximum action (ms) |
| --- | --- | --- | --- |
| source-desktop | 3.88–6.87 | 264 | 21.2 / 31.6 / 42.1 |
| bundle-desktop | 3.10–4.29 | 265 | 21.2 / 31.9 / 38.4 |
| source-cpu4 | 3.43–3.89 | 215 | 32.6 / 85.3 / 128.1 |
| bundle-cpu4 | 3.50–4.99 | 212 | 30.6 / 78.2 / 133.2 |

Each row contains ten successful lifecycle cycles and at least 60 seconds of paced interaction. Observed percentiles summarize only those samples. [Raw samples](glb-draco-policy-results.json).
