import { createElement, clearNode } from "./ui.dom.js";
import { createEventBag } from "./ui.events.js";

const DEFAULT_OPTIONS = {
  layout: "scroll", // scroll | wrap
  animationMs: 300,
  autoplay: true,
  muted: false,
  loop: false,
  showControls: true,
  className: "",
  baseUrl: "",
};

export function createMediaStrip(container, items = [], options = {}) {
  let currentItems = normalizeItems(items, options);
  let currentOptions = normalizeOptions(options);
  const stripEvents = createEventBag();
  const viewerEvents = createEventBag();
  let root = null;
  let activeIndex = -1;
  let viewerNodes = null;
  let closeTimer = null;
  const instanceId = `media-strip-${Math.random().toString(36).slice(2, 10)}`;

  function getThumbElementByIndex(index) {
    if (!root) {
      return null;
    }
    const children = root.children;
    if (!children || !children.length) {
      return null;
    }
    return children[index] instanceof HTMLElement ? children[index] : null;
  }

  function getThumbRectByIndex(index) {
    const thumb = getThumbElementByIndex(index);
    if (!thumb) {
      return null;
    }
    return thumb.getBoundingClientRect();
  }

  function render() {
    if (!container || container.nodeType !== 1) {
      return;
    }
    stripEvents.clear();
    clearNode(container);

    root = createElement("div", {
      className: `ui-media-strip ${currentOptions.layout === "wrap" ? "is-wrap" : "is-scroll"} ${currentOptions.className || ""}`.trim(),
      attrs: { "data-instance-id": instanceId },
    });

    currentItems.forEach((item, index) => {
      const thumb = createElement("button", {
        className: "ui-media-thumb",
        attrs: { type: "button", "aria-label": item.alt || item.title || `Media ${index + 1}` },
        dataset: { mediaId: item.id || String(index) },
      });

      if (item.type === "video" && !item.thumbUrl) {
        const videoThumb = createElement("video", {
          className: "ui-media-thumb-video",
          attrs: {
            src: item.srcUrl,
            muted: "muted",
            playsinline: "playsinline",
            preload: "metadata",
          },
        });
        thumb.appendChild(videoThumb);
      } else {
        const image = createElement("img", {
          className: "ui-media-thumb-image",
          attrs: {
            src: item.thumbUrl || item.srcUrl,
            alt: item.alt || item.title || `Media ${index + 1}`,
            loading: "lazy",
          },
        });
        thumb.appendChild(image);
      }

      if (item.type === "video") {
        const overlay = createElement("span", {
          className: "ui-media-thumb-play",
          html:
            '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6v12l10-6z"></path></svg>',
        });
        thumb.appendChild(overlay);
      }

      stripEvents.on(thumb, "click", () => openByIndex(index, thumb));
      root.appendChild(thumb);
    });

    container.appendChild(root);
  }

  function ensureViewerShell(sourceRect = null) {
    if (viewerNodes) {
      return viewerNodes;
    }
    const backdrop = createElement("div", { className: "ui-media-viewer-backdrop" });
    const panel = createElement("div", {
      className: "ui-media-viewer",
      attrs: { role: "dialog", "aria-modal": "true" },
    });
    const animationMs = getAnimationMs(currentOptions.animationMs);
    backdrop.style.setProperty("--ui-media-animation-ms", `${animationMs}ms`);
    panel.style.setProperty("--ui-media-animation-ms", `${animationMs}ms`);
    const toolbar = createElement("div", { className: "ui-media-viewer-toolbar" });
    const title = createElement("p", { className: "ui-media-viewer-title", text: "" });
    const close = createElement("button", {
      className: "ui-media-viewer-close ui-drawer-close",
      html: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.3 5.7a1 1 0 0 0-1.4 0L12 10.6 7.1 5.7a1 1 0 1 0-1.4 1.4l4.9 4.9-4.9 4.9a1 1 0 1 0 1.4 1.4l4.9-4.9 4.9 4.9a1 1 0 0 0 1.4-1.4l-4.9-4.9 4.9-4.9a1 1 0 0 0 0-1.4z"></path></svg>',
      attrs: { type: "button", "aria-label": "Close viewer" },
    });
    const content = createElement("div", { className: "ui-media-viewer-content" });
    const prev = createElement("button", {
      className: "ui-media-viewer-nav ui-media-viewer-nav-prev ui-button",
      html: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.5 4.5L8 12l7.5 7.5-1.5 1.5L5 12l9-9z"></path></svg>',
      attrs: { type: "button", "aria-label": "Previous media" },
    });
    const next = createElement("button", {
      className: "ui-media-viewer-nav ui-media-viewer-nav-next ui-button",
      html: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 19.5L16 12 8.5 4.5 10 3l9 9-9 9z"></path></svg>',
      attrs: { type: "button", "aria-label": "Next media" },
    });

    panel.style.visibility = "hidden";
    toolbar.append(title, close);
    panel.append(toolbar, content, prev, next);
    document.body.append(backdrop, panel);

    viewerNodes = { backdrop, panel, close, content, title, prev, next, mediaEl: null };

    const finalTransform = "translate(-50%, -50%) scale(1)";
    const finalOpacity = "1";
    panel.style.transform = finalTransform;
    panel.style.opacity = finalOpacity;
    const panelRect = panel.getBoundingClientRect();

    if (sourceRect) {
      panel.style.transform = getTransformFromRect(sourceRect, panelRect);
      panel.style.opacity = "0.9";
    } else {
      panel.style.transform = "translate(-50%, -48%) scale(0.985)";
      panel.style.opacity = "0";
    }
    panel.getBoundingClientRect();

    viewerEvents.on(backdrop, "click", () => closeViewer(true));
    viewerEvents.on(close, "click", () => closeViewer(true));
    viewerEvents.on(prev, "click", (event) => {
      event.preventDefault();
      if (currentItems.length > 1) {
        openByIndex((activeIndex - 1 + currentItems.length) % currentItems.length);
      }
    });
    viewerEvents.on(next, "click", (event) => {
      event.preventDefault();
      if (currentItems.length > 1) {
        openByIndex((activeIndex + 1) % currentItems.length);
      }
    });
    viewerEvents.on(document, "keydown", (event) => {
      if (!viewerNodes) {
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        closeViewer(true);
        return;
      }
      if (event.key === "ArrowLeft" && currentItems.length > 1) {
        event.preventDefault();
        openByIndex((activeIndex - 1 + currentItems.length) % currentItems.length);
        return;
      }
      if (event.key === "ArrowRight" && currentItems.length > 1) {
        event.preventDefault();
        openByIndex((activeIndex + 1) % currentItems.length);
      }
    });
    runAfterNextPaint(() => {
      if (!viewerNodes) {
        return;
      }
      backdrop.classList.add("is-open");
      panel.style.visibility = "visible";
      playOpenAnimation(panel, sourceRect, panelRect, finalTransform, finalOpacity, animationMs);
    });
    return viewerNodes;
  }

  function renderViewerItem(item, index, sourceRect = null) {
    const nodes = ensureViewerShell(sourceRect);
    const hasMultipleItems = currentItems.length > 1;

    nodes.title.textContent = item.title || `${item.type === "video" ? "Video" : "Photo"} ${index + 1}`;
    nodes.prev.hidden = !hasMultipleItems;
    nodes.next.hidden = !hasMultipleItems;
    nodes.prev.disabled = !hasMultipleItems;
    nodes.next.disabled = !hasMultipleItems;
    clearNode(nodes.content);

    if (item.type === "video") {
      const video = createElement("video", {
        className: "ui-media-viewer-video",
        attrs: {
          src: item.srcUrl,
          controls: currentOptions.showControls ? "controls" : null,
          autoplay: currentOptions.autoplay ? "autoplay" : null,
          muted: currentOptions.muted ? "muted" : null,
          loop: currentOptions.loop ? "loop" : null,
          playsinline: "playsinline",
          poster: item.posterUrl || null,
        },
      });
      nodes.content.appendChild(video);
      if (currentOptions.autoplay) {
        video.play?.().catch(() => {});
      }
      nodes.mediaEl = video;
      return;
    }

    const image = createElement("img", {
      className: "ui-media-viewer-image",
      attrs: { src: item.srcUrl, alt: item.alt || item.title || "Image" },
    });
    nodes.content.appendChild(image);
    nodes.mediaEl = image;
  }

  function closeViewer(notify = true, immediate = false) {
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }
    viewerEvents.clear();
    const nodes = viewerNodes;
    if (nodes && !immediate) {
      const targetRect = getThumbRectByIndex(activeIndex);
      nodes.backdrop.classList.add("is-closing");
      nodes.backdrop.classList.remove("is-open");
      const panelRect = nodes.panel.getBoundingClientRect();
      const animationMs = getAnimationMs(currentOptions.animationMs);
      playCloseAnimation(nodes.panel, targetRect, panelRect, animationMs);
      closeTimer = setTimeout(() => {
        if (nodes?.backdrop?.parentNode) {
          nodes.backdrop.parentNode.removeChild(nodes.backdrop);
        }
        if (nodes?.panel?.parentNode) {
          nodes.panel.parentNode.removeChild(nodes.panel);
        }
        closeTimer = null;
      }, animationMs + 16);
    } else {
      if (nodes?.backdrop?.parentNode) {
        nodes.backdrop.parentNode.removeChild(nodes.backdrop);
      }
      if (nodes?.panel?.parentNode) {
        nodes.panel.parentNode.removeChild(nodes.panel);
      }
    }
    if (notify && activeIndex >= 0) {
      const activeItem = currentItems[activeIndex];
      currentOptions.onClose?.(activeItem, activeIndex);
    }
    viewerNodes = null;
    activeIndex = -1;
  }

  function openByIndex(index, sourceElement = null) {
    if (!currentItems.length) {
      return;
    }
    const safeIndex = Math.max(0, Math.min(currentItems.length - 1, Number(index)));
    const item = currentItems[safeIndex];
    if (!item) {
      return;
    }
    activeIndex = safeIndex;
    const sourceRect = sourceElement?.getBoundingClientRect?.() || null;
    renderViewerItem(item, safeIndex, sourceRect);
    currentOptions.onOpen?.(item, safeIndex);
  }

  function openById(id) {
    const index = currentItems.findIndex((item) => String(item.id) === String(id));
    if (index >= 0) {
      openByIndex(index);
    }
  }

  render();

  return {
    destroy() {
      stripEvents.clear();
      viewerEvents.clear();
      closeViewer(false, true);
      clearNode(container);
      root = null;
    },
    update(nextItems = [], nextOptions = {}) {
      currentOptions = normalizeOptions({ ...currentOptions, ...nextOptions });
      currentItems = normalizeItems(nextItems, currentOptions);
      render();
    },
    openById,
    openByIndex,
    getState() {
      return {
        items: clone(currentItems),
        options: clone(currentOptions),
        activeIndex,
      };
    },
  };
}

