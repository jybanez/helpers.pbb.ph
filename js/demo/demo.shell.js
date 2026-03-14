const DEMO_LINKS = [
  { href: "./index.html", label: "Home", home: true },
  { href: "./demo.team.assignments.html", label: "Team Assignments" },
  { href: "./demo.incident.types.html", label: "Incident Types" },
  { href: "./demo.grid.html", label: "Grid" },
  { href: "./demo.tree.grid.html", label: "Tree Grid" },
  { href: "./demo.hierarchy.map.html", label: "Hierarchy Map" },
  { href: "./demo.progress.html", label: "Progress" },
  { href: "./demo.virtual.list.html", label: "Virtual List" },
  { href: "./demo.scheduler.html", label: "Scheduler" },
  { href: "./demo.audio.html", label: "Audio" },
  { href: "./demo.media.viewer.html", label: "Media Viewer" },
  { href: "./demo.timeline.html", label: "Timeline" },
  { href: "./demo.nav.html", label: "Navigation" },
  { href: "./demo.stepper.html", label: "Stepper" },
  { href: "./demo.splitter.html", label: "Splitter" },
  { href: "./demo.inspector.html", label: "Inspector" },
  { href: "./demo.empty.state.html", label: "Empty State" },
  { href: "./demo.skeleton.html", label: "Skeleton" },
  { href: "./demo.form.modal.html", label: "Form Modal" },
  { href: "./demo.ui.html", label: "UI Utilities" },
];
const DOC_LINKS = [
  { href: "./README.md", label: "README" },
  { href: "./CHANGELOG.md", label: "Changelog" },
  { href: "./docs/pbb-refactor-playbook.md", label: "Playbook" },
];

function buildDemoShell() {
  const nav = document.createElement("nav");
  nav.className = "demo-shell-nav";
  nav.setAttribute("aria-label", "Demo navigation");

  const inner = document.createElement("div");
  inner.className = "demo-shell-nav__inner";

  const title = document.createElement("div");
  title.className = "demo-shell-nav__title";

  const titleGroup = document.createElement("div");
  titleGroup.className = "demo-shell-nav__title-group";

  const headingLink = document.createElement("a");
  headingLink.href = "./index.html";
  headingLink.textContent = "helpers.pbb.ph demos";

  const hint = document.createElement("small");
  hint.textContent = "Jump between demos without returning to the home page.";

  titleGroup.append(headingLink, hint);

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "demo-shell-nav__toggle";
  toggle.setAttribute("aria-expanded", "true");
  toggle.setAttribute("aria-label", "Collapse demo navigation");
  toggle.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10l5 5 5-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>';

  title.append(titleGroup, toggle);

  const links = document.createElement("div");
  links.className = "demo-shell-nav__links";
  links.dataset.role = "demo-links";

  const docs = document.createElement("div");
  docs.className = "demo-shell-nav__docs";
  docs.dataset.role = "doc-links";

  const currentPath = normalizePath(window.location.pathname);
  DEMO_LINKS.forEach((item) => {
    const link = document.createElement("a");
    link.href = item.href;
    link.textContent = item.label;
    if (item.home) {
      link.classList.add("is-home");
    }
    if (normalizePath(new URL(item.href, window.location.href).pathname) === currentPath) {
      link.classList.add("is-active");
      link.setAttribute("aria-current", "page");
    }
    links.appendChild(link);
  });

  DOC_LINKS.forEach((item) => {
    const link = document.createElement("a");
    link.href = item.href;
    link.textContent = item.label;
    if (normalizePath(new URL(item.href, window.location.href).pathname) === currentPath) {
      link.classList.add("is-active");
      link.setAttribute("aria-current", "page");
    }
    docs.appendChild(link);
  });

  toggle.addEventListener("click", () => {
    const collapsed = nav.classList.toggle("is-collapsed");
    toggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
    toggle.setAttribute("aria-label", collapsed ? "Expand demo navigation" : "Collapse demo navigation");
  });

  inner.append(title, links, docs);
  nav.appendChild(inner);
  return nav;
}

function normalizePath(pathname) {
  return String(pathname || "").replace(/\\/g, "/").toLowerCase();
}

function mountDemoShell() {
  if (!document.body || document.querySelector(".demo-shell-nav")) {
    return;
  }
  document.body.insertBefore(buildDemoShell(), document.body.firstChild);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mountDemoShell, { once: true });
} else {
  mountDemoShell();
}
