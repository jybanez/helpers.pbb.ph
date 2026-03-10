import { createElement, clearNode } from "./ui.dom.js";
import { createEventBag } from "./ui.events.js";

const DEFAULT_OPTIONS = {
  className: "",
  columns: [],
  rows: [],
  rowKey: "id",
  indent: 18,
  defaultExpanded: false,
  expandedRowIds: [],
  selectable: "none", // none | single | multi
  selectedRowIds: [],
  wrapCellContent: false,
  enableColumnResize: false,
  minColumnWidth: 72,
  columnWidths: {},
  emptyText: "No data available.",
  ariaLabel: "Tree grid",
  getRowId: null,
  getChildren: null,
  onToggle: null,
  onRowClick: null,
  onSelectionChange: null,
};

export function createTreeGrid(container, options = {}) {
  const events = createEventBag();
  const rowEvents = createEventBag();
  let currentOptions = normalizeOptions(options);
  let currentRows = normalizeRows(currentOptions.rows);
  let root = null;
  let tableWrap = null;
  let table = null;
  let tbody = null;
  let focusedRowId = null;
  let resizeCleanup = null;
  let isResizing = false;
  let tableColMap = new Map();
  let visibleRows = [];
  let expandedRowIds = initializeExpandedState();
  let selectedRowIds = new Set((currentOptions.selectedRowIds || []).map(String));
  let columnWidths = normalizeColumnWidths(currentOptions.columnWidths);

  function getRowId(row) {
    if (typeof currentOptions.getRowId === "function") {
      return String(currentOptions.getRowId(row));
    }
    return String(row?.[currentOptions.rowKey] ?? "");
  }

  function getChildren(row) {
    if (typeof currentOptions.getChildren === "function") {
      const value = currentOptions.getChildren(row);
      return Array.isArray(value) ? value : [];
    }
    return Array.isArray(row?.children) ? row.children : [];
  }

  function hasChildrenRow(row) {
    return getChildren(row).length > 0;
  }

  function walkTree(rows, visitor, depth = 0, parentId = null) {
    rows.forEach((row) => {
      visitor(row, depth, parentId);
      const id = getRowId(row);
      const children = getChildren(row);
      if (children.length) {
        walkTree(children, visitor, depth + 1, id);
      }
    });
  }

  function flattenRows(rows, expandedIds, depth = 0, parentId = null, acc = []) {
    rows.forEach((row) => {
      const id = getRowId(row);
      const children = getChildren(row);
      const hasKids = children.length > 0;
      const expanded = hasKids && expandedIds.has(id);
      acc.push({
        id,
        row,
        depth,
        parentId,
        hasChildren: hasKids,
        expanded,
        isLeaf: !hasKids,
      });
      if (hasKids && expanded) {
        flattenRows(children, expandedIds, depth + 1, id, acc);
      }
    });
    return acc;
  }

  function findRowEntryLocal(rows, rowId, depth = 0, parentId = null) {
    for (const row of rows) {
      const id = getRowId(row);
      if (id === rowId) {
        return { row, depth, parentId };
      }
      const children = getChildren(row);
      if (children.length) {
        const found = findRowEntryLocal(children, rowId, depth + 1, id);
        if (found) {
          return found;
        }
      }
    }
    return null;
  }

  function initializeExpandedState() {
    const explicit = new Set((currentOptions.expandedRowIds || []).map(String));
    if (explicit.size) {
      return explicit;
    }
    if (!currentOptions.defaultExpanded) {
      return new Set();
    }
    const ids = [];
    walkTree(currentRows, (row) => {
      if (hasChildrenRow(row)) {
        ids.push(getRowId(row));
      }
    });
    return new Set(ids);
  }

  function render() {
    if (!container || container.nodeType !== 1) {
      return;
    }
    rowEvents.clear();
    events.clear();
    clearNode(container);

    root = createElement("section", {
      className: `ui-tree-grid ${currentOptions.className || ""}`.trim(),
      attrs: {
        role: "treegrid",
        "aria-label": currentOptions.ariaLabel,
      },
    });

    tableWrap = createElement("div", { className: "ui-tree-grid-table-wrap" });
    table = createElement("table", { className: "ui-tree-grid-table" });
    const colgroup = createElement("colgroup");
    const thead = createElement("thead");
    const headRow = createElement("tr");
    tableColMap = new Map();

    currentOptions.columns.forEach((column) => {
      const key = String(column.key || "");
      const widthValue = resolveColumnWidth(column, columnWidths);
      const col = createElement("col");
      if (widthValue) {
        col.style.width = widthValue;
      }
      tableColMap.set(key, col);
      colgroup.appendChild(col);

      const th = createElement("th", {
        className: "ui-tree-grid-col",
        text: String(column.label || key),
        attrs: { scope: "col" },
      });
      if (widthValue) {
        th.style.width = widthValue;
      }
      if (currentOptions.enableColumnResize && column.resizable !== false) {
        const handle = createElement("span", {
          className: "ui-tree-grid-resize-handle",
          attrs: { role: "separator", "aria-orientation": "vertical" },
        });
        th.appendChild(handle);
        events.on(handle, "mousedown", (event) => {
          event.preventDefault();
          event.stopPropagation();
          beginResize(event, column, col, th);
        });
        events.on(handle, "click", (event) => {
          event.preventDefault();
          event.stopPropagation();
        });
      }
      headRow.appendChild(th);
    });

    thead.appendChild(headRow);
    table.append(colgroup, thead);
    tbody = createElement("tbody");
    table.appendChild(tbody);
    tableWrap.appendChild(table);
    root.appendChild(tableWrap);
    container.appendChild(root);
    syncTableWidth();
    renderRows();
  }

  function renderRows() {
    if (!tbody) {
      return;
    }
    rowEvents.clear();
    clearNode(tbody);
    visibleRows = flattenRows(currentRows, expandedRowIds);

    if (!visibleRows.length) {
      const tr = createElement("tr", { className: "ui-tree-grid-state-row" });
      const td = createElement("td", {
        className: "ui-tree-grid-state-cell",
        text: currentOptions.emptyText,
        attrs: { colspan: String(Math.max(1, currentOptions.columns.length)) },
      });
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }

    if (!focusedRowId || !visibleRows.some((entry) => entry.id === focusedRowId)) {
      focusedRowId = visibleRows[0]?.id ?? null;
    }

    visibleRows.forEach((entry, index) => {
      const tr = createElement("tr", {
        className: [
          "ui-tree-grid-row",
          entry.depth > 0 ? "is-child-row" : "is-root-row",
          selectedRowIds.has(entry.id) ? "is-selected" : "",
        ].filter(Boolean).join(" "),
        attrs: {
          role: "row",
          tabindex: focusedRowId === entry.id ? "0" : "-1",
          "aria-level": String(entry.depth + 1),
          "aria-expanded": entry.hasChildren ? String(entry.expanded) : null,
        },
        dataset: {
          rowId: entry.id,
          depth: String(entry.depth),
        },
      });

      rowEvents.on(tr, "click", (event) => {
        setFocusedRow(entry.id);
        handleRowActivation(entry, event);
      });
      rowEvents.on(tr, "keydown", (event) => {
        handleRowKeydown(entry, index, event);
      });
      rowEvents.on(tr, "focus", () => {
        focusedRowId = entry.id;
        syncRowFocus();
      });

      currentOptions.columns.forEach((column) => {
        const key = String(column.key || "");
        const td = createElement("td", {
          className: buildCellClassName(column, entry),
          attrs: { role: "gridcell" },
        });
        if (column.align) {
          td.dataset.align = String(column.align);
        }
        if (isTreeColumn(column)) {
          td.appendChild(renderTreeCell(column, entry));
        } else {
          td.appendChild(renderStandardCell(column, entry));
        }
        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    });
  }

  function renderTreeCell(column, entry) {
    const wrap = createElement("div", {
      className: "ui-tree-grid-tree-cell",
      attrs: {
        style: `--ui-tree-grid-depth:${entry.depth};--ui-tree-grid-indent:${Math.max(8, Number(currentOptions.indent) || 18)}px;`,
      },
    });
    const spacer = createElement("span", { className: "ui-tree-grid-tree-spacer", attrs: { "aria-hidden": "true" } });
    wrap.appendChild(spacer);

    if (entry.hasChildren) {
      const toggle = createElement("button", {
        className: `ui-tree-grid-toggle${entry.expanded ? " is-expanded" : ""}`,
        attrs: {
          type: "button",
          "aria-label": entry.expanded ? "Collapse row" : "Expand row",
          title: entry.expanded ? "Collapse" : "Expand",
        },
        html: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>',
      });
      rowEvents.on(toggle, "click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleRow(entry.id);
      });
      wrap.appendChild(toggle);
    } else {
      wrap.appendChild(createElement("span", { className: "ui-tree-grid-toggle-placeholder", attrs: { "aria-hidden": "true" } }));
    }

    if (typeof column.icon === "function") {
      const iconValue = column.icon(entry.row, entry);
      if (iconValue) {
        const icon = createElement("span", { className: "ui-tree-grid-tree-icon", attrs: { "aria-hidden": "true" } });
        if (iconValue instanceof HTMLElement) {
          icon.appendChild(iconValue.cloneNode(true));
        } else {
          icon.innerHTML = String(iconValue);
        }
        wrap.appendChild(icon);
      }
    }

    wrap.appendChild(createElement("span", {
      className: "ui-tree-grid-tree-label",
      text: resolveColumnValue(column, entry),
    }));

    return wrap;
  }

  function renderStandardCell(column, entry) {
    const content = typeof column.render === "function"
      ? column.render(entry.row?.[column.key], entry.row, entry)
      : resolveColumnValue(column, entry);
    if (content instanceof HTMLElement) {
      return content;
    }
    return createElement("span", {
      className: "ui-tree-grid-cell-text",
      text: content == null ? "" : String(content),
    });
  }

  function handleRowActivation(entry, event) {
    if (isSelectable()) {
      toggleSelection(entry.id);
    }
    if (typeof currentOptions.onRowClick === "function") {
      currentOptions.onRowClick({
        row: entry.row,
        rowId: entry.id,
        depth: entry.depth,
        entry,
        event,
      });
    }
    renderRows();
  }

  function handleRowKeydown(entry, index, event) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusRowAt(index + 1);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      focusRowAt(index - 1);
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      focusRowAt(0);
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      focusRowAt(visibleRows.length - 1);
      return;
    }
    if (event.key === "ArrowRight" && entry.hasChildren && !entry.expanded) {
      event.preventDefault();
      setExpanded(entry.id, true);
      return;
    }
    if (event.key === "ArrowLeft" && entry.hasChildren && entry.expanded) {
      event.preventDefault();
      setExpanded(entry.id, false);
      return;
    }
    if ((event.key === "Enter" || event.key === " ") && entry.hasChildren) {
      event.preventDefault();
      toggleRow(entry.id);
      return;
    }
  }

  function focusRowAt(index) {
    const safeIndex = Math.max(0, Math.min(visibleRows.length - 1, index));
    const next = visibleRows[safeIndex];
    if (!next) {
      return;
    }
    setFocusedRow(next.id);
    const rowEl = tbody?.querySelector?.(`[data-row-id="${escapeSelector(next.id)}"]`);
    rowEl?.focus();
  }

  function setFocusedRow(rowId) {
    focusedRowId = String(rowId || "");
    syncRowFocus();
  }

  function syncRowFocus() {
    if (!tbody) {
      return;
    }
    tbody.querySelectorAll("[data-row-id]").forEach((row) => {
      row.setAttribute("tabindex", row.getAttribute("data-row-id") === focusedRowId ? "0" : "-1");
    });
  }

  function toggleSelection(rowId) {
    if (!isSelectable()) {
      return;
    }
    const key = String(rowId);
    if (currentOptions.selectable === "single") {
      selectedRowIds = new Set([key]);
    } else if (selectedRowIds.has(key)) {
      selectedRowIds.delete(key);
    } else {
      selectedRowIds.add(key);
    }
    if (typeof currentOptions.onSelectionChange === "function") {
      currentOptions.onSelectionChange({
        selectedRowIds: Array.from(selectedRowIds),
        selectedRows: visibleRows.filter((entry) => selectedRowIds.has(entry.id)).map((entry) => entry.row),
      });
    }
  }

  function isSelectable() {
    return currentOptions.selectable === "single" || currentOptions.selectable === "multi";
  }

  function setExpanded(rowId, expanded, emit = true) {
    const key = String(rowId || "");
    const entry = findRowEntryLocal(currentRows, key);
    if (!entry || !hasChildrenRow(entry.row)) {
      return false;
    }
    if (expanded) {
      expandedRowIds.add(key);
    } else {
      expandedRowIds.delete(key);
    }
    renderRows();
    if (emit && typeof currentOptions.onToggle === "function") {
      currentOptions.onToggle({
        row: entry.row,
        rowId: key,
        expanded: Boolean(expanded),
        depth: entry.depth,
      });
    }
    return true;
  }

  function toggleRow(rowId) {
    const key = String(rowId || "");
    const next = !expandedRowIds.has(key);
    return setExpanded(key, next, true);
  }

  function expandAll() {
    walkTree(currentRows, (row) => {
      if (hasChildrenRow(row)) {
        expandedRowIds.add(getRowId(row));
      }
    });
    renderRows();
  }

  function collapseAll() {
    expandedRowIds.clear();
    renderRows();
  }

  function beginResize(mouseDownEvent, column, colEl, headerCell) {
    const columnKey = String(column.key || "");
    const startX = Number(mouseDownEvent.clientX) || 0;
    const rect = headerCell.getBoundingClientRect();
    const initialWidth = Math.max(20, Math.round(rect.width || parseInt(colEl.style.width, 10) || 120));
    const minWidth = Math.max(32, Number(currentOptions.minColumnWidth) || 72);
    isResizing = true;
    root?.classList.add("is-resizing-cols");

    const onMouseMove = (moveEvent) => {
      const delta = (Number(moveEvent.clientX) || 0) - startX;
      const next = Math.max(minWidth, initialWidth + delta);
      const widthText = `${Math.round(next)}px`;
      colEl.style.width = widthText;
      headerCell.style.width = widthText;
      columnWidths[columnKey] = Math.round(next);
      syncTableWidth();
    };

    const onMouseUp = () => {
      cleanup();
    };

    const cleanup = () => {
      document.removeEventListener("mousemove", onMouseMove, true);
      document.removeEventListener("mouseup", onMouseUp, true);
      isResizing = false;
      root?.classList.remove("is-resizing-cols");
      resizeCleanup = null;
    };

    resizeCleanup = cleanup;
    document.addEventListener("mousemove", onMouseMove, true);
    document.addEventListener("mouseup", onMouseUp, true);
  }

  function syncTableWidth() {
    if (!table || !tableColMap.size) {
      return;
    }
    let explicitTotal = 0;
    tableColMap.forEach((colEl) => {
      const width = parseInt(colEl.style.width, 10);
      if (Number.isFinite(width) && width > 0) {
        explicitTotal += width;
      }
    });
    if (explicitTotal > 0) {
      table.style.width = `${explicitTotal}px`;
      table.style.minWidth = `${explicitTotal}px`;
      return;
    }
    table.style.width = "";
    table.style.minWidth = "";
  }

  function getData() {
    return currentRows;
  }

  function getVisibleRows() {
    return visibleRows.map((entry) => ({ ...entry }));
  }

  function getExpandedRowIds() {
    return Array.from(expandedRowIds);
  }

  function setRows(nextRows = []) {
    currentRows = normalizeRows(nextRows);
    renderRows();
  }

  function update(nextOptions = {}) {
    currentOptions = normalizeOptions({ ...currentOptions, ...(nextOptions || {}) });
    if (nextOptions.rows) {
      currentRows = normalizeRows(nextOptions.rows);
    }
    if (nextOptions.columnWidths) {
      columnWidths = normalizeColumnWidths({
        ...columnWidths,
        ...(nextOptions.columnWidths || {}),
      });
    }
    if (nextOptions.expandedRowIds) {
      expandedRowIds = new Set((nextOptions.expandedRowIds || []).map(String));
    }
    if (nextOptions.selectedRowIds) {
      selectedRowIds = new Set((nextOptions.selectedRowIds || []).map(String));
    }
    render();
  }

  function destroy() {
    if (resizeCleanup) {
      resizeCleanup();
    }
    rowEvents.clear();
    events.clear();
    clearNode(container);
    root = null;
    tableWrap = null;
    table = null;
    tbody = null;
  }

  const api = {
    getData,
    getVisibleRows,
    getExpandedRowIds,
    setExpanded,
    toggleRow,
    expandAll,
    collapseAll,
    setRows,
    update,
    destroy,
    getState() {
      return {
        rows: currentRows,
        visibleRows: getVisibleRows(),
        expandedRowIds: getExpandedRowIds(),
        selectedRowIds: Array.from(selectedRowIds),
        options: { ...currentOptions },
      };
    },
  };

  render();
  return api;
}