function playOpenAnimation(panel, sourceRect, panelRect, finalTransform, finalOpacity, animationMs) {
  const startTransform = sourceRect
    ? getTransformFromRect(sourceRect, panelRect)
    : "translate(-50%, -48%) scale(0.985)";
  const startOpacity = sourceRect ? 0.9 : 0;
  panel.style.transform = startTransform;
  panel.style.opacity = String(startOpacity);
  if (typeof panel.animate !== "function") {
    panel.style.transform = finalTransform;
    panel.style.opacity = finalOpacity;
    return;
  }
  const animation = panel.animate(
    [
      { transform: startTransform, opacity: String(startOpacity) },
      { transform: finalTransform, opacity: String(finalOpacity) },
    ],
    { duration: animationMs, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)", fill: "both" }
  );
  animation.onfinish = () => {
    panel.style.transform = finalTransform;
    panel.style.opacity = finalOpacity;
  };
}

function playCloseAnimation(panel, targetRect, panelRect, animationMs) {
  const endTransform = targetRect
    ? getTransformFromRect(targetRect, panelRect)
    : "translate(-50%, -48%) scale(0.985)";
  const endOpacity = targetRect ? 0.9 : 0;
  if (typeof panel.animate !== "function") {
    panel.style.transform = endTransform;
    panel.style.opacity = String(endOpacity);
    return;
  }
  panel.animate(
    [
      { transform: "translate(-50%, -50%) scale(1)", opacity: "1" },
      { transform: endTransform, opacity: String(endOpacity) },
    ],
    { duration: animationMs, easing: "cubic-bezier(0.4, 0, 1, 1)", fill: "both" }
  );
}

