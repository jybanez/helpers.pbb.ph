import { createElement, clearNode } from "./ui.dom.js";
import { createEventBag } from "./ui.events.js";
import { createMenu } from "./ui.menu.js";

const DEFAULT_OPTIONS = {
  className: "",
  ariaLabel: "Primary navigation",
  brandText: "App",
  brandSubtitle: "",
  brandMedia: null,
  items: [],
  actions: [],
  contentStart: null,
  contentCenter: null,
  contentEnd: null,
  sticky: false,
  activeId: "",
  iconPosition: "start", // start | end
  iconOnly: false,
  onNavigate: null,
  onItemMenuSelect: null,
  onItemMenuOpenChange: null,
  onAction: null,
  onActionMenuSelect: null,
  onActionMenuOpenChange: null,
};

export function createNavbar(container, data = {}, options = {}) {
  const events = createEventBag();
  let currentOptions = { ...DEFAULT_OPTIONS, ...(options || {}) };
  let navMenus = [];

  function destroyMenus() {
    navMenus.forEach((menuApi) => menuApi?.destroy?.());
    navMenus = [];
  }

  function appendIconLabel(target, item = {}) {
    const label = item?.label ?? String(item?.id ?? "");
    const hasIcon = Boolean(item?.icon);
    const iconPosition = String(item?.iconPosition || currentOptions.iconPosition || "start").toLowerCase() === "end" ? "end" : "start";
    const iconOnly = Boolean(item?.iconOnly ?? currentOptions.iconOnly);

    target.classList.toggle("is-icon-only", iconOnly && hasIcon);
    if (iconOnly && hasIcon) {
      target.setAttribute("aria-label", String(label || item?.ariaLabel || item?.id || "menu item"));
      target.setAttribute("title", String(label || ""));
    }

    const content = createElement("span", {
      className: `ui-nav-content${iconPosition === "end" ? " is-end" : ""}`,
    });
    if (hasIcon) {
      content.appendChild(createElement("span", { className: "ui-nav-icon", html: String(item.icon) }));
    }
    if (!iconOnly || !hasIcon) {
      content.appendChild(createElement("span", { className: "ui-nav-label", text: label }));
    }
    target.appendChild(content);
  }

  function appendRenderable(target, value, meta = {}) {
    if (!target) {
      return;
    }

    const resolved = typeof value === "function"
      ? value({
          ...meta,
          options: { ...currentOptions },
          createElement,
        })
      : value;

    if (resolved == null || resolved === false) {
      return;
    }

    if (Array.isArray(resolved)) {
      resolved.forEach((entry) => appendRenderable(target, entry, meta));
      return;
    }

    if (resolved instanceof Node) {
      target.appendChild(resolved);
      return;
    }

    target.appendChild(createElement("span", {
      className: meta?.className || "",
      ...(meta?.asHtml ? { html: String(resolved) } : { text: String(resolved) }),
    }));
  }

  function renderSlot(slotName, value) {
    if (value == null || value === false) {
      return null;
    }
    const slot = createElement("div", {
      className: `ui-navbar-slot ui-navbar-slot-${slotName}`,
    });
    appendRenderable(slot, value, {
      slot: slotName,
      className: "ui-navbar-slot-text",
      asText: true,
    });
    if (!slot.childNodes.length) {
      return null;
    }
    return slot;
  }

  function render() {
    if (!container || container.nodeType !== 1) {
      return;
    }
    destroyMenus();
    events.clear();
    clearNode(container);

    const root = createElement("nav", {
      className: `ui-navbar ${currentOptions.className || ""}`.trim(),
      attrs: { role: "navigation", "aria-label": currentOptions.ariaLabel },
    });
    if (currentOptions.sticky) {
      root.classList.add("is-sticky");
    }

    const brand = createElement("button", {
      className: "ui-navbar-brand",
      attrs: { type: "button" },
    });
    const brandText = createElement("span", { className: "ui-navbar-brand-text" });
    if (currentOptions.brandMedia != null && currentOptions.brandMedia !== false) {
      const brandMedia = createElement("span", { className: "ui-navbar-brand-media" });
      appendRenderable(brandMedia, currentOptions.brandMedia, {
        slot: "brandMedia",
        className: "ui-navbar-brand-media-content",
        asHtml: true,
      });
      if (brandMedia.childNodes.length) {
        brand.appendChild(brandMedia);
      }
    }
    const brandLabel = createElement("span", {
      className: "ui-navbar-brand-label",
      text: currentOptions.brandText,
    });
    brandText.appendChild(brandLabel);
    if (String(currentOptions.brandSubtitle || "").trim()) {
      brand.classList.add("has-subtitle");
      brandText.appendChild(createElement("span", {
        className: "ui-navbar-brand-subtitle",
        text: String(currentOptions.brandSubtitle).trim(),
      }));
    }
    brand.appendChild(brandText);
    events.on(brand, "click", () => currentOptions.onNavigate?.({ id: "brand", label: currentOptions.brandText }));

    const list = createElement("div", { className: "ui-navbar-items" });
    (currentOptions.items || []).forEach((item) => {
      const btn = createElement("button", {
        className: `ui-navbar-item${String(item?.id) === String(currentOptions.activeId) ? " is-active" : ""}`,
        attrs: {
          type: "button",
          ...(item?.disabled ? { disabled: "disabled" } : {}),
          ...(String(item?.id) === String(currentOptions.activeId) ? { "aria-current": "page" } : {}),
        },
      });
      appendIconLabel(btn, item);
      const menuItems = Array.isArray(item?.menuItems) ? item.menuItems : [];
      if (menuItems.length) {
        const menuApi = createMenu(btn, menuItems, {
          placement: "bottom-start",
          ...((item?.menuOptions && typeof item.menuOptions === "object") ? item.menuOptions : {}),
          onSelect: (menuItem, meta) => {
            currentOptions.onItemMenuSelect?.(item, menuItem, meta);
          },
          onOpenChange: (open) => {
            currentOptions.onItemMenuOpenChange?.(item, open);
          },
        });
        navMenus.push(menuApi);
      } else {
        events.on(btn, "click", () => currentOptions.onNavigate?.(item));
      }
      list.appendChild(btn);
    });

    const actions = createElement("div", { className: "ui-navbar-actions" });
    (currentOptions.actions || []).forEach((action) => {
      const btn = createElement("button", {
        className: "ui-button ui-navbar-action",
        attrs: { type: "button", ...(action?.disabled ? { disabled: "disabled" } : {}) },
      });
      appendIconLabel(btn, action);
      const menuItems = Array.isArray(action?.menuItems) ? action.menuItems : [];
      if (menuItems.length) {
        const menuApi = createMenu(btn, menuItems, {
          placement: "bottom-end",
          ...((action?.menuOptions && typeof action.menuOptions === "object") ? action.menuOptions : {}),
          onSelect: (item, meta) => {
            currentOptions.onActionMenuSelect?.(action, item, meta);
          },
          onOpenChange: (open) => {
            currentOptions.onActionMenuOpenChange?.(action, open);
          },
        });
        navMenus.push(menuApi);
      } else {
        events.on(btn, "click", () => currentOptions.onAction?.(action));
      }
      actions.appendChild(btn);
    });

    const start = createElement("div", { className: "ui-navbar-start" });
    const center = createElement("div", { className: "ui-navbar-center" });
    const end = createElement("div", { className: "ui-navbar-end" });

    start.appendChild(brand);
    const contentStart = renderSlot("start", currentOptions.contentStart);
    if (contentStart) {
      start.appendChild(contentStart);
    }
    start.appendChild(list);

    const contentCenter = renderSlot("center", currentOptions.contentCenter);
    if (contentCenter) {
      center.appendChild(contentCenter);
      center.classList.add("has-content");
    }

    const contentEnd = renderSlot("end", currentOptions.contentEnd);
    if (contentEnd) {
      end.appendChild(contentEnd);
    }
    end.appendChild(actions);

    root.append(start, center, end);
    container.appendChild(root);
  }

  function update(_nextData = {}, nextOptions = {}) {
    currentOptions = { ...currentOptions, ...(nextOptions || {}) };
    render();
  }

  function destroy() {
    destroyMenus();
    events.clear();
    clearNode(container);
  }

  function getState() {
    return {
      options: { ...currentOptions },
    };
  }

  render();
  return { destroy, update, getState };
}
