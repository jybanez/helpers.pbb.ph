import { createElement, clearNode } from "./ui.dom.js";
import { createEventBag } from "./ui.events.js";

const DEFAULT_OPTIONS = {
  placement: "bottom-start", // bottom-start | bottom-end | top-start | top-end
  align: null, // null | left | right
  offset: 6,
  ariaLabel: "Menu",
  mode: "flat", // flat | grouped | mega
  width: "contained", // contained | viewport
  closeOnSelect: true,
  closeOnOutsideClick: true,
  closeOnEscape: true,
  matchTriggerWidth: false,
  focusOnOpen: true,
  className: "",
  onOpenChange: null,
  onSelect: null,
};

export function createMenu(triggerEl, items = [], options = {}) {
  const events = createEventBag();
  const itemEvents = createEventBag();
  let currentItems = Array.isArray(items) ? items : [];
  let currentOptions = normalizeOptions(options);
  let open = false;
  let root = null;
  let listEl = null;
  let activeIndex = -1;
  let closeTimer = null;
  let preserveOpeningFocus = false;
  let destroyed = false;
  let closeTransition = null;
  const rootId = `ui-menu-${Math.random().toString(36).slice(2, 10)}`;

  function build() {
    if (root) {
      return;
    }
    root = createElement("div", {
      attrs: { role: "menu", tabindex: "-1", id: rootId, "aria-label": currentOptions.ariaLabel },
    });
    listEl = createElement("div", {});
    root.appendChild(listEl);
    syncMenuClasses();
    renderItems();
  }

  function renderItems() {
    if (!listEl) {
      return;
    }
    syncMenuClasses();
    itemEvents.clear();
    clearNode(listEl);
    activeIndex = -1;
    if (isGroupedMode()) {
      renderGroups();
      return;
    }
    currentItems.forEach((item, index) => {
      listEl.appendChild(createMenuItemButton({
        item,
        index,
        source: "menu",
        disabled: Boolean(item?.disabled),
      }));
    });
  }

  function renderGroups() {
    normalizeGroups(currentItems).forEach((group, groupIndex) => {
      const section = createElement("section", {
        className: `ui-menu-group${group.disabled ? " is-disabled" : ""}${group.className ? ` ${String(group.className).trim()}` : ""}`,
        attrs: { role: "group", "aria-label": group.label },
      });
      const heading = createElement("div", { className: "ui-menu-group-heading" });
      if (group.icon) {
        heading.appendChild(createElement("span", { className: "ui-menu-group-icon", html: String(group.icon) }));
      }
      const text = createElement("span", { className: "ui-menu-group-text" });
      text.appendChild(createElement("span", { className: "ui-menu-group-label", text: group.label }));
      if (group.description) {
        text.appendChild(createElement("span", { className: "ui-menu-group-description", text: group.description }));
      }
      heading.appendChild(text);
      section.appendChild(heading);

      const groupList = createElement("div", { className: "ui-menu-group-list" });
      group.items.forEach((item, itemIndex) => {
        const entry = getEntryByGroupPosition(groupIndex, itemIndex);
        if (!entry) {
          return;
        }
        groupList.appendChild(createMenuItemButton({
          item,
          group,
          index: entry.index,
          itemIndex,
          groupIndex,
          source: "menu",
          disabled: Boolean(group.disabled || item?.disabled),
        }));
      });
      section.appendChild(groupList);
      listEl.appendChild(section);
    });
  }

  function createMenuItemButton({ item, group = null, index, itemIndex = index, groupIndex = null, source = "menu", disabled = false }) {
    const row = createElement("button", {
      className: `ui-menu-item${disabled ? " is-disabled" : ""}${item?.danger ? " is-danger" : ""}${item?.className ? ` ${String(item.className).trim()}` : ""}`,
      attrs: {
        type: "button",
        role: "menuitem",
        tabindex: "-1",
        "data-index": String(index),
        "data-menu-index": String(index),
        ...(disabled ? { disabled: "disabled" } : {}),
      },
    });
    if (item?.icon) {
      row.appendChild(createElement("span", { className: "ui-menu-item-icon", html: String(item.icon) }));
    }
    row.appendChild(createElement("span", { className: "ui-menu-item-label", text: item?.label ?? String(item?.id ?? index) }));
    if (item?.description) {
      row.appendChild(createElement("span", { className: "ui-menu-item-description", text: String(item.description) }));
    }
    if (item?.shortcut) {
      row.appendChild(createElement("kbd", { className: "ui-menu-item-shortcut", text: String(item.shortcut) }));
    }
    itemEvents.on(row, "click", () => {
      if (disabled) {
        return;
      }
      currentOptions.onSelect?.(item, buildSelectMeta({ index, itemIndex, groupIndex, group, source }));
      if (currentOptions.closeOnSelect) {
        close();
      }
    });
    itemEvents.on(row, "mouseenter", () => setActiveIndex(index, !preserveOpeningFocus || root?.contains(document.activeElement)));
    return row;
  }

  function setActiveIndex(index, focus = true) {
    if (!listEl) {
      return;
    }
    const children = Array.from(listEl.querySelectorAll(".ui-menu-item[data-menu-index]"));
    children.forEach((node) => node.classList.remove("is-active"));
    const target = children.find((node) => Number(node.dataset.menuIndex) === index);
    if (target && !target.disabled) {
      target.classList.add("is-active");
      if (focus) target.focus();
      activeIndex = index;
      return true;
    }
    return false;
  }

  function moveActive(delta) {
    const enabledIndexes = getEnabledEntries().map((entry) => entry.index);
    if (!enabledIndexes.length) {
      return;
    }
    const currentPos = Math.max(0, enabledIndexes.indexOf(activeIndex));
    const nextPos = (currentPos + delta + enabledIndexes.length) % enabledIndexes.length;
    setActiveIndex(enabledIndexes[nextPos]);
  }

  function position() {
    if (!root || !triggerEl) {
      return;
    }
    const rect = triggerEl.getBoundingClientRect();
    const measuredRect = root.getBoundingClientRect();
    const menuWidth = root.offsetWidth || measuredRect.width;
    const menuHeight = root.offsetHeight || measuredRect.height;
    const gap = Math.max(0, Number(currentOptions.offset) || 0);
    const placement = resolvePlacement(currentOptions);
    let top = rect.bottom + gap;
    let left = rect.left;

    if (placement.startsWith("top")) {
      top = rect.top - menuHeight - gap;
    }
    if (placement.endsWith("end")) {
      left = rect.right - menuWidth;
    }
    if (currentOptions.mode === "mega" && currentOptions.width === "viewport") {
      left = 12;
    }

    const maxLeft = window.innerWidth - menuWidth - 8;
    const maxTop = window.innerHeight - menuHeight - 8;
    root.style.left = `${Math.max(8, Math.min(left, maxLeft))}px`;
    root.style.top = `${Math.max(8, Math.min(top, maxTop))}px`;
    root.dataset.placement = placement;
    if (currentOptions.matchTriggerWidth) {
      root.style.minWidth = `${Math.round(rect.width)}px`;
    } else {
      root.style.minWidth = "";
    }
  }

  function openMenu(openOptions = {}) {
    if (destroyed || open) {
      return;
    }
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }
    if (closeTransition) { root?.removeEventListener("transitionend", closeTransition); closeTransition = null; }
    build();
    preserveOpeningFocus = (openOptions.focusOnOpen ?? currentOptions.focusOnOpen) === false;
    if (!root.parentNode) {
      document.body.appendChild(root);
    }
    open = true;
    if (triggerEl && typeof triggerEl.setAttribute === "function") {
      triggerEl.setAttribute("aria-expanded", "true");
      triggerEl.setAttribute("aria-controls", rootId);
      triggerEl.setAttribute("aria-haspopup", "menu");
    }
    root.classList.remove("is-closing");
    position();
    requestAnimationFrame(() => {
      if (!open) {
        return;
      }
      root?.classList.add("is-open");
    });
    currentOptions.onOpenChange?.(true);
    if (!open || destroyed) return;
    bindGlobal();
    const firstEnabled = getEnabledEntries()[0];
    if (firstEnabled && !preserveOpeningFocus) {
      setActiveIndex(firstEnabled.index);
    }
  }

  function focusFirst() {
    if (destroyed || !open) return false;
    const firstEnabled = getEnabledEntries()[0];
    return firstEnabled ? Boolean(setActiveIndex(firstEnabled.index)) : false;
  }

  function close() {
    if (!open) {
      return;
    }
    open = false;
    const restoreFocus = !preserveOpeningFocus || root?.contains(document.activeElement);
    if (triggerEl && typeof triggerEl.setAttribute === "function") {
      triggerEl.setAttribute("aria-expanded", "false");
    }
    currentOptions.onOpenChange?.(false);
    unbindGlobal();
    activeIndex = -1;
    if (!root) {
      return;
    }
    root.classList.remove("is-open");
    root.classList.add("is-closing");

    const finalizeClose = () => {
      if (open || !root) {
        return;
      }
      root.classList.remove("is-closing");
      if (root.parentNode) {
        root.parentNode.removeChild(root);
      }
      if (restoreFocus && (!preserveOpeningFocus || document.activeElement === document.body || root?.contains(document.activeElement))) triggerEl?.focus?.();
    };

    const onTransitionEnd = (event) => {
      if (event.target !== root) {
        return;
      }
      root?.removeEventListener("transitionend", onTransitionEnd);
      closeTransition = null;
      finalizeClose();
    };

    root.addEventListener("transitionend", onTransitionEnd);
    closeTransition = onTransitionEnd;
    closeTimer = setTimeout(() => {
      root?.removeEventListener("transitionend", onTransitionEnd);
      closeTransition = null;
      finalizeClose();
      closeTimer = null;
    }, 260);
  }

  function toggle() {
    if (open) {
      close();
    } else {
      openMenu();
    }
  }

  const globalEvents = createEventBag();
  function bindGlobal() {
    if (currentOptions.closeOnOutsideClick) {
      globalEvents.on(document, "mousedown", (event) => {
        const target = event.target;
        if (!open) {
          return;
        }
        if (target && (target === triggerEl || triggerEl.contains(target) || root?.contains(target))) {
          return;
        }
        close();
      });
    }
    if (currentOptions.closeOnEscape) {
      globalEvents.on(document, "keydown", (event) => {
        if (!open) {
          return;
        }
        // Passive suggestions leave textbox keys to the caller until deliberate entry.
        if (preserveOpeningFocus && !root?.contains(event.target)) return;
        if (event.key === "Escape") {
          event.preventDefault();
          close();
          triggerEl?.focus?.();
          return;
        }
        if (event.key === "ArrowDown") {
          event.preventDefault();
          moveActive(1);
          return;
        }
        if (event.key === "ArrowUp") {
          event.preventDefault();
          moveActive(-1);
          return;
        }
        if (event.key === "Home") {
          event.preventDefault();
          moveActiveToBoundary("start");
          return;
        }
        if (event.key === "End") {
          event.preventDefault();
          moveActiveToBoundary("end");
          return;
        }
        if (event.key === "Enter" || event.key === " ") {
          const entry = getEntryByIndex(activeIndex);
          if (entry && !entry.disabled) {
            event.preventDefault();
            currentOptions.onSelect?.(entry.item, buildSelectMeta({ ...entry, source: "keyboard" }));
            if (currentOptions.closeOnSelect) {
              close();
            }
          }
        }
      });
    }
    globalEvents.on(window, "resize", () => {
      if (open) {
        position();
      }
    });
    globalEvents.on(window, "scroll", () => {
      if (open) {
        position();
      }
    }, true);
  }

  function unbindGlobal() {
    globalEvents.clear();
  }

  function moveActiveToBoundary(edge) {
    const enabledIndexes = getEnabledEntries().map((entry) => entry.index);
    if (!enabledIndexes.length) {
      return;
    }
    setActiveIndex(edge === "end" ? enabledIndexes[enabledIndexes.length - 1] : enabledIndexes[0]);
  }

  function isGroupedMode() {
    return currentOptions.mode === "grouped" || currentOptions.mode === "mega";
  }

  function syncMenuClasses() {
    const grouped = isGroupedMode();
    if (root) {
      root.className = [
        "ui-menu",
        grouped ? "is-grouped" : "",
        currentOptions.mode === "mega" ? "is-mega" : "",
        currentOptions.mode === "mega" && currentOptions.width === "viewport" ? "is-width-viewport" : "",
        currentOptions.className,
      ].filter(Boolean).join(" ");
    }
    if (listEl) {
      listEl.className = grouped ? "ui-menu-list ui-menu-groups" : "ui-menu-list";
    }
  }

  function getFlatEntries() {
    if (!isGroupedMode()) {
      return currentItems.map((item, index) => ({
        item,
        index,
        itemIndex: index,
        groupIndex: null,
        group: null,
        disabled: Boolean(item?.disabled),
      }));
    }

    const entries = [];
    normalizeGroups(currentItems).forEach((group, groupIndex) => {
      group.items.forEach((item, itemIndex) => {
        entries.push({
          item,
          index: entries.length,
          itemIndex,
          groupIndex,
          group,
          disabled: Boolean(group.disabled || item?.disabled),
        });
      });
    });
    return entries;
  }

  function getEnabledEntries() {
    return getFlatEntries().filter((entry) => !entry.disabled);
  }

  function getEntryByIndex(index) {
    return getFlatEntries().find((entry) => entry.index === index) || null;
  }

  function getEntryByGroupPosition(groupIndex, itemIndex) {
    return getFlatEntries().find((entry) => entry.groupIndex === groupIndex && entry.itemIndex === itemIndex) || null;
  }

  function buildSelectMeta({ index, itemIndex = index, groupIndex = null, group = null, source = "menu" }) {
    return {
      index,
      itemIndex,
      groupIndex,
      group,
      source,
    };
  }

  function update(nextItems = [], nextOptions = {}) {
    currentItems = Array.isArray(nextItems) ? nextItems : [];
    currentOptions = normalizeOptions({ ...currentOptions, ...nextOptions });
    if (root) renderItems();
    if (open) {
      root?.classList.add("is-open");
      position();
    }
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    close();
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }
    root?.remove();
    if (closeTransition) { root?.removeEventListener("transitionend", closeTransition); closeTransition = null; }
    events.clear();
    itemEvents.clear();
    unbindGlobal();
    if (triggerElEvents) {
      triggerElEvents.clear();
    }
    root = null;
    listEl = null;
  }

  function getState() {
    return {
      open,
      activeIndex,
      focusOnOpen: !preserveOpeningFocus,
      placement: resolvePlacement(currentOptions),
      items: [...currentItems],
      mode: currentOptions.mode,
      groups: isGroupedMode() ? normalizeGroups(currentItems) : [],
    };
  }

  const triggerElEvents = createEventBag();
  if (triggerEl && typeof triggerEl.addEventListener === "function") {
    if (typeof triggerEl.setAttribute === "function") {
      triggerEl.setAttribute("aria-haspopup", "menu");
      triggerEl.setAttribute("aria-expanded", "false");
    }
    triggerElEvents.on(triggerEl, "click", (event) => {
      event.preventDefault();
      toggle();
    });
  }

  return {
    open: openMenu,
    focusFirst,
    close,
    toggle,
    update,
    destroy,
    getState,
  };
}

