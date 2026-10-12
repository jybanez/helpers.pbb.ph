import assert from 'node:assert/strict';
import {shapeFromPoints,shapeGeometry,recognizedShape,transformShape} from '../js/ui/ui.map.drawing.shapes.js';
for(const kind of ['circle','rectangle']){
 const built=shapeFromPoints(kind,[123.88,10.3],[123.9,10.32]);
 const feature={type:'Feature',id:0,properties:{helperShape:built.shape,helperStyle:{fill:{r:0,g:0,b:0,a:0}}},geometry:built.geometry};
 assert.equal(recognizedShape(feature).kind,kind);
 assert.deepEqual(recognizedShape(structuredClone(feature)),built.shape);
 const moved=transformShape(feature,null,undefined,[.01,.02]);assert.deepEqual(moved.geometry,shapeGeometry(moved.shape));
 if(kind==='circle')assert.equal(moved.shape.radiusMeters,built.shape.radiusMeters);
 const before=JSON.stringify(feature);assert.throws(()=>transformShape(feature,null,undefined,[180,0]));assert.equal(JSON.stringify(feature),before);
 const mismatch=structuredClone(feature);mismatch.geometry.coordinates[0][1][0]+=.001;assert.equal(recognizedShape(mismatch),null);
 assert.throws(()=>shapeFromPoints(kind,[1,1],[1,1]));
}
assert.throws(()=>shapeFromPoints('circle',[179.9,0],[179,0]));
assert.throws(()=>shapeFromPoints('circle',[0,85],[0,84]));
assert.throws(()=>shapeFromPoints('rectangle',[179,0],[-179,1]));
assert.throws(()=>shapeGeometry({kind:'circle',center:[0,0],radiusMeters:Infinity}));
assert.throws(()=>shapeGeometry({kind:'rectangle',bounds:[[0,0],[0,1]]}));
console.log('Geographic shape contract passed.');
