# UI Game State Chrome Implementation Checklist

## Goal

Add a V1 Helper-owned `createGameStateChrome(session, options)` helper for canvas game sessions without expanding `createGameSession()` itself.

## Checklist

- [x] Add `ui.game.state.chrome` source module.
- [x] Export `createGameStateChrome` and `GAME_SESSION_STATES`.
- [x] Add game state chrome CSS.
- [x] Register the helper in `ui.loader` under the game bundle.
- [x] Add a focused state chrome demo page.
- [x] Add the demo to the shared demo navigation under Gaming.
- [x] Update `docs/ui-game-core-v1-spec.md`.
- [x] Add regression tests for state transitions and overlay actions.
- [x] Rebuild `dist/helpers.game.bundle.min.js` and `dist/helpers.game.bundle.min.css`.
- [x] Run bundle and focused regression tests.
- [x] Refresh PBB Games vendored Helper bundles.
- [x] Notify PBB Games with consumption guidance.

## V1 Scope

In scope:

- lifecycle states
- contextual close/pause control
- pause overlay
- result overlay
- milestone overlay
- progress metadata display
- action/state events
- opt-in shortcuts
- cleanup

Out of scope:

- asset loading
- game loop ownership
- score calculation
- level rules
- persistence
- default audio hooks
- direct controller method calls
