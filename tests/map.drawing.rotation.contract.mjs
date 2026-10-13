import assert from 'node:assert/strict';
import {shapeFromPoints, recognizedShape, shapeGeometry, transformShape, rotateObject, objectPivot, shapeProject} from '../js/ui/ui.map.drawing.shapes.js';
const close=(a,b)=>a.forEach((n,i)=>assert.ok(Math.abs(n-b[i])<1e-10));
const built=shapeFromPoints('rectangle',[123.88,10.30],[123.9,10.32]);
const rectangle={type:'Feature',id:0,properties:{helperShape:built.shape,nested:{retained:true}},geometry:built.geometry};
const original=structuredClone(rectangle), pivot=objectPivot(rectangle);
assert.deepEqual(rotateObject(rectangle,0),rectangle);
assert.deepEqual(rotateObject(rectangle,2*Math.PI),rectangle);
const rotated=rotateObject(rectangle,Math.PI/3);
assert.deepEqual(rectangle,original); assert.equal(rotated.id,0);
assert.deepEqual(rotated.properties.nested,original.properties.nested);
assert.equal(recognizedShape(rotated).projection,'mercator'); close(objectPivot(rotated),pivot);
assert.deepEqual(rotated.geometry,shapeGeometry(recognizedShape(rotated)));
const moved=transformShape(rotated,null,undefined,[.01,.01]);
assert.deepEqual(moved.geometry,shapeGeometry(moved.shape));
assert.equal(moved.shape.angleDegrees,rotated.properties.helperShape.angleDegrees);
const opposite=rotated.geometry.coordinates[0][2];
const nextCorner=rotated.geometry.coordinates[0][0].map((n,i)=>n+(n-opposite[i])*.2);
const resized=transformShape(rotated,nextCorner,[0,0]);
close(resized.geometry.coordinates[0][2],opposite);
assert.equal(resized.shape.angleDegrees,rotated.properties.helperShape.angleDegrees);
assert.ok(resized.shape.width>rotated.properties.helperShape.width);
assert.throws(()=>transformShape(rotated,opposite,[0,0]));
const area={type:'Feature',id:'holes',properties:{foreign:'retain'},geometry:{type:'Polygon',coordinates:[[[1,1],[3,1],[3,3],[1,3],[1,1]],[[1.5,1.5],[1.5,2],[2,2],[2,1.5],[1.5,1.5]]]}};
const turned=rotateObject(area,.7), center=objectPivot(area);
assert.equal(turned.geometry.coordinates.length,2);
for(let r=0;r<2;r++){
 assert.deepEqual(turned.geometry.coordinates[r][0],turned.geometry.coordinates[r].at(-1));
 for(let i=0;i<area.geometry.coordinates[r].length;i++){
  const a=shapeProject(area.geometry.coordinates[r][i]),b=shapeProject(turned.geometry.coordinates[r][i]);
  assert.ok(Math.abs(Math.hypot(a[0]-center[0],a[1]-center[1])-Math.hypot(b[0]-center[0],b[1]-center[1]))<1e-12);
 }
}
assert.deepEqual(turned.properties,area.properties);
assert.throws(()=>rotateObject({...area,geometry:{type:'Point',coordinates:[1,1]}},.2));
const circle=shapeFromPoints('circle',[1,1],[1.01,1]);
assert.throws(()=>rotateObject({...area,properties:{helperShape:circle.shape},geometry:circle.geometry},.2));
assert.throws(()=>rotateObject({...area,geometry:{type:'LineString',coordinates:[[179,0],[-179,1]]}},.2));
assert.throws(()=>rotateObject({...area,geometry:{type:'LineString',coordinates:[[179,0],[180,10]]}},Math.PI/2));
console.log('Object rotation and oriented rectangle contracts passed.');
