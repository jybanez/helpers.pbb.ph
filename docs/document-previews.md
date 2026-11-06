# HTML previews and approved Markdown images

Use the complete `ui.html.viewer` factory (`createHtmlViewer`) for static review
documents. It shares `content`/`url`, loading/error/empty states, fullscreen,
`headerActions`, `showDownload`, close and cancellation APIs with the other file
viewers. Preload the factory; call `open()` immediately on the user's action.
Document fetches and image resolution start only after the modal is visible.

```js
import {readDocumentImageResponse} from './js/ui/ui.document.images.js';

// Build this map from authorized project records, outside the untrusted document.
const approved = new Map(projectImages.map(file => [file.id, file]));
async function resolveImage(reference, {signal, alt}) {
  const file = approved.get(reference);
  if (!file) return null;
  // Server authorization remains mandatory. Disable redirects so this exact
  // approved endpoint cannot redirect the read to an arbitrary external URL.
  const response = await fetch(file.url, {
    signal, redirect: 'error', credentials: 'same-origin',
  });
  return readDocumentImageResponse(response, {signal});
}
const create = await uiLoader.get('ui.html.viewer');
const viewer = create({content: reviewHtml, resolveImage, headerActions});
viewer.open();
```

`resolveImage(reference, {signal, alt})` must return a PNG, JPEG or static WebP
`Blob`, or null/reject for unavailable/unapproved content. It receives an
**untrusted reference**, not an approved URL. Do not fetch it directly, infer
authorization from the document, use URL-prefix matching, or follow arbitrary
redirects. This contract intentionally has no default network resolver. The
stream helper checks HTTP status/MIME and caps bytes before creating the Blob;
the scope subsequently checks magic/header dimensions, decodes and re-encodes it.
The helper does not alter sharing or permissions.

## HTML subset and isolation

The original HTML is parsed in an inert template and never attached to the live
document. A fresh tree copies only passive HTML text/layout tags, raster image
placeholders and a fixed set of inline style declarations. The resulting document
runs in an iframe with an **empty sandbox attribute**: no scripts, same-origin
access, forms, popups, downloads or top-navigation allowances. Its CSP denies
network requests and allows only the generated inline layout styles and PNG data
images. It does not include input document URLs, scripts, CSS resource loads,
style/link/meta/base tags, embedded frames, SVG/MathML or event attributes. Links
become passive text. The parent viewer's host-supplied source/header actions are
separate from the sandbox and retain their existing semantics.

Supported layout: headings, paragraphs, emphasis, lists, code/pre, tables,
sections, figures/captions and images. Inline styles support basic display,
flex direction/wrap/alignment, one-to-four `fr` grid columns, text alignment,
font weight/style, whitespace, object-fit, numeric size/spacing and a narrow
color palette. CSS selectors, style blocks, custom properties, positioning,
URLs, functions and at-rules are not supported. Example:

```html
<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
  <figure><img src="approved-before-id" alt="Before" width="480">
    <figcaption>Original layout</figcaption></figure>
  <figure><img src="approved-after-id" alt="After" width="480">
    <figcaption>Proposed layout</figcaption></figure>
</div>
```

Opaque frames cannot access parent blob URLs, so approved images are re-encoded
as bounded static PNG data inside HTML. Incoming data URLs are never copied.
Closing or replacing content clears the embedded document. Tab leaving the
sandbox returns to Close; nested modal close restores the opener. Escape works
in the parent controls. Browser keyboard events inside an opaque frame do not
bubble to the parent: use Tab then Escape, or click Close while reading the frame.
No script permission is added to work around that isolation boundary.

## Markdown opt-in

```js
const create = await uiLoader.get('ui.markdown.viewer');
const viewer = create({
  content: '![Before](approved-before-id)',
  images: true,
  resolveImage,
});
viewer.open();
```

Images remain off by default. Standalone `createMarkdownView` supports the same
options in the full profile; compact images are intentionally unsupported. Raw
HTML remains escaped. Markdown image references go through the same approved
resolver and validation, never directly into `src`. Standalone views expose
`whenReady()`, `cancel()` and `getState().failedImages`; updates/destroy cancel
previous image work and revoke owned blob URLs. Existing Markdown link behavior
is unchanged. Rejected images retain alt text with an unavailable indication;
file viewers also show an image-failure count. Supply a corrected resolver or
content via `update()` to reload. No writes or automatic retries occur.

## Bounds and lifecycle

- Document: 256 KiB; HTML tree at most 10,000 nodes/depth 64.
- Images: first 24 occurrences, one resolution/decode at a time.
- Encoded input and re-encoded output: 8 MiB/image, 32 MiB each/document.
- Raster: maximum 4,096 per dimension, 16 megapixels/image, 32 megapixels total.
- Resolution/decode: 15 seconds/image, 30 seconds total loading deadline.

Extra image occurrences remain alt text. Browser decode rejects malformed
payloads; SVG, GIF and non-raster MIME are not admitted. Header checks precede
native decoding to limit decompression dimensions. These are admission budgets,
not a guarantee of total browser memory. Abort signals propagate to host reads;
late results are ignored and late decoded bitmaps are closed. Hosts must honor
the signal to stop their own network reads. Header callbacks must continue to
enforce their own authorization and uncertain-outcome protections.

Deployment includes the new `ui.html.document.js` and `ui.document.images.js`,
their `ui.glb.webp.js` dimension-validator dependency, updated Markdown/file
modules, registry, CSS and rebuilt UI bundle (candidate `.333`).

Validation: `node tests/document.preview.regression.mjs` checks source/bundle at
desktop/narrow widths, actual raster decode inside the opaque frame, hostile HTML,
CSP network blocking (server request counter), passive navigation, Markdown HTML
escaping, failure alt text, nested focus, actual Tab dispatch and cancellation.
Also run image-unit, existing Markdown/file-viewer and bundle/registry tests.
