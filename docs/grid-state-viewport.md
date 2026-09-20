# Grid state messages within the visible viewport

Fix for Syndicatum3111/3114. Empty/loading/error messages previously centered
across the entire colspan/table width, clipping on narrow screens. The existing
state td/tr/colspan is retained, containing a wrapping role=status message whose
width tracks the smaller of table and visible scrollport. Sticky horizontal
position keeps text visible while headers scroll. Column widths, resizing and
populated action scrolling retain their existing behavior. ResizeObserver tracks
container changes and disconnects on render/destroy; window resize and scroll
provide synchronization too. Loading/error disable old virtualization so a
scroll cannot overwrite the state with stale data rows.

No new consumer option or dependency. Source JS and CSS must be adopted together:
js/ui/ui.grid.js and css/ui/ui.grid.css revision0.21.189. The updated loader points
to both revised assets. Source-mode consumers with older accepted bundles should
review an explicit ui.grid source/CSS registry override with bundle preference
disabled for that consumer, or equivalent direct module import using their
compatible ui.dom.js/ui.events.js dependencies. Do not add an app-local grid or
copy replacement state markup into Bimo. Verify dependencies and CSS cascade
against Bimo's exact pin before adopting. Full bundle consumers need paired main
JS/CSS0.21.189; this is not authorization to upgrade Bimo's whole bundle.

## Evidence

node tests/grid.states.regression.mjs PASS: source+bundled at320/390/1280,
initial empty; populated→empty after nonzero mobile scroll; scrolling while
empty; long unbroken text; loading/error; viewport resize; populated column drag;
action click reachability; headers/colspan/status semantics; destroy cleanup.
Existing tests/grid.regression.html also PASS in Edge using explicit completion
wait. Screenshots/results: output/playwright/grid-states/. No physical mobile or
assistive-technology run claimed. Geometry/DOM semantics checked, not AT behavior.

Initial test resize gestures hit the handle's overlapping edge and did not
resize. Harness adjusted to the visible inner edge; final six-case run passed.
No runtime workaround for that test coordinate issue. update() already rebuilds
the grid and resets scroll position; this fix does not change that behavior.
Additional check explicitly scrolls the empty-state header after update.

npm run build:ui-bundle, UI bundle contract and registry118/9 passed. Main JS/CSS
rebuilt; unrelated game/inspection content unchanged. Diff check passed.

Handoff: branch data/grid-state-viewport; commit/PR in Syndicatum delivery.
Pushed for review; no merge/publication or Bimo adoption claimed. Cross-team
message to Developer/Reviewer. Known risks: current Edge only, no actual AT or
Bimo pinned-runtime integration proof. Compatibility review required before
application adoption; this remains separate from invitation/modal work.


## Legacy CSS coexistence follow-up

Syndicatum3123 identified shared-document padding regression in0.21.188.
Revision0.21.189 restores14px padding on legacy bare-text state cells. Only new
cells carrying ui-grid-state-cell--wrapped receive zero padding; their inner
message retains14px. No :has dependency or Bimo-local override. Adopt the new
JS/CSS pair together. The regression asserts all four computed padding sides
for legacy bare-text cells, new cells and inner messages in the same document,
in both source and bundle modes at320/390/1280. Existing viewport/state and
populated resize/action tests remain required. Application integration remains
Developer-owned and unverified by these canonical tests.
