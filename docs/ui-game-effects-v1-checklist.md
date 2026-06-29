# UI Game Effects V1 Checklist

Date: 2026-06-29

This checklist tracks the first Helper-owned non-rendering game feedback primitive requested by PBB Games.

## Scope

Add `ui.game.effects` with `createGameEffectTimeline(...)` to the optional Helper game bundle.

Helper owns:

- effect lifetime
- normalized progress and eased progress
- delay handling
- pause/resume behavior
- cleanup and destroy behavior
- reduced-motion policy
- iteration over effect snapshots

Games owns:

- effect meaning
- payload shape
- spawn timing
- canvas, DOM, or WebGL rendering
- scoring and gameplay impact
- game-specific particles, sprites, trails, and visual style

Deferred from V1:

- floating text layer
- HUD meter group
- standalone tween timeline
- sprite animator
- particle system
- match-3, shooter, Tetris, or Pac-Man rules

## V1 Contract

```js
import { createGameEffectTimeline, GAME_EFFECT_EASINGS } from "./js/ui/ui.game.effects.js";

const effects = createGameEffectTimeline({
  defaultDuration: 300,
  defaultEasing: "outCubic",
  reducedMotion: "respect",
  autoRemove: true,
});

effects.spawn({
  id: "line-clear-18",
  type: "lineClear",
  duration: 360,
  delay: 0,
  easing: "outCubic",
  payload: { row: 18, score: 100 },
});

effects.update(deltaMs);

effects.forEach((effect) => {
  drawEffect(effect.payload, effect.progress, effect.eased);
});
```

## Snapshot Shape

Each snapshot includes:

- `id`
- `type`
- `payload`
- `duration`
- `delay`
- `elapsed`
- `age`
- `remaining`
- `progress`
- `eased`
- `easing`
- `active`
- `done`

## API

- `spawn(effect)`
- `update(deltaMs)`
- `forEach(callback, options?)`
- `getEffects(options?)`
- `getEffect(id)`
- `remove(id)`
- `clear()`
- `pause()`
- `resume()`
- `setPaused(paused)`
- `isPaused()`
- `getState()`
- `destroy()`

## Reduced Motion

`reducedMotion` accepts:

- `respect`: follow browser `prefers-reduced-motion`
- `ignore`: never compress effects
- `force`: always compress effects

When reduced motion is active, delays are removed and duration is compressed to `reducedMotionDuration`.

## Implementation

- [x] Add `js/ui/ui.game.effects.js`.
- [x] Register `ui.game.effects` in `js/ui/ui.loader.js`.
- [x] Include `ui.game.effects` in `DEFAULT_COMPONENT_GROUPS.games`.
- [x] Bump `UI_GAME_REV`.
- [x] Bump `UI_GAME_BUNDLE_REV`.
- [x] Add focused demo page.
- [x] Add focused regression test.
- [x] Extend bundle contract test.
- [x] Update README and changelog.
- [x] Rebuild generated bundles.
- [x] Verify game effects regression.
- [x] Verify bundle and registry contracts.
- [ ] Notify PBB Games with PR link and consumption guidance.
