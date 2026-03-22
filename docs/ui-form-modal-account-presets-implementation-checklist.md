# UI Form Modal Account Presets Implementation Checklist

## Contract

- [x] Review HQ proposal and confirm `extraRows` is the correct account extension point
- [x] Keep both presets as wrappers over `createFormModal(...)`
- [x] Preserve app-owned submit behavior
- [x] Keep `extraActions` / `extraActionsPlacement` compatible with the recently landed footer-action contract

## Runtime

- [ ] Add `createAccountFormModal(options)` to `js/ui/ui.form.modal.presets.js`
- [ ] Add `createChangePasswordFormModal(options)` to `js/ui/ui.form.modal.presets.js`
- [ ] Add field-map support for both presets
- [ ] Add additive `extraRows` support to the account preset
- [ ] Reuse `input: "password"` rows so `ui.password` behavior comes through automatically

## Demos

- [ ] Add dedicated account preset demo page
- [ ] Add dedicated change-password preset demo page
- [ ] Show HQ-style account footer flow:
  - `Change Password`
  - `Cancel`
  - `Save`
- [ ] Show an `extraRows` example with a warning row and one extra field

## Docs

- [x] Add helper-side response memo
- [x] Add V1 spec
- [ ] Update `README.md`
- [ ] Update `CHANGELOG.md`
- [ ] Update `docs/pbb-refactor-playbook.md`

## Regression

- [ ] Add browser regression for account preset baseline rows
- [ ] Add browser regression for `extraRows`
- [ ] Add browser regression for change-password preset rows
- [ ] Add browser regression for shared password toggle behavior in change-password preset

## Cross-Project Communication

- [ ] Add helper-side review note to `C:\wamp64\www\pbb\chat_log.md`
- [ ] State the helper-side priority decision relative to `ui.icons`