function normalizeOptions(options = {}) {
  return {
    ...DEFAULT_OPTIONS,
    ...options,
    layout: options.layout === "wrap" ? "wrap" : "scroll",
  };
}

function normalizeItems(items, options = {}) {
  const normalizedOptions = normalizeOptions(options);
  return (Array.isArray(items) ? items : [])
    .map((item, index) => {
      const normalizedType = item?.type === "video" ? "video" : item?.type === "photo" ? "image" : item?.type === "image" ? "image" : "unsupported";
      const path = resolveUrl(String(item?.path || ""), normalizedOptions.baseUrl);
      const thumb = String(item?.thumbUrl || "");
      const src = resolveUrl(String(item?.srcUrl || path || thumb || ""), normalizedOptions.baseUrl);
      return {
        id: item?.id ?? String(index),
        type: normalizedType,
        thumbUrl: thumb || (normalizedType === "image" ? src : ""),
        srcUrl: src,
        alt: item?.alt || "",
        title: item?.title || "",
        duration: item?.duration ?? item?.duration_seconds ?? null,
        mimeType: item?.mimeType || "",
        posterUrl: item?.posterUrl || "",
      };
    })
    .filter((item) => (item.type === "image" || item.type === "video") && Boolean(item.srcUrl));
}

function getRectCenter(rect) {
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

function runAfterNextPaint(callback) {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      callback?.();
    });
  });
}

function getAnimationMs(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 300;
  }
  return Math.max(80, Math.round(parsed));
}

function getTransformFromRect(fromRect, toRect) {
  const fromCenter = getRectCenter(fromRect);
  const toCenter = getRectCenter(toRect);
  const deltaX = fromCenter.x - toCenter.x;
  const deltaY = fromCenter.y - toCenter.y;
  const scaleX = Math.max(0.08, fromRect.width / Math.max(1, toRect.width));
  const scaleY = Math.max(0.08, fromRect.height / Math.max(1, toRect.height));
  return `translate(-50%, -50%) translate(${deltaX}px, ${deltaY}px) scale(${scaleX}, ${scaleY})`;
}

function resolveUrl(url, baseUrl) {
  const value = String(url || "");
  if (!value) {
    return "";
  }
  if (/^https?:\/\//i.test(value) || value.startsWith("/") || value.startsWith("data:")) {
    return value;
  }
  if (!baseUrl) {
    return value;
  }
  return `${String(baseUrl).replace(/\/+$/, "")}/${value.replace(/^\/+/, "")}`;
}

function clone(value) {
  try {
    return structuredClone(value);
  } catch (_) {
    return JSON.parse(JSON.stringify(value));
  }
}
