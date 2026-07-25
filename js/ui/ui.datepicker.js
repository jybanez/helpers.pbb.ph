import { createElement, clearNode } from "./ui.dom.js";
import { createEventBag } from "./ui.events.js";
import { createCalendar } from "./ui.calendar.js";

const DEFAULT_OPTIONS = {
  className: "",
  ariaLabel: "Date picker",
  locale: "en-US",
  placeholder: "Select date",
  mode: "single", // single | range
  value: null, // single: Date|string|null, range: {start,end}|[start,end]
  closeOnSelect: true,
  weekStartsOn: 0, // 0=Sun
  showTime: false,
  min: null,
  max: null,
  disabledDates: null, // (date:Date) => boolean
  yearRangePast: 80,
  yearRangeFuture: 20,
  panelParent: "auto", // auto | self | body | HTMLElement
  onChange: null,
};

export function createDatepicker(container, options = {}) {
  const events = createEventBag();
  const globalEvents = createEventBag();
  const portalEvents = createEventBag();
  let currentOptions = normalizeOptions(options);
  let open = false;
  let viewDate = startOfMonth(new Date());
  let start = null;
  let end = null;
  let startTime = "00:00";
  let endTime = "00:00";
  let root = null;
  let trigger = null;
  let panel = null;
  let calendar = null;
  let lastFocusedElement = null;
  const panelId = `ui-datepicker-panel-${Math.random().toString(36).slice(2, 10)}`;

  hydrateValue(currentOptions.value);

  function render() {
    if (!container || container.nodeType !== 1) {
      return;
    }
    events.clear();
    globalEvents.clear();
    portalEvents.clear();
    calendar?.destroy();
    calendar = null;
    panel?.remove?.();
    clearNode(container);

    root = createElement("div", {
      className: `ui-datepicker ${currentOptions.className || ""}`.trim(),
    });
    trigger = createElement("button", {
      className: "ui-datepicker-trigger",
      attrs: {
        type: "button",
        "aria-haspopup": "dialog",
        "aria-expanded": open ? "true" : "false",
        "aria-label": currentOptions.ariaLabel,
        "aria-controls": open ? panelId : null,
      },
    });
    trigger.appendChild(createElement("span", {
      className: "ui-datepicker-value",
      text: getDisplayValue(),
    }));
    trigger.appendChild(createElement("span", {
      className: "ui-datepicker-caret",
      html: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>',
    }));
    events.on(trigger, "click", () => {
      if (!open) {
        lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      }
      open = !open;
      render();
    });
    root.appendChild(trigger);
    container.appendChild(root);

    if (open) {
      panel = createElement("div", { className: "ui-datepicker-panel", attrs: { role: "dialog", id: panelId, "aria-label": currentOptions.ariaLabel } });
      const calendarHost = createElement("div", { className: "ui-datepicker-calendar-host" });
      panel.appendChild(calendarHost);
      calendar = createCalendar(calendarHost, {
        ariaLabel: `${currentOptions.ariaLabel} calendar`,
        locale: currentOptions.locale,
        value: start,
        viewDate,
        mode: currentOptions.mode,
        rangeStart: start,
        rangeEnd: end,
        weekStartsOn: currentOptions.weekStartsOn,
        min: currentOptions.min,
        max: currentOptions.max,
        disabledDates: currentOptions.disabledDates,
        yearRangePast: currentOptions.yearRangePast,
        yearRangeFuture: currentOptions.yearRangeFuture,
        onSelect(date) {
          selectDate(date);
        },
        onViewChange(date) {
          viewDate = startOfMonth(date);
        },
      });
      if (currentOptions.showTime) {
        renderTimeSection(panel);
      }
      mountPanel();
      requestAnimationFrame(() => {
        positionPanel();
        panel?.querySelector?.(".ui-calendar-day:not(.is-disabled), .ui-calendar-nav, .ui-calendar-select, .ui-input")?.focus?.();
      });
    }

    bindGlobal();
  }

  function mountPanel() {
    const parent = resolvePanelParent();
    const portaled = parent !== root;
    const ownerModal = root.closest?.("[data-ui-modal-id]");
    panel.classList.toggle("is-portaled", portaled);
    panel.dataset.placement = portaled ? "bottom" : "";
    if (portaled && ownerModal?.dataset?.uiModalId) {
      panel.dataset.uiModalPortalOwner = ownerModal.dataset.uiModalId;
    } else {
      delete panel.dataset.uiModalPortalOwner;
    }
    parent.appendChild(panel);
    if (portaled) {
      positionPanel();
      portalEvents.on(window, "resize", positionPanel);
      portalEvents.on(window, "scroll", positionPanel, true);
      if (window.visualViewport) {
        portalEvents.on(window.visualViewport, "resize", positionPanel);
        portalEvents.on(window.visualViewport, "scroll", positionPanel);
      }
    }
  }

  function resolvePanelParent() {
    const configured = currentOptions.panelParent ?? currentOptions.appendTo ?? "auto";
    if (configured === "self" || configured === false) {
      return root;
    }
    if (configured === "body" || configured === true) {
      return document.body || root;
    }
    if (configured && configured.nodeType === 1) {
      return configured;
    }
    if (typeof configured === "string" && configured !== "auto") {
      return document.querySelector(configured) || root;
    }
    return shouldPortalPanel() ? (document.body || root) : root;
  }

  function shouldPortalPanel() {
    let node = root?.parentElement;
    while (node && node !== document.body && node !== document.documentElement) {
      if (node.classList?.contains("ui-modal") || node.classList?.contains("ui-modal-body") || node.classList?.contains("ui-drawer")) {
        return true;
      }
      const style = window.getComputedStyle?.(node);
      const overflow = `${style?.overflow || ""} ${style?.overflowX || ""} ${style?.overflowY || ""}`;
      if (/\b(auto|scroll|hidden|clip)\b/.test(overflow)) {
        return true;
      }
      node = node.parentElement;
    }
    return false;
  }

  function positionPanel() {
    if (!open || !panel || !trigger || !panel.classList.contains("is-portaled")) {
      return;
    }
    const rect = trigger.getBoundingClientRect();
    const viewport = window.visualViewport;
    const viewportWidth = viewport?.width || document.documentElement.clientWidth || window.innerWidth;
    const viewportHeight = viewport?.height || document.documentElement.clientHeight || window.innerHeight;
    const offsetLeft = viewport?.offsetLeft || 0;
    const offsetTop = viewport?.offsetTop || 0;
    const margin = 8;
    const gap = 6;
    const width = Math.min(Math.max(rect.width, 300), Math.max(180, viewportWidth - margin * 2));

    panel.style.width = `${Math.round(width)}px`;
    panel.style.maxHeight = "";
    panel.style.left = "0px";
    panel.style.top = "0px";

    const measured = panel.getBoundingClientRect();
    const spaceBelow = viewportHeight - rect.bottom - gap - margin;
    const spaceAbove = rect.top - gap - margin;
    const placeAbove = measured.height > spaceBelow && spaceAbove > spaceBelow;
    const availableHeight = Math.max(160, placeAbove ? spaceAbove : spaceBelow);
    const maxHeight = Math.min(Math.max(measured.height, 160), availableHeight);
    const minLeft = offsetLeft + margin;
    const maxLeft = offsetLeft + viewportWidth - width - margin;
    const left = Math.min(Math.max(rect.left + offsetLeft, minLeft), Math.max(minLeft, maxLeft));
    const rawTop = placeAbove ? rect.top + offsetTop - maxHeight - gap : rect.bottom + offsetTop + gap;
    const minTop = offsetTop + margin;
    const maxTop = offsetTop + viewportHeight - maxHeight - margin;
    const top = Math.min(Math.max(rawTop, minTop), Math.max(minTop, maxTop));

    panel.dataset.placement = placeAbove ? "top" : "bottom";
    panel.style.left = `${Math.round(left)}px`;
    panel.style.top = `${Math.round(top)}px`;
    panel.style.maxHeight = `${Math.round(maxHeight)}px`;
  }

  function renderTimeSection(host) {
    const wrap = createElement("div", { className: "ui-datepicker-time" });
    if (currentOptions.mode === "single") {
      wrap.appendChild(createElement("label", { className: "ui-datepicker-time-label", text: "Time" }));
      const input = createElement("input", {
        className: "ui-input",
        attrs: { type: "time" },
      });
      input.value = startTime;
      events.on(input, "input", () => {
        startTime = normalizeTime(input.value);
        emitChange();
      });
      wrap.appendChild(input);
    } else {
      const startLabel = createElement("label", { className: "ui-datepicker-time-label", text: "Start Time" });
      const startInput = createElement("input", { className: "ui-input", attrs: { type: "time" } });
      startInput.value = startTime;
      events.on(startInput, "input", () => {
        startTime = normalizeTime(startInput.value);
        emitChange();
      });

      const endLabel = createElement("label", { className: "ui-datepicker-time-label", text: "End Time" });
      const endInput = createElement("input", { className: "ui-input", attrs: { type: "time" } });
      endInput.value = endTime;
      events.on(endInput, "input", () => {
        endTime = normalizeTime(endInput.value);
        emitChange();
      });

      wrap.append(startLabel, startInput, endLabel, endInput);
    }
    host.appendChild(wrap);
  }

  function selectDate(date) {
    if (currentOptions.mode === "single") {
      start = atTime(date, startTime);
      end = null;
      emitChange();
      if (currentOptions.closeOnSelect) {
        open = false;
      }
      render();
      return;
    }

    if (!start || (start && end)) {
      start = atTime(date, startTime);
      end = null;
      emitChange();
      render();
      return;
    }

    const next = atTime(date, endTime);
    if (compareDay(next, start) < 0) {
      end = start;
      start = atTime(next, startTime);
    } else {
      end = next;
    }
    emitChange();
    if (currentOptions.closeOnSelect) {
      open = false;
    }
    render();
  }

  function getDisplayValue() {
    if (currentOptions.mode === "single") {
      if (!start) {
        return currentOptions.placeholder;
      }
      return formatValue(start, currentOptions.locale, currentOptions.showTime);
    }
    if (!start && !end) {
      return currentOptions.placeholder;
    }
    const s = start ? formatValue(start, currentOptions.locale, currentOptions.showTime) : "";
    const e = end ? formatValue(end, currentOptions.locale, currentOptions.showTime) : "";
    return e ? `${s} - ${e}` : `${s} -`;
  }

  function hydrateValue(value) {
    if (currentOptions.mode === "single") {
      const date = parseAnyDate(value);
      start = date;
      end = null;
      if (date) {
        startTime = formatTime(date);
        viewDate = startOfMonth(date);
      }
      return;
    }

    const pair = parseRange(value);
    start = pair.start;
    end = pair.end;
    if (start) {
      startTime = formatTime(start);
      viewDate = startOfMonth(start);
    }
    if (end) {
      endTime = formatTime(end);
    }
  }

  function emitChange() {
    if (typeof currentOptions.onChange !== "function") {
      return;
    }
    currentOptions.onChange(getValue(), getState());
  }

  function bindGlobal() {
    globalEvents.clear();
    if (!open) {
      return;
    }
    globalEvents.on(document, "mousedown", (event) => {
      const target = event.target;
      if (target && !isInsideDatepicker(target)) {
        open = false;
        render();
        restoreFocus();
      }
    });
    globalEvents.on(document, "keydown", (event) => {
      if (event.key === "Escape") {
        open = false;
        render();
        restoreFocus();
      }
    });
  }

  function isInsideDatepicker(target) {
    return Boolean((root && root.contains(target)) || (panel && panel.contains(target)));
  }

  function restoreFocus() {
    if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
      try {
        lastFocusedElement.focus();
      } catch (_error) {
        // Ignore focus restore failures.
      }
    }
    lastFocusedElement = null;
  }

  function update(nextOptions = {}) {
    currentOptions = normalizeOptions({ ...currentOptions, ...(nextOptions || {}) });
    hydrateValue(currentOptions.value);
    render();
  }

  function setValue(nextValue) {
    hydrateValue(nextValue);
    emitChange();
    render();
  }

  function getValue() {
    if (currentOptions.mode === "single") {
      return start ? start.toISOString() : null;
    }
    return {
      start: start ? start.toISOString() : null,
      end: end ? end.toISOString() : null,
    };
  }

  function getState() {
    return {
      open,
      mode: currentOptions.mode,
      viewDate: viewDate.toISOString(),
      start: start ? start.toISOString() : null,
      end: end ? end.toISOString() : null,
      startTime,
      endTime,
      options: { ...currentOptions },
    };
  }

  function destroy() {
    globalEvents.clear();
    portalEvents.clear();
    events.clear();
    calendar?.destroy();
    panel?.remove?.();
    clearNode(container);
    root = null;
    trigger = null;
    panel = null;
    calendar = null;
  }

  render();

  return {
    update,
    setValue,
    getValue,
    getState,
    destroy,
  };
}

