# Helper Agent Working Protocol

Date: 2026-06-25

This protocol keeps Helper work readable when multiple agents or contributors are changing shared UI, game, bundle, and documentation surfaces at the same time.

## Start Point

Every new task starts from the latest `main`.

```powershell
git checkout main
git pull --ff-only origin main
```

Do not start new work from an old feature branch unless the task is explicitly to continue that branch.

## Branch Naming

Use meaningful branch names with this shape:

```text
<area>/<task-name>
```

The area should describe the Helper surface being changed. The task name should describe the behavior, contract, or document being changed.

Use lowercase kebab-case after the slash.

Recommended Helper areas:

```text
audio/
bundle/
chat/
data/
demo/
docs/
game/
icons/
incident/
map/
media/
modal/
navbar/
realtime/
tests/
workspace/
```

Good examples:

```text
icons/settings-gear
navbar/borderless-item-css
navbar/item-button-classes
chat/thread-menu-spacing
chat/thread-reply-preview
game/library-state-chrome
game/grid-primitives
audio/action-icons
bundle/game-split
docs/agent-working-protocol
tests/navbar-regression
```

Avoid vague names:

```text
fixes
update
new-work
test
codex/random-cleanup
```

Do not use an agent name as the primary branch category. Git already records authorship, and PR descriptions can mention agent-created work. Branch names should help people scan by product area.

## Existing Branch Renames

Existing branches can be renamed, but do it carefully.

For a local branch that has not been pushed:

```powershell
git branch -m old-name new-area/new-task
```

For a pushed branch:

```powershell
git branch -m old-name new-area/new-task
git push -u origin new-area/new-task
git push origin --delete old-name
```

If the branch has an open PR, prefer GitHub's branch rename action when available because it preserves the PR relationship and redirects links. After renaming on GitHub, local checkouts need to update their tracking branch:

```powershell
git fetch origin --prune
git branch -m old-name new-area/new-task
git branch --unset-upstream
git branch -u origin/new-area/new-task
```

Do not rename a branch while another agent is actively pushing to it. Coordinate first in the PR or shared chat.

After a PR is merged, delete the branch rather than renaming it. Historical merged branches do not need cleanup unless they are still cluttering the active branch list.

## Task Isolation

One branch should solve one task.

Do not mix unrelated work into the same branch:

- no unrelated cleanup
- no unrelated formatting
- no unrelated demos unless they support the changed helper
- no bundle revision changes unless the task changes bundled source or loader behavior

If a second issue is discovered, document it and create a separate branch or follow-up task.

## Bundle Discipline

The source tree is the source of truth. Files under `dist/` are generated artifacts.

Run `npm run build:ui-bundle` when changing:

- bundled `ui.*` or `incident.*` JavaScript
- bundled `ui.*` or `incident.*` CSS
- `js/ui/ui.loader.js`
- bundle generation scripts
- cache-bust revisions for bundled modules

Commit generated `dist/` files only when they have real content changes. If a rebuild touches unrelated game or CSS bundle files only through line-ending churn, restore those files before committing.

Game helpers are additive. Keep `ui.game.*` changes in the game bundle path and avoid pulling game helper code into the main UI bundle.

## Version And Cache Revisions

Do not bump the package or semantic release version for every fix unless explicitly requested.

Bump cache revisions when the browser must fetch fresh assets:

- `UI_ICONS_REV` when icon catalog/imported icon visuals change
- `UI_BUNDLE_REV` when main UI bundle JS/CSS changes
- `UI_GAME_BUNDLE_REV` when game bundle JS/CSS changes
- feature-specific revision constants when a module already has one

Keep revision bumps scoped to the assets affected by the change.

## Verification

Run focused tests for the helper being changed, plus bundle contracts when bundled source changed.

Minimum checks for bundled UI changes:

```powershell
npm run build:ui-bundle
node tests/ui.bundle.contract.mjs
node tests/registry.contract.mjs
```

Then add the focused regression, for example:

```powershell
node tests/icons.regression.mjs
node tests/navbar.regression.mjs
node tests/chat.regression.mjs
node tests/game.core.regression.mjs
```

If a known flaky test fails and a rerun passes, report both facts in the PR notes.

## Cross-Team Boundaries

Agents may inspect other PBB repositories to understand behavior, but should not edit code owned by another team unless the user explicitly scopes that work.

If Chat, Games, Kit, Hotline, Realtime, or another team needs a change, post a concise request in the shared chat with:

- observed behavior
- expected behavior
- affected helper or file, if known
- PR or branch link, if available
- what Helper needs from that team

Keep chat messages brief. If the message is long, create a document in the relevant repo and post a short summary with the path.

## Stale Branches And PRs

Do not merge old PRs directly when they are far behind `main`.

For stale PRs:

- inspect the intent
- check whether the feature is still wanted
- rebase or recreate from current `main`
- close if superseded
- delete merged branches after merge

## Agent Handoff

Each agent should end substantial work with this handoff block:

```text
Branch:
Commit:
Pushed:
PR:
Tests run:
Bundle rebuilt: yes/no
Dist artifacts changed:
Cross-team messages: yes/no
Known risks:
```

