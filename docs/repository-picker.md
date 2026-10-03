# Repository file picker and composer attachments (0.21.227)

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
and can be selected normally. The application owns validation, conflict prompts,
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
  Native clipboard file interception is disabled so custom mode never bypasses
  the repository workflow. `multiple:false` also limits the returned selection.
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
