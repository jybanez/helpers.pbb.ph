# UI Workspace Cross-Origin Form Bridge V1 Spec

## Summary

This V1 defines a cross-origin Workspace bridge contract for helper-owned form-modal rendering through serializable `postMessage` payloads.

Primary method:

- `modal.form.open`

## Goals

- support cross-origin Workspace-hosted form modals without DOM access to the parent document
- keep the contract understandable across teams
- keep payloads close to the existing helper form-modal shape
- keep business logic in the child app
- let child apps pass explicit ownership context for parent-owned bridged modal shells
- preserve visible ownership context even when child apps rely on shared helper presets without manually setting `ownerTitle`

## Method

### Request

- `method: "modal.form.open"`

### Response

- same `id`
- typed `result`
- typed `error`

## Request Envelope

```json
{
  "namespace": "pbb.workspace.ui.bridge.v2",
  "phase": "request",
  "id": "msg_form_001",
  "method": "modal.form.open",
  "payload": {}
}
```

## Response Envelope

```json
{
  "namespace": "pbb.workspace.ui.bridge.v2",
  "phase": "response",
  "id": "msg_form_001",
  "ok": true,
  "result": {},
  "error": null
}
```

## Timeout Behavior

- `timeoutMs` applies to bridge availability probing and initial request transport only.
- Once the parent Workspace host accepts an interactive `modal.form.open` request and renders the helper-owned login or re-auth modal, the request must remain pending until the user responds.
- The child app must not start a second local helper modal solely because the user took longer than the transport timeout to interact with the parent-owned modal.

## Payload Shape

```ts
{
  intent: "login" | "reauth" | "account" | "change-password";
  title?: string;
  ownerTitle?: string;
  size?: "sm" | "md" | "lg";
  submitLabel?: string;
  cancelLabel?: string;
  busyMessage?: string;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  mode?: string;
  context?: {
    kind?: string;
    badge?: string;
    summary?: string;
  } | null;
  initialValues?: Record<string, unknown>;
  rows: Array<Array<Record<string, unknown>>>;
}
```

`ownerTitle` is optional in the transport payload. For helper-owned preset flows, the child helper may default it from the child document title when the app does not pass an explicit value.

## Row Contract

The bridge row contract should stay aligned with the shared helper `createFormModal(...)` row model where the types are JSON-safe.

Supported V1 row types:

- `input`
- `textarea`
- `select`
- `checkbox`
- `ui.select`
- `hidden`
- `text`
- `alert`
- `divider`
- `display`

Each row item must be plain JSON-safe data.

### Allowed row-item properties by type

#### `input`

- `type`
- `input`
- `name`
- `label`
- `value`
- `placeholder`
- `autocomplete`
- `required`
- `readonly`
- `disabled`
- `help`
- `span`
- `pattern`
- `min`
- `max`
- `step`
- `inputmode`

#### `textarea`

- `type`
- `name`
- `label`
- `value`
- `placeholder`
- `required`
- `readonly`
- `disabled`
- `help`
- `span`

#### `select`

- `type`
- `name`
- `label`
- `value`
- `required`
- `disabled`
- `help`
- `span`
- `options`

#### `checkbox`

- `type`
- `name`
- `label`
- `value`
- `required`
- `disabled`
- `help`
- `span`

#### `ui.select`

- `type`
- `name`
- `label`
- `value`
- `required`
- `disabled`
- `help`
- `span`
- `items`
- `placeholder`
- `searchable`
- `multiple`
- `closeOnSelect`
- `selectOnTab`
- `clearable`
- `emptyText`

##### `ui.select.items` schema

```ts
Array<{
  label: string;
  value: string;
}>
```

#### `hidden`

- `type`
- `name`
- `value`

#### `text`

- `type`
- `content`
- `className`
- `span`

#### `alert`

- `type`
- `content`
- `tone`
- `className`
- `span`

#### `divider`

- `type`
- `className`
- `span`

#### `display`

- `type`
- `name`
- `label`
- `value`
- `help`
- `emptyText`
- `span`

## Optional Error Fields

The request payload may also include:

```ts
{
  fieldErrors?: Record<string, string>;
  formError?: string;
}
```

