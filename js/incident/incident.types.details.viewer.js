import { createRoot, normalizeIncidentOptions, safeArray } from "./incident.base.js";
import {
  isRepeatableFieldGroup,
  parseFieldGroupValue,
  resolveFieldGroupFields,
} from "../ui/ui.field.group.js";

import { createPropertyViewer } from "../ui/ui.property.viewer.js?v=0.21.220";

export function incidentTypesDetailsViewer(container, data, options = {}) {
  let currentData = normalizeIncidentTypeData(data);
  let currentOptions = normalizeIncidentOptions(options);
  let missingRequired = false;
  let propertyViewer = null;

  function validateRequired() {
    const missing = [];
    if (!currentData || typeof currentData !== "object") {
      missing.push("data");
    }
    if (!currentData?.incident_type_id && !currentData?.id) {
      missing.push("data.incident_type_id");
    }
    if (missing.length) {
      console.error(`[incident.types.details.viewer] Missing required input: ${missing.join(", ")}`);
      return false;
    }
    return true;
  }

  function getFieldValue(field) {
    const match = currentData.detail_entries.find((item) => item?.field_key === getFieldKey(field));
    if (!match) {
      return "-";
    }
    const value = String(match?.field_value ?? "").trim();
    return value || "-";
  }

  function getRawFieldValue(field) {
    const match = currentData.detail_entries.find((item) => item?.field_key === getFieldKey(field));
    return match?.field_value ?? "";
  }

  function getResourceQuantity(resourceTypeId) {
    const match = currentData.resources_needed.find(
      (item) => String(item?.resource_type_id) === String(resourceTypeId)
    );
    if (!match) {
      return 0;
    }
    const value = Number(match?.quantity_needed);
    return Number.isFinite(value) ? value : 0;
  }

  function renderHeader(root) {
    const header = document.createElement("header");
    header.className = "hh-type-header";

    const titleWrap = document.createElement("div");
    titleWrap.className = "hh-type-title-wrap";
    const title = document.createElement("h4");
    title.className = "hh-title ui-title";
    title.textContent = currentData.name || `Incident Type #${currentData.incident_type_id ?? currentData.id ?? "-"}`;
    titleWrap.appendChild(title);

    if (currentData.incident_type_category_name) {
      const subtitle = document.createElement("p");
      subtitle.className = "hh-meta";
      subtitle.textContent = currentData.incident_type_category_name;
      titleWrap.appendChild(subtitle);
    }

    header.appendChild(titleWrap);
    root.appendChild(header);
  }

  function buildFieldSections() {
    if (!safeArray(currentData.detail_entries).length) return [];
    const fields = [...safeArray(currentData.fields)].sort(
      (a, b) => Number(a?.sort_order || 0) - Number(b?.sort_order || 0)
    );
    const sections = [];
    let scalarSection = null;
    fields.forEach((field, fieldIndex) => {
      if (getFieldType(field) !== "group") {
        if (!scalarSection) {
          scalarSection = { id: 'fields-' + fieldIndex, title: "", properties: [] };
          sections.push(scalarSection);
        }
        scalarSection.properties.push({
          id: getFieldKey(field) || 'field-' + fieldIndex,
          label: getFieldLabel(field, getFieldKey(field) || "Field"),
          value: getFieldValue(field),
        });
        return;
      }
      scalarSection = null;
      const label = getFieldLabel(field, getFieldKey(field) || "Field");
      const childFields = resolveFieldGroupFields(field);
      const completeNameField = childFields.find((child) => {
        const template = child?.computed?.template;
        return getFieldKey(child) === "name" && typeof template === "string"
          && template.includes("{first_name}") && template.includes("{last_name}");
      });
      const parsed = parseFieldGroupValue(field, getRawFieldValue(field));
      const repeatable = isRepeatableFieldGroup(field);
      const items = (repeatable ? parsed : [parsed]).filter((item) => !isEmptyGroupItem(item, childFields));
      if (!items.length) {
        sections.push({ id: 'group-' + fieldIndex, title: "", properties: [{ id: getFieldKey(field), label, value: "-" }] });
      }
      items.forEach((item, index) => {
        const properties = childFields.flatMap((child) => {
          const key = getFieldKey(child);
          if (completeNameField && String(item?.name ?? "").trim()
            && (key === "first_name" || key === "last_name")) return [];
          const value = String(item?.[key] ?? "").trim();
          return value ? [{ id: key, label: getFieldLabel(child, key), value }] : [];
        });
        sections.push({
          id: 'group-' + fieldIndex + '-' + index,
          title: repeatable ? label + ' #' + (index + 1) : label,
          properties,
        });
      });
    });
    return sections;
  }

  function buildResourcesSection() {
    const properties = safeArray(currentData.resources).flatMap((resource) => {
      const resourceTypeId = resource?.id ?? resource?.resource_type_id;
      const quantity = getResourceQuantity(resourceTypeId);
      return quantity > 0 ? [{
        id: String(resourceTypeId),
        label: resource?.name || resource?.resource_type?.name || 'Resource #' + (resourceTypeId ?? "-"),
        value: quantity,
      }] : [];
    });
    return properties.length ? [{ id: "resources", title: "Resources Needed", properties }] : [];
  }

  function render() {
    propertyViewer?.destroy();
    propertyViewer = null;
    const root = createRoot(container, "hh-incident-types-details-viewer", currentOptions);
    if (!root) {
      return;
    }
    missingRequired = !validateRequired();
    if (missingRequired) {
      return;
    }
    renderHeader(root);
    const sections = [...buildFieldSections(), ...buildResourcesSection()];
    if (sections.length) {
      const host = document.createElement("div");
      root.appendChild(host);
      propertyViewer = createPropertyViewer(host, { sections }, {
        chrome: false, dense: true, showSelectionLabel: false, labelWidth: "minmax(120px, 35%)",
      });
    }
  }

  function validate() {
    return {
      status: !missingRequired,
      errors: missingRequired ? [{ field_key: "_instance", error: "Missing required data/options" }] : [],
    };
  }

  render();

  return {
    destroy() {
      propertyViewer?.destroy();
      propertyViewer = null;
      if (container && container.nodeType === 1) {
        container.innerHTML = "";
      }
    },
    update(nextData, nextOptions = {}) {
      currentData = normalizeIncidentTypeData(nextData);
      currentOptions = normalizeIncidentOptions({ ...currentOptions, ...nextOptions });
      render();
    },
    getData() {
      return cloneData(currentData);
    },
    validate,
    isValid() {
      return validate().status;
    },
  };
}

