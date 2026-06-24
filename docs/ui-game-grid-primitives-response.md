# Helper Response: Grid/Maze Game Primitives

## Status

Response to PBB Games proposal:

`C:\wamp64\www\pbb\games\docs\helper-grid-maze-game-primitives-proposal.md`

Helper agrees with the direction. Grid/maze mechanics are broad enough to become shared Helper game primitives, but they should land as a narrow optional module rather than expanding `ui.game.objects`.

## Recommendation

Add a new optional game module:

```text
ui.game.grid
```

V1 should expose:

- `createGridMaze(options)`
- `createGridMover(options)`
- `createGridPathfinder(options)`

This keeps tile/maze mechanics separate from canvas object behavior:

- `ui.game.objects` remains about canvas entities, hit routing, object layers, flip cards, and tetromino pieces.
- `ui.game.grid` owns reusable grid topology, grid movement, and grid pathfinding.
- Games owns Pac-Man rules, scoring, lives, power modes, ghost personalities, level design, and win/loss decisions.

## V1 Scope

### `createGridMaze(options)`

Helper should own map normalization and grid queries.

V1 should support:

- character maps and object matrices
- `rows`, `columns`, `cellSize`, and normalized cells
- tile definition lookup by character or object key
- `getTile(row, column)`
- `setTile(row, column, value)`
- `isInside(row, column)`
- `isWall(row, column)`
- `isPath(row, column)`
- `canEnter(row, column, context?)`
- `gridToPixel(row, column)`
- `pixelToGrid(x, y)`
- `cellCenter(row, column)`
- `forEachCell(callback)`
- named points collected from tile metadata

Recommended tile metadata:

```js
{
  type: "wall" | "path",
  enterable: true,
  point: "playerSpawn",
  points: ["enemySpawn"],
  data: {}
}
```

Helper should not assign game meaning to pellets, power pellets, ghosts, exits, rewards, or hazards in V1. It can preserve metadata for the app to interpret.

### `createGridMover(options)`

Helper should own deterministic grid-aligned movement with queued turns.

V1 should support:

- initial `row`, `column`, and optional pixel alignment
- `direction` and `queuedDirection`
- cardinal directions only: `up`, `down`, `left`, `right`
- `speed` in cells per second
- `canEnter(row, column, context?)`
- optional `resolveExit(next, context?)` callback for tunnels/wraps
- `setDirection(direction)`
- `queueDirection(direction)`
- `moveTo(row, column)`
- `update(deltaSeconds)`
- `getState()`

The mover should expose both grid and pixel state because canvas games need pixel positions for drawing and interpolation, while rules often need cell positions.

### `createGridPathfinder(options)`

Helper should own generic grid pathfinding, not enemy AI.

V1 should support:

- cardinal neighbors by default
- optional diagonal neighbors only when explicitly enabled
- `canEnter(row, column, context?)`
- `findPath(start, target, options?)`
- `nextStep(start, target, options?)`
- `distanceMap(target, options?)`

Pathfinding should remain algorithmic infrastructure. Games should pass target selection, chase/scatter/frightened behavior, patrol rules, randomness, and difficulty.

## Deferred Scope

### `createCollectibleLayer`

Good candidate for V1.1 after Pac-Man proves the needs.

Reasons to defer:

- collectible rules vary quickly between pellets, coins, keys, supplies, quizzes, and timed items
- respawn and hidden-item behavior may need more than one game to shape correctly
- simple app-local collection is cheap for the first Pac-Man implementation

### `createSpriteAnimator`

Good candidate for V1.1 or V2.

Reasons to defer:

- sprite sheets, procedural drawing, image arrays, CSS sprites, and canvas frame callbacks have different contracts
- animation needs should be informed by at least two games before Helper freezes an API

## Portal And Wrap Handling

V1 should support portals without making them Pac-Man-specific.

Recommended split:

- `createGridMaze` may store named points and tile metadata such as `{ portal: "leftTunnel" }`.
- `createGridMover` should accept `resolveExit(next, context?)` so the app decides if a movement exit wraps.
- `createGridPathfinder` should accept optional `getNeighbors(cell, context?)` or portal-aware options later if a real game needs pathfinding through tunnels.

This avoids Helper owning game-specific tunnel behavior too early.

## Module Placement

Use `ui.game.grid`, not `ui.game.objects`.

Reasons:

- grid primitives are useful even when a game does not use Helper object layers
- pathfinding and map parsing are non-rendering logic
- `ui.game.objects` is already carrying entity/object behavior, flip cards, and tetrominoes
- a separate module keeps the optional game bundle organized as it grows

## Demo And Test Expectations

V1 should include:

- `demos/demo.game.grid.html`
- `tests/game.grid.regression.html`
- `tests/game.grid.regression.mjs`

Regression coverage should prove:

- character map normalization
- object matrix normalization
- wall/path/enterable queries
- grid/pixel conversion
- point extraction
- mover queued turns and wall rejection
- mover wrap callback behavior
- pathfinder no-path and shortest-path cases
- pathfinder cardinal-only default

## Suggested Games Consumption

For Pac-Man-style work, Games can plan around:

```js
const {
  createGridMaze,
  createGridMover,
  createGridPathfinder,
} = helperGameBundleModules["./ui.game.grid.js"];
```

Games should still keep:

- scoring
- lives
- power modes
- ghost personalities and target selection
- level progression
- collectible meaning
- art and sound timing
- persistence and rewards

## Implementation Checklist

1. Add `js/ui/ui.game.grid.js`.
2. Register `ui.game.grid` in `js/ui/ui.loader.js` as a game-bundle module.
3. Add `createGridMaze`, `createGridMover`, and `createGridPathfinder`.
4. Add focused demo page and shared navigation entry under Gaming.
5. Add `game.grid` regression tests.
6. Update `docs/ui-game-core-v1-spec.md`.
7. Update `README.md`.
8. Rebuild bundles with `npm run build:ui-bundle`.
9. Run `ui.bundle.contract`, `registry.contract`, and focused game-grid regression.
10. Notify PBB Games with the final module key and starter consumption shape.

## Open Decisions Before Code

- Exact object-matrix cell shape.
- Whether `canEnter` defaults to `tile.enterable !== false && tile.type !== "wall"`.
- Whether `setTile` should preserve original source symbols or only normalized cells.
- Whether pathfinder should expose BFS only in V1 or include A* immediately.
- Whether portal-aware pathfinding belongs in V1 or should wait for a second game.

Helper recommendation: start with BFS/cardinal pathfinding only. Add A* and portal-aware pathfinding after Pac-Man proves a concrete need.
