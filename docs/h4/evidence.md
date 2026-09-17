# H4 evidence and handoff

Scope: Syndicatum 2411. Isolated branch `ui/qr-png`, starting from Helper
39070479d85163de3c74d03018ad089cbeb04baf. Dependency selection was recorded in
48313e597615939f05e40aa47b3a5f08ad85b384 before runtime implementation.

H4 is an optional standalone artifact. No existing main loader, registry entries,
main JS/CSS bundle or H2 source changed. No Bimo source/pin was changed. Install
only the reviewed H4 file, preserving accepted H2 0c36e28. API and exact hashes:
[contract](contract.md), [manifest](manifest.json), [provenance](dependencies.md).

## Checks performed

- `node tests/h4.regression.mjs`: Edge 154.0.4258.12, headless Windows,
  source and minified bundle × widths 320/360/1024 (768px height): all six cases
  passed. The fixture serves Bimo's accepted H2 loader directly from immutable
  Git object 0c36e28 and resolves both additional registry keys with bundle
  preference enabled, without installing a replacement loader.
- Independent jsQR decoding matches ASCII and Unicode payloads from QR pixels
  in all six cases; the 2048-byte ceiling round-trips on both delivery paths.
  Tests reject 2049 bytes, excess Unicode byte length, malformed UTF-16, empty
  input, fractional module scale, inadequate quiet zone and QR-version capacity.
- Synthetic composed Canvas -> PNG Blob -> decoded pixels matches the payload.
  Click-driven download is initiated, observed through Edge's download event,
  saved to disk, read back and independently decoded. Six first downloads plus
  six re-downloads were saved. First saved file size: 15,216 bytes per case.
  This is actual saved-file evidence in the automated desktop browser, not just
  a Blob return value. It is not a real-device download observation.
- Error/lifecycle checks pass for invalid/missing canvas, null export, thrown
  export, actual cross-origin tainted Canvas, invalid update clearing old pixels,
  destroy idempotence, stale export rejection/late callback suppression, temporary
  anchor removal and URL revocation on cancel/destroy. App-owned canvas dimensions
  remain unchanged. Timed URL expiry and 30-second encoder timeout are implemented
  but were not separately wall-clock exercised.
- No QR/export network requests occur in the measured phase; the sole deliberate
  later cross-origin request is a synthetic one-pixel image for the taint test.
  The decoder is QA-only and absent from the runtime artifact.
- Bundle demo generated at each width; 320px screenshot visually inspected.
  Demo is a synthetic composition, not Bimo's voucher design. Exported QR remains
  at integer pixel scale; responsive preview scaling does not alter PNG pixels.
- Existing `node tests/ui.bundle.contract.mjs` and
  `node tests/registry.contract.mjs` passed (118 entries / 9 groups).
- `node tests/h4.contract.mjs` passed: exact source/vendor/artifact hashes,
  public exports/registry, retained runtime license, no QA decoder or network API
  in the artifact. Rebuild retained the same tested runtime hash.

Machine-readable results, saved images and demo screenshots:
`output/playwright/h4/results.json` and adjacent PNGs.

## Execution notes and limits

Early harness attempts were interrupted while diagnosis was in progress; those
partial runs are not claimed as passes. Large raw RGBA arrays were replaced by
base64 transport for lower browser-protocol overhead. An isolated 2048-byte
encode/decode also passed (about 192ms / 386ms on that run). The final complete
matrix above is authoritative, not earlier incomplete outputs.

Build: `node scripts/build.h4.mjs`, esbuild 0.28.0 using the existing matching
Windows executable through ESBUILD_BINARY_PATH. It creates only the optional
H4 artifact, generated encoder ESM and manifest. `npm run build:ui-bundle` was
not rerun because no source/loader in its registry or bundle scope changed.

No actual mobile hardware, Safari/Firefox, AT, production, live tokens, real Bimo
voucher or commercial-invariant testing. Bimo owns asset-readiness checks and
must not export a canvas with missing assets; this helper cannot infer missing
content from completed pixels. Final actual voucher decode/readability/save/
re-download and unchanged wallet/claim/capacity checks remain Developer work.
Reviewer must approve this exact package before adoption. Stage8 remains out of scope.

```powershell
$env:ESBUILD_BINARY_PATH = 'C:/wamp64/www/hotline-helpers/node_modules/@esbuild/win32-x64/esbuild.exe'
node scripts/build.h4.mjs
node tests/h4.contract.mjs
$env:PLAYWRIGHT_MODULE = 'C:/wamp64/www/bimoperks/node_modules/playwright/index.mjs'
node tests/h4.regression.mjs
```
