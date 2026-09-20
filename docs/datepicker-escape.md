# Datepicker Escape dismissal (0.21.197)

An open picker now consumes Escape on its owning window's capture phase, before
the parent modal's document-capture listener. It closes only the picker and
restores focus to the current connected trigger, including after a calendar day
selection has replaced the original trigger DOM. Values remain unchanged.

Once the picker is closed, subsequent Escape reaches the existing modal handler
and respects its onBeforeClose/busy/closeOnEscape rules. The picker listener is
removed on rerender/close/destroy. A background picker does not consume Escape
when another visible canonical modal is later in the document's modal order.
No application propagation patch or modal-close-policy change is required.

The foreground canonical modal alone handles keyboard dismissal and focus trapping.
A picker beneath a foreground alert ignores its outside clicks, so dismissing that
alert preserves the picker and values. Alert allowEscClose false/true policies are
respected; Escape after alert closure dismisses the picker and restores its trigger.

This combined PR96 candidate includes the corrected validation changes and PR97.
Adopt only after exact-head review and publication, using the matched 0.21.197
loader/mainJS/mainCSS through preferBundles. Candidate hashes are recorded in
docs/form-overlay-assets.json; they are not a public deployment claim.

Tests: tests/datepicker.escape.regression.mjs covers source/bundle,390/1440,
Starts/Expires after day selection, first Escape retaining form/values and focus,
both foreground alert Escape policies and OK dismissal, a rejecting onBeforeClose guard and subsequent ordinary modal dismissal. Existing
precision behavior is not modified. Results: output/datepicker-escape-results.json.
Application-focused verification remains required; no device/AT claim.
