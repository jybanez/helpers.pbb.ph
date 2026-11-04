import assert from 'node:assert/strict';
import {sanitizeNodePivots} from '../js/ui/ui.glb.metadata.js';
for(const pivot of ['hinge near trunk',null,{},[1,2],['1',2,3],[1,2,3,4],[1,NaN,3],[1,Infinity,3]]) {
 const extras={pivot,description:'keep me'},json={nodes:[{extras,children:[1]},{mesh:0}]};
 sanitizeNodePivots(json);assert(!Object.hasOwn(json.nodes[0].extras,'pivot'));assert.equal(json.nodes[0].extras.description,'keep me');assert(Object.hasOwn(extras,'pivot'),'original extras object retained');
}
const pivot=[1,-2,0.5],extras={pivot},json={nodes:[{extras,children:[1]}]};sanitizeNodePivots(json);assert.equal(json.nodes[0].extras,extras);assert.equal(json.nodes[0].extras.pivot,pivot);
console.log('GLB pivot metadata: descriptive/malformed hints ignored, finite numeric vectors preserved.');
