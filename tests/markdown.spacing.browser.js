import { createUiLoader, DEFAULT_COMPONENT_REGISTRY } from "../js/ui/ui.loader.js";

const results = document.querySelector("#results");
const assert = (ok, message) => { if (!ok) throw Error(message); };
const tick = () => new Promise(resolve => setTimeout(resolve, 60));
const near = (actual, expected, message) => assert(Math.abs(actual - expected) < 1, `${message}: ${actual} != ${expected}`);
try {
  const bundled = new URLSearchParams(location.search).has("bundle");
  const loader = createUiLoader(DEFAULT_COMPONENT_REGISTRY, { preferBundles: bundled });
  const create = await loader.get("ui.markdown");
  if (bundled) assert(create === window.__PBB_HELPER_UI_BUNDLE__?.["./ui.markdown.js"]?.createMarkdownView, "bundle factory");
  const samples = {
    soft: "a\nb", paragraphs: "a\n\nb", three: "a\n\nb\n\nc",
    list: "- a\n- b\n\nc", heading: "# a\n\nb", code: "```\na\n  b\n```"
  };
  const baseline = new Map();
  const measure = host => {
    const content = host.querySelector(".ui-markdown-content");
    return { height: content.getBoundingClientRect().height, html: content.innerHTML };
  };
  for (const whiteSpace of ["normal", "pre-wrap"]) {
    for (const [name, markdown] of Object.entries(samples)) {
      const host = document.createElement("div");
      host.style.cssText = `width:320px;font:16px Arial;white-space:${whiteSpace}`;
      document.body.append(host);
      const view = create(host, { markdown, profile: "full" });
      await tick();
      const full = measure(host);
      if (name === "soft") near(full.height, 48, "soft newline renders exactly two lines");
      if (name === "paragraphs") near(full.height, 64, "two paragraphs retain one 16px margin gap");
      if (name === "three") near(full.height, 104, "three paragraphs retain two margin gaps");
      if (name === "code") assert(host.querySelector("pre code").textContent === "a\n  b", "code indentation preserved");
      view.update({ profile: "compact", maxLines: 1 });
      await tick();
      const clamped = measure(host);
      near(clamped.height, 24, "one-line clamp");
      assert(getComputedStyle(host.querySelector(".ui-markdown-content")).whiteSpace === "pre-wrap", "clamp preserves text whitespace");
      host.querySelector("button").click();
      await tick();
      const expanded = measure(host);
      if (["soft", "paragraphs", "three"].includes(name)) near(expanded.height, full.height, "expanded paragraph geometry");
      if (whiteSpace === "normal") baseline.set(name, { full, clamped, expanded });
      else for (const [state, measured] of Object.entries({ full, clamped, expanded })) {
        near(measured.height, baseline.get(name)[state].height, `${name} ${state} independent of host whitespace`);
        assert(measured.html === baseline.get(name)[state].html, `${name} ${state} DOM unchanged`);
      }
      view.destroy();
      host.remove();
    }
    const host = document.createElement("div");
    host.style.whiteSpace = whiteSpace;
    document.body.append(host);
    const markdown = "a\n  b\n" + "x".repeat(300000);
    const view = create(host, { markdown });
    const plain = host.querySelector(".ui-markdown-plain");
    assert(view.getState().fallback && plain.textContent.startsWith("a\n  b\n") && view.getSource() === markdown, "fallback whitespace and original source preserved");
    assert(getComputedStyle(plain).whiteSpace === "pre-wrap", "fallback whitespace preserved");
    view.destroy();
    host.remove();
  }
  results.textContent = "PASS Markdown host whitespace, block geometry, clamping, code and fallback";
  document.body.dataset.status = "pass";
} catch (error) {
  results.textContent = error.stack;
  document.body.dataset.status = "fail";
}
