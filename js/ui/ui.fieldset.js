import { createElement, clearNode } from "./ui.dom.js";
import { createSelect } from "./ui.select.js";
import { createPasswordField } from "./ui.password.js";

const DEFAULT_OPTIONS = {
  legend: "",
  description: "",
  rows: [],
  className: "",
};

export function createFieldset(container, options = {}) {
  if (!container || typeof container.appendChild !== "function") {
    throw new Error("createFieldset(container, options) requires a host container.");
  }

  let currentOptions = normalizeOptions(options);
  const fields = new Map();
  const displays = new Map();

  const refs = {
    root: createElement("fieldset", { className: "ui-fieldset" }),
    legend: createElement("legend", { className: "ui-fieldset-legend" }),
    description: createElement("p", {
      className: "ui-fieldset-description",
      attrs: { hidden: "hidden" },
    }),
    rows: createElement("div", { className: "ui-fieldset-rows" }),
    hiddenFields: createElement("div", {
      className: "ui-fieldset-hidden-fields",
      attrs: { hidden: "hidden", "aria-hidden": "true" },
    }),
  };

  refs.root.append(refs.legend, refs.description, refs.rows, refs.hiddenFields);
  container.appendChild(refs.root);

  render();

  return {
    root: refs.root,
    legend: refs.legend,
    description: refs.description,
    rows: refs.rows,
    setRows(rows) {
      update({ rows });
    },
    getValues,
    setValue(name, value) {
      const field = fields.get(String(name || "").trim());
      if (!field) {
        return;
      }
      setFieldValue(field, value);
      updateDisplayValue(name, value);
    },
    setValues(values) {
      if (!values || typeof values !== "object") {
        return;
      }
      Object.keys(values).forEach((name) => {
        this.setValue(name, values[name]);
      });
    },
    update,
    destroy() {
      destroyHostedFieldInstances();
      if (refs.root.parentNode) {
        refs.root.parentNode.removeChild(refs.root);
      }
      fields.clear();
      displays.clear();
    },
    refs,
  };

  function update(nextOptions = {}) {
    currentOptions = normalizeOptions({ ...currentOptions, ...(nextOptions || {}) });
    render();
  }

  function render() {
    destroyHostedFieldInstances();
    fields.clear();
    displays.clear();
    applyShell();
    clearNode(refs.rows);
    clearNode(refs.hiddenFields);

    normalizeRows(currentOptions.rows).forEach((row, rowIndex) => {
      const resolvedRow = row.map((item) => resolveItemConfig(item));
      const visibleItems = resolvedRow.filter((item) => isVisibleRenderableItem(item));
      if (!visibleItems.length) {
        resolvedRow.forEach((item, itemIndex) => {
          if (!item || item.type !== "hidden") {
            return;
          }
          const hiddenEl = renderItem(item, rowIndex, itemIndex);
          if (hiddenEl) {
            refs.hiddenFields.appendChild(hiddenEl);
          }
        });
        return;
      }
      const rowEl = createElement("div", {
        className: `ui-fieldset-row is-items-${Math.min(visibleItems.length, 2) || 1}`,
      });
      let renderedVisibleCount = 0;

      resolvedRow.forEach((item, itemIndex) => {
        if (!item) {
          return;
        }
        if (item.type === "hidden") {
          const hiddenEl = renderItem(item, rowIndex, itemIndex);
          if (hiddenEl) {
            refs.hiddenFields.appendChild(hiddenEl);
          }
          return;
        }
        renderedVisibleCount += 1;
        if (renderedVisibleCount > 2) {
          return;
        }
        const itemEl = renderItem(item, rowIndex, itemIndex);
        if (itemEl) {
          rowEl.appendChild(itemEl);
        }
      });

      if (rowEl.childNodes.length) {
        refs.rows.appendChild(rowEl);
      }
    });
  }

  function applyShell() {
    refs.root.className = `ui-fieldset ${String(currentOptions.className || "").trim()}`.trim();
    refs.legend.textContent = String(currentOptions.legend || "").trim();
    refs.legend.hidden = !refs.legend.textContent;
    refs.description.textContent = String(currentOptions.description || "").trim();
    refs.description.hidden = !refs.description.textContent;
  }

  function renderItem(item, rowIndex, itemIndex) {
    const type = String(item.type || "").trim().toLowerCase();
    if (type === "text") {
      return createElement("p", {
        className: getItemClassName("ui-fieldset-text", item),
        text: String(item.content || ""),
      });
    }
    if (type === "alert") {
      return createElement("div", {
        className: getItemClassName(`ui-fieldset-alert is-${normalizeTone(item.tone)}`, item),
        text: String(item.content || ""),
        attrs: { role: "alert" },
      });
    }
    if (type === "divider") {
      return createElement("hr", { className: getItemClassName("ui-fieldset-divider", item) });
    }
    if (type === "display") {
      return renderDisplayItem(item);
    }
    if (type === "content" || type === "custom") {
      return renderCustomItem(item);
    }
    if (type === "image") {
      return renderImageItem(item);
    }
    if (type === "hidden" || type === "input" || type === "textarea" || type === "select" || type === "checkbox" || type === "ui.select") {
      return renderField(item, type, rowIndex, itemIndex);
    }
    return null;
  }

  function renderCustomItem(item) {
    const wrapper = createElement("div", {
      className: getItemClassName("ui-fieldset-content", item),
    });
    setSlot(wrapper, item.content);
    return wrapper;
  }

  function renderImageItem(item) {
    const wrapper = createElement("figure", {
      className: getItemClassName("ui-fieldset-image", item),
    });
    const img = createElement("img", {
      attrs: {
        src: String(item.src || ""),
        alt: String(item.alt || ""),
      },
    });
    wrapper.appendChild(img);
    const caption = String(item.caption || "").trim();
    if (caption) {
      wrapper.appendChild(createElement("figcaption", {
        className: "ui-fieldset-image-caption",
        text: caption,
      }));
    }
    return wrapper;
  }

  function renderDisplayItem(item) {
    const wrapper = createElement("div", {
      className: getItemClassName("ui-field ui-fieldset-field is-display", item),
    });
    const name = String(item.name || "").trim();
    const labelText = String(item.label || "").trim();
    const helpText = String(item.help || "").trim();
    const displayValue = resolveItemValue(item);
    if (labelText) {
      wrapper.appendChild(createElement("label", {
        className: "ui-label",
        text: labelText,
      }));
    }
    const valueEl = createElement("div", {
      className: "ui-fieldset-display-value",
      text: displayValue == null || displayValue === "" ? String(item.emptyText || "-") : String(displayValue),
    });
    wrapper.appendChild(valueEl);
    if (helpText) {
      wrapper.appendChild(createElement("p", {
        className: "ui-fieldset-help",
        text: helpText,
      }));
    }
    if (name) {
      displays.set(name, { name, valueEl, config: { ...item } });
    }
    return wrapper;
  }

  function renderField(item, type, rowIndex, itemIndex) {
    const name = String(item.name || "").trim();
    if (!name) {
      return null;
    }
    const id = `ui-fieldset-${name}-${rowIndex}-${itemIndex}`;
    const wrapper = createElement("div", {
      className: getItemClassName(`ui-field ui-fieldset-field is-${normalizeTypeClass(type)}`, item),
      attrs: type === "hidden" ? { hidden: "hidden" } : {},
    });
    const label = createElement("label", {
      className: type === "checkbox" ? "ui-fieldset-checkbox" : "ui-label",
      attrs: type === "checkbox" || type === "hidden" ? {} : { for: id },
    });
    const labelText = String(item.label || "").trim();
    const helpText = String(item.help || "").trim();
    const value = resolveItemValue(item);
    const control = createControl(type, id, name, item, value);
    if (!control) {
      return null;
    }

    if (type === "hidden") {
      fields.set(name, { name, type, config: { ...item }, wrapper: null, control });
      return control;
    }
    if (type === "ui.select") {
      if (labelText) {
        label.textContent = labelText;
        wrapper.appendChild(label);
      }
      wrapper.appendChild(control);
    } else if (type === "checkbox") {
      label.append(control, createElement("span", {
        className: "ui-fieldset-checkbox-label",
        text: labelText,
      }));
      wrapper.appendChild(label);
    } else {
      if (labelText) {
        label.textContent = labelText;
        wrapper.appendChild(label);
      }
      wrapper.appendChild(control);
    }

    if (helpText) {
      wrapper.appendChild(createElement("p", {
        className: "ui-fieldset-help",
        text: helpText,
      }));
    }

    fields.set(name, { name, type, config: { ...item }, wrapper, control });
    return wrapper;
  }

  function createControl(type, id, name, item, value) {
    const commonAttrs = {
      id,
      name,
      ...(item.required ? { required: "required" } : {}),
      ...(item.disabled ? { disabled: "disabled" } : {}),
      ...(item.autocomplete ? { autocomplete: String(item.autocomplete) } : {}),
      ...(item.min != null ? { min: String(item.min) } : {}),
      ...(item.max != null ? { max: String(item.max) } : {}),
      ...(item.step != null ? { step: String(item.step) } : {}),
      ...(item.pattern ? { pattern: String(item.pattern) } : {}),
      ...(item.inputmode ? { inputmode: String(item.inputmode) } : {}),
    };
    let control = null;

    if (type === "hidden") {
      return createElement("input", {
        attrs: { id, name, type: "hidden", value: value == null ? "" : String(value) },
      });
    }

    if (type === "ui.select") {
      const host = createElement("div", {
        className: "ui-fieldset-select-host",
        attrs: { id },
      });
      const selectInstance = createSelect(host, item.items || item.options || [], {
        ariaLabel: item.ariaLabel || item.label || name,
        placeholder: item.placeholder || "Select...",
        emptyText: item.emptyText || "No options found.",
        searchable: item.searchable !== false,
        multiple: Boolean(item.multiple),
        closeOnSelect: item.closeOnSelect !== false,
        selectOnTab: Boolean(item.selectOnTab),
        clearable: item.clearable !== false,
        selected: value,
      });
      host.__uiSelectInstance = selectInstance;
      return host;
    }

    if (type === "input") {
      if (normalizeInputType(item.input) === "password") {
        const host = createElement("div", { className: "ui-fieldset-password-host" });
        const passwordInstance = createPasswordField(host, {
          id,
          name,
          value: value == null ? "" : String(value),
          placeholder: item.placeholder ? String(item.placeholder) : "",
          autocomplete: item.autocomplete ? String(item.autocomplete) : "",
          required: Boolean(item.required),
          disabled: Boolean(item.disabled),
          readonly: Boolean(item.readonly),
          ariaLabel: item.ariaLabel || item.label || name,
        });
        host.__uiPasswordInstance = passwordInstance;
        return host;
      }
      control = createElement("input", {
        className: "ui-input",
        attrs: {
          ...commonAttrs,
          ...(item.readonly ? { readonly: "readonly" } : {}),
          type: normalizeInputType(item.input),
          value: value == null ? "" : String(value),
          ...(item.placeholder ? { placeholder: String(item.placeholder) } : {}),
        },
      });
    } else if (type === "textarea") {
      control = createElement("textarea", {
        className: "ui-input",
        text: value == null ? "" : String(value),
        attrs: {
          ...commonAttrs,
          ...(item.readonly ? { readonly: "readonly" } : {}),
          ...(item.placeholder ? { placeholder: String(item.placeholder) } : {}),
        },
      });
    } else if (type === "select") {
      control = createElement("select", {
        className: "ui-input",
        attrs: {
          ...commonAttrs,
          ...(item.readonly ? { disabled: "disabled" } : {}),
        },
      });
      normalizeOptionsList(item.options).forEach((option) => {
        const optionEl = createElement("option", {
          text: option.label,
          attrs: { value: option.value },
        });
        if (String(option.value) === String(value ?? "")) {
          optionEl.selected = true;
        }
        control.appendChild(optionEl);
      });
    } else if (type === "checkbox") {
      control = createElement("input", {
        className: "ui-fieldset-checkbox-input",
        attrs: {
          ...commonAttrs,
          type: "checkbox",
          ...(item.readonly ? { disabled: "disabled" } : {}),
          ...(value ? { checked: "checked" } : {}),
        },
      });
      control.checked = Boolean(value);
    }
    return control;
  }

  function getValues() {
    const values = {};
    fields.forEach((field, name) => {
      values[name] = getFieldValue(field);
    });
    displays.forEach((display, name) => {
      if (!Object.prototype.hasOwnProperty.call(values, name)) {
        values[name] = display.valueEl.textContent;
      }
    });
    return values;
  }

  function updateDisplayValue(name, value) {
    const display = displays.get(String(name || "").trim());
    if (!display) {
      return;
    }
    display.valueEl.textContent = value == null || value === "" ? String(display.config.emptyText || "-") : String(value);
  }

  function destroyHostedFieldInstances() {
    fields.forEach((field) => {
      if (field?.type === "ui.select") {
        field.control?.__uiSelectInstance?.destroy?.();
      } else if (field?.type === "input") {
        field.control?.__uiPasswordInstance?.destroy?.();
      }
    });
  }
}

