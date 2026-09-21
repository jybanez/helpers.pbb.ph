# Structured dialog lists (0.21.199 candidate)

Canonical ui.dialog.alert, confirm and prompt accept optional `items: string[]`.
Each nonblank string becomes one semantic list item, rendered as text rather than
HTML. Unsupported entries are ignored. Existing message/description calls retain
their behavior. Lists preserve caller order and text; domain labels, deduplication
and field ordering belong to the application. Plain serializable items are also
preserved through the workspace bridge. Host and child must use the compatible
release; do not mix an older host with a new list caller.

```js
await alert('Please address the following issues before continuing:', {
  title: 'Check your entries', variant: 'error', draggable: true,
  renderTarget: 'local', workspaceBridge: false,
  items: ['Voucher title — required', 'Expiry — choose a date after Starts']
});
```

Use one concise item per invalid field in form order, with user-facing labels.
Deduplicate by field before calling; retain detailed associated errors beside the
fields. Do not pass internal keys or raw HTML. For schema forms, await this alert
in onInvalid so the canonical focus guard restores the first invalid field after
dismissal. Validation remains before busy/submission requests; values, active-field
rules and uncertain-command protection remain application-owned and unchanged.
For custom validation paths disable automatic busy until validation succeeds.

Native ul/li semantics provide list accessibility; long entries wrap within the
modal and the footer remains in the canonical layout. Existing speech opt-in also
includes list text; explicit speakText still overrides it. No custom dialog needed.

Regression: tests/dialog.list.regression.mjs exercises source/bundle ×390/1440
×local/cross-origin host, literal markup, invalid/empty items, legacy description,
local focus return, and completion through the host. Captures/results are under
output/playwright/dialog-list. Existing async dialog regression remains applicable.
Matched candidate hashes: docs/dialog-list-assets.json. Publication requires review;
consumer integration and assistive-technology acceptance remain separate.
