# Markdown runtime dependencies

Both modules are local, pinned assets; there are no runtime CDN requests.

| Module | Version | Upstream/package source | License |
| --- | --- | --- | --- |
| `marked.esm.js` | 17.0.4 | https://github.com/markedjs/marked ; npm `marked@17.0.4`, `lib/marked.esm.js` | MIT, [notice](Marked.LICENSE.md) |
| `dompurify.es.mjs` | 3.4.16 | https://github.com/cure53/DOMPurify ; npm `dompurify@3.4.16`, `dist/purify.es.mjs` | Apache-2.0 (selected dual-license option), [notice](DOMPurify.LICENSE) |

DOMPurify was obtained using `npm pack dompurify@3.4.16 --ignore-scripts`. Tarball integrity:

```text
sha512-sqo+pNp3qRhCIpbgRi1y8Tgk27Bo2Ry7w0dC1NBeNTdZChWjz9Xb/KOoZbRP/R6pQZ80Qw8YhXw13hWWBbMRnQ==
```

The existing Marked source was checked against npm 17.0.4 with line endings normalized; its upstream license is retained alongside it. DOMPurify's source is unmodified package content (Git may normalize line endings on checkout). SHA-256 for the original vendored bytes:

```text
dompurify.es.mjs  c44274a7959cfdd4da871fa78a5d5fbbef55db68d118c5c0833bc4b5cf9633ad
marked.esm.js     58f9db265e94c44298c0b85eb6a9b1c6a97cdac3801c4f89380fddb6c4531615
DOMPurify.LICENSE cfc7749b96f63bd31c3c42b5c471bf756814053e847c10f3eb003417bc523d30
```

Review upstream releases and security advisories when updating these pins. Run the Markdown hostile-input, CSP/Trusted Types, source/bundle and lifecycle tests; rebuild the UI bundle and measure its dependency graph/size before requesting review. Never treat Marked output alone as safe HTML. The component's allowlist and fixed URL policy remain mandatory even when upstream versions change.
