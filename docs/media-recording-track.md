# Borrowing a live recording microphone

`captureMedia` in `js/ui/ui.media.capture.js` accepts an optional synchronous
`onRecordingStart({ audioTrack, kind })` hook. It receives the existing
microphone `MediaStreamTrack` immediately after `MediaRecorder.start()` in both
audio and video mode. No second microphone capture is requested. The canonical
recording modal and the `Promise<File | null>` return value remain unchanged.

```js
const file = await captureMedia({
  kind: "video", // or "audio"
  onRecordingStart({ audioTrack }) {
    // Consumer owns recognition and its errors/UI; Helper owns the track.
    try { recognition.start(audioTrack); }
    catch (error) { showTranscriptionError(error); }
    return ({ reason }) => {
      if (reason === "stop") recognition.stop();
      else recognition.abort();
    };
  },
});
```

The hook may return a synchronous cleanup function. Helper calls it once for
each recording that started, before releasing tracks, with `{ reason }`:

- `stop`: the user stops recording, or the recorder stops normally.
- `cancel`: modal dismissal, caller abort, page hide, or disposal.
- `error`: recording/device failure or size/duration limit failure.

Stopping finalizes the consumer immediately, before waiting for the recorder's
last data event. Preview, attachment, and later dismissal do not call cleanup
again. Record again acquires a fresh stream and starts a new hook/cleanup pair.
Cancellation while permission is pending never calls the hook; late permission
results are released. Device disconnection may mean the track has already ended
when error cleanup runs.
Synchronous cancellation inside the start hook defers track release until that
hook returns and its disposer has run, including when the disposer throws.

Do not stop, clone, or change the borrowed track. Return cleanup synchronously;
Helper does not await consumer initialization or finalization. Consumers that
initialize asynchronously must cancel their pending work and ignore late
results themselves. Catch recognition errors in the consumer to keep recording
available. An uncaught start-hook exception fails capture and releases devices;
a cleanup exception cannot prevent device release. Async consumer operations
must handle their own rejected promises.

The hook is also passed through composer `attachmentOptions.audios` and
`attachmentOptions.videos`. Speech recognition support, local language model
installation, offline operation, and transcript rendering belong to the
consumer and must be checked there; receiving a track does not guarantee them.
