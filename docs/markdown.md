# Safe Markdown view

Release **0.21.217** adds `ui.markdown` / `createMarkdownView(host, options)` for untrusted authored text. Try [the interactive demo](../demos/demo.markdown.html), also linked under Data in the shared demo navigation.

## Load and use

```js
import { uiLoader } from "../js/ui/ui.loader.js?v=0.21.217";
const createMarkdownView = await uiLoader.get("ui.markdown");
const view = createMarkdownView(host, {
  markdown: message.body,
  profile: "compact",
  maxLines: 3
});
view.update({ markdown: updatedBody });
const sourceForEditor = view.getSource();
view.destroy();
```

The standalone bundle exports the same loader from `dist/helpers.ui.bundle.min.js?v=0.21.217`. Modular loading fetches the parser and sanitizer locally; no CDN is required. Direct consumers can import `createMarkdownView` from `js/ui/ui.markdown.js` and load `css/ui/ui.tokens.css` plus `css/ui/ui.markdown.css`. The registry includes the component in the `communication` group.

```js
const detail = createMarkdownView(host, {
  markdown: task.description,
  profile: "full",
  headingOffset: 2,
  tables: true,
  linkTarget: "_blank"
});
```

## Options

| Option | Default | Contract |
| --- | --- | --- |
| `markdown` | `""` | String; null/undefined become empty. Exact input is retained. |
| `profile` | `"full"` | `"compact"` or `"full"`. |
| `maxLines` | `null` | Integer 1–20 or null. Applies only to compact mode. |
| `headingOffset` | `0` | Integer added to each full heading level; result clamps to h1–h6. |
| `tables` | `true` | False degrades full tables to readable rows of text. |
| `linkTarget` | `"_self"` | Only `_self` / `_blank`. Every link has `noopener noreferrer`. |
| `images` | `false` | Images are disabled in v1. Any supplied value other than false throws. |
| `emptyText` | `"No content"` | Empty/whitespace-only source label. |
| `showMoreLabel` / `showLessLabel` | `"Show more"` / `"Show less"` | Preview toggle labels. |
| `fallbackLabel` | `"Formatting unavailable. Showing plain text."` | Parse/sanitizer failure label. |
| `oversizeLabel` | `"Content exceeds the display limit. Showing a plain-text preview."` | Size-limit label. |
| `codeLabel` / `tableLabel` | `"Code block"` / `"Table"` | Accessible full-mode scroll-region names. |

All labels are configurable plain text, never HTML. There are no renderer, sanitizer, image-origin, custom-class or HTML overrides. Unknown options do not extend rendering behavior.

Compact mode allows paragraphs, breaks, strong/emphasis, inline code and links. Headings lose heading semantics; lists, quotes, fenced code and tables degrade to readable text. Full mode adds semantic headings, lists, quotes, fenced code and optionally tables. Images become alt text in both modes. Raw HTML is literal text, including tags and comments. Strikethrough retains text without a deletion tag. Task lists render as ordinary list items; syntax highlighting is unavailable. Single line breaks are preserved.

## Instance methods and state

| Method | Behavior |
| --- | --- |
| `update(partialOptions)` | Synchronous off-DOM preparation and atomic replacement; resets expansion. Invalid options throw without changing source/DOM. Parse/sanitizer failure commits safe text. |
| `getSource()` | Original string, including whitespace and oversized input. Never reconstruct an editor value from rendered HTML. |
| `getState()` | Fresh object: `{ profile, expanded, truncated, fallback, reason, destroyed }`. |
| `destroy()` | Removes owned root, button listener and ResizeObserver. Idempotent; later updates do nothing. Source remains readable. |

`reason` is null, `oversize`, `sanitizer-unavailable`, or `render-error`. `truncated` means the compact plain-text preview exceeds its line limit even while expanded. Rendering is synchronous; there are no asynchronous render or cancellation callbacks. Font readiness/resize measurement ignores destroyed views.

The limit is **262,144 UTF-8 bytes (256 KiB)**, inclusive, checked before parsing. Oversize or failed rendering shows a label and at most 4,096 UTF-16 code units of literal source plus an ellipsis. The full original input remains in `getSource()`. The ceiling bounds work but is not a latency guarantee for every Markdown shape; use shorter previews for large collections, and avoid updating every mounted view on every keystroke.

