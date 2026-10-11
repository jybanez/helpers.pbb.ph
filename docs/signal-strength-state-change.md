# Signal strength state observations

`createSignalStrength(host, { onStateChange({ previous, current }) { ... } })`
observes completed updates without measuring connectivity. Applications own
transport observations, retry, recovery and cache policy.

Initial rendering is silent. `update` compares normalized supported fields:
`label`, `level`, `tone`, `text`, `title`, `ariaLabel`, `ariaLive`, `showText`,
`size`, `className`. One callback follows each meaningful update, after DOM sync
or shell recreation. Normalized equivalents (such as level 99 and 4), unknown
metadata and callback-only replacements produce no event. Non-function callbacks
normalize to null. A callback supplied with a state-changing update observes
that same transition; removal disables it.

`previous` and `current` are frozen independent snapshots containing these ten
primitive fields, without callbacks or arbitrary metadata. Existing `getState`
continues returning a shallow normalized-options copy, including the callback.

Reentrant updates commit immediately but enqueue notifications for FIFO delivery
after the active callback returns. Observers do not nest recursively. Snapshots
describe each transition; `getState()` can already represent a later queued
update. Equal-state feedback is silent; consumers must avoid deliberate cycles
between different states. No timers or connectivity listeners are introduced.

Callbacks are synchronous. If one throws, state/DOM remain committed, pending
notifications drain, and the first thrown value propagates to the outer `update`
caller. Subsequent updates still work. Returned promises are not awaited; async
work must handle its own rejection. `destroy` clears queued notifications and
DOM, emits nothing, and makes later updates inert; `getState` retains the final
options. Destruction during a callback cancels remaining queued deliveries.

Signal JS and main UI bundle revision: `0.21.285`. Signal CSS unchanged.
`signal-strength-runtime.json` records LF-normalized UTF-8 SHA256 for the loader,
signal component JS/CSS and main bundle JS/CSS. The interactive demo displays
previous/current snapshots when cycling state or toggling text.
