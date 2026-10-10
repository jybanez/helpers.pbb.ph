# Marker drop/bounce (cache revision 0.21.277)

`createMapMarker` and `createMapClusterMarker` still return a DOM element suitable
for the map engine. They now expose `animateDrop(options)`, `cancelDrop()` and
`destroy()` on that element. Shape and count share an inner visual wrapper;
animation never writes the outer map positioning transform or changes the root
dimensions, exact anchor, pin rotation, icon orientation or accessible name.
The existing pulse halo stays anchored on the root.

MapLibre host placement is part of canonical marker CSS: roots carrying both
`.maplibregl-marker` and `.ui-map-marker` use `position:absolute; top:0; left:0`.
This preserves the engine's projected transform regardless of stylesheet order
or preceding current-location/destination markers. Standalone previews retain
relative positioning. Pass the returned element directly to MapLibre `Marker`;
do not add pixel/coordinate corrections or overwrite its outer transform.
The placement correction ships in marker CSS/main bundle cache `0.21.279`.

```js
const markerElement = createMapMarker({ shape: "pin", label: "Search destination" });
const mapMarker = new maplibregl.Marker({ element: markerElement, anchor: "bottom" })
  .setLngLat(destination).addTo(map);
// The application verifies arrival and current selection before this call.
const result = await markerElement.animateDrop({ essential: true });
if (result.status === "completed") { /* still check the app flight token */ }
// On interruption or a new selection:
markerElement.cancelDrop();
// On disposal:
markerElement.destroy();
mapMarker.remove();
```

`animateDrop` starts immediately on demand and returns a Promise of `{status}`:
`completed`, `cancelled`, `skipped`, or `destroyed`. A replay cancels and settles
the previous run before starting another. Cancellation and completion remove the
animation effect, restoring the resting visual without residual inline transform.
Old animation completion cannot settle or clear a later run. `cancelDrop()`
returns whether a run was cancelled. `destroy()` cancels with status `destroyed`
and permanently prevents further animation; it does not remove the element or
the map engine's marker. Apps must call it during map replacement/teardown.

Options: `duration` in milliseconds (default 650, bounded 100–3000), `distance`
in pixels (default 80, bounded 0–500), `bounce` in pixels (default 8, bounded
0–40). The visual falls from above, then performs two restrained upward rebounds
and rests at zero displacement. Nonfinite numbers use defaults.

Reduced motion skips by default. `essential:true` explicitly allows this call to
animate despite the preference, matching an app's deliberately essential flight
sequence. This override never changes global motion settings. Browsers without
Web Animations skip gracefully. A skipped marker is already at its resting anchor.

Helper owns only the marker animation. Applications own exact coordinates,
map-engine anchor choice, flight completion, current-selection tokens, manual
interruption guards, cancellation during rapid selections, and removal. A marker
is not auto-hidden while waiting for arrival: create/add it at the intended time.
Do not use a cancelled/destroyed result as evidence of arrival.

Ship coherent marker source/CSS and dependencies, or the regenerated main UI JS/CSS
pair at cache revision `0.21.277`. Package version is unchanged. Focused source and
bundle coverage: `node tests/map.markers.regression.mjs`; tests verify lifecycle,
replay, reduced-motion policy, resting geometry, rotation, accessible name and
outer transform preservation in Chromium. Real-map flight sequencing remains
application verification.
