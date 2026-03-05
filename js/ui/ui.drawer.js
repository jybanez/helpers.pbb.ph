import { createElement } from "./ui.dom.js";
import { createEventBag } from "./ui.events.js";

export function createBottomDrawer(options = {}) {
  const events = createEventBag();
  const animationMs = Math.max(0, Number(options.animationMs) || 220);
  const position = normalizePosition(options.position);
  const backdrop = createElement("div", {
    className: options.backdropClass || "ui-drawer-backdrop",
  });
  const panel = createElement("aside", {
    className: `${options.panelClass || "ui-drawer"} ui-drawer-pos-${position}`.trim(),
  });
  const header = createElement("div", {
    className: options.headerClass || "ui-drawer-header",
  });
  const title = createElement("h4", {
    className: options.titleClass || "ui-title",
    text: options.title || "",
  });
  const closeButton = createElement("button", {
    className: options.closeClass || "ui-drawer-close",
    html: '<span aria-hidden="true">\u2715</span>',
    attrs: {
      type: "button",
      "aria-label": options.closeLabel || "Close drawer",
    },
  });
  const body = createElement("div", {
    className: options.bodyClass || "ui-drawer-body",
  });

  header.append(title, closeButton);
  panel.append(header, body);

  let isOpen = false;
  let closeNotified = false;
  let closeTimer = null;

  backdrop.style.setProperty("--ui-drawer-animation-ms", `${animationMs}ms`);
  panel.style.setProperty("--ui-drawer-animation-ms", `${animationMs}ms`);

  function notifyClose() {
    if (!closeNotified) {
      closeNotified = true;
      options.onClose?.();
    }
  }

  function close() {
    if (!isOpen) {
      return;
    }
    isOpen = false;
    events.clear();
    backdrop.classList.remove("is-open");
    panel.classList.remove("is-open");
    backdrop.classList.add("is-closing");
    panel.classList.add("is-closing");

    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }
    closeTimer = setTimeout(() => {
      if (backdrop.parentNode) {
        backdrop.parentNode.removeChild(backdrop);
      }
      if (panel.parentNode) {
        panel.parentNode.removeChild(panel);
      }
      backdrop.classList.remove("is-closing");
      panel.classList.remove("is-closing");
      closeTimer = null;
      notifyClose();
    }, animationMs + 24);
  }

  function open(parent = document.body) {
    if (isOpen) {
      return;
    }
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }
    closeNotified = false;
    backdrop.classList.remove("is-open", "is-closing");
    panel.classList.remove("is-open", "is-closing");
    parent.append(backdrop, panel);
    isOpen = true;

    events.on(backdrop, "click", close);
    events.on(closeButton, "click", close);

    requestAnimationFrame(() => {
      if (!isOpen) {
        return;
      }
      backdrop.classList.add("is-open");
      panel.classList.add("is-open");
    });
  }

  return {
    panel,
    body,
    header,
    title,
    closeButton,
    backdrop,
    open,
    close,
    destroy: close,
    isOpen: () => isOpen,
  };
}

function normalizePosition(value) {
  const next = String(value || "bottom").toLowerCase();
  if (next === "top" || next === "left" || next === "right") {
    return next;
  }
  return "bottom";
}
