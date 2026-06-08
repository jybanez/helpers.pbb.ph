# PBB Display PWA Command Receiver Draft Plan

## Status

Draft only. This captures the preferred direction for network-connected external displays so the idea can be resumed later without treating it as an active implementation commitment.

## Problem

PBB operations may need dashboards, maps, incident boards, SITREP summaries, or system-status views shown on wall displays or TVs with minimal user gestures.

Screen mirroring is useful for ad hoc sharing, but it ties the external display to an operator's active browser tab, laptop power state, window focus, and private session. A better operations model is a passive display client that waits for commands from authorized operators.

## Recommended Model

Use a PWA installed on the display device as a read-only command receiver.

The display PWA:

- launches into an idle screen,
- connects to PBB Realtime,
- identifies itself as a registered display,
- waits for authorized display commands,
- renders the requested read-only view,
- reconnects automatically after network or power interruption,
- exposes no incident/team/user mutation controls.

Operators control the display from their own authenticated dashboard. The display itself should not require daily mouse, keyboard, or remote-control input.

## Typical Flow

1. Admin installs or opens the Display PWA on the TV device, mini PC, Android TV box, ChromeOS device, or kiosk browser.
2. First launch shows a short pairing code.
3. Admin enters the code from an authenticated admin/operator screen.
4. Server issues a revocable display token and stores a display registration such as `Ops Wall 1`.
5. On later launches, the PWA restores the token and connects directly to PBB Realtime.
6. Operator chooses a view in their dashboard, such as `Send incident map to Ops Wall 1`.
7. Server broadcasts a command to the target display channel.
8. Display PWA switches view and loads read-only data for that view.

## Example Command Envelope

```json
{
  "type": "display.show",
  "target": "ops-wall-1",
  "view": "incident-map",
  "params": {
    "incidentId": 216
  },
  "issuedBy": "operator:42",
  "issuedAt": "2026-06-08T03:30:00Z"
}
```

Other useful commands:

- `display.clear`
- `display.rotate.start`
- `display.rotate.stop`
- `display.refresh`
- `display.setFilters`
- `display.setPrivacyMode`
- `display.ping`

## Candidate Display Views

- Active incidents board
- Incident map
- Team assignment kanban
- SITREP summary
- Source hub/support map
- Media/session processing status
- System health and connectivity
- Rotating overview board
- Idle screen with clock, display name, and connection state

## Helper Opportunities

This should probably become a small set of reusable Helper primitives rather than a full app-owned implementation.

Potential Helper pieces:

- `ui.display.shell`
  Fullscreen/kiosk layout with clock, display name, connection indicator, stale-data state, and safe-area handling.

- `ui.display.idle`
  Pairing/waiting screen with display code, QR slot, and connection status.

- `ui.display.rotator`
  Timed view rotation controller with pause/resume, current-view state, and transition hooks.

- `ui.display.status`
  Compact online/offline/stale/command-received status strip usable by display and admin screens.

The actual domain views should remain app-owned. Hotline, Support, HQ, Maestro, or Workspace can render their own maps, boards, and summaries inside the shared shell.

## Realtime / Server Responsibilities

- Register displays with a stable display id and human-friendly name.
- Issue revocable read-only display tokens.
- Track display heartbeat, current view, app version, last command, and connection state.
- Authorize which users can command which displays.
- Broadcast commands only to the target display channel.
- Keep display tokens scoped to read-only APIs and display channels.
- Expire or rotate pairing codes.
- Allow admins to revoke or rename displays.

## Privacy / Safety

Display mode should support privacy filters because wall screens may be visible to people who should not see full operator details.

Potential filters:

- hide caller names,
- hide phone numbers,
- blur or approximate exact coordinates,
- hide chat text,
- hide sensitive incident fields,
- hide media until explicitly opened,
- show category/status/counts without personally identifying data.

## Device Notes

Smart TV browsers and PWA support vary. For reliability, prefer a display device that can run a modern browser/PWA in kiosk mode:

- mini PC,
- Android TV box,
- ChromeOS device,
- Windows stick PC,
- Raspberry Pi-style device.

The TV itself can still be the screen. The browser runtime should be something we can trust for reconnects, websockets, storage, and fullscreen behavior.

## Open Questions

- Should display registration live in Workspace, Realtime, or each app?
- Should one Display PWA host views from multiple PBB apps, or should each app provide its own display PWA?
- What is the minimum acceptable auth model for phase 1: fixed token, pairing code, or admin-managed device record?
- Should display commands use PBB Realtime rooms, app-local websocket channels, or both?
- Which privacy filter set should be the default for Hotline and Support?
- Should displays remember the last commanded view after restart, or always return to idle?

## Possible Implementation Phases

### Phase 1: Concept Validation

- Build a simple display shell route in one app.
- Connect it to websocket/realtime.
- Add one command: show idle vs show active incident map.
- Manually configure a display token.
- Verify reconnect and stale-state handling.

### Phase 2: Pairing and Admin Control

- Add pairing code flow.
- Add display registry table/API.
- Add admin list of online/offline displays.
- Add operator `Send to display` actions.
- Add command audit trail.

### Phase 3: Helper Primitives

- Extract reusable shell, idle, rotator, and status pieces into Helper.
- Add demos and regression tests.
- Document the display command receiver contract.

### Phase 4: Cross-App Adoption

- Let Hotline, Support, HQ, Maestro, and Workspace provide read-only display views.
- Standardize display privacy modes.
- Standardize realtime command envelopes.
- Add deployment guidance for kiosk devices.

