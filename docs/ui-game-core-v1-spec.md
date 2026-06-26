# UI Game Core V1 Spec

`ui.game.core` is the first Helper-owned foundation for canvas-first games in PBB citizen apps.

## Scope

The component provides framework-free primitives for:

- fullscreen game sessions
- managed canvas layers
- requestAnimationFrame game loops
- game action buttons
- touch direction controls
- virtual joystick controls
- lightweight game audio playback and procedural tones

It does not provide a full game engine, sprite system, physics engine, large sound pack, copyrighted audio, or score/persistence model.

## Registry

Loader key:

```text
ui.game.core
```

Group:

```text
games
```

Exports:

- `createGameSession(container, options)`
- `createCanvasLayer(session, options)`
- `createGameLoop(options)`
- `createGameActionButton(container, options)`
- `createGameActionButtonGroup(container, options)`
- `createTouchControlPad(container, options)`
- `createVirtualJoystick(container, options)`

Related loader key:

```text
ui.game.objects
```

Exports:

- `createGameObject(options)`
- `createGameObjectLayer(options)`
- `createPointerInputRouter(canvas, objectLayer, options)`
- `createFlipCard(options)`
- `createTetromino(options)`

Related loader key:

```text
ui.game.audio
```

Exports:

- `createGameAudio(options)`
- `createStarterGameSounds(options)`
- `STARTER_GAME_SOUND_NAMES`

Related loader key:

```text
ui.game.grid
```

Exports:

- `createGridMaze(options)`
- `createGridMover(options)`
- `createGridPathfinder(options)`

Related loader key:

```text
ui.game.state.chrome
```

Exports:

- `createGameStateChrome(session, options)`
- `GAME_SESSION_STATES`

## Game Session

`createGameSession` creates a fullscreen-capable overlay with:

- a fixed-aspect viewport
- a canvas stage
- an overlay layer for controls or Helper modals
- a close control
- `close`, `closecancel`, and `resize` events

Closing the session removes the overlay and exposes the parent app again.

The default close control remains a text Helper button. Games that need a balanced fullscreen affordance can request an icon-only control:

```js
createGameSession(host, {
  closeLabel: "Close game",
  closeControl: { variant: "icon", icon: "actions.close" },
});
```

Close confirmation is app-owned. Helper provides `onBeforeClose({ reason })` as the mechanism; returning `false` or a promise resolving to `false` cancels the close and emits `closecancel`. Use that hook to show a game-specific Helper modal or dialog when progress may be lost.

## Canvas Layers

`createCanvasLayer` appends a canvas to a session stage. Layers are absolutely positioned and sized to the session resolution. Use multiple layers for board/world, entities, effects, and debug/HUD rendering.

## Game Loop

`createGameLoop` wraps `requestAnimationFrame` and calls optional `update` and `render` callbacks with normalized timing metadata.

## Touch Control Pad

`createTouchControlPad` renders a directional control pad. It emits normalized `{ x, y }` vectors for `up`, `left`, `right`, and `down`, and supports disabled and repeat modes. Use `directions: ["left", "right"]` for games such as Breakout that only need horizontal movement, or a visibility map such as `directions: { up: false, down: false }`.

The default buttons use `ui.icons` directional arrows:

- `navigation.arrow-up`
- `navigation.arrow-left`
- `navigation.arrow-right`
- `navigation.arrow-down`

## Game Action Button

`createGameActionButton` renders a `ui-button`-based game action input with game-safe press lifecycle semantics. Use it for actions such as fire, jump, boost, interact, and charge.

It supports:

- `icon` with any `ui.icons` id, such as `media.play` or `actions.check`
- `onPress(meta)`
- `onRepeat(meta)` when `repeat` is enabled
- `onHold(meta)` after `holdThreshold`
- `onRelease(meta)`
- `setDisabled(disabled)`
- `getState()`

The metadata includes `phase`, `inputType`, `pressed`, `repeatCount`, `heldMs`, and `holdFired`.

## Game Action Button Group

`createGameActionButtonGroup` composes multiple game action buttons into a shared control cluster while preserving independent press lifecycle behavior for each button.

