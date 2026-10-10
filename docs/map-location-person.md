# Terrain location person (MapLibre GL JS 4.6.x)

`ui.map.location.person` provides a complete custom 3D layer/controller. Its
original procedural mesh has a neutral rounded head, blue body and circular
ground base. It conveys location and optionally supplied device compass direction. Geometry,
shaders and renderer are bundled locally under this repository's ISC license;
there are no downloaded models, textures or renderer dependencies. The demo's
existing MapLibre distribution is BSD-3-Clause (see `licenses/`).

```js
const createPerson = await uiLoader.get('ui.map.location.person');
const person = createPerson({
  map, maplibre: maplibregl, lngLat: [123.9, 10.3],
  id: 'current-location-person', label: 'Your current location', sizePx: 34,
  headingDegrees: null, // unavailable: neutral appearance, no directional cue
  onStateChange(state) { dotElement.hidden = state.status === 'rendered'; },
  onError({ error, state }) { console.warn(error); }
});
person.updateLngLat(nextLocation); // null hides the person
person.updateHeading(compassHeadingOrNull); // clockwise from geographic north
person.setMap(replacementMap);    // null detaches
person.retry();                   // explicit retry after renderer failure
person.destroy();                 // terminal, idempotent
```

Options also accept `beforeId` and `accessibilityParent` (defaults to map container).
The labelled `role="img"` element is exposed only while the person is rendered.
Use a distinct layer ID. Collisions report failure without removing another
owner's layer. Coordinates accept `[lng, lat]` or `{lng, lat}` and must be finite,
within longitude ±180 and Mercator latitude ±85.05112878.

`getState()` returns status (`waiting`, `ready`, `rendered`, `not-visible`, `error`,
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

## Optional device direction (cache 0.21.281)

`headingDegrees` and `updateHeading(number|null)` use finite numeric degrees
clockwise from **geographic north**: 0 north, 90 east, 180 south, 270 west.
Numbers normalize to [0,360); -1 and 359 are equivalent, and 360 equals 0.
Invalid values throw without replacing a previous valid value. `null` or omitted
heading is explicitly unavailable: the gold arrow is hidden and the original
unrotated neutral model is used. The renderer never invents a heading from map
bearing, movement, or GPS course. The app must clear stale, denied or unavailable
sensor data with `updateHeading(null)` and perform sensor permission, calibration,
screen-orientation compensation and true-north conversion as appropriate.

The small original gold arrow sits just above the circular base and points along
local +Y. Both model and arrow rotate together in east/north world coordinates
before Mercator Y inversion, so map bearing/pitch and terrain change perspective
without changing geographic heading. The person's cosmetic forward axis follows
device direction; this **does not describe the user's bodily facing direction**.
The cue means device compass orientation only. No forward cone is drawn.

`getState()` includes normalized `headingDegrees` and `directionAvailable`.
Heading updates notify state without resetting rendering success or allocating
new GL resources, then request one repaint. Equivalent normalized updates do not
request another repaint; rendering itself never requests repaint. No animated
interpolation crosses the 359/0 boundary. On rendered success the accessible
location label also names device direction in degrees clockwise from geographic
north; null restores the original location-only label. Failure/context loss still
hides that label and preserves canonical dot fallback policy. Heading survives
style reattachment, map replacement and explicit retry, and updates are inert
after terminal destruction.

The local DEM demo has availability, 0–359 heading and cardinal controls. GL and
real-engine regressions check cardinal/world-ray alignment, 359/0 wraparound,
varied bearing/pitch/terrain, neutral state, accessible descriptions and existing
failure/resource lifecycle. Physical compass/device accuracy remains app-owned.

## Opt-in camera-distance sizing (cache 0.21.282)

The default `scaleMode:'screen'` retains the existing ground-plane size
normalization and `sizePx` semantics. Opt in when a far/horizon marker should
shrink naturally:

```js
const person = createPerson({ map, maplibre: maplibregl, lngLat,
  scaleMode: 'perspective', modelHeightMeters: 12, minSizePx: 8, maxSizePx: 64 });
person.setScaleMode('screen'); // reversible policy change; no resource recreation
person.setScaleMode('perspective');
```

Perspective mode gives the original 1.8-unit model a configurable world height
(default 12 meters, valid 0.1–1000), converted through MapLibre's latitude-aware
Mercator meter scale. This is a visual scale, not the person's physical height.
The camera's homogeneous projection/depth produces size changes as the marker
gets nearer/farther and as zoom changes. There is no map-center distance heuristic
or per-view ground foreshortening normalization. `sizePx` applies only in screen
mode. Terrain offset, world bearing, device heading and exact base anchor are
preserved in both modes.

`minSizePx`/`maxSizePx` bound the larger width/height of the projected 3D bounding
envelope in **CSS pixels**, default 8/64; validate 4 <= min <= max <= 128. The
envelope conservatively includes the person, base and available heading arrow,
so visible painted pixels may occupy less space. Bounds continuously rescale
the model; strict near/far ordering becomes a plateau when either bound is
reached. Near-plane intersections reduce scale toward the upper bound where
possible. A behind-camera/near-plane anchor or zero-size viewport skips rendering
and reports `not-visible` in perspective mode, hiding the accessible label. The
app's fallback policy can handle that state like other non-rendered states.
Offscreen placements may still report rendered; this is not a screen visibility
or terrain-occlusion query. Extreme views can occlude the model naturally.

State includes mode, world height, bounds and `projectedSizePx` (the envelope
measurement; 0 for legacy screen mode). View diagnostics are read through
`getState()`; frame rendering does not emit repeated callbacks or repaint itself.
`setScaleMode` validates before updating, requests one repaint, and is inert after
destroy. Bounds/world height are construction options. Integration uses
`ui.map.location.person.js?v=0.21.282` and main UI bundle revision 0.21.282;
marker CSS remains 0.21.278. Deliver the loader and generated bundle together.
`docs/map-person-perspective-runtime.json` lists the coherent artifacts and SHA-256
checksums (UTF-8, line endings normalized to LF for transport verification).

Tests include camera-depth ordering at the same zoom, numerical bound continuity,
finite matrices, actual MapLibre near/far and zoom 8/15/20 at pitches 0/60/85.
Desktop/mobile screenshots are browser evidence, not physical-device evidence.

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
