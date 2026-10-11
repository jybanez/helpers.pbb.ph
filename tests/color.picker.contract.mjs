import assert from "node:assert/strict";
import { parseColor, colorToHex, colorToRgba } from "../js/ui/ui.color.picker.js";
import { DEFAULT_COMPONENT_REGISTRY, createUiLoader } from "../js/ui/ui.loader.js";

for (const [input, output] of [
  ["#abc", { r: 170, g: 187, b: 204, a: 1 }],
  ["#ABCD", { r: 170, g: 187, b: 204, a: 221 / 255 }],
  ["#0011ff00", { r: 0, g: 17, b: 255, a: 0 }],
  [" rgb(0, 17, 255) ", { r: 0, g: 17, b: 255, a: 1 }],
  ["rgba(0,17,255,.123456789)", { r: 0, g: 17, b: 255, a: .123456789 }],
  [{ r: 0, g: 17, b: 255 }, { r: 0, g: 17, b: 255, a: 1 }],
]) assert.deepEqual(parseColor(input), output);
for (let byte = 0; byte < 256; byte++) {
  const value = { r: byte, g: 255 - byte, b: 17, a: byte / 255 };
  assert.deepEqual(parseColor(colorToHex(value)), value);
  assert.deepEqual(parseColor(colorToRgba(value)), value);
}
assert.equal(colorToHex({ r: 0, g: 255, b: 17, a: .5 }), "#00ff1180");
assert.equal(colorToHex({ r: 0, g: 255, b: 17, a: .5 }, false), "#00ff11");
const invalid = [null, undefined, "", "red", "#12", "#12345", "#1234567", "#123456789", "#gggggg", "rgb(256,0,0)", "rgb(-1,0,0)", "rgb(1.5,0,0)", "rgb(0,0,0,1)", "rgba(0,0,0)", "rgba(0,0,0,1.1)", "rgba(0,0,0,-.1)", "rgb(0%,0%,0%)", "hsl(0,0%,0%)", [], {}, { r: "1", g: 0, b: 0 }, { r: 1, g: 0, b: 0, a: null }, { r: 1, g: 0, b: 0, a: NaN }, { r: Infinity, g: 0, b: 0 }, { r: 1, g: 0, b: 0, a: 2 }];
for (const input of invalid) assert.throws(() => parseColor(input), TypeError);
const entry = DEFAULT_COMPONENT_REGISTRY["ui.color.picker"];
assert.equal(entry.export, "createColorPicker");
assert.ok(DEFAULT_COMPONENT_REGISTRY["ui.form.modal"].deps.includes("ui.color.picker"));
for (const preferBundles of [false, true]) {
  const loader = createUiLoader(DEFAULT_COMPONENT_REGISTRY, { preferBundles });
  assert.equal(typeof await loader.get("ui.color.picker", { css: false }), "function");
}
console.log(`PASS color conversions: all 256 alpha-byte boundaries, ${invalid.length} invalid formats, registry/source/bundle factories.`);
