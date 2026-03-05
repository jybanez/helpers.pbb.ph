import { createElement } from "./ui.dom.js";
import { createEventBag } from "./ui.events.js";

export function createBottomDrawer(options = {}) {
  const events = createEventBag();
  const backdrop = createElement("div", {
    className: options.backdropClass || "ui-drawer-backdrop",
  });
  const panel = createElement("aside", {
    className: options.panelClass || "ui-drawer",
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
    events.clear();
    if (backdrop.parentNode) {
      backdrop.parentNode.removeChild(backdrop);
    }
    if (panel.parentNode) {
      panel.parentNode.removeChild(panel);
    }
    isOpen = false;
    notifyClose();
  }

  function open(parent = document.body) {
    if (isOpen) {
      return;
    }
    closeNotified = false;
    parent.append(backdrop, panel);
    isOpen = true;

    events.on(backdrop, "click", close);
    events.on(closeButton, "click", close);
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
