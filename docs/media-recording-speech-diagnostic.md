# Diary offline speech diagnostic

Task #503, Planner message #14680. Tested 2026-11-21 with the Helper hook at
`a856bd2b6502bfad5e39d5869710b46f00e7c949`, integrated on Diary's discovery page.
The [sanitized event evidence](media-recording-speech-evidence.json) records the
fixture hash, model/offline checks, native events, signal levels, track identity
checks and cleanup results.

## Finding

The tested Chrome on-device recognition path detects speech but emits no text
with the supplied reproducible audio, both with and without PBB capture. This
does not isolate a Helper defect. No production workaround or second microphone
capture was added. It also does not prove that native recognition fails for all
voices, devices, browser versions, or physical microphones.

Independent environment: headless Chrome 158.0.8127.36, Windows build
10.0.26320.0, Playwright 1.64.0-alpha-1790635538000, isolated profile, cached
en-US model reporting `available`. All recognition used `processLocally=true`,
`lang='en-US'`, `continuous=true`, `interimResults=true`. Each session recorded
events for 22 seconds before Stop, followed by a 2-second finalization wait.

| Control | Speech detected | Text results | Other observations |
| --- | --- | --- | --- |
| Standalone `getUserMedia` + `start(track)` | yes, ~4.19s | 0 | No PBB or MediaRecorder; analyser reads non-silent input |
| Standalone track + MediaRecorder + `start(track)` | yes, ~4.20s | 0 | No PBB; recorded 214,024 bytes |
| Standalone track, EC/AGC/NS disabled | yes, ~4.14s | 0 | Non-clipping peak ~0.927; requested mono, browser negotiated 2 channels at 44.1 kHz; no PBB or MediaRecorder |
| Native `start()` without track | no | 0 | `no-speech` at ~8.10s; same WAV routing to the internally acquired microphone is unverified, so this is an inconclusive same-input control |
| PBB audio + supplied-track hook | yes, ~4.13s | 0 | One capture; exact microphone track; released on Stop |
| PBB video + supplied-track hook | yes, ~4.14s | 0 | One capture; exact microphone track; audio and video released on Stop |

Track-based runs emitted start/audiostart/soundstart/speechstart followed by
speechend/soundend/audioend/end on Stop, without any `result` events. Capture
and recognition are not being silently reported as successful transcription.
Diary Developer independently reported the same no-result outcome on Chrome
156 with recorded public English speech and standalone track controls in both
continuous and discrete modes (Syndicatum #14683).

## Reproduction

The generator uses only installed Windows TTS and disposable text. It does not
record a person. Microsoft David Desktop is required; a different voice/build
may produce a different hash, so the harness records SHA-256 and byte count.

```powershell
./scripts/make.media.speech.fixture.ps1 -OutputPath output/playwright/media-speech/commands.wav
$env:SPEECH_TEST_WAV = (Resolve-Path output/playwright/media-speech/commands.wav).Path
# Set PLAYWRIGHT_MODULE to an existing playwright/index.mjs if not installed locally.
node scripts/diagnose.media.speech.mjs --setup
node scripts/diagnose.media.speech.mjs
node scripts/diagnose.media.speech.mjs --clean-only
```

`SPEECH_TEST_ORIGIN` optionally selects the Diary test origin.
`SPEECH_TEST_OUTPUT` selects the output directory; `SPEECH_TEST_PROFILE` selects
an isolated test profile. Do not use a personal browser profile. Do not run two
processes against the same profile concurrently. Setup can require another
bounded attempt while Chrome finishes its component download. The setup phase
removes Playwright's `--disable-component-update` and
`--disable-background-networking` defaults; retaining them stalled model setup
in this environment. No speech is transmitted to a recognition service.

The diagnostic uses fake devices and a file-backed microphone. The offline
phase starts Chrome with an unreachable external proxy, bypasses only the test
host to load the page, verifies an external HTTPS probe fails, and then sets
the loaded browser context offline and checks `navigator.onLine === false`.
The native speech process is constrained by the proxy even when browser page
network instrumentation would not see its requests. Only the online setup phase
permits the model download. The local test origin remains permitted during page
initialization, as allowed by the task's offline test definition.

The harness writes actual events and signal/capture evidence to JSON; it does
not turn zero results into a passing speech test. `--clean-only` tests a
standalone track requesting mono with echo cancellation, automatic gain control, and noise
suppression disabled. It avoids attributing a shared preprocessing issue to the
PBB hook. No external recognition fallback is used.

## Proposed browser-local alternative for testing

Propose a separate Diary experiment using pinned Transformers.js 3.8.1 with a
quantized English Whisper model, initially `Xenova/whisper-tiny.en`, in a Web
Worker with the WASM backend. This is a proposed experiment, not an implemented
or verified fallback. The upstream library supports browser-side ASR and local
model/WASM paths; it does not depend on Chrome's native recognition service.
See [the upstream pipeline documentation](https://huggingface.co/docs/transformers.js/v3.8.1/pipelines)
and [local asset configuration](https://huggingface.co/docs/transformers.js/v3.8.1/custom_usage).

Suggested bounded test:

1. Vendor a pinned library, compatible WASM runtime, model/tokenizer/config
   assets and hashes. Serve/cache all of them locally during explicit setup;
   set `env.allowRemoteModels=false`, `env.localModelPath` and local
   `env.backends.onnx.wasm.wasmPaths`. Ready must mean every required asset and
   a disposable fixture inference succeeded. Record download size and licenses.
2. First feed the same PCM fixture directly to the worker, fully offline. This
   separates decoding/model problems from microphone/capture problems. Then
   feed resampled mono PCM from the borrowed PBB track through an AudioWorklet.
   Do not request or clone another microphone; Helper retains track ownership.
3. Evaluate overlapping short windows (for example, 5 seconds with 1 second
   overlap), with one inference at a time and bounded buffering. Display
   provisional window text while recording, deduplicate overlapping words, and
   finalize the tail on normal Stop. Cancel/dispose invalidates queued results,
   disconnects the analysis nodes and releases worker/session resources.
4. Verify both audio and video under the same proxy/offline checks, with an
   actual nonempty text result before Stop and an editable saved final transcript.
   Measure first-text latency, speed relative to real time, memory, model size
   and correctness against known words. Keep recording available on failure;
   never fall back to remote recognition.

Windowed Whisper output is provisional batch transcription, not native
interim-result events. Its latency and CPU/memory cost are unmeasured here;
short-window overlap and text reconciliation require validation. It may be too
slow on some devices. Start with English; do not infer Filipino, Cebuano, or
mixed-language support from this experiment. Recognition and transcript UI
remain Diary-owned. Planner should choose this test direction before Diary
changes its engine; the Helper track contract needs no speculative expansion.
