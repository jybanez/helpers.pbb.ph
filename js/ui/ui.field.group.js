import { createCheckbox } from "./ui.checkbox.js";
import { createCheckboxGroup } from "./ui.checkbox.group.js";

const DEFAULT_OPTIONS = {
  name: "",
  label: "",
  value: null,
  repeatable: false,
  required: false,
  fields: [],
  addLabel: "",
  removeLabel: "Remove",
  emptyItem: null,
  onChange: null,
};

export function createFieldGroup(container, options = {}) {
  if (!container || typeof container.appendChild !== "function") {
    throw new Error("createFieldGroup(container, options) requires a host container.");
  }

  let currentOptions = normalizeOptions(options);
  let value = normalizeValue(currentOptions.value, currentOptions);
  const listeners = [];

  const refs = {
    root: document.createElement("div"),
    labelRow: document.createElement("div"),
    label: document.createElement("div"),
    required: document.createElement("span"),
    body: document.createElement("div"),
  };

  refs.root.className = "ui-field-group";
  refs.labelRow.className = "ui-field-group-label-row";
  refs.label.className = "ui-label ui-field-group-label";
  refs.required.className = "ui-field-group-required";
  refs.required.textContent = "Required";
  refs.body.className = "ui-field-group-body";
  refs.labelRow.append(refs.label, refs.required);
  refs.root.append(refs.labelRow, refs.body);
  container.appendChild(refs.root);

  render();

  return {
    root: refs.root,
    getValue() {
      return cloneValue(value);
    },
    setValue(nextValue, meta = {}) {
      value = normalizeValue(nextValue, currentOptions);
      render();
      if (meta.emit !== false) {
        emitChange();
      }
    },
    update(nextOptions = {}) {
      currentOptions = normalizeOptions({ ...currentOptions, ...(nextOptions || {}) });
      value = normalizeValue(
        Object.prototype.hasOwnProperty.call(nextOptions || {}, "value") ? nextOptions.value : value,
        currentOptions
      );
      render();
    },
    validate() {
      return validateGroup(currentOptions, value);
    },
    destroy() {
      clearListeners();
      refs.root.remove();
    },
  };

  function render() {
    clearListeners();
    refs.root.dataset.repeatable = currentOptions.repeatable ? "true" : "false";
    refs.label.textContent = currentOptions.label || currentOptions.name || "Group";
    refs.labelRow.hidden = !refs.label.textContent && !currentOptions.required;
    refs.required.hidden = !currentOptions.required;
    clearNode(refs.body);

    const items = currentOptions.repeatable ? value : [value && typeof value === "object" ? value : {}];
    const renderItems = currentOptions.repeatable && !items.length ? [createEmptyItem(currentOptions)] : items;

    renderItems.forEach((item, index) => {
      refs.body.appendChild(renderItem(item, index, renderItems.length));
    });

    if (currentOptions.repeatable) {
      const add = document.createElement("button");
      add.type = "button";
      add.className = "ui-field-group-add";
      add.textContent = currentOptions.addLabel || `Add ${currentOptions.label || "Entry"}`;
      on(add, "click", () => {
        value = [...safeArray(value), createEmptyItem(currentOptions)];
        render();
        emitChange();
      });
      refs.body.appendChild(add);
    }
  }

  function renderItem(item, index, itemCount) {
    const itemEl = document.createElement("div");
    itemEl.className = "ui-field-group-item";

    if (currentOptions.repeatable) {
      const header = document.createElement("div");
      header.className = "ui-field-group-item-header";

      const title = document.createElement("span");
      title.className = "ui-field-group-item-title";
      title.textContent = `${currentOptions.label || "Entry"} ${index + 1}`;

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "ui-field-group-remove";
      remove.textContent = currentOptions.removeLabel;
      remove.disabled = itemCount <= 1 && currentOptions.required;
      on(remove, "click", () => {
        value = safeArray(value).filter((_, itemIndex) => itemIndex !== index);
        render();
        emitChange();
      });

      header.append(title, remove);
      itemEl.appendChild(header);
    }

    const grid = document.createElement("div");
    grid.className = "ui-field-group-grid";
    currentOptions.fields.forEach((field) => {
      const childKey = getFieldKey(field);
      if (!childKey) {
        return;
      }
      grid.appendChild(renderChildField(field, item, index));
    });
    itemEl.appendChild(grid);
    return itemEl;
  }

  function renderChildField(field, item, index) {
    const childKey = getFieldKey(field);
    const type = getFieldType(field);
    const row = document.createElement("div");
    row.className = "ui-field ui-field-group-child";
    row.dataset.fieldKey = childKey;

    const label = document.createElement("label");
    label.className = type === "checkbox" ? "ui-field-group-checkbox" : "ui-label";
    label.textContent = getFieldLabel(field, childKey);

    const control = createControl(field, item?.[childKey] ?? field?.default_value ?? "");
    if (!control) {
      return row;
    }

    if (type === "checkbox") {
      row.appendChild(control);
    } else {
      row.append(label, control);
    }

    const updateValue = () => {
      const nextItems = currentOptions.repeatable
        ? safeArray(value).map((sourceItem) => ({ ...(sourceItem || {}) }))
        : [{ ...(value && typeof value === "object" ? value : {}) }];
      if (!nextItems[index]) {
        nextItems[index] = {};
      }
      nextItems[index][childKey] = getControlValue(control, field);
      value = currentOptions.repeatable ? nextItems : nextItems[0];
      emitChange();
    };

    on(control, "change", updateValue);
    if (!["select", "multiselect", "checkbox"].includes(type)) {
      on(control, "input", updateValue);
    }

    return row;
  }

  function createControl(field, rawValue) {
    const type = getFieldType(field);
    if (type === "textarea") {
      const textarea = document.createElement("textarea");
      textarea.className = "ui-input";
      textarea.value = rawValue == null ? "" : String(rawValue);
      applyCommonAttrs(textarea, field);
      return textarea;
    }

    if (type === "select") {
      const select = document.createElement("select");
      select.className = "ui-input";
      applyCommonAttrs(select, field);
      if (field?.placeholder !== false) {
        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.textContent = String(field?.placeholder || "Select");
        select.appendChild(placeholder);
      }
      normalizeOptionsList(field?.options).forEach((option) => {
        const optionEl = document.createElement("option");
        optionEl.value = option.value;
        optionEl.textContent = option.label;
        select.appendChild(optionEl);
      });
      select.value = rawValue == null ? "" : String(rawValue);
      return select;
    }

    if (type === "multiselect") {
      const wrap = document.createElement("div");
      wrap.className = "ui-field-group-multiselect";
      const selected = new Set(
        (Array.isArray(rawValue) ? rawValue : String(rawValue || "").split(","))
          .map((item) => String(item).trim())
          .filter(Boolean)
      );
      normalizeOptionsList(field?.options).forEach((option) => {
        const optionLabel = document.createElement("label");
        optionLabel.className = "ui-field-group-multiselect-option";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = option.value;
        checkbox.checked = selected.has(option.value);
        const text = document.createElement("span");
        text.textContent = option.label;
        optionLabel.append(checkbox, text);
        wrap.appendChild(optionLabel);
      });
      return wrap;
    }

    if (type === "checkbox-group") {
      const host = document.createElement("div");
      host.className = "ui-field-group-checkbox-group-host";
      const checkboxGroup = createCheckboxGroup(host, {
        name: getFieldKey(field),
        label: getFieldLabel(field, getFieldKey(field)),
        values: rawValue,
        options: field?.options,
        min: field?.min,
        max: field?.max,
        disabled: Boolean(field?.disabled),
        readonly: Boolean(field?.readonly),
        help: field?.help || "",
      });
      host.__uiCheckboxGroupInstance = checkboxGroup;
      return host;
    }

    const input = document.createElement("input");
    input.className = "ui-input";
    if (type === "checkbox") {
      const host = document.createElement("div");
      host.className = "ui-field-group-checkbox-host";
      const checkbox = createCheckbox(host, {
        name: getFieldKey(field),
        label: getFieldLabel(field, getFieldKey(field)),
        checked: Boolean(rawValue),
        value: rawValue,
        ...(Object.prototype.hasOwnProperty.call(field, "checkedValue") ? { checkedValue: field.checkedValue } : {}),
        ...(Object.prototype.hasOwnProperty.call(field, "uncheckedValue") ? { uncheckedValue: field.uncheckedValue } : {}),
        required: isRequiredField(field),
        disabled: Boolean(field?.disabled),
        readonly: Boolean(field?.readonly),
        help: field?.help || "",
      });
      host.__uiCheckboxInstance = checkbox;
      return host;
    }
    input.type = type === "number" ? "number" : "text";
    input.value = rawValue == null ? "" : String(rawValue);
    applyCommonAttrs(input, field);
    return input;
  }

  function emitChange() {
    currentOptions.onChange?.(cloneValue(value), {
      name: currentOptions.name,
      validation: validateGroup(currentOptions, value),
    });
  }

  function on(el, event, handler) {
    el.addEventListener(event, handler);
    listeners.push(() => el.removeEventListener(event, handler));
  }

  function clearListeners() {
    listeners.splice(0).forEach((off) => off());
  }
}