function normalizeOptions(options) {
  const mode = String(options?.mode || DEFAULT_OPTIONS.mode).toLowerCase();
  const width = String(options?.width || DEFAULT_OPTIONS.width).toLowerCase();
  return {
    ...DEFAULT_OPTIONS,
    ...(options || {}),
    mode: mode === "grouped" || mode === "mega" ? mode : "flat",
    width: width === "viewport" ? "viewport" : "contained",
  };
}

function isRenderableItem(item) {
  return Boolean(item && !item.hidden && (item.label || item.id));
}

function normalizeGroups(groups) {
  return (Array.isArray(groups) ? groups : [])
    .filter((group) => group && !group.hidden)
    .map((group, groupIndex) => ({
      ...group,
      id: group.id || `group:${groupIndex}`,
      label: group.label ?? String(group.id ?? `Group ${groupIndex + 1}`),
      items: (Array.isArray(group.items) ? group.items : []).filter(isRenderableItem),
    }))
    .filter((group) => group.items.length);
}

function resolvePlacement(options = {}) {
  const basePlacement = String(options.placement || "bottom-start").toLowerCase();
  const vertical = basePlacement.startsWith("top") ? "top" : "bottom";
  const align = String(options.align || "").toLowerCase();
  if (align === "right") {
    return `${vertical}-end`;
  }
  if (align === "left") {
    return `${vertical}-start`;
  }
  return basePlacement;
}
