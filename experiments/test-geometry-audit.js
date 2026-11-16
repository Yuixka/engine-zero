'use strict';
const assert=require('node:assert/strict');
const G=require('../graph-engine.js');
const D=require('../discovery.js');
const K=require('../legacy-fourbar.js');
const {verifyFrame,verifyMotion}=require('./geometry-audit.js');
const four=G.fromLegacyFourbar(D.BEST_LEGACY);
const slider=G.sliderCrank({crank:30,rod:95,offset:4,point:40,normal:12,rotation:.2,phase:.1});
for(const g of [four,slider]){
  const trace=G.motion(g,48);
  assert(trace.ok,trace.reason);
  const audit=verifyMotion(g,trace);
  assert(audit.valid,JSON.stringify(audit));
  assert(audit.maxPositionMm<.01);
  const bad=structuredClone(trace);
  bad.frames[12].input[0]+=1.5;
  assert(!verifyMotion(g,bad).valid,'perturbed body pose must fail independent closure audit');
  const wrongOutput=structuredClone(trace);
  wrongOutput.points[7].x+=2;
  assert(!verifyMotion(g,wrongOutput).valid,'output mismatch must be detected');
  const wrongDriver=structuredClone(trace);
  wrongDriver.frames[4].input[2]+=.05;
  assert(!verifyMotion(g,wrongDriver).valid,'driver angle mismatch must be detected');
}
assert.throws(()=>verifyFrame(four,{input:[NaN,0,0]},0),/Invalid pose|Invalid audit inputs/);
assert.equal(verifyMotion(four,{ok:false}).valid,false);
console.log('Independent R/P geometry, driver, output and perturbation audit: PASS');
