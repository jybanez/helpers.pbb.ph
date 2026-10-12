# Repository file picker and composer attachments (0.21.229)

`ui.repository.picker` exports `createRepositoryPicker(options)`, a complete
canonical Modal + Breadcrumbs workflow. There was no existing complete repository
picker; the component owns accessible native folder and file row buttons,
header icon actions, upload controls, busy/error states and cancellation. It does
not implement transport, authorization, storage, overwrite/conflict resolution,
chunking or resumable uploads. No form modal is needed: this is file selection,
not a custom form submission.

## Integration

Preload factories during app initialization so the click handler can open immediately.

```js
const createPicker = await uiLoader.get('ui.repository.picker');
const picker = createPicker({
  title: 'Attach project files',
  context: projectId,
  folderId: null, // app-defined root identity
  loadFolder: ({ folderId, signal, context }) => repository.list(context, folderId, { signal }),
  onUpload: (files, { folderId, signal, context }) => repository.upload(context, folderId, files, { signal }),
});
const composer = createChatComposer(host, {}, {
  attachmentAdapter: { mode: 'custom', open: ({ signal }) => picker.pick({ signal }) },
  onAttachmentsSelected: (records, { kind, source }) => addDraftAttachments(records),
});
```

`loadFolder` returns a Promise or a synchronous value with this shape:

```js
{
  folder: { id: null, name: 'Project files' },
  breadcrumbs: [{ id: null, name: 'Project files' }],
  folders: [{ id: 'design', name: 'Design' }],
  files: [{ id: 'file-42', name: 'Brief.md', mimeType: 'text/markdown', selectable: true }],
  permissions: { showUpload: true, canUpload: true }
}
```

The current folder id must exactly match the requested id. Breadcrumbs end at that
folder; ancestor buttons call `loadFolder` with their ids. Folder/file ids must be
nonempty strings or numbers; the root folder may use null. File ids are stable and
unique throughout one repository context. Numeric and string ids are distinct.
Files and folders are separate arrays: folders navigate and never become attachments.
Extra record fields survive selection; names always render as text, never HTML.
`selectable:false` disables a file and removes a previously selected copy when that
folder is revisited. The app must reauthorize all selected ids before mutation;
offscreen selections cannot establish current authorization.

## Selection and lifecycle

The picker shows canonical breadcrumb ancestors as individual underlined navigation
controls at the top, with the current folder marked `aria-current`. Rows sort by name
within folders-first and files-second groups. Folder rows use Helper's `files.folder`
icon; file rows use the canonical `getFileIconName(name, mimeType || type)` resolver
and file icon pack, with the unknown-file fallback. The complete file row is a native
toggle button (`aria-pressed`), activated by click, Enter or Space. Selected rows have
a full-row highlight and decorative checkmark. There are no native checkboxes or
selection summary or Clear selection control. Reload folder and Upload files are
borderless icon buttons in the canonical modal header, with accessible names and
tooltips. Attach remains disabled until at least one file is selected.

| API | Behavior |
| --- | --- |
| `open()` | Mount immediately, enter modal busy state, then invoke `loadFolder`. Returns boolean; duplicate calls do not reload. |
| `pick({signal} = {})` | Open and return a Promise of canonical records on confirmation, or `[]` on dismissal/abort/destroy. Repeated calls share the active Promise. |
| `navigate(folderId)` / `reload()` | Read a folder, retain cross-folder selections, abort/ignore the previous read. Returns Promise of boolean. |
| `uploadFiles(File[])` | Same guarded workflow as native Upload input; returns Promise of boolean. Does not auto-select uploads. |
| `update(options)` | Change configuration. Changing context, folderId, loadFolder, onUpload or multiple clears selection and reloads an open picker. |
| `close()` / `destroy()` | Invalidate pending callbacks, abort where supported and settle selection as cancelled. Destroy is terminal. |
| `getState()` | `open, status, error, folderId, selection, destroyed`. |

Options include `title`, `context`, `folderId` (default null), `multiple` (default
true), `loadFolder`, `onUpload`, `onClose`, and `open` (default false). Each opening
starts a fresh selection; navigation retains it. Selection persists across folders. In the ready state, Escape first clears all
selected files and keeps the dialog open; a subsequent Escape closes it. Cancel
and the close button always dismiss directly. While loading or uploading, Escape
also dismisses directly and aborts/invalidates pending work. `multiple:false` keeps one file. There is no
remote search or server pagination contract in this version: supply appropriately
bounded folder results. Desktop retains the 40vh scrollable list. At widths of 640px or less, the list
has no independent height cap or scrolling; the canonical modal body is the only
scroll region. Short folders use the available full-height space, while long
folders scroll beneath the fixed header/footer with canonical safe-area padding.

