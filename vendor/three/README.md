Three.js 0.187.0 (MIT), bundled locally with GLTFLoader and OrbitControls. Source: https://github.com/mrdoob/three.js/tree/r187
Rebuild: node scripts/build.glb.runtime.mjs after npm ci.
Draco glTF WASM/wrapper from the pinned Three r187 package (Apache-2.0). Source: https://github.com/google/draco . The build lowers only the WASM memory maximum to 128 MiB; source hash and memory section are verified before patching. Decoder assets are lazy, same-origin, and local; no CDN or remote rendering service. See draco-r187/LICENSE.txt.