These fields support the retry/reopen model for the currently shipped bridged preset intents.

## Result Shape

```ts
{
  reason: "submit" | "cancel" | "dismiss";
  values: Record<string, unknown> | null;
}
```

### Submit example

```json
{
  "reason": "submit",
  "values": {
    "email": "user@pbb.ph",
    "password": "secret"
  }
}
```

### Cancel example

```json
{
  "reason": "cancel",
  "values": null
}
```

### Dismiss example

```json
{
  "reason": "dismiss",
  "values": null
}
```

## Concrete Message Examples

### Login request

```json
{
  "namespace": "pbb.workspace.ui.bridge.v2",
  "phase": "request",
  "id": "msg_login_001",
  "method": "modal.form.open",
  "payload": {
    "intent": "login",
    "title": "Login",
    "ownerTitle": "PBB HQ",
    "size": "sm",
    "submitLabel": "Login",
    "cancelLabel": "Cancel",
    "busyMessage": "Signing in...",
    "initialValues": {
      "email": "user@pbb.ph"
    },
    "rows": [
      [
        {
          "type": "input",
          "input": "email",
          "name": "email",
          "label": "Email address",
          "required": true
        }
      ],
      [
        {
          "type": "input",
          "input": "password",
          "name": "password",
          "label": "Password",
          "required": true
        }
      ]
    ]
  }
}
```

### Login response

```json
{
  "namespace": "pbb.workspace.ui.bridge.v2",
  "phase": "response",
  "id": "msg_login_001",
  "ok": true,
  "result": {
    "reason": "submit",
    "values": {
      "email": "user@pbb.ph",
      "password": "secret"
    }
  },
  "error": null
}
```

### Re-auth request

```json
{
  "namespace": "pbb.workspace.ui.bridge.v2",
  "phase": "request",
  "id": "msg_reauth_001",
  "method": "modal.form.open",
  "payload": {
    "intent": "reauth",
    "title": "Session Expired",
    "ownerTitle": "PBB HQ",
    "size": "sm",
    "submitLabel": "Login",
    "cancelLabel": "Reload",
    "busyMessage": "Signing in...",
    "closeOnBackdrop": false,
    "closeOnEscape": false,
    "context": {
      "badge": "EMAIL",
      "summary": "user@pbb.ph"
    },
    "initialValues": {
      "email": "user@pbb.ph"
    },
    "rows": [
      [
        {
          "type": "display",
          "name": "email",
          "label": "Email address"
        }
      ],
      [
        {
          "type": "hidden",
          "name": "email"
        }
      ],
      [
        {
          "type": "input",
          "input": "password",
          "name": "password",
          "label": "Password",
          "required": true
        }
      ]
    ]
  }
}
```

### Re-auth cancel response

```json
{
  "namespace": "pbb.workspace.ui.bridge.v2",
  "phase": "response",
  "id": "msg_reauth_001",
  "ok": true,
  "result": {
    "reason": "cancel",
    "values": null
  },
  "error": null
}
```

### Account request

```json
{
  "namespace": "pbb.workspace.ui.bridge.v2",
  "phase": "request",
  "id": "msg_account_001",
  "method": "modal.form.open",
  "payload": {
    "intent": "account",
    "title": "Account",
    "ownerTitle": "PBB HQ",
    "size": "sm",
    "submitLabel": "Save",
    "cancelLabel": "Cancel",
    "busyMessage": "Saving account...",
    "initialValues": {
      "name": "Operator One",
      "email": "operator@pbb.ph"
    },
    "rows": [
      [
        {
          "type": "input",
          "input": "text",
          "name": "name",
          "label": "Name",
          "required": true
        }
      ],
      [
        {
          "type": "input",
          "input": "email",
          "name": "email",
          "label": "Email",
          "required": true
        }
      ]
    ]
  }
}
```

### Change-password request

