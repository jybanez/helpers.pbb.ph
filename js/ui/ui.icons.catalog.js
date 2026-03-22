export const ICON_DEFINITIONS = {
  "actions.add": icon("actions", [
    line(12, 5, 12, 19),
    line(5, 12, 19, 12),
  ]),
  "actions.check": icon("actions", [
    polyline("5 13 10 18 19 7"),
  ]),
  "actions.close": icon("actions", [
    line(6, 6, 18, 18),
    line(18, 6, 6, 18),
  ]),
  "actions.copy": icon("actions", [
    rect(9, 9, 10, 10, 2),
    path("M15 9V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"),
  ]),
  "actions.delete": icon("actions", [
    path("M4 7h16"),
    path("M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"),
    path("M7 7l1 12a1 1 0 0 0 1 .9h6a1 1 0 0 0 1-.9L17 7"),
    line(10, 11, 10, 17),
    line(14, 11, 14, 17),
  ]),
  "actions.download": icon("actions", [
    line(12, 4, 12, 15),
    polyline("8 11 12 15 16 11"),
    path("M5 19h14"),
  ]),
  "actions.edit": icon("actions", [
    path("M4 20l4.5-1 9.3-9.3a2.1 2.1 0 0 0-3-3L5.5 16 4 20z"),
    path("M13.5 6.5l4 4"),
  ]),
  "actions.search": icon("actions", [
    circle(11, 11, 6),
    line(16, 16, 20, 20),
  ]),
  "navigation.chevron-left": icon("navigation", [
    polyline("15 6 9 12 15 18"),
  ]),
  "navigation.chevron-right": icon("navigation", [
    polyline("9 6 15 12 9 18"),
  ]),
  "navigation.chevron-up": icon("navigation", [
    polyline("6 15 12 9 18 15"),
  ]),
  "navigation.chevron-down": icon("navigation", [
    polyline("6 9 12 15 18 9"),
  ]),
  "navigation.arrow-left": icon("navigation", [
    line(19, 12, 5, 12),
    polyline("11 6 5 12 11 18"),
  ]),
  "navigation.arrow-right": icon("navigation", [
    line(5, 12, 19, 12),
    polyline("13 6 19 12 13 18"),
  ]),
  "status.success": icon("status", [
    circle(12, 12, 9),
    polyline("8 12 11 15 16 9"),
  ]),
  "status.warning": icon("status", [
    path("M12 4l9 16H3l9-16z"),
    line(12, 9, 12, 13),
    line(12, 17, 12, 17.5),
  ]),
  "status.error": icon("status", [
    circle(12, 12, 9),
    line(9, 9, 15, 15),
    line(15, 9, 9, 15),
  ]),
  "status.info": icon("status", [
    circle(12, 12, 9),
    line(12, 10, 12, 16),
    line(12, 7.5, 12, 7.5),
  ]),
  "media.play": icon("media", [
    path("M8 6l10 6-10 6V6z"),
  ]),
  "media.pause": icon("media", [
    rect(7, 6, 3, 12, 1),
    rect(14, 6, 3, 12, 1),
  ]),
  "media.image": icon("media", [
    rect(4, 5, 16, 14, 2),
    circle(9, 10, 1.2),
    path("M5 16l4-4 3 3 3-3 4 4"),
  ]),
  "media.video": icon("media", [
    rect(4, 6, 12, 12, 2),
    path("M16 10l4-2v8l-4-2z"),
  ]),
  "media.audio": icon("media", [
    path("M10 8l5-3v14l-5-3H7a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h3z"),
    path("M18 9a4 4 0 0 1 0 6"),
  ]),
  "data.grid": icon("data", [
    rect(4, 4, 7, 7, 1.5),
    rect(13, 4, 7, 7, 1.5),
    rect(4, 13, 7, 7, 1.5),
    rect(13, 13, 7, 7, 1.5),
  ]),
  "data.tree": icon("data", [
    circle(7, 7, 2),
    circle(17, 7, 2),
    circle(12, 17, 2),
    path("M9 7h6"),
    path("M12 9v6"),
  ]),
  "data.upload": icon("data", [
    path("M5 18h14"),
    line(12, 16, 12, 6),
    polyline("8 10 12 6 16 10"),
  ]),
  "data.filter": icon("data", [
    path("M4 6h16l-6 7v5l-4-2v-3L4 6z"),
  ]),
};

function icon(category, nodes) {
  return {
    category,
    viewBox: "0 0 24 24",
    nodes,
  };
}

function path(d) {
  return { tag: "path", attrs: { d } };
}

function line(x1, y1, x2, y2) {
  return { tag: "line", attrs: { x1, y1, x2, y2 } };
}

function polyline(points) {
  return { tag: "polyline", attrs: { points } };
}

function circle(cx, cy, r) {
  return { tag: "circle", attrs: { cx, cy, r } };
}

function rect(x, y, width, height, rx = 0) {
  return { tag: "rect", attrs: { x, y, width, height, rx } };
}
