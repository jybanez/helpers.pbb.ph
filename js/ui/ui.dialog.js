import { createElement } from "./ui.dom.js";
import { createEventBag } from "./ui.events.js";

function createDialogShell(options = {}) {
  const events = createEventBag();
  const backdrop = createElement("div", {
    className: options.backdropClass || "ui-dialog-backdrop",
  });
  const panel = createElement("div", {
    className: options.panelClass || "ui-dialog",
    attrs: { role: "dialog", "aria-modal": "true" },
  });
  const header = createElement("div", { className: options.headerClass || "ui-dialog-header" });
  const title = createElement("h4", {
    className: options.titleClass || "ui-title",
    text: options.title || "",
  });
  const body = createElement("div", { className: options.bodyClass || "ui-dialog-body" });
  const footer = createElement("div", { className: options.footerClass || "ui-dialog-footer" });
  header.appendChild(title);
  panel.append(header, body, footer);

  let mounted = false;

  function mount(parent = document.body) {
    if (mounted) {
      return;
    }
    parent.append(backdrop, panel);
    mounted = true;
  }

  function destroy() {
    events.clear();
    if (backdrop.parentNode) {
      backdrop.parentNode.removeChild(backdrop);
    }
    if (panel.parentNode) {
      panel.parentNode.removeChild(panel);
    }
    mounted = false;
  }

  return { events, backdrop, panel, header, title, body, footer, mount, destroy };
}

function createButton(label, className = "ui-button", attrs = {}) {
  return createElement("button", {
    className,
    text: label,
    attrs: { type: "button", ...attrs },
  });
}

export function uiAlert(message, options = {}) {
  return new Promise((resolve) => {
    const shell = createDialogShell({
      title: options.title || "Notice",
      ...options,
    });
    const messageEl = createElement("p", { className: "ui-dialog-message", text: String(message || "") });
    const ok = createButton(options.okText || "OK", "ui-button ui-button-primary");
    shell.body.appendChild(messageEl);
    shell.footer.appendChild(ok);

    function close(result) {
      shell.destroy();
      resolve(result);
    }

    shell.events.on(ok, "click", () => close(true));
    shell.events.on(shell.backdrop, "click", () => {
      if (options.allowBackdropClose) {
        close(true);
      }
    });
    shell.events.on(document, "keydown", (event) => {
      if (event.key === "Escape" && options.allowEscClose !== false) {
        event.preventDefault();
        close(true);
      }
    });

    shell.mount(options.parent || document.body);
    ok.focus();
  });
}

export function uiConfirm(message, options = {}) {
  return new Promise((resolve) => {
    const shell = createDialogShell({
      title: options.title || "Confirm",
      ...options,
    });
    const messageEl = createElement("p", { className: "ui-dialog-message", text: String(message || "") });
    const cancel = createButton(options.cancelText || "Cancel", "ui-button");
    const confirm = createButton(options.confirmText || "Confirm", "ui-button ui-button-primary");
    shell.body.appendChild(messageEl);
    shell.footer.append(cancel, confirm);

    function close(result) {
      shell.destroy();
      resolve(Boolean(result));
    }

    shell.events.on(cancel, "click", () => close(false));
    shell.events.on(confirm, "click", () => close(true));
    shell.events.on(shell.backdrop, "click", () => {
      if (options.allowBackdropClose) {
        close(false);
      }
    });
    shell.events.on(document, "keydown", (event) => {
      if (event.key === "Escape" && options.allowEscClose !== false) {
        event.preventDefault();
        close(false);
      }
    });

    shell.mount(options.parent || document.body);
    confirm.focus();
  });
}

export function uiPrompt(message, options = {}) {
  return new Promise((resolve) => {
    const shell = createDialogShell({
      title: options.title || "Input",
      ...options,
    });
    const messageEl = createElement("p", { className: "ui-dialog-message", text: String(message || "") });
    const input = createElement("input", {
      className: "ui-input",
      attrs: { type: "text", placeholder: options.placeholder || "" },
    });
    input.value = String(options.defaultValue || "");
    const cancel = createButton(options.cancelText || "Cancel", "ui-button");
    const submit = createButton(options.submitText || "Submit", "ui-button ui-button-primary");
    shell.body.append(messageEl, input);
    shell.footer.append(cancel, submit);

    function close(result) {
      shell.destroy();
      resolve(result);
    }

    shell.events.on(cancel, "click", () => close(null));
    shell.events.on(submit, "click", () => close(input.value));
    shell.events.on(input, "keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        close(input.value);
      }
    });
    shell.events.on(shell.backdrop, "click", () => {
      if (options.allowBackdropClose) {
        close(null);
      }
    });
    shell.events.on(document, "keydown", (event) => {
      if (event.key === "Escape" && options.allowEscClose !== false) {
        event.preventDefault();
        close(null);
      }
    });

    shell.mount(options.parent || document.body);
    input.focus();
    input.select();
  });
}
