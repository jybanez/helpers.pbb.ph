# JSON, Markdown and CSV viewers

Revision candidate: **0.21.223**. These complete components compose the canonical
Modal with Data Inspector, Markdown or Grid. They are read-only previews, not editors.

```js
const createViewer = await uiLoader.get("ui.json.viewer");
// Also: ui.markdown.viewer and ui.csv.viewer
const viewer = createViewer({ title: "Project configuration", url: fileUrl });
viewer.open();
viewer.update({ url: anotherFileUrl });
viewer.update({ content: alreadyLoadedText, sourceUrl: originalFileUrl });
await viewer.close();
viewer.destroy();
```

Preload factories at application initialization; `open()` synchronously mounts and
focuses the modal before issuing a URL read. Do not fetch first. Source loading uses
the modal's supported busy state; close, Escape and backdrop remain available.

## Options

| Option | Default | Contract |
| --- | --- | --- |
| `title` | Format + Viewer | Plain text dialog title and accessible name |
| `url` | empty | Relative or absolute HTTP(S), or caller-owned blob URL |
| `content` | null | Already-loaded text string; mutually exclusive with url |
| `sourceUrl` | empty | Optional original URL for source links when content is supplied |
| `open` | false | Open on construction |
| `fullscreen` | false | Canonical modal full-viewport layout; toolbar toggles it |
| `headers` | true | CSV only: first record supplies column labels |
| `limits` | See below | Positive integer limits; callers may lower, never raise ceilings |
| `onClose(meta)` | absent | Called by canonical modal after closing |

Invalid options throw before altering an existing view. An update containing `url`
clears `content`, and one containing `content` clears `url`; supplying both is an
error. `sourceUrl` is caller metadata and must be updated or cleared when it no
longer identifies the supplied content. Source/header/limit changes reload an open
viewer. Title/fullscreen updates preserve rendered state. A closed viewer defers
reads until opened. Repeated `open()` calls do not duplicate reads.

## API and states

- `open(options?)`: open, optionally changing source/options; false after destroy.
- `close(meta?)`: canonical asynchronous close; aborts reads immediately through
  the before-close hook and restores focus after its closing transition.
- `update(options)`: validates then applies options; false after destroy.
- `reload()`: Promise for a new read/render when open. Errors become visible state.
- `destroy()`: terminal, idempotent disposal, aborts reads, removes content/listeners,
  unlocks scrolling and restores connected opener focus when open.
- `getState()`: `{ format, open, destroyed, status, error, rowCount, fullscreen }`.
- `refs`: canonical modal refs plus `content`, `status`, `retry`, `external`,
  `download`, `fullscreen`. Use public methods for lifecycle changes.

Status is `idle`, `loading`, `ready`, `empty`, `parse-error`, `fetch-error` or
`destroyed`. After close status describes the last operation; `open` is authoritative
for visibility. Fetch errors (including decoding/read-limit failures) and URL parse
errors expose Retry. Loaded-content parse errors require corrected content via
`update`. No error automatically retries. Source switch/close/destroy invalidates
pending work, aborts the read and ignores late results even if transport ignores abort.

## Format policy and ceilings

| Format | Byte ceiling (UTF-8) | Additional ceilings |
| --- | --- | --- |
| JSON | 1 MiB | 5,000 nodes, depth 32 (root is depth 0) |
| Markdown | 256 KiB | Canonical renderer's full safety policy |
| CSV | 2 MiB | 20,000 data rows, 128 columns, 200,000 total cells including header |

Limits reject oversized input rather than silently truncate it. Responses are read
as bounded streams, checking advertised length and actual decoded-stream bytes.
UTF-8 is required; one optional leading BOM is stripped. Invalid UTF-8 is an error.

JSON uses `JSON.parse`, never evaluation. Inspector currently eagerly renders the
whole tree; the node/depth limits protect this complete component. Valid JSON null
uses a literal text node because Inspector treats null as absent data. Other scalar
values, objects and arrays use Inspector unchanged. Large numbers follow JavaScript
JSON number precision; source links retain the original file.

Markdown uses `ui.markdown` full profile with safe links in a new tab. Raw HTML stays
literal, images are disabled, and sanitizer/fallback behavior is unchanged. See
[Markdown policy](markdown.md). Relative Markdown links are not rewritten against
the source URL; canonical policy permits absolute HTTP(S)/mailto links only.

CSV uses comma delimiters, optional header record, CR/LF/CRLF record endings, quoted
fields, doubled quote escaping and embedded newlines. Spaces are preserved; characters
after a closing quote, quotes inside unquoted fields, unterminated quotes and inconsistent
row widths are errors. A final line ending does not add an extra record. Blank records
are preserved and subject to width checks. Duplicate/empty/prototype-like headers are
safe labels, with generated internal keys. Empty labels become Column N. Values stay
strings (including leading zeros and formula-like text). Sorting uses the Grid's
string behavior, not inferred numeric/date types. CSV supports existing Grid search,
sorting, column resize and pagination (50 rows by default; 25/50/100 choices). Parsing
is bounded and in-memory; this is not unbounded streaming or a spreadsheet engine.

## URLs, access and accessibility

Use existing authorized project file URLs; viewers do not mint credentials or bypass
server authorization. Fetch is GET with `credentials: "same-origin"`. Cross-origin
reads need CORS and receive no ambient credentials. Embedded URL credentials and
non-HTTP(S)/blob schemes are rejected. The caller owns blob URL revocation.

Open source and Download link to the original safe URL; links use `noopener noreferrer`.
Download depends on browser/server Content-Disposition behavior for cross-origin
sources and may open a new tab instead. No generated preview replaces the source.
URL previews read the response body through fetch, including authorized responses with
`Content-Disposition: attachment` and `application/octet-stream`; those headers do not
navigate the page or force the preview to download. Format selection comes from the
chosen viewer, while the same parsing, size and access restrictions still apply.

Modal focus trapping, close controls and scroll locking remain canonical. State feedback
uses a polite status region. Fullscreen is viewport layout, not the browser Fullscreen
API. Narrow views keep content scrolling within the dialog.

## Demos and checks

- [JSON viewer](../demos/demo.json.viewer.html)
- [Markdown viewer](../demos/demo.markdown.viewer.html)
- [CSV viewer](../demos/demo.csv.viewer.html)
- [Lifecycle regression fixture](../tests/file.viewer.regression.html) (`?bundle` tests bundle)

Run `node --test tests/file.viewer.data.mjs`, `node tests/file.viewer.regression.mjs`,
`node tests/ui.bundle.contract.mjs`, and `node tests/registry.contract.mjs` after
`npm run build:ui-bundle`.
The browser runner serves real HTTP attachment fixtures for all three formats and
checks both source and bundle loading, rendered values and unchanged page navigation.
