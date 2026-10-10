import assert from 'node:assert/strict';
import {getPersonPlacement} from '../js/ui/ui.map.location.person.js';
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
