import { uiLoader } from '../ui/ui.loader.js?v=0.21.313';
if (new URLSearchParams(location.search).has('bundle')) uiLoader.setPreferBundles(true);
const [createRuler, createControls] = await Promise.all([uiLoader.get('ui.map.ruler'), uiLoader.get('ui.map.controls')]);
const style = () => ({ version: 8, sources: {}, layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#20344a' } }] });
const map = new maplibregl.Map({ container: 'map', attributionControl: false, center: [123.8854, 10.3157], zoom: 12, style: style() });
let ruler, deny = false;
const controls = createControls(document.querySelector('#controls'), { map, controls: ['layers', 'ruler'], actions: [{ id: 'ruler', label: 'Measure straight-line distance', icon: 'map.ruler', pressed: false, onActivate: () => ruler.getState().active ? ruler.deactivate() : ruler.activate() }] });
function create() {
  ruler = createRuler(document.querySelector('#result'), { map,
    beforeActivate: () => { const allowed = !deny; deny = false; return allowed; },
    onStateChange: state => {
      controls.setActionState('ruler', { pressed: state.active, disabled: state.pending || state.destroyed });
      document.querySelector('#status').textContent = state.destroyed ? 'Ruler destroyed.' : state.pending ? 'Waiting for input ownership…' : state.active ? `${state.phase}: ${state.result?.text || 'Choose two points'}` : 'Ready. Select the ruler below Layers.';
    } });
  controls.setActionState('ruler', { disabled: false, pressed: false });
  window.__rulerDemo = { map, ruler, controls, createRuler };
}
create();
document.querySelector('#tilt').onclick = () => map.easeTo({ pitch: map.getPitch() ? 0 : 50, bearing: 31 });
document.querySelector('#style').onclick = () => map.setStyle(style(), { diff: false });
document.querySelector('#guard').onclick = () => { ruler.deactivate(); deny = true; document.querySelector('#status').textContent = 'Next activation will be denied by the input guard.'; };
document.querySelector('#destroy').onclick = () => ruler.destroy();
document.querySelector('#recreate').onclick = () => { ruler.destroy(); create(); };
window.addEventListener('pagehide', () => { ruler.destroy(); controls.destroy(); map.remove(); }, { once: true });
document.querySelector('#status').textContent = 'Ready. Select the ruler below Layers.';
