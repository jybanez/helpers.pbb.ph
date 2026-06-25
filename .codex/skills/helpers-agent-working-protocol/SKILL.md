---
name: helpers-agent-working-protocol
description: Use when working in `C:\wamp64\www\hotline-helpers` on tasks involving branch creation or naming, commits, pushes, pull requests, merged branch cleanup, bundle or cache revision decisions, cross-team chat handoffs, or final agent handoff reporting.
---

# Helpers Agent Working Protocol

This skill makes the Helper agent protocol discoverable to Codex agents working in `C:\wamp64\www\hotline-helpers`.

Before doing any of the following, read `docs/agent-working-protocol.md` and follow it as the source of truth:

- creating, switching, renaming, pushing, or deleting task branches
- opening, updating, reviewing, merging, or cleaning up pull requests
- deciding whether a bundle rebuild or cache revision bump is required
- coordinating Helper changes with Chat, Games, Kit, Hotline, Realtime, or other PBB teams
- writing the final handoff for substantial Helper work

Do not duplicate the full protocol here. Update this skill only when the routing rules change; update `docs/agent-working-protocol.md` when the protocol itself changes.

## Key Defaults

- Start new Helper tasks from the latest `main`.
- Use branch names shaped as `<area>/<task-name>`, such as `icons/settings-gear` or `chat/thread-reply-preview`.
- Do not use `codex/` as the default Helper branch prefix unless the user explicitly asks for it.
- Keep one task per branch and avoid unrelated cleanup.
- For bundled source or loader changes, also use the `helpers-ui-bundle-maintenance` skill.
- End substantial work with the handoff block defined in `docs/agent-working-protocol.md`.
