import {GLB_DRACO_WORK_LIMITS} from './ui.glb.policy.js';
// Built separately; this dependency is never included in the main UI bundle.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createWireframeMode } from './ui.glb.wireframe.js';
import { sanitizeNodePivots } from './ui.glb.metadata.js';
import {createBoundedDraco} from './ui.glb.draco.js';
import {validateGlb,dracoManifest} from './ui.glb.data.js';

export async function mountGlb(host, bytes, signal) {
  let renderer, controls, observer, model, wireframe, draco, disposed = false;
  const resources = new Set(), bitmaps = new Set(), released = new WeakSet();
  const release = value => {
    if (!value || typeof value !== 'object' || released.has(value)) return;
    released.add(value);
    if (Array.isArray(value)) { value.forEach(release); return; }
    if (value.isObject3D) { value.traverse(node=>{release(node.geometry);release(node.material);node.skeleton?.dispose();});return; }
    if (value.isMaterial) for (const item of Object.values(value)) if (item?.isTexture) release(item);
    if (value.isTexture && value.source?.data?.close && !bitmaps.has(value.source.data)) { bitmaps.add(value.source.data); value.source.data.close(); }
    if (value.isMaterial || value.isTexture || value.isBufferGeometry) value.dispose();
  };
  const track = value => { if (value && typeof value === 'object') { resources.add(value); if (disposed) release(value); } return value; };
  function dispose() {
    if (disposed) return; disposed = true;
    signal.removeEventListener('abort',dispose); observer?.disconnect(); controls?.dispose();
    draco?.dispose();
    model?.traverse(node => { if (node.geometry) resources.add(node.geometry); if (node.material) resources.add(node.material); node.skeleton?.dispose(); });
    wireframe?.dispose();
    resources.forEach(release); resources.clear();
    renderer?.dispose(); renderer?.forceContextLoss(); renderer?.domElement.remove();
  }
  signal.addEventListener('abort',dispose,{once:true});
  try {
    if (signal.aborted) throw new DOMException('Cancelled','AbortError');
    const definitions=dracoManifest(validateGlb(bytes));
    const manager = new THREE.LoadingManager();
    // Preflight allows bufferView textures only. GLTFLoader creates blob URLs for those.
    manager.setURLModifier(url => { if (!url.startsWith('blob:')) throw new Error('Model resource request blocked. Embed all textures and buffers.'); return url; });
    const loader = new GLTFLoader(manager);
    if (definitions.size) {draco=createBoundedDraco(signal,track);loader.setDRACOLoader(draco);}
    loader.register(parser => {
      sanitizeNodePivots(parser.json);
      const original = parser.getDependency.bind(parser);
      parser.getDependency = (type,index) => original(type,index).then(value => {
        if(type==='texture' && !value)throw new Error('Embedded texture could not be decoded. Export valid PNG, JPEG or static WebP textures.');
        if (type==='bufferView' && definitions.has(index)) draco.bind(value,definitions.get(index));
        return ['material','texture','mesh','scene'].includes(type) ? track(value) : value;
      });
      return {name:'HELPER_resource_lifecycle'};
    });
    const gltf = await loader.parseAsync(bytes,'');
    draco?.dispose();
    model = gltf.scene;
    wireframe=createWireframeMode(model);
    // Include resources in every scene, even when only the default scene is shown.
    for (const scene of gltf.scenes) scene.traverse(node => { if (node.geometry) track(node.geometry); if (node.material) track(node.material); });
    if (signal.aborted || disposed) { model.traverse(node=>node.skeleton?.dispose()); throw new DOMException('Cancelled','AbortError'); }
    if (definitions.size) {
      let calls=0,triangles=0,bytes=0;const buffers=new Set();
      for(const scene of gltf.scenes)scene.traverse(node=>{
        if(!node.isMesh)return;
        const materials=Array.isArray(node.material)?node.material:[node.material];
        const passes=materials.some(m=>m.transparent&&m.side===THREE.DoubleSide&&!m.forceSinglePass)?2:1;
        calls+=passes*Math.max(1,node.geometry.groups.length);triangles+=passes*(node.geometry.index?.count??node.geometry.attributes.position?.count??0)/3;
        for(const a of [node.geometry.index,...Object.values(node.geometry.attributes)])if(a){const b=(a.array??a.data.array).buffer;if(!buffers.has(b)){buffers.add(b);bytes+=b.byteLength;}}
      });
      if(calls>GLB_DRACO_WORK_LIMITS.draws||triangles>GLB_DRACO_WORK_LIMITS.triangles||bytes>128*1024*1024)throw new Error('Decoded Draco scene exceeds the geometry or render-work preview budget. Export a smaller scene.');
    }
    const bounds = new THREE.Box3().setFromObject(model), sphere = bounds.getBoundingSphere(new THREE.Sphere());
    if (bounds.isEmpty() || !Number.isFinite(sphere.radius) || sphere.radius <= 0) throw new Error('No visible model geometry. Export a scene containing meshes.');
    const scene = new THREE.Scene(); scene.background = new THREE.Color(0x182130); scene.add(model);
    scene.add(new THREE.HemisphereLight(0xffffff,0x718096,2));
    const light = new THREE.DirectionalLight(0xffffff,3); light.position.set(3,5,4); scene.add(light);
    const camera = new THREE.PerspectiveCamera(45,1,0.01,10000);
    renderer = new THREE.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:true});
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1,2)); renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.tabIndex = 0; renderer.domElement.setAttribute('aria-label','3D model. Arrow keys orbit; Shift and arrows pan; plus and minus zoom; Home resets.');
    host.append(renderer.domElement); controls = new OrbitControls(camera,renderer.domElement);
    const render = () => { if (!disposed) renderer.render(scene,camera); };
    controls.addEventListener('change',render);
    function fit(reset = false) {
      const direction = reset ? new THREE.Vector3(1,0.7,1).normalize() : camera.position.clone().sub(controls.target).normalize();
      if (!direction.lengthSq()) direction.set(1,0.7,1).normalize();
      const angle = Math.min(camera.fov * Math.PI / 360, Math.atan(Math.tan(camera.fov * Math.PI / 360) * camera.aspect));
      const distance = sphere.radius / Math.sin(angle) * 1.15;
      controls.target.copy(sphere.center); camera.position.copy(sphere.center).addScaledVector(direction,distance);
      camera.near = Math.max(sphere.radius / 1000,0.000001); camera.far = distance + sphere.radius * 100;
      controls.minDistance = sphere.radius * 0.05; controls.maxDistance = sphere.radius * 50;
      camera.updateProjectionMatrix(); controls.update(); render();
    }
    function action(kind) {
      if (disposed) return;
      const offset = camera.position.clone().sub(controls.target);
      if (kind.startsWith('orbit')) { const spherical = new THREE.Spherical().setFromVector3(offset); spherical.theta += kind==='orbitLeft' ? -0.15 : kind==='orbitRight' ? 0.15 : 0; spherical.phi = THREE.MathUtils.clamp(spherical.phi + (kind==='orbitUp' ? -0.15 : kind==='orbitDown' ? 0.15 : 0),0.05,Math.PI-0.05); camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical)); }
      else if (kind.startsWith('pan')) { const delta = new THREE.Vector3(kind==='panLeft' ? -1 : kind==='panRight' ? 1 : 0,kind==='panUp' ? 1 : kind==='panDown' ? -1 : 0,0).applyQuaternion(camera.quaternion).multiplyScalar(offset.length()*0.06); camera.position.add(delta); controls.target.add(delta); }
      else if (kind==='zoomIn' || kind==='zoomOut') camera.position.copy(controls.target).add(offset.setLength(THREE.MathUtils.clamp(offset.length()*(kind==='zoomIn'?0.8:1.25),controls.minDistance,controls.maxDistance)));
      controls.update(); render();
    }
    renderer.domElement.addEventListener('keydown',event=>{
      const direction = {ArrowLeft:'Left',ArrowRight:'Right',ArrowUp:'Up',ArrowDown:'Down'}[event.key];
      if (direction) { event.preventDefault(); action(`${event.shiftKey?'pan':'orbit'}${direction}`); }
      else if (['+','=','-','Home'].includes(event.key)) { event.preventDefault(); if(event.key==='Home')fit(true);else action(event.key==='-'?'zoomOut':'zoomIn'); }
    });
    const resize = () => { if(disposed)return; const {width,height}=host.getBoundingClientRect(); renderer.setSize(Math.max(width,1),Math.max(height,1)); camera.aspect=Math.max(width,1)/Math.max(height,1);camera.updateProjectionMatrix();render(); };
    observer = new ResizeObserver(resize); observer.observe(host); resize(); fit(true);
    return {dispose,setWireframe:value=>{if(disposed)return false;wireframe.set(value);render();return wireframe.get();},fit:()=>fit(),reset:()=>fit(true),action, getState:()=>({wireframe:wireframe.get(),camera:camera.position.toArray(),target:controls.target.toArray(),meshes:renderer.info.render.calls})};
  } catch (error) { dispose(); throw error; }
}