export function normalizeFieldGroupValue(field, rawValue) {
  return normalizeValue(rawValue, normalizeOptions(field));
}

export function validateFieldGroup(field, rawValue) {
  const options = normalizeOptions(field);
  return validateGroup(options, normalizeValue(rawValue, options));
}

export function serializeFieldGroupValue(field, rawValue) {
  return JSON.stringify(normalizeFieldGroupValue(field, rawValue));
}

export function parseFieldGroupValue(field, rawValue) {
  const options = normalizeOptions(field);
  if (!rawValue) {
    return normalizeValue(null, options);
  }
  if (typeof rawValue === "object") {
    return normalizeValue(rawValue, options);
  }
  try {
    return normalizeValue(JSON.parse(String(rawValue)), options);
  } catch (_) {
    return normalizeValue(null, options);
  }
}

function validateGroup(options, rawValue) {
  const errors = [];
  const items = options.repeatable ? safeArray(rawValue) : [rawValue && typeof rawValue === "object" ? rawValue : {}];

  if (options.required && (!items.length || items.every((item) => isEmptyItem(item, options.fields)))) {
    errors.push({ field_key: options.name, error: "Required group entry is missing" });
  }

  items.forEach((item, index) => {
    options.fields.forEach((field) => {
      const childKey = getFieldKey(field);
      const childValue = item && typeof item === "object" ? item[childKey] : "";
      const trimmed = String(childValue ?? "").trim();
      const nestedKey = options.repeatable ? `${options.name}.${index}.${childKey}` : `${options.name}.${childKey}`;

      if (isRequiredField(field) && !trimmed) {
        errors.push({ field_key: nestedKey, error: "Required value is missing" });
      }

      if (getFieldType(field) === "number" && trimmed) {
        const numeric = Number(trimmed);
        if (!Number.isFinite(numeric)) {
          errors.push({ field_key: nestedKey, error: "Value must be a valid number" });
        } else {
          if (field?.min !== null && field?.min !== undefined && field?.min !== "" && numeric < Number(field.min)) {
            errors.push({ field_key: nestedKey, error: `Value must be >= ${field.min}` });
          }
          if (field?.max !== null && field?.max !== undefined && field?.max !== "" && numeric > Number(field.max)) {
            errors.push({ field_key: nestedKey, error: `Value must be <= ${field.max}` });
          }
        }
      }
    });
  });

  return {
    status: errors.length === 0,
    errors,
  };
}