function normalizeOptions(options = {}) {
  return {
    ...DEFAULT_OPTIONS,
    ...(options || {}),
    rows: normalizeRows(options.rows),
  };
}

function normalizeRows(rows) {
  if (!Array.isArray(rows)) {
    return [];
  }
  return rows.map((row) => (Array.isArray(row) ? row.filter(Boolean) : [])).filter((row) => row.length);
}

function normalizeOptionsList(options) {
  if (!Array.isArray(options)) {
    return [];
  }
  return options.map((option) => {
    if (option == null) {
      return null;
    }
    if (typeof option === "string" || typeof option === "number") {
      const value = String(option);
      return { label: value, value };
    }
    const label = String(option.label ?? option.value ?? "").trim();
    const value = String(option.value ?? option.label ?? "").trim();
    if (!label && !value) {
      return null;
    }
    return { label: label || value, value: value || label };
  }).filter(Boolean);
}

function resolveItemConfig(item) {
  if (!item || typeof item !== "object") {
    return item;
  }
  const next = { ...item };
  next.type = String(next.type || "").trim().toLowerCase();
  next.span = normalizeSpan(next.span);
  return next;
}

function isVisibleRenderableItem(item) {
  return Boolean(item && item.type !== "hidden");
}

function getItemClassName(baseClassName, item) {
  const classes = [baseClassName];
  if (normalizeSpan(item?.span) === 2) {
    classes.push("is-span-2");
  }
  if (item?.rowClassName) {
    classes.push(String(item.rowClassName).trim());
  }
  return classes.filter(Boolean).join(" ");
}