function normalizeRows(rows) {
  return Array.isArray(rows) ? rows : [];
}

function normalizeOptions(options) {
  const next = {
    ...DEFAULT_OPTIONS,
    ...(options || {}),
  };
  next.columns = Array.isArray(next.columns) ? next.columns : [];
  next.rows = Array.isArray(next.rows) ? next.rows : [];
  next.expandedRowIds = Array.isArray(next.expandedRowIds) ? next.expandedRowIds : [];
  next.selectedRowIds = Array.isArray(next.selectedRowIds) ? next.selectedRowIds : [];
  next.columnWidths = normalizeColumnWidths(next.columnWidths);
  const treeColumns = next.columns.filter((column) => Boolean(column?.tree));
  if (treeColumns.length > 1) {
    console.error("createTreeGrid: only one column may declare tree: true. Using the first declared tree column.");
  }
  if (!treeColumns.length && next.columns.length) {
    next.columns = next.columns.map((column, index) => index === 0 ? { ...column, tree: true } : column);
  }
  return next;
}

function normalizeColumnWidths(widths) {
  return widths && typeof widths === "object" ? { ...widths } : {};
}

function resolveColumnWidth(column, widths) {
  const key = String(column?.key || "");
  if (key && Number.isFinite(Number(widths?.[key])) && Number(widths[key]) > 0) {
    return `${Math.round(Number(widths[key]))}px`;
  }
  if (column?.width == null) {
    return "";
  }
  const widthValue = String(column.width).trim();
  return widthValue || "";
}

function resolveColumnValue(column, entry) {
  if (typeof column?.label === "function" && column.tree) {
    return column.label(entry.row, entry);
  }
  const value = entry.row?.[column.key];
  return value == null ? "" : value;
}

function buildCellClassName(column, entry) {
  const wrap = typeof column?.wrap === "boolean" ? column.wrap : false;
  return [
    "ui-tree-grid-cell",
    wrap ? "is-wrap" : "is-nowrap",
    isTreeColumn(column) ? "is-tree-cell" : "",
    entry.depth > 0 ? "is-depth-child" : "",
    column?.className || "",
  ].filter(Boolean).join(" ");
}

function isTreeColumn(column) {
  return Boolean(column?.tree);
}

function escapeSelector(value) {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(String(value));
  }
  return String(value).replace(/"/g, '\\"');
}