```json
{
  "namespace": "pbb.workspace.ui.bridge.v2",
  "phase": "request",
  "id": "msg_change_password_001",
  "method": "modal.form.open",
  "payload": {
    "intent": "change-password",
    "title": "Change Password",
    "ownerTitle": "PBB HQ",
    "size": "sm",
    "submitLabel": "Update Password",
    "cancelLabel": "Cancel",
    "busyMessage": "Updating password...",
    "rows": [
      [
        {
          "type": "input",
          "input": "password",
          "name": "current_password",
          "label": "Current Password",
          "required": true
        }
      ],
      [
        {
          "type": "input",
          "input": "password",
          "name": "new_password",
          "label": "New Password",
          "required": true
        }
      ],
      [
        {
          "type": "input",
          "input": "password",
          "name": "confirm_password",
          "label": "Confirm Password",
          "required": true
        }
      ]
    ]
  }
}
```

### Schema-style admin form request

```json
{
  "namespace": "pbb.workspace.ui.bridge.v2",
  "phase": "request",
  "id": "msg_geodata_hub_001",
  "method": "modal.form.open",
  "payload": {
    "intent": "generic-form",
    "title": "Add Hub (Geodata)",
    "size": "md",
    "submitLabel": "Create Hub",
    "cancelLabel": "Cancel",
    "busyMessage": "Creating hub...",
    "mode": "create",
    "context": {
      "badge": "CITY",
      "summary": "Philippines / Region VII / Cebu / Cebu City / Lahug"
    },
    "initialValues": {
      "name": "LAHUG, CEBU CITY",
      "deployment": "city",
      "reg_code": "07",
      "status": "planned"
    },
    "rows": [
      [
        {
          "type": "display",
          "name": "name",
          "label": "Generated Hub Name",
          "span": 2
        }
      ],
      [
        {
          "type": "hidden",
          "name": "name"
        }
      ],
      [
        {
          "type": "hidden",
          "name": "deployment"
        }
      ],
      [
        {
          "type": "hidden",
          "name": "reg_code"
        }
      ],
      [
        {
          "type": "ui.select",
          "name": "status",
          "label": "Status",
          "items": [
            { "label": "Planned", "value": "planned" },
            { "label": "Online", "value": "online" },
            { "label": "Offline", "value": "offline" },
            { "label": "Maintenance", "value": "maintenance" }
          ]
        }
      ]
    ]
  }
}
```

### Unsupported row-type response

```json
{
  "namespace": "pbb.workspace.ui.bridge.v2",
  "phase": "response",
  "id": "msg_geodata_hub_001",
  "ok": false,
  "result": null,
  "error": {
    "code": "unsupported-row-type",
    "message": "Unsupported row type: custom"
  }
}
```

## Error Shape

```ts
{
  code: string;
  message: string;
}
```

### Example errors

- `invalid-request`
- `unsupported-method`
- `unsupported-row-type`
- `unsupported-payload`
- `bridge-request-failed`

## Responsibility Split

### Parent Workspace

- validate origin
- validate message envelope
- validate payload shape
- render helper-owned form modal in the parent shell
- return `{ reason, values }`

### Child app

- open the request
- receive the result
- run API calls locally
- decide success/failure behavior
- reopen or update later if retry behavior is needed

## Validation/Retry Boundary

This V1 does not yet define a keep-open error-update round-trip.

Recommended V1 behavior:

1. parent renders modal
2. parent returns submitted values
3. child performs API request locally
4. child decides whether to reopen a new modal request with new initial state or error context

A future V2 can add an update contract if needed.

## JSON-Safe Requirements

Allowed:

- strings
- numbers
- booleans
- null
- arrays
- plain objects

Not allowed:

- functions
- DOM nodes
- Dates as live objects
- helper-owned instances
- runtime callbacks in payload

## Security Requirements

- parent must validate trusted origins
- child must not assume any parent shell is safe
- unsupported or malformed payloads must fail closed
- Workspace must not become the executor of child business logic

## Initial Recommended Use Cases

- cross-origin login modal rendering
- cross-origin re-auth modal rendering
- cross-origin account modal rendering
- cross-origin change-password modal rendering

## First Runtime Slice

The currently shipped runtime supports:

- `intent: "login"`
- `intent: "reauth"`
- `intent: "account"`
- `intent: "change-password"`

`generic-form` remains future-capable at the contract level but should not be treated as part of the currently shipped runtime slice.

## Non-Goals

This V1 does not support:

- arbitrary custom DOM modal transport
- cross-origin arbitrary `createModal(...)` content
- remote callback execution
- parent-owned child API submission
