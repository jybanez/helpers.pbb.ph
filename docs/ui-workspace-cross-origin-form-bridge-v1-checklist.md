# UI Workspace Cross-Origin Form Bridge V1 Checklist

## Docs

- [x] Draft proposal in `docs/ui-workspace-cross-origin-form-bridge-proposal.md`
- [x] Draft V1 spec in `docs/ui-workspace-cross-origin-form-bridge-v1-spec.md`
- [x] Draft implementation checklist in `docs/ui-workspace-cross-origin-form-bridge-v1-checklist.md`
- [x] Add concrete sample request/response messages for:
  - login
  - re-auth
  - schema-style admin form modal
- [x] Update `README.md` if the contract moves from proposal into implementation
- [x] Update `CHANGELOG.md` if runtime work ships

## Contract Alignment

- [x] Confirm protocol-style method naming with Workspace team:
  - `modal.form.open`
- [x] Confirm `namespace` versioning for the new cross-origin contract
- [x] Confirm explicit payload discriminator:
  - `intent`
- [x] Confirm supported V1 row types for JSON-safe transport
- [x] Confirm allowed row-item properties per supported row type
- [x] Confirm explicit `ui.select.items` schema
- [x] Confirm V1 result shape:
  - `{ reason, values }`
  - where `reason` is `submit | cancel | dismiss`
- [x] Confirm V1 error shape:
  - `{ code, message }`

## Runtime

- [x] Extend `ui.workspace.bridge` with a new child-side helper for `modal.form.open`
- [x] Extend the parent Workspace host handling for `modal.form.open`
- [x] Reuse helper-owned form modal rendering on the parent side
- [x] Keep child-side business logic out of the parent host
- [x] Fail closed on malformed or unsupported payloads
- [x] Keep the first shipped runtime limited to:
  - `intent: "login"`
  - `intent: "reauth"`

## Demo Surface

- [x] Add a bridge demo showing cross-origin-style request messages for:
  - login
  - re-auth
  - schema-style admin form
- [x] Show the returned `{ reason, values }` result shape clearly

## Regression

- [x] Add browser coverage for accepted `modal.form.open` requests
- [x] Verify successful result round-trip for a serializable form payload
- [x] Verify cancel/close result round-trip
- [x] Verify malformed payload rejection
- [x] Verify unsupported row-type rejection

## Cross-Project Follow-Through

- [x] Review with Workspace team before runtime implementation
- [x] Announce the final agreed contract in `C:\wamp64\www\pbb\chat_log.md` once aligned