Use it for AB, ABXY, face-button, ability, or weapon clusters. Supported layouts are:

- `row`
- `column`
- `grid`
- `diamond`
- `cluster`

The group exposes `actions`, `setDisabled(disabled)`, `getState()`, and `destroy()`. Group callbacks receive `(id, meta)` so games can route actions through a single handler.
Each button config accepts the same visual options as `createGameActionButton`, including `icon`.

## Game Control Visibility

Game controls support shared visibility options so Helper owns the transparency mechanism while each game chooses the appropriate presentation.

Supported by:

- `createTouchControlPad`
- `createVirtualJoystick`
- `createGameActionButton`
- `createGameActionButtonGroup`

Options:

- `visibility: "solid"` keeps the normal Helper control treatment.
- `visibility: "overlay"` uses a semi-transparent HUD treatment for gameplay overlays.
- `visibility: "ghost"` uses a low-visibility treatment for experienced-player controls.
- `opacity: 0.65` overrides the preset opacity when a game needs finer tuning.

Controls restore full opacity on hover, focus, or active interaction.

## Game State Chrome

`ui.game.state.chrome` provides an optional lifecycle chrome layer for game sessions. It sits on top of `createGameSession()` and owns shared UI behavior such as pause/result overlays, contextual close-vs-pause control, progress display, action events, and opt-in shortcuts.

Helper owns:

- lifecycle state names
- top-right control switching
- pause, result, and milestone overlay DOM
- progress metadata display
- action and state events
- focus and accessibility behavior
- cleanup

The app owns:

- game rules and loops
- controller method calls
- score calculation
- level, wave, round, and objective rules
- win/loss decisions
- persistence and user settings

Lifecycle states:

```js
GAME_SESSION_STATES = [
  "loading",
  "splash",
  "countdown",
  "ready",
  "playing",
  "paused",
  "won",
  "gameOver",
  "exiting",
];
```

Progression is intentionally separate from lifecycle state. Use `updateProgress()` for score, level, lives, wave, objective, or similar app-owned metadata.

Example:

```js
const chrome = createGameStateChrome(session, {
  initialState: "ready",
  shortcuts: { enabled: true, escape: "pause-or-exit" },
  onAction(action) {
    if (action === "pause") controller.pause();
    if (action === "resume") controller.resume();
    if (action === "restart") controller.restart();
    if (action === "exit") session.close("state-chrome-exit");
  },
});

chrome.updateProgress({ score: 120, level: 2, lives: 3 });
chrome.setState("playing");
```

Important methods:

- `setState(state, context?)` changes lifecycle state.
- `getState()` returns current state, previous state, active control, progress, overlay type, and destroyed status.
- `updateProgress(data)` merges and displays progress metadata.
- `showPause(options?)`, `showResult(options?)`, and `showMilestone(options?)` show standard overlays.
- `hideOverlay()` removes the active overlay.
- `setControl("pause" | "close")` overrides the contextual control.
- `destroy()` cleans up DOM and listeners.

Milestone overlays support short non-blocking feedback moments without expanding lifecycle states:

```js
chrome.showMilestone({
  type: "levelUp",
  title: "Level Up",
  detail: "Level 2",
  tone: "success",
  position: "top",
  duration: 1200,
  autoDismiss: true,
  actions: [],
  onDismiss(context) {
    console.log(context.reason);
  },
});
```

Milestone `position` accepts `"center"`, `"top"`, `"top-center"`, `"bottom"`, or `"bottom-center"`. `tone` accepts `"default"`, `"success"`, `"info"`, `"warning"`, or `"danger"`. Helper owns the overlay chrome, accessible announcement, timeout cleanup, and reduced-motion-safe animation; the game owns when milestones appear and what they mean.

Standard actions are `pause`, `resume`, `restart`, `exit`, and `continue`. `playAgain` is normalized to the `restart` action and should be treated as display text.

Overlay action labels use `options.labels` by default:

```js
createGameStateChrome(session, {
  labels: {
    resume: "Keep Playing",
    restart: "Try Again",
    exit: "Home",
    continue: "Next",
  },
});
```

For result overlays, `overlays.result.restartLabel` remains the narrower override for the visible `restart` action label.

