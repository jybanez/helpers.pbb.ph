import { clearNode } from "./ui.dom.js";

/** Strict RGB channels and straight (unpremultiplied) alpha. HEX alpha is trailing. */
export function parseColor(value) {
  let channels;
  if (value && typeof value === "object" && !Array.isArray(value)) {
    channels = [value.r, value.g, value.b, value.a === undefined ? 1 : value.a];
  } else if (typeof value === "string") {
    const text = value.trim();
    const hex = /^#([\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i.exec(text);
    if (hex) {
      const digits = hex[1].length < 5 ? [...hex[1]].map(c => c + c).join("") : hex[1];
      channels = [0, 2, 4].map(i => parseInt(digits.slice(i, i + 2), 16));
      channels.push(digits.length === 8 ? parseInt(digits.slice(6), 16) / 255 : 1);
    } else {
      const rgb = /^(rgb|rgba)\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*(0(?:\.\d+)?|1(?:\.0+)?|\.\d+))?\s*\)$/i.exec(text);
      if (rgb && ((rgb[1].toLowerCase() === "rgba") === (rgb[5] !== undefined))) {
        channels = [Number(rgb[2]), Number(rgb[3]), Number(rgb[4]), rgb[5] === undefined ? 1 : Number(rgb[5])];
      }
    }
  }
  if (!channels || channels.some((n, i) => typeof n !== "number" || !Number.isFinite(n) || n < 0 || n > (i === 3 ? 1 : 255) || (i < 3 && !Number.isInteger(n)))) {
    throw new TypeError("Color must be HEX, rgb()/rgba(), or { r, g, b, a } with integer RGB 0–255 and alpha 0–1.");
  }
  const [r, g, b, a] = channels;
  return { r, g, b, a };
}

export function colorToHex(value, includeAlpha = true) {
  const { r, g, b, a } = parseColor(value);
  return "#" + [r, g, b, ...(includeAlpha ? [Math.round(a * 255)] : [])].map(n => n.toString(16).padStart(2, "0")).join("");
}

