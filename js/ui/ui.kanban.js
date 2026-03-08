import { createElement, clearNode } from "./ui.dom.js";
import { createEventBag } from "./ui.events.js";

const DEFAULT_OPTIONS = {
  className: "",
  laneTitleKey: "title",
  laneIdKey: "id",
  cardIdKey: "id",
  cardTitleKey: "title",
  cardMetaKey: "meta",
  draggable: true,
  keyboardMoves: true,
  wipLimits: null, // { [laneId]: number }
  validateMove: null, // ({ card, fromLaneId, toLaneId, fromIndex, toIndex, lanes }) => boolean | { ok, reason }
  onCardMove: null,
  onMoveRejected: null,
  onCardClick: null,
};

export function createKanban(container, lanes = [], options = {}) {
  const events = createEventBag();
  let currentOptions = normalizeOptions(options);
  let currentLanes = normalizeLanes(lanes, currentOptions);
  let dragCardId = null;
  let dragFromLaneId = null;
  let dragFromIndex = -1;
  let pendingFocusCardId = null;

  function render() {
    if (!container || container.nodeType !== 1) {
      return;
    }
    events.clear();
    clearNode(container);

    const root = createElement("section", {
      className: `ui-kanban ${currentOptions.className || ""}`.trim(),
    });
    currentLanes.forEach((lane) => {
      root.appendChild(renderLane(lane));
    });
    container.appendChild(root);
    if (pendingFocusCardId) {
      const focusNode = container.querySelector(`.ui-kanban-card[data-card-id="${cssEscape(pendingFocusCardId)}"]`);
      focusNode?.focus?.({ preventScroll: true });
      pendingFocusCardId = null;
    }
  }

  function renderLane(lane) {
    const laneNode = createElement("section", {
      className: "ui-kanban-lane",
      attrs: { "data-lane-id": lane.id },
    });
    const header = createElement("header", { className: "ui-kanban-lane-header" });
    header.appendChild(createElement("h4", { className: "ui-title", text: lane.title }));
    header.appendChild(createElement("span", { className: "ui-kanban-count", text: String(lane.cards.length) }));
    laneNode.appendChild(header);

    const cards = createElement("div", { className: "ui-kanban-cards" });
    events.on(cards, "dragover", (event) => {
      if (!currentOptions.draggable || !dragCardId) {
        return;
      }
      event.preventDefault();
      cards.classList.add("is-drop-target");
    });
    events.on(cards, "dragleave", () => cards.classList.remove("is-drop-target"));
    events.on(cards, "drop", (event) => {
      event.preventDefault();
      cards.classList.remove("is-drop-target");
      if (!dragCardId || !dragFromLaneId) {
        return;
      }
      moveCard(dragCardId, dragFromLaneId, lane.id, lane.cards.length);
      dragCardId = null;
      dragFromLaneId = null;
      dragFromIndex = -1;
    });

    if (!lane.cards.length) {
      cards.appendChild(createElement("p", { className: "ui-kanban-empty", text: "No cards." }));
    } else {
      lane.cards.forEach((card) => {
        const cardIndex = lane.cards.findIndex((entry) => entry.id === card.id);
        cards.appendChild(renderCard(card, lane.id, cardIndex));
      });
    }
    laneNode.appendChild(cards);
    return laneNode;
  }

  function renderCard(card, laneId, cardIndex) {
    const node = createElement("article", {
      className: "ui-kanban-card",
      attrs: {
        "data-card-id": card.id,
        draggable: currentOptions.draggable ? "true" : null,
        tabindex: currentOptions.keyboardMoves ? "0" : null,
      },
    });
    node.appendChild(createElement("h5", { className: "ui-kanban-card-title", text: card.title }));
    if (card.meta) {
      node.appendChild(createElement("p", { className: "ui-kanban-card-meta", text: card.meta }));
    }

    events.on(node, "click", () => {
      currentOptions.onCardClick?.(card, laneId);
    });
    if (currentOptions.draggable) {
      events.on(node, "dragstart", (event) => {
        dragCardId = card.id;
        dragFromLaneId = laneId;
        dragFromIndex = cardIndex;
        node.classList.add("is-dragging");
        event.dataTransfer?.setData("text/plain", card.id);
        event.dataTransfer?.setData("application/x-kanban-lane", laneId);
      });
      events.on(node, "dragover", (event) => {
        if (!dragCardId) {
          return;
        }
        event.preventDefault();
      });
      events.on(node, "drop", (event) => {
        event.preventDefault();
        if (!dragCardId || !dragFromLaneId) {
          return;
        }
        const rect = node.getBoundingClientRect();
        const insertAfter = event.clientY > (rect.top + (rect.height / 2));
        const targetIndex = cardIndex + (insertAfter ? 1 : 0);
        moveCard(dragCardId, dragFromLaneId, laneId, targetIndex);
        dragCardId = null;
        dragFromLaneId = null;
        dragFromIndex = -1;
      });
      events.on(node, "dragend", () => {
        node.classList.remove("is-dragging");
        dragCardId = null;
        dragFromLaneId = null;
        dragFromIndex = -1;
      });
    }

    if (currentOptions.keyboardMoves) {
      events.on(node, "keydown", (event) => {
        if (event.defaultPrevented || !currentOptions.draggable) {
          return;
        }
        let handled = false;
        if (event.key === "ArrowUp") {
          handled = moveCard(card.id, laneId, laneId, cardIndex - 1);
        } else if (event.key === "ArrowDown") {
          handled = moveCard(card.id, laneId, laneId, cardIndex + 1);
        } else if (event.key === "ArrowLeft") {
          const laneIndex = currentLanes.findIndex((lane) => lane.id === laneId);
          if (laneIndex > 0) {
            const toLaneId = currentLanes[laneIndex - 1].id;
            handled = moveCard(card.id, laneId, toLaneId);
          }
        } else if (event.key === "ArrowRight") {
          const laneIndex = currentLanes.findIndex((lane) => lane.id === laneId);
          if (laneIndex >= 0 && laneIndex < currentLanes.length - 1) {
            const toLaneId = currentLanes[laneIndex + 1].id;
            handled = moveCard(card.id, laneId, toLaneId);
          }
        }
        if (handled) {
          event.preventDefault();
          pendingFocusCardId = card.id;
        }
      });
    }
    return node;
  }

  function moveCard(cardId, fromLaneId, toLaneId, toIndex = null) {
    if (!cardId || !fromLaneId || !toLaneId) {
      return false;
    }

    const fromLane = currentLanes.find((lane) => lane.id === fromLaneId);
    const toLane = currentLanes.find((lane) => lane.id === toLaneId);
    if (!fromLane || !toLane) {
      return false;
    }
    const fromIndex = fromLane.cards.findIndex((card) => card.id === cardId);
    if (fromIndex < 0) {
      return false;
    }

    const fallbackToIndex = toLane.cards.length;
    const requestedToIndex = Number.isFinite(Number(toIndex)) ? Number(toIndex) : fallbackToIndex;
    let nextToIndex = clampIndex(Math.round(requestedToIndex), 0, toLane.cards.length);
    if (fromLaneId === toLaneId && fromIndex < nextToIndex) {
      nextToIndex -= 1;
    }
    if (fromLaneId === toLaneId && fromIndex === nextToIndex) {
      return false;
    }

    const card = fromLane.cards[fromIndex];
    const validation = canMoveCard({
      card,
      fromLaneId,
      toLaneId,
      fromIndex,
      toIndex: nextToIndex,
    });
    if (!validation.ok) {
      currentOptions.onMoveRejected?.({
        reason: validation.reason || "Move rejected.",
        card,
        fromLaneId,
        toLaneId,
        fromIndex,
        toIndex: nextToIndex,
      });
      return false;
    }

    const [movedCard] = fromLane.cards.splice(fromIndex, 1);
    const insertionIndex = clampIndex(nextToIndex, 0, toLane.cards.length);
    toLane.cards.splice(insertionIndex, 0, movedCard);
    currentOptions.onCardMove?.({
      card: movedCard,
      fromLaneId,
      toLaneId,
      fromIndex,
      toIndex: insertionIndex,
      lanes: currentLanes.map(cloneLane),
    });
    render();
    return true;
  }

  function canMoveCard(payload) {
    const projected = currentLanes.map(cloneLane);
    const source = projected.find((lane) => lane.id === payload.fromLaneId);
    const target = projected.find((lane) => lane.id === payload.toLaneId);
    if (!source || !target) {
      return { ok: false, reason: "Invalid lane." };
    }
    const sourceIndex = source.cards.findIndex((card) => card.id === payload.card.id);
    if (sourceIndex < 0) {
      return { ok: false, reason: "Card not found." };
    }
    const [card] = source.cards.splice(sourceIndex, 1);
    const insertIndex = clampIndex(payload.toIndex, 0, target.cards.length);
    target.cards.splice(insertIndex, 0, card);

    const wipLimit = resolveWipLimit(payload.toLaneId, currentOptions.wipLimits);
    if (Number.isFinite(wipLimit) && target.cards.length > wipLimit) {
      return { ok: false, reason: `Lane limit reached (${wipLimit}).` };
    }

    if (typeof currentOptions.validateMove === "function") {
      const result = currentOptions.validateMove({
        ...payload,
        lanes: projected,
      });
      if (result === false) {
        return { ok: false, reason: "Move blocked by validation." };
      }
      if (result && typeof result === "object" && result.ok === false) {
        return { ok: false, reason: String(result.reason || "Move blocked by validation.") };
      }
    }

    return { ok: true };
  }

  function update(nextLanes = currentLanes, nextOptions = {}) {
    currentOptions = normalizeOptions({ ...currentOptions, ...(nextOptions || {}) });
    currentLanes = normalizeLanes(nextLanes, currentOptions);
    render();
  }

  function destroy() {
    events.clear();
    clearNode(container);
  }

  function getState() {
    return {
      lanes: currentLanes.map(cloneLane),
      options: { ...currentOptions },
    };
  }

  render();

  return {
    update,
    moveCard,
    getState,
    destroy,
  };
}

