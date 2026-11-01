import { createToastStack } from './ui.toast.js';
import { createModal } from './ui.modal.js';
import { createBreadcrumbs } from './ui.breadcrumbs.js';
import { createIcon, registerIconPack } from './ui.icons.js';
import { FILE_ICONS, getFileIconName } from './ui.icons.files.js?v=0.21.225';

// Transport and authorization belong to the application. Records are opaque except
// for stable id, name, and optional selectable:false presentation metadata.
export function createRepositoryPicker(supplied = {}) {
  registerIconPack(FILE_ICONS);
  let options = { title: 'Choose repository files', folderId: null, multiple: true, ...supplied };
  let folderId = options.folderId, listing = null, status = 'idle', error = '';
  let revision = 0, controller = null, destroyed = false, closing = false, active = false;
  let toastStack = null, successToast = null;
  let appendLoading = false, appendError = '', pageTimer = null;
  let selected = new Map(), settle = null, promise = null, detachSignal = null, opener = null;
  const root = document.createElement('section'); root.className = 'ui-repository-picker';
  const crumbsHost = document.createElement('div');
  const notice = document.createElement('p'); notice.setAttribute('role', 'status'); notice.setAttribute('aria-live', 'polite');
  const retry = iconButton('Reload folder', 'actions.refresh', () => void navigate(folderId));
  const upload = iconButton('Upload files', 'data.upload', () => { if (canUpload()) input.click(); });
  const input = document.createElement('input'); input.type = 'file'; input.multiple = true; input.hidden = true;
  input.addEventListener('change', () => { const files = Array.from(input.files || []); input.value = ''; void uploadFiles(files); });
  const headerActions = document.createElement('div'); headerActions.className = 'ui-repository-picker-header-actions'; headerActions.append(retry, upload);
  const list = document.createElement('ul'); list.className = 'ui-repository-picker-list'; list.setAttribute('aria-label', 'Folders and files');
  const pageNotice = document.createElement('p'); pageNotice.setAttribute('role', 'status'); pageNotice.setAttribute('aria-live', 'polite');
  const pageRetry = button('Retry loading more files', () => void loadMore());
  root.append(crumbsHost, input, notice, list, pageNotice, pageRetry);
  const footer = document.createElement('div'); footer.className = 'ui-repository-picker-tools';
  const cancel = button('Cancel', () => void close());
  const confirm = button('Attach selected files', () => {
    if (confirm.disabled || !active) return;
    const records = [...selected.values()];
    void close({ reason: 'select', records });
  });
  footer.append(cancel, confirm);
  const crumbs = createBreadcrumbs(crumbsHost, {}, {onNavigate: item => void navigate(item.id)});
  const modal = createModal({ title: options.title, ariaLabel: options.title, content: root, footer, headerActions, size: 'lg',
    closeWhileBusy: true, escapeCloseWhileBusy: true, backdropCloseWhileBusy: true,
    onBeforeClose(meta) {
      // Only ready-state Escape consumes selection. Explicit dismissal and busy
      // cancellation must still invalidate pending work immediately.
      if (meta?.reason === 'escape' && active && status === 'ready' && selected.size) {
        const focused = document.activeElement;
        const rowId = list.contains(focused) ? focused.dataset.id : null;
        const kind = focused?.dataset?.kind;
        selected.clear(); render();
        if (!focused?.isConnected || focused.disabled) {
          const replacement = [...list.querySelectorAll('[data-id]')].find(node => node.dataset.id === rowId && node.dataset.kind === kind);
          (replacement || modal.refs.closeButton).focus({preventScroll:true});
        }
        return false;
      }
      closing = true; active = false; invalidate(); return true;
    },
    onClose(meta) {
      closing = false; finish(meta?.records || []); selected.clear(); listing = null; render();
      options.onClose?.(meta);
    },
  });
  function button(label, action) {
    const node = document.createElement('button'); node.type = 'button'; node.className = 'ui-button';
    node.textContent = label; node.addEventListener('click', action); return node;
  }
  function iconButton(label, icon, action) {
    const node = button('', action); node.classList.add('ui-button-borderless');
    node.setAttribute('aria-label', label); node.title = label; node.append(createIcon(icon)); return node;
  }
  function key(id) {
    if ((typeof id !== 'string' && typeof id !== 'number') || String(id) === '') throw new TypeError('Each record needs a stable id.');
    return `${typeof id}:${id}`;
  }
  function records(items, deduplicate = false) {
    if (!Array.isArray(items)) throw new TypeError('Expected an array of file records.');
    const seen = new Set();
    return items.map(record => {
      if (!record || typeof record !== 'object' || typeof record.name !== 'string') throw new TypeError('Each record needs a name.');
      const id = key(record.id); if (seen.has(id) && !deduplicate) throw new TypeError('Duplicate record id.'); seen.add(id);
      return {...record};
    });
  }
  function invalidate() { clearTimeout(pageTimer); appendLoading = false; appendError = ''; successToast?.close(); successToast = null; revision++; controller?.abort(); controller = null; }
  function finish(result) { detachSignal?.(); detachSignal = null; const resolve = settle; settle = null; promise = null; resolve?.(result); }
  function busy() { return status === 'loading' || status === 'uploading'; }
  function canUpload() { return active && status === 'ready' && !appendLoading && listing?.permissions?.canUpload === true && typeof options.onUpload === 'function'; }
  function setStatus(next, message = '') {
    status = next; error = next === 'error' || next === 'upload-error' ? message : '';
    notice.textContent = message; notice.hidden = !message; notice.setAttribute('role', error ? 'alert' : 'status');
    modal.setBusy(busy(), {message, cancelBusy: false}); render();
    if (active && !modal.refs.panel.contains(document.activeElement)) modal.refs.closeButton.focus({preventScroll:true});
  }
  function render() {
    const positions = [list, modal.refs.body].map(node => [node, node.scrollTop]);
    const focused = document.activeElement;
    const focusId = list.contains(focused) ? focused.dataset.id : null;
    const focusKind = focused?.dataset?.kind;
    const crumbLabel = crumbsHost.contains(focused) ? focused.textContent : null;
    crumbs.setItems((listing?.breadcrumbs || []).map(item => ({id:item.id, label:String(item.name)})));
    crumbsHost.querySelectorAll('button').forEach(node => { node.disabled = busy() || !active; });
    retry.disabled = busy() || !active;
    upload.hidden = !(listing?.permissions?.showUpload ?? listing?.permissions?.canUpload) || typeof options.onUpload !== 'function';
    upload.disabled = !canUpload(); input.disabled = !canUpload();
    confirm.disabled = !active || busy() || status !== 'ready' || !selected.size;
    // Modal busy restores prior disabled attributes, so apply these after setBusy.
    cancel.disabled = false;
    list.replaceChildren();
    const byName = (a,b) => a.name.localeCompare(b.name, undefined, {numeric:true,sensitivity:'base'});
    const ordered = items => listing?.pagination ? items : [...items].sort(byName);
    for (const folder of ordered(listing?.folders || [])) {
      const node = row(folder, 'folder', 'files.folder', () => void navigate(folder.id));
      node.setAttribute('aria-label', `Open folder: ${folder.name}`);
      node.disabled = busy() || !active;
    }
    for (const file of ordered(listing?.files || [])) {
      const node = row(file, 'file', getFileIconName(file.name,file.mimeType || file.type), () => {
        if (node.disabled) return;
        if (!selected.has(key(file.id))) { if (!options.multiple) selected.clear(); selected.set(key(file.id), file); }
        else selected.delete(key(file.id));
        render(); const replacement = [...list.querySelectorAll('[data-kind="file"]')].find(node => node.dataset.id === key(file.id)); replacement?.focus({preventScroll:true});
      });
      const chosen = selected.has(key(file.id));
      node.setAttribute('aria-pressed', String(chosen)); node.classList.toggle('is-selected',chosen);
      node.disabled = busy() || !active || file.selectable === false || status !== 'ready';
      const state = createIcon('actions.check', {className:'ui-repository-picker-selected-icon'}); if (!chosen) state.setAttribute('hidden',''); node.append(state);
    }
    if (status === 'ready' && !list.childNodes.length) { const li = document.createElement('li'); li.textContent = 'This folder is empty.'; list.append(li); }
    pageNotice.textContent = appendLoading ? 'Loading more files…' : appendError;
    pageNotice.hidden = !pageNotice.textContent; pageNotice.setAttribute('role', appendError ? 'alert' : 'status');
    pageRetry.hidden = !appendError; pageRetry.disabled = !active || appendLoading;
    list.setAttribute('aria-busy', String(appendLoading));
    if (focusId) {
      const replacement = [...list.querySelectorAll('[data-id]')].find(node => node.dataset.id === focusId && node.dataset.kind === focusKind);
      if (replacement && !replacement.disabled) replacement.focus({preventScroll:true});
    }
    if (crumbLabel && !focused.isConnected) [...crumbsHost.querySelectorAll('button')].find(node => node.textContent === crumbLabel && !node.disabled)?.focus({preventScroll:true});
    if (focused === pageRetry && pageRetry.hidden && active) (list.querySelector('button:not(:disabled)') || modal.refs.closeButton).focus({preventScroll:true});
    for (const [node, top] of positions) node.scrollTop = top;
  }
  function row(record, kind, icon, activate) {
    const li = document.createElement('li');
    // Native buttons provide Enter/Space activation and expose file toggle state.
    const node = button('',activate); node.className = 'ui-repository-picker-row';
    node.dataset.kind = kind; node.dataset.id = key(record.id);
    const name = document.createElement('span'); name.className = 'ui-repository-picker-name'; name.textContent = record.name;
    node.append(createIcon(icon),name);
    if (kind === 'folder') node.append(createIcon('navigation.chevron-right',{className:'ui-repository-picker-folder-arrow'}));
    li.append(node); list.append(li); return node;
  }
  async function navigate(id = folderId) {
    if (!active || destroyed || status === 'uploading') return false;
    invalidate(); folderId = id; listing = null; controller = new AbortController();
    const token = revision, signal = controller.signal, load = options.loadFolder;
    setStatus('loading', 'Loading folder…');
    try {
      if (typeof load !== 'function') throw new Error('Configure loadFolder to load repository data.');
      const data = await load({folderId:id, signal, context:options.context});
      if (!active || token !== revision || signal.aborted) return false;
      if (!data?.folder || data.folder.id !== id) throw new Error('The response does not match the requested folder.');
      const files = records(data.files || []), folders = records(data.folders || []);
      if (!Array.isArray(data.breadcrumbs) || !data.breadcrumbs.length || data.breadcrumbs.at(-1).id !== id) throw new Error('Provide breadcrumbs ending at the current folder.');
      listing = {...data, files, folders, pagination: pagination(data.pagination)};
      // Refresh canonical values, and remove known revoked selections on a revisit.
      for (const file of files) if (selected.has(key(file.id))) {
        if (file.selectable === false) selected.delete(key(file.id)); else selected.set(key(file.id), file);
      }
      setStatus('ready'); list.scrollTop = 0; modal.refs.body.scrollTop = 0; schedulePageCheck(); return true;
    } catch (cause) {
      if (active && token === revision && !signal.aborted) setStatus('error', `Unable to load folder. ${cause?.message || 'Check access and reload the folder.'}`);
      return false;
    }
  }
  function pagination(value) {
    if (value == null) return null;
    if (!Number.isInteger(value.page) || !Number.isInteger(value.total_pages) || value.page < 1 || value.total_pages < value.page) {
      throw new Error('Pagination must contain integer page and total_pages (1 <= page <= total_pages).');
    }
    return {...value};
  }
  function hasMore() {
    return typeof options.loadMore === 'function' && !!listing?.pagination && listing.pagination.page < listing.pagination.total_pages;
  }
  function checkPage() {
    if (!active || status !== 'ready' || appendLoading || appendError || !hasMore()) return;
    // Mobile delegates scrolling to the canonical modal body; desktop uses the list.
    const scroller = getComputedStyle(list).overflowY === 'visible' ? modal.refs.body : list;
    if (scroller.clientHeight > 0 && scroller.scrollHeight - scroller.clientHeight - scroller.scrollTop <= 64) void loadMore();
  }
  function schedulePageCheck() { clearTimeout(pageTimer); pageTimer = setTimeout(checkPage, 0); }
  list.addEventListener('scroll', checkPage, {passive:true});
  modal.refs.body.addEventListener('scroll', checkPage, {passive:true});
  const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(schedulePageCheck) : null;
  observer?.observe(list); observer?.observe(modal.refs.body);
  async function loadMore() {
    if (!active || destroyed || status !== 'ready' || appendLoading || !hasMore()) return false;
    controller = new AbortController();
    const token = revision, signal = controller.signal, id = folderId, current = {...listing.pagination};
    appendLoading = true; appendError = ''; render();
    try {
      const data = await options.loadMore({folderId:id, pagination:{...current}, signal, context:options.context});
      if (!active || token !== revision || signal.aborted) return false;
      if (!data?.folder || data.folder.id !== id) throw new Error('The response does not match the requested folder.');
      const next = pagination(data.pagination);
      if (!next || next.page !== current.page + 1) throw new Error('The response must advance to the next page.');
      // Validate the entire batch before changing any listing or selection state.
      const files = records(data.files || [], true), folders = records(data.folders || [], true);
      const merge = (old, incoming) => [...new Map([...old, ...incoming].map(item => [key(item.id), item])).values()];
      listing = {...listing, files:merge(listing.files,files), folders:merge(listing.folders,folders), pagination:next};
      for (const file of files) if (selected.has(key(file.id))) {
        if (file.selectable === false) selected.delete(key(file.id)); else selected.set(key(file.id),file);
      }
      appendLoading = false; render(); schedulePageCheck(); return true;
    } catch (cause) {
      if (active && token === revision && !signal.aborted) {
        appendLoading = false; appendError = `Unable to load more files. ${cause?.message || 'Check access.'} Retry loading more files.`; render();
      }
      return false;
    }
  }
  async function uploadFiles(files) {
    if (!canUpload() || !Array.isArray(files) || !files.length || files.some(file => !(file instanceof File))) return false;
    invalidate(); controller = new AbortController();
    const token = revision, signal = controller.signal, id = folderId, callback = options.onUpload;
    setStatus('uploading', 'Uploading files…');
    try {
      const result = await callback(files, {folderId:id, signal, context:options.context});
      if (!active || token !== revision || signal.aborted) return false;
      const uploaded = records(result);
      const merged = new Map(listing.files.map(file => [key(file.id),file]));
      for (const file of uploaded) merged.set(key(file.id),file);
      listing.files = [...merged.values()]; setStatus('ready');
      toastStack ||= createToastStack({className:'ui-repository-picker-toasts', max:1});
      successToast = toastStack.success('Upload completed. Select the files to attach.'); return true;
    } catch (cause) {
      if (active && token === revision && !signal.aborted) setStatus('upload-error', `Upload did not confirm completion. ${cause?.message || ''} Check the repository before uploading again. Reloading only reads the folder; it never retries the upload.`);
      return false;
    }
  }
  function open() {
    if (destroyed || closing) return false;
    if (active) return true;
    opener = document.activeElement; active = true; selected.clear();
    modal.open(); void navigate(folderId); return true;
  }
  function pick({signal} = {}) {
    if (destroyed || closing || signal?.aborted) return Promise.resolve([]);
    if (promise) return promise;
    promise = new Promise(resolve => { settle = resolve; });
    const result = promise;
    if (signal) { const abort = () => void close(); signal.addEventListener('abort',abort,{once:true}); detachSignal = () => signal.removeEventListener('abort',abort); }
    open(); return result;
  }
  function close(meta = {}) { return modal.close(meta); }
  function update(patch = {}) {
    if (destroyed) return false;
    const reload = ['context','folderId','loadFolder','loadMore','onUpload','multiple'].some(name => Object.hasOwn(patch,name));
    options = {...options,...patch}; modal.update({title:options.title,ariaLabel:options.title});
    if (reload) { invalidate(); selected.clear(); folderId = options.folderId; status = 'idle'; if (active) void navigate(folderId); }
    return true;
  }
  function destroy() {
    if (destroyed) return;
    observer?.disconnect(); list.removeEventListener('scroll', checkPage); modal.refs.body.removeEventListener('scroll', checkPage);
    destroyed = true; active = false; invalidate(); toastStack?.destroy(); toastStack = null; finish([]); crumbs.destroy(); modal.destroy(); selected.clear(); listing = null; status = 'destroyed';
    if (opener?.isConnected) opener.focus({preventScroll:true});
  }
  const api = {open,pick,close,update,navigate,reload:()=>navigate(folderId),loadMore,uploadFiles,destroy,
    getState:()=>({open:active,status,error,folderId,selection:[...selected.values()],pagination:listing?.pagination ? {...listing.pagination} : null,loadingMore:appendLoading,loadMoreError:appendError,hasMore:hasMore(),destroyed}),
    refs:{...modal.refs,list,pageNotice,pageRetry,confirm,cancel,upload,input,retry,notice,breadcrumbs:crumbsHost}};
  render(); if (options.open) open(); return api;
}