function normalizeTone(value) {
  const tone = String(value || "info").trim().toLowerCase();
  if (tone === "danger" || tone === "warning" || tone === "success" || tone === "info") {
    return tone;
  }
  return "info";
}

function normalizeSpan(value) {
  return Number(value) === 2 ? 2 : 1;
}

function normalizeTypeClass(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function normalizeInputType(value) {
  const input = String(value || "text").trim().toLowerCase();
  if (["text", "email", "password", "number", "date", "url", "search"].includes(input)) {
    return input;
  }
  return "text";
}

function resolveItemValue(item) {
  if (Object.prototype.hasOwnProperty.call(item, "value")) {
    return item.value;
  }
  return item.type === "checkbox" ? false : "";
}

function getFieldValue(field) {
  if (field.type === "ui.select") {
    return field.control?.__uiSelectInstance?.getValue?.() ?? (field.config.multiple ? [] : null);
  }
  if (field.type === "input" && field.control?.__uiPasswordInstance) {
    return field.control.__uiPasswordInstance.getValue();
  }
  if (field.type === "checkbox") {
    return Boolean(field.control.checked);
  }
  return field.control.value;
}

function setFieldValue(field, value) {
  if (field.type === "ui.select") {
    field.control?.__uiSelectInstance?.setValue?.(value);
    return;
  }
  if (field.type === "input" && field.control?.__uiPasswordInstance) {
    field.control.__uiPasswordInstance.setValue(value == null ? "" : String(value));
    return;
  }
  if (field.type === "checkbox") {
    field.control.checked = Boolean(value);
    return;
  }
  field.control.value = value == null ? "" : String(value);
}

function setSlot(target, value) {
  clearNode(target);
  if (value == null) {
    return;
  }
  if (typeof value === "function") {
    setSlot(target, value(target));
    return;
  }
  if (value instanceof HTMLElement) {
    target.appendChild(value);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((entry) => setSlot(target, entry));
    return;
  }
  target.appendChild(document.createTextNode(String(value)));
}
