import { createElement, clearNode } from "./ui.dom.js";
import { createActionModal } from "./ui.modal.js";

const DEFAULT_OPTIONS = {
  title: "",
  size: "sm",
  className: "",
  ariaLabel: "Form dialog",
  rows: [],
  initialValues: null,
  submitLabel: "Submit",
  cancelLabel: "Cancel",
  submitVariant: "primary",
  submitIcon: "",
  cancelIcon: "",
  closeOnSuccess: true,
  busyMessage: "Saving...",
  onSubmit: null,
  onChange: null,
  onClose: null,
};

export function createFormModal(options = {}) {
  const currentOptions = normalizeOptions(options);
  const refs = {
    shell: createElement("div", { className: "ui-form-modal" }),
    form: createElement("form", {
      className: "ui-form-modal-form",
      attrs: { novalidate: "novalidate" },
    }),
    rows: createElement("div", { className: "ui-form-modal-rows" }),
    formError: createElement("p", {
      className: "ui-form-error ui-form-modal-form-error",
      attrs: { hidden: "hidden" },
    }),
    submitProxy: createElement("button", {
      className: "ui-form-modal-submit-proxy",
      text: "Submit",
      attrs: { type: "submit", tabindex: "-1", "aria-hidden": "true" },
    }),
  };
  refs.form.append(refs.rows, refs.formError, refs.submitProxy);
  refs.shell.appendChild(refs.form);

  const fields = new Map();
  let destroyed = false;
  let modal = null;

  function render() {
    clearNode(refs.rows);
    fields.clear();
    normalizeRows(currentOptions.rows).forEach((row, rowIndex) => {
      const rowEl = createElement("div", {
        className: `ui-form-modal-row is-items-${Math.min(row.length, 2) || 1}`,
      });
      if (row.length > 2) {
        console.warn(`[createFormModal] Row ${rowIndex + 1} has ${row.length} items; V1 supports at most 2. Rendering first 2 items only.`);
      }
      row.slice(0, 2).forEach((item, itemIndex) => {
        const itemEl = renderItem(item, rowIndex, itemIndex);
        if (itemEl) {
          rowEl.appendChild(itemEl);
        }
      });
      refs.rows.appendChild(rowEl);
    });
  }

  function renderItem(item, rowIndex, itemIndex) {
    if (!item || typeof item !== "object") {
      return null;
    }
    const type = String(item.type || "").trim().toLowerCase();
    if (type === "text") {
      return createElement("p", {
        className: "ui-form-modal-text",
        text: String(item.content || ""),
      });
    }
    if (type === "alert") {
      return createElement("div", {
        className: `ui-form-modal-alert is-${normalizeTone(item.tone)}`,
        text: String(item.content || ""),
        attrs: { role: "alert" },
      });
    }
    if (type === "divider") {
      return createElement("hr", { className: "ui-form-modal-divider" });
    }
    if (type === "input" || type === "textarea" || type === "select" || type === "checkbox") {
      return renderField(item, type, rowIndex, itemIndex);
    }
    console.warn(`[createFormModal] Unsupported item type "${type}".`);
    return null;
  }

  function renderField(item, type, rowIndex, itemIndex) {
    const name = String(item.name || "").trim();
    if (!name) {
      console.warn(`[createFormModal] Field item at row ${rowIndex + 1}, index ${itemIndex + 1} is missing "name".`);
      return null;
    }
    const id = `ui-form-modal-${name}-${rowIndex}-${itemIndex}`;
    const wrapper = createElement("div", {
      className: `ui-field ui-form-modal-field is-${type}`,
    });
    const label = createElement("label", {
      className: type === "checkbox" ? "ui-form-modal-checkbox" : "ui-label",
      attrs: type === "checkbox" ? {} : { for: id },
    });
    const labelText = String(item.label || "").trim();
    const helpText = String(item.help || "").trim();
    const errorEl = createElement("p", {
      className: "ui-form-error ui-form-modal-field-error",
      attrs: { hidden: "hidden", id: `${id}-error` },
    });

    const value = resolveInitialValue(item);
    const control = createControl(type, id, name, item, value, errorEl);
    if (!control) {
      return null;
    }

    if (type === "checkbox") {
      label.append(control, createElement("span", {
        className: "ui-form-modal-checkbox-label",
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
      const helpEl = createElement("p", {
        className: "ui-form-modal-help",
        text: helpText,
        attrs: { id: `${id}-help` },
      });
      wrapper.appendChild(helpEl);
      appendDescribedBy(control, helpEl.id);
    }

    wrapper.appendChild(errorEl);

    fields.set(name, {
      name,
      type,
      config: { ...item },
      wrapper,
      control,
      errorEl,
    });
    return wrapper;
  }

  function createControl(type, id, name, item, value, errorEl) {
    const commonAttrs = {
      id,
      name,
      ...(item.required ? { required: "required" } : {}),
      ...(item.disabled ? { disabled: "disabled" } : {}),
      ...(item.readonly ? { readonly: "readonly" } : {}),
      ...(item.autocomplete ? { autocomplete: String(item.autocomplete) } : {}),
      ...(item.min != null ? { min: String(item.min) } : {}),
      ...(item.max != null ? { max: String(item.max) } : {}),
      ...(item.step != null ? { step: String(item.step) } : {}),
      ...(item.pattern ? { pattern: String(item.pattern) } : {}),
      ...(item.inputmode ? { inputmode: String(item.inputmode) } : {}),
      "aria-describedby": errorEl.id,
    };
    let control = null;
    if (type === "input") {
      control = createElement("input", {
        className: "ui-input",
        attrs: {
          ...commonAttrs,
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
          ...(item.placeholder ? { placeholder: String(item.placeholder) } : {}),
        },
      });
    } else if (type === "select") {
      control = createElement("select", {
        className: "ui-input",
        attrs: commonAttrs,
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
        className: "ui-form-modal-checkbox-input",
        attrs: {
          ...commonAttrs,
          type: "checkbox",
          ...(value ? { checked: "checked" } : {}),
        },
      });
      control.checked = Boolean(value);
    }
    if (!control) {
      return null;
    }
    control.addEventListener("input", () => handleFieldChange(name));
    control.addEventListener("change", () => handleFieldChange(name));
    return control;
  }

  function handleFieldChange(name) {
    clearFieldError(name);
    if (refs.formError.textContent) {
      clearFormError();
    }
    if (typeof currentOptions.onChange === "function") {
      currentOptions.onChange(getValues(), createContext(name));
    }
  }

  async function handleSubmit(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (destroyed || modal.isBusy()) {
      return false;
    }
    clearErrors();
    clearFormError();
    const validation = validate();
    if (!validation.valid) {
      applyErrors(validation.errors);
      focusFirstInvalid(validation.firstInvalidField);
      return false;
    }
    if (typeof currentOptions.onSubmit !== "function") {
      return true;
    }
    modal.setBusy(true, { message: currentOptions.busyMessage });
    try {
      const result = await currentOptions.onSubmit(getValues(), createContext(null));
      if (result) {
        return currentOptions.closeOnSuccess !== false;
      }
      return false;
    } catch (_error) {
      return false;
    } finally {
      if (modal.getState().open) {
        modal.setBusy(false);
      }
    }
  }

  function validate() {
    const errors = {};
    let firstInvalidField = null;
    fields.forEach((field, name) => {
      const control = field.control;
      if (!(control instanceof HTMLElement)) {
        return;
      }
      let message = "";
      if (field.type === "checkbox") {
        if (field.config.required && !control.checked) {
          message = "This field is required.";
        }
      } else if (field.config.required && !getFieldValue(field)) {
        message = "This field is required.";
      } else if (typeof control.checkValidity === "function" && !control.checkValidity()) {
        message = control.validationMessage || "Invalid value.";
      }
      if (message) {
        errors[name] = message;
        if (!firstInvalidField) {
          firstInvalidField = name;
        }
      }
    });
    return {
      valid: !Object.keys(errors).length,
      errors,
      firstInvalidField,
    };
  }

  function focusFirstInvalid(name) {
    if (!name) {
      return;
    }
    const field = fields.get(name);
    if (field?.control && typeof field.control.focus === "function") {
      field.control.focus();
    }
  }

  function applyErrors(errors = {}) {
    Object.keys(errors || {}).forEach((name) => {
      const field = fields.get(name);
      if (!field) {
        return;
      }
      field.errorEl.hidden = false;
      field.errorEl.textContent = String(errors[name] || "");
      field.control.setAttribute("aria-invalid", "true");
    });
  }

  function clearFieldError(name) {
    const field = fields.get(name);
    if (!field) {
      return;
    }
    field.errorEl.hidden = true;
    field.errorEl.textContent = "";
    field.control.removeAttribute("aria-invalid");
  }

  function clearErrors() {
    fields.forEach((_field, name) => clearFieldError(name));
  }

  function setFormError(message) {
    const text = String(message || "").trim();
    refs.formError.textContent = text;
    refs.formError.hidden = !text;
  }

  function clearFormError() {
    setFormError("");
  }

  function getValues() {
    const values = {};
    fields.forEach((field, name) => {
      values[name] = getFieldValue(field);
    });
    return values;
  }

  function setValues(nextValues = {}) {
    Object.keys(nextValues || {}).forEach((name) => {
      const field = fields.get(name);
      if (!field) {
        return;
      }
      setFieldValue(field, nextValues[name]);
    });
  }

  function createContext(changedFieldName) {
    return {
      modal,
      setErrors,
      clearErrors,
      setFormError,
      clearFormError,
      setBusy: (...args) => modal.setBusy(...args),
      isBusy: () => modal.isBusy(),
      changedFieldName,
    };
  }

  function setErrors(fieldErrors = {}) {
    clearErrors();
    applyErrors(fieldErrors);
  }

  function destroy() {
    destroyed = true;
    modal.destroy();
  }

  refs.form.addEventListener("submit", handleSubmit);
  render();

  modal = createActionModal({
    ...currentOptions,
    className: ["ui-form-modal-shell", currentOptions.className || ""].filter(Boolean).join(" "),
    content: refs.shell,
    autoBusy: false,
    actions: [
      {
        id: "cancel",
        label: currentOptions.cancelLabel,
        variant: "ghost",
        icon: currentOptions.cancelIcon || "",
      },
      {
        id: "submit",
        label: currentOptions.submitLabel,
        variant: currentOptions.submitVariant,
        icon: currentOptions.submitIcon || "",
        autoFocus: true,
        closeOnClick: false,
        async onClick(eventContext) {
          const shouldClose = await handleSubmit(eventContext.event);
          if (shouldClose) {
            await modal.close({
              reason: "submit",
              actionId: "submit",
              result: true,
            });
          }
          return false;
        },
      },
    ],
    onClose(meta) {
      currentOptions.onClose?.(meta);
      destroy();
    },
  });

  setValues(currentOptions.initialValues || {});

  return {
    ...modal,
    getValues,
    setValues,
    setErrors,
    clearErrors,
    setFormError,
    clearFormError,
    refs: {
      ...modal.refs,
      shell: refs.shell,
      form: refs.form,
      rows: refs.rows,
      formError: refs.formError,
      fields,
    },
  };
}

function normalizeOptions(options = {}) {
  return {
    ...DEFAULT_OPTIONS,
    ...(options || {}),
    rows: normalizeRows(options.rows),
    initialValues: options.initialValues && typeof options.initialValues === "object" ? { ...options.initialValues } : null,
    submitLabel: String(options.submitLabel || DEFAULT_OPTIONS.submitLabel),
    cancelLabel: String(options.cancelLabel || DEFAULT_OPTIONS.cancelLabel),
    submitVariant: normalizeSubmitVariant(options.submitVariant),
    busyMessage: String(options.busyMessage || DEFAULT_OPTIONS.busyMessage),
  };
}

function normalizeRows(rows) {
  if (!Array.isArray(rows)) {
    return [];
  }
  return rows
    .map((row) => (Array.isArray(row) ? row.filter(Boolean) : []))
    .filter((row) => row.length);
}

function normalizeOptionsList(options) {
  if (!Array.isArray(options)) {
    return [];
  }
  return options
    .map((option) => {
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
    })
    .filter(Boolean);
}

function normalizeSubmitVariant(value) {
  const variant = String(value || "primary").trim().toLowerCase();
  return variant === "danger" ? "danger" : "primary";
}

function normalizeInputType(value) {
  const input = String(value || "text").trim().toLowerCase();
  if (["text", "email", "password", "number", "date", "url", "search"].includes(input)) {
    return input;
  }
  return "text";
}

function normalizeTone(value) {
  const tone = String(value || "info").trim().toLowerCase();
  if (tone === "danger" || tone === "warning" || tone === "success" || tone === "info") {
    return tone;
  }
  return "info";
}

function resolveInitialValue(item) {
  if (Object.prototype.hasOwnProperty.call(item, "value")) {
    return item.value;
  }
  return item.type === "checkbox" ? false : "";
}

function appendDescribedBy(control, id) {
  const current = String(control.getAttribute("aria-describedby") || "").trim();
  const next = [current, id].filter(Boolean).join(" ");
  control.setAttribute("aria-describedby", next);
}

function getFieldValue(field) {
  if (field.type === "checkbox") {
    return Boolean(field.control.checked);
  }
  return field.control.value;
}

function setFieldValue(field, value) {
  if (field.type === "checkbox") {
    field.control.checked = Boolean(value);
    return;
  }
  field.control.value = value == null ? "" : String(value);
}
