'use strict';
// Sample-density convergence screen, NOT continuous-time collision certification.
const G=require('../graph-engine.js');
const {screenPlanarInterference}=require('./planar-interference.js');
const LEVELS=Object.freeze([36,72,144,288]);
function compareTraces(graph,traces,{componentOptions={},marginMm=0}={}){
  if(!Array.isArray(traces)||traces.length<2)throw new RangeError('At least two traces required');
  const counts=traces.map(t=>t?.frames?.length);
  if(counts.some(n=>!Number.isSafeInteger(n)||n<1)||new Set(counts).size!==counts.length||
      counts.some((n,i)=>i&&n<=counts[i-1]))throw new RangeError('Strictly increasing phase counts required');
  const rows=traces.map((trace,i)=>{
    if(trace.ok!==true)return {samples:counts[i],valid:false,reason:trace.reason||'motion failed',
      minimumPlanarGapMm:null,overlapCount:null,checkedNonadjacentPairs:null};
    const risk=screenPlanarInterference(graph,trace,{componentOptions,marginMm});
    const min=risk.pairs.length?Math.min(...risk.pairs.map(p=>p.minimumPlanarGapMm)):null;
    return {samples:counts[i],valid:true,reason:null,minimumPlanarGapMm:min,
      overlapCount:risk.overlapCount,checkedNonadjacentPairs:risk.checkedNonadjacentPairs};
  });
  const first=rows[0],last=rows.at(-1);
  const finerDetectedOverlap=first.valid&&last.valid&&first.overlapCount===0&&last.overlapCount>0;
  const finerDetectedFailure=first.valid&&rows.slice(1).some(r=>!r.valid);
  const maxGapChangeMm=rows.every(r=>r.valid&&r.minimumPlanarGapMm!==null)?
    Math.max(...rows.slice(1).map(r=>Math.abs(r.minimumPlanarGapMm-first.minimumPlanarGapMm))):null;
  return {schema:'engine-zero/phase-clearance-convergence-0.1',units:'mm',rows,
    finerDetectedOverlap,finerDetectedFailure,maxGapChangeMm,
    converged:false,certifiedCollisionFree:false,
    limitations:['Discrete phase samples only; even 288 points cannot prove no between-frame collision',
      'Nominal 2D projected geometry only; no axial layer or 3D collision oracle',
      'Adjacent bodies and ground are excluded by underlying screen',
      'No material, tolerances, loads, continuous-time bounds or physical validation']};
}
function auditGraph(graph,{levels=LEVELS,componentOptions={},marginMm=0}={}){
  if(!Array.isArray(levels)||levels.length<2||levels.length>8||
      levels.some(n=>!Number.isSafeInteger(n)||n<4||n>2048)||
      levels.some((n,i)=>i&&n<=levels[i-1]))throw new RangeError('Invalid ordered phase levels');
  const traces=levels.map(n=>G.motion(G.restoreGraph(G.stripGraph(graph)),n));
  // A failed trace has no frames. Keep its requested phase count explicit.
  const rows=levels.map((samples,i)=>{
    const t=traces[i];
    if(!t.ok)return {samples,valid:false,reason:t.reason||'motion failed',
      minimumPlanarGapMm:null,overlapCount:null,checkedNonadjacentPairs:null};
    const risk=screenPlanarInterference(graph,t,{componentOptions,marginMm});
    return {samples,valid:true,reason:null,
      minimumPlanarGapMm:risk.pairs.length?Math.min(...risk.pairs.map(p=>p.minimumPlanarGapMm)):null,
      overlapCount:risk.overlapCount,checkedNonadjacentPairs:risk.checkedNonadjacentPairs};
  });
  const first=rows[0],last=rows.at(-1);
  return {schema:'engine-zero/phase-clearance-convergence-0.1',units:'mm',rows,
    finerDetectedOverlap:first.valid&&last.valid&&first.overlapCount===0&&last.overlapCount>0,
    finerDetectedFailure:first.valid&&rows.slice(1).some(r=>!r.valid),
    maxGapChangeMm:rows.every(r=>r.valid&&r.minimumPlanarGapMm!==null)?
      Math.max(...rows.slice(1).map(r=>Math.abs(r.minimumPlanarGapMm-first.minimumPlanarGapMm))):null,
    converged:false,certifiedCollisionFree:false,
    limitations:['Sampled 2D planar projection; cannot certify between-frame or 3D clearance',
      'Adjacent bodies and ground excluded','No forces, materials or tolerances']};
}
module.exports={LEVELS,compareTraces,auditGraph};
