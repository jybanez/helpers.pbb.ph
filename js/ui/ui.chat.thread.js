import { createElement, clearNode } from "./ui.dom.js";
import { createMediaStrip } from "./ui.media.strip.js";
import { createMenu } from "./ui.menu.js";

const DOWNLOAD_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 4h2v9.17l2.59-2.58L17 12l-5 5-5-5 1.41-1.41L11 13.17V4zm-5 14h12v2H6v-2z"></path></svg>';
const MESSAGE_MENU_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="6.5" cy="12" r="1.5"></circle><circle cx="12" cy="12" r="1.5"></circle><circle cx="17.5" cy="12" r="1.5"></circle></svg>';

const DEFAULT_OPTIONS = {
  className: "",
  emptyTitle: "No messages yet",
  emptyText: "Start the conversation from the composer below.",
  showSenderNames: true,
  showTimestamps: true,
  showStates: true,
  groupAdjacentMessages: true,
  alignOutgoingRight: true,
  showMessageMenuTrigger: true,
  maxMediaThumbsPerMessage: 4,
  mediaStripOptions: {},
  getMessageMenuItems: null,
  messageMenuOptions: {},
  onAttachmentOpen: null,
  onAttachmentDownload: null,
  onMessageAction: null,
  onMessageMenuSelect: null,
};