function normalizeOptions(options) {
  const next = { ...DEFAULT_OPTIONS, ...(options || {}) };
  if (options && Object.prototype.hasOwnProperty.call(options, "appendTo") && !Object.prototype.hasOwnProperty.call(options, "panelParent")) {
    next.panelParent = options.appendTo;
  }
  next.ariaLabel = String(next.ariaLabel || "Date picker");
  next.mode = next.mode === "range" ? "range" : "single";
  const week = Number(next.weekStartsOn);
  next.weekStartsOn = Number.isFinite(week) ? ((week % 7) + 7) % 7 : 0;
  const past = Number(next.yearRangePast);
  const future = Number(next.yearRangeFuture);
  next.yearRangePast = Number.isFinite(past) && past >= 0 ? Math.floor(past) : DEFAULT_OPTIONS.yearRangePast;
  next.yearRangeFuture = Number.isFinite(future) && future >= 0 ? Math.floor(future) : DEFAULT_OPTIONS.yearRangeFuture;
  return next;
}

function parseAnyDate(value) {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : new Date(value.getTime());
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseRange(value) {
  if (Array.isArray(value)) {
    return {
      start: parseAnyDate(value[0]),
      end: parseAnyDate(value[1]),
    };
  }
  if (value && typeof value === "object") {
    return {
      start: parseAnyDate(value.start),
      end: parseAnyDate(value.end),
    };
  }
  return { start: null, end: null };
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function compareDay(a, b) {
  const x = startOfDay(a).getTime();
  const y = startOfDay(b).getTime();
  if (x === y) {
    return 0;
  }
  return x < y ? -1 : 1;
}

function formatValue(date, locale, withTime) {
  if (!withTime) {
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    }).format(date);
  }
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatTime(date) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function normalizeTime(value) {
  const text = String(value || "").trim();
  if (!/^\d{2}:\d{2}$/.test(text)) {
    return "00:00";
  }
  const [h, m] = text.split(":").map((part) => Number(part));
  if (!Number.isFinite(h) || !Number.isFinite(m)) {
    return "00:00";
  }
  const clampedH = Math.max(0, Math.min(23, h));
  const clampedM = Math.max(0, Math.min(59, m));
  return `${String(clampedH).padStart(2, "0")}:${String(clampedM).padStart(2, "0")}`;
}

function atTime(date, time) {
  const next = new Date(date.getTime());
  const normalized = normalizeTime(time);
  const [h, m] = normalized.split(":").map((part) => Number(part));
  next.setHours(h, m, 0, 0);
  return next;
}
