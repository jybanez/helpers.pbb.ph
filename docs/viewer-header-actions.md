# Viewer header actions

Candidate cache revision `0.21.331` adds the same `headerActions` option to GLB,
ZIP, PDF, JSON, Markdown, CSV and shared image/video viewers. Use the complete
viewer factory and its existing `update()` API; do not insert buttons into its DOM.

```js
const headerActions = [
  { id: 'copy-url', onClick: () => navigator.clipboard.writeText(canonicalUrl) },
  { id: 'download', onClick: ({ signal }) => downloadAuthorizedFile(fileId, signal) },
];
const viewer = createJsonViewer({
  title: 'Project data',
  sourceUrl: canonicalUrl,
  load: loadAuthorizedText,
  headerActions,
  showDownload: false,
});
viewer.open(); // Show immediately; the viewer owns loading/error presentation.
```

The host owns authorization, canonical URLs and download transport. The example's
load/download functions are application callbacks, not Helper exports. Actions
never infer a permanent URL from a blob URL, an archive entry or a preview URL.

## Descriptor contract

`headerActions` accepts an array or a synchronous function returning an array.
Each descriptor supports `id`, `label`, `icon`, `onClick`, `disabled` and `hidden`.
Hidden descriptors and descriptors without a callback are omitted. Standard IDs
`copy-url` and `download` supply their default icon and accessible label. Other
actions require a label and should supply an icon key from the Helper catalog.
Labels appear as native tooltips and accessible button names.

Other actions come first, then Copy URL, then Download, immediately before the
existing Close button. Buttons are icon-only and retain keyboard focus styling.
Existing Close visibility options still apply. An empty array keeps existing
viewer chrome. The factory callback receives `{context}`, plus `{format}` for
text-file viewers, `{url}` for PDF, or `{item, index}` for media. The `context`
property is the host-provided viewer option.

`onClick` receives that same context plus the click `event` and an `AbortSignal`.
Its own button becomes busy/disabled until the returned promise settles, without
closing the viewer or changing content loading state. A rejection displays an
accessible error below the actions. Close, destruction, action updates and source
changes cancel pending handlers; hosts must honor the signal where possible.
Helper ignores late completions and never automatically retries a handler.
Aborting a handler cannot undo a server mutation already accepted by the server.

Header actions remain available during content loading and error states. Set
`disabled: true` until required authorization or data is available, then update the
descriptors. Their availability must not be inferred from preview success.

## Duplicate downloads and archive entries

JSON, Markdown and CSV support `showDownload: false` to hide their legacy source
Download link. Open source and Fullscreen remain in a secondary header when custom
header actions are present. ZIP row downloads remain independent archive-entry
actions; custom archive-level Download does not remove them. GLB, PDF and shared
media do not add a second Helper download button automatically. Browser-owned PDF
and native video controls are outside this header API.

For a nested archive preview with no permanent URL, supply only a supported
Download handler, or no actions. For a media sequence, use a factory:

```js
headerActions: ({item}) => [
  ...(item.canonicalUrl ? [{
    id: 'copy-url', onClick: () => navigator.clipboard.writeText(item.canonicalUrl),
  }] : []),
  ...(item.download ? [{ id: 'download', onClick: item.download }] : []),
]
```

Markdown accepts text content through its existing renderer. There is no separate
plain-text viewer factory in this release; application-owned text previews should
use their existing complete component rather than reinterpret plain text as HTML.

## Verification

Run `node tests/viewer.header.actions.regression.mjs` for source/bundle variants at
desktop and narrow widths. Coverage includes loading/error headers, action order,
host callbacks, rejection feedback, cancellation, duplicate-download suppression,
fullscreen, nested PDF/media focus return and item-specific media actions.

Generic modal consumers can opt into `headerActionsWhileBusy: true`; its default
is false. This affects only header action controls, not body/footer form controls,
and does not bypass validation or change submission behavior.
