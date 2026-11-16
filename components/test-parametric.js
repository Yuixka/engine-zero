'use strict';
const assert=require('node:assert/strict');
const C=require('./parametric.js'),G=require('../graph-engine.js'),D=require('../discovery.js');
const graph=G.fromLegacyFourbar(D.BEST_LEGACY);
const parts=C.bindGraph(graph);
assert.equal(parts.parts.length,3);
for(const body of graph.bodies.filter(b=>b.id!=='g')){
  const part=parts.parts.find(p=>p.bodyId===body.id);
  assert(part);
  const joints=graph.joints.filter(j=>j.a===body.id||j.b===body.id);
  assert.equal(part.holes.length,joints.length);
  for(const j of joints){
    const h=part.holes.find(h=>h.jointId===j.id);
    assert.deepEqual(h.xyMm,j.a===body.id?j.pa:j.pb,'graph anchor mismatch');
  }
  assert(C.toSVG(part).includes('<svg'));
  assert.equal(part.material,null);
  assert.equal(part.verified,false);
}
assert.deepEqual(C.bindGraph(graph),C.bindGraph(graph),'determinism');
assert.throws(()=>C.settings({widthMm:12,holeDiameterMm:11,edgeMarginMm:2}),RangeError);
assert.throws(()=>C.settings({widthMm:-2}),RangeError);
assert.throws(()=>C.component('X',[{jointId:'a',xyMm:[0,0]},{jointId:'b',xyMm:[2,0]}],C.settings()),RangeError);
const slider=G.sliderCrank({crank:25,rod:95,offset:4,point:65,normal:25,rotation:.22,phase:.55});
assert.throws(()=>C.bindGraph(slider),/Unsupported prismatic/);
const corrupt=G.fromLegacyFourbar(D.BEST_LEGACY);corrupt.joints[1].pb=[Infinity,0];
assert.throws(()=>C.bindGraph(corrupt),TypeError);
console.log('Parametric CAD connector mapping: PASS (3 bodies, exact graph holes, SVG, error rejection)');
