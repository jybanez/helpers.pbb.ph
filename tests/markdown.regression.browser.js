import { createUiLoader, DEFAULT_COMPONENT_REGISTRY } from "../js/ui/ui.loader.js";
const results = document.querySelector("#results");
let count = 0;
const assert = (ok, label) => { if (!ok) throw Error(label); count++; results.textContent += `PASS ${label}\n`; };
const denied = location.pathname.includes("csp-denied");
const violations = [];
document.addEventListener("securitypolicyviolation", event => violations.push(event.violatedDirective));
const tick = () => new Promise(resolve => setTimeout(resolve, 40));
try {
  const loader = createUiLoader(DEFAULT_COMPONENT_REGISTRY, { preferBundles: new URLSearchParams(location.search).has("bundle") });
  const create = await loader.get("ui.markdown");
  if (new URLSearchParams(location.search).has("bundle")) assert(create === window.__PBB_HELPER_UI_BUNDLE__?.["./ui.markdown.js"]?.createMarkdownView, "factory comes from generated bundle");
  const host = document.createElement("div"); host.style.width = "280px"; document.body.append(host);
  const view = create(host, { markdown: "**Safe** [link](https://example.com)", headingOffset: 1 });
  if (denied) {
    assert(view.getState().fallback && view.getState().reason === "render-error", "denied Trusted Types policy fails closed");
    assert(!host.querySelector("a,strong") && host.textContent.includes("**Safe**"), "denied policy produces literal text only");
    view.update({ markdown: "<img src=x onerror=alert(1)>" });
    assert(!host.querySelector("img") && host.textContent.includes("<img"), "fallback update remains literal");
  } else {
    assert(!view.getState().fallback && host.querySelector("strong")?.textContent === "Safe", "sanitized semantic content");
    assert(host.querySelector("a")?.target === "_self", "default same-window link");
    view.update({ markdown: "# Title\n\n## Sub\n\n- one\n- two\n\n> quote\n\n```js\n<script>bad()</script>\n```\n\n| A | B |\n| - | - |\n| 1 | 2 |", linkTarget: "_blank" });
    assert(host.querySelector("h2")?.textContent === "Title" && host.querySelector("h3"), "semantic heading offset");
    assert(host.querySelectorAll("li").length === 2 && host.querySelector("blockquote"), "full lists and quotes");
    assert(host.querySelector("pre code")?.textContent.includes("<script>") && !host.querySelector("script"), "code is literal text");
    assert(host.querySelector("pre")?.tabIndex === 0 && host.querySelector('div[role="region"]')?.getAttribute("aria-label") === "Table", "code and table accessible scroll regions");
    for (const [offset, tag] of [[99, "h6"], [-99, "h1"]]) {
      view.update({ markdown: "# Heading", headingOffset: offset }); assert(!!host.querySelector(tag), `heading clamp ${tag}`);
    }
    const corpus = [
      '<script>window.markdownAttack=1</script>', '<img src="https://example.invalid/a" onerror="window.markdownAttack=1">',
      '<svg><a xlink:href="javascript:alert(1)">x</a></svg>', '<math><mtext><table><mglyph><style><!--</style><img src=x onerror=alert(1)>',
      '<form id="location"><input name="href"></form>', '<iframe srcdoc="<script>alert(1)</script>"></iframe>',
      '<a href="javascript:alert(1)" onclick="alert(1)">x</a>', '![tracking](https://example.invalid/pixel)',
      '<style>body{display:none}</style>', '<!-- comment -->', 'x <b>bold</b> y', '\u0000[[unfinished ** markdown'
    ];
    for (const markdown of corpus) {
      view.update({ markdown, profile: "full" });
      assert(!view.getState().fallback, `corpus parsed: ${markdown.slice(0, 25)}`);
      assert(!host.querySelector("script,img,svg,math,form,input,iframe,style,b,[onclick],[onerror],[src],[srcdoc],[name]"), "no executable markup, images or clobbering");
      assert(view.getSource() === markdown, "exact source retained");
    }
    assert(!window.markdownAttack, "attack code never ran");
    const unsafe = ["javascript:alert%281%29", "JaVaScRiPt:foo", "java&#x73;cript:foo", "&#106;avascript:foo", "javascript&colon;foo", "data:text/html,bad", "vbscript:bad", "file:///etc/passwd", "//evil.test/x", "/relative", "#fragment", "https://user:pass@example.com", "https:\\evil.test", "mailto:a@example.com%0d%0aBcc:b@example.com", "https://example.com/&#x22;onmouseover=bad"];
    for (const url of unsafe) {
      view.update({ markdown: `[label](${url})` });
      // Quotes embedded in a valid URL are harmless when encoded, never attributes.
      if (!url.startsWith("https://example.com/")) assert(!host.querySelector("a[href]"), `reject URL ${url}`);
      assert(!host.querySelector("[onmouseover]") && host.textContent.includes("label"), "rejected link has readable label");
    }
    for (const url of ["https://example.com/a?b=1&c=2", "http://example.com", "mailto:help@example.com"]) {
      view.update({ markdown: `[label](${url})` }); const a = host.querySelector("a");
      assert(a?.target === "_blank" && a.relList.contains("noopener") && a.relList.contains("noreferrer"), `hardened safe link ${url}`);
    }
    view.update({ profile: "compact", markdown: "# Heading\n\n**bold** and *em* and `code`\n\n- list\n\n> quote\n\n```\nblock\n```\n\n| A |\n| - |\n| B |" });
    assert(!host.querySelector("h1,h2,h6,ul,ol,li,pre,blockquote,table") && host.querySelector("strong,em,code"), "compact removes block structures");
    view.update({ profile: "full", tables: false }); assert(!host.querySelector("table") && host.textContent.includes("A") && host.textContent.includes("B"), "tables degrade to readable text");
    const source = "[Link](https://example.com) **bold** " + "readable content ".repeat(60);
    view.update({ markdown: source, profile: "compact", maxLines: 2 }); await tick();
    const toggle = host.querySelector("button");
    assert(view.getState().truncated && !toggle.hidden && !host.querySelector("a,strong"), "clamped preview has no clipped links or formatting");
    toggle.focus(); toggle.click();
    assert(view.getState().expanded && host.querySelector("a,strong") && document.activeElement === toggle && toggle.getAttribute("aria-expanded") === "true", "expanded semantic content and focus retained");
    toggle.click(); assert(!view.getState().expanded && !host.querySelector("a"), "collapse removes interactive targets");
    view.update({ markdown: "Short" }); await tick(); assert(!view.getState().truncated && toggle.hidden, "short update removes toggle");
    host.style.width = "10000px"; view.update({ markdown: source });
    assert(!view.getState().truncated && host.querySelector("a"), "wide layout retains unclipped semantic content"); host.style.width = "280px";
    view.update({ markdown: "", emptyText: "<b>Empty</b>" }); assert(!host.querySelector("b") && host.textContent.includes("<b>Empty</b>"), "empty label is localized literal text");
    view.update({ markdown: "a".repeat(256 * 1024), profile: "full" }); assert(!view.getState().fallback, "256 KiB exact limit accepted");
    const oversized = "é".repeat(128 * 1024 + 1);
    view.update({ markdown: oversized, oversizeLabel: "<b>Too long</b>" });
    assert(view.getState().reason === "oversize" && view.getSource() === oversized && !host.querySelector("b") && host.querySelector(".ui-markdown-plain").textContent.length === 4097, "UTF-8 limit gives bounded safe preview and exact source");
    const prior = host.textContent;
    for (const options of [{ markdown: 3 }, { profile: "html" }, { images: true }, { maxLines: 0 }, { linkTarget: "parent" }]) {
      let threw = false; try { view.update(options); } catch { threw = true; }
      assert(threw && host.textContent === prior && view.getSource() === oversized, "invalid update is atomic");
    }
    view.update({ markdown: "[long](https://example.com/" + "a".repeat(2000) + ")\n\n```\n" + "code".repeat(1000) + "\n```", profile: "full" });
    assert(host.scrollWidth <= host.clientWidth + 1 && host.querySelector("pre").scrollWidth > host.querySelector("pre").clientWidth, "long content constrained with internal code scrolling");
    await tick(); assert(violations.length === 0, "no CSP violations in supported policy");
  }
  const oldButton = host.querySelector("button"); view.destroy(); oldButton.click(); view.update({ markdown: "ignored" }); await tick();
  assert(view.getState().destroyed && host.childElementCount === 0, "destroy removes DOM listeners and ignores late updates");
  view.destroy(); assert(host.childElementCount === 0, "destroy is idempotent");
  document.body.dataset.status = "pass"; results.textContent += `${count} assertions passed`;
} catch (error) { document.body.dataset.status = "fail"; results.textContent += error.stack; }
