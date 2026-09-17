// Documentation-only examples consumed by the shared demo shell.
// The live implementation remains in demos/demo.timeline.html.
(() => {
  const meta = window.demoMeta;
  meta.sectionSamples = {
    "vertical (grouped)": `// Reuse createTimeline, host, and items from Start here.
const timeline = createTimeline(host, items, {
  orientation: "vertical",
  groupByDate: true,
  density: "comfortable",
  locale: "en-US",
  timeZone: "Asia/Manila",
  emptyText: "No history yet.",
  onItemClick(item) { console.log("item", item.id); },
  onActionClick(action, item) {
    console.log("action", action.id, "on", item.id);
  },
});

// Update the full collection and only the options that changed.
timeline.update(items, { groupByDate: false }); // full date/time
timeline.update([], { emptyText: "No matching events." });
timeline.update(items, { groupByDate: true }); // restore

// Optional time-window filter: offsets are milliseconds from anchorMs.
const anchorMs = Date.parse("2026-03-09T00:00:00+08:00");
timeline.setLinkedRange({ anchorMs, startMs: 0, endMs: 86400000 - 1 });
timeline.setLinkedRange(null); // clear the filter
// On view teardown: timeline.destroy();`,
    "virtualized feed": `// Native disclosure: no application expansion map or header renderer.
host.style.height = "480px";
const records = Array.from({ length: 160 }, (_, i) => ({
  id: "event-" + i, title: "Operator Maya", subtitle: "Team Alpha",
  timestamp: new Date(Date.UTC(2026, 2, 9, 8, 30) - i * 420000).toISOString(),
  description: "Application message details for event " + i,
}));
const timeline = createTimeline(host, records, {
  collapsible: true, defaultCollapsed: true, groupByDate: true,
  enableVirtualization: true, virtualThreshold: 100,
  estimateItemHeight(item, { startsGroup }) {
    return (item.collapsed ? 100 : 190) + (startsGroup ? 40 : 0);
  },
  onCollapseChange(change) { console.log(change.ids, change.collapsed); },
  onReachEnd(boundary) { console.log("load older records here", boundary); },
});
timeline.setCollapsed("event-120", false);
await timeline.scrollToItem("event-120", { align: "start", focus: true });
timeline.collapseAll(); // includes filtered/offscreen loaded items
// Future items use defaultCollapsed; bulk methods change existing items only.
// timeline.expandAll();
// timeline.destroy();`,
    "horizontal": `const timeline = createTimeline(host, items, {
  orientation: "horizontal",
  groupByDate: false,
  density: "compact",
  timeZone: "Asia/Manila",
  onItemClick(item) { console.log("selected milestone", item.id); },
});
// Standard rendering; no bounded height or virtual window is needed.
// On view teardown: timeline.destroy();`,
    "custom content": `const records = [{
  id: "recording-42", contentKey: "player-v1",
  title: "Call recording", timestamp: "2026-03-09T08:18:00+08:00",
  note: "Initial recording metadata",
}];
const timeline = createTimeline(host, records, {
  mountItemContent(slot, item, context) {
    const card = document.createElement("p");
    slot.append(card);
    function update(nextItem) { card.textContent = nextItem.note; }
    update(item);
    console.log("mount", item.id, context.index, context.total);
    return {
      update,
      destroy() {
        // Stop your media, timers, observers, and external subscriptions here.
        console.log("destroy", item.id);
      },
    };
  },
});
records[0] = { ...records[0], note: "Updated metadata" };
timeline.update(records); // same id/contentKey: update the existing mount
records[0] = { ...records[0], contentKey: "player-v2" };
timeline.update(records); // new contentKey: destroy, then mount
timeline.update([]); // removal also destroys the mount
timeline.destroy(); // release the entire view`,
  };
  meta.options.push(
    { option: "collapsible / defaultCollapsed", default: "false / false", description: "Opt in to native disclosure; set the initial state for new stable IDs." },
    { option: "onCollapseChange", default: "null", description: "Receives { ids, collapsed } once per change operation." },
    { option: "<code>locale</code>", default: '<code>"en-US"</code>', description: "Intl date/time formatting locale, for example en-GB for 24-hour time." },
    { option: "<code>timeZone</code>", default: "browser timezone", description: "IANA timezone such as Asia/Manila or UTC. Controls both date boundaries and displayed timestamps; set explicitly when all users must see the same day groups." },
    { option: "<code>emptyText</code>", default: '<code>"No timeline items."</code>', description: "Message displayed when the collection or linked range contains no visible items." },
    { option: "<code>className</code>", default: '<code>""</code>', description: "Extra root class for scoped application styling." },
    { option: "<code>onRangeChange</code>", default: "<code>null</code>", description: "Receives the mounted virtual range and state, not the full set of records in view." },
    { option: "<code>onReachEnd</code>", default: "<code>null</code>", description: "Notifies once per end boundary when within endThreshold; your app owns fetching, loading/error UI, and retries." },
  );
  meta.options.find(row => row.option === "<code>groupByDate</code>").description = "Groups vertical items by day. Grouped timestamps show time only; virtual feeds keep an active floating date after the inline heading scrolls away. Horizontal timelines keep full timestamps.";
  meta.methods.unshift(
    { method: "setCollapsed(id, value)", arguments: "stable ID, boolean", returns: "Whether an existing item changed." },
    { method: "isCollapsed(id)", arguments: "stable ID", returns: "Current collapsed state; false if unavailable." },
    { method: "collapseAll() / expandAll()", arguments: "none", returns: "Changed IDs, including filtered/offscreen loaded items." },
  );
  meta.properties.unshift(
    { property: "item.collapsed / item.preview", type: "boolean / string", description: "Initial disclosure state and plain-text collapsed preview (defaults to description)." },
    { property: "<code>item.timestamp</code>", type: "ISO date string", description: "Use a timezone-qualified timestamp. Initial/update collections sort newest first; invalid or missing timestamps are undated. Supply append/prepend batches in the correct chronological direction." },
    { property: "<code>item.title / subtitle / description</code>", type: "string", description: "Standard card text. title defaults to Untitled Event; other text is optional. Custom content appears below these fields." },
    { property: "<code>item.status</code>", type: "string", description: "Marker appearance: requested, assigned, accepted, en_route, on_scene, completed, cancelled. Aliases include success, warning, error, and info." },
    { property: "<code>item.meta</code>", type: "string[]", description: "Optional tags beneath the description, for example Hotline and Inbound." },
    { property: "<code>item.iconHtml</code>", type: "string", description: "Optional trusted marker HTML. Do not pass untrusted user HTML here; use textContent for user text in custom mounts." },
    { property: "<code>item.hasCustomContent</code>", type: "boolean", description: "Set false to skip the custom-content mount for a particular item." },
    { property: "<code>mount context</code>", type: "object", description: "index, total, timeline, options, and visibleItems. Store durable app state outside the mount because virtual rows can unmount." },
  );
})();