## Accessibility and layout

When compact text exceeds `maxLines`, the preview is **plain text with no links or hidden keyboard targets**. Visual clipping does not remove text from the accessibility tree: screen readers can read the complete plain text. Show more restores the semantic compact formatting and links; Show less removes those interactive nodes again. The toggle has `aria-controls` and `aria-expanded`, supports native Enter/Space activation, and retains focus. Resizing or loaded fonts trigger remeasurement. Short previews keep semantic formatting and omit the toggle.

Provide meaningful link labels and a heading offset appropriate to the surrounding document. Ordinary text and long URLs wrap. Fenced code and full tables scroll internally and are keyboard focusable with configurable accessible labels. Layout styles must be loaded for clamping and overflow containment. Display-only rendering does not implement an editor or form validation.

## Security boundary and CSP

The component owns an isolated Marked parser and a private DOMPurify instance per window. Marked's output is not trusted. Raw HTML and image tokens are escaped before sanitization; a fixed HTML tag/attribute allowlist excludes scripts, event attributes, SVG/MathML, forms, styles, IDs/names and network-loading elements. DOMPurify returns a **DocumentFragment**. The component clones/inserts that fragment without subsequent HTML-string rewriting. Never bypass this boundary with `innerHTML`, hooks, or another post-render formatter.

Only absolute `http://`, `https://` and `mailto:` destinations are accepted. Relative/protocol-relative URLs, fragment links, credentials, control characters, backslashes and dangerous/obfuscated schemes lose their link but retain the label. Mailto CR/LF escapes are rejected. This validates URL syntax/schemes, **not destination trust**: allowed links may still lead to an untrusted website when activated. Rendering makes no image or other third-party content requests. `_self` is the default; `_blank` is opt-in, always with `noopener noreferrer`.

External scripts and styles work without `unsafe-inline`. For Chromium Trusted Types enforcement, allow DOMPurify's named policy:

```text
default-src 'none'; script-src 'self'; style-src 'self';
require-trusted-types-for 'script'; trusted-types dompurify
```

Adapt asset origins to the deployment. Do not add an unsafe default policy. If the sanitizer cannot create/use its policy, rendering fails closed to literal text with `reason: "render-error"`; browsers may log the denied policy. Source and bundled tests cover both an allowed policy and explicit `trusted-types 'none'`. This contract assumes a trusted application/browser runtime; it does not protect against other scripts already executing with access to the page.

## Dependencies and maintenance

Pinned local dependencies: Marked **17.0.4**, DOMPurify **3.4.16**. See [vendor provenance](../js/vendor/MARKDOWN-DEPENDENCIES.md) for origins, licenses and hashes. Track upstream security releases, update pins deliberately, rerun the hostile-input and CSP corpus, rebuild distributables, and review the exact commit before adoption. Do not fetch a parser/sanitizer from a CDN at runtime.

Against 0.21.216 (Git blob bytes), the initial candidate adds **79,620 raw / 26,649 gzip bytes** to the main JS bundle, and **1,641 raw / 371 gzip bytes** to CSS. The actual esbuild input graph contains exactly one Marked and one DOMPurify input. The full bundle includes both once; applications wanting on-demand loading can use the modular loader.

## Verification

Run `node tests/markdown.regression.mjs`. It checks modular/bundle paths on Chrome/Edge, including normal HTML, strict CSP/Trusted Types and denied-policy fallback pages. The corpus covers literal hostile markup, namespace/clobbering payloads, protocol filtering, image suppression, full/compact profiles, clamping, updates, limits, safe failure, disposal, and internal overflow.

Also run the registry/bundle contract and loader regressions after `npm run build:ui-bundle`. Chromium interactive checks cover native keyboard toggle behavior, resizing, narrow layout and the demo. Firefox and WebKit runtimes were unavailable locally; those engines are not claimed as tested. The library targets current browsers with ES2020, ResizeObserver and TextEncoder; there is no IE or SSR guarantee.