function normalizeOptions(options) {
  return { ...DEFAULT_OPTIONS, ...(options || {}) };
}

function normalizeLanes(lanes, options) {
  if (!Array.isArray(lanes)) {
    return [];
  }
  return lanes
    .map((lane, index) => {
      if (!lane || typeof lane !== "object") {
        return null;
      }
      const id = String(lane[options.laneIdKey] ?? `lane-${index}`);
      const title = String(lane[options.laneTitleKey] ?? id);
      const cards = Array.isArray(lane.cards)
        ? lane.cards
          .map((card, cardIndex) => normalizeCard(card, `${id}-card-${cardIndex}`, options))
          .filter(Boolean)
        : [];
      return { id, title, cards };
    })
    .filter(Boolean);
}

function normalizeCard(card, fallbackId, options) {
  if (!card || typeof card !== "object") {
    return null;
  }
  return {
    id: String(card[options.cardIdKey] ?? fallbackId),
    title: String(card[options.cardTitleKey] ?? card.id ?? fallbackId),
    meta: card[options.cardMetaKey] == null ? "" : String(card[options.cardMetaKey]),
    raw: card,
  };
}

function cloneLane(lane) {
  return {
    id: lane.id,
    title: lane.title,
    cards: lane.cards.map((card) => ({
      id: card.id,
      title: card.title,
      meta: card.meta,
      raw: card.raw,
    })),
  };
}

function resolveWipLimit(laneId, wipLimits) {
  if (!wipLimits || typeof wipLimits !== "object") {
    return NaN;
  }
  const value = Number(wipLimits[laneId]);
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : NaN;
}

function clampIndex(value, min, max) {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
}

function cssEscape(value) {
  if (typeof CSS !== "undefined" && CSS && typeof CSS.escape === "function") {
    return CSS.escape(String(value));
  }
  return String(value).replace(/["\\]/g, "\\$&");
}
