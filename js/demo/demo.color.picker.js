const bundled = new URLSearchParams(location.search).has("bundle");
const { uiLoader } = await import(bundled ? "../../dist/helpers.ui.bundle.min.js?v=0.21.291" : "../ui/ui.loader.js?v=0.21.291");
const [create, createForm] = await Promise.all([uiLoader.get("ui.color.picker"), uiLoader.get("ui.form.modal")]);
const log = document.getElementById("log");
const picker = create(document.getElementById("primary"), {
  label: "Color", value: "#3399ff80",
  onInput: payload => { log.textContent = `Input: ${payload.rgba}`; },
  onChange: payload => { log.textContent = `Changed: ${payload.rgba} / ${payload.hex}`; },
});
for (const [id, option] of [["alpha", "showAlpha"], ["rgba", "showRgba"], ["hex", "showHex"], ["disabled", "disabled"], ["busy", "busy"]]) {
  document.getElementById(id).addEventListener("change", event => picker.update({ [option]: event.target.checked }));
}
document.getElementById("update").onclick = () => { picker.setValue({ r: 51, g: 153, b: 255, a: .35 }, { emit: true }); };
document.getElementById("invalid").onclick = () => {
  try { picker.update({ value: "rgba(999, 0, 0, 1)", showAlpha: false }); }
  catch (error) { log.textContent = `${error.message} Current value retained: ${picker.getRgba()}`; }
};
document.getElementById("theme").onclick = event => {
  const light = document.documentElement.dataset.theme !== "light";
  document.documentElement.dataset.theme = light ? "light" : "dark";
  event.target.textContent = `Switch to ${light ? "dark" : "light"} theme`;
};
const combinations = [];
for (let mask = 0; mask < 8; mask++) {
  const section = document.createElement("section"), title = document.createElement("h3"), host = document.createElement("div");
  title.textContent = `Opacity ${mask & 4 ? "on" : "off"} · RGBA ${mask & 2 ? "on" : "off"} · HEX ${mask & 1 ? "on" : "off"}`;
  section.append(title, host); document.getElementById("combinations").append(section);
  combinations.push(create(host, { value: "#ff804080", label: "Sample color", showAlpha: Boolean(mask & 4), showRgba: Boolean(mask & 2), showHex: Boolean(mask & 1) }));
}
let form = null;
document.getElementById("form").onclick = () => {
  if (form?.getState().open) return;
  form?.destroy();
  form = createForm({
    title: "Color settings", submitLabel: "Save color", columns: 1,
    rows: [[{ type: "ui.color.picker", name: "fill", label: "Fill color", value: picker.getValue(), help: "Choose an opacity above zero before saving." }]],
    validate: values => values.fill.a === 0 ? { fill: "Fill color — choose opacity above zero." } : {},
    onSubmit(values) { picker.setValue(values.fill, { emit: true }); return true; },
  });
  form.open();
};
const mode = document.getElementById("mode"); mode.href = bundled ? "?" : "?bundle"; mode.textContent = bundled ? "Use modular source" : "Use bundle";
window.__colorDemo = { picker, combinations, create, createForm, get form() { return form; }, bundled };
window.__colorReady = true;