export function colorToRgba(value) {
  const { r, g, b, a } = parseColor(value);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

let nextId = 0;
const DEFAULTS = { value: "#000000", label: "Color", showAlpha: true, showRgba: true, showHex: true, disabled: false, busy: false, readonly: false, onInput: null, onChange: null };

export function createColorPicker(container, options = {}) {
  if (!container || container.nodeType !== 1) throw new TypeError("createColorPicker requires a host element.");
  let settings = { ...DEFAULTS, ...options };
  let value = parseColor(settings.value);
  let destroyed = false;
  let notifying = false;
  const doc = container.ownerDocument;
  const id = options.id || `ui-color-picker-${++nextId}`;
  const root = doc.createElement("div");
  root.className = "ui-color-picker";
  root.setAttribute("role", "group");
  const rgbLabel = doc.createElement("label");
  rgbLabel.htmlFor = id;
  const rgb = doc.createElement("input");
  rgb.type = "color";
  rgb.id = id;
  rgb.className = "ui-color-picker-rgb";
  const swatch = doc.createElement("span");
  swatch.className = "ui-color-picker-swatch";
  swatch.setAttribute("aria-hidden", "true");
  const paint = doc.createElement("span");
  swatch.append(paint);
  const alphaRow = doc.createElement("div");
  alphaRow.className = "ui-color-picker-alpha";
  const alphaLabel = doc.createElement("label");
  alphaLabel.htmlFor = `${id}-alpha`;
  alphaLabel.textContent = "Opacity";
  const alpha = doc.createElement("input");
  Object.assign(alpha, { type: "range", id: `${id}-alpha`, min: "0", max: "1", step: "0.001" });
  const alphaValue = doc.createElement("output");
  alphaValue.htmlFor = alpha.id;
  alphaRow.append(alphaLabel, alpha, alphaValue);
  const displayRow = doc.createElement("div");
  displayRow.className = "ui-color-picker-displays";
  function display(kind) {
    const label = doc.createElement("label");
    label.textContent = kind;
    const input = doc.createElement("input");
    input.type = "text";
    input.readOnly = true;
    input.className = "ui-input";
    input.setAttribute("aria-label", `${kind} color value`);
    label.append(input);
    displayRow.append(label);
    return { label, input };
  }
  const rgba = display("RGBA"), hex = display("HEX");
  const hidden = doc.createElement("input");
  hidden.type = "hidden";
  root.append(rgbLabel, rgb, swatch, alphaRow, displayRow, hidden);
  clearNode(container);
  container.append(root);
  function sync() {
    const label = String(settings.label || "Color");
    rgbLabel.textContent = label;
    root.setAttribute("aria-label", settings.ariaLabel || label);
    root.setAttribute("aria-busy", String(Boolean(settings.busy)));
    rgb.setAttribute("aria-label", settings.ariaLabel || label);
    alpha.setAttribute("aria-label", `${settings.ariaLabel || label} opacity`);
    rgb.value = colorToHex(value, false);
    alpha.value = String(value.a);
    alpha.setAttribute("aria-valuetext", `${value.a * 100}% opacity`);
    alphaValue.textContent = `${Math.round(value.a * 10000) / 100}%`;
    rgba.input.value = colorToRgba(value);
    hex.input.value = colorToHex(value);
    paint.style.backgroundColor = colorToRgba(value);
    alphaRow.hidden = !settings.showAlpha;
    rgba.label.hidden = !settings.showRgba;
    hex.label.hidden = !settings.showHex;
    displayRow.hidden = !settings.showRgba && !settings.showHex;
    const unavailable = Boolean(settings.disabled || settings.busy || settings.readonly);
    rgb.disabled = alpha.disabled = unavailable;
    root.classList.toggle("is-disabled", unavailable);
    hidden.name = settings.name || "";
    hidden.value = colorToRgba(value);
    hidden.disabled = Boolean(settings.disabled || settings.busy);
  }
  function notify(type, event) {
    // Callbacks may set/update values silently; explicit emitting inside a callback is suppressed.
    if (notifying || destroyed) return;
    const detail = Object.freeze({ value: Object.freeze({ ...value }), hex: colorToHex(value), rgba: colorToRgba(value), event: event || null });
    notifying = true;
    try {
      container.dispatchEvent(new doc.defaultView.CustomEvent(`ui:color:${type}`, { detail, bubbles: true }));
      settings[type === "input" ? "onInput" : "onChange"]?.(detail, api);
    } finally { notifying = false; }
  }
  function handle(event) {
    if (destroyed || settings.disabled || settings.busy || settings.readonly) { sync(); return; }
    value = event.target === rgb ? { ...parseColor(rgb.value), a: value.a } : { ...value, a: Number(alpha.value) };
    sync();
    notify(event.type, event);
  }
  for (const control of [rgb, alpha]) for (const type of ["input", "change"]) control.addEventListener(type, handle);
  const api = {
    element: root, input: rgb, alphaInput: alpha,
    getValue: () => ({ ...value }),
    getHex: () => colorToHex(value),
    getRgba: () => colorToRgba(value),
    getState: () => ({ ...settings, value: { ...value }, destroyed }),
    setValue(next, { emit = false } = {}) {
      if (destroyed) return;
      const parsed = parseColor(next);
      const changed = ["r", "g", "b", "a"].some(key => parsed[key] !== value[key]);
      value = parsed; sync();
      if (emit && changed) notify("change");
    },
    update(next = {}) {
      if (destroyed) return;
      const parsed = Object.prototype.hasOwnProperty.call(next, "value") ? parseColor(next.value) : value;
      settings = { ...settings, ...next }; value = parsed; sync();
    },
    setDisabled(disabled) { api.update({ disabled: Boolean(disabled) }); },
    setBusy(busy) { api.update({ busy: Boolean(busy) }); },
    focus() { if (!destroyed) rgb.focus(); },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      for (const control of [rgb, alpha]) for (const type of ["input", "change"]) control.removeEventListener(type, handle);
      root.remove();
    },
  };
  sync();
  return api;
}