Overlay actions can be strings or objects. Use object actions when an app wants a visible Home/Lobby action without closing the session:

```js
chrome.showPause({
  actions: [
    "resume",
    "restart",
    { id: "exit", label: "Home", nextState: "ready", closeSession: false },
  ],
});
```

By default, `exit` closes the game session. When `closeSession: false` is set, Helper emits the `exit` action, hides the overlay, optionally moves to `nextState`, and leaves the session open.

`onAction` may return `false` to suppress Helper's default action handling when the app wants to fully own the result.

When state chrome shortcuts are enabled, state chrome captures handled key events before the session's default key handler. This lets `shortcuts.escape: "pause-or-exit"` pause during play without also triggering `createGameSession()` close behavior.

## Game Audio

`ui.game.audio` provides a small reusable audio controller for game sound effects and procedural feedback. Helper owns browser audio unlock, media pooling, mute/volume state, category volume state, procedural tone playback, and cleanup. The app owns when sounds play and any game-specific audio files.

Use `createGameAudio` for:

- short one-shot sound effects
- procedural UI/game tones
- score, move, rotate, select, error, win, lose, or drop feedback
- game-level mute and volume controls

Do not use Helper to ship large or copyrighted game audio packs. Register app-owned files through `sounds`, or use `tones` when a generated bleep is enough.

Helper also publishes a small generated starter sound pack for prototypes and lightweight local games. Kit guidance is local-first: public Helper releases are the source of truth, but Kit should mirror the approved Helper release onto each PBB node so runtime operation does not require internet access.

Default starter sound path:

```text
https://helpers.pbb.ph/current/assets/sounds/game/{name}.wav
```

Versioned starter sound path:

```text
https://helpers.pbb.ph/releases/{helper_version}/assets/sounds/game/{name}.wav
```

Starter sound names:

- `move`
- `select`
- `rotate`
- `drop`
- `score`
- `match`
- `error`
- `win`
- `lose`
- `pause`

Example:

```js
const audio = createGameAudio({
  masterVolume: 0.7,
  sounds: createStarterGameSounds(),
});

await audio.unlock();
audio.play("move");
audio.play("rotate");
audio.setMuted(true);
```

For a reproducible release-locked install:

```js
const audio = createGameAudio({
  sounds: createStarterGameSounds({
    version: "0.21.102",
    cacheBust: "v=0.21.102",
  }),
});
```

Important methods:

- `unlock()` resumes browser audio after a user gesture.
- `preload(ids?)` preloads registered audio-file sounds.
- `play(id, options?)` plays a registered sound, or a tone when only a matching tone id exists.
- `playTone(idOrOptions, options?)` plays a procedural tone.
- `setMuted(muted)`, `setMasterVolume(volume)`, and `setCategoryVolume(category, volume)` update output controls.
- `registerSound(id, options)` and `registerTone(id, options)` add entries after construction.
- `stopAll()`, `getState()`, and `destroy()` support cleanup and diagnostics.
- `createStarterGameSounds(options?)` returns the standard sound map for Helper starter sounds. It accepts `baseUrl`, `version`, `names`, `cacheBust`, `preload`, `pool`, `category`, `extension`, and `volumes`.

## Game Objects

`ui.game.objects` is the first optional layer above `ui.game.core`. It provides reusable object behavior for canvas games without taking over the game engine, art direction, or rules.

Use `createGameObject` for custom entities that need:

- canvas bounds
- z-order metadata
- default rectangular hit testing
- hover, press, and click pointer state
- update and render hooks

Use `createGameObjectLayer` to manage object ordering, update/render loops, and hit routing. Use `createPointerInputRouter(canvas, objectLayer)` to convert canvas pointer events into object-layer pointer events.

`createFlipCard` is the first higher-level reusable object. It is designed for memory, matching, quiz, or reveal-card games. Helper owns flip state, hover preview, click-to-reveal behavior, and animation progress. The client app owns:

- card art through `renderFront`, `renderBack`, or full `render`
- matching rules
- scoring
- deck generation
- difficulty and win/lose state

Example:

