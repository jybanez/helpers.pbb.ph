# UI Game Experience Elements Counter-Proposal

Date: 2026-06-26

This is Helper's response to the PBB Games proposal at:

```text
C:\wamp64\www\pbb\games\docs\helper-reusable-game-experience-elements-proposal.md
```

Games' direction is valid: richer feedback, milestone moments, and small effects will make the Games Corner feel more polished. Helper should support that direction, but the first shared contract should stay narrow and build on the game helpers that already exist.

## Recommendation

Do not create four independent primitives immediately.

Use this staged direction instead:

1. Enhance `ui.game.state.chrome` milestone behavior.
2. Enhance `ui.game.state.chrome` progress rendering.
3. Add a separate non-rendering `ui.game.effects` helper after at least Tetris, Breakout, Memory, and Snake prove the common timing needs.
4. Expose easing/tween utilities only as support API for the effects helper or state-chrome animation behavior.

This avoids splitting game chrome into competing helper surfaces while still giving Games a clear path for more satisfying feedback.

## Boundary

Helper should own reusable presentation and timing infrastructure:

- milestone overlay chrome
- progress metadata display
- accessibility and announcements
- reduced-motion behavior
- reusable effect lifetime/progress plumbing
- named easing once there is a concrete consumer

Games should continue to own game meaning and rules:

- score calculation
- level, stage, wave, and combo rules
- when a milestone is earned
- canvas drawing style
- particle art and visual theme
- reward economy and persistence
- game-specific animation semantics

## V1: Improve State Chrome Milestones

Helper already exposes `createGameStateChrome(session, options)` and `chrome.showMilestone(options?)`. That should be the first contract to improve.

Proposed additions:

```js
chrome.showMilestone({
  type: "levelUp",
  title: "Level Up",
  detail: "Level 2",
  tone: "success",
  position: "center",
  duration: 1200,
  autoDismiss: true,
  onDismiss(context) {},
});
```

Helper owns:

- rendering inside the game session overlay
- focus-safe non-blocking behavior
- `aria-live` announcement
- auto-dismiss timing
- reduced-motion handling
- consistent tone and position styling
- cleanup when state chrome is destroyed

Games owns:

- milestone type meaning
- title/detail text
- when the milestone appears
- gameplay effects caused by the milestone

Why this should live in state chrome first:

- milestones are already part of state chrome V1
- progress and lifecycle context are nearby
- consumers avoid wiring a second overlay controller
- the existing pause/result/milestone overlay model remains coherent

## V1.1: Improve Progress Display

`chrome.updateProgress(data)` already exists and should remain the default path for score, level, lives, objective, and similar metadata.

The next improvement should be formatting, not a separate `createGameProgressChrome(...)` primitive.

Possible contract:

```js
chrome.updateProgress({
  score: 420,
  level: 2,
  objective: "Clear complete lines",
  progressCurrent: 7,
  progressTarget: 10,
  progressLabel: "Lines 7/10",
  fields: [
    { id: "score", label: "Score", value: 420 },
    { id: "level", label: "Level", value: 2 },
  ],
});
```

Helper owns:

- compact responsive display
- field ordering and normalization
- optional progress bar or progress pill rendering
- accessible labels
- consistent visual treatment with game session chrome

Games owns:

- progress calculation
- objective wording
- which fields matter per game

Defer a standalone `createGameProgressChrome(...)` until there are non-state-chrome consumers that need progress display outside a game session.

## V2: Add A Non-Rendering Game Effects Helper

Games' effect timeline idea is reusable, but it should be separate from state chrome and should not force a sprite or particle rendering model.

Recommended future module:

```text
ui.game.effects
```

Possible exports:

```js
const effects = createGameEffectTimeline({
  reducedMotion: "respect",
  defaultDuration: 300,
  easing: "outCubic",
});

effects.spawn({
  id: "line-clear-12",
  type: "lineClear",
  duration: 360,
  payload: { row: 12 },
});

effects.update(delta);

effects.forEach((effect) => {
  drawEffect(ctx, effect.progress, effect.eased, effect.payload);
});
```

Helper owns:

- effect lifetime
- normalized progress
- eased progress
- pause/resume hooks if needed
- cleanup
- reduced-motion shortening or suppression rules

Games owns:

- canvas rendering
- effect style
- effect meaning
- spawn positions
- sound timing

This should be proven by at least:

- Tetris line clear or lock pulse
- Breakout block break or paddle pulse
- Memory match glow or miss shake
- Snake food/eat pulse

## Easing And Tween Utilities

Named easing is useful, but should not become a broad animation framework in the first pass.

Recommended first exposure:

- internal support for milestone transitions and effect timelines
- exported `easings` map only when multiple helper modules or games consume it
- optional `createTween(...)` only after a real game needs standalone tween lifecycle

Possible future shape:

```js
const value = easings.outCubic(progress);
```

Avoid adding generic tween orchestration before `createGameEffectTimeline(...)` proves the common lifecycle requirements.

## Deferred Items

Defer these until there is stronger evidence:

- standalone `createGameMilestoneOverlay(...)`
- standalone `createGameProgressChrome(...)`
- sprite-specific `createSpriteAnimator(...)`
- particle system helpers
- reward or badge economy helpers
- game-specific progress schemas

These may still become Helper-owned later, but accepting them too early would freeze contracts before enough games have proved the shape.

## Suggested Implementation Order

1. Extend `chrome.showMilestone(...)` with duration, tone, position, auto-dismiss, reduced-motion, and accessibility behavior.
2. Add regression and demo coverage to `demo.game.state.chrome.html` and `tests/game.state.chrome.regression.*`.
3. Extend `chrome.updateProgress(...)` with ordered fields and optional current/target progress display.
4. Let Games implement Tetris, Breakout, Memory, and Snake effect proof code app-local using a Helper-shaped effect timeline data model.
5. Promote the common effect lifecycle into `ui.game.effects` after those proof cases converge.

## Guidance For Games

Games can proceed with app-local v2 polish now if needed.

Recommended temporary shapes:

- call `chrome.showMilestone(...)` for milestone moments where the current API is sufficient
- keep richer milestone CSS/app behavior local until Helper V1 milestone enhancements land
- keep effect arrays as `{ id, type, age, duration, payload }`
- keep effect rendering app-owned
- document any repeated effect timing code as a candidate for `ui.game.effects`

This gives Games momentum without creating a second game chrome system or pushing game-specific visual meaning into Helper.

