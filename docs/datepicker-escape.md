# Datepicker Escape dismissal (0.21.196)

An open picker now consumes Escape on its owning window's capture phase, before
the parent modal's document-capture listener. It closes only the picker and
restores focus to the current connected trigger, including after a calendar day
selection has replaced the original trigger DOM. Values remain unchanged.

Once the picker is closed, subsequent Escape reaches the existing modal handler
and respects its onBeforeClose/busy/closeOnEscape rules. The picker listener is
removed on rerender/close/destroy. A background picker does not consume Escape
when another visible canonical modal is later in the document's modal order.
No application propagation patch or modal-close-policy change is required.

Adopt the reviewed matched loader/mainJS/mainCSS through the shared preferBundles
path. Form import and datepicker cache URLs advance; main CSS is unchanged.
This branch starts from PR95 main and is separately reviewable from PR96's
pending validation work. If PR96 lands first, reconcile and rebuild before review
of a combined publication; do not overwrite newer validation artifacts.

Tests: tests/datepicker.escape.regression.mjs covers source/bundle,390/1440,
Starts/Expires after day selection, first Escape retaining form/values and focus,
a rejecting onBeforeClose guard and subsequent ordinary modal dismissal. Existing
precision behavior is not modified. Results: output/datepicker-escape-results.json.
Application-focused verification remains required; no device/AT claim.