```js
const objectLayer = createGameObjectLayer();
const card = createFlipCard({
  id: "card-a",
  x: 80,
  y: 80,
  frontLabel: "A",
  onSelect(card) {
    revealAndCheckMatch(card);
  },
  renderFront(ctx, card) {
    drawCardArt(ctx, card);
  },
});

objectLayer.add(card);
createPointerInputRouter(canvas, objectLayer);
```

`createTetromino` is a specialized grid-piece object for Tetris-style games. It follows SRS-style rotation states and wall-kick tables for the standard tetromino set. Helper owns:

- `I`, `O`, `T`, `S`, `Z`, `J`, and `L` shape matrices
- board-cell calculation through `getCells()`
- movement helpers through `moveTo()` and `moveBy()`
- SRS rotation state and previews through `getRotationPreview()`
- SRS wall-kick candidate generation through `getWallKickTests()`
- default block rendering

The game still owns:

- board occupancy and collision validation
- gravity, lock delay, scoring, and level progression
- line clear rules
- next/hold queues
- game-over state

Example:

```js
const piece = createTetromino({ shape: "T", row: 0, column: 4 });
const accepted = piece.getWallKickTests(1).find((test) => boardCanPlace(test.cells));
if (accepted) {
  piece.rotate(1, accepted);
}
```

## Game Grid

`ui.game.grid` is a non-rendering module for tile-based canvas games. It provides shared topology, cell movement, and pathfinding primitives without becoming a Pac-Man, maze, RPG, or board-game engine.

Use `createGridMaze` for:

- character maps and object matrices
- normalized cell data
- wall/path/enterable queries
- named point extraction, such as spawns and targets
- collectible metadata preservation
- grid-to-pixel and pixel-to-grid conversion

Use `createGridMover` for:

- deterministic cell-aligned movement
- `direction` and `queuedDirection`
- cardinal movement
- cells-per-second speed
- optional `preTurnTolerance` in cells for touch-friendly early queued turns
- scripted adjacent-cell movement through `moveTowardCell(row, column, options?)`, which stops after the explicit target by default
- app-provided `canEnter(row, column, context?)`
- app-provided `resolveExit(next, context?)` for wrap tunnels or portals

Use `createGridPathfinder` for:

- generic shortest paths over passable cells
- cardinal BFS by default
- optional diagonal neighbors when explicitly enabled
- per-call `canEnter` or `getNeighbors` overrides

The game still owns:

- scoring, lives, level progression, and win/loss state
- enemy personalities, target selection, chase/scatter/frightened rules, and difficulty
- collectible meaning, rewards, respawns, and persistence
- canvas art, animation, and sound timing

Example:

```js
const maze = createGridMaze({
  cellSize: 24,
  map: [
    "#####",
    "#P..#",
    "#.#G#",
    "#o..#",
    "#####",
  ],
  tiles: {
    "#": { type: "wall", enterable: false },
    ".": { type: "path", collectible: "pellet" },
    "o": { type: "path", collectible: { type: "power", value: 5 } },
    "P": { type: "path", point: "playerSpawn" },
    "G": { type: "path", point: "goal" },
  },
});

const player = createGridMover({
  row: maze.points.playerSpawn.row,
  column: maze.points.playerSpawn.column,
  cellSize: maze.cellSize,
  speed: 6,
  preTurnTolerance: 0.18,
  canEnter: (row, column) => maze.canEnter(row, column),
});

const pathfinder = createGridPathfinder({
  rows: maze.rows,
  columns: maze.columns,
  canEnter: (row, column) => maze.canEnter(row, column),
});

const path = pathfinder.findPath(player.getState(), maze.points.goal);
```

## Virtual Joystick

`createVirtualJoystick` renders an analog movement control. It emits normalized joystick values:

```js
{ x, y, force, angle, active }
```

Use it for canvas games that need continuous movement rather than discrete grid movement. It supports radius, deadzone, snap-back, disabled state, and keyboard arrow fallback.

## Helper UI Relationship

Canvas games should render core gameplay on canvas layers. Helper components can still be used in the session overlay for pause menus, quit confirmation, instructions, completion summaries, settings, and other modal/dialog surfaces.