States: idle, loading, ready, uploading, error, upload-error, destroyed. Empty folders
show an explicit empty message. Reads show dismissible loading; failures keep the
dialog open with an alert and Reload folder. Attach stays disabled without a ready
listing and selected files. Folder controls and file inputs are unavailable while
loading/uploading; close, Escape and backdrop dismissal remain available. Modal
focus trapping and return focus are canonical; file row toggle buttons expose aria-pressed and a whole-row highlight; controls support standard Tab,
Enter and Space behavior. Avoid reopening while the close transition is running.

## Upload responsibilities

`permissions.canUpload === true` and an `onUpload` callback are required. Set
`showUpload:true, canUpload:false` to show a disabled control, or `showUpload:false`
to hide it. These are presentation guards only, never server authorization.

`onUpload(files, {folderId, context, signal})` receives native `File[]` and returns
canonical file records after confirmed success. They appear in the current list
and can be selected normally. Confirmed success uses a canonical success toast,
without inserting an inline body notice. Failures retain actionable inline alerts. The application owns validation, conflict prompts,
chunking, permission checks and all uncertain-outcome reconciliation. A failure
disables Upload until a read reload and shows guidance to check the repository;
Reload never replays the upload. Aborting the signal cannot guarantee a server-side
upload was rolled back. Late results after dismissal/context change are ignored.

## Backward-compatible composer adapter

`attachmentAdapter` defaults to `'native'`. Modes:

- `'native'`: existing input/paste behavior, accept/multiple filters and
  `onFilesSelected(File[], {source:'picker'|'paste'})` remain intact. Also emits
  `onAttachmentsSelected(File[], {kind:'native', source})` if supplied.
- `{mode:'custom', open:({signal}) => Promise<canonicalRecord[]>}`: calls the adapter
  once per pending opening; the repository picker's `pick` API supplies the complete
  workflow. Result emits only `onAttachmentsSelected(records,
  {kind:'repository', source:'picker'})`. Cancellation returns null/[]; an error is
  visible in the composer and optionally reported via `onAttachmentError(error)`.
  Clipboard file interception is disabled unless this adapter also supplies the
  explicit `paste` method below. `multiple:false` also limits the returned picker selection.
- `'none'`: no attachment button, native file input or file paste interception.

`showAttachmentButton:false` disables all modes. `update`, `destroy`, or setting
busy true abort the current adapter and ignore late results. Text editing does not
cancel it. Apps must use `update` when project/draft context changes. The unified
callback adds attachments to draft state; use either it or the legacy callback for
native handling to avoid adding the same files twice. Submission and server-side
attachment checks remain the application's responsibility.

## Verification and demos

See `demos/demo.repository.picker.html` for delayed/error/empty/permission cases,
upload simulation and composer integration. Run `node tests/repository.picker.regression.mjs`
for source and bundled lifecycle/adapter tests, plus `node tests/chat.regression.mjs`,
`node tests/ui.bundle.contract.mjs` and `node tests/registry.contract.mjs`.

## Custom clipboard files (0.21.300)

Custom adapters may opt into file paste explicitly, independently of their picker:

```js
attachmentAdapter: {
  mode: 'custom',
  open: ({ signal }) => picker.pick({ signal }),
  async paste(files, { signal, source }) {
    // files: accepted original File objects; source is always 'paste'.
    // Application owns authorization, uploads and uncertain-outcome reconciliation.
    return await applicationUpload(files, { signal }); // canonical records, or null/[]/void
  }
},
onAttachmentsSelected(records, { kind, source }) {
  // kind:'repository'; source:'paste' or 'picker'. Add confirmed records to the draft.
}
```

Only generic `accept` and `multiple` rules run in Helper, before preventing the
paste event or starting busy state. `attachmentOptions.files` overrides top-level
file options. Text-only paste, all-rejected files, custom adapters without `paste`,
and modes without file attachments keep browser default behavior. Once at least
one file is accepted, the mixed clipboard event is consumed and accepted files
are passed exactly once; clipboard text from that same event is not inserted.
Native mode retains its existing File callbacks.

The composer blocks additional file attachment operations and Send while awaiting
`paste`, but keeps the input editable and preserves its DOM, caret and focus on
success/error. `update`, `destroy`, and `setBusy(true)` abort the supplied signal
and suppress late results/errors. Typing and `setAttachmentCount` do not cancel.
Use `update` when project/draft context changes. Adapters must honor the signal and
check application context before their own queue/storage side effects; abort does
not prove a server mutation was rolled back.

Return canonical `{id,name,...}` records to emit only `onAttachmentsSelected` with
`{kind:'repository',source:'paste'}`. Return null, [], or void if there is no result
or the adapter already updated the application queue; do not add the same records
through both paths. Helper never creates folders, uploads files, associates a
message, or validates project authorization. Invalid results/rejections show an
inline alert and call `onAttachmentError`. Helper never automatically replays an
upload; the application must reconcile an uncertain outcome before retrying.

Run `node tests/composer.paste.regression.mjs` for the source/bundle fixture.
