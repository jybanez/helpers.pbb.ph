# ZIP viewer (0.21.324)

`ui.zip.viewer` exports `createZipViewer(options)`, a complete canonical fullscreen
modal composed with `ui.tree`. It lists directory metadata without decompressing
entries. Preview and download extract only the selected file, verifying size and
CRC before returning any bytes. No archive contents are executed or unpacked to disk.

## Application contract

Options: `title`, `source` (Blob/File/ArrayBuffer) OR
`load({signal, context})` returning those bytes; `context`, `onClose`, `open`;
`canPreview(entry)` (synchronous boolean), and
`onPreview({entry, blob, signal, context, restoreFocus})` (may return a Promise).
If `onPreview` is absent or `canPreview` returns false/throws, Preview is disabled;
Download remains available. `entry` is a detached descriptor:
`{id, path, name, size, compressedSize, directory}`. Sizes are bytes. IDs apply
only to the current archive. The verified Blob uses application/octet-stream;
the application routes it by the entry name and its own content policy.

Methods: `open(patch?)`, `update(patch)`, `reload(): Promise<boolean>`, `close()`,
`destroy()`, `preview(id): Promise<boolean>`, `download(id): Promise<boolean>`,
`focusSelected()`, `getState()` (open/status/error/selectedId/entries/destroyed).
Entry operations return false on failure/cancellation. Download true means the
browser download was requested, not that the user saved it. Status values are
idle/loading/ready/extracting/error/closed/destroyed.

`open` shows immediately before reads. Duplicate openings do not reload.
Source/load/context/callback changes invalidate old work and reload if open.
Close/destroy abort reads and extraction, release the archive/tree and revoke
download URLs; late results are ignored. Selection operations serialize. Cancel
entry operation preserves the directory. Errors remain visible and dismissible.
No mutations or automatic retries occur. Source bytes are snapshotted locally.

The app owns authorization and bounded transport: cap at 64 MiB while streaming,
honor cancellation, and recheck context before opening any child. Helper's size
check cannot bound memory already allocated by an application's load callback.
The listing remains open behind a child preview. Focus is moved to the selected
entry before invoking the callback; use its guarded `restoreFocus` in the child's
onClose. Abort the child when `signal` fires; it covers archive close/change and
the next entry operation. Guard child identity rather than destroying a newer child.
Once the callback owns a Blob, its lifetime/resources belong to the application.

```js
const create = await uiLoader.get('ui.zip.viewer');
const createGlb = await uiLoader.get('ui.glb.viewer');
const archive = create({
  load: ({signal}) => readAuthorizedZipWithByteCap(signal),
  canPreview: entry => /\.glb$/i.test(entry.name),
  onPreview: ({blob, signal, restoreFocus}) => {
    if (signal.aborted) return;
    const child = createGlb({source: blob, onClose: restoreFocus});
    signal.addEventListener('abort', () => child.destroy(), {once: true});
    child.open();
  }
});
archive.open();
```

## Bounds and format subset

Hard ceilings: 64 MiB archive, 4 MiB combined directory/local-header metadata,
2000 entries, 1024 UTF-8 bytes per path, depth32, 64 MiB per expanded entry,
256 MiB total declared expanded bytes. Extraction checks every output chunk
against both the declared size and entry cap, then verifies final size and CRC32.
These are data ceilings, not a total browser memory guarantee; archive snapshots,
selected compressed/output chunks and application-owned previews need extra memory.

Ordinary single-disk stored (method0) and raw-deflated (method8) records, including
ordinary data descriptors, are supported. The parser validates contiguous local
ranges, central/local names/flags/sizes/checksums, descriptor values and extra-field
ranges. It rejects overlap, prefixes/trailing unexplained data, ZIP64, encryption,
unsupported methods/flags, links/special files, unsafe traversal/absolute paths,
backslashes/colons/control characters, Windows reserved names, non-NFC names,
case-insensitive duplicate/conflicting paths and ambiguous folder casing.
Names must be UTF-8 flagged or ASCII; legacy non-ASCII names and alternate Unicode
path extra fields are unsupported. Explicit directory records must be empty/stored.
Use a standard UTF-8 stored/deflated ZIP export if a file is rejected.

Format reference: [PKWARE APPNOTE](https://pkware.cachefly.net/webdocs/casestudies/APPNOTE.TXT).
CRC is corruption detection, not authentication. Application authorization remains
required. No nested archive auto-extraction or content sniffing/execution is provided.

## Deployment and verification

Deploy `js/ui/ui.zip.runtime.js` alongside normal js/css/dist layout. It is imported
locally only after archive bytes arrive and is not inside the main bundle. Bundle
deployments retain `helpers.ui.bundle.min.js` and resolve the runtime through
`../js/ui/ui.zip.runtime.js?v=0.21.324`; source uses `./ui.zip.runtime.js`.
No third-party ZIP script/CDN or worker is used. Deflate requires the browser's
`DecompressionStream('deflate-raw')`; unsupported browsers receive a visible error.
Downloads use temporary blob URLs. Preview callbacks must apply their own CSP and
content-type restrictions.

`python scripts/generate.zip.fixture.py` regenerates synthetic nested GLB, stored,
deflated, descriptor, malformed, CRC and expansion fixtures. Run
`node tests/zip.runtime.regression.mjs` and `node tests/zip.viewer.regression.mjs`.
The latter tests source/bundle desktop/mobile and a child GLB preview with software
WebGL. Rebuild main assets with `npm run build:ui-bundle`; runtime deploys separately.
