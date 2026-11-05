// EXPERIMENT ONLY: not imported by ui.loader, ui.glb.viewer or any release bundle.
const MiB=1024*1024;
export const LIMITS=Object.freeze({previewBytes:256*MiB,aggregateBytes:384*MiB,contexts:2,triangles:2_000_000,aggregateTriangles:2_000_000,draws:256,nodes:2048,depth:64,texturePixels:16_777_216,textureEdge:4096});
const integer=(v,min=0)=>{if(!Number.isSafeInteger(v)||v<min)throw Error('Invalid allocation input');return v;};
const add=(a,b)=>integer(a+integer(b));
export function estimateAllocation(buffer,validate){
 if(!(buffer instanceof ArrayBuffer)||buffer.byteLength>64*MiB||buffer.byteLength<20)throw Error('Invalid or oversized input');
 const view=new DataView(buffer);if(view.getUint32(0,true)!==0x46546c67||view.getUint32(4,true)!==2||view.getUint32(8,true)!==buffer.byteLength||view.getUint32(16,true)!==0x4e4f534a)throw Error('Invalid GLB container');
 const length=view.getUint32(12,true);if(length>4*MiB||length%4||20+length>buffer.byteLength)throw Error('Invalid JSON length');
 const json=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(new Uint8Array(buffer,20,length)));
 const list=key=>{const a=json[key]??[];if(!Array.isArray(a))throw Error('Invalid '+key);return a;};
 const nodes=list('nodes'),meshes=list('meshes'),accessors=list('accessors'),views=list('bufferViews'),images=list('images');
 if(nodes.length>LIMITS.nodes||meshes.length>LIMITS.nodes||accessors.length>16384||views.length>16384)throw Error('Structural budget exceeded');
 if(images.length>64||list('textures').length>128||list('materials').length>512)throw Error('Texture/material structural budget exceeded');
 const categories={inputParser:buffer.byteLength*3+length*8,viewCopies:0,accessorCopies:0,gpuAccessors:0,conversion:0,wireframe:0,textures:0,headroom:32*MiB};
 for(const v of views)categories.viewCopies=add(categories.viewCopies,integer(v.byteLength,1));
 const costs=accessors.map(a=>{
  const sizes={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16},widths={5120:1,5121:1,5122:2,5123:2,5125:4,5126:4};
  if(!Object.hasOwn(sizes,a.type)||!Object.hasOwn(widths,a.componentType))throw Error('Invalid accessor type');
  const stride=a.bufferView===undefined?0:integer(views[a.bufferView]?.byteStride??0);
  const bytes=integer(integer(a.count,1)*Math.max(stride,sizes[a.type]*Math.max(widths[a.componentType],4)));
  categories.gpuAccessors=add(categories.gpuAccessors,bytes);
  if(a.bufferView===undefined||a.sparse)categories.accessorCopies=add(categories.accessorCopies,bytes*2);
  return bytes;
 });
 const seen=new Set(),work=[];let primitiveCount=0;
 for(const mesh of meshes){let triangles=0,draws=0;if(!Array.isArray(mesh.primitives))throw Error('Invalid primitives');
  for(const p of mesh.primitives){
   if(++primitiveCount>2048)throw Error('Primitive structural budget exceeded');
   // Prototype deliberately fails closed for morph/skin/animation/non-triangle paths.
   if(p.targets?.length||(p.mode??4)!==4)throw Error('Prototype supports static triangle meshes only');
   const position=accessors[p.attributes?.POSITION];if(!position||position.type!=='VEC3')throw Error('Missing position accessor');
   const count=p.indices===undefined?position.count:accessors[p.indices]?.count;integer(count,1);if(count%3)throw Error('Incomplete triangle data');
   const tri=count/3;triangles=add(triangles,tri);draws++;
   const key=JSON.stringify(p);if(seen.has(key))continue;seen.add(key);
   for(const index of [...Object.values(p.attributes??{}),...(p.indices===undefined?[]:[p.indices])]){integer(index);if(costs[index]===undefined)throw Error('Invalid accessor reference');categories.conversion=add(categories.conversion,costs[index]*2);}
   categories.wireframe=add(categories.wireframe,tri*6*(position.count>=65535?4:2)*2);
  }work.push({triangles,draws});
 }
 if(list('skins').length||list('animations').length)throw Error('Prototype does not budget skins or animations yet');
 let triangles=0,draws=0,instances=0;
 const visit=(index,ancestors)=>{integer(index);if(!nodes[index]||ancestors.has(index))throw Error('Invalid/cyclic node reference');if(ancestors.size>=LIMITS.depth||++instances>LIMITS.nodes)throw Error('Node work budget exceeded');const n=nodes[index];if(n.mesh!==undefined){integer(n.mesh);const w=work[n.mesh];if(!w)throw Error('Invalid mesh reference');triangles=add(triangles,w.triangles);draws+=w.draws;if(triangles>LIMITS.triangles||draws>LIMITS.draws)throw Error('Render work budget exceeded');}const next=new Set(ancestors);next.add(index);for(const child of n.children??[])visit(child,next);};
 for(const s of list('scenes'))for(const node of s.nodes??[])visit(node,new Set());
 let pixels=0;const imageSizes=images.map(image=>{
  if(image.mimeType!=='image/png')throw Error('Prototype budgets embedded PNG only; other formats fail closed');
  const v=views[image.bufferView];if(!v||v.buffer!==0)throw Error('Invalid image view');
  // Bounds are checked here before reading a header, then by the full validator.
  const start=28+length+integer(v.byteOffset??0),size=integer(v.byteLength,33);
  if(start+size>buffer.byteLength)throw Error('Invalid image range');
  const p=new DataView(buffer,start,size);if(p.getUint32(0)!==0x89504e47||p.getUint32(4)!==0x0d0a1a0a||p.getUint32(8)!==13||p.getUint32(12)!==0x49484452)throw Error('Invalid PNG header');
  if(p.getUint8(24)!==8)throw Error('Prototype budgets 8-bit PNG only');
  const width=integer(p.getUint32(16),1),height=integer(p.getUint32(20),1);if(width>LIMITS.textureEdge||height>LIMITS.textureEdge)throw Error('Texture dimension budget exceeded');
  const count=integer(width*height);pixels=add(pixels,count);if(pixels>LIMITS.texturePixels)throw Error('Decoded texture budget exceeded');
  categories.textures=add(categories.textures,count*4*2);return count*4;
 });
 for(const t of list('textures')){integer(t.source);if(imageSizes[t.source]===undefined)throw Error('Invalid texture source');categories.textures=add(categories.textures,Math.ceil(imageSizes[t.source]*4/3));}
 const bytes=Object.values(categories).reduce(add,0);if(bytes>LIMITS.previewBytes)throw Error('Preview allocation budget exceeded');
 // Inject the isolated original validator with only its obsolete accounting cap
 // lifted. This retains resource/container/range/sparse/extension validation.
 validate(buffer);
 return Object.freeze({bytes,triangles,draws,instances,pixels,categories:Object.freeze(categories)});
}
export function createBudgetPool(){
 let bytes=0,triangles=0,contexts=0;
 return {getState:()=>({bytes,triangles,contexts}),acquire(buffer,validate){
  const estimate=estimateAllocation(buffer,validate);
  if(bytes+estimate.bytes>LIMITS.aggregateBytes||triangles+estimate.triangles>LIMITS.aggregateTriangles||contexts+1>LIMITS.contexts)throw Error('Aggregate preview budget exceeded; close another preview and retry');
  bytes+=estimate.bytes;triangles+=estimate.triangles;contexts++;let released=false;
  return {estimate,release(){if(released)return;released=true;bytes-=estimate.bytes;triangles-=estimate.triangles;contexts--;}};
 }};
}

export const prototypePool=createBudgetPool();
