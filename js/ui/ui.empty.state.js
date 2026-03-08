import { createElement, clearNode } from "./ui.dom.js";
import { createEventBag } from "./ui.events.js";

const DEFAULT_OPTIONS = {
  className: "",
  title: "Nothing here yet",
  description: "",
  iconHtml: "",
  actions: [], // [{ id, label, className }]
  onActionClick: null,
};

export function createEmptyState(container, data = {}, options = {}) {
  const events = createEventBag();
  let currentData = normalizeData(data);
  let currentOptions = normalizeOptions(options);

  function render() {
    if (!container || container.nodeType !== 1) {
      return;
    }
    events.clear();
    clearNode(container);

    const root = createElement("section", {
      className: `ui-empty-state ${currentOptions.className || ""}`.trim(),
    });

    if (currentData.iconHtml) {
      root.appendChild(createElement("div", {
        className: "ui-empty-state-icon",
        html: currentData.iconHtml,
      }));
    }

    root.appendChild(createElement("h4", {
      className: "ui-empty-state-title",
      text: currentData.title || currentOptions.title,
    }));
    if (currentData.description || currentOptions.description) {
      root.appendChild(createElement("p", {
        className: "ui-empty-state-description",
        text: currentData.description || currentOptions.description,
      }));
    }

    const actions = normalizeActions(currentData.actions.length ? currentData.actions : currentOptions.actions);
    if (actions.length) {
      const actionsWrap = createElement("div", { className: "ui-empty-state-actions" });
      actions.forEach((action) => {
        const button = createElement("button", {
          className: `ui-button ${action.className || ""}`.trim(),
          text: action.label,
          attrs: { type: "button" },
        });
        events.on(button, "click", () => {
          currentOptions.onActionClick?.(action, getState());
        });
        actionsWrap.appendChild(button);
      });
      root.appendChild(actionsWrap);
    }

    container.appendChild(root);
  }

  function update(nextData = {}, nextOptions = {}) {
    currentData = normalizeData({ ...currentData, ...(nextData || {}) });
    currentOptions = normalizeOptions({ ...currentOptions, ...(nextOptions || {}) });
    render();
  }

  function getState() {
    return {
      data: { ...currentData },
      options: { ...currentOptions },
    };
  }

  function destroy() {
    events.clear();
    clearNode(container);
  }

  render();
  return { update, getState, destroy };
}

function normalizeOptions(options) {
  return {
    ...DEFAULT_OPTIONS,
    ...(options || {}),
  };
}

function normalizeData(data) {
  const next = (data && typeof data === "object") ? data : {};
  return {
    title: next.title == null ? "" : String(next.title),
    description: next.description == null ? "" : String(next.description),
    iconHtml: next.iconHtml == null ? "" : String(next.iconHtml),
    actions: normalizeActions(next.actions),
  };
}

function normalizeActions(actions) {
  if (!Array.isArray(actions)) {
    return [];
  }
  return actions
    .map((action, index) => {
      if (!action || typeof action !== "object" || !action.label) {
        return null;
      }
      return {
        id: action.id ?? `action-${index}`,
        label: String(action.label),
        className: String(action.className || ""),
      };
    })
    .filter(Boolean);
}

