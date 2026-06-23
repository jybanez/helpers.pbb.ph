# UI Game State Chrome Counter-Proposal

## Summary

PBB Helper should support the PBB Games state chrome proposal, but the first shared contract should be a separate optional helper:

```js
createGameStateChrome(session, options)
```

This keeps `createGameSession()` focused on the canvas/session host while adding a reusable layer for lifecycle state, contextual controls, pause/result overlays, accessibility, and optional audio hooks.

## Current Assessment

PBB Games already has enough app-side repetition to justify a shared primitive:

- active game phase tracking
- close-vs-pause top-right control switching
- pause overlay rendering
- result overlay rendering in individual game modules
- controller action routing for pause, resume, restart, and exit
- future audio hooks tied to game state changes

The duplicated behavior is game infrastructure, not game rules. That makes it a good Helper candidate.

## Recommended Ownership Boundary

Helper should own:

- standard lifecycle state names
- contextual session chrome behavior
- pause and result overlay DOM
- action/event payloads
- focus behavior and accessibility semantics
- pointer/context-menu safety for game controls
- optional state-level audio hooks when an app provides `ui.game.audio`

Games/apps should own:

- asset loading
- launch orchestration
- game rules
- scoring
- win/loss decisions
- level/progression rules
- controller lifecycle wiring
- persistence and user preferences

Helper should not directly call controller methods unless the app explicitly wires that behavior.

## State Vocabulary

V1 should keep state names lifecycle-focused:

```js
export const GAME_SESSION_STATES = Object.freeze([
  "loading",
  "splash",
  "countdown",
  "ready",
  "playing",
  "paused",
  "won",
  "gameOver",
  "exiting",
]);
```

These states describe the session lifecycle, not the internal design of a specific game.

## Leveling And Progression

Future leveling should not expand the lifecycle state vocabulary. Levels, waves, rounds, missions, or stages are game-owned progression metadata.

Recommended shape:

```js
chrome.updateProgress({
  level: 3,
  round: 2,
  wave: 5,
  objective: "Clear 10 hazards",
  score: 420,
  lives: 2,
});
```

Helper may render this metadata in a HUD or overlay, but the app decides what it means and when it changes.

For milestone moments, use a generic overlay rather than new lifecycle states:

```js
chrome.showMilestone({
  type: "levelComplete",
  title: "Level 3 Complete",
  detail: "Next: Level 4",
  actions: ["continue", "restart", "exit"],
});
```

## Proposed V1 API

```js
const chrome = createGameStateChrome(session, {
  initialState: "loading",
  controls: {
    playing: "pause",
    default: "close",
  },
  overlays: {
    pause: {
      title: "Paused",
      actions: ["resume", "restart", "exit"],
    },
    result: {
      actions: ["restart", "exit"],
    },
  },
  shortcuts: {
    enabled: false,
    pause: ["p"],
    escape: "pause-or-exit",
  },
  audio,
  sounds: {
    paused: "pause",
    won: "win",
    gameOver: "lose",
    action: "select",
  },
  onAction(action, context) {},
  onStateChange(nextState, previousState, context) {},
});
```

Returned API:

```js
chrome.setState("playing");
chrome.getState();
chrome.updateProgress({ score: 100, level: 2 });
chrome.showPause();
chrome.hideOverlay();
chrome.showResult({ state: "gameOver", title: "Game Over", detail: "Score 100" });
chrome.showMilestone({ type: "levelComplete", title: "Level Complete" });
chrome.setControl("pause");
chrome.destroy();
```

## Action Model

Standard actions:

- `pause`
- `resume`
- `restart`
- `exit`
- `continue`

`playAgain` should be treated as display text for the `restart` action rather than a separate action. If an app needs to distinguish it, the event payload can include `source: "result-overlay"` or `label: "Play Again"`.

Suggested event payload:

```js
{
  action: "restart",
  state: "gameOver",
  previousState: "playing",
  source: "result-overlay",
  session,
  chrome,
}
```

## Keyboard Policy

Keyboard shortcuts should be opt-in for V1.

`createGameSession()` already supports Escape-based close behavior. State chrome changes the meaning of Escape in many games, where Escape often means pause during play and exit only outside play. That policy should be explicit through `shortcuts`, not forced by default.

## Recommended Games Integration

Games can keep its current controller contract:

```js
export async function mountGame(session, options) {
  return {
    start() {},
    pause() {},
    resume() {},
    restart() {},
    destroy() {},
  };
}
```

The app wires Helper chrome actions to the controller:

```js
const chrome = createGameStateChrome(session, {
  onAction(action) {
    if (action === "pause") {
      controller.pause?.();
      chrome.setState("paused");
    }
    if (action === "resume") {
      controller.resume?.();
      chrome.setState("playing");
    }
    if (action === "restart") {
      controller.restart?.();
      chrome.setState("playing");
    }
    if (action === "exit") {
      session.close("state-chrome-exit");
    }
  },
});
```

Game modules can still signal terminal states:

```js
options.onStateChange?.("gameOver", {
  title: "Game Over",
  detail: `Score ${score}`,
});
```

The app translates that to:

```js
chrome.showResult({
  state: "gameOver",
  title: "Game Over",
  detail: `Score ${score}`,
});
```

## Migration Plan

1. Add `ui.game.state.chrome` or export `createGameStateChrome` from `ui.game.core`.
2. Build a focused demo page for state chrome.
3. Add regression coverage for state transitions, close/pause control switching, overlay actions, focus, cleanup, and opt-in shortcuts.
4. Refactor PBB Games launcher pause overlay and top-right control switching to the new helper.
5. Refactor game-module result overlays after the app-level state chrome is stable.
6. Add optional audio hooks after mute/user preference behavior is settled.

## Recommendation

Proceed, but keep V1 narrow and composable. `createGameSession()` should remain the stable game host. `createGameStateChrome()` should be the optional lifecycle chrome layer that apps can adopt gradually.
