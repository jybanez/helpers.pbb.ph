# H4 dependency selection (recorded before implementation)

Authority: Syndicatum 2408/2409/2411. Selection date: 2026-09-18.

Runtime encoder: Project Nayuki QR-Code-generator, exact source revision
`3c6d0b3cefb4e049dc337e82237c9644399716a8` (revision is the version pin, not an invented semantic release).
Primary source: https://github.com/nayuki/QR-Code-generator/blob/3c6d0b3cefb4e049dc337e82237c9644399716a8/typescript-javascript/qrcodegen.ts
Vendored unchanged in `vendor/h4/qrcodegen.ts`; MIT notice is embedded in its header.
SHA256 original bytes: `1dc03fb5a10e0e2318ea162755bbdb9977ca6ce52cff959e9c9b6deafdccda9c`.
Pure TypeScript namespace, no imports/network/DOM dependency; esbuild 0.28.0 can
transpile it for browser ESM with an explicit namespace export appended by the
build, preserving the unmodified upstream source. Preserve full MIT notice in
generated distribution. Use byte segments and UTF-8 ECI, fixed error correction
and automatic QR version selection; no upstream algorithm modification.

Independent decoder: jsQR 1.4.0, Apache-2.0, exact upstream revision
`8e6a036beafa7053dd44b1b76ac578d22b1b3311`.
Primary source: https://github.com/cozmo/jsQR/tree/8e6a036beafa7053dd44b1b76ac578d22b1b3311
Unchanged `dist/jsQR.js` vendored as `tests/vendor/h4/jsQR.cjs`, SHA256
`3325b0888fa4745c4e6940897d8c4f426fbaae76901fcbfe1871a04e90a51655`.
Full LICENSE retained, SHA256
`c6596eb7be8581c18be736c846fb9173b69eccf6ef94c5135893ec56bd92ba08`;
upstream package metadata retained beside it. UMD accepts RGBA arrays and runs
under Node or browser; no native dependency required. QA only, never included in
the runtime package/registry. Compatibility will be demonstrated by independent
rendered and PNG round trips, not inferred from matching encoder logic.

Both upstream artifacts were retrieved directly from their pinned GitHub raw
URLs. No runtime CDN or external QR service. Vendored bytes use `-text` Git
attributes to retain upstream hashes across Windows checkouts. End-of-line
whitespace checking is disabled only on vendored/generated vendor-bearing
artifacts so the upstream license header can remain unchanged.
