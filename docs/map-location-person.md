# Terrain location person (MapLibre GL JS 4.6.x)

`ui.map.location.person` provides a complete custom 3D layer/controller. Its
original procedural mesh has a neutral rounded head, blue body and circular
ground base. It conveys location without claiming device heading. Geometry,
shaders and renderer are bundled locally under this repository's ISC license;
there are no downloaded models, textures or renderer dependencies. The demo's
existing MapLibre distribution is BSD-3-Clause (see `licenses/`).

```js
const createPerson = await uiLoader.get('ui.map.location.person');
const person = createPerson({
  map, maplibre: maplibregl, lngLat: [123.9, 10.3],
  id: 'current-location-person', label: 'Your current location', sizePx: 34,
  onStateChange(state) { dotElement.hidden = state.status === 'rendered'; },
  onError({ error, state }) { console.warn(error); }
});
person.updateLngLat(nextLocation); // null hides the person
person.setMap(replacementMap);    // null detaches
person.retry();                   // explicit retry after renderer failure
person.destroy();                 // terminal, idempotent
```

Options also accept `beforeId` and `accessibilityParent` (defaults to map container).
The labelled `role="img"` element is exposed only while the person is rendered.
Use a distinct layer ID. Collisions report failure without removing another
owner's layer. Coordinates accept `[lng, lat]` or `{lng, lat}` and must be finite,
within longitude ±180 and Mercator latitude ±85.05112878.

`getState()` returns status (`waiting`, `ready`, `rendered`, `error`,
`context-lost`, `destroyed`), error text, attachment/resource flags, coordinates,
terrain offset, model scale and target size. Callbacks report state transitions;
read `getState()` for current frame diagnostics. `sizePx` is clamped to 18–64 and
controls ground-plane projected scale, not a fixed physical height. Perspective
remains map-owned; pitch/bearing change the view naturally. Extreme camera views
and offscreen coordinates can hide the model.

This implementation deliberately targets **4.6.x**. In that version,
[`queryTerrainElevation`](https://github.com/maplibre/maplibre-gl-js/blob/v4.6.0/src/ui/camera.ts)
returns exaggerated terrain elevation minus camera-center elevation. The
[`custom-layer matrix`](https://github.com/maplibre/maplibre-gl-js/blob/v4.6.0/src/geo/transform.ts)
uses that center-relative offset. It is converted to Mercator Z exactly once;
the controller does not multiply exaggeration again. Pending elevation (`null`)
uses zero until a later map frame supplies terrain. The base is anchored at the
exact coordinate, using the nearest world copy. Local coordinates are combined
with the map matrix on the CPU before Float32 upload to preserve precision.

Style replacement reattaches the layer; map replacement removes old listeners,
layer and GL resources. Context loss suspends rendering; restoration recreates
resources. Shader, buffer, context or matrix failures dispose resources and
report error for application dot fallback. WebGL2 VAOs or WebGL1's
`OES_vertex_array_object` are required. The renderer restores touched shared GL
state. There is no timer, animation frame loop or repaint request during render;
updates and attachment request one repaint, and MapLibre owns subsequent frames.

The application owns GPS permission, location validity/freshness, accuracy area,
canonical dot fallback and user-facing recovery. Do not hide the dot before
`rendered`; show it on other states. This controller does not request location.

Demo: `demos/demo.map.location.person.html` (add `?bundle` for bundled factory).
It uses a generated local DEM and exercises terrain, exaggeration, camera,
location updates and style replacement. No external tiles are required.

Verification: `node tests/map.location.person.regression.mjs` uses Chromium for
source/bundle GL and lifecycle checks, then the installed Playwright CLI for
wall-clock real MapLibre terrain-worker tests. Install/provide `@playwright/cli`
and its browser for that check. Real-engine tests verify blue pixels, camera/zoom,
terrain on/off/exaggeration, updates, style reload, narrow layout, idle and disposal.
The isolated GL fixture also covers failure/retry, stale callbacks, map replacement,
context loss/restoration, shared GL state and accessible semantics.
