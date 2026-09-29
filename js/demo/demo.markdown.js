import { uiLoader } from "../ui/ui.loader.js?v=0.21.217";
import "./demo.shell.js?v=0.21.217";
const examples = {
  research: `# Research: making project decisions traceable

## Purpose
Compare **three approaches** to linking a task, the evidence behind it, and its final decision. Preserve the original notes so participants can revise them later.

### Acceptance criteria
1. Every decision links to a source.
2. A compact timeline preview stays readable on a phone.
3. Full details preserve headings, code, and tables.

> Working hypothesis: a concise summary helps readers decide whether to open the full evidence.

| Approach | Strength | Open question |
| --- | --- | --- |
| Timeline | Chronology | How do we find the final decision? |
| Task detail | Stable context | How do we preserve the conversation? |
| Linked evidence | Traceability | Who verifies the source? |

Use \`view.getSource()\` when opening an editor. Display output is not the source of truth.

\`\`\`js
view.update({ markdown: revisedDescription, profile: "full" });
\`\`\`

Read the [Markdown specification](https://spec.commonmark.org/) or contact [the project team](mailto:team@example.com).

## Next steps
- Compare two realistic examples with reviewers.
- Record remaining questions and owners.
- Publish the reviewed findings.`,
  safety: `# Safety example
<img src="https://example.invalid/tracker" onerror="alert('unsafe')">

<script>alert('never executed')</script>

![Image alt text is retained](https://example.invalid/image.png)

[Rejected executable link](javascript:alert%281%29)
[Rejected relative link](/account)
[Allowed HTTPS link](https://example.com)

**Formatting** still works. Raw HTML above is literal text.`,
  long: "# Wide content\n\n" + "LongWord".repeat(50) + "\n\n```text\n" + "wide code column ".repeat(40) + "\n```\n\n| A | B | C | D |\n| - | - | - | - |\n| one | two | three | four |",
  empty: ""
};
const source = document.querySelector("#source"), selection = document.querySelector("#example");
const create = await uiLoader.get("ui.markdown");
const compact = create(document.querySelector("#compact"), { profile: "compact", maxLines: 3 });
const full = create(document.querySelector("#full"), { headingOffset: 2 });
function render() {
  const linkTarget = document.querySelector("#blank").checked ? "_blank" : "_self";
  compact.update({ markdown: source.value, maxLines: Number(document.querySelector("#lines").value) || null, linkTarget });
  full.update({ markdown: source.value, tables: document.querySelector("#tables").checked, linkTarget });
  status();
}
function status() { const state = compact.getState(); document.querySelector("#state").textContent = `Preview: ${state.expanded ? "expanded" : state.truncated ? "collapsed" : "complete"} · Fallback: ${state.reason || "none"}`; }
function reset() { source.value = examples[selection.value]; render(); }
source.addEventListener("input", render);
selection.addEventListener("change", reset);
for (const id of ["lines", "tables", "blank"]) document.getElementById(id).addEventListener("change", render);
document.querySelector("#reset").addEventListener("click", reset);
document.querySelector("#compact").addEventListener("click", status);
reset();