export function createChatThread(container, data = {}, options = {}) {
  let currentMessages = normalizeMessages(data?.messages || []);
  let currentOptions = { ...DEFAULT_OPTIONS, ...(options || {}) };
  let mediaStripApis = [];
  let messageMenuApis = [];

  function render() {
    if (!container || container.nodeType !== 1) {
      return;
    }

    clearNode(container);
    destroyMediaStrips(mediaStripApis);
    destroyMessageMenus(messageMenuApis);

    const root = createElement("div", {
      className: `ui-chat-thread ${currentOptions.className || ""}`.trim(),
    });

    if (!currentMessages.length) {
      root.appendChild(createEmptyState());
      container.appendChild(root);
      return;
    }

    currentMessages.forEach((message, index) => {
      root.appendChild(createMessageNode(message, index));
    });

    container.appendChild(root);
  }

  function createEmptyState() {
    const empty = createElement("div", { className: "ui-chat-thread-empty" });
    empty.appendChild(createElement("div", {
      className: "ui-chat-thread-empty-title",
      text: currentOptions.emptyTitle,
    }));
    empty.appendChild(createElement("div", {
      className: "ui-chat-thread-empty-text",
      text: currentOptions.emptyText,
    }));
    return empty;
  }

  function createMessageNode(message, index) {
    const previous = currentMessages[index - 1] || null;
    const grouped = Boolean(currentOptions.groupAdjacentMessages && isGroupedWithPrevious(previous, message));
    const direction = normalizeDirection(message.direction);
    const row = createElement("article", {
      className: [
        "ui-chat-message",
        `is-${direction}`,
        grouped ? "is-grouped" : "",
        message?.meta?.emphasized ? "is-emphasized" : "",
        message?.meta?.muted ? "is-muted" : "",
      ].filter(Boolean).join(" "),
      attrs: {
        "data-message-id": String(message.id || ""),
        "data-direction": direction,
      },
    });

    if (direction === "system") {
      row.appendChild(createElement("div", {
        className: "ui-chat-message-system",
        text: String(message.text || ""),
      }));
      return row;
    }

    const bubble = createElement("div", { className: "ui-chat-message-bubble" });
    const menuItems = getMessageMenuItemsFromOptions(message, currentMessages, currentOptions);
    if (menuItems.length) {
      bubble.appendChild(createMessageMenuTrigger(message, menuItems));
    }
    if (currentOptions.showSenderNames && shouldShowSenderName(message, grouped)) {
      bubble.appendChild(createElement("div", {
        className: "ui-chat-message-sender",
        text: String(message.senderName || ""),
      }));
      if (message.senderSubtitle) {
        bubble.appendChild(createElement("div", {
          className: "ui-chat-message-sender-subtitle",
          text: String(message.senderSubtitle),
        }));
      }
    }

    if (message.text) {
      bubble.appendChild(createElement("div", {
        className: "ui-chat-message-text",
        text: String(message.text),
      }));
    }

    const attachments = Array.isArray(message.attachments) ? message.attachments : [];
    if (attachments.length) {
      bubble.appendChild(createAttachmentsNode(message, attachments));
    }

    const meta = createMessageMeta(message, direction, grouped);
    if (meta) {
      bubble.appendChild(meta);
    }

    row.appendChild(bubble);
    return row;
  }

  function createMessageMenuTrigger(message, menuItems) {
    const trigger = createElement("button", {
      className: "ui-chat-message-menu-trigger",
      html: MESSAGE_MENU_ICON,
      attrs: {
        type: "button",
        title: "Message actions",
        "aria-label": `Message actions for ${String(message.senderName || "message")}`,
      },
    });
    const menuApi = createMenu(trigger, menuItems, {
      placement: "bottom-end",
      align: "right",
      ...((currentOptions.messageMenuOptions && typeof currentOptions.messageMenuOptions === "object")
        ? currentOptions.messageMenuOptions
        : {}),
      onSelect(item, meta) {
        currentOptions.onMessageMenuSelect?.(message, item, meta);
        currentOptions.messageMenuOptions?.onSelect?.(item, meta);
      },
    });
    messageMenuApis.push(menuApi);
    return trigger;
  }

  function createAttachmentsNode(message, attachments) {
    const wrap = createElement("div", { className: "ui-chat-message-attachments" });
    const mediaItems = attachments
      .filter((item) => item.kind === "image" || item.kind === "video")
      .slice(0, currentOptions.maxMediaThumbsPerMessage);
    const fileItems = attachments.filter((item) => item.kind !== "image" && item.kind !== "video");

    if (mediaItems.length) {
      const mediaHost = createElement("div", { className: "ui-chat-message-media-strip" });
      wrap.appendChild(mediaHost);
      const stripApi = createMediaStrip(mediaHost, mediaItems.map((attachment) => ({
        id: attachment.id,
        type: attachment.kind === "video" ? "video" : "image",
        src: attachment.url || attachment.previewUrl || "",
        thumb: attachment.previewUrl || attachment.url || "",
        poster: attachment.posterUrl || attachment.previewUrl || attachment.url || "",
        title: attachment.name || "",
        alt: attachment.name || `${attachment.kind} attachment`,
      })), {
        layout: "wrap",
        ...((currentOptions.mediaStripOptions && typeof currentOptions.mediaStripOptions === "object")
          ? currentOptions.mediaStripOptions
          : {}),
        onOpen(item, index) {
          const attachment = mediaItems[index] || mediaItems.find((candidate) => candidate.id === item?.id) || null;
          if (attachment) {
            currentOptions.onAttachmentOpen?.(message, attachment);
          }
          currentOptions.mediaStripOptions?.onOpen?.(item, index);
        },
      });
      mediaStripApis.push(stripApi);
    }

    if (fileItems.length) {
      const list = createElement("div", { className: "ui-chat-message-files" });
      fileItems.forEach((attachment) => {
        const row = createElement("div", { className: "ui-chat-attachment-file" });
        const main = createElement("button", {
          className: "ui-chat-attachment-file-main",
          attrs: { type: "button" },
        });
        main.appendChild(createElement("span", {
          className: "ui-chat-attachment-file-name",
          text: attachment.name || "File attachment",
        }));
        if (attachment.sizeLabel) {
          main.appendChild(createElement("span", {
            className: "ui-chat-attachment-file-meta",
            text: attachment.sizeLabel,
          }));
        }
        main.addEventListener("click", () => currentOptions.onAttachmentOpen?.(message, attachment));
        row.appendChild(main);
        if (currentOptions.onAttachmentDownload) {
          const download = createElement("button", {
            className: "ui-chat-attachment-file-download",
            html: DOWNLOAD_ICON,
            attrs: { type: "button", title: "Download attachment", "aria-label": "Download attachment" },
          });
          download.addEventListener("click", () => currentOptions.onAttachmentDownload?.(message, attachment));
          row.appendChild(download);
        }
        list.appendChild(row);
      });
      wrap.appendChild(list);
    }

    return wrap;
  }

  function createMessageMeta(message, direction, grouped) {
    const meta = createElement("div", { className: "ui-chat-message-meta" });
    let hasContent = false;

    if (currentOptions.showTimestamps && message.timestamp && (!grouped || direction === "outgoing")) {
      meta.appendChild(createElement("span", {
        className: "ui-chat-message-timestamp",
        text: String(message.timestamp),
      }));
      hasContent = true;
    }

    if (direction === "outgoing" && currentOptions.showStates && message.state) {
      meta.appendChild(createElement("span", {
        className: `ui-chat-message-state is-${String(message.state).replace(/[^a-z-]/gi, "").toLowerCase()}`,
        text: formatStateLabel(message.state),
      }));
      hasContent = true;
    }

    return hasContent ? meta : null;
  }

  function update(nextData = {}, nextOptions = {}) {
    if (Object.prototype.hasOwnProperty.call(nextData || {}, "messages")) {
      currentMessages = normalizeMessages(nextData.messages || []);
    }
    currentOptions = { ...currentOptions, ...(nextOptions || {}) };
    render();
  }

  function destroy() {
    destroyMediaStrips(mediaStripApis);
    destroyMessageMenus(messageMenuApis);
    clearNode(container);
  }

  function setMessages(messages = []) {
    currentMessages = normalizeMessages(messages);
    render();
  }

  function getMessages() {
    return currentMessages.map((message) => ({
      ...message,
      attachments: Array.isArray(message.attachments) ? message.attachments.map((item) => ({ ...item })) : [],
      meta: message.meta ? { ...message.meta } : undefined,
    }));
  }

  function getState() {
    return {
      messages: getMessages(),
      options: { ...currentOptions },
    };
  }

  render();
  return { update, destroy, setMessages, getMessages, getState };
}

