import assert from 'node:assert/strict';
import {getPersonPlacement} from '../js/ui/ui.map.location.person.js';
import {createPersonMesh,createDirectionMesh} from '../js/ui/ui.map.location.person.renderer.js';
// Tilted camera whose homogeneous depth grows with north/south position.
const matrix=[1,0,0,0, 0,-.3,0,2, 0,1,0,0, 0,0,0,1];
const place=(y,worldScale=.1,heading=0)=>getPersonPlacement(matrix,{x:0,y,z:0},600,400,34,heading,{scaleMode:'perspective',worldScale,minSizePx:8,maxSizePx:64});
const near=place(0),far=place(1);
assert(near.projectedSizePx>far.projectedSizePx+5,'near grows while far shrinks at the same zoom/tilt');
assert(Math.abs(place(10).projectedSizePx-8)<1e-5,'far envelope reaches readable floor');
assert(Math.abs(place(0,1).projectedSizePx-64)<1e-5,'near envelope respects ceiling');
let previous=null;
for(let y=0;y<15;y+=.025){const value=place(y);assert(value.matrix.every(Number.isFinite));assert(value.projectedSizePx>=8-1e-5&&value.projectedSizePx<=64+1e-5);assert(Math.abs(place(y+1e-6).projectedSizePx-value.projectedSizePx)<.01,'continuous size through bound transitions');previous=value.projectedSizePx;}
for(const heading of [0,90,180,270,359]){const result=place(1,.1,heading);assert.deepEqual(Array.from(result.matrix.slice(12)),[0,-.3,0,3].map(Math.fround),'heading and size retain exact anchor');}
assert.equal(place(-1),null,'behind-camera placement is skipped');
const legacy=getPersonPlacement(matrix,{x:0,y:0,z:0},600,400,34);
assert.equal(legacy.scale,getPersonPlacement(matrix,{x:0,y:0,z:0},600,400,34,null,{scaleMode:'screen'}).scale,'default behavior unchanged');
console.log('Perspective placement contract passed: depth ordering, bounds/continuity, anchor, finite safety, legacy default.');

const personMesh=createPersonMesh(), directionMesh=createDirectionMesh();
for(const bearing of [0,31,85])for(const heading of [null,0,45,90]){
 const angle=bearing*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle),camera=[c,s,0,0,-s,c,0,0,0,0,1,0,0,0,0,1];
 const result=getPersonPlacement(camera,{x:0,y:0,z:0},600,400,34,heading,{scaleMode:'perspective',worldScale:.1,minSizePx:34,maxSizePx:34});
 let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
 for(const mesh of heading==null?[personMesh]:[personMesh,directionMesh])for(let i=0;i<mesh.length;i+=9){const m=result.matrix,x=mesh[i],y=mesh[i+1],z=mesh[i+2],w=m[3]*x+m[7]*y+m[11]*z+m[15],px=(m[0]*x+m[4]*y+m[8]*z+m[12])/w*300,py=(m[1]*x+m[5]*y+m[9]*z+m[13])/w*200;minX=Math.min(minX,px);maxX=Math.max(maxX,px);minY=Math.min(minY,py);maxY=Math.max(maxY,py);}
 assert(Math.abs(Math.max(maxX-minX,maxY-minY)-34)<.001,'fixed size targets independently projected raw mesh, not enclosing box');
}
const started=performance.now();for(let i=0;i<200;i++)place(i/100,.1,45);
console.log(`Exact mesh extent contract passed; 200 placement evaluations ${(performance.now()-started).toFixed(1)}ms (diagnostic, no machine-speed assertion).`);