function normalizeIncidentTypeData(data) {
  const source = data && typeof data === "object" ? data : {};
  return {
    id: source.id ?? null,
    incident_id: source.incident_id ?? null,
    incident_type_id: source.incident_type_id ?? source.id ?? null,
    incident_type_category_id: source.incident_type_category_id ?? null,
    incident_type_category_name: source.incident_type_category_name ?? source.category_name ?? "",
    name: source.name ?? "",
    fields: safeArray(source.fields),
    detail_entries: safeArray(source.detail_entries).map((item) => ({ ...item })),
    resources: safeArray(source.resources).map((item) => ({ ...item })),
    resources_needed: safeArray(source.resources_needed).map((item) => ({ ...item })),
  };
}

function cloneData(value) {
  try {
    return structuredClone(value);
  } catch (_) {
    return JSON.parse(JSON.stringify(value));
  }
}

function getFieldKey(field) {
  return String(field?.field_key ?? field?.key ?? "");
}

function getFieldLabel(field, fallback = "Field") {
  return String(field?.field_label ?? field?.label ?? fallback);
}

function getFieldType(field) {
  return String(field?.input_type ?? field?.type ?? "text").toLowerCase();
}

function isEmptyGroupItem(item, childFields) {
  if (!item || typeof item !== "object") {
    return true;
  }
  return childFields.every((child) => !String(item[getFieldKey(child)] ?? "").trim());
}