function destroyMediaStrips(list = []) {
  list.forEach((api) => api?.destroy?.());
  list.length = 0;
}

function destroyMessageMenus(list = []) {
  list.forEach((api) => api?.destroy?.());
  list.length = 0;
}

function normalizeMessages(messages) {
  return Array.isArray(messages) ? messages.map((message) => ({
    ...message,
    direction: normalizeDirection(message?.direction),
    attachments: Array.isArray(message?.attachments) ? message.attachments.map((item) => ({ ...item })) : [],
    meta: message?.meta ? { ...message.meta } : undefined,
  })) : [];
}

function normalizeDirection(direction) {
  const value = String(direction || "incoming").toLowerCase();
  if (value === "outgoing" || value === "system") {
    return value;
  }
  return "incoming";
}

function isGroupedWithPrevious(previous, current) {
  if (!previous || !current) {
    return false;
  }
  const prevDirection = normalizeDirection(previous.direction);
  const currentDirection = normalizeDirection(current.direction);
  if (prevDirection !== currentDirection || currentDirection === "system") {
    return false;
  }
  return String(previous.senderName || "") === String(current.senderName || "");
}

function shouldShowSenderName(message, grouped) {
  if (normalizeDirection(message.direction) === "outgoing") {
    return Boolean(message.senderName) && !grouped;
  }
  return Boolean(message.senderName) && !grouped;
}

function getMessageMenuItemsFromOptions(message, currentMessages, currentOptions) {
  if (currentOptions.showMessageMenuTrigger === false || typeof currentOptions.getMessageMenuItems !== "function") {
    return [];
  }
  const items = currentOptions.getMessageMenuItems(message, { messages: currentMessages.map((item) => ({ ...item })) });
  return Array.isArray(items) ? items : [];
}

function formatStateLabel(state) {
  const value = String(state || "").toLowerCase();
  switch (value) {
    case "sending":
      return "Sending";
    case "sent":
      return "Sent";
    case "delivered":
      return "Delivered";
    case "read":
      return "Read";
    case "failed":
      return "Failed";
    default:
      return String(state || "");
  }
}
