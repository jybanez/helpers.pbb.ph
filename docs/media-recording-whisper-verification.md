# Independent Diary Whisper offline verification

Task #503; Diary handoff #14690; Planner decision #14688. Tested 2026-11-21.

## Result

Passed in fresh Chrome and Edge profiles: direct fixture inference, recognizable
provisional text before Stop in audio and video, editable final text saved with
nonempty clips in IndexedDB, one capture per mode, no track clones, and device
track release. No Helper production change was needed after the hook revision.
This resolves the previous native-browser speech-result blocker for the tested
Diary WASM experiment. Native SpeechRecognition's earlier no-result finding is
unchanged; the successful experiment uses a separate browser-local engine.

| Browser on Windows 10.0.26320.0 | Direct 10s fixture inference | Audio first words | Video first words |
| --- | --- | --- | --- |
| Chrome 158.0.8127.36 | 8.78s | 10.59s | 9.03s |
| Edge 159.0.4402.13 | 10.02s | 10.67s | 10.28s |

All four live runs first displayed **“Please open the door.”** while the recorder
still showed Stop. Timings start immediately before selecting Start recording;
they include the fixture's leading silence and UI automation overhead. The
first 10 seconds fed directly to the prepared worker produced:

> Please open the door. The blue notebook is on the table. This is an offline
> recording test. We are testing.

Audio final text included the known words through “English speech recognition.”
Video final text contained recognizable fixture words with a shorter tail,
because recording stopped shortly after the first provisional text. Every
final transcript was edited with a unique offline verification suffix and the
exact edited value was read back from IndexedDB together with a nonempty Blob.
Saved audio sizes were 138,285 / 138,496 bytes (Chrome / Edge); video sizes were
445,909 / 432,802 bytes.

The 25ms UI timer's largest observed gap during recording was 30.3ms / 26.7ms
for Chrome audio/video and 33.5ms / 27.5ms for Edge. Reading the enabled Stop
control took 4–30ms. These measurements support responsiveness on this test
machine; they are not a general performance guarantee. Inference ran in the
worker, with the recorded microphone track feeding the audio analysis source.

## Exact build and input

- URL: `https://diary.wizaya.com/test/transcription.html`.
- Served [build manifest](https://diary.wizaya.com/test/whisper-build.json)
  SHA-256, independently checked byte-for-byte:
  `9fbf7947d005fb75752c7b3a3a6a93e9a1c96b661d0d9f97ccf162e29fd067ef`.
  Diary has no Git checkout; this identifies the deployed build manifest, whose
  asset entries declare the application/dependency hashes.
- Helper module revision: `a856bd2b6502bfad5e39d5869710b46f00e7c949`.
- Transformers.js 3.8.1, ONNX Runtime Web
  `1.22.0-dev.20250409-89f8206ba4`, WASM, one thread.
- Model: `onnx-community/whisper-tiny.en`, q8, revision
  `794207fec2761281fe63a23a94b7e9f53a4efbc1`.
- Input: disposable Microsoft David Desktop TTS, 16kHz/16-bit mono PCM,
  603,566 bytes, SHA-256
  `d3b91d424397bc1462bece7210ee5969960d85491bea8bf43b8dbcaa4ef7cf85`.
  Use the existing fixture generator for the exact text and pauses.
- Playwright: `1.64.0-alpha-1790635538000`; headless browsers, fake devices,
  isolated new profiles for the reported runs.

## Offline and persistence checks

The browser started with a dead external proxy, with only the Diary origin
bypassed to load local assets. Prepare English model completed in 8.27s in
Chrome / 7.60s in Edge. An explicit external HTTPS probe failed through that
proxy. The loaded context was then set offline, with `navigator.onLine=false`,
before direct fixture inference and both recording sessions.

Actual HTTP(S) requests and request bodies were captured at browser-context
scope, including worker asset loads. There were **zero HTTP(S) requests during
recording or finalization in either browser**, and no non-probe request bodies.
All setup requests were same-origin GETs. The intentionally blocked external
probe is recorded separately. `blob:` preview/playback URLs represent local
memory access, not HTTP(S) uploads or remote inference. No such URL is treated
as an external request.

Each mode used one `getUserMedia` acquisition; no `MediaStreamTrack.clone()`
calls occurred. The analysis source used the recorder's captured microphone
track. Every acquired audio/video track had ended after Stop. Both clip Blobs
and the exact edited recognized transcript values were read back from the
`diary-recording-test` IndexedDB database's `clips` store. No personal profile
or real microphone audio was used.

## Repeat

With Playwright available locally or via `PLAYWRIGHT_MODULE`:

```powershell
./scripts/make.media.speech.fixture.ps1 -OutputPath output/playwright/media-speech-whisper/commands.wav
$env:SPEECH_TEST_WAV = (Resolve-Path output/playwright/media-speech-whisper/commands.wav).Path
node scripts/verify.media.speech.whisper.mjs
node scripts/verify.media.speech.whisper.mjs edge
```

The verifier pins the manifest hash above, creates a fresh test profile,
prepares the local model, tests direct fixture inference offline, then tests
both recording modes and IndexedDB persistence. It saves raw local evidence
under `output/playwright/media-speech-whisper`. It expects the generator's
English fixture vocabulary and the pinned discovery build. Use
`SPEECH_TEST_ORIGIN` and `SPEECH_TEST_OUTPUT` to select another test origin or
output directory; do not substitute an unreviewed manifest or personal profile.

The [sanitized evidence](media-recording-whisper-evidence.json) preserves the
reported timings, transcript values, clip sizes, build/model pins, capture
checks and HTTP assertions. Initial harness attempts exposed two test issues:
observing the live region before Start had created it, and counting the
deliberately blocked external probe as an unexpected origin. Both were corrected
before the reported complete passing runs; neither required an app change.

These tests cover a loaded page with a prepared model kept in memory. They do
not establish cold offline restart, cache-eviction behavior, mobile performance,
long-session accuracy, Filipino/Cebuano/mixed speech, or general recognition
quality. Live text is provisional windowed Whisper output, not native browser
interim-result events.