function normalizeOptions(options = {}) {
  const name = getFieldKey(options) || String(options.name || "");
  return {
    ...DEFAULT_OPTIONS,
    ...(options || {}),
    name,
    label: getFieldLabel(options, name || "Group"),
    repeatable: Boolean(options?.repeatable ?? options?.multiple),
    required: isRequiredField(options),
    fields: normalizeChildFields(options),
  };
}

function normalizeValue(rawValue, options) {
  if (options.repeatable) {
    if (Array.isArray(rawValue)) {
      return rawValue.map((item) => normalizeItem(item, options));
    }
    if (rawValue && typeof rawValue === "object") {
      return [normalizeItem(rawValue, options)];
    }
    return [];
  }
  return normalizeItem(rawValue, options);
}

function normalizeItem(rawValue, options) {
  const source = rawValue && typeof rawValue === "object" && !Array.isArray(rawValue) ? rawValue : {};
  return options.fields.reduce((acc, field) => {
    const key = getFieldKey(field);
    if (key) {
      acc[key] = source[key] ?? field?.default_value ?? "";
    }
    return acc;
  }, {});
}

function createEmptyItem(options) {
  if (options.emptyItem && typeof options.emptyItem === "object" && !Array.isArray(options.emptyItem)) {
    return normalizeItem(options.emptyItem, options);
  }
  return normalizeItem({}, options);
}

function getFieldKey(field) {
  return String(field?.field_key ?? field?.key ?? field?.name ?? "");
}

function getFieldLabel(field, fallback = "Field") {
  return String(field?.field_label ?? field?.label ?? fallback);
}

function getFieldType(field) {
  return String(field?.input_type ?? field?.type ?? field?.input ?? "text").toLowerCase();
}

function isRequiredField(field) {
  return Boolean(field?.is_required ?? field?.required);
}

function normalizeChildFields(field) {
  return safeArray(field?.fields).map((child, index) => ({
    sort_order: index + 1,
    ...child,
  })).sort((a, b) => Number(a?.sort_order || 0) - Number(b?.sort_order || 0));
}

function normalizeOptionsList(options) {
  return safeArray(options).map((option) => {
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

function getControlValue(control, field) {
  if (getFieldType(field) === "multiselect") {
    return safeArray(control.querySelectorAll('input[type="checkbox"]:checked'))
      .map((checkbox) => checkbox.value)
      .join(",");
  }
  if (getFieldType(field) === "checkbox-group") {
    return control.__uiCheckboxGroupInstance?.getValue?.() ?? [];
  }
  if (getFieldType(field) === "checkbox") {
    return control.__uiCheckboxInstance?.getValue?.() ?? false;
  }
  return control.value ?? "";
}

function applyCommonAttrs(control, field) {
  if (isRequiredField(field)) {
    control.required = true;
  }
  if (field?.disabled) {
    control.disabled = true;
  }
  if (field?.readonly) {
    control.readOnly = true;
  }
  if (field?.placeholder && "placeholder" in control) {
    control.placeholder = String(field.placeholder);
  }
  ["min", "max", "step", "autocomplete", "inputmode", "pattern"].forEach((attr) => {
    if (field?.[attr] !== null && field?.[attr] !== undefined && field?.[attr] !== "") {
      control.setAttribute(attr, String(field[attr]));
    }
  });
}

function isEmptyItem(item, fields) {
  if (!item || typeof item !== "object") {
    return true;
  }
  return fields.every((field) => !String(item[getFieldKey(field)] ?? "").trim());
}

function clearNode(node) {
  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function cloneValue(value) {
  try {
    return structuredClone(value);
  } catch (_) {
    return JSON.parse(JSON.stringify(value));
  }
}
