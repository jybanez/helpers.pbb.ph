# Helper Response: Grid/Maze Game Primitives

## Status

Implemented Helper response to PBB Games proposal:

`C:\wamp64\www\pbb\games\docs\helper-grid-maze-game-primitives-proposal.md`

Helper agrees with the direction. Grid/maze mechanics are broad enough to become shared Helper game primitives, but they land as a narrow optional module rather than expanding `ui.game.objects`.

Implemented in:

- `js/ui/ui.game.grid.js`
- loader key `ui.game.grid`
- optional game bundle `dist/helpers.game.bundle.min.js`
- `demos/demo.game.grid.html`
- `tests/game.grid.regression.html`
- `tests/game.grid.regression.mjs`

## Recommendation

Use the optional game module:

```text
ui.game.grid
```

V1 exposes:

- `createGridMaze(options)`
- `createGridMover(options)`
- `createGridPathfinder(options)`

This keeps tile/maze mechanics separate from canvas object behavior:

- `ui.game.objects` remains about canvas entities, hit routing, object layers, flip cards, and tetromino pieces.
- `ui.game.grid` owns reusable grid topology, grid movement, and grid pathfinding.
- Games owns Pac-Man rules, scoring, lives, power modes, ghost personalities, level design, and win/loss decisions.

## V1 Scope

### `createGridMaze(options)`

Helper owns map normalization and grid queries.

V1 supports:

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

Helper does not assign game meaning to pellets, power pellets, ghosts, exits, rewards, or hazards in V1. It preserves metadata for the app to interpret.

### `createGridMover(options)`

Helper owns deterministic grid-aligned movement with queued turns.

V1 supports:

- initial `row`, `column`, and optional pixel alignment
- `direction` and `queuedDirection`
- cardinal directions only: `up`, `down`, `left`, `right`
- `speed` in cells per second
- optional `preTurnTolerance` in cells for touch-friendly early queued turns
- `canEnter(row, column, context?)`
- optional `resolveExit(next, context?)` callback for tunnels/wraps
- `setDirection(direction)`
- `queueDirection(direction)`
- `moveTo(row, column)`
- `moveTowardCell(row, column, options?)` for scripted adjacent-cell path steps; it stops after the explicit target by default and supports `{ continueAfterTarget: true }`
- `update(deltaSeconds)`
- `getState()`

The mover should expose both grid and pixel state because canvas games need pixel positions for drawing and interpolation, while rules often need cell positions.

### `createGridPathfinder(options)`

Helper owns generic grid pathfinding, not enemy AI.

V1 supports:

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

V1 supports portals without making them Pac-Man-specific.

Recommended split:

- `createGridMaze` stores named points and preserves tile metadata such as `{ portal: "leftTunnel" }`.
- `createGridMover` accepts `resolveExit(next, context?)` so the app decides if a movement exit wraps.
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

V1 includes:

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
} = await uiLoader.get("ui.game.grid");
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

1. Done: add `js/ui/ui.game.grid.js`.
2. Done: register `ui.game.grid` in `js/ui/ui.loader.js` as a game-bundle module.
3. Done: add `createGridMaze`, `createGridMover`, and `createGridPathfinder`.
4. Done: add focused demo page and shared navigation entry under Game Objects.
5. Done: add `game.grid` regression tests.
6. Done: update `docs/ui-game-core-v1-spec.md`.
7. Done: update `README.md`.
8. Done: rebuild bundles with `npm run build:ui-bundle`.
9. Done: run `ui.bundle.contract`, `registry.contract`, and focused game-grid regression.
10. Done: notify PBB Games with the final module key and starter consumption shape.

## Closed Decisions For V1

- Object matrices accept plain cell objects and preserve them in `source`.
- `canEnter` defaults to `tile.enterable !== false && tile.type !== "wall"`.
- `setTile` normalizes the replacement and rebuilds points/collectibles.
- Pathfinder exposes BFS only in V1.
- Portal-aware movement is supported through `createGridMover({ resolveExit })`; portal-aware pathfinding can wait for a concrete game need.

Helper recommendation remains: add A* and portal-aware pathfinding after Pac-Man proves a concrete need.
