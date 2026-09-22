# Modal identifiers across module copies

Modal title IDs and portal-owner identifiers are opaque. Each modal now receives a 128-bit random identifier using the browser Crypto getRandomValues API, including on HTTP origins. Different module query versions and bundled/modular copies no longer restart a shared numeric namespace. IDs are allocated before mounting and stay stable for the lifetime of that modal. Previously cached numeric IDs cannot collide with the new 32-hex-digit suffix.

Candidate cache revision: 0.21.201. Updated form/dialog imports use the revised modal; loader and delegated dialog imports invalidate the affected entry points. Main JS is rebuilt; CSS is unchanged. Existing cached code is not retroactively repaired: adopt matched updated assets.

Verification: tests/modal.ids.regression.mjs constructs a form, an action modal, and a separately imported action modal before mounting; checks unique accessible names and title references for modular and bundled loaders, then destroys previews and confirms the form and its entered value remain. This does not certify other cross-copy state such as scroll locking, or application persistence.
