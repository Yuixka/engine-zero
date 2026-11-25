'use strict';
// Diagnostic only: linear endpoint interpolation is NOT true articulated motion.
const {segmentDistance}=require('./planar-interference.js');
const validPoint=p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite);
function check(c){
  if(!c||!validPoint(c.a)||!validPoint(c.b)||!Number.isFinite(c.r)||c.r<0)
    throw new TypeError('Expected capsule with finite endpoints and nonnegative radius');
}
function interpolate(x,y,t){
  check(x);check(y);
  return {a:x.a.map((v,i)=>v+(y.a[i]-v)*t),
    b:x.b.map((v,i)=>v+(y.b[i]-v)*t),r:x.r+(y.r-x.r)*t};
}
function gap(a,b){
  check(a);check(b);
  return segmentDistance(a.a,a.b,b.a,b.b)-a.r-b.r;
}
function sampleBetweenFrames(a0,a1,b0,b1,{subdivisions=16,marginMm=0}={}){
  [a0,a1,b0,b1].forEach(check);
  if(!Number.isSafeInteger(subdivisions)||subdivisions<2||subdivisions>4096)
    throw new RangeError('subdivisions must be integer 2..4096');
  if(!Number.isFinite(marginMm)||marginMm<0)throw new RangeError('invalid margin');
  const samples=[];
  for(let i=0;i<=subdivisions;i++){
    const t=i/subdivisions;
    samples.push({t,gapMm:gap(interpolate(a0,a1,t),interpolate(b0,b1,t))});
  }
  const endpointsClear=samples[0].gapMm>marginMm&&samples[samples.length-1].gapMm>marginMm;
  const intermediate=samples.slice(1,-1).filter(s=>s.gapMm<=marginMm);
  return {schema:'engine-zero/interpolated-between-frame-risk-0.1',
    endpointsClear,missedByEndpointSampling:endpointsClear&&intermediate.length>0,
    firstIntermediateRisk:intermediate[0]??null,
    minimumSampledGapMm:Math.min(...samples.map(s=>s.gapMm)),
    samplesChecked:samples.length,subdivisions,marginMm,
    limitations:['Straight-line interpolation of capsule endpoints is not a mechanism kinematic trajectory',
      'Discrete intermediate samples can miss collisions between samples',
      'Projected 2D overlap may be harmless across separate axial layers',
      'No continuous collision guarantee, dynamic force, manufacturing tolerance or 3D certification']};
}
module.exports={interpolate,gap,sampleBetweenFrames};
